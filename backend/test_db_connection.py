"""
Script to test database connection and user creation
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.user import User
from app.utils.auth import get_password_hash

def test_db_connection():
    """Test database connection"""
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def test_user_creation():
    """Test creating a user"""
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check if users table exists
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'users' not in tables:
            print("❌ Users table does not exist. Please run migrations:")
            print("   alembic upgrade head")
            return False
        
        print("✅ Users table exists")
        
        # Try to create a test user
        test_user = User(
            email="test@test.com",
            username="testuser123",
            full_name="Test User",
            password_hash=get_password_hash("test123")
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ Test user created successfully! ID: {test_user.id}")
        
        # Clean up
        db.delete(test_user)
        db.commit()
        print("✅ Test user deleted")
        
        db.close()
        return True
        
    except Exception as e:
        import traceback
        print(f"❌ User creation failed: {str(e)}")
        print("\nFull traceback:")
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("Database Connection Test")
    print("=" * 50)
    print(f"Database URL: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    print()
    
    if not test_db_connection():
        sys.exit(1)
    
    print()
    if not test_user_creation():
        sys.exit(1)
    
    print()
    print("=" * 50)
    print("✅ All tests passed!")
    print("=" * 50)

