import logging
import sys
from loguru import logger
from .config import settings

_FORMAT = (
    "<green>{time:HH:mm:ss.SSS}</green> "
    "<dim>│</dim> "
    "<level>{level: <8}</level> "
    "<dim>│</dim> "
    "<cyan>{name}</cyan><dim>:</dim><cyan>{function}</cyan><dim>:</dim><cyan>{line}</cyan>"
    " <dim>─</dim> "
    "<level>{message}</level>"
)


class _InterceptHandler(logging.Handler):
    """Route stdlib logging (uvicorn, boto3, etc.) through loguru."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


logger.remove()
logger.add(
    sys.stderr,
    format=_FORMAT,
    level=settings.LOG_LEVEL,
    colorize=True,
)

# Pull uvicorn + AWS SDK logs through loguru so everything uses the same format
logging.basicConfig(handlers=[_InterceptHandler()], level=0, force=True)
for _name in ("uvicorn", "uvicorn.error", "uvicorn.access", "botocore", "boto3", "s3transfer"):
    _log = logging.getLogger(_name)
    _log.handlers = [_InterceptHandler()]
    _log.propagate = False
