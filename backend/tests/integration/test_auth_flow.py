"""Integration tests for API key auth endpoints."""


class TestGenerateKeyEndpoint:
    async def test_generate_key(self, client):
        resp = await client.post("/api/v1/auth/generate-key", json={"email": "newuser@example.com"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["api_key"].startswith("cc_")
        assert data["tier"] == "free"
        assert data["requests_limit"] == 50

    async def test_generate_key_duplicate_email(self, client):
        await client.post("/api/v1/auth/generate-key", json={"email": "dupe@example.com"})
        resp = await client.post("/api/v1/auth/generate-key", json={"email": "dupe@example.com"})
        assert resp.status_code == 409

    async def test_generate_key_invalid_email(self, client):
        resp = await client.post("/api/v1/auth/generate-key", json={"email": "not-an-email"})
        assert resp.status_code == 422


class TestUsageEndpoint:
    async def test_get_usage(self, client):
        # Generate key first
        gen_resp = await client.post("/api/v1/auth/generate-key", json={"email": "usage@example.com"})
        api_key = gen_resp.json()["api_key"]

        resp = await client.get(f"/api/v1/auth/usage?api_key={api_key}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["tier"] == "free"
        assert data["requests_used"] == 0
        assert data["requests_limit"] == 50

    async def test_get_usage_nonexistent(self, client):
        resp = await client.get("/api/v1/auth/usage?api_key=cc_fake")
        assert resp.status_code == 404


class TestRotateKeyEndpoint:
    async def test_rotate_key(self, client):
        gen_resp = await client.post("/api/v1/auth/generate-key", json={"email": "rot@example.com"})
        old_key = gen_resp.json()["api_key"]

        resp = await client.post(f"/api/v1/auth/rotate-key?api_key={old_key}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["new_api_key"].startswith("cc_")
        assert data["new_api_key"] != old_key

    async def test_rotate_nonexistent(self, client):
        resp = await client.post("/api/v1/auth/rotate-key?api_key=cc_fake")
        assert resp.status_code == 404


class TestRevokeKeyEndpoint:
    async def test_revoke_key(self, client):
        gen_resp = await client.post("/api/v1/auth/generate-key", json={"email": "rev@example.com"})
        api_key = gen_resp.json()["api_key"]

        resp = await client.delete(f"/api/v1/auth/revoke-key?api_key={api_key}")
        assert resp.status_code == 200

        # Verify it's revoked
        usage_resp = await client.get(f"/api/v1/auth/usage?api_key={api_key}")
        data = usage_resp.json()
        assert data["is_active"] is False

    async def test_revoke_nonexistent(self, client):
        resp = await client.delete("/api/v1/auth/revoke-key?api_key=cc_fake")
        assert resp.status_code == 404
