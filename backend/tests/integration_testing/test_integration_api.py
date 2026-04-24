import asyncio
import pytest


class TestIncidentAPI:
    """Test incident API endpoints"""

    async def test_create_incident_endpoint(self, client):
        """Test POST /incidents endpoint"""
        response = await client.post(
            "/api/v1/incidents",
            json={
                "title": "Test Flood",
                "description": "Heavy rainfall",
                "severity": "high",
                "latitude": 20.5937,
                "longitude": 78.9629,
            },
            headers={"Authorization": f"Bearer {client.auth_token}"},
        )

        
        print("\n⏸ PAUSED: Open pgAdmin and inspect 'incidents' table (30s)...")
        await asyncio.sleep(30)
        print("▶ Resuming test...")

        assert response.status_code == 201, (
            f"Expected 201, got {response.status_code}: {response.text}"
        )
        data = response.json()
        assert data["title"] == "Test Flood"
        assert data["severity"] == "high"

    async def test_get_incidents_endpoint(self, client):
        """Test GET /incidents endpoint"""
        response = await client.get(
            "/api/v1/incidents",
            headers={"Authorization": f"Bearer {client.auth_token}"},
        )

        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}: {response.text}"
        )
        data = response.json()
        assert isinstance(data, list)

    async def test_get_incident_by_id(self, client, test_incident):
        """Test GET /incidents/{id} endpoint"""
        response = await client.get(
            f"/api/v1/incidents/{test_incident.id}",
            headers={"Authorization": f"Bearer {client.auth_token}"},
        )

       
        print(f"\n⏸ PAUSED: Check incident id={test_incident.id} in pgAdmin (30s)...")
        await asyncio.sleep(30)
        print("▶ Resuming test...")

        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}: {response.text}"
        )
        data = response.json()
        assert data["id"] == test_incident.id
        assert data["title"] == "Test Incident"

    async def test_update_incident_endpoint(self, client, test_incident):
        """Test PATCH /incidents/{id} endpoint"""
        response = await client.patch(
            f"/api/v1/incidents/{test_incident.id}",
            json={"status": "resolved"},
            headers={"Authorization": f"Bearer {client.auth_token}"},
        )

        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}: {response.text}"
        )
        data = response.json()
        assert data["status"] == "resolved"


class TestAuthAPI:
    """Test authentication API endpoints"""

    async def test_login_endpoint(self, client):
        """Test POST /auth/login — uses the actual test user created in fixture"""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": client.test_user_email,   
                "password": "TestPassword123",
            },
        )

        
        print("\n⏸ PAUSED: Check 'users' table in pgAdmin (30s)...")
        await asyncio.sleep(30)
        print("▶ Resuming test...")

        assert response.status_code == 200, (
            f"Expected 200, got {response.status_code}: {response.text}"
        )
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_endpoint(self, client):
        """Test POST /auth/register"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": f"newuser_{int(__import__('time').time())}@example.com",  # ✅ unique
                "full_name": "New User",
                "password": "SecurePassword123",
            },
        )

        assert response.status_code == 201, (
            f"Expected 201, got {response.status_code}: {response.text}"
        )
        data = response.json()
        assert "id" in data
        assert "email" in data

    async def test_login_wrong_password(self, client):
        """Test login with wrong password returns 401"""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": client.test_user_email,
                "password": "WrongPassword999",
            },
        )
        assert response.status_code == 401, (
            f"Expected 401, got {response.status_code}: {response.text}"
        )

    async def test_login_nonexistent_user(self, client):
        """Test login with unknown email returns 401"""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "ghost@nowhere.com",
                "password": "TestPassword123",
            },
        )
        assert response.status_code == 401, (
            f"Expected 401, got {response.status_code}: {response.text}"
        )