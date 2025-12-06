# Hệ Thống Dự Báo Deadline AI

## 1. Tổng Quan Dự Án

AI Deadline Forecasting Agent là hệ thống quản lý công việc cá nhân được hỗ trợ bởi trí tuệ nhân tạo, giúp người dùng tự động hóa việc dự báo deadline, phát hiện bottleneck và mô phỏng các kịch bản rủi ro. Đây là ứng dụng quản lý task cá nhân (personal task management), không hỗ trợ phân công công việc cho nhiều người, mỗi người dùng tự quản lý các dự án và task của bản thân mình.

Mục tiêu chính của hệ thống là sử dụng AI để phân tích tiến độ của các task, dự báo nguy cơ trễ deadline, và tự động gửi cảnh báo đến người dùng qua email. Hệ thống được tự động hóa hoàn toàn thông qua các workflow n8n chạy liên tục để theo dõi và phân tích dữ liệu.

Các tính năng chính bao gồm:

- Quản lý dự án (projects) và công việc (tasks) cá nhân
- Sử dụng AI Gemini để phân tích nguy cơ trễ deadline của từng task
- Tự động gửi cảnh báo email khi phát hiện task có rủi ro cao
- Mô phỏng các kịch bản "What-if" để đánh giá tác động của thay đổi
- Theo dõi và lưu trữ lịch sử các dự báo và phân tích của AI
- Dashboard trực quan với biểu đồ thống kê tiến độ
- Hệ thống authentication và phân quyền admin/user

## 2. Kiến Trúc và Công Nghệ

Hệ thống được xây dựng theo kiến trúc Monorepo với các thành phần chính: Frontend, Backend, Database và n8n workflows. Tất cả được deploy trên các nền tảng cloud khác nhau và liên kết với nhau thông qua REST API và webhooks.

Công nghệ sử dụng:

- Frontend: React 18 + Vite + Tailwind CSS
- Backend: FastAPI (Python 3.11+)
- Database: PostgreSQL 14
- Automation: n8n workflows
- AI Engine: Google Gemini 2.5 Flash Lite
- Container: Docker + Docker Compose
- CI/CD: GitHub Actions
- Email: SMTP (Gmail, Mailtrap)

## 3. Chi Tiết Từng Thành Phần

### 3.1. Frontend

Frontend là ứng dụng Single Page Application (SPA) được xây dựng bằng React và Vite, sử dụng Tailwind CSS để styling. Ứng dụng có cấu trúc router-based với các trang chính như Dashboard, Projects, Tasks, Forecasts, Simulations và Admin.

Frontend thực hiện các chức năng:

- Quản lý authentication: đăng nhập, đăng ký, lưu trữ JWT token trong localStorage
- Hiển thị dashboard tổng quan với các biểu đồ thống kê về tiến độ dự án
- Cung cấp giao diện CRUD cho projects và tasks
- Cho phép người dùng cập nhật tiến độ task (progress 0-100%)
- Hiển thị kết quả dự báo rủi ro từ AI (forecast logs)
- Chạy mô phỏng kịch bản và hiển thị kết quả (simulations)
- Xem lịch sử hoạt động của các workflow tự động (automation logs)
- Quản lý người dùng dành cho admin

Frontend giao tiếp với Backend thông qua REST API, sử dụng axios để thực hiện các request HTTP. Mỗi request được tự động gắn JWT token vào header Authorization để xác thực. Khi có lỗi 401 (Unauthorized), hệ thống tự động redirect về trang login.

File cấu hình chính: vite.config.js, tailwind.config.js
Thư viện chính: react-router-dom, axios, recharts, lucide-react
API Service: src/services/api.js

### 3.2. Backend

Backend là REST API server được xây dựng bằng FastAPI framework, tương tác với database PostgreSQL thông qua SQLAlchemy ORM. Backend cung cấp các API endpoint cho Frontend và n8n workflows.

Backend thực hiện các chức năng:

- Authentication và Authorization: đăng ký, đăng nhập bằng JWT, phân quyền user/admin
- CRUD operations cho Projects: user chỉ xem và quản lý dự án của mình
- CRUD operations cho Tasks: task thuộc về project, owner của project là owner của task
- Forecast API: gọi Gemini AI để phân tích rủi ro task, lưu kết quả vào forecast_logs
- Simulation API: mô phỏng kịch bản "What-if" bằng AI và lưu kết quả
- Webhook endpoints: nhận dữ liệu từ n8n workflows và xử lý
- Admin API: chỉ admin mới có quyền xem tất cả dữ liệu và quản lý users

