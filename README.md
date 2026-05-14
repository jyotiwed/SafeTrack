# SafeTrack

SafeTrack is an emergency response and disaster management platform built to support incident prediction, risk analytics, resource planning, and operations coordination.

The repository includes:

- `backend/` — FastAPI backend, async SQLAlchemy models, Redis cache, authentication, and prediction endpoints.
- `safetrack-frontend/` — React + Vite frontend with mapping, dashboards, task workflows, and analytics.
- `ml_models/` — Pretrained machine learning models for disaster risk and incident severity prediction.

---

## Key Features

- AI-powered incident and resource demand predictions
- Geo-enabled risk analytics using map visualizations
- Emergency contact, task, and guideline management
- User authentication and role-based access
- File upload support for assets and reports
- Redis cache initialization and async performance optimization

## Tech Stack

- Backend: FastAPI, SQLAlchemy (async), Alembic, Redis, Postgres / asyncpg
- Frontend: React, Vite, Tailwind CSS, Leaflet, React Router, TanStack Query
- ML: scikit-learn, joblib

## Repository Structure

- `backend/`
  - `app/` — API routes, services, models, schemas, and utilities
  - `alembic/` — database migration configuration
  - `requirements.txt` — Python dependencies
  - `.env` — environment variables for local development
- `safetrack-frontend/`
  - `src/` — React application source code
  - `package.json` — npm scripts and frontend dependencies
- `ml_models/` — saved ML model artifacts used by the backend

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd emergecy
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy the `.env` file or create a new one with the required settings. Example values are already provided in `backend/.env`.

Required variables:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/safetrack
REDIS_URL=redis://localhost:6379/0
PROJECT_NAME=SafeTrack
JWT_SECRET_KEY=your-secret-key
JWT_REFRESH_SECRET_KEY=your-refresh-secret-key
BACKEND_CORS_ORIGINS=http://localhost:5173
```

Optional S3 configuration:

```env
S3_ENDPOINT_URL=http://localhost:9000
S3_ACCESS_KEY_ID=local-minio-key
S3_SECRET_ACCESS_KEY=local-minio-secret
S3_BUCKET_NAME=safetrack-media
S3_USE_SSL=false
```

### 4. Run database migrations

```bash
alembic upgrade head
```

If you are using a fresh Postgres database, ensure it exists before migrating.

### 5. Start the backend server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API docs will be available at:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

### 6. Frontend setup

Open a new terminal window and run:

```bash
cd safetrack-frontend
npm install
npm run dev
```

The React app will usually run at:

- `http://localhost:5173`

## Testing

### Backend tests

From the `backend/` directory:

```bash
pytest
```

### Frontend tests

From the `safetrack-frontend/` directory:

```bash
npm run test
```

## Notes

- `backend/.env` contains development settings and local service URLs.
- `backend/ml_models/` holds the trained model artifacts used by the backend prediction routes.
- The backend exposes a Redis health endpoint at `/debug/redis` for local diagnostic checks.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Push to your branch
5. Open a pull request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
