# Smart Campus Resource Exchange

Smart Campus Resource Exchange is a full-stack campus sharing platform for students to post, discover, request, lend, and manage academic resources such as books, notes, electronics, and lab equipment.

## Features

- Campus email based signup and login
- Forgot password and reset password flow
- Post, edit, and delete resources
- Resource image support with URL or local image upload
- Search, filter, sort, and paginate marketplace listings
- Borrow requests with duration and optional message
- Owner-side incoming request management
- Accept, reject, cancel, and mark-returned request lifecycle
- Notifications for key account and borrowing events
- Profile page with editable display name and recent activity
- Dashboard with resource, request, and notification summaries
- Dark and light theme toggle

## Tech Stack

### Frontend
- React
- React Router
- Axios
- CSS

### Backend
- Django
- Django REST Framework
- Simple JWT
- SQLite for local development

## Project Structure

```text
smart-campus-exchange/
|-- backend/
|   |-- requirements.txt
|   `-- core/
|       |-- manage.py
|       |-- core/
|       `-- api/
`-- frontend/
    |-- package.json
    `-- src/
```

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd smart-campus-exchange
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd core
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs on:
- `http://127.0.0.1:3000`

Backend runs on:
- `http://127.0.0.1:8000`

## Test Commands

### Backend tests

```bash
cd backend/core
..\venv\Scripts\python.exe manage.py test api
```

### Frontend build

```bash
cd frontend
npm run build
```

### Frontend tests

```bash
cd frontend
npm test -- --runInBand --watchAll=false
```

## Main User Flows

1. Register using an email ending with `nitw.ac.in`
2. Login and create a resource listing
3. Other users browse resources and send borrow requests
4. Resource owner accepts or rejects requests
5. Accepted resources disappear from the marketplace until returned
6. Owner marks the resource as returned to make it available again
7. Users track updates through notifications, dashboard, and profile activity

## Notes

- Password reset emails use Django console email backend in local development
- Local image uploads are stored as data URLs for now
- Deployment configuration is intentionally left for a later step

## Current Status

Core frontend and backend flows are implemented and tested locally.

## Author

Pavan Raj