Backend sử dụng SQLAlchemy models để định nghĩa cấu trúc database:

- User: lưu thông tin người dùng (email, password, role)
- Project: lưu thông tin dự án (name, owner_id, start_date, end_date, status)
- Task: lưu thông tin task (name, project_id, status, progress, deadline, priority)
- ForecastLog: lưu kết quả dự báo từ AI (task_id, risk_level, risk_percentage, analysis)
- SimulationLog: lưu kết quả mô phỏng kịch bản
- AutomationLog: lưu lịch sử chạy của n8n workflows

Gemini Service: backend/app/services/gemini_service.py

- Gọi Google Gemini API để phân tích task và dự báo nguy cơ trễ deadline
- Format prompt với thông tin task (progress, deadline, status, priority)
- Parse response JSON từ AI và validate dữ liệu
- Fallback logic khi AI không trả về kết quả hợp lệ

Database Migrations: sử dụng Alembic để quản lý version của database schema
Config: backend/app/config.py lưu các biến environment (DATABASE_URL, GEMINI_API_KEY, SECRET_KEY)

### 3.3. Database

Database sử dụng PostgreSQL 14 để lưu trữ tất cả dữ liệu của hệ thống. Cấu trúc database được quản lý thông qua Alembic migrations trong thư mục backend/alembic/versions.

Các bảng chính trong database:

- users: lưu thông tin người dùng (id, email, username, hashed_password, full_name, role, is_active)
- projects: lưu thông tin dự án (id, name, description, owner_id, start_date, end_date, status)
- tasks: lưu thông tin task (id, project_id, name, description, status, priority, progress, estimated_hours, actual_hours, deadline, last_progress_update)
- forecast_logs: lưu kết quả dự báo AI (id, task_id, risk_level, risk_percentage, predicted_delay_days, analysis, recommendations, created_at)
- simulation_logs: lưu kết quả mô phỏng kịch bản (id, project_id, scenario, affected_task_ids, total_delay_days, analysis, recommendations)
- automation_logs: lưu lịch sử chạy workflow (id, workflow_name, trigger_type, status, input_data, output_data, execution_time_ms)

Relationship quan trọng:

- User có nhiều Projects (1-N)
- Project có nhiều Tasks (1-N)
- Task có nhiều ForecastLogs (1-N)
- Mỗi task thuộc về owner của project chứa nó, không có trường assigned_to

Database được run trong Docker container, expose port 5432, có volume mount để lưu trữ dữ liệu lâu dài (postgres_data).

### 3.4. n8n Workflows

n8n là nền tảng automation workflow được sử dụng để chạy các tác vụ tự động như phân tích task, gửi email cảnh báo, và xử lý các sự kiện hệ thống. Tất cả các workflow được định nghĩa bằng JSON và được import vào n8n instance.

n8n thực hiện các chức năng:

- Chạy các workflow theo lịch trình (cron schedule) hoặc webhook trigger
- Gọi REST API của Backend để lấy dữ liệu tasks, projects, forecasts
- Gọi Google Gemini API để phân tích task và dự báo rủi ro
- Lưu kết quả phân tích vào database thông qua Backend webhooks
- Gửi email cảnh báo đến người dùng khi phát hiện vấn đề
- Xử lý các sự kiện như user registration, task completion, deployment success
- Ghi log hoạt động vào automation_logs thông qua Backend API

n8n được run trong Docker container, expose port 5678, và được truy cập qua web UI để quản lý workflows. Các workflow JSON được lưu trong thư mục n8n-workflows để version control.

## 4. Chi Tiết Các Luồng n8n Workflows

### 4.1. Flow 1 - Progress Forecast (Dự Báo Tiến Độ Nhanh)

Mục đích: Tự động phân tích tất cả các task chưa hoàn thành và dự báo nguy cơ trễ deadline mỗi 1 phút.

Cách thức hoạt động:

1. Cron Trigger chạy mỗi 1 phút (Every 1 minute)
2. HTTP Request gọi Backend API /api/webhooks/n8n/tasks để lấy tất cả các task
3. Function Node lọc ra các task chưa hoàn thành (status != done) và chuẩn bị prompt cho AI
4. IF Node kiểm tra xem có task nào cần phân tích không, nếu không thì dừng flow
5. HTTP Request gọi Google Gemini API với prompt đã chuẩn bị
6. Function Node parse response JSON từ AI, xử lý fallback nếu AI trả về lỗi
7. IF Node kiểm tra xem có kết quả phân tích không
8. HTTP Request lưu từng forecast vào database thông qua Backend webhook /api/webhooks/n8n/forecast-complete
9. Function Node phục hồi dữ liệu sau khi lưu
10. IF Node kiểm tra xem task nào có risk_percentage > 70% (high risk)
11. HTTP Request lấy thông tin email của owner task qua /api/webhooks/n8n/task-owner-email/{task_id}
12. Function Node chuẩn bị dữ liệu cho email cảnh báo
13. Send Email gửi cảnh báo đến owner task về nguy cơ trễ cao
14. HTTP Request log kết quả thực thi workflow vào automation_logs

