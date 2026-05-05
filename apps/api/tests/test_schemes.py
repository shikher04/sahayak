"""Tests for schemes CRUD endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_list_schemes(client: AsyncClient):
    response = await client.get("/api/schemes")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data


@pytest.mark.asyncio
async def test_list_schemes_filter_category(client: AsyncClient):
    response = await client.get("/api/schemes?category=agriculture")
    assert response.status_code == 200
    data = response.json()
    for item in data["items"]:
        assert item["category"] == "agriculture"


@pytest.mark.asyncio
async def test_list_rights(client: AsyncClient):
    response = await client.get("/api/rights")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_eligibility_check(client: AsyncClient):
    response = await client.post(
        "/api/eligibility/check",
        json={
            "occupation": "farmer",
            "annual_income": "below_50k",
            "caste_category": "general",
            "has_land": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if data:
        assert "confidence_score" in data[0]
        assert "name" in data[0]


@pytest.mark.asyncio
async def test_scheme_not_found(client: AsyncClient):
    response = await client.get("/api/schemes/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
