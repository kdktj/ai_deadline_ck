"""
Authentication utilities for password hashing and JWT token management.

This module provides:
- Password hashing and verification using bcrypt
- JWT token creation and validation
- User authentication and authorization
- User role and permission checking
- Token decode and inspection utilities
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import re

from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password to compare against
        
    Returns:
        True if passwords match, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        The hashed password
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing data to encode in the token
        expires_delta: Optional timedelta for token expiration
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def verify_token(token: str, credentials_exception: HTTPException) -> dict:
    """
    Verify and decode a JWT token.
    
    Args:
        token: The JWT token to verify
        credentials_exception: Exception to raise if token is invalid
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: Optional[str] = payload.get("sub")
        username: Optional[str] = payload.get("username")
        
        if user_id_str is None:
            raise credentials_exception
        
        # Convert string to int (sub is stored as string in token)
        user_id = int(user_id_str)
        
        return {"user_id": user_id, "username": username}
    except JWTError:
        raise credentials_exception


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user by email and password.
    
    Args:
        db: Database session
        email: Email address
        password: Plain text password
        
    Returns:
        User object if authentication succeeds, None otherwise
    """
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        token: JWT token from Authorization header
        db: Database session
        
    Returns:
        Current authenticated User object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = verify_token(token, credentials_exception)
    user = db.query(User).filter(User.id == token_data["user_id"]).first()
    
    if user is None:
        raise credentials_exception
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current active user (can be extended to check if user is active).
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current active User object
    """
    # Add any additional checks here (e.g., is_active flag)
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current user and verify admin role.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current admin User object
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user


# ============================================================================
# Password Validation Utilities
# ============================================================================

def validate_email(email: str) -> bool:
    """
    Validate email format.
    
    Args:
        email: Email address to validate
        
    Returns:
        True if valid email format, False otherwise
    """
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None


def validate_password_strength(password: str) -> Dict[str, any]:
    """
    Validate password strength and return detailed information.
    
    Password requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character (optional)
    
    Args:
        password: Password to validate
        
    Returns:
        Dict with 'is_valid' (bool) and 'issues' (list) of problems
    """
    issues = []
    
    if not password:
        return {"is_valid": False, "issues": ["Mật khẩu không được để trống"]}
    
    if len(password) < 6:
        issues.append("Mật khẩu phải có ít nhất 6 ký tự")
    
    if len(password) > 100:
        issues.append("Mật khẩu không được vượt quá 100 ký tự")
    
    if not re.search(r'[a-z]', password):
        issues.append("Mật khẩu phải chứa ít nhất một chữ thường")
    
    if not re.search(r'[A-Z]', password):
        issues.append("Mật khẩu phải chứa ít nhất một chữ hoa")
    
    if not re.search(r'\d', password):
        issues.append("Mật khẩu phải chứa ít nhất một chữ số")
    
    return {
        "is_valid": len(issues) == 0,
        "issues": issues
    }


def calculate_password_strength(password: str) -> int:
    """
    Calculate password strength score (0-100).
    
    Args:
        password: Password to check
        
    Returns:
        Strength score from 0 to 100
    """
    if not password:
        return 0
    
    strength = 0
    
    # Length
    if len(password) >= 6:
        strength += 10
    if len(password) >= 8:
        strength += 10
    if len(password) >= 12:
        strength += 10
    
    # Character types
    if re.search(r'[a-z]', password):
        strength += 15  # lowercase
    if re.search(r'[A-Z]', password):
        strength += 15  # uppercase
    if re.search(r'\d', password):
        strength += 15  # digits
    if re.search(r'[^a-zA-Z\d]', password):
        strength += 20  # special characters
    
    return min(strength, 100)


# ============================================================================
# Token Decode and Inspection Utilities
# ============================================================================

def decode_token_payload(token: str) -> Optional[Dict]:
    """
    Decode JWT token payload without verification.
    WARNING: For client-side usage only. Does not verify signature.
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded payload dict or None if invalid
    """
    try:
        # Decode without verification (for inspection only)
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except Exception as e:
        print(f"Error decoding token: {str(e)}")
        return None


def get_token_expiration_time(token: str) -> Optional[datetime]:
    """
    Get token expiration datetime from JWT token.
    
    Args:
        token: JWT token
        
    Returns:
        Expiration datetime or None if token invalid
    """
    payload = decode_token_payload(token)
    if payload and "exp" in payload:
        try:
            return datetime.utcfromtimestamp(payload["exp"])
        except (ValueError, TypeError):
            return None
    return None


def is_token_expired(token: str) -> bool:
    """
    Check if JWT token is expired.
    
    Args:
        token: JWT token
        
    Returns:
        True if token is expired, False otherwise
    """
    expiration_time = get_token_expiration_time(token)
    if not expiration_time:
        return True
    
    # Check if expired (with 60 second buffer)
    return datetime.utcnow() + timedelta(seconds=60) > expiration_time


def get_time_until_expiration(token: str) -> Optional[timedelta]:
    """
    Get remaining time until token expiration.
    
    Args:
        token: JWT token
        
    Returns:
        Timedelta until expiration or None if token invalid
    """
    expiration_time = get_token_expiration_time(token)
    if not expiration_time:
        return None
    
    return expiration_time - datetime.utcnow()


