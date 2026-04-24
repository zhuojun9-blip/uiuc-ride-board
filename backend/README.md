# UIUC Ride Board Backend

FastAPI + PostgreSQL backend for the UIUC intercity ride-board platform.

## Setup

### 1. Install PostgreSQL
- macOS: `brew install postgresql` and `brew services start postgresql`
- Linux: `sudo apt-get install postgresql postgresql-contrib`
- Windows: Download installer from postgresql.org

### 2. Create Database
```bash
createdb uiuc_rideboard
```

### 3. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your database URL and settings:
```
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/uiuc_rideboard
SECRET_KEY=your-super-secret-key-change-this
FRONTEND_URL=http://localhost:5173
```

### 6. Run Migrations (Optional - using Alembic)
```bash
alembic upgrade head
```

### 7. Run Server
```bash
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

## API Endpoints

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user profile

### Drivers
- `POST /drivers/` - Create driver listing (requires auth)
- `GET /drivers/` - List all active drivers (optional filter by route)
- `GET /drivers/{id}` - Get specific driver
- `PUT /drivers/{id}` - Update driver listing (owner only)
- `DELETE /drivers/{id}` - De-activate driver listing (owner only)

### Rider Requests
- `POST /requests/` - Create ride request (requires auth)
- `GET /requests/` - List all active requests (optional filter by route)
- `GET /requests/{id}` - Get specific request
- `PUT /requests/{id}` - Update request (owner only)
- `DELETE /requests/{id}` - Cancel request (owner only)

### Driver Applications
- `POST /applications/` - Submit driver application (requires auth)
- `GET /applications/` - List user's applications (requires auth)
- `GET /applications/{id}` - Get specific application (owner only)
- `PUT /applications/{id}` - Update application (owner only)
- `DELETE /applications/{id}` - Delete application (owner only)

### Messages
- `POST /messages/` - Send message (requires auth)
- `GET /messages/inbox` - Get received messages (requires auth)
- `GET /messages/sent` - Get sent messages (requires auth)
- `PUT /messages/{id}/read` - Mark message as read (owner only)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

**Headers required for protected endpoints:**
```
Authorization: Bearer <your_access_token>
```

Usage example with fetch:
```javascript
const response = await fetch('http://localhost:8000/drivers/', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

## Database Models

- **User**: Stores user credentials and profile
- **Driver**: Driver listings with route, vehicle, departure time
- **RiderRequest**: Ride requests posted by riders
- **DriverApplication**: Applications from users wanting to become drivers
- **Message**: User-to-user messages

## Deployment

### Deploy to Railway
```bash
pip install python-dotenv
# Push to GitHub, then link in Railway dashboard
# Railway auto-deploys main branch
```

### Deploy to Render
```bash
# Create account at render.com
# Create new Python Web Service
# Connect GitHub repo
# Set environment variables in dashboard
# Deploy
```

### Deploy to Heroku
```bash
heroku login
heroku create your-app-name
git push heroku main
```

## Environment Variables

See `.env.example` for required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key (use strong random value in production)
- `ALGORITHM`: JWT algorithm (HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time
- `FRONTEND_URL`: Allowed CORS origin
- `DEBUG`: Development mode flag

## Development

### Add new model
1. Create model class in `models.py`
2. Create Pydantic schema in `schemas.py`
3. Create routes in `routes/` folder
4. Include router in `main.py`

### Database migrations with Alembic
```bash
alembic init migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head
```
