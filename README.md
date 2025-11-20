# meta-hackathon-2025

## Prerequisites

Before running this project, make sure you have the following installed:

### uv
[uv](https://github.com/astral-sh/uv) is an extremely fast Python package installer and resolver.

**Installation:**

macOS and Linux:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Windows:
```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Verify installation:
```bash
uv --version
```

### Docker
[Docker](https://www.docker.com/) is required for containerization.

**Installation:**

- **macOS/Windows**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**: Follow the [official installation guide](https://docs.docker.com/engine/install/)

Verify installation:
```bash
docker --version
docker-compose --version
```

## Getting Started

This project uses Docker Compose to run both backend and frontend together in containers.

### Start the application:
```bash
docker compose up --build
```

Or run in detached mode (background):
```bash
docker compose up -d --build
```

### Stop the application:
```bash
docker compose down
```

### View logs:
```bash
docker compose logs -f
```

### Access the application:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs

**Development Features:**
- Code changes are automatically reflected (volume mounting)
- Both services restart automatically on code changes
- Environment variables loaded from `.env` file

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.