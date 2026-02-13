import logging
import json
from datetime import datetime
import uuid


class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "channel": record.name,
            "context": getattr(record, "context", {}),
            "extra": getattr(record, "extra", {})
        }
        return json.dumps(log_record)


def get_logger(channel):
    logger = logging.getLogger(channel)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)

    return logger
