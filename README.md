# Smart Employee & Project Management System

A clean, modern, and responsive Full Stack web application built with **ReactJS** (Frontend) and **Spring Boot 3** (Backend) featuring JWT Authentication, MySQL persistence, and complete Employee and Project management modules.

---

## Technology Stack

### Backend
- **Java**: 21
- **Framework**: Spring Boot 3.3.2
- **Security**: Spring Security 6 with JWT (`io.jsonwebtoken:jjwt-api:0.12.6`)
- **Data & ORM**: Spring Data JPA & Hibernate
- **Database**: MySQL 8+ / 9+
- **Utilities**: Lombok, Jakarta Validation (`@Valid`, `@Email`, etc.)
- **Build Tool**: Maven

### Frontend
- **Framework**: React 18 (Vite)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with Bearer token interceptors
- **Form & Validation**: React Hook Form + Yup schema validation
- **Styling**: Bootstrap 5 + Modern Custom CSS (Glassmorphism & Gradients)
- **Icons**: Lucide React & Bootstrap Icons

---

## Folder Structure

```text
Smart Employee Project Management System/
├── employee-project-management-backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/epms/
│       │   │   ├── config/             # SecurityConfig, DataInitializer
│       │   │   ├── controller/         # Auth, Employee, Project, User, Dashboard Controllers
│       │   │   ├── dto/                # Request & Response DTOs
│       │   │   ├── entity/             # User, Employee, Project Entities & Enums
│       │   │   ├── exception/          # GlobalExceptionHandler & Custom Exceptions
│       │   │   ├── repository/         # JPA Repositories
│       │   │   ├── security/           # JwtUtils, AuthTokenFilter, UserDetailsServiceImpl
│       │   │   └── service/            # Business Logic Services
│       │   └── resources/
│       │       └── application.properties
├── employee-project-management-frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── components/         # Navbar, Sidebar, ProtectedRoute, Loader, Toast, ConfirmModal
│       ├── context/            # AuthContext (JWT & User state)
│       ├── pages/              # Login, Signup, Dashboard, Employees, Projects, Profile
│       ├── services/           # Axios API instance with Interceptors
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
└── README.md
```

---

## Database Configuration

The application is configured to connect to MySQL database `smart_employee_db`.

In `employee-project-management-backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_employee_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=chandu5706
spring.jpa.hibernate.ddl-auto=update
```

---

## How to Run the Application

### 1. Start MySQL Server
Ensure MySQL server is running on `localhost:3306`. Database `smart_employee_db` will be created automatically on startup.

### 2. Run Backend (Spring Boot)
Navigate to the backend directory and launch with Maven:
```bash
cd employee-project-management-backend
mvn spring-boot:run
```
The backend API server will start on `http://localhost:8080`.

### 3. Run Frontend (ReactJS)
In a new terminal window, navigate to the frontend directory and start the Vite dev server:
```bash
cd employee-project-management-frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Default Credentials

On application startup, the backend automatically seeds the default Administrator account:

- **Name**: Administrator User
- **Email**: `admin@gmail.com`
- **Password**: `Admin@123`
- **Role**: `ADMIN`

---

## API Endpoints List

### Authentication Endpoints (Public)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `POST` | `/api/auth/signup` | Register new employee account |

### Dashboard Endpoint (Protected)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Retrieve real-time count metrics |

### Employee Management Endpoints (Protected)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/employees` | Get list of all employees (supports `?search=`) |
| `GET` | `/api/employees/{id}` | Get employee details by ID |
| `POST` | `/api/employees` | Create new employee |
| `PUT` | `/api/employees/{id}` | Update existing employee |
| `DELETE` | `/api/employees/{id}` | Delete employee |

### Project Management Endpoints (Protected)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/projects` | Get list of all projects (supports `?search=`) |
| `GET` | `/api/projects/{id}` | Get project details by ID |
| `POST` | `/api/projects` | Create new project |
| `PUT` | `/api/projects/{id}` | Update existing project |
| `DELETE` | `/api/projects/{id}` | Delete project |

### User Profile Endpoints (Protected)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/users/profile` | Get current user profile |
| `PUT` | `/api/users/profile` | Update profile information |
| `PUT` | `/api/users/change-password` | Change user password |
