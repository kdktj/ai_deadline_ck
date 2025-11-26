"""
Simulations router - handles scenario simulation.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.simulation_log import SimulationLog
from app.schemas.simulation import SimulationRequest, SimulationResponse, SimulationListResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/simulations", tags=["simulations"])

@router.get("", response_model=SimulationListResponse)
async def get_simulations(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy danh sách các mô phỏng kịch bản đã chạy.
    
    User chỉ thấy simulations của projects mình sở hữu.
    Admin thấy tất cả.
    
    Args:
        project_id: Lọc theo project ID
        skip: Số lượng bản ghi bỏ qua
        limit: Số lượng bản ghi tối đa
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        SimulationListResponse: Danh sách simulations và tổng số
    """
    query = db.query(SimulationLog)
    
    # Apply authorization filter
    if current_user.role != "admin":
        query = query.join(Project).filter(Project.owner_id == current_user.id)
    
    # Apply filters
    if project_id:
        query = query.filter(SimulationLog.project_id == project_id)
    
    # Order by simulated_at descending (newest first)
    query = query.order_by(SimulationLog.simulated_at.desc())
    
    # Get total count
    total = query.count()
    
    # Get paginated results
    simulations = query.offset(skip).limit(limit).all()
    
    # Build response
    simulations_response = []
    for sim in simulations:
        sim_dict = {
            "id": sim.id,
            "project_id": sim.project_id,
            "scenario": sim.scenario,
            "affected_task_ids": sim.affected_task_ids or [],
            "total_delay_days": sim.total_delay_days,
            "analysis": sim.analysis,
            "recommendations": sim.recommendations,
            "simulated_at": sim.simulated_at
        }
        simulations_response.append(SimulationResponse(**sim_dict))
    
    return SimulationListResponse(simulations=simulations_response, total=total)

@router.post("/run", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
async def run_simulation(
    simulation_data: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Chạy mô phỏng kịch bản "What-if".
    
    Tạm thời trả về kết quả mock. Trong Phase 4 sẽ tích hợp AI thực tế.
    
    Args:
        simulation_data: Thông tin mô phỏng
        db: Database session
        current_user: Người dùng hiện tại
        
    Returns:
        SimulationResponse: Kết quả mô phỏng
        
    Raises:
        HTTPException 404: Nếu project không tồn tại
        HTTPException 403: Nếu không có quyền truy cập
    """
    # Verify project exists and user has access
    project = db.query(Project).filter(Project.id == simulation_data.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy dự án"
        )
    
    if current_user.role != "admin" and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Không có quyền chạy mô phỏng cho dự án này"
        )
    
    # Get project tasks for context
    tasks = db.query(Task).filter(Task.project_id == project.id).all()
    
    # TODO: Phase 4 - Call AI service for real analysis
    # For now, return mock data
    import random
    
    # Mock affected tasks (randomly select 2-4 tasks)
    affected_task_ids = []
    if len(tasks) > 0:
        num_affected = min(random.randint(2, 4), len(tasks))
        affected_tasks = random.sample(tasks, num_affected)
        affected_task_ids = [t.id for t in affected_tasks]
    
    # Mock delay
    total_delay_days = random.randint(3, 10)
    
    # Mock AI analysis
    analysis = f"""
    Phân tích kịch bản: "{simulation_data.scenario}"
    
    Kết quả mô phỏng:
    - Số tasks bị ảnh hưởng: {len(affected_task_ids)}
    - Tổng thời gian trễ dự kiến: {total_delay_days} ngày
    - Mức độ ảnh hưởng: {'Cao' if total_delay_days > 7 else 'Trung bình' if total_delay_days > 4 else 'Thấp'}
    
    Chi tiết:
    Nếu kịch bản này xảy ra, các task phụ thuộc sẽ bị ảnh hưởng theo chuỗi.
    Thời gian hoàn thành dự án có thể bị đẩy lùi {total_delay_days} ngày.
    
    [Đây là kết quả mô phỏng mock - Phase 4 sẽ tích hợp AI thực tế]
    """
    
    recommendations = f"""
    Khuyến nghị:
    1. Ưu tiên các tasks bị ảnh hưởng nhiều nhất
    2. Xem xét tái phân bổ nguồn lực để giảm rủi ro
    3. Có kế hoạch dự phòng cho các tasks phụ thuộc
    4. Theo dõi sát sao tiến độ các tasks quan trọng
    
    [Khuyến nghị chi tiết sẽ có trong Phase 4]
    """
    
    # Save simulation log
    new_simulation = SimulationLog(
        project_id=simulation_data.project_id,
        scenario=simulation_data.scenario,
        affected_task_ids=affected_task_ids,
        total_delay_days=total_delay_days,
        analysis=analysis.strip(),
        recommendations=recommendations.strip()
    )
    
    db.add(new_simulation)
    db.commit()
    db.refresh(new_simulation)
    
    # Build response
    sim_dict = {
        "id": new_simulation.id,
        "project_id": new_simulation.project_id,
        "scenario": new_simulation.scenario,
        "affected_task_ids": new_simulation.affected_task_ids or [],
        "total_delay_days": new_simulation.total_delay_days,
        "analysis": new_simulation.analysis,
        "recommendations": new_simulation.recommendations,
        "simulated_at": new_simulation.simulated_at
    }
    
    return SimulationResponse(**sim_dict)