Liên hệ Backend/Frontend:

- Backend: cung cấp API để lấy tasks, lưu forecast logs, lấy thông tin owner email
- Frontend: hiển thị kết quả forecast trong trang Forecasts, cảnh báo trên Dashboard
- Email: gửi trực tiếp đến email của owner task, không qua Frontend

Input data: Danh sách tất cả tasks từ database
Output data: Forecast logs được lưu vào database, email cảnh báo gửi đến người dùng có task high risk
Frequency: Chạy mỗi 1 phút (có thể điều chỉnh trong production)

### 4.2. Flow 2 - Bottleneck Alert (Cảnh Báo Bottleneck)

Mục đích: Phát hiện các task đang in_progress nhưng không có cập nhật tiến độ trong 2 phút và gửi email cảnh báo đến owner.

Cách thức hoạt động:

1. Cron Trigger chạy mỗi 2 phút (Every 2 minutes)
2. HTTP Request gọi Backend API /api/webhooks/n8n/tasks để lấy tất cả các task
3. Function Node lọc ra các task có status = in_progress nhưng last_progress_update > 2 phút trước
4. Function Node nhóm các stale tasks theo owner_id (để gửi 1 email cho mỗi owner)
5. Split Into Items tách thành các item riêng biệt cho mỗi owner
6. HTTP Request lấy thông tin email của owner qua /api/webhooks/n8n/user-email/{owner_id}
7. Function Node chuẩn bị dữ liệu email với danh sách các task bị stuck
8. IF Node kiểm tra xem có stale tasks không
9. Send Email gửi cảnh báo bottleneck đến owner với danh sách tasks cần quan tâm
10. HTTP Request log kết quả vào automation_logs

Liên hệ Backend/Frontend:

- Backend: cung cấp API để lấy tasks, lấy email owner, ghi automation log
- Frontend: không có liên hệ trực tiếp, owner sẽ update progress sau khi nhận email
- Email: gửi danh sách tasks bị stuck đến owner để remind update tiến độ

Input data: Danh sách tasks có status = in_progress
Output data: Email cảnh báo bottleneck gửi đến owners có tasks bị stuck
Frequency: Chạy mỗi 2 phút
Logic: Task được coi là "stale" nếu last_progress_update > 2 phút trước

### 4.3. Flow 3 - Tự Động Đăng Ký Người Dùng (User Registration Automation)

Mục đích: Tự động gửi email chào mừng và tạo dự án mẫu khi có user mới đăng ký.

Cách thức hoạt động:

1. Webhook Trigger lắng nghe sự kiện POST từ Backend khi có user mới đăng ký (POST /n8n/new-user)
2. Function Node extract dữ liệu user từ webhook body (user_id, email, username, full_name, token)
3. IF Node kiểm tra xem email có hợp lệ không
4. Send Email gửi email chào mừng đến user mới với thông tin đăng nhập và link tới dashboard
5. HTTP Request gọi Backend API /api/projects/demo để tạo project mẫu cho user
6. HTTP Request log kết quả vào automation_logs
7. Webhook Response trả về kết quả cho Backend

Liên hệ Backend/Frontend:

- Backend: gọi webhook n8n sau khi user đăng ký thành công (POST /api/auth/register)
- Backend: nhận request từ n8n để tạo demo project cho user mới
- Frontend: user nhận email và click link để vào dashboard, thấy project mẫu đã được tạo sẵn
- Email: gửi email chào mừng có link tới dashboard và thông tin đăng nhập

Input data: Thông tin user mới (user_id, email, username, full_name)
Output data: Email chào mừng, demo project được tạo trong database
Trigger: Webhook POST từ Backend khi user đăng ký

### 4.4. Flow 4 - Thông Báo CI/CD Deployment (CI/CD Deployment Notification)

Mục đích: Nhận thông báo từ GitHub Actions khi deploy thành công hoặc thất bại, ghi log vào hệ thống và gửi email thông báo đến admin.

Cách thức hoạt động:

