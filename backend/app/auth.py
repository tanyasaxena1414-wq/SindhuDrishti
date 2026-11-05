from typing import Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import APIKeyHeader
import os

# Simple API key based authentication for reviewers
# In production, this would be replaced with proper JWT/OAuth

# API key header for reviewer authentication
reviewer_api_key_header = APIKeyHeader(name="X-Reviewer-API-Key", auto_error=False)


DEFAULT_DEV_REVIEWER_KEY = "sindhu-reviewer-2026"


def get_reviewer_api_key() -> str:
    """Get the reviewer API key from environment, with safe dev default for demo."""
    return os.getenv("REVIEWER_API_KEY", DEFAULT_DEV_REVIEWER_KEY)


async def get_current_reviewer(api_key: str = Depends(reviewer_api_key_header)) -> dict:
    """Validate reviewer API key and return reviewer info."""
    expected_key = get_reviewer_api_key()

    if not api_key or api_key.strip() != expected_key.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid reviewer API key. (Use default: '{expected_key}')",
            headers={"WWW-Authenticate": "APIKey"},
        )

    return {"authenticated": True, "role": "reviewer"}


async def optional_current_reviewer(api_key: str = Depends(reviewer_api_key_header)) -> Optional[dict]:
    """Optional reviewer authentication - returns reviewer info if valid, None otherwise."""
    try:
        return await get_current_reviewer(api_key)
    except HTTPException:
        return None