import pytest
import time
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.user import CRUDUser
from app.schemas.user import UserCreate, UserUpdate
from app.models.user import User


class TestUserCRUD:
    """Test cases for User CRUD operations"""

    async def test_create_user(
        self,
        crud_user: CRUDUser,
        db_session: AsyncSession
    ):
        """Test creating a new user"""
        
        email = f"create_{int(time.time() * 1000)}@example.com"
        user_data = UserCreate(
            email=email,
            full_name="Test User",
            password="password123"
        )
        user = await crud_user.create(db_session, obj_in=user_data)

        assert user.email == email
        assert user.full_name == "Test User"
        assert user.id is not None                      
        assert user.hashed_password != "password123"   

    async def test_get_user_by_id(
        self,
        crud_user: CRUDUser,
        db_session: AsyncSession
    ):
        """Test retrieving user by ID"""
        email = f"getbyid_{int(time.time() * 1000)}@example.com"
        created_user = await crud_user.create(
            db_session,
            obj_in=UserCreate(
                email=email,
                full_name="Test User 2",
                password="password123"
            )
        )
        retrieved_user = await crud_user.get(db_session, id=created_user.id)

        assert retrieved_user is not None               
        assert retrieved_user.id == created_user.id
        assert retrieved_user.email == email

    async def test_get_user_by_email(
        self,
        crud_user: CRUDUser,
        db_session: AsyncSession
    ):
        """Test retrieving user by email"""
        email = f"byemail_{int(time.time() * 1000)}@example.com"
        await crud_user.create(
            db_session,
            obj_in=UserCreate(
                email=email,
                full_name="Unique User",
                password="password123"
            )
        )
        retrieved_user = await crud_user.get_by_email(db_session, email=email)

        assert retrieved_user is not None              
        assert retrieved_user.email == email

    async def test_update_user(
        self,
        crud_user: CRUDUser,
        db_session: AsyncSession
    ):
        """Test updating user information"""
        email = f"update_{int(time.time() * 1000)}@example.com"
        user = await crud_user.create(
            db_session,
            obj_in=UserCreate(
                email=email,
                full_name="Original Name",
                password="password123"
            )
        )
        update_data = UserUpdate(full_name="Updated Name")
        updated_user = await crud_user.update(
            db_session,
            db_obj=user,
            obj_in=update_data
        )

        assert updated_user.full_name == "Updated Name"
        assert updated_user.id == user.id              
        assert updated_user.email == email            

    async def test_delete_user(
        self,
        crud_user: CRUDUser,
        db_session: AsyncSession
    ):
        """Test deleting a user"""
        email = f"delete_{int(time.time() * 1000)}@example.com"
        user = await crud_user.create(
            db_session,
            obj_in=UserCreate(
                email=email,
                full_name="Delete User",
                password="password123"
            )
        )

        await crud_user.remove(db_session, id=user.id)
        deleted_user = await crud_user.get(db_session, id=user.id)
        assert deleted_user is None                    

    async def test_get_all_users(
        self,
        crud_user: CRUDUser,
        db_session: AsyncSession
    ):
        """Test retrieving all users"""
       
        for i in range(3):
            email = f"getall_{i}_{int(time.time() * 1000)}@example.com"
            await crud_user.create(
                db_session,
                obj_in=UserCreate(
                    email=email,
                    full_name=f"User {i}",
                    password="password123"
                )
            )

        users = await crud_user.get_multi(db_session, skip=0, limit=10)
        assert len(users) >= 3                         
    async def test_user_duplicate_email_error(
        self,
        crud_user: CRUDUser,
        db_session: AsyncSession
    ):
        """Test that duplicate emails raise an error"""
        email = f"duplicate_{int(time.time() * 1000)}@example.com"
        user_data = UserCreate(
            email=email,
            full_name="Duplicate User",
            password="password123"
        )
        await crud_user.create(db_session, obj_in=user_data)

        with pytest.raises(Exception):                
            await crud_user.create(db_session, obj_in=user_data)