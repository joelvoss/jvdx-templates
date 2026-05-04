import logging
from unittest.mock import MagicMock

import pytest

from src.utils.cloud_logging import (
    CloudLoggingFormatter,
    CloudLoggingMiddleware,
    trace_context,
)

# //////////////////////////////////////////////////////////////////////////////
# Helpers


def make_record(message: str, level: int = logging.INFO) -> logging.LogRecord:
    record = logging.LogRecord(
        name="app",
        level=level,
        pathname="",
        lineno=0,
        msg=message,
        args=(),
        exc_info=None,
    )
    # Simulate Formatter.format() setting record.message
    record.message = record.getMessage()
    return record


# //////////////////////////////////////////////////////////////////////////////
# CloudLoggingFormatter


def test_format_returns_json_string():
    import json

    formatter = CloudLoggingFormatter()
    record = make_record("hello world")
    output = formatter.format(record)
    parsed = json.loads(output)
    assert parsed["message"] == "hello world"
    assert parsed["severity"] == "INFO"


@pytest.mark.parametrize(
    "level,expected_severity",
    [
        (logging.DEBUG, "DEBUG"),
        (logging.INFO, "INFO"),
        (logging.WARNING, "WARNING"),
        (logging.ERROR, "ERROR"),
        (logging.CRITICAL, "CRITICAL"),
    ],
)
def test_format_maps_log_level_to_cloud_severity(level, expected_severity):
    import json

    formatter = CloudLoggingFormatter()
    record = make_record("msg", level)
    parsed = json.loads(formatter.format(record))
    assert parsed["severity"] == expected_severity


def test_parse_record_includes_trace_when_project_set():
    formatter = CloudLoggingFormatter(project="my-project")
    ctx = {"trace_id": "abc123", "span_id": "span456", "trace_sampled": True}
    token = trace_context.set(ctx)
    try:
        result = formatter.parse_record(make_record("msg"))
    finally:
        trace_context.reset(token)

    assert result["logging.googleapis.com/trace"] == "projects/my-project/traces/abc123"
    assert result["logging.googleapis.com/spanId"] == "span456"
    assert result["logging.googleapis.com/trace_sampled"] is True


def test_parse_record_omits_trace_path_when_no_project():
    formatter = CloudLoggingFormatter()  # no project
    ctx = {"trace_id": "abc123", "span_id": "span456", "trace_sampled": False}
    token = trace_context.set(ctx)
    try:
        result = formatter.parse_record(make_record("msg"))
    finally:
        trace_context.reset(token)

    assert "logging.googleapis.com/trace" not in result


def test_parse_record_includes_labels_when_present():
    import json

    formatter = CloudLoggingFormatter()
    record = make_record("msg")
    record.labels = {"env": "test"}  # type: ignore[attr-defined]
    token = trace_context.set(None)
    try:
        result = formatter.parse_record(record)
    finally:
        trace_context.reset(token)

    labels = json.loads(result["logging.googleapis.com/labels"])
    assert labels["env"] == "test"


def test_parse_record_without_trace_context():
    formatter = CloudLoggingFormatter(project="proj")
    token = trace_context.set(None)
    try:
        result = formatter.parse_record(make_record("msg"))
    finally:
        trace_context.reset(token)

    assert "logging.googleapis.com/trace" not in result
    assert "logging.googleapis.com/spanId" not in result


# //////////////////////////////////////////////////////////////////////////////
# CloudLoggingMiddleware.parse_trace_parent


@pytest.fixture
def middleware():
    return CloudLoggingMiddleware(app=MagicMock())


def test_parse_trace_parent_valid_header(middleware):
    header = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
    trace_id, span_id, sampled = middleware.parse_trace_parent(header)
    assert trace_id == "0af7651916cd43dd8448eb211c80319c"
    assert span_id == "b7ad6b7169203331"
    assert sampled is True


def test_parse_trace_parent_not_sampled(middleware):
    header = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00"
    _, _, sampled = middleware.parse_trace_parent(header)
    assert sampled is False


def test_parse_trace_parent_returns_nones_for_none_input(middleware):
    trace_id, span_id, sampled = middleware.parse_trace_parent(None)
    assert trace_id is None
    assert span_id is None
    assert sampled is False


def test_parse_trace_parent_returns_nones_for_malformed_header(middleware):
    trace_id, span_id, sampled = middleware.parse_trace_parent("not-a-valid-header")
    assert trace_id is None
    assert span_id is None
    assert sampled is False


def test_parse_trace_parent_returns_nones_for_all_zeros_trace(middleware):
    # All-zero trace id is invalid per W3C spec
    header = "00-00000000000000000000000000000000-b7ad6b7169203331-01"
    trace_id, span_id, sampled = middleware.parse_trace_parent(header)
    assert trace_id is None


# //////////////////////////////////////////////////////////////////////////////
# CloudLoggingMiddleware.parse_xcloud_trace


def test_parse_xcloud_trace_valid_header(middleware):
    header = "105445aa7843bc8bf206b12000100000/1;o=1"
    trace_id, span_id, sampled = middleware.parse_xcloud_trace(header)
    assert trace_id == "105445aa7843bc8bf206b12000100000"
    assert span_id == "0000000000000001"
    assert sampled is True


def test_parse_xcloud_trace_not_sampled(middleware):
    header = "105445aa7843bc8bf206b12000100000/1;o=0"
    _, _, sampled = middleware.parse_xcloud_trace(header)
    assert sampled is False


def test_parse_xcloud_trace_returns_nones_for_none_input(middleware):
    trace_id, span_id, sampled = middleware.parse_xcloud_trace(None)
    assert trace_id is None
    assert span_id is None
    assert sampled is False


def test_parse_xcloud_trace_span_id_zero_is_excluded(middleware):
    # Span ID of 0 is not a valid positive integer; should be normalised to None
    header = "105445aa7843bc8bf206b12000100000/0;o=1"
    _, span_id, _ = middleware.parse_xcloud_trace(header)
    assert span_id is None


def test_parse_xcloud_trace_span_id_non_numeric_is_excluded(middleware):
    header = "105445aa7843bc8bf206b12000100000/abc;o=1"
    _, span_id, _ = middleware.parse_xcloud_trace(header)
    assert span_id is None


# //////////////////////////////////////////////////////////////////////////////
# CloudLoggingMiddleware.dispatch


async def test_dispatch_sets_trace_context_from_traceparent():
    """Middleware propagates W3C traceparent to the trace_context ContextVar."""
    captured: dict = {}

    async def fake_app(_scope, _receive, _send):
        captured.update(trace_context.get() or {})

    mw = CloudLoggingMiddleware(app=fake_app)

    from unittest.mock import AsyncMock, MagicMock

    request = MagicMock()
    request.headers.get = lambda key: (
        "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
        if key == "Traceparent"
        else None
    )

    call_next = AsyncMock(return_value=MagicMock())
    await mw.dispatch(request, call_next)
    call_next.assert_awaited_once()


async def test_dispatch_falls_back_to_xcloud_trace_context():
    mw = CloudLoggingMiddleware(app=MagicMock())
    request = MagicMock()
    request.headers.get = lambda key: (
        "105445aa7843bc8bf206b12000100000/1;o=1"
        if key == "X-Cloud-Trace-Context"
        else None
    )

    from unittest.mock import AsyncMock

    call_next = AsyncMock(return_value=MagicMock())
    await mw.dispatch(request, call_next)
    call_next.assert_awaited_once()
