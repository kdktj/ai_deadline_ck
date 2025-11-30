"""
Webhooks router - handles callbacks from n8n workflows.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime

from app.database import get_db
from app.models.task import Task
from app.models.forecast_log import ForecastLog, RiskLevel
from app.models.automation_log import AutomationLog, AutomationStatus
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/api/webhooks/n8n", tags=["webhooks"])

# ============================================================
# PUBLIC ENDPOINTS FOR N8N (NO AUTHENTICATION REQUIRED)
# ============================================================

@router.get("/projects")
async def get_projects_for_n8n(db: Session = Depends(get_db)):
    """
    Lấy danh sách tất cả projects cho n8n workflows.
    
    KHÔNG CẦN XÁC THỰC - Endpoint này chỉ dành cho n8n internal calls.
    
    Returns:
        dict: Danh sách projects
    """
    from app.models.project import Project
    from app.models.user import User
    
    projects = db.query(Project).all()
    
    projects_data = []
    for p in projects:
        owner = db.query(User).filter(User.id == p.owner_id).first()
        projects_data.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "owner_id": p.owner_id,
            "owner_name": owner.full_name if owner else None,
            "status": p.status.value,
            "start_date": str(p.start_date) if p.start_date else None,
            "end_date": str(p.end_date) if p.end_date else None,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    
    return {"projects": projects_data, "total": len(projects_data)}

@router.get("/tasks")
async def get_tasks_for_n8n(db: Session = Depends(get_db)):
    """
    Lấy danh sách tất cả tasks cho n8n workflows.
    
    KHÔNG CẦN XÁC THỰC - Endpoint này chỉ dành cho n8n internal calls.
    
    Returns:
        dict: Danh sách tasks
    """
    from app.models.task import Task
    from app.models.user import User
    from app.models.project import Project
    
    tasks = db.query(Task).all()
    
    tasks_data = []
    for t in tasks:
        project = db.query(Project).filter(Project.id == t.project_id).first()
        owner = db.query(User).filter(User.id == project.owner_id).first() if project else None
        
        tasks_data.append({
            "id": t.id,
            "project_id": t.project_id,
            "project_name": project.name if project else None,
            "name": t.name,
            "description": t.description,
            "owner_id": project.owner_id if project else None,
            "owner_name": owner.full_name if owner else None,
            "priority": t.priority.value,
            "status": t.status.value,
            "progress": t.progress,
            "estimated_hours": t.estimated_hours,
            "actual_hours": t.actual_hours,
            "deadline": str(t.deadline) if t.deadline else None,
            "last_progress_update": t.last_progress_update.isoformat() if t.last_progress_update else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None
        })
    
    return {"tasks": tasks_data, "total": len(tasks_data)}

@router.get("/forecasts/latest")
async def get_latest_forecasts_for_n8n(db: Session = Depends(get_db)):
    """
    Lấy forecast logs mới nhất cho n8n workflows.
    
    KHÔNG CẦN XÁC THỰC - Endpoint này chỉ dành cho n8n internal calls.
    
    Returns:
        dict: Danh sách forecast logs
    """
    from app.models.forecast_log import ForecastLog
    from app.models.task import Task
    from sqlalchemy import func
    
    # Get latest forecast for each task
    subquery = db.query(
        ForecastLog.task_id,
        func.max(ForecastLog.created_at).label('max_created')
    ).group_by(ForecastLog.task_id).subquery()
    
    forecasts = db.query(ForecastLog).join(
        subquery,
        (ForecastLog.task_id == subquery.c.task_id) &
        (ForecastLog.created_at == subquery.c.max_created)
    ).all()
    
    forecasts_data = []
    for f in forecasts:
        task = db.query(Task).filter(Task.id == f.task_id).first()
        forecasts_data.append({
            "id": f.id,
            "task_id": f.task_id,
            "task_name": task.name if task else None,
            "risk_level": f.risk_level.value,
            "risk_percentage": f.risk_percentage,
            "predicted_delay_days": f.predicted_delay_days,
            "analysis": f.analysis,
            "recommendations": f.recommendations,
            "created_at": f.created_at.isoformat() if f.created_at else None
        })
    
    return {"forecasts": forecasts_data, "total": len(forecasts_data)}

@router.get("/project-owner-email/{project_id}")
async def get_project_owner_email(project_id: int, db: Session = Depends(get_db)):
    """
    Lấy email của project owner.
    
    KHÔNG CẦN XÁC THỰC - Endpoint này chỉ dành cho n8n internal calls.
    Dùng để n8n có thể gửi email thông báo cho project owner.
    
    Args:
        project_id: ID của project
        db: Database session
        
    Returns:
        dict: Thông tin owner email và project details
        
    Raises:
        HTTPException 404: Nếu project không tồn tại
    """
    from app.models.project import Project
    from app.models.user import User
    
    # Get project
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project ID {project_id} không tồn tại"
        )
    
    # Get owner
    owner = db.query(User).filter(User.id == project.owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy owner cho project ID {project_id}"
        )
    
    return {
        "project_id": project_id,
        "project_name": project.name,
        "owner_id": project.owner_id,
        "owner_email": owner.email,
        "owner_name": owner.full_name or owner.username
    }

@router.get("/task-owner-email/{task_id}")
async def get_task_owner_email(task_id: int, db: Session = Depends(get_db)):
    """
    Lấy email của project owner (người sở hữu task).
    
    KHÔNG CẦN XÁC THỰC - Endpoint này chỉ dành cho n8n internal calls.
    Mỗi task thuộc về một project, và project thuộc về một user.
    Dùng để n8n gửi email cảnh báo cho chính chủ sở hữu task.
    
    Args:
        task_id: ID của task
        db: Database session
        
    Returns:
        dict: Thông tin owner email và task details
        
    Raises:
        HTTPException 404: Nếu task hoặc project không tồn tại
    """
    from app.models.task import Task
    from app.models.user import User
    from app.models.project import Project
    
    # Get task
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task ID {task_id} không tồn tại"
        )
    
    # Get project
    project = db.query(Project).filter(Project.id == task.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project ID {task.project_id} không tồn tại"
        )
    
    # Get project owner (người sở hữu task)
    owner = db.query(User).filter(User.id == project.owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Owner ID {project.owner_id} không tồn tại"
        )
    
    return {
        "task_id": task_id,
        "task_name": task.name,
        "task_status": task.status.value,
        "task_priority": task.priority.value,
        "task_progress": task.progress,
        "task_deadline": str(task.deadline) if task.deadline else None,
        "project_id": task.project_id,
        "project_name": project.name,
        "owner_id": project.owner_id,
        "owner_email": owner.email,
        "owner_name": owner.full_name or owner.username
    }

# ============================================================
# WEBHOOK HANDLERS
# ============================================================

class NewUserWebhook(BaseModel):
    """Schema for new user webhook from n8n"""
    user_id: int
    email_sent: bool = False
    demo_project_created: bool = False

class ForecastCompleteWebhook(BaseModel):
    """Schema for forecast complete webhook from n8n"""
    task_id: int
    risk_level: str
    risk_percentage: float = Field(..., ge=0, le=100)
    predicted_delay_days: int = 0
    ai_analysis: str
    recommendations: Optional[str] = None

class DeploySuccessWebhook(BaseModel):
    """Schema for deployment success webhook from GitHub Actions"""
    service: str  # "frontend" or "backend"
    status: str = "success"
    commit_sha: str
    deployed_at: str

class AutomationLogWebhook(BaseModel):
    """Schema for general automation log webhook"""
    workflow_name: str
    status: str  # "success", "failed", "running"
    input_data: Optional[Any] = None
    output_data: Optional[Any] = None
    error_message: Optional[str] = None
    execution_time_ms: Optional[int] = None

@router.post("/new-user", response_model=MessageResponse)
async def handle_new_user(
    webhook_data: NewUserWebhook,
    db: Session = Depends(get_db)
):
    """
    Nhận thông báo từ n8n sau khi xử lý user mới.
    
    Được gọi từ n8n Flow 3 (User Registration Automation).
    
    Args:
        webhook_data: Thông tin từ n8n
        db: Database session
        
    Returns:
        MessageResponse: Thông báo xác nhận
    """
    # Log automation execution
    log = AutomationLog(
        workflow_name="User Registration Automation",
        status=AutomationStatus.SUCCESS if webhook_data.email_sent and webhook_data.demo_project_created else AutomationStatus.FAILED,
        input_data={"user_id": webhook_data.user_id},
        output_data={
            "email_sent": webhook_data.email_sent,
            "demo_project_created": webhook_data.demo_project_created
        }
    )
    
    db.add(log)
    db.commit()
    
    return MessageResponse(
        message=f"Đã xử lý user ID {webhook_data.user_id} thành công",
        success=True
    )

@router.post("/forecast-complete", response_model=MessageResponse)
async def handle_forecast_complete(
    webhook_data: ForecastCompleteWebhook,
    db: Session = Depends(get_db)
):
    """
    Nhận kết quả forecast từ n8n.
    
    Được gọi từ n8n Flow 1 (Quick Progress Forecast).
    Lưu forecast log vào database.
    
    Args:
        webhook_data: Kết quả forecast từ n8n
        db: Database session
        
    Returns:
        MessageResponse: Thông báo xác nhận
        
    Raises:
        HTTPException 404: Nếu task không tồn tại
        HTTPException 400: Nếu risk_level không hợp lệ
    """
    # Verify task exists
    task = db.query(Task).filter(Task.id == webhook_data.task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task ID {webhook_data.task_id} không tồn tại"
        )
    
    # Validate risk level
    try:
        risk_level_enum = RiskLevel(webhook_data.risk_level)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Risk level không hợp lệ: {webhook_data.risk_level}"
        )
    
    # Create forecast log
    forecast = ForecastLog(
        task_id=webhook_data.task_id,
        risk_level=risk_level_enum,
        risk_percentage=webhook_data.risk_percentage,
        predicted_delay_days=webhook_data.predicted_delay_days,
        analysis=webhook_data.ai_analysis,
        recommendations=webhook_data.recommendations
    )
    
    db.add(forecast)
    
    # Log automation execution
    automation_log = AutomationLog(
        workflow_name="Quick Progress Forecast",
        status=AutomationStatus.SUCCESS,
        input_data={"task_id": webhook_data.task_id},
        output_data={
            "risk_level": webhook_data.risk_level,
            "risk_percentage": webhook_data.risk_percentage
        }
    )
    
    db.add(automation_log)
    db.commit()
    
    return MessageResponse(
        message=f"Đã lưu forecast cho task ID {webhook_data.task_id}",
        success=True
    )

@router.post("/deploy-success", response_model=MessageResponse)
async def handle_deploy_success(
    webhook_data: DeploySuccessWebhook,
    db: Session = Depends(get_db)
):
    """
    Nhận thông báo deploy thành công từ GitHub Actions.
    
    Được gọi từ n8n Flow 6 (CI/CD Deployment Notification).
    
    Args:
        webhook_data: Thông tin deployment
        db: Database session
        
    Returns:
        MessageResponse: Thông báo xác nhận
    """
    # Log automation execution
    log = AutomationLog(
        workflow_name="CI/CD Deployment",
        status=AutomationStatus.SUCCESS if webhook_data.status == "success" else AutomationStatus.FAILED,
        input_data={
            "service": webhook_data.service,
            "commit_sha": webhook_data.commit_sha
        },
        output_data={
            "deployed_at": webhook_data.deployed_at
        }
    )
    
    db.add(log)
    db.commit()
    
    return MessageResponse(
        message=f"Đã ghi nhận deployment {webhook_data.service}",
        success=True
    )

@router.post("/automation-log", response_model=MessageResponse)
async def handle_automation_log(
    webhook_data: AutomationLogWebhook,
    db: Session = Depends(get_db)
):
    """
    Endpoint tổng quát để nhận logs từ bất kỳ n8n workflow nào.
    
    Args:
        webhook_data: Thông tin automation log
        db: Database session
        
    Returns:
        MessageResponse: Thông báo xác nhận
    """
    try:
        status_enum = AutomationStatus(webhook_data.status)
    except ValueError:
        status_enum = AutomationStatus.FAILED
    
    log = AutomationLog(
        workflow_name=webhook_data.workflow_name,
        status=status_enum,
        input_data=webhook_data.input_data,
        output_data=webhook_data.output_data,
        error_message=webhook_data.error_message
    )
    
    db.add(log)
    db.commit()
    
    return MessageResponse(
        message=f"Đã ghi log cho workflow '{webhook_data.workflow_name}'",
        success=True
    )
