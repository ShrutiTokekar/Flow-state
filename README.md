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
- **Shared Calendars** — create calendars for roommates, study groups or teams and share them with one invite link; members can add events and shared to-dos, and the owner controls who can edit or only view
- **Free Time Finder** — lists your open slots for the week (and highlights them on the calendar); on a shared calendar it finds times when *everyone* is free, without revealing anyone's other events
- **Apple Calendar Export** — download your events and task deadlines as an `.ics` file
- **Landing Page** — a public homepage that explains the product before sign-up
- **Mobile-first** — bottom tab bar, bottom-sheet dialogs and safe-area support on phones; packaged as an iOS app with Capacitor

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

### Shared Calendars
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/calendars` | Calendars I belong to |
| POST | `/api/calendars` | Create calendar (`{name, color}`) |
| GET / PUT / DELETE | `/api/calendars/:id` | Details + members / rename / delete (owner) |
| POST | `/api/calendars/:id/share-link` | Reset invite link (owner) |
| GET | `/api/calendars/invite/:token` | Public invite preview |
| POST | `/api/calendars/invite/:token/join` | Join as editor |
| PUT / DELETE | `/api/calendars/:id/members/:userId` | Change role (owner) / remove member or leave |
| GET / POST | `/api/calendars/:id/events` | List / add events and shared tasks |
| PUT / DELETE | `/api/calendars/:id/events/:eventId` | Edit (e.g. `{completed: true}`) / delete |
| GET | `/api/calendars/:id/free-time` | When every member is free |
| GET | `/api/calendar/free-time` | My free time (`from`, `to`, `dayStart`, `dayEnd`, `minMinutes`) |

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

**Frontend** `.env` (Create React App only reads `REACT_APP_*` variables)
```
REACT_APP_API_URL=http://localhost:8080/api   # defaults to https://api.flowstatemanage.com/api
REACT_APP_PUBLIC_URL=https://flowstatemanage.com  # used for invite links inside the iOS app
```

**Backend CORS**: include `capacitor://localhost` in `CORS_ALLOWED_ORIGINS` so the iOS app can call the API.

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway |
| Database | Railway PostgreSQL |

See [DEPLOYMENT_GUIDE.md](https://github.com/ShrutiTokekar/Flow-state/blob/main/DEPLOYMENT_GUIDE.md) for full instructions.

---

## iOS App (App Store)

The iOS app wraps the React build with [Capacitor](https://capacitorjs.com). The Xcode project lives in `frontend/ios`.

```bash
cd frontend
npm run ios:sync   # build the web app and copy it into the iOS project
npm run ios:open   # open in Xcode, then Product → Archive → Distribute to App Store
```

Before submitting:
- Install full **Xcode** (not just Command Line Tools) and join the **Apple Developer Program**
- In Xcode → Signing & Capabilities, choose your team; bundle ID is `com.flowstatemanage.app`
- Create the app in **App Store Connect**: screenshots, description, privacy policy URL, privacy "nutrition label"
- **Account deletion** must be available in the app (App Store rule 5.1.1(v)); the API does not have this yet
- Google sign-in is hidden in the iOS app: Google blocks OAuth inside app web views, and offering it would also require Sign in with Apple (rule 4.8)

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
