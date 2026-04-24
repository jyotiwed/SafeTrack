import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.user_service import UserService
from app.services import user_service as svc_module


class TestUserService:
    """Test user service"""

    async def test_get_user_profile(
        self,
        db_session: AsyncSession,
        test_user
    ):
        """Test getting user profile returns correct user"""
        user = await svc_module.get_user_profile(
            db=db_session,
            user_id=test_user.id
        )

        assert user is not None
        assert user.id == test_user.id          
        assert user.email == test_user.email   

    async def test_get_user_profile_not_found(
        self,
        db_session: AsyncSession
    ):
        """Test getting profile for non-existent user raises error or returns None"""
        from app.services.user_service import UserNotFoundError

        with pytest.raises(UserNotFoundError):
            await svc_module.get_user_profile(
                db=db_session,
                user_id=99999                   
            )

    async def test_list_users(
        self,
        db_session: AsyncSession,
        test_user                               
    ):
        """Test listing users returns a list with at least one user"""
        users = await svc_module.list_users_for_admin(
            db=db_session,
            limit=10,
            offset=0
        )

        assert isinstance(users, list)
        assert len(users) >= 1                  

    async def test_list_users_pagination(
        self,
        db_session: AsyncSession,
        test_user
    ):
        """Test pagination limits results correctly"""
        users_limit_1 = await svc_module.list_users_for_admin(
            db=db_session,
            limit=1,
            offset=0
        )

        assert len(users_limit_1) <= 1          

    async def test_user_service_injection(
        self,
        db_session: AsyncSession
    ):
        """Test UserService initializes correctly with db session"""
        service = UserService(db=db_session)

        assert service.db == db_session        

    async def test_update_user_profile(
        self,
        db_session: AsyncSession,
        test_user
    ):
        """Test updating user profile via service"""
        from app.schemas.user import UserUpdate

        updated = await svc_module.update_user_profile(
            db=db_session,
            user_id=test_user.id, # type: ignore
            user_in=UserUpdate(full_name="Updated Name")
        )

        assert updated.full_name == "Updated Name"
        assert updated.id == test_user.id       
        assert updated.email == test_user.email 