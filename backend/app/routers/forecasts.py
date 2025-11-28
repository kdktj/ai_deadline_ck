"""
Forecasts router - handles forecast log retrieval.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.forecast_log import ForecastLog, RiskLevel
from app.schemas.forecast import ForecastResponse, ForecastListResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/forecasts", tags=["forecasts"])

@router.get("", response_model=ForecastListResponse)
async def get_forecasts(
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách các dự báo rủi ro.
    
    User chỉ thấy forecasts của tasks thuộc projects mình sở hữu.
    Admin thấy tất cả.
    
    Args:
        task_id: Lọc theo task ID
        risk_level: Lọc theo mức độ rủi ro (low/medium/high/critical)
        skip: Số lượng bản ghi bỏ qua
        limit: Số lượng bản ghi tối đa
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        ForecastListResponse: Danh sách forecasts và tổng số
    """
    query = db.query(ForecastLog)
    
    # Apply authorization filter
    if current_user.role != "admin":
        # Join with tasks and projects to filter by owner
        query = query.join(Task).join(Project).filter(Project.owner_id == current_user.id)
    else:
        # Admin sees all, but still need to join for task info
        query = query.join(Task)
    
    # Apply filters
    if task_id:
        query = query.filter(ForecastLog.task_id == task_id)
    
    if risk_level:
        try:
            risk_enum = RiskLevel(risk_level)
            query = query.filter(ForecastLog.risk_level == risk_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Mức độ rủi ro không hợp lệ. Chọn: low, medium, high, hoặc critical"
            )
    
    # Order by created_at descending (newest first)
    query = query.order_by(ForecastLog.created_at.desc())
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    forecasts = query.offset(skip).limit(limit).all()
    
    # Enrich response with task names
    forecasts_response = []
    for forecast in forecasts:
        task = db.query(Task).filter(Task.id == forecast.task_id).first()
        task_name = task.name if task else None
        
        forecast_dict = {
            "id": forecast.id,
            "task_id": forecast.task_id,
            "task_name": task_name,
            "risk_level": forecast.risk_level.value,
            "risk_percentage": forecast.risk_percentage,
            "predicted_delay_days": forecast.predicted_delay_days,
            "analysis": forecast.analysis,
            "recommendations": forecast.recommendations,
            "created_at": forecast.created_at
        }
        forecasts_response.append(ForecastResponse(**forecast_dict))
    
    return ForecastListResponse(forecasts=forecasts_response, total=total)

@router.get("/latest", response_model=ForecastListResponse)
async def get_latest_forecasts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy dự báo mới nhất cho tất cả tasks.
    
    Trả về forecast gần nhất cho mỗi task (group by task_id).
    
    Args:
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        ForecastListResponse: Danh sách forecasts mới nhất
    """
    from sqlalchemy import func
    from sqlalchemy.sql import label
    
    # Subquery to get latest forecast ID for each task
    subquery = db.query(
        ForecastLog.task_id,
        func.max(ForecastLog.id).label('max_id')
    ).group_by(ForecastLog.task_id).subquery()
    
    # Get full forecast records
    query = db.query(ForecastLog).join(
        subquery,
        ForecastLog.id == subquery.c.max_id
    ).join(Task)
    
    # Apply authorization filter
    if current_user.role != "admin":
        query = query.join(Project).filter(Project.owner_id == current_user.id)
    
    forecasts = query.all()
    
    # Enrich response
    forecasts_response = []
    for forecast in forecasts:
        task = db.query(Task).filter(Task.id == forecast.task_id).first()
        task_name = task.name if task else None
        
        forecast_dict = {
            "id": forecast.id,
            "task_id": forecast.task_id,
            "task_name": task_name,
            "risk_level": forecast.risk_level.value,
            "risk_percentage": forecast.risk_percentage,
            "predicted_delay_days": forecast.predicted_delay_days,
            "analysis": forecast.analysis,
            "recommendations": forecast.recommendations,
            "created_at": forecast.created_at
        }
        forecasts_response.append(ForecastResponse(**forecast_dict))
    
    return ForecastListResponse(forecasts=forecasts_response, total=len(forecasts_response))