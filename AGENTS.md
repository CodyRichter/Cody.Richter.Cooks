# AGENTS.md

> [!IMPORTANT]
> This file acts as the primary entry point for AI agents working in this repository. ALWAYS read this file first to understand the project structure and global standards.

## 1. Repository Overview
This repository hosts the "Cody Richter Cooks" application, a full-stack web platform for managing recipes and cooking guides.

### Directory Map
- **`frontend/`**: Next.js application (App Router). See [frontend/AGENTS.md](frontend/AGENTS.md).
- **`backend/`**: FastAPI (Python) web server. See [backend/AGENTS.md](backend/AGENTS.md).
- **`scripts/`**: Automation scripts for devops/maintenance. See [scripts/AGENTS.md](scripts/AGENTS.md).
- **`infrastructure/`**: Cloud Run and database configuration. See [infrastructure/AGENTS.md](infrastructure/AGENTS.md).
- **`.github/`**: CI/CD and Issue templates.

## 2. Global Workflow Rules
1.  **Script Priority**: ALWAYS use the scripts in `scripts/` (e.g., `dev-start.sh`, `test.sh`) instead of raw commands like `docker-compose up` or `pytest`. These scripts handle environment setup and cleanup correctly.
2.  **Conventional Commits**: All commit messages MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
3.  **Verification Before Review**: Before requesting a review or completing a task, you MUST:
    - **Frontend**: Run `npm run build` AND `npm run lint`. Both must pass with zero errors.
    - **Backend**: Run `flake8 .` (linting) and ensure `pytest` passes.
    - **Linter Ignores**: Using `eslint-disable` or equivalent linter ignores is STICKLY DISCOURAGED. You must find the root cause and fix it properly. Only use ignores as a last resort for third-party code inconsistencies, and explain why in your PR/comment.
4.  **Clean Code**:
    - **No Dead Code**: Do NOT leave commented-out code blocks in your changes. Delete unused code instead of commenting it out.
    - **Minimal Comments**: Avoid redundant or obvious comments (e.g., `// Increment i`). Only use comments for complex or non-obvious logic that cannot be made clear through better naming.

## 3. Pull Request / Contribution Expectations
When creating changes for the user:
- **Test Plan**: Explicitly state how you verified the change (e.g., "Ran `scripts/test.sh` and verified unit tests pass", or "Manually checked localhost:3000/login").
- **Documentation**: If you change an API or add a strict dependency, update the relevant `AGENTS.md` file.
- **Self-Correction**: If a tool call fails, analyze the error message and retry with a corrected approach. Do not ask the user for help unless blocked.

## 4. Quick Links
- [Frontend Documentation](frontend/AGENTS.md)
- [Backend Documentation](backend/AGENTS.md)
- [Infrastructure Documentation](infrastructure/AGENTS.md)
- [Scripts & Automation](scripts/AGENTS.md)
