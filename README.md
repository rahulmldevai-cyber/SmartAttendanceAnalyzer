# 🎓 Intelligent Attendance Pattern Analyzer

> **Full-Stack MERN Application** by **Runtime Rebels**  
> A production-ready, secure, scalable attendance analytics platform for educational institutions.

---

## 📋 Project Overview

The Attendance Pattern Analyzer is an intelligent system that processes and analyzes student attendance data to uncover trends, identify at-risk students, and support data-driven academic decisions. Built with the MERN stack, it features role-based access control, real-time dashboards, and AI-ready architecture.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS, Chart.js, React Router v6 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB + Mongoose (with indexes & aggregation pipelines) |
| **Auth** | JWT (httpOnly cookies + Bearer tokens), bcrypt (12 rounds) |
| **Security** | Helmet, CORS, Rate Limiting, HPP, Mongo Sanitize, XSS Clean |
| **DevOps** | Docker, Docker Compose |
| **Logging** | Winston (file rotation + console) |
| **Email** | Nodemailer (password reset, email verification) |

---

## 🔐 Security Features

- **JWT Authentication** with httpOnly cookies + Bearer token fallback
- **Account lockout** after 5 failed login attempts (2-hour lock)
- **Rate limiting**: 100 req/15min globally, 20 req/15min on auth routes
- **Bcrypt** password hashing (12 salt rounds)
- **Helmet** security headers with custom CSP
- **NoSQL injection prevention** via `express-mongo-sanitize`
- **HTTP Parameter Pollution** prevention via `hpp`
- **CORS** with strict origin whitelist
- **Password reset tokens** hashed with SHA-256, expire in 10 min
- **Email enumeration** protection on forgot-password endpoint
- **Role-based access control** (admin / teacher / student)
- **Soft delete** preserves data integrity
- **Non-root Docker user** in production image

---

## 👥 Role-Based Access

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| Dashboard | ✅ | ✅ | ✅ (own data) |
| Mark Attendance | ✅ | ✅ | ❌ |
| Manage Students | ✅ | ✅ | ❌ |
| Analytics | ✅ | ✅ | ✅ (own only) |
| Reports + Export | ✅ | ✅ | ❌ |
| User Management | ✅ | ❌ | ❌ |
| Delete Records | ✅ | ❌ | ❌ |

---

## 📁 Project Structure

```
attendance-analyzer/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection with pooling
│   │   └── logger.js          # Winston logger with file rotation
│   ├── controllers/
│   │   ├── auth.js            # Register, login, logout, password reset
│   │   ├── students.js        # Student CRUD + bulk import
│   │   ├── attendance.js      # Mark single/bulk, class roster
│   │   └── analytics.js       # Dashboard stats, trends, student details
│   ├── middleware/
│   │   ├── auth.js            # JWT protect + role authorize
│   │   ├── asyncHandler.js    # Eliminate try/catch boilerplate
│   │   ├── errorHandler.js    # Global error handler
│   │   └── validate.js        # express-validator integration
│   ├── models/
│   │   ├── User.js            # Auth model with lockout & token methods
│   │   ├── Student.js         # Student profile with text search index
│   │   └── Attendance.js      # Attendance with compound unique index
│   ├── routes/
│   │   ├── auth.js            # /api/v1/auth/*
│   │   ├── students.js        # /api/v1/students/*
│   │   ├── attendance.js      # /api/v1/attendance/*
│   │   ├── analytics.js       # /api/v1/analytics/*
│   │   ├── reports.js         # /api/v1/reports/*
│   │   └── users.js           # /api/v1/users/* (admin)
│   ├── utils/
│   │   ├── ErrorResponse.js   # Custom error class
│   │   ├── sendEmail.js       # Nodemailer + HTML templates
│   │   └── seeder.js          # Demo data generator
│   ├── validators/
│   │   └── auth.js            # express-validator rules
│   ├── server.js              # App entry point with all middleware
│   ├── .env.example           # Environment variable template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── shared/
│   │   │       ├── Layout.jsx      # Sidebar + header with role nav
│   │   │       ├── Modal.jsx       # Portal-based modal
│   │   │       ├── PageSpinner.jsx # Loading states
│   │   │       └── index.jsx       # StatCard, AttendanceBar, EmptyState, Pagination, ConfirmDialog
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Global auth state + session restore
│   │   ├── hooks/
│   │   │   └── index.js            # useApi, useDebounce, usePagination, useLocalStorage
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Login with demo credentials panel
│   │   │   ├── Register.jsx        # Register + ForgotPassword + ResetPassword
│   │   │   ├── Dashboard.jsx       # Stats + trend chart + at-risk panel
│   │   │   ├── Students.jsx        # Student table with add/edit modal
│   │   │   ├── Attendance.jsx      # Class roster + bulk mark attendance
│   │   │   ├── Analytics.jsx       # Deep dive charts + student-wise table
│   │   │   ├── Reports.jsx         # Filter + generate + CSV export
│   │   │   ├── StudentDetail.jsx   # Individual student analytics + history
│   │   │   ├── Profile.jsx         # Account settings + password change
│   │   │   ├── AdminUsers.jsx      # User management (admin only)
│   │   │   └── NotFound.jsx        # 404 page
│   │   ├── services/
│   │   │   └── api.js              # Axios instance + all API methods
│   │   ├── utils/
│   │   │   └── index.js            # Date, attendance color, CSV helpers
│   │   ├── App.jsx                 # Router + lazy loading + route guards
│   │   ├── main.jsx                # React entry point
│   │   └── index.css              # Tailwind + design system components
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── Dockerfile                      # Multi-stage production build
├── docker-compose.yml              # Local dev with MongoDB
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start everything
git clone <repo-url>
cd attendance-analyzer
docker-compose up --build

# In a new terminal, seed demo data
docker exec attendance_backend node utils/seeder.js
```

