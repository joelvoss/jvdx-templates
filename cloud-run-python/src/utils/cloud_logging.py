import json
import logging
import re
from contextvars import ContextVar
from typing import Any

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class CloudLoggingFormatter(logging.Formatter):
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

    def __init__(self, fmt: str = "", project: str | None = None):
        logging.Formatter.__init__(self, fmt)
        self.project = project

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

        trace_ctx = trace_context.get()
        if trace_ctx:
            inferred_trace = trace_ctx.get("trace_id", None)
            if inferred_trace is not None and self.project is not None:
                # NOTE: Add full path for detected trace
                log["logging.googleapis.com/trace"] = (
                    f"projects/{self.project}/traces/{inferred_trace}"
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


# //////////////////////////////////////////////////////////////////////////////

trace_context: ContextVar[dict[str, Any] | None] = ContextVar(
    "trace_context", default=None
)


class CloudLoggingMiddleware(BaseHTTPMiddleware):
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

        token = trace_context.set(
            {
                "trace_id": trace_id,
                "span_id": span_id,
                "trace_sampled": trace_sampled,
            }
        )
        try:
            return await call_next(request)
        finally:
            trace_context.reset(token)

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
            match = re.fullmatch(
                r"(?!ff)[0-9a-f]{2}-(?!0{32})[0-9a-f]{32}-(?!0{16})[0-9a-f]{16}-[0-9a-f]{2}",
                header,
            )
            if match:
                parts = header.split("-")
                trace_id, span_id = parts[1], parts[2]
                trace_sampled = bool(int(parts[3], 16) & 1)
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
            match = re.fullmatch(
                r"([0-9a-f]{32})(?:/([1-9][0-9]{0,19}))?(?:;o=([01]))?", header
            )
            if match:
                trace_id = match.group(1)
                span_id_value = match.group(2)
                trace_sampled = match.group(3) == "1"
                if span_id_value is not None and int(span_id_value) < 2**64:
                    span_id = f"{int(span_id_value):016x}"
        return trace_id, span_id, trace_sampled
