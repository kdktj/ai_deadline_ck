"""
Authentication schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr = Field(..., description="User email address")
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name")
    password: str = Field(..., min_length=6, description="Password")


class UserLogin(BaseModel):
    """Schema for user login"""
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class TokenData(BaseModel):
    """Schema for decoded token data"""
    user_id: Optional[int] = None
    username: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user information response"""
    id: int
    email: str
    username: str
    full_name: str
    role: UserRole
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    """Schema for user profile update"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    
    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    """Schema for password change"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=6, description="New password")