Open **http://localhost:3000**

---

### Option 2: Manual Setup

#### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)

#### Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values (MONGO_URI, JWT_SECRET, etc.)

# Seed demo data
npm run seed

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend
npm install

# Configure API URL
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env

# Start development server
npm run dev
```

Open **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | Admin@1234 |
| Teacher | teacher@demo.com | Teacher@1234 |

> Demo data includes 20 students, 5 subjects, and 60 days of attendance records (some students intentionally at-risk for demonstration).

---

## 📡 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/auth/register` | Public | Register user |
| POST | `/api/v1/auth/login` | Public | Login + get JWT |
| POST | `/api/v1/auth/logout` | Private | Clear token |
| GET | `/api/v1/auth/me` | Private | Get current user |
| PUT | `/api/v1/auth/update-password` | Private | Change password |
| POST | `/api/v1/auth/forgot-password` | Public | Send reset email |
| PUT | `/api/v1/auth/reset-password/:token` | Public | Reset password |
| GET | `/api/v1/auth/verify-email/:token` | Public | Verify email |

### Students
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/students` | Admin, Teacher | List with filters & pagination |
| POST | `/api/v1/students` | Admin, Teacher | Create student |
| POST | `/api/v1/students/bulk` | Admin | Bulk import array |
| GET | `/api/v1/students/:id` | All | Get student |
| PUT | `/api/v1/students/:id` | Admin, Teacher | Update student |
| DELETE | `/api/v1/students/:id` | Admin | Soft delete |

### Attendance
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/attendance` | All | List records with filters |
| POST | `/api/v1/attendance` | Admin, Teacher | Mark single record |
| POST | `/api/v1/attendance/bulk` | Admin, Teacher | Mark entire class |
| GET | `/api/v1/attendance/class` | Admin, Teacher | Get class roster |
| PUT | `/api/v1/attendance/:id` | Admin, Teacher | Update record |
| DELETE | `/api/v1/attendance/:id` | Admin | Delete record |

### Analytics
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/analytics/dashboard` | Admin, Teacher | Overview stats + at-risk |
| GET | `/api/v1/analytics/students` | Admin, Teacher | Student-wise percentages |
| GET | `/api/v1/analytics/trends` | All | Weekly/monthly trends |
| GET | `/api/v1/analytics/students/:id` | All | Individual student details |

### Reports
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/reports/attendance` | Admin, Teacher | Full report (JSON or CSV) |
| GET | `/api/v1/reports/at-risk` | Admin, Teacher | At-risk students report |

---

## 🌍 Production Deployment

### Environment Variables for Production

```bash
NODE_ENV=production
MONGO_URI_PROD=mongodb+srv://<user>:<pass>@cluster.mongodb.net/attendance_analyzer
JWT_SECRET=<64-char-random-string>
JWT_EXPIRE=7d
CLIENT_URL=https://yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_EMAIL=noreply@yourdomain.com
SMTP_PASSWORD=<app-specific-password>
```

### Deploy to Railway / Render / Fly.io

```bash
# Build frontend first
cd frontend && npm run build

# Set NODE_ENV=production in your host's env vars
# Deploy backend (it will serve frontend/dist as static files)
```

### Deploy with Docker

```bash
docker build -t attendance-analyzer:prod .
docker run -p 5000:5000 \
  -e NODE_ENV=production \
  -e MONGO_URI_PROD=<your-atlas-uri> \
  -e JWT_SECRET=<your-secret> \
  attendance-analyzer:prod
```

---

## 🔮 Future Scope (from Project Synopsis)

- [ ] **ML Predictive Modeling** — predict future defaulters using scikit-learn
- [ ] **Face Recognition** — auto-attendance via computer vision
- [ ] **Smart Alerts** — automated SMS/email to parents
- [ ] **Mobile App** — React Native iOS/Android app
- [ ] **LMS Integration** — Moodle / Google Classroom sync
- [ ] **Real-time Streaming** — IoT/biometric device integration

---

## 👨‍💻 Team — Runtime Rebels

| Roll | Name |
|------|------|
| 2501730393 | Adarsh Anand |
| 2501730360 | Sagar |
| 2501730394 | Rahul Kumar |
| 2501730407 | Aryan Tiwari |
| 2501730408 | Lakshay Vats |
| 2501730368 | Kuldeep |

**Faculty Mentor:** Mr. Aryan Sharma

---

*Built with ❤️ using the MERN Stack*
