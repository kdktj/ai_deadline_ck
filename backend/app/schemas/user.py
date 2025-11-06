"""
User schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional
from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=100)

#  đăng ký User mới
class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=6, max_length=100)

# Đăng nhập User
class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str

# Cập nhật thông tin User
class UserUpdate(BaseModel):
    """Schema for user update"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=6, max_length=100)

# Response schema user data
class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True

#  JWT token response
class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for token payload"""
    user_id: Optional[int] = None
    email: Optional[str] = None
