<div align="center">

<img src="/frontend/public/Logo.png" alt="Flow State Logo" width="140"/>

# Flow State
### Task Management for the Way You Actually Work

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6db33f?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## About

Flow State is a full-stack task management application designed to help you organize your work and get into a productive rhythm. Built with React + TypeScript on the frontend and Spring Boot on the backend, it features a Kanban board, custom categories, priority levels, and Google OAuth login — all wrapped in a playful, handcrafted design system.

---

## Features

- **Kanban Board** — visual task organization across To Do, In Progress, and Done
- **Task Management** — create, update, delete, and organize tasks with ease
- **Priority Levels** — Low, Medium, High, and Urgent
- **Due Dates** — set and track deadlines
- **Custom Categories** — organize tasks your way
- **Task Statistics** — visual overview of task status at a glance
- **Authentication** — email/password login and Google OAuth
- **Responsive Design** — works on desktop, tablet, and mobile

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| TanStack Query | Data fetching & caching |
| Zustand | State management |
| Tailwind CSS | Styling |
| React Router | Navigation |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| Spring Boot 3.2 | Backend framework |
| Spring Security | Auth & authorization |
| Spring Data JPA | Database ORM |
| PostgreSQL | Production database |
| JWT | Token-based auth |
| OAuth2 | Google login |
| Maven | Build tool |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/oauth2/authorization/google` | Login with Google |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats` | Get task statistics |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

---

## Project Structure

```
flow-state/
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Route pages
│   │   ├── store/          # Zustand state
│   │   ├── hooks/          # TanStack Query hooks
│   │   └── api/            # Axios API calls
│   └── vite.config.ts
├── backend/
│   └── src/main/java/
│       ├── controller/     # REST controllers
│       ├── service/        # Business logic
│       ├── repository/     # JPA repositories
│       ├── model/          # Entity models
│       └── security/       # JWT + OAuth config
└── DEPLOYMENT_GUIDE.md
```

---

## Environment Variables

**Backend** `application.properties`
```
JWT_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=jdbc:postgresql://localhost:5432/flowstate
```

**Frontend** `.env`
```
VITE_API_URL=http://localhost:8080
```

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway |
| Database | Railway PostgreSQL |

See [DEPLOYMENT_GUIDE.md](https://github.com/ShrutiTokekar/Flow-state/blob/main/DEPLOYMENT_GUIDE.md) for full instructions.

---

## Author

**Shruti Tokekar**  
B.S. Computer Science, Minor in Graphic & Web Design — East Stroudsburg University

📧 [shrutitokekar@gmail.com](mailto:shrutitokekar@gmail.com)  
🌐 [shrutitokekar.com](http://shrutitokekar.com)  
💻 [github.com/ShrutiTokekar](https://github.com/ShrutiTokekar)  
🔗 [linkedin.com/in/shruti-tokekar](https://linkedin.com/in/shruti-tokekar)

---

<p align="center">
  <sub>© 2026 Shruti Tokekar · Flow State · All rights reserved.</sub>
</p>
