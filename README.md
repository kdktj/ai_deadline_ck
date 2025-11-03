**Link GitHub:** [https://github.com/kdktj/ai_deadline_ck](https://github.com/kdktj/ai_deadline_ck)

**Link Tasks:** [Google Sheets - Task List](https://docs.google.com/spreadsheets/d/19c83uY4hqCLtsqiJcTO_lrO45-BHIwvFY4pdpsbziZ0/edit?usp=sharing)

---

## 🧩 Quy tắc làm việc nhóm

**Cấu trúc nhánh Git:**

* **main** → Nhánh chính, **không ai được động vào**.
* **develop_1** → Nhánh của **anh** (trưởng nhóm / reviewer).
* **develop_2** → Nhánh cho **các thành viên còn lại**.

### 🔧 Cách làm việc

1. Anh code trên **nhánh develop_1**.
2. Các em **checkout từ nhánh develop_2** để code.
3. Khi hoàn thành task → tạo **Pull Request (PR)** vào **nhánh develop_2**.
4. Anh sẽ **review PR**, xem xét **có nên merge hay không**.
5. Miễn sao có **commit lên Git** là được.

### ❓Tại sao lại chia 2 nhánh develop?

* Vì **chưa quen làm việc nhóm**, **chưa thống nhất vai trò** (BE, FE, n8n flow, CI/CD), dễ xảy ra xung đột code.
* Tránh trường hợp **dùng lệnh git sai, code nhầm, gãy nhánh**.
* Anh có **1 nhánh backup an toàn** để đảm bảo **đến hạn vẫn có sản phẩm hoàn chỉnh**.

> Nếu có thắc mắc về quy trình này → **Inbox riêng cho anh**.

---

## ⚠️ Lưu ý quan trọng

* **API**: Mỗi người **tự tạo API** → bỏ vào file `.env` (anh sẽ cấp template).

  * Vì **1 API chỉ free 20–60 request**, nên **không dùng chung**.

* **n8n / Backend**: Khi code, **tự tạo SMTP Gmail của mình** → điền vào `.env`.

* **CI/CD**: Sẽ được triển khai **vào cuối project**.

---

> ✅ Tóm lại: Mục tiêu chính là **commit thường xuyên, giữ nhánh sạch**, và **đảm bảo anh có thể review – merge dễ dàng** để tránh rủi ro gần deadline.


## 🗄️ Bước 1: Setup Database

### 1.1. Tạo PostgreSQL Database

```bash
# Đăng nhập PostgreSQL
psql -U postgres

# Trong psql console:
CREATE DATABASE ai_deadline;
CREATE USER ai_user WITH PASSWORD 'ai_password_123';
GRANT ALL PRIVILEGES ON DATABASE ai_deadline TO ai_user;
\q
```

### 1.2. Kiểm tra kết nối

```bash
psql -U ai_user -d ai_deadline -h localhost
# Nhập password: ai_password_123

---

## 🔧 Bước 2: Setup Backend
```bash
cd ai_deadline_ck/backend
```
### 2.2. Tạo Python Virtual Environment

**Linux/Mac:**

```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

### 2.3. Cài đặt dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 2.4. Tạo file .env

```bash
# Copy từ template
cp ../.env.example .env

# Hoặc tạo file .env với nội dung:
cat > .env << 'EOF'
DATABASE_URL=postgresql://ai_user:ai_password_123@localhost:5432/ai_deadline
SECRET_KEY=your-secret-key-change-in-production-abc123xyz
GEMINI_API_KEY=your_gemini_api_key_here
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URL=http://localhost:5173
N8N_WEBHOOK_URL=http://localhost:5678
EOF
```

### 2.5. Chạy Database Migrations

```bash
# Kiểm tra Alembic config
alembic current

# Chạy migrations (tạo tất cả bảng)
alembic upgrade head

# Kiểm tra
alembic current
# Output: 001 (head)
```

### 2.6. Seed dữ liệu mẫu

```bash
python seed.py
```

**Output mong đợi:**

```
🌱 Starting database seeding...
👥 Creating users...
✅ Created 3 users
📁 Creating projects...
✅ Created 5 projects
📝 Creating tasks...
✅ Created 15 tasks

✨ Database seeding completed successfully!

📊 Summary:
   - Users: 3
   - Projects: 5
   - Tasks: 15

🔐 Login credentials:
   Admin: admin / admin123
   User 1: nguyenvana / password123
   User 2: tranthib / password123
```

### 2.7. Chạy Backend Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Output mong đợi:**

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
🚀 AI Deadline Forecasting Agent v1.0.0 starting up...
📊 Database: localhost:5432/ai_deadline
🌐 CORS enabled for: http://localhost:5173, ...
```

## 💻 Bước 3: Setup Frontend

Mở **terminal mới** (giữ backend chạy ở terminal cũ).

### 3.1. Navigate đến frontend folder

```bash
cd ai_deadline_ck/frontend
```

### 3.2. Cài đặt dependencies

```bash
npm install
```

### 3.3. Tạo file .env (optional)

```bash
# Copy từ template
cp .env.example .env

# Nội dung mặc định:
# VITE_API_URL=http://localhost:8000
```

### 3.4. Chạy Development Server

```bash
npm run dev
```

**Output mong đợi:**

```
VITE v7.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```
