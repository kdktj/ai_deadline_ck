"""
Authentication router - handles user registration, login, logout, and profile endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import timedelta
import httpx
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse, MessageResponse
from app.utils.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Đăng ký tài khoản mới.
    
    Tạo một tài khoản người dùng mới với email và username duy nhất.
    Mật khẩu sẽ được mã hóa trước khi lưu vào database.
    Tự động gọi n8n webhook để gửi email chào mừng.
    
    Args:
        user_data: Thông tin đăng ký (email, username, password, full_name)
        background_tasks: FastAPI background tasks
        db: Database session
        
    Returns:
        UserResponse: Thông tin người dùng đã tạo (không bao gồm mật khẩu)
        
    Raises:
        HTTPException 400: Nếu email hoặc username đã tồn tại
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được sử dụng. Vui lòng chọn email khác."
        )
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác."
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
        password_hash=hashed_password,
        role=UserRole.USER  # Default role is user
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create access token for the new user
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": new_user.id,
            "username": new_user.username,
            "role": new_user.role.value
        },
        expires_delta=access_token_expires
    )
    
    # Trigger n8n webhook in background (Flow 3 - User Registration)
    background_tasks.add_task(
        trigger_n8n_new_user_webhook,
        user_id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name or new_user.username,
        token=access_token
    )
    
    return new_user


async def trigger_n8n_new_user_webhook(
    user_id: int,
    email: str,
    username: str,
    full_name: str,
    token: str
):
    """
    Gọi n8n webhook để trigger Flow 3 (User Registration Automation).
    
    Webhook này sẽ kích hoạt quy trình:
    1. Gửi email chào mừng cho user mới
    2. Tạo demo project tự động
    3. Log automation execution
    
    Args:
        user_id: ID của user mới
        email: Email của user
        username: Username
        full_name: Tên đầy đủ
        token: JWT access token
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Ensure N8N_WEBHOOK_URL doesn't have trailing slash
            base_url = settings.N8N_WEBHOOK_URL.rstrip('/')
            webhook_url = f"{base_url}/webhook/n8n/new-user"
            
            payload = {
                "user_id": user_id,
                "email": email,
                "username": username,
                "full_name": full_name,
                "token": token
            }
            
            print(f"🔔 Triggering n8n webhook: {webhook_url}")
            print(f"   Payload: user_id={user_id}, email={email}")
            
            # Send payload directly without wrapping in "body"
            response = await client.post(webhook_url, json=payload)
            
            if response.status_code == 200:
                print(f"✅ N8N webhook triggered successfully for user {email}")
                print(f"   Response: {response.text[:200] if response.text else 'empty'}")
            else:
                print(f"⚠️ N8N webhook failed with status {response.status_code}")
                print(f"   Response: {response.text[:200] if response.text else 'empty'}")
                
    except Exception as e:
        # Don't fail registration if webhook fails
        print(f"❌ Error triggering N8N webhook: {str(e)}")
        print(f"   User {email} registered successfully but welcome email may not be sent")

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Đăng nhập vào hệ thống.
    
    Xác thực người dùng bằng username/email và mật khẩu.
    Trả về JWT access token nếu đăng nhập thành công.
    
    Args:
        login_data: Thông tin đăng nhập (username/email và password)
        db: Database session
        
    Returns:
        Token: JWT access token và token type
        
    Raises:
        HTTPException 401: Nếu thông tin đăng nhập không chính xác
    """
    user = authenticate_user(db, login_data.username, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "username": user.username,
            "role": user.role.value
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout", response_model=MessageResponse)
async def logout():
    """
    Đăng xuất khỏi hệ thống.
    
    Endpoint này chủ yếu để thông báo cho client xóa token.
    Việc xóa token thực tế được thực hiện ở phía client (localStorage).
    
    Returns:
        MessageResponse: Thông báo đăng xuất thành công
    """
    return {
        "message": "Đăng xuất thành công",
        "success": True
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Lấy thông tin người dùng hiện tại.
    
    Endpoint được bảo vệ, yêu cầu JWT token hợp lệ.
    Trả về thông tin chi tiết của người dùng đang đăng nhập.
    
    Args:
        current_user: Người dùng hiện tại (từ JWT token)
        
    Returns:
        UserResponse: Thông tin người dùng (không bao gồm mật khẩu)
    """
    return current_user

@router.get("/users", response_model=list[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách tất cả người dùng (yêu cầu đăng nhập).
    
    Endpoint được bảo vệ, chỉ người dùng đã đăng nhập mới truy cập được.
    Hữu ích cho việc quản lý team và gán task.
    
    Args:
        skip: Số lượng bản ghi bỏ qua (pagination)
        limit: Số lượng bản ghi tối đa trả về
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        list[UserResponse]: Danh sách người dùng
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users
