from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from math import ceil
from re import Pattern, compile as compile_pattern

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.config import Settings
from app.core.security import decode_access_token


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Small single-process limiter for the single-instance V1 deployment."""

    def __init__(self, app: object, settings: Settings) -> None:
        super().__init__(app)
        self.settings = settings
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()
        self._policies: tuple[tuple[str, Pattern[str], int], ...] = (
            ("POST", compile_pattern(r"^/api/v1/auth/(?:register|login)$"), settings.rate_limit_auth_requests),
            ("POST", compile_pattern(r"^/api/v1/animals/[0-9a-f-]+/photos$"), settings.rate_limit_upload_requests),
            ("POST", compile_pattern(r"^/api/v1/vets/(?:apply|me/document)$"), settings.rate_limit_upload_requests),
            ("POST", compile_pattern(r"^/api/v1/marketplace/listings$"), settings.rate_limit_mutation_requests),
            ("POST", compile_pattern(r"^/api/v1/marketplace/listings/[0-9a-f-]+/report$"), settings.rate_limit_mutation_requests),
            ("PATCH", compile_pattern(r"^/api/v1/admin/"), settings.rate_limit_mutation_requests),
        )

    def _policy_for(self, request: Request) -> tuple[str, int] | None:
        for method, pattern, limit in self._policies:
            if request.method == method and pattern.search(request.url.path):
                return f"{method}:{pattern.pattern}", limit
        return None

    def _subject(self, request: Request) -> str:
        authorization = request.headers.get("authorization", "")
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token:
            try:
                subject = decode_access_token(token).get("sub")
                if subject:
                    return f"user:{subject}"
            except ValueError:
                pass
        # Deliberately ignore X-Forwarded-For unless trusted proxy support is configured.
        return f"ip:{request.client.host if request.client else 'unknown'}"

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not self.settings.rate_limit_enabled:
            return await call_next(request)
        policy = self._policy_for(request)
        if policy is None:
            return await call_next(request)
        policy_name, limit = policy
        now = time.monotonic()
        window = self.settings.rate_limit_window_seconds
        key = f"{policy_name}:{self._subject(request)}"
        async with self._lock:
            bucket = self._buckets[key]
            while bucket and bucket[0] <= now - window:
                bucket.popleft()
            if len(bucket) >= limit:
                retry_after = max(1, ceil(window - (now - bucket[0])))
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please retry later."},
                    headers={"Retry-After": str(retry_after)},
                )
            bucket.append(now)
        return await call_next(request)
