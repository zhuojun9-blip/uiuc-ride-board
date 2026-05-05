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
- `POST /drivers/` - Create driver listing (requires approved driver application)
- `GET /drivers/` - List all active drivers (optional filter by route)
- `GET /drivers/{id}` - Get specific driver
- `PUT /drivers/{id}` - Update driver listing (owner only)
- `DELETE /drivers/{id}` - De-activate driver listing (owner only)

Driver listing behavior (enforced server-side):
- Community drivers must complete SMS verification before posting (`403` if missing)
- `price_per_seat` is editable before confirmation, then locked after any shared ride request reaches `confirmed` or `completed`
- Driver preference tags are predefined-only values

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

Application tier behavior:
- `uiuc_verified` tier: requires `@illinois.edu` email and email verification
- `community` tier: SMS verification is required for posting rides

### Shared Rides
- `POST /shared-rides/` - Create shared ride request (requires auth)
- `GET /shared-rides/mine` - List rider-side shared ride requests
- `GET /shared-rides/driver` - List driver-side shared ride requests
- `PUT /shared-rides/{id}/status` - Update request status with role-based transition checks

Shared ride statuses:
- `pending`, `approved`, `rejected`, `confirmed`, `completed`, `cancelled`

### Reviews
- `POST /reviews/` - Submit a driver rating/review (eligible riders only)
- `GET /reviews/driver/{driver_user_id}` - List reviews for a driver

### Reports
- `POST /reports/` - Submit report about a ride/driver
- `GET /reports/mine` - List reporter's submitted reports
- `GET /reports/admin/all` - Admin report queue
- `PUT /reports/{id}/status` - Admin status update (`open`, `reviewing`, `resolved`)

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
- **SharedRideRequest**: Seat request lifecycle between rider and driver
- **RideReview**: Post-ride rating and feedback records
- **RideReport**: Rider/driver incident reports for admin handling

## Trust and Preferences

Driver trust fields are system-controlled and included in driver responses:
- `driver_tier`, `email_verified`, `sms_verified`, `trust_score`, `trust_level`
- `rating_average`, `rating_count`, `ride_history_count`

Driver-controlled preference tags are restricted to this exact list:
- `Non-smoking`
- `Quiet ride`
- `Music allowed`
- `Pet-friendly`
- `Flexible pickup`

Payload notes:
- Use `preference_tags` (array of strings) in create/update driver listing requests
- Unknown/custom tags are rejected with `400`
- Legacy `labels` remains in schema for backward compatibility, but preference chips are sourced from `preference_tags`

## Demo Data

For periods of low traffic, seed clearly-labeled demo users and listings.

From `backend/`:
```bash
python scripts/manage_demo_data.py refresh --count 8
```

This command:
- Removes existing demo users/listings/applications (`is_demo = true`)
- Creates fresh approved demo driver applications and active demo driver listings

To remove all demo records:
```bash
python scripts/manage_demo_data.py cleanup
```

Default demo password (all seeded demo users):
- `DemoPass123!`

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
