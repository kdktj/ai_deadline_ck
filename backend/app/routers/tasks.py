"""
Tasks router - handles CRUD operations for tasks.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import httpx
import os
import logging

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate, TaskProgressUpdate, TaskResponse, TaskListResponse
from app.schemas.auth import MessageResponse
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


async def notify_task_completed(task_id: int, actual_hours: Optional[float] = None):
    """
    Gửi thông báo đến n8n webhook khi task được hoàn thành.
    Flow 8 - Task Completion Celebration sẽ xử lý và gửi email chúc mừng.
    """
    n8n_webhook_url = os.getenv("N8N_WEBHOOK_URL", "http://n8n:5678")
    webhook_endpoint = f"{n8n_webhook_url}/webhook/n8n/task-completed"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook_endpoint,
                json={
                    "task_id": task_id,
                    "actual_hours": actual_hours
                }
            )
            if response.status_code == 200:
                logger.info(f"Successfully notified n8n about task {task_id} completion")
            else:
                logger.warning(f"n8n webhook returned status {response.status_code}: {response.text}")
    except httpx.RequestError as e:
        # Log error but don't fail the task update
        logger.error(f"Failed to notify n8n about task completion: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error notifying n8n: {str(e)}")


@router.get("", response_model=TaskListResponse)
async def get_tasks(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách tasks của user hiện tại.
    
    User chỉ thấy tasks thuộc projects của mình.
    Admin có thể thấy tất cả tasks.
    
    Args:
        project_id: Lọc theo dự án
        status_filter: Lọc theo trạng thái
        priority: Lọc theo độ ưu tiên
        skip: Số lượng bản ghi bỏ qua
        limit: Số lượng bản ghi tối đa
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        TaskListResponse: Danh sách tasks và tổng số
    """
    query = db.query(Task).join(Project)
    
    # Apply authorization filter
    if current_user.role != "admin":
        # User chỉ xem tasks của projects mình sở hữu
        query = query.filter(Project.owner_id == current_user.id)
    
    # Apply filters
    if project_id:
        query = query.filter(Task.project_id == project_id)
    
    if status_filter:
        try:
            status_enum = TaskStatus(status_filter)
            query = query.filter(Task.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Trạng thái không hợp lệ. Chọn: todo, in_progress, done, hoặc blocked"
            )
    
    if priority:
        try:
            priority_enum = TaskPriority(priority)
            query = query.filter(Task.priority == priority_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Độ ưu tiên không hợp lệ. Chọn: low, medium, high, hoặc critical"
            )
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    tasks = query.offset(skip).limit(limit).all()
    
    # Enrich response with additional data
    tasks_response = []
    for task in tasks:
        # Get project info
        project = db.query(Project).filter(Project.id == task.project_id).first()
        project_name = project.name if project else None
        
        # Get owner name
        owner = db.query(User).filter(User.id == project.owner_id).first() if project else None
        owner_name = owner.full_name if owner else None
        
        task_dict = {
            "id": task.id,
            "name": task.name,
            "description": task.description,
            "project_id": task.project_id,
            "project_name": project_name,
            "owner_name": owner_name,
            "priority": task.priority.value,
            "status": task.status.value,
            "progress": int(task.progress),
            "estimated_hours": task.estimated_hours,
            "actual_hours": task.actual_hours,
            "deadline": task.deadline,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "last_progress_update": task.last_progress_update
        }
        tasks_response.append(TaskResponse(**task_dict))
    
    return TaskListResponse(tasks=tasks_response, total=total)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy thông tin chi tiết một task.
    
    Args:
        task_id: ID của task
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        TaskResponse: Thông tin task
        
    Raises:
        HTTPException 404: Nếu task không tồn tại
        HTTPException 403: Nếu không có quyền truy cập
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy task"
        )
    
    # Check authorization
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if current_user.role != "admin":
        if not project or project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không có quyền truy cập task này"
            )
    
    # Enrich response
    project_name = project.name if project else None
    owner = db.query(User).filter(User.id == project.owner_id).first() if project else None
    owner_name = owner.full_name if owner else None
    
    task_dict = {
        "id": task.id,
        "name": task.name,
        "description": task.description,
        "project_id": task.project_id,
        "project_name": project_name,
        "owner_name": owner_name,
        "priority": task.priority.value,
        "status": task.status.value,
        "progress": int(task.progress),
        "estimated_hours": task.estimated_hours,
        "actual_hours": task.actual_hours,
        "deadline": task.deadline,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "last_progress_update": task.last_progress_update
    }
    
    return TaskResponse(**task_dict)

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tạo task mới cho project của user.
    
    Task tự động thuộc về project owner (current_user phải là owner).
    
    Args:
        task_data: Thông tin task mới
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        TaskResponse: Task vừa tạo
        
    Raises:
        HTTPException 404: Nếu project không tồn tại
        HTTPException 403: Nếu không có quyền tạo task trong project
    """
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == task_data.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy dự án"
        )
    
    if current_user.role != "admin" and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền tạo task trong dự án này"
        )
    
    # Create task - thuộc về project của user
    try:
        new_task = Task(
            name=task_data.name,
            description=task_data.description,
            project_id=task_data.project_id,
            priority=TaskPriority(task_data.priority),
            status=TaskStatus(task_data.status),
            progress=0,
            estimated_hours=task_data.estimated_hours,
            deadline=task_data.deadline
        )
        
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Giá trị không hợp lệ: {str(e)}"
        )
    
    # Build response
    owner = db.query(User).filter(User.id == project.owner_id).first()
    owner_name = owner.full_name if owner else None
    
    task_dict = {
        "id": new_task.id,
        "name": new_task.name,
        "description": new_task.description,
        "project_id": new_task.project_id,
        "project_name": project.name,
        "owner_name": owner_name,
        "priority": new_task.priority.value,
        "status": new_task.status.value,
        "progress": int(new_task.progress),
        "estimated_hours": new_task.estimated_hours,
        "actual_hours": new_task.actual_hours,
        "deadline": new_task.deadline,
        "created_at": new_task.created_at,
        "updated_at": new_task.updated_at,
        "last_progress_update": new_task.last_progress_update
    }
    
    return TaskResponse(**task_dict)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật thông tin task của user.
    
    Args:
        task_id: ID của task
        task_data: Thông tin cập nhật
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        TaskResponse: Task đã cập nhật
        
    Raises:
        HTTPException 404: Nếu task không tồn tại
        HTTPException 403: Nếu không có quyền cập nhật
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy task"
        )
    
    # Check authorization - chỉ project owner mới sửa được
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if current_user.role != "admin":
            if not project or project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không có quyền chỉnh sửa task này"
            )
    
    # Track if task was already done (to avoid duplicate notifications)
    was_done = task.status == TaskStatus.DONE
    
    # Update fields
    update_data = task_data.model_dump(exclude_unset=True)
    
    try:
        if "priority" in update_data:
            update_data["priority"] = TaskPriority(update_data["priority"])
        if "status" in update_data:
            update_data["status"] = TaskStatus(update_data["status"])
        
        # Update progress timestamp if progress changed
        if "progress" in update_data:
            update_data["last_progress_update"] = datetime.utcnow()
        
        for field, value in update_data.items():
            setattr(task, field, value)
        
        db.commit()
        db.refresh(task)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Giá trị không hợp lệ: {str(e)}"
        )
    
    # Notify n8n if task was just completed (status changed to done)
    if not was_done and task.status == TaskStatus.DONE:
        await notify_task_completed(task.id, task.actual_hours)
    
    # Build response
    project_name = project.name if project else None
    owner = db.query(User).filter(User.id == project.owner_id).first() if project else None
    owner_name = owner.full_name if owner else None
    
    task_dict = {
        "id": task.id,
        "name": task.name,
        "description": task.description,
        "project_id": task.project_id,
        "project_name": project_name,
        "owner_name": owner_name,
        "priority": task.priority.value,
        "status": task.status.value,
        "progress": int(task.progress),
        "estimated_hours": task.estimated_hours,
        "actual_hours": task.actual_hours,
        "deadline": task.deadline,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "last_progress_update": task.last_progress_update
    }
    
    return TaskResponse(**task_dict)

@router.patch("/{task_id}/progress", response_model=TaskResponse)
async def update_task_progress(
    task_id: int,
    progress_data: TaskProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cập nhật tiến độ task của user.
    
    Endpoint đặc biệt để cập nhật nhanh tiến độ và timestamp.
    
    Args:
        task_id: ID của task
        progress_data: Tiến độ mới (0-100)
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        TaskResponse: Task đã cập nhật
        
    Raises:
        HTTPException 404: Nếu task không tồn tại
        HTTPException 403: Nếu không có quyền cập nhật
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy task"
        )
    
    # Check authorization
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if current_user.role != "admin":
        if not project or project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không có quyền cập nhật task này"
            )
    
    # Track if task was already done (to avoid duplicate notifications)
    was_done = task.status == TaskStatus.DONE
    
    # Update progress and timestamp
    task.progress = progress_data.progress
    task.last_progress_update = datetime.utcnow()
    
    # Auto-update status based on progress
    task_just_completed = False
    if progress_data.progress == 100 and task.status != TaskStatus.DONE:
        task.status = TaskStatus.DONE
        task_just_completed = True
    elif progress_data.progress > 0 and task.status == TaskStatus.TODO:
        task.status = TaskStatus.IN_PROGRESS
    
    db.commit()
    db.refresh(task)
    
    # Notify n8n if task was just completed
    if task_just_completed and not was_done:
        await notify_task_completed(task.id, task.actual_hours)
    
    # Build response
    project_name = project.name if project else None
    owner = db.query(User).filter(User.id == project.owner_id).first() if project else None
    owner_name = owner.full_name if owner else None
    
    task_dict = {
        "id": task.id,
        "name": task.name,
        "description": task.description,
        "project_id": task.project_id,
        "project_name": project_name,
        "owner_name": owner_name,
        "priority": task.priority.value,
        "status": task.status.value,
        "progress": int(task.progress),
        "estimated_hours": task.estimated_hours,
        "actual_hours": task.actual_hours,
        "deadline": task.deadline,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "last_progress_update": task.last_progress_update
    }
    
    return TaskResponse(**task_dict)

@router.delete("/{task_id}", response_model=MessageResponse)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa task.
    
    Chỉ project owner hoặc admin mới có thể xóa.
    
    Args:
        task_id: ID của task
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        MessageResponse: Thông báo xóa thành công
        
    Raises:
        HTTPException 404: Nếu task không tồn tại
        HTTPException 403: Nếu không có quyền xóa
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy task"
        )
    
    # Check authorization
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if current_user.role != "admin":
        if not project or project.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Không có quyền xóa task này"
            )
    
    task_name = task.name
    db.delete(task)
    db.commit()
    
    return MessageResponse(
        message=f"Đã xóa task '{task_name}' thành công",
        success=True
    )
