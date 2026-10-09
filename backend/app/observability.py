"""Lightweight request correlation without storing credentials or token values."""
import logging
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

log=logging.getLogger("oto.requests")
class RequestAudit(BaseHTTPMiddleware):
    async def dispatch(self,request:Request,call_next):
        identifier=str(uuid.uuid4())
        start=time.monotonic()
        response=await call_next(request)
        response.headers["X-Request-ID"]=identifier
        response.headers["X-Content-Type-Options"]="nosniff"
        log.info("request_id=%s method=%s path=%s status=%s duration_ms=%d",
                 identifier,request.method,request.url.path,response.status_code,
                 round((time.monotonic()-start)*1000))
        return response
