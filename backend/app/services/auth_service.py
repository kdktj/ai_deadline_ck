"""
Authentication Service - Business logic for user authentication.
Following Clean Architecture principles - this layer contains core business rules.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Dict, Any

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.utils.security import hash_password, verify_password, create_access_token


class AuthService:
    """
    Service class containing business logic for authentication operations.
    This is the core of the application - independent of frameworks and databases.
    """
    
    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        """
        Register a new user - Business logic for user registration.
        
        Business Rules:
        - Email must be unique
        - Username must be unique
        - Password must be hashed before storage
        - New users get 'USER' role by default
        
        Args:
            db: Database session (dependency injection)
            user_data: User registration data (DTO)
            
        Returns:
            Created user object
            
        Raises:
            HTTPException 400: If email or username already exists
            
        Example:
            >>> user_data = UserCreate(email="user@example.com", ...)
            >>> user = AuthService.register_user(db, user_data)
        """
        # Business Rule 1: Check email uniqueness
        existing_email = db.query(User).filter(
            User.email == user_data.email
        ).first()
        
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Business Rule 2: Check username uniqueness
        existing_username = db.query(User).filter(
            User.username == user_data.username
        ).first()
        
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Business Rule 3: Hash password before storage
        hashed_password = hash_password(user_data.password)
        
        # Business Rule 4: Create user with default role
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            password_hash=hashed_password,
            role=UserRole.USER
        )
        
        # Persist to database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user
    
    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> Dict[str, Any]:
        """
        Authenticate user and generate JWT token - Business logic for login.
        
        Business Rules:
        - Find user by email
        - Verify password hash
        - Generate JWT token with user data
        - Token expires based on config settings
        
        Args:
            db: Database session
            credentials: Login credentials (DTO)
            
        Returns:
            Dictionary containing access_token, token_type, and user data
            
        Raises:
            HTTPException 401: If credentials are invalid
            
        Example:
            >>> credentials = UserLogin(email="user@example.com", password="...")
            >>> result = AuthService.authenticate_user(db, credentials)
            >>> print(result["access_token"])
        """
        # Business Rule 1: Find user by email
        user = db.query(User).filter(
            User.email == credentials.email
        ).first()
        
        # Business Rule 2: Verify user exists and password is correct
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Business Rule 3: Generate JWT token with user claims
        access_token = create_access_token(
            data={
                "sub": user.id,  # Subject: user ID
                "email": user.email
            }
        )
        
        # Return token and user data
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        """
        Get user by ID - Business logic for fetching user data.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User object
            
        Raises:
            HTTPException 404: If user not found
        """
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """
        Get user by email - Business logic for fetching user data.
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            User object
            
        Raises:
            HTTPException 404: If user not found
        """
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user
    
    @staticmethod
    def logout_user() -> Dict[str, str]:
        """
        Logout user - Business logic for logout.
        
        Note: JWT tokens are stateless, so logout is handled on client side
        by removing the token from storage. This method is provided for
        consistency and can be extended for token blacklisting if needed.
        
        Returns:
            Success message dictionary
        """
        return {"message": "Successfully logged out"}
