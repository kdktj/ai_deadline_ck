"""
Seed script to populate database with sample data.
Creates users, projects, and tasks for testing.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import datetime, timedelta
from app.database import SessionLocal, engine
from app.models import (
    User, UserRole,
    Project, ProjectStatus,
    Task, TaskStatus, TaskPriority
)
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def seed_data():
    """Seed the database with sample data"""
    db = SessionLocal()
    
    try:
        print("🌱 Starting database seeding...")
        
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("⚠️  Database already has data. Skipping seed.")
            return
        
        # Create users
        print("👥 Creating users...")
        users = [
            User(
                email="nhatquang.lvc@gmail.com",
                username="admin",
                full_name="Admin User",
                password_hash=hash_password("admin123"),
                role=UserRole.ADMIN,
                created_at=datetime.utcnow()
            ),
            User(
                email="quanghn.22it@vku.udn.vn",
                username="quanghn",
                full_name="Huỳnh Nhật Quang",
                password_hash=hash_password("password123"),
                role=UserRole.USER,
                created_at=datetime.utcnow()
            ),
        ]
        
        for user in users:
            db.add(user)
        db.commit()
        print(f"✅ Created {len(users)} users")
        
        # Create projects
        print("📁 Creating projects...")
        today = datetime.utcnow()
        projects = [
            Project(
                name="Thi chuyên đề 3 - AI Deadline Forecasting",
                description="Dự án thi chuyên đề 3: Xây dựng hệ thống quản lý deadline với AI dự đoán rủi ro",
                owner_id=users[1].id,  # Thuộc về quanghn (users[1])
                status=ProjectStatus.ACTIVE,
                start_date=today - timedelta(days=5),
                end_date=today + timedelta(days=25),
                created_at=today - timedelta(days=5),
                updated_at=today
            ),
        ]
        
        for project in projects:
            db.add(project)
        db.commit()
        print(f"✅ Created {len(projects)} projects")
        
        # Create tasks - Mỗi task thuộc về project owner, không có assigned_to
        print("📝 Creating tasks...")
        tasks = [
            # Thi chuyên đề 3 tasks (projects[0] thuộc users[1] - Huỳnh Nhật Quang)
            Task(
                name="GIAI ĐOẠN 1: Setup Project & Database",
                description="Setup Docker, FastAPI, React, PostgreSQL, n8n",
                project_id=projects[0].id,
                status=TaskStatus.DONE,
                priority=TaskPriority.CRITICAL,
                progress=100.0,
                estimated_hours=8.0,
                actual_hours=7.5,
                deadline=today + timedelta(days=2),
                last_progress_update=today - timedelta(hours=12),
                created_at=today - timedelta(days=5)
            ),
            Task(
                name="GIAI ĐOẠN 2: Authentication System",
                description="JWT authentication, user registration, login",
                project_id=projects[0].id,
                status=TaskStatus.DONE,
                priority=TaskPriority.HIGH,
                progress=100.0,
                estimated_hours=6.0,
                actual_hours=6.0,
                deadline=today + timedelta(days=5),
                last_progress_update=today - timedelta(hours=8),
                created_at=today - timedelta(days=4)
            ),
            Task(
                name="GIAI ĐOẠN 3: Core Features - Projects & Tasks",
                description="CRUD projects và tasks, Kanban board",
                project_id=projects[0].id,
                status=TaskStatus.IN_PROGRESS,
                priority=TaskPriority.HIGH,
                progress=75.0,
                estimated_hours=12.0,
                actual_hours=9.0,
                deadline=today + timedelta(days=8),
                last_progress_update=today - timedelta(hours=2),
                created_at=today - timedelta(days=3)
            ),
            Task(
                name="GIAI ĐOẠN 4: AI Integration - Gemini API",
                description="Tích hợp Gemini AI để dự đoán rủi ro deadline",
                project_id=projects[0].id,
                status=TaskStatus.IN_PROGRESS,
                priority=TaskPriority.CRITICAL,
                progress=60.0,
                estimated_hours=10.0,
                actual_hours=7.0,
                deadline=today + timedelta(days=10),
                last_progress_update=today - timedelta(hours=1),
                created_at=today - timedelta(days=2)
            ),
            Task(
                name="GIAI ĐOẠN 5: n8n Workflows",
                description="Tạo 6 workflows automation với n8n",
                project_id=projects[0].id,
                status=TaskStatus.IN_PROGRESS,
                priority=TaskPriority.HIGH,
                progress=50.0,
                estimated_hours=15.0,
                actual_hours=8.0,
                deadline=today + timedelta(days=12),
                last_progress_update=today - timedelta(minutes=30),
                created_at=today - timedelta(days=1)
            ),
            Task(
                name="GIAI ĐOẠN 6: Dashboard & Forecasting",
                description="Dashboard với charts, forecast logs, simulation",
                project_id=projects[0].id,
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM,
                progress=0.0,
                estimated_hours=8.0,
                actual_hours=0.0,
                deadline=today + timedelta(days=15),
                last_progress_update=today - timedelta(days=1),
                created_at=today - timedelta(days=1)
            ),
            Task(
                name="GIAI ĐOẠN 7: Testing & Documentation",
                description="Viết tests, hoàn thiện documentation",
                project_id=projects[0].id,
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM,
                progress=0.0,
                estimated_hours=6.0,
                actual_hours=0.0,
                deadline=today + timedelta(days=18),
                last_progress_update=today - timedelta(days=1),
                created_at=today - timedelta(days=1)
            ),
            Task(
                name="GIAI ĐOẠN 8: Final Deployment & Presentation",
                description="Deploy production, chuẩn bị báo cáo và slide thuyết trình",
                project_id=projects[0].id,
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                progress=0.0,
                estimated_hours=5.0,
                actual_hours=0.0,
                deadline=today + timedelta(days=20),
                last_progress_update=today - timedelta(days=1),
                created_at=today - timedelta(days=1)
            ),
        ]
        
        for task in tasks:
            db.add(task)
        db.commit()
        print(f"✅ Created {len(tasks)} tasks")
        
        print("\n✨ Database seeding completed successfully!")
        print("\n📊 Summary:")
        print(f"   - Users: {len(users)}")
        print(f"   - Projects: {len(projects)}")
        print(f"   - Tasks: {len(tasks)}")
        print("\n🔐 Login credentials:")
        print("   Admin: admin / admin123")
        print("   Email: nhatquang.lvc@gmail.com")
        print("\n   User: quanghn / password123")
        print("   Email: quanghn.22it@vku.udn.vn")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
