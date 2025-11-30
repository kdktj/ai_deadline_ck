"""
Admin router - handles admin operations like user management.
Only accessible by users with admin role.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task, TaskStatus
from app.models.forecast_log import ForecastLog
from app.models.simulation_log import SimulationLog
from app.models.automation_log import AutomationLog
from app.schemas.auth import UserResponse, MessageResponse
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/users", response_model=List[UserResponse])
async def get_all_users_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Lấy danh sách tất cả người dùng (chỉ admin).
    
    Args:
        skip: Số lượng bản ghi bỏ qua (pagination)
        limit: Số lượng bản ghi tối đa trả về
        db: Database session
        current_user: Admin user
        
    Returns:
        list[UserResponse]: Danh sách người dùng
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=dict)
async def get_user_detail_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Lấy thông tin chi tiết của một user (chỉ admin).
    Bao gồm: user info, projects, tasks, stats
    
    Args:
        user_id: ID của user
        db: Database session
        current_user: Admin user
        
    Returns:
        dict: Thông tin chi tiết user
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại"
        )
    
    # Get user's projects
    projects = db.query(Project).filter(Project.owner_id == user_id).all()
    
    # Get user's tasks (through projects)
    project_ids = [p.id for p in projects]
    tasks = db.query(Task).filter(Task.project_id.in_(project_ids)).all() if project_ids else []
    
    # Calculate stats
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t.status == TaskStatus.DONE])
    in_progress_tasks = len([t for t in tasks if t.status == TaskStatus.IN_PROGRESS])
    todo_tasks = len([t for t in tasks if t.status == TaskStatus.TODO])
    
    # Get forecast logs
    task_ids = [t.id for t in tasks]
    high_risk_forecasts = db.query(ForecastLog).filter(
        ForecastLog.task_id.in_(task_ids),
        ForecastLog.risk_level.in_(["high", "critical"])
    ).count() if task_ids else 0
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "created_at": user.created_at
        },
        "projects": [
            {
                "id": p.id,
                "name": p.name,
                "status": p.status,
                "start_date": p.start_date,
                "end_date": p.end_date
            } for p in projects
        ],
        "tasks": [
            {
                "id": t.id,
                "name": t.name,
                "project_id": t.project_id,
                "status": t.status,
                "priority": t.priority,
                "progress": t.progress,
                "deadline": t.deadline
            } for t in tasks
        ],
        "stats": {
            "total_projects": len(projects),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "in_progress_tasks": in_progress_tasks,
            "todo_tasks": todo_tasks,
            "high_risk_forecasts": high_risk_forecasts
        }
    }

@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Xóa một user và tất cả dữ liệu liên quan (chỉ admin).
    
    Cascade delete:
    - Projects (và tasks bên trong project)
    - Tasks (và forecast logs bên trong task)
    - Simulation logs
    - Automation logs liên quan
    
    Args:
        user_id: ID của user cần xóa
        db: Database session
        current_user: Admin user
        
    Returns:
        MessageResponse: Thông báo xóa thành công
    """
    # Prevent admin from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa tài khoản admin hiện tại"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Người dùng không tồn tại"
        )
    
    # Get user data for logging
    username = user.username
    projects_count = db.query(Project).filter(Project.owner_id == user_id).count()
    
    # Delete user (cascade will delete projects, tasks, forecasts, simulations)
    # Note: AutomationLog không có foreign key đến user/project nên không cần xóa
    db.delete(user)
    db.commit()
    
    return {
        "message": f"Đã xóa thành công user '{username}' và {projects_count} projects liên quan",
        "success": True
    }

@router.get("/stats", response_model=dict)
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Lấy thống kê tổng quan của hệ thống (chỉ admin).
    
    Args:
        db: Database session
        current_user: Admin user
        
    Returns:
        dict: Thống kê hệ thống
    """
    # Count users by role
    total_users = db.query(User).count()
    admin_users = db.query(User).filter(User.role == "admin").count()
    normal_users = db.query(User).filter(User.role == "user").count()
    
    # Count projects and tasks
    total_projects = db.query(Project).count()
    total_tasks = db.query(Task).count()
    
    # Count tasks by status
    tasks_by_status = db.query(
        Task.status, func.count(Task.id)
    ).group_by(Task.status).all()
    
    status_counts = {status: count for status, count in tasks_by_status}
    
    # Count forecasts and simulations
    total_forecasts = db.query(ForecastLog).count()
    high_risk_forecasts = db.query(ForecastLog).filter(
        ForecastLog.risk_level.in_(["high", "critical"])
    ).count()
    
    total_simulations = db.query(SimulationLog).count()
    total_automations = db.query(AutomationLog).count()
    
    return {
        "users": {
            "total": total_users,
            "admins": admin_users,
            "normal_users": normal_users
        },
        "projects": {
            "total": total_projects
        },
        "tasks": {
            "total": total_tasks,
            "todo": status_counts.get("todo", 0),
            "in_progress": status_counts.get("in_progress", 0),
            "done": status_counts.get("done", 0)
        },
        "forecasts": {
            "total": total_forecasts,
            "high_risk": high_risk_forecasts
        },
        "simulations": {
            "total": total_simulations
        },
        "automations": {
            "total": total_automations
        }
    }
