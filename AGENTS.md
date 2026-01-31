# AGENTS.md

> [!IMPORTANT]
> This file acts as the primary entry point for AI agents working in this repository. ALWAYS read this file first to understand the project structure and global standards.

## 1. Repository Overview
This repository hosts the "Cody Richter Cooks" application, a full-stack web platform for managing recipes and cooking guides.

### Directory Map
- **`frontend/`**: Next.js application (App Router). See [frontend/AGENTS.md](frontend/AGENTS.md).
- **`backend/`**: FastAPI (Python) web server. See [backend/AGENTS.md](backend/AGENTS.md).
- **`scripts/`**: Automation scripts for devops/maintenance. See [scripts/AGENTS.md](scripts/AGENTS.md).
- **`.github/`**: CI/CD and Issue templates.

## 2. Global Workflow Rules
1.  **Script Priority**: ALWAYS use the scripts in `scripts/` (e.g., `dev-start.sh`, `test.sh`) instead of raw commands like `docker-compose up` or `pytest`. These scripts handle environment setup and cleanup correctly.
2.  **Conventional Commits**: All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
    - `feat(scope): ...`
    - `fix(scope): ...`
    - `refactor(scope): ...`
    - `docs(scope): ...`
    - `test(scope): ...`
3.  **Clean Code**:
    - **Linting**: Ensure `npm run lint` (frontend) and `flake8 .` (backend) pass before requesting review.
    - **Formatting**: We use `prettier` (frontend) and `black` (backend).

## 3. Pull Request / Contribution Expectations
When creating changes for the user:
- **Test Plan**: Explicitly state how you verified the change (e.g., "Ran `scripts/test.sh` and verified unit tests pass", or "Manually checked localhost:3000/login").
- **Documentation**: If you change an API or add a strict dependency, update the relevant `AGENTS.md` file.
- **Self-Correction**: If a tool call fails, analyze the error message and retry with a corrected approach. Do not ask the user for help unless blocked.

## 4. Quick Links
- [Frontend Documentation](frontend/AGENTS.md)
- [Backend Documentation](backend/AGENTS.md)
- [Scripts & Automation](scripts/AGENTS.md)
