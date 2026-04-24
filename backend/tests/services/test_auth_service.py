import pytest
from app.core.security import (
    create_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)


class TestAuthService:
    """Test authentication service — pure unit tests, no DB needed"""

    def test_hash_password(self):
        """Test password hashing produces a non-plain hash"""
        password = "mySecurePassword123"
        hashed = create_password_hash(password)

        assert hashed != password               
        assert len(hashed) > 20                 

    def test_verify_correct_password(self):
        """Test correct password verifies successfully"""
        password = "mySecurePassword123"
        hashed = create_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_wrong_password(self):
        """Test wrong password fails verification"""
        password = "mySecurePassword123"
        hashed = create_password_hash(password)

        assert verify_password("wrongPassword", hashed) is False

    def test_verify_empty_password_fails(self):
        """Test empty password fails verification"""
        hashed = create_password_hash("mySecurePassword123")
        assert verify_password("", hashed) is False

    def test_create_access_token(self):
        """Test JWT token creation returns a valid string"""
        user_id = "1"
        token = create_access_token(user_id)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 20                  

    def test_decode_valid_token(self):
        """Test JWT token decoding returns correct subject"""
        user_id = "42"
        token = create_access_token(user_id)
        decoded = decode_access_token(token)

        assert decoded == user_id               

    def test_decode_invalid_token_returns_none(self):
        """Test decoding a garbage token returns None"""
        decoded = decode_access_token("invalid.token.here")
        assert decoded is None                 

    def test_decode_empty_token_returns_none(self):
        """Test decoding an empty string returns None"""
        decoded = decode_access_token("")
        assert decoded is None

    def test_two_users_get_different_tokens(self):
        """Test different users get different tokens"""
        token1 = create_access_token("1")
        token2 = create_access_token("2")

        assert token1 != token2                 

    def test_same_user_tokens_are_different(self):
        """Test same user gets different tokens on each call (due to timing)"""
        import time
        token1 = create_access_token("1")
        time.sleep(1)                           
        token2 = create_access_token("1")

        assert token1 != token2                 