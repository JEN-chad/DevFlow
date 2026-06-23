You are a Principal Software Architect and Senior Full Stack Engineer.

Build a production-grade SaaS application called:

# DevFlow — GitHub Integrated Sprint & Project Management System

DevFlow is a modern collaborative project management platform designed specifically for software development teams.

The platform combines:

- GitHub Repository Management
- Sprint Planning
- Kanban Boards
- Issue Tracking
- Pull Request Monitoring
- Commit Tracking
- Team Collaboration
- Progress Analytics

The system should feel like a lightweight combination of:

- Jira
- GitHub Projects
- Linear
- Trello

--------------------------------------------------
TECH STACK
--------------------------------------------------

Frontend:
- React 19
- Vite
- React Router
- React Query (TanStack Query)
- Tailwind CSS
- Shadcn UI
- React Hook Form
- Zod

Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- GitHub OAuth
- GitHub REST API
- Socket.io

Database:
- MongoDB Atlas

Deployment Ready:
- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

--------------------------------------------------
APPLICATION GOAL
--------------------------------------------------

Allow software teams to:

1. Connect GitHub account
2. Import repositories
3. Create projects
4. Create sprints
5. Manage Kanban boards
6. Assign tasks to team members
7. Monitor commits and pull requests
8. Track sprint progress
9. View productivity analytics
10. Collaborate in real time

--------------------------------------------------
AUTHENTICATION SYSTEM
--------------------------------------------------

Implement:

1. GitHub OAuth Login
2. JWT Authentication
3. Refresh Token Strategy
4. Protected Routes
5. Role Based Access Control

Roles:

OWNER
SCRUM_MASTER
DEVELOPER
VIEWER

Permissions:

OWNER:
- Manage everything

SCRUM_MASTER:
- Manage sprints
- Assign tasks

DEVELOPER:
- Update assigned tasks
- View projects

VIEWER:
- Read-only access

--------------------------------------------------
DATABASE DESIGN
--------------------------------------------------

Create complete Mongoose models.

Users

{
  _id,
  githubId,
  username,
  email,
  avatar,
  role,
  createdAt
}

Projects

{
  _id,
  name,
  description,
  owner,
  members[],
  repositories[],
  status,
  createdAt
}

Repositories

{
  _id,
  githubRepoId,
  name,
  owner,
  url,
  defaultBranch,
  projectId
}

Sprints

{
  _id,
  projectId,
  name,
  goal,
  startDate,
  endDate,
  status,
  velocity
}

Tasks

{
  _id,
  projectId,
  sprintId,
  title,
  description,
  status,
  priority,
  assignee,
  githubIssueNumber,
  estimatedHours,
  completedHours
}

Activities

{
  _id,
  user,
  project,
  action,
  metadata,
  createdAt
}

GitHubIntegrations

{
  _id,
  userId,
  accessToken,
  refreshToken,
  connectedAt
}

--------------------------------------------------
GITHUB INTEGRATION
--------------------------------------------------

Implement:

1. GitHub OAuth
2. Fetch user repositories
3. Repository synchronization
4. Fetch commits
5. Fetch pull requests
6. Fetch contributors
7. Fetch issues
8. Webhook integration

Supported Events:

- push
- pull_request
- issues
- issue_comment
- release

Webhook events should create activity logs automatically.

--------------------------------------------------
PROJECT MANAGEMENT MODULE
--------------------------------------------------

Project Creation

- Create Project
- Edit Project
- Archive Project
- Delete Project

Member Management

- Invite Members
- Remove Members
- Change Roles

Repository Mapping

- Connect Repository
- Disconnect Repository
- Sync Repository

--------------------------------------------------
SPRINT MANAGEMENT
--------------------------------------------------

Sprint Features

- Create Sprint
- Start Sprint
- End Sprint
- Sprint Goals
- Sprint Velocity
- Sprint Burndown Tracking

Sprint States

PLANNED
ACTIVE
COMPLETED

--------------------------------------------------
KANBAN BOARD
--------------------------------------------------

Columns:

