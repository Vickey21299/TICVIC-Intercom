import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Email Poller — initialised at startup, stopped at shutdown
# ---------------------------------------------------------------------------
_email_poller = None


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Manage startup / shutdown lifecycle events."""
    global _email_poller

    # --- Startup ---
    try:
        from app.services.email.scheduler import EmailPollerScheduler
        from app.api.email_api import set_poller

        _email_poller = EmailPollerScheduler()
        set_poller(_email_poller)
        _email_poller.start()
        logger.info("Email poller started (interval=%ds).", _email_poller.interval)
    except Exception as exc:
        logger.warning("Email poller could not start: %s", exc)

    yield  # application runs here

    # --- Shutdown ---
    if _email_poller is not None:
        _email_poller.stop()
        logger.info("Email poller stopped.")


app = FastAPI(title='Intercom Clone API', lifespan=lifespan)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_router)


@app.get('/health')
def health_check() -> dict[str, str]:
    return {'status': 'ok'}
