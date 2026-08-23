# Cody Richter Cooks

A modern full-stack recipe management application built with FastAPI (backend) and Next.js (frontend).

## Architecture

- **Backend**: FastAPI with PostgreSQL database
- **Frontend**: Next.js with Mantine UI components
- **Authentication**: JWT-based with access/refresh tokens
- **Development**: Docker Compose for backend services

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js v24.x (LTS) — use `nvm use` to select from `.nvmrc`
- npm (>= 10.0.0) or yarn

### 1. Backend Setup

```bash
# Start backend services (database + API)
./scripts/local/start.sh

# Run local database migrations
./scripts/local/migrate.sh
```

The backend will be available at `http://localhost:8000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Development Workflow

### Daily Development

1. **Start backend services:**
   ```bash
   ./scripts/local/start.sh
   ```

2. **Start frontend:**
   ```bash
   cd frontend && npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Backend Development

- **View logs:** `docker-compose logs -f backend`
- **Run tests:** `./scripts/local/test.sh`
- **Create migration:** `./scripts/local/migrate-create.sh "Description"`
- **Apply local migrations:** `./scripts/local/migrate.sh`
- **Seed sample recipes:** `./scripts/local/create-test-recipes.sh`

### Frontend Development

- **Build for production:** `npm run build`
- **Lint code:** `npm run lint`

## Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/                # Application code
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── package.json        # Node dependencies
├── scripts/                # Development & deployment scripts
│   ├── local/              # Local environment scripts
│   └── prod/               # Production & GCP deployment scripts
├── infrastructure/         # Database and Cloud Run configs
└── docker-compose.yml      # Docker services
```

## Key Features

### Authentication
- JWT-based authentication with secure token management
- Automatic token refresh
- Protected routes and API endpoints

### Recipe Management
- Create, edit, and delete recipes
- Rich text editor for descriptions
- Ingredient and instruction management
- Recipe search and filtering

### Modern Frontend
- React with TypeScript
- Mantine UI component library
- Optimistic updates for better UX
- Code splitting and lazy loading
- Progressive loading states

### Robust Backend
- FastAPI with automatic API documentation
- PostgreSQL with Alembic migrations
- Comprehensive error handling
- Security audit logging

## Environment Configuration

### Backend (.env in project root or backend/)
```env
SECRET_KEY=your_256_bit_secret_key_here
DATABASE_URL=postgresql://recipe_user:recipe_password@localhost:5432/recipe_db
```

### Frontend (.env.local in frontend/)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NODE_ENV=development
```

## API Documentation

When the backend is running, visit:
- **Interactive docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Testing

### Backend Tests
```bash
# Run all tests
./scripts/local/test.sh

# Run specific test types
./scripts/local/test.sh -t unit
./scripts/local/test.sh -t integration
./scripts/local/test.sh -t api
./scripts/local/test.sh -t security

# Run with coverage
./scripts/local/test.sh -c
```

### Frontend Verification
```bash
cd frontend
npm run lint
npm run build
```

## Deployment

### Production Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│    Cloud Run    │────▶│    Supabase     │
│   (Frontend)    │     │    (Backend)    │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Backend (Google Cloud Run)

**First-time setup:**
```bash
# 1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
# 2. Authenticate
gcloud auth login

# 3. Run setup script (enables required APIs)
./scripts/prod/setup-gcp.sh --project YOUR_PROJECT_ID

# 4. Configure Secret Manager IAM permissions
./scripts/prod/setup-secret-permissions.sh --project YOUR_PROJECT_ID
```

**Deploy:**
```bash
./scripts/prod/deploy.sh --project YOUR_PROJECT_ID
```

**Remote Database Migrations:**
```bash
./scripts/prod/migrate.sh "postgresql://user:password@host:port/dbname"
```

### Frontend (Vercel)
- Optimized for Vercel deployment
- Set `NEXT_PUBLIC_API_BASE_URL` to your Cloud Run URL

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   lsof -i :3000,8000,5432
   ```

2. **Docker issues:**
   ```bash
   ./scripts/local/cleanup.sh --all
   ./scripts/local/build.sh --force
   ```

3. **Database connection:**
   ```bash
   docker-compose logs database
   docker-compose restart database
   ```

### Fresh Start
```bash
# Stop everything and clean up
./scripts/local/stop.sh --cleanup --volumes
./scripts/local/cleanup.sh --all

# Rebuild and restart
./scripts/local/build.sh --force
./scripts/local/start.sh
./scripts/local/migrate.sh

# Start frontend
cd frontend && npm run dev
```

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Update documentation as needed
4. Use the provided development scripts

## Security

- JWT tokens with secure secret key management
- Input validation and sanitization
- SQL injection protection via SQLAlchemy ORM
- CORS configuration for cross-origin requests
- Security audit logging

For detailed script documentation, see [scripts/README.md](scripts/README.md).
