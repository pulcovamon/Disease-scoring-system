import os
import time
import pymysql
from sqlmodel import SQLModel, create_engine, Session, select
from api.auth.models import User, Auth, Patient
from api.auth.security import hash_password

MYSQL_URL = os.getenv("MYSQL_URL", "mysql+pymysql://root:pass@localhost:3306/scoring_system")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "pass")

engine = create_engine(MYSQL_URL, echo=True)

def wait_for_mysql():
    max_retries = 10
    for i in range(max_retries):
        try:
            conn = pymysql.connect(
                host=MYSQL_HOST,
                user=MYSQL_USER,
                password=MYSQL_PASSWORD,
                port=MYSQL_PORT
            )
            conn.close()
            print("✅ MySQL is ready!")
            return
        except pymysql.err.OperationalError:
            print(f"⏳ Waiting for MySQL... ({i+1}/{max_retries})")
            time.sleep(10)
    raise RuntimeError("❌ MySQL did not become ready in time.")

def init_db():
    wait_for_mysql()
    print("📦 Creating MySQL tables...")
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

        statement = select(User).where(User.email == admin_email)
        result = session.exec(statement).first()

        if not result:
            print(f"👤 Creating default admin user: {admin_email}")
            hashed, salt = hash_password(admin_password)
            admin_user = User(
                first_name="Admin",
                last_name="Default",
                email=admin_email,
                is_approved=True,
                role="admin"
            )
            session.add(admin_user)
            session.commit()
            session.refresh(admin_user)
            admin_login = Auth(
                user_id=admin_user.id,
                hashed_password=hashed.decode(),
                salt=salt
            )
            session.add(admin_login)
            session.commit()
        else:
            print("ℹ️ Admin user already exists.")

if __name__ == "__main__":
    init_db()