BACKLOG
TODO
IN_PROGRESS
REVIEW
DONE

Features:

- Drag and Drop Tasks
- Real-time Updates
- Task Assignment
- Priority Labels
- Story Points
- Sprint Linking

Use:

@hello-pangea/dnd

for drag-and-drop functionality.

--------------------------------------------------
ISSUE TRACKING
--------------------------------------------------

Implement:

Task Creation

Fields:

- title
- description
- assignee
- sprint
- priority
- story points
- status

Priority:

LOW
MEDIUM
HIGH
CRITICAL

Status:

BACKLOG
TODO
IN_PROGRESS
REVIEW
DONE

--------------------------------------------------
REAL-TIME COLLABORATION
--------------------------------------------------

Use Socket.io

Events:

task-created
task-updated
task-moved
member-joined
sprint-created
activity-added

Multiple users should see updates instantly.

--------------------------------------------------
ACTIVITY FEED
--------------------------------------------------

Track all actions:

Examples:

John moved task "Login API"
Sarah opened PR #42
Mike completed task
Repository synchronized
Sprint started

Show chronological activity feed.

--------------------------------------------------
ANALYTICS DASHBOARD
--------------------------------------------------

Create KPI Cards:

- Active Projects
- Active Sprints
- Open Tasks
- Completed Tasks

Charts:

1. Sprint Burndown Chart
2. Task Status Distribution
3. Team Productivity Chart
4. Commit Activity Chart
5. Pull Request Trend Chart

Use:

- Recharts

--------------------------------------------------
NOTIFICATIONS
--------------------------------------------------

Real-time notifications for:

- Task assigned
- Sprint started
- Pull request opened
- Issue created
- Task completed

--------------------------------------------------
UI/UX REQUIREMENTS
--------------------------------------------------

Design inspired by:

- Linear
- Jira
- GitHub
- Vercel Dashboard

Theme:

- Professional SaaS
- Modern Glassmorphism
- Minimal Design
- Dark Mode + Light Mode

Colors:

Primary:
#2563EB

Secondary:
#0F172A

Accent:
#3B82F6

Typography:
Inter

Requirements:

- Responsive Design
- Skeleton Loaders
- Empty States
- Error States
- Toast Notifications

--------------------------------------------------
DASHBOARD PAGES
--------------------------------------------------

Authentication

- Login
- OAuth Callback

Dashboard

- Overview

Projects

- List Projects
- Create Project
- Project Details

Repositories

- Connected Repositories
- Repository Analytics

Sprints

- Sprint Board
- Sprint Details

Tasks

- Kanban Board
- Task Details

Team

- Members
- Roles

Activity

- Activity Feed

Settings

- GitHub Integration
- Profile Settings

--------------------------------------------------
API ARCHITECTURE
--------------------------------------------------

Use:

controllers/
services/
middlewares/
routes/
validators/

Implement:

- Input Validation
- Error Handling
- Rate Limiting
- API Logging
- Security Headers

--------------------------------------------------
SECURITY
--------------------------------------------------

Implement:

- Helmet
- Mongo Sanitization
- XSS Protection
- JWT Security
- OAuth Token Encryption
- Rate Limiting

--------------------------------------------------
PHASE-WISE DEVELOPMENT

PHASE 1:
Authentication + GitHub OAuth

PHASE 2:
Projects + Repository Sync

PHASE 3:
Sprint Management

PHASE 4:
Kanban Board

PHASE 5:
GitHub Webhooks

PHASE 6:
Real-Time Collaboration

PHASE 7:
Analytics Dashboard

PHASE 8:
Notifications

PHASE 9:
Testing

PHASE 10:
Production Deployment

--------------------------------------------------
FINAL REQUIREMENTS
--------------------------------------------------

Generate:

1. Complete folder structure
2. Database schemas
3. API routes
4. Controllers
5. Middleware
6. Frontend pages
7. React components
8. GitHub integration service
9. Webhook handlers
10. Dashboard UI
11. Deployment configuration
12. README.md

Follow enterprise-level architecture, clean code principles, scalability, and production-ready standards.