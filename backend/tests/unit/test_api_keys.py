"""Tests for API key service."""

from app.models.api_key import Tier


class TestGenerateKey:
    def test_generate_free_key(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        key = svc.generate_key("user@example.com")

        assert key.key.startswith("cc_")
        assert key.tier == Tier.FREE
        assert key.requests_limit == 50
        assert key.requests_used == 0
        assert key.is_active is True

    def test_generate_pro_key(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        key = svc.generate_key("pro@example.com", Tier.PRO)

        assert key.tier == Tier.PRO
        assert key.requests_limit == 1000

    def test_generate_enterprise_key(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        key = svc.generate_key("ent@example.com", Tier.ENTERPRISE)

        assert key.tier == Tier.ENTERPRISE
        assert key.requests_limit == 100_000


class TestGetKey:
    def test_get_existing_key(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        created = svc.generate_key("user@example.com")
        fetched = svc.get_key(created.key)

        assert fetched is not None
        assert fetched.key == created.key
        assert fetched.user_email == "user@example.com"

    def test_get_nonexistent_key(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        assert svc.get_key("cc_nonexistent") is None


class TestGetKeysByEmail:
    def test_get_keys_by_email(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        svc.generate_key("multi@example.com")
        # Revoke and create another
        keys = svc.get_keys_by_email("multi@example.com")
        assert len(keys) == 1

    def test_get_keys_no_results(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        assert svc.get_keys_by_email("nobody@example.com") == []


class TestIncrementUsage:
    def test_increment_usage(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        key = svc.generate_key("usage@example.com")

        assert svc.increment_usage(key.key) is True

        updated = svc.get_key(key.key)
        assert updated is not None
        assert updated.requests_used == 1

    def test_increment_over_limit(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        key = svc.generate_key("limit@example.com")

        # Use up all 50 requests
        for _ in range(50):
            assert svc.increment_usage(key.key) is True

        # 51st should fail
        assert svc.increment_usage(key.key) is False

    def test_increment_nonexistent_key(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        assert svc.increment_usage("cc_fake") is False


class TestRotateKey:
    def test_rotate_key(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        original = svc.generate_key("rotate@example.com")

        new_key = svc.rotate_key(original.key)
        assert new_key is not None
        assert new_key.key != original.key
        assert new_key.user_email == original.user_email
        assert new_key.tier == original.tier

        # Old key should be revoked
        old = svc.get_key(original.key)
        assert old is not None
        assert old.is_active is False

    def test_rotate_nonexistent_key(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        assert svc.rotate_key("cc_fake") is None


class TestRevokeKey:
    def test_revoke_key(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        key = svc.generate_key("revoke@example.com")

        assert svc.revoke_key(key.key) is True
        revoked = svc.get_key(key.key)
        assert revoked is not None
        assert revoked.is_active is False

    def test_revoke_already_revoked(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        key = svc.generate_key("double@example.com")
        svc.revoke_key(key.key)

        # Second revoke should return False
        assert svc.revoke_key(key.key) is False

    def test_revoke_nonexistent(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        assert svc.revoke_key("cc_fake") is False


class TestUpgradeTier:
    def test_upgrade_to_pro(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        key = svc.generate_key("upgrade@example.com")
        assert key.tier == Tier.FREE

        assert svc.upgrade_tier(key.key, Tier.PRO) is True
        upgraded = svc.get_key(key.key)
        assert upgraded is not None
        assert upgraded.tier == Tier.PRO
        assert upgraded.requests_limit == 1000

    def test_upgrade_invalid_tier(self, _patch_settings):
        from app.services.api_key_service import ApiKeyService

        svc = ApiKeyService()
        key = svc.generate_key("bad@example.com")
        assert svc.upgrade_tier(key.key, "ultra") is False


class TestApiKeyModel:
    def test_remaining_requests(self):
        from app.models.api_key import ApiKey

        key = ApiKey(
            key="cc_test",
            user_email="test@example.com",
            tier="free",
            requests_used=30,
            requests_limit=50,
            created_at="2024-01-01",
            expires_at=None,
            is_active=True,
            last_reset="2024-01-01",
        )
        assert key.remaining_requests == 20
        assert key.is_over_limit is False

    def test_over_limit(self):
        from app.models.api_key import ApiKey

        key = ApiKey(
            key="cc_test",
            user_email="test@example.com",
            tier="free",
            requests_used=50,
            requests_limit=50,
            created_at="2024-01-01",
            expires_at=None,
            is_active=True,
            last_reset="2024-01-01",
        )
        assert key.remaining_requests == 0
        assert key.is_over_limit is True

    def test_to_dict_masks_key(self):
        from app.models.api_key import ApiKey

        key = ApiKey(
            key="cc_abcdef1234567890",
            user_email="test@example.com",
            tier="free",
            requests_used=5,
            requests_limit=50,
            created_at="2024-01-01",
            expires_at=None,
            is_active=True,
            last_reset="2024-01-01",
        )
        d = key.to_dict()
        assert d["key_prefix"] == "cc_abcde..."
        assert "key" not in d  # Full key not exposed
