import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models import PollutionReport


# Test database - use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session


# Override the database dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
async def setup_test_db_and_clear():
    """Initialize the test database and clear before each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    """Provide an async HTTP client for testing."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def reviewer_headers(monkeypatch):
    """Provide valid reviewer authentication headers with mocked environment key."""
    monkeypatch.setenv("REVIEWER_API_KEY", "dev-reviewer-key-change-in-production")
    return {"X-Reviewer-API-Key": "dev-reviewer-key-change-in-production"}