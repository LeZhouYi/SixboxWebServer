from core.log.log import init_logging
from core.server import run_app

if __name__ == "__main__":
    init_logging()
    run_app()
