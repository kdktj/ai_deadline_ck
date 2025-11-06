"""
Authentication router - API endpoints for user authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated

from app.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.services import auth_service
from app.utils.auth import decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Get current authenticated user from token.
    
    Args:
        token: JWT access token
        db: Database session
        
    Returns:
        Current user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = auth_service.get_user_by_id(db, user_id=int(user_id))
    if user is None:
        raise credentials_exception
    
    return UserResponse.model_validate(user)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    Args:
        user: User registration data
        db: Database session
        
    Returns:
        Created user
    """
    db_user = auth_service.create_user(db, user)
    return UserResponse.model_validate(db_user)


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login user and get access token.
    
    Args:
        login_data: Login credentials (email and password)
        db: Database session
        
    Returns:
        Access token and user data
    """
    return auth_service.login(db, login_data)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[UserResponse, Depends(get_current_user)]
):
    """
    Get current authenticated user information.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User information
    """
    return current_user


@router.post("/logout")
async def logout():
    """
    Logout user (client-side token removal).
    
    Returns:
        Success message
    """
    return {"message": "Successfully logged out"}