**Luồng Deploy Thành Công:**
1. Webhook Trigger lắng nghe sự kiện POST từ GitHub Actions (POST /webhook/deploy-success)
2. Code Node extract dữ liệu deployment (service, status, commit_sha, commit_message, deployed_at, deployed_by, branch)
3. HTTP Request ghi log thông tin deployment vào automation_logs qua Backend API /api/webhooks/n8n/automation-log
4. Code Node chuẩn bị nội dung email HTML với template đẹp, responsive
5. Send Email gửi thông báo deployment thành công đến admin (header màu xanh ✅)
6. Webhook Response trả về JSON response cho GitHub Actions

**Luồng Deploy Thất Bại:**
1. Webhook Trigger lắng nghe sự kiện POST từ GitHub Actions (POST /webhook/deploy-failed)
2. Code Node extract dữ liệu lỗi (service, status, commit_sha, error, failed_at, branch)
3. HTTP Request ghi log lỗi vào automation_logs với error_message
4. Code Node chuẩn bị nội dung email HTML cảnh báo lỗi
5. Send Email gửi thông báo deployment thất bại đến admin (header màu đỏ ❌)
6. Webhook Response trả về JSON response cho GitHub Actions

Liên hệ Backend/Frontend:

- Backend: nhận log từ n8n qua API /api/webhooks/n8n/automation-log, lưu vào bảng automation_logs
- Frontend: admin có thể xem lịch sử deployment trong trang Automation Logs
- GitHub Actions: gọi webhook n8n sau khi deploy (success hoặc failed)
- Email: gửi thông báo đến admin (ADMIN_EMAIL env) với nội dung chi tiết về deployment

