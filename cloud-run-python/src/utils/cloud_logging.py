import json
import logging
import re
from contextvars import ContextVar
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from src.settings import settings


class CloudLogginFormatter(logging.Formatter):
    """
    Custom logging formatter for Google Cloud Logging.
    """

    severity_map = {
        logging.DEBUG: "DEBUG",  # Debug or trace information.
        logging.INFO: "INFO",  # Routine information, such as ongoing status or performance.
        logging.WARNING: "WARNING",  # Warning events might cause problems.
        logging.ERROR: "ERROR",  # Error events are likely to cause problems.
        logging.CRITICAL: "CRITICAL",  # Critical events cause more severe problems or outages.
    }

    def __init__(self, fmt: str = ""):
        logging.Formatter.__init__(self, fmt)

    def format(self, record: logging.LogRecord) -> str:
        logging.Formatter.format(self, record)
        return json.dumps(self.parse_record(record))

    def parse_record(self, record: logging.LogRecord) -> dict[str, Any]:
        """
        Parse the log record into a dictionary object containing structured log data for Cloud Logging.

        Args:
            record (logging.LogRecord): The log record to parse.
        Returns:
            dict[str, Any]: The structured
        """
        log = {
            "severity": self.severity_map[record.levelno],
            "message": record.message,
        }

        project = settings.PROJECT
        trace_ctx = trace_context.get()
        if trace_ctx:
            inferred_trace = trace_ctx.get("trace_id", None)
            if inferred_trace is not None and project is not None:
                # NOTE: Add full path for detected trace
                log["logging.googleapis.com/trace"] = (
                    f"projects/{project}/traces/{inferred_trace}"
                )

            inferred_span = trace_ctx.get("span_id", None)
            if inferred_span is not None:
                log["logging.googleapis.com/spanId"] = inferred_span

            inferred_sampled = trace_ctx.get("trace_sampled", None)
            if inferred_sampled is not None:
                log["logging.googleapis.com/trace_sampled"] = inferred_sampled

        labels = getattr(record, "labels", None)
        if labels is not None:
            log["logging.googleapis.com/labels"] = json.dumps(
                labels, ensure_ascii=False
            )

        return log


def get_logging_config() -> dict[str, Any]:
    """
    Defines the main logging configuration and overwrites unicorns default
    logging configuration.
    Application logs should be written using the he "app" logger.

    Returns:
        dict[str, Any]:
            The logging configuration
    """
    return {
        "version": 1,
        "disable_existing_loggers": True,
        "formatters": {
            "default": {
                "()": "src.log.CloudLogginFormatter",
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "app": {"handlers": ["default"], "level": "DEBUG", "propagate": False},
            "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
            "uvicorn.error": {"level": "INFO"},
            "uvicorn.access": {"level": "INFO"},
        },
    }


# //////////////////////////////////////////////////////////////////////////////

trace_context: ContextVar[dict[str, Any] | None] = ContextVar(
    "trace_context", default=None
)


class CloudLogginMiddleware(BaseHTTPMiddleware):
    """
    Middleware to load Cloud Logging trace context from headers.
    """

    async def dispatch(self, request: Request, call_next: Any) -> Any:
        header = request.headers.get("Traceparent")
        trace_id, span_id, trace_sampled = self.parse_trace_parent(header)
        if trace_id is None:
            # NOTE: traceparent not found. look for xcloud_trace_context header
            header = request.headers.get("X-Cloud-Trace-Context")
            trace_id, span_id, trace_sampled = self.parse_xcloud_trace(header)

        trace_context.set(
            {
                "trace_id": trace_id,
                "span_id": span_id,
                "trace_sampled": trace_sampled,
            }
        )
        return await call_next(request)

    def parse_trace_parent(
        self, header: str | None
    ) -> tuple[str | None, str | None, bool]:
        """
        Given a w3 traceparent header, extract the trace and span ids.
        For more information see https://www.w3.org/TR/trace-context/

        Args:
            header (str): the string extracted from the traceparent header
                example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
        Returns:
            Tuple[Optional[dict], Optional[str], bool]:
                The trace_id, span_id and trace_sampled extracted from the header
                Each field will be None if header can't be parsed in expected format.
        """
        trace_id = span_id = None
        trace_sampled = False
        if header:
            try:
                VERSION_PART = r"(?!ff)[a-f\d]{2}"
                TRACE_ID_PART = r"(?![0]{32})[a-f\d]{32}"
                PARENT_ID_PART = r"(?![0]{16})[a-f\d]{16}"
                FLAGS_PART = r"[a-f\d]{2}"
                regex = f"^\\s?({VERSION_PART})-({TRACE_ID_PART})-({PARENT_ID_PART})-({FLAGS_PART})(-.*)?\\s?$"
                match = re.match(regex, header)
                trace_id = match.group(2)  # type: ignore[union-attr]
                span_id = match.group(3)  # type: ignore[union-attr]
                # NOTE: trace-flag component is an 8-bit bit field. Read as an int.
                int_flag = int(match.group(4), 16)  # type: ignore[union-attr]
                # NOTE: trace_sampled is set if the right-most bit in flag
                # component is set.
                trace_sampled = bool(int_flag & 1)
            except (IndexError, AttributeError):
                # Could not parse header as expected. Return None.
                pass
        return trace_id, span_id, trace_sampled

    def parse_xcloud_trace(
        self, header: str | None
    ) -> tuple[str | None, str | None, bool]:
        """
        Given an X-Cloud-Trace-Context header, extract the trace and span ids.

        Args:
            header (str): the string extracted from the X-Cloud-Trace-Context header
        Returns:
            Tuple[Optional[str], Optional[str], bool]:
                The trace_id, span_id and trace_sampled extracted from the header
                Each field will be None if not found.
        """
        trace_id = span_id = None
        trace_sampled = False

        # NOTE: As per the format described at
        # https://cloud.google.com/trace/docs/trace-context#legacy-http-header
        #   "X-Cloud-Trace-Context: TRACE_ID[/SPAN_ID][;o=OPTIONS]"
        # for example:
        #   "X-Cloud-Trace-Context: 105445aa7843bc8bf206b12000100000/1;o=1"
        #
        # We expect:
        #   * trace_id (optional, 128-bit hex string): "105445aa7843bc8bf206b12000100000"
        #   * span_id (optional, 16-bit hex string): "0000000000000001"
        #   * trace_sampled (optional, bool): true
        if header:
            try:
                regexp = r"([\w-]+)?(\/?([\w-]+))?(;?o=(\d))?"
                match = re.match(regexp, header)
                trace_id = match.group(1)  # type: ignore[union-attr]
                span_id = match.group(3)  # type: ignore[union-attr]
                trace_sampled = match.group(5) == "1"  # type: ignore[union-attr]

                # NOTE: Convert the span ID to 16-bit hexadecimal instead of decimal
                try:
                    span_id_int = int(span_id)
                    if span_id_int > 0 and span_id_int < 2**64:
                        span_id = f"{span_id_int:016x}"
                    else:
                        span_id = None
                except (ValueError, TypeError):
                    span_id = None

            except IndexError:
                pass
        return trace_id, span_id, trace_sampled
