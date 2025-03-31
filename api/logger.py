import logging
import sys
from pathlib import Path


class Logger:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Logger, cls).__new__(cls)
            cls._instance.setup_logger()
        return cls._instance

    def setup_logger(self):
        formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")

        log_path = Path("api/scoring-system-api.log")
        log_path.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_path)
        file_handler.setFormatter(formatter)

        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(formatter)

        self.logger = logging.getLogger("ScoringSystemLogger")
        self.logger.setLevel(logging.DEBUG)

        # prevent duplicate logs
        if not self.logger.handlers:
            self.logger.addHandler(file_handler)
            self.logger.addHandler(stream_handler)

    def debug(self, message): self.logger.debug(message)
    def info(self, message): self.logger.info(message)
    def warning(self, message): self.logger.warning(message)
    def error(self, message): self.logger.error(message)