Environment Variables cần thiết trong n8n:
- BACKEND_URL: URL của backend API (mặc định: http://backend:8000)
- EMAIL_FROM: Email gửi đi
- ADMIN_EMAIL: Email admin nhận thông báo

Input data: Thông tin deployment (service, status, commit_sha, commit_message, deployed_at, deployed_by, branch, error)
Output data: Log trong automation_logs, email thông báo đến admin
Trigger: Webhook POST từ GitHub Actions CI/CD pipeline (/webhook/deploy-success hoặc /webhook/deploy-failed)

### 4.5. Flow 5 - Tóm Tắt Hằng Ngày (Personal Daily Digest)

Mục đích: Gửi email tóm tắt hằng ngày cho mỗi user về các task sắp tới hạn, quá hạn và đang in progress.

Cách thức hoạt động:

1. Cron Trigger chạy mỗi ngày lúc 8h sáng (Daily 8AM)
2. HTTP Request gọi Backend API /api/webhooks/n8n/tasks để lấy tất cả tasks
3. Function Node phân loại tasks theo owner_id và deadline (overdue, today, upcoming_3days, upcoming_week, in_progress)
4. Split Into Items tách thành các item riêng biệt cho mỗi owner
5. HTTP Request lấy thông tin email của owner qua /api/webhooks/n8n/user-email/{owner_id}
6. Function Node chuẩn bị dữ liệu cho email digest với thống kê và danh sách tasks
7. IF Node kiểm tra xem owner có tasks cần quan tâm không
8. Send Email gửi email digest hằng ngày đến owner với tóm tắt trạng thái tasks
9. HTTP Request log kết quả vào automation_logs

Liên hệ Backend/Frontend:

- Backend: cung cấp API để lấy tasks, lấy email owner
- Frontend: không có liên hệ trực tiếp, email digest giúp user có overview mỗi ngày
- Email: gửi tóm tắt chi tiết về tasks quá hạn, tasks hôm nay, tasks sắp tới, tasks in progress

Input data: Danh sách tất cả tasks trong hệ thống
Output data: Email digest gửi đến mỗi user có tasks pending
Frequency: Chạy mỗi ngày lúc 8h sáng
Content: Tasks quá hạn, tasks hôm nay, tasks 3 ngày tới, tasks trong tuần, tasks đang làm

### 4.6. Flow 6 - Cảnh Báo Deadline Sắp Tới (Deadline Approaching Alert)

Mục đích: Cảnh báo tasks có deadline sắp tới trong vòng 24h hoặc 48h.

Cách thức hoạt động:

1. Cron Trigger chạy mỗi 6 tiếng (Every 6 hours)
2. HTTP Request gọi Backend API /api/webhooks/n8n/tasks để lấy tất cả tasks
3. Function Node lọc ra các task có deadline trong vòng 48h và chưa hoàn thành
4. Function Node phân loại tasks theo mức độ urgent (critical: < 24h, warning: < 48h) và nhóm theo owner
5. Split Into Items tách thành các item riêng biệt cho mỗi owner
6. HTTP Request lấy thông tin email của owner qua /api/webhooks/n8n/user-email/{owner_id}
7. Function Node chuẩn bị dữ liệu email với danh sách tasks urgent
8. IF Node kiểm tra xem có tasks urgent không
9. Send Email gửi cảnh báo deadline approaching đến owner
10. HTTP Request log kết quả vào automation_logs

Liên hệ Backend/Frontend:

- Backend: cung cấp API để lấy tasks, lấy email owner
- Frontend: không có liên hệ trực tiếp, email cảnh báo giúp user không bỏ lỡ deadline
- Email: gửi cảnh báo về tasks có deadline sắp tới kèm theo chi tiết task

Input data: Danh sách tất cả tasks chưa hoàn thành
Output data: Email cảnh báo gửi đến owners có tasks với deadline sắp tới
Frequency: Chạy mỗi 6 tiếng
Logic: Critical nếu deadline < 24h, Warning nếu deadline < 48h

### 4.7. Flow 7 - Đánh Giá Cá Nhân Hằng Tuần (Personal Weekly Review)

Mục đích: Gửi email tóm tắt tuần cho mỗi user với thống kê tasks đã hoàn thành, tasks quá hạn, tasks sắp tới và đánh giá rủi ro.

Cách thức hoạt động:

1. Cron Trigger chạy mỗi Chủ Nhật lúc 7h tối (Sunday 7PM)
2. HTTP Request gọi Backend API /api/webhooks/n8n/tasks để lấy tất cả tasks
3. HTTP Request gọi Backend API /api/webhooks/n8n/forecasts/latest để lấy forecast logs mới nhất
4. Function Node tính toán thống kê tuần cho mỗi owner (tasks hoàn thành tuần này, tasks tạo mới, tasks quá hạn, tasks sắp tới, high risk tasks)
5. Split Into Items tách thành các item riêng biệt cho mỗi owner
6. HTTP Request lấy thông tin email của owner qua /api/webhooks/n8n/user-email/{owner_id}
7. Function Node chuẩn bị dữ liệu email weekly review với thống kê chi tiết và biểu đồ
8. IF Node kiểm tra xem owner có hoạt động trong tuần không
9. Send Email gửi weekly review email đến owner với tóm tắt toàn bộ tuần
10. HTTP Request log kết quả vào automation_logs

Liên hệ Backend/Frontend:

- Backend: cung cấp API để lấy tasks, forecasts, email owner
- Frontend: không có liên hệ trực tiếp, weekly review giúp user có cái nhìn tổng quan
- Email: gửi tóm tắt chi tiết về tiến độ tuần, tasks hoàn thành, rủi ro cao, và khuyến nghị

Input data: Danh sách tasks và forecast logs trong 7 ngày qua
Output data: Email weekly review gửi đến mỗi user
Frequency: Chạy mỗi Chủ Nhật lúc 7h tối
Content: Thống kê tasks (completed, created, overdue, upcoming), high risk tasks, recommendations

### 4.8. Flow 8 - Chúc Mừng Hoàn Thành Task (Task Completion Celebration)

Mục đích: Gửi email chúc mừng khi user hoàn thành task và gợi ý các tasks tiếp theo.

Cách thức hoạt động:

1. Webhook Trigger lắng nghe sự kiện POST từ Backend khi task được đánh dấu là done (POST /n8n/task-completed)
2. HTTP Request lấy thông tin email của owner task qua /api/webhooks/n8n/task-owner-email/{task_id}
3. HTTP Request gọi Backend API /api/webhooks/n8n/tasks để lấy tất cả tasks của owner
4. Function Node tính toán completion rate và chọn 3 tasks tiếp theo nên làm (sắp xếp theo priority và deadline)
5. Function Node chuẩn bị thông điệp động viên dựa trên completion rate (90%+ = excellent, 70%+ = great, 50%+ = good)
6. IF Node kiểm tra xem có email hợp lệ không
7. Send Email gửi email chúc mừng với thống kê và gợi ý tasks tiếp theo
8. HTTP Request log kết quả vào automation_logs
9. Webhook Response trả về kết quả cho Backend

Liên hệ Backend/Frontend:

- Backend: gọi webhook n8n khi user update task status thành done (PATCH /api/tasks/{id})
- Frontend: user click "Mark as Done", Backend gọi n8n, user nhận email chúc mừng
- Email: gửi email chúc mừng kèm theo completion rate, tasks tiếp theo nên làm

Input data: Thông tin task vừa hoàn thành (task_id, actual_hours)
Output data: Email chúc mừng gửi đến owner, gợi ý 3 tasks tiếp theo
Trigger: Webhook POST từ Backend khi task status = done
Logic: Tính completion rate = (tasks done / total tasks) × 100%, sắp xếp tasks tiếp theo theo priority + deadline

---

Tất cả các workflow n8n đều ghi log hoạt động vào bảng automation_logs thông qua Backend API để admin có thể theo dõi và debug. Các email đều được format bằng HTML với styling đẹp và responsive. N8n sử dụng environment variables (BACKEND_API_URL, EMAIL_FROM, SMTP credentials) để kết nối với Backend và email service.

## 5. Deploy, CI/CD và Vận Hành Hệ Thống

### 5.1. Tổng Quan Kiến Trúc Deploy

Hệ thống được deploy trên Google Cloud VM (Compute Engine) sử dụng Docker containers. Kiến trúc triển khai bao gồm:

```
┌─────────────────────────────────────────────────────────────────┐
│                      GOOGLE CLOUD VM                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    NGINX (Reverse Proxy)                     │ │
│  │         Port 80 (HTTP → HTTPS redirect)                      │ │
│  │         Port 443 (HTTPS + SSL/TLS)                           │ │
│  └───────────────────────┬─────────────────────────────────────┘ │
│                          │                                       │
│    ┌─────────────────────┼─────────────────────────────────────┐ │
│    │                     │                             │       │ │
│    ▼                     ▼                             ▼       │ │
│ ┌──────────┐      ┌──────────┐                  ┌──────────┐   │ │
│ │ Frontend │      │ Backend  │                  │   n8n    │   │ │
│ │ (React)  │      │ (FastAPI)│                  │(Workflow)│   │ │
│ │ :80      │      │ :8000    │                  │ :5678    │   │ │
│ └──────────┘      └────┬─────┘                  └────┬─────┘   │ │
│                        │                              │        │ │
│                        └──────────────┬───────────────┘        │ │
│                                       │                        │ │
│                              ┌────────▼────────┐               │ │
│                              │   PostgreSQL    │               │ │
│                              │     :5432       │               │ │
│                              └─────────────────┘               │ │
└─────────────────────────────────────────────────────────────────┘
```

**Các subdomain được sử dụng:**

| Domain | Service | Mô tả |
|--------|---------|-------|
| `ai-deadline.io.vn` | Frontend | Giao diện người dùng (React SPA) |
| `api.ai-deadline.io.vn` | Backend | REST API server (FastAPI) |
| `n8n.ai-deadline.io.vn` | n8n | Workflow automation platform |

### 5.2. Deploy Hoạt Động Như Thế Nào

Quá trình deploy sử dụng Docker Compose với file `docker-compose.prod.yml` để orchestrate tất cả các services. Dưới đây là chi tiết cách hệ thống được khởi động:

**Bước 1: Chuẩn bị môi trường**
- File `.env` chứa các biến môi trường cần thiết (database credentials, API keys, SMTP config)
- SSL certificates được quản lý bởi Let's Encrypt thông qua Certbot container

**Bước 2: Khởi động containers theo thứ tự**
1. **PostgreSQL**: Database được khởi động đầu tiên với health check
2. **Backend (FastAPI)**: Đợi database ready → chạy Alembic migrations → khởi động Uvicorn server
3. **Frontend (React)**: Build static files với Vite → serve qua Nginx container nội bộ
4. **n8n**: Kết nối đến PostgreSQL và Backend API
5. **NGINX Reverse Proxy**: Route traffic đến các services dựa trên subdomain
6. **Certbot**: Tự động renew SSL certificates mỗi 12 giờ

**Bước 3: Deploy script (`deploy.sh`)**

Script `deploy.sh` tự động hóa toàn bộ quy trình:

```bash
./deploy.sh [OPTIONS]

Options:
  --build     Rebuild Docker images
  --migrate   Chạy database migrations
  --seed      Seed dữ liệu mẫu vào database
```

Quy trình deploy script thực hiện:
1. Kiểm tra file `.env` tồn tại
2. Kiểm tra Docker daemon đang chạy
3. Pull code mới nhất từ Git (nếu có)
4. Build Docker images (nếu có flag `--build`)
5. Dừng containers cũ
6. Khởi động services mới với `docker compose up -d`
7. Đợi database sẵn sàng (health check)
8. Chạy migrations (nếu có flag `--migrate`)
9. Seed dữ liệu (nếu có flag `--seed`)
10. Thực hiện health checks cho Backend, Frontend, n8n
11. Hiển thị trạng thái containers

**Bước 4: SSL/TLS với Let's Encrypt**

- SSL certificates được tự động lấy và renew bởi Certbot
- Script `init-ssl.sh` khởi tạo certificates lần đầu
- NGINX tự động reload mỗi 6 giờ để áp dụng certificates mới
- HTTP traffic (port 80) tự động redirect sang HTTPS (port 443)

### 5.3. CI/CD Hoạt Động Như Thế Nào

Hệ thống sử dụng GitHub Actions để tự động hóa quá trình test, build và deploy. Có 2 workflow chính:

#### Workflow 1: `deploy.yml` - Main CI/CD Pipeline

**Triggers:**
- Tự động chạy khi push code lên branch `main`
- Có thể chạy manual qua GitHub Actions UI (workflow_dispatch)

**Pipeline Flow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GITHUB ACTIONS CI/CD                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Push    │───▶│  Test &  │───▶│  Build   │───▶│  Deploy  │              │
│  │  main    │    │   Lint   │    │  Images  │    │   VM     │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                        │                    │
│                                                        ▼                    │
│                                                  ┌──────────┐               │
│                                                  │  Health  │               │
│                                                  │  Check   │               │
│                                                  └──────────┘               │
│                                                        │                    │
│                                                        ▼                    │
│                                                  ┌──────────┐               │
│                                                  │  Notify  │               │
│                                                  │   n8n    │               │
│                                                  └──────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Chi tiết các Jobs:**

1. **test-backend** (Job 1):
   - Setup Python 3.11
   - Install dependencies từ `requirements.txt`
   - Lint code với flake8 (kiểm tra syntax errors, undefined names)
   - Chạy pytest (nếu có test files)

2. **test-frontend** (Job 2):
   - Setup Node.js 20
   - Install dependencies với `npm ci`
   - Lint code với ESLint
   - Build production bundle với Vite

3. **build-images** (Job 3):
   - Chỉ chạy khi push lên `main` và tests pass
   - Build Docker images cho Backend và Frontend
   - Push images lên GitHub Container Registry (ghcr.io)
   - Sử dụng Docker layer caching để tăng tốc build

4. **deploy** (Job 4):
   - Validate các GitHub Secrets đã được cấu hình
   - Setup SSH key để kết nối đến server
   - SSH vào VM và thực hiện:
     - `git pull origin main` để lấy code mới
     - `docker compose build --no-cache` để rebuild images
     - `docker compose up -d --force-recreate` để restart services
     - Health check Backend API qua docker exec
     - Cleanup old Docker images

5. **post-deploy-checks** (Job 5):
   - Health check Frontend (https://ai-deadline.io.vn)
   - Health check Backend API (https://api.ai-deadline.io.vn/health)
   - Health check n8n (https://n8n.ai-deadline.io.vn)
   - Gửi webhook notification đến n8n về kết quả deploy
   - Tạo deployment summary trên GitHub Actions

#### Workflow 2: `pr-checks.yml` - Pull Request Checks

**Triggers:**
- Chạy khi có Pull Request vào các branch: `main`, `develop_1`, `develop_2`

**Jobs:**
1. **backend-checks**: Format (Black), imports (isort), lint (flake8), syntax check
2. **frontend-checks**: ESLint, build check
3. **docker-build-check**: Verify Docker build thành công
4. **pr-summary**: Tổng hợp kết quả checks

#### GitHub Secrets cần thiết

Để CI/CD hoạt động, cần cấu hình các secrets trong GitHub repository:

| Secret | Mô tả |
|--------|-------|
| `SSH_PRIVATE_KEY` | Private SSH key để connect vào server |
| `SERVER_IP` | IP address của VM (ví dụ: 34.126.xxx.xxx) |
| `SERVER_USER` | Username SSH vào server |
| `N8N_WEBHOOK_URL` | URL base của n8n (https://n8n.ai-deadline.io.vn) |

### 5.4. Luồng Thông Báo Deploy (n8n Flow 4)

Khi CI/CD pipeline hoàn thành (thành công hoặc thất bại), GitHub Actions sẽ gọi webhook đến n8n:

**Deploy thành công:**
1. GitHub Actions gọi `POST /webhook/deploy-success` với thông tin commit
2. n8n nhận webhook và log vào automation_logs
3. n8n gửi email thông báo đến admin với template đẹp (header màu xanh ✅)
4. Admin có thể xem lịch sử deploy trong trang Automation Logs

**Deploy thất bại:**
1. GitHub Actions gọi `POST /webhook/deploy-failed` với thông tin lỗi
2. n8n log lỗi vào automation_logs
3. n8n gửi email cảnh báo đến admin (header màu đỏ ❌)
4. Admin nhận thông báo để kịp thời xử lý

### 5.5. Các Script Tiện Ích

| Script | Mục đích |
|--------|----------|
| `start.sh` | Khởi động toàn bộ hệ thống (cho development) |
| `stop.sh` | Dừng tất cả containers |
| `deploy.sh` | Deploy production với options (--build, --migrate, --seed) |
| `init-ssl.sh` | Khởi tạo SSL certificates lần đầu |
| `setup-github-secrets.sh` | Hướng dẫn cấu hình GitHub Secrets |

### 5.6. Quản Lý Containers

**Xem trạng thái:**
```bash
docker compose -f docker-compose.prod.yml ps
```

**Xem logs realtime:**
```bash
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml logs -f backend  # Logs của service cụ thể
```

**Restart services:**
```bash
docker compose -f docker-compose.prod.yml restart
docker compose -f docker-compose.prod.yml restart backend  # Restart service cụ thể
```

**Stop và cleanup:**
```bash
docker compose -f docker-compose.prod.yml down
docker system prune -a  # Xóa unused resources
```

### 5.7. Backup và Restore Database

**Backup:**
```bash
docker exec ai_deadline_db pg_dump -U ai_user ai_deadline > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore:**
```bash
docker exec -i ai_deadline_db psql -U ai_user ai_deadline < backup_file.sql
```

### 5.8. SSL Certificate Renewal

SSL certificates từ Let's Encrypt tự động renew bởi Certbot container:
- Certbot kiểm tra và renew mỗi 12 giờ
- NGINX reload mỗi 6 giờ để áp dụng certificates mới

**Manual renew (nếu cần):**
```bash
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 5.9. Monitoring và Health Checks

**Health check endpoints:**
- Backend: `https://api.ai-deadline.io.vn/health`
- Frontend: `https://ai-deadline.io.vn`
- n8n: `https://n8n.ai-deadline.io.vn`

**Monitor resources:**
```bash
htop                    # CPU, Memory usage
docker stats            # Docker container resources
df -h                   # Disk space
docker ps               # Running containers
```

### 5.10. Troubleshooting Thường Gặp

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Container không start | .env chưa cấu hình | Kiểm tra file `.env`, copy từ `.env.production.example` |
| Database connection failed | PostgreSQL chưa ready | Đợi health check pass, kiểm tra logs `docker logs ai_deadline_db` |
| 502 Bad Gateway | Backend chưa ready | Đợi migrations hoàn thành, kiểm tra `docker logs ai_deadline_backend` |
| SSL Certificate lỗi | Certbot failed | Chạy lại `./init-ssl.sh`, kiểm tra DNS đã trỏ đúng IP |
| CI/CD failed | Missing secrets | Kiểm tra GitHub Secrets đã cấu hình đầy đủ |
| SSH connection refused | Firewall hoặc key sai | Kiểm tra VM đang chạy, firewall allow port 22, SSH key đúng |

### 5.11. Quy Trình Rollback

Nếu deploy có lỗi, rollback về version trước:

```bash
# SSH vào server
ssh user@server_ip

# Xem lịch sử commits
cd /opt/ai-deadline
git log --oneline -5

# Checkout về commit trước
git checkout <previous_commit_sha>

# Rebuild và restart
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### 5.12. Tóm Tắt Quy Trình Deploy End-to-End

```
Developer push code lên main
           │
           ▼
GitHub Actions trigger workflow
           │
           ▼
┌──────────────────────────┐
│  Test Backend & Frontend │
│  - Lint code             │
│  - Run tests             │
│  - Build check           │
└──────────────────────────┘
           │
           ▼ (nếu pass)
┌──────────────────────────┐
│  Build Docker Images     │
│  - Build backend image   │
│  - Build frontend image  │
│  - Push to GHCR          │
└──────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│  Deploy to VM            │
│  - SSH vào server        │
│  - Git pull code mới     │
│  - Docker compose build  │
│  - Docker compose up     │
│  - Health check          │
└──────────────────────────┘
           │
           ▼
┌──────────────────────────┐
│  Post-Deploy Checks      │
│  - Health check services │
│  - Notify n8n webhook    │
│  - Gửi email admin       │
└──────────────────────────┘
           │
           ▼
   ✅ Deploy thành công!
```