# ============================================================================
# User Information and Role Utilities
# ============================================================================

def get_user_by_id(user_id: int, db: Session) -> Optional[User]:
    """
    Get user by ID from database.
    
    Args:
        user_id: User ID
        db: Database session
        
    Returns:
        User object or None
    """
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(email: str, db: Session) -> Optional[User]:
    """
    Get user by email from database.
    
    Args:
        email: Email address
        db: Database session
        
    Returns:
        User object or None
    """
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(username: str, db: Session) -> Optional[User]:
    """
    Get user by username from database.
    
    Args:
        username: Username
        db: Database session
        
    Returns:
        User object or None
    """
    return db.query(User).filter(User.username == username).first()


def is_user_admin(user: User) -> bool:
    """
    Check if user has admin role.
    
    Args:
        user: User object
        
    Returns:
        True if user is admin
    """
    return user.role == UserRole.ADMIN


def check_user_permission(user: User, required_role: UserRole) -> bool:
    """
    Check if user has required role or higher.
    
    Args:
        user: User object
        required_role: Required role
        
    Returns:
        True if user has permission
    """
    # Admin has all permissions
    if is_user_admin(user):
        return True
    
    return user.role == required_role


# ============================================================================
# Error Handling and Formatting
# ============================================================================

def format_auth_error(error: str, http_status: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    """
    Format authentication error as HTTPException.
    
    Args:
        error: Error message
        http_status: HTTP status code
        
    Returns:
        HTTPException object
    """
    return HTTPException(
        status_code=http_status,
        detail=error,
        headers={"WWW-Authenticate": "Bearer"} if http_status == status.HTTP_401_UNAUTHORIZED else None
    )


def get_credentials_exception() -> HTTPException:
    """
    Get standard credentials validation exception.
    
    Returns:
        HTTPException for invalid credentials
    """
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_forbidden_exception(detail: str = "Not enough permissions") -> HTTPException:
    """
    Get standard forbidden exception.
    
    Args:
        detail: Error message detail
        
    Returns:
        HTTPException for forbidden access
    """
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=detail,
    )


# ============================================================================
# Token Creation Utilities
# ============================================================================

def create_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
    secret_key: Optional[str] = None,
    algorithm: Optional[str] = None
) -> str:
    """
    Create a JWT token with custom parameters.
    
    Args:
        data: Data to encode
        expires_delta: Token expiration time
        secret_key: Secret key for encoding (uses settings if not provided)
        algorithm: Algorithm to use (uses settings if not provided)
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    secret = secret_key or settings.SECRET_KEY
    algo = algorithm or settings.ALGORITHM
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret, algorithm=algo)
    
    return encoded_jwt


def create_refresh_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a refresh token for user.
    
    Args:
        user_id: User ID
        expires_delta: Token expiration time (default 7 days)
        
    Returns:
        Encoded refresh token
    """
    if not expires_delta:
        expires_delta = timedelta(days=7)
    
    return create_access_token(
        data={"sub": str(user_id), "type": "refresh"},
        expires_delta=expires_delta
    )


# ============================================================================
# Validation Helpers
# ============================================================================

def validate_user_registration_data(email: str, password: str, full_name: str = None) -> List[str]:
    """
    Validate user registration data.
    
    Args:
        email: Email address
        password: Password
        full_name: Full name
        
    Returns:
        List of validation errors (empty if valid)
    """
    errors = []
    
    # Email validation
    if not email:
        errors.append("Email không được để trống")
    elif not validate_email(email):
        errors.append("Email không hợp lệ")
    
    # Password validation
    password_validation = validate_password_strength(password)
    if not password_validation["is_valid"]:
        errors.extend(password_validation["issues"])
    
    # Full name validation
    if full_name:
        if len(full_name) < 2:
            errors.append("Họ tên phải có ít nhất 2 ký tự")
        if len(full_name) > 100:
            errors.append("Họ tên không được vượt quá 100 ký tự")
    
    return errors


def sanitize_user_input(text: str, max_length: int = 255) -> str:
    """
    Sanitize user input (basic XSS prevention).
    
    Args:
        text: Text to sanitize
        max_length: Maximum length
        
    Returns:
        Sanitized text
    """
    if not text:
        return ""
    
    # Remove HTML tags and limit length
    text = text.strip()[:max_length]
    
    # Simple HTML entity encoding
    text = (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#x27;"))
    
    return text


# ============================================================================
# Pagination and List Utilities
# ============================================================================

def paginate_query(query, skip: int = 0, limit: int = 10):
    """
    Apply pagination to a database query.
    
    Args:
        query: SQLAlchemy query object
        skip: Number of items to skip
        limit: Number of items to return
        
    Returns:
        Paginated query
    """
    if skip < 0:
        skip = 0
    if limit < 1:
        limit = 10
    if limit > 100:
        limit = 100
    
    return query.offset(skip).limit(limit)


def count_query(query) -> int:
    """
    Count total items in a query.
    
    Args:
        query: SQLAlchemy query object
        
    Returns:
        Total count
    """
    return query.count()

