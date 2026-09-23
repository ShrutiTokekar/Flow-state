<div align="center">

<img src="/frontend/public/Logo.png" alt="Flow State Logo" width="140"/>

# Flow State
### Tasks, shared calendars and free time, in one place

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6db33f?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-iOS-119eff?style=flat-square&logo=capacitor)](https://capacitorjs.com)

**[flowstatemanage.com](https://flowstatemanage.com)**

</div>

---

## About

Flow State is a full-stack productivity app for keeping track of tasks, planning your week, and planning with other people. Share a calendar with roommates, a study group or a team using one link or an email invite, then let Flow State find the times when everyone is free. Reminders arrive by email and in the app, on desktop or phone.

Built with React + TypeScript on the frontend and Spring Boot + PostgreSQL on the backend, in a playful, handcrafted design.

---

## Features

### Tasks
- **Task board**: To Do, In Progress and Done columns, with one column at a time on phones
- **Quick add**: type a task and press Enter
- **Priorities, due dates and categories**, with overdue tasks sorted to the top
- **Search and filters** by text, category and priority; stat tiles filter the board
- **Categories page**: progress, open/done/overdue counts and a preview of each category's tasks

### Calendar
- **Month, week and day views**; events are drawn at their real start and length, overlaps sit side by side, and a line marks the current time
- **Apple Calendar export**: download events and task deadlines as an `.ics` file

### Shared calendars
- **Create a calendar** for roommates, classmates, a team or family
- **Invite by email**: add several people at once. Each gets an email with their own join link, and you get a confirmation email
- **Or share one link** that anyone can use to join; reset it at any time
- **Roles**: the owner decides who can edit and who can only view
- **Shared to-dos**: members add events and tasks and check them off for everyone
- **Activity notifications** when someone joins, adds an item or checks one off

### Free time finder
- Lists your open slots for the week and shades them on the calendar
- On a shared calendar, finds times when **every member** is free, showing only free/busy (never what anyone's other events are)
- Tap a free slot to plan something there

### Notifications, reminders & email
- **Reminders** on any task with a due date, sent in the app or by app + email
- **Automatic alerts** when a task is due within 24 hours and when it becomes overdue (email alerts can be turned off in Profile)
- **Notification bell** that works on desktop and mobile; tap a notification to open what it's about
- **Account emails**: a welcome email with a confirm-your-email link on sign-up. Google sign-ins are confirmed automatically and get emails at their Google address

### Accounts
- Email + password sign-up, or **Sign in with Google**
- JWT authentication

### Web, mobile and iOS
- **Landing page** that explains the product to new visitors
- **Responsive design**: sidebar on desktop, bottom tab bar and bottom-sheet dialogs on phones, safe-area support
- **iOS app shell** built with Capacitor (see [iOS App](#ios-app-app-store))

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Create React App (react-scripts) | Build tool |
| Tailwind CSS | Styling |
| React Router | Navigation |
| TanStack Query | Data fetching & caching |
| Zustand | Auth state |
| Axios | HTTP client |
| Capacitor | iOS app |

### Backend
| Technology | Purpose |
|---|---|
| Spring Boot 3.2 (Java 17) | Backend framework |
| Spring Security + JWT | Auth & authorization |
| OAuth2 | Google login |
| Spring Data JPA | Database ORM |
| PostgreSQL | Database |
| Spring Scheduling | Reminders and deadline alerts |
| Resend | Transactional email |
| Maven | Build tool |

---

## API Reference

All endpoints except auth, the invite preview and email verification require a `Bearer` token.

### Auth & account
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register (sends welcome + confirm-email) |
| POST | `/api/auth/login` | Log in with email/password |
| GET | `/oauth2/authorization/google` | Log in with Google |
| POST | `/api/auth/verify-email` | Confirm email (`{token}` from the email link) |
| GET / PUT | `/api/users/me` | Current user / update profile |
| POST | `/api/users/me/resend-verification` | Resend the confirmation email |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats` | Task statistics |

### Reminders & notifications
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/reminders` | Set a task's reminder (`{taskId, minutesBefore, reminderType: IN_APP \| BOTH}`) |
| GET | `/api/reminders/task/:taskId` | A task's reminders |
| GET | `/api/notifications` | My notifications |
| GET | `/api/notifications/unread/count` | Unread count |
| PUT | `/api/notifications/:id/read` | Mark read |
| PUT | `/api/notifications/mark-all-read` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete |

### Personal calendar
| Method | Endpoint | Description |
|---|---|---|
| GET / POST | `/api/calendar/events` | List / create events |
| PUT / DELETE | `/api/calendar/events/:id` | Update / delete event |
| GET | `/api/calendar/export/ics` | Apple Calendar export |
| GET | `/api/calendar/free-time` | My free time (`from`, `to`, `dayStart`, `dayEnd`, `minMinutes`) |

### Shared calendars
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/calendars` | Calendars I belong to |
| POST | `/api/calendars` | Create calendar (`{name, color}`) |
| GET / PUT / DELETE | `/api/calendars/:id` | Details, members & pending invites / rename / delete (owner) |
| POST | `/api/calendars/:id/invites` | Invite by email (`{emails: [...]}`, owner) |
| DELETE | `/api/calendars/:id/invites/:inviteId` | Cancel an invite (owner) |
| POST | `/api/calendars/:id/share-link` | Reset the share link (owner) |
| GET | `/api/calendars/invite/:token` | Public invite preview |
| POST | `/api/calendars/invite/:token/join` | Join (share link or email invite) |
| PUT / DELETE | `/api/calendars/:id/members/:userId` | Change role (owner) / remove member or leave |
| GET / POST | `/api/calendars/:id/events` | List / add events and shared tasks |
| PUT / DELETE | `/api/calendars/:id/events/:eventId` | Edit (e.g. `{completed: true}`) / delete |
| GET | `/api/calendars/:id/free-time` | When every member is free |

### Categories
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | Get all categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category (its tasks are kept) |

---

## Project Structure

```
Flow-state/
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components (layout, tasks, calendar, notifications…)
│   │   ├── pages/          # Route pages (Landing, Dashboard, Calendar, Categories…)
│   │   ├── services/       # API calls (Axios)
│   │   ├── store/          # Zustand auth store
│   │   └── utils/          # Helpers (due dates, icons, redirects)
│   ├── ios/                # Capacitor iOS project
│   └── capacitor.config.json
├── backend/
│   └── src/main/java/com/taskmanager/
│       ├── config/         # Security, JWT, OAuth, CORS
│       ├── controller/     # REST controllers
│       ├── service/        # Business logic, email, schedulers
│       ├── repository/     # JPA repositories
│       ├── model/          # Entities
│       └── dto/            # Request/response shapes
└── Dockerfile              # Backend container build
```

---

## Running Locally

**Backend** (Java 17+, Maven, PostgreSQL)
```bash
cd backend
DATABASE_URL=jdbc:postgresql://localhost:5432/flowstate DB_USER=postgres DB_PASSWORD=postgres \
JWT_SECRET=a-long-random-string FRONTEND_URL=http://localhost:3000 \
mvn spring-boot:run
```
Without `RESEND_API_KEY`, emails aren't sent. The backend logs each email's recipient, subject and links instead, which is handy for testing.

**Frontend**
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8080/api npm start
```

**Tests**
```bash
cd backend && mvn test
```

---

## Environment Variables

`backend/src/main/resources/application.properties` is git-ignored, so in production every setting comes from environment variables. Non-secret hardening defaults (connection pool, timeouts, limits) ship in `application.yml`.

**Backend**
| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection |
| `JWT_SECRET` | Signs login tokens. **Required**, random, at least 32 characters (the server won't start otherwise). Changing it signs everyone out |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_REDIRECT_URI` | Google sign-in |
| `FRONTEND_URL` | Web app URL, used for links in emails and after Google sign-in |
| `CORS_ALLOWED_ORIGINS` | Allowed origins, comma-separated; include `capacitor://localhost` for the iOS app |
| `RESEND_API_KEY` | Resend API key for sending email |
| `MAIL_FROM` | Sender address on a domain verified in Resend, e.g. `notifications@flowstatemanage.com` |
| `TZ` | Server time zone (e.g. `America/New_York`) so reminders go out at the right local time |
| `DB_POOL_SIZE` | Max database connections (default 10); keep below your database's connection limit |
| `SESSION_COOKIE_SECURE` | Leave unset in production; set `false` only for local http development |

> Resend's test sender `onboarding@resend.dev` only delivers to your own Resend account. Verify your domain in Resend before sending to users.

**Frontend** `.env` (Create React App only reads `REACT_APP_*` variables)
```
REACT_APP_API_URL=http://localhost:8080/api      # defaults to https://api.flowstatemanage.com/api
REACT_APP_PUBLIC_URL=https://flowstatemanage.com # used for invite links inside the iOS app
```

---

## Security

- **Authentication**: every `/api` endpoint requires a signed JWT except sign-up/login, email confirmation and invite previews; unknown paths are denied. Unauthenticated calls get `401` (no redirects, no server sessions)
- **Tokens**: HS256 with a required ≥256-bit secret; each token carries a version, so changing your password or "Log out of all devices" revokes existing tokens. Google sign-in hands the token over in the URL fragment, which never reaches server logs
- **Passwords**: bcrypt (cost 12), 8–72 characters, current password required to change it; login errors never reveal whether an account exists
- **Brute force**: per-client rate limits (stricter for login, sign-up and anything that sends email) plus a 15-minute lock on an account after 10 wrong passwords
- **Resource limits**: 256 KB request bodies, bounded database pool with short timeouts and query limits, Tomcat thread/connection caps and idle timeouts, bounded background email queue
- **Headers**: strict CSP, HSTS, `X-Frame-Options: DENY`, `nosniff` on both the API and the website (`frontend/vercel.json`); CORS limited to `CORS_ALLOWED_ORIGINS`
- **Data access**: every task, category, calendar, reminder and notification is checked against the signed-in user

---

## Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel (deploys from `main`) |
| Backend | Northflank (Docker, from the root `Dockerfile`) |
| Database | PostgreSQL |
| Email | Resend |

New tables and columns are created automatically on startup (`spring.jpa.hibernate.ddl-auto=update`).

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
- **Account deletion** must be available in the app (App Store rule 5.1.1(v)); the API doesn't have this yet
- Google sign-in is hidden in the iOS app: Google blocks OAuth inside app web views, and offering it would also require Sign in with Apple (rule 4.8)
- Lock-screen push notifications need Apple Push Notification service (APNs) setup; today the app shows notifications in-app and by email

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
