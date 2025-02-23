import json
import logging
from collections.abc import Iterator

import pytest
from fastapi import Request
from starlette.middleware.base import RequestResponseEndpoint

from src.settings import Settings, settings
from src.utils.cloud_logging import (
    CloudLogginFormatter,
    CloudLogginMiddleware,
    trace_context,
)


@pytest.fixture
def log_record():
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname=__file__,
        lineno=10,
        msg="Test log message",
        args=(),
        exc_info=None,
    )
    return record


@pytest.fixture
def patch_settings(request: pytest.FixtureRequest) -> Iterator[Settings]:
    # Make a copy of the original settings
    original_settings = settings.model_copy()

    # Collect the env vars to patch
    env_vars_to_patch = getattr(request, "param", {})

    # Patch the settings to use the default values
    for k, v in settings.model_fields.items():
        setattr(settings, k, v.default)

    # Patch the settings with the parametrized env vars
    for key, val in env_vars_to_patch.items():
        # Raise an error if the env var is not defined in the settings
        if not hasattr(settings, key):
            raise ValueError(f"Unknown setting: {key}")

        setattr(settings, key, val)

    yield settings

    # Restore the original settings
    settings.__dict__.update(original_settings.__dict__)


def test_cloud_logging_formatter_format(log_record):
    formatter = CloudLogginFormatter()
    formatted_log = formatter.format(log_record)
    log_dict = json.loads(formatted_log)

    # Assertions
    assert log_dict["severity"] == "INFO"
    assert log_dict["message"] == "Test log message"


@pytest.mark.parametrize(
    "patch_settings",
    [{"PROJECT": "my-project-id"}],
    indirect=True,
)
def test_cloud_logging_formatter_with_trace_context(patch_settings, log_record):
    formatter = CloudLogginFormatter()
    token = trace_context.set(
        {"trace_id": "1234", "span_id": "5678", "trace_sampled": True}
    )
    formatted_log = formatter.format(log_record)
    log_dict = json.loads(formatted_log)

    # Assertions
    assert (
        log_dict["logging.googleapis.com/trace"]
        == f"projects/{patch_settings.PROJECT}/traces/1234"
    )
    assert log_dict["logging.googleapis.com/spanId"] == "5678"
    assert log_dict["logging.googleapis.com/trace_sampled"] is True

    trace_context.reset(token)


@pytest.mark.anyio
async def test_cloud_logging_middleware_dispatch(mocker):
    # Setup mock
    mock_request = mocker.AsyncMock(Request)
    mock_request.headers = {
        "Traceparent": "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
    }
    mock_call_next = mocker.AsyncMock(RequestResponseEndpoint)

    middleware = CloudLogginMiddleware(None)
    await middleware.dispatch(mock_request, mock_call_next)

    # Assertions
    trace_ctx = trace_context.get()
    assert trace_ctx["trace_id"] == "0af7651916cd43dd8448eb211c80319c"
    assert trace_ctx["span_id"] == "b7ad6b7169203331"
    assert trace_ctx["trace_sampled"] is True
    mock_call_next.assert_called_once_with(mock_request)

    mocker.resetall()


def test_parse_trace_parent():
    middleware = CloudLogginMiddleware(None)
    trace_id, span_id, trace_sampled = middleware.parse_trace_parent(
        "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00"
    )

    # Assertions
    assert trace_id == "0af7651916cd43dd8448eb211c80319c"
    assert span_id == "b7ad6b7169203331"
    assert trace_sampled is False


def test_parse_xcloud_trace():
    middleware = CloudLogginMiddleware(None)
    trace_id, span_id, trace_sampled = middleware.parse_xcloud_trace(
        "105445aa7843bc8bf206b12000100000/1;o=1"
    )

    # Assertions
    assert trace_id == "105445aa7843bc8bf206b12000100000"
    assert span_id == "0000000000000001"
    assert trace_sampled is True
