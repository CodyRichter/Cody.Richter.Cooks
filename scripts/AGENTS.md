# AGENTS.md (Scripts)

> [!IMPORTANT]
> The scripts in this directory are the **AUTHORITATIVE** way to manage the development lifecycle.
> AI Agents MUST prefer these scripts over raw commands (like `docker-compose` or `alembic`) to ensure consistent environments.

## 1. Environment Control
| Script | Description |
| :--- | :--- |
| **`./dev-start.sh`** | **Boot the system**. Starts Postgres and Backend containers. (Frontend runs separately via `npm run dev`). |
| **`./dev-stop.sh`** | **Shutdown**. Stops containers. Use `--cleanup` to remove containers, `--volumes` to wipe data. |
| **`./cleanup.sh`** | **Reset**. Removes Docker artifacts to fix "weird" states. Use this if the environment is behaving erratically. |
| **`./build.sh`** | **Rebuild**. Re-runs `docker build`. Required after changing `requirements.txt` or `Dockerfile`. |

## 2. Database Management
| Script | Description |
| :--- | :--- |
| **`./migrate.sh`** | **Apply Changes**. Runs `alembic upgrade head` inside the container. Run this after pulling code. |
| **`./migrate-create.sh "msg"`** | **New Migration**. Generates a new version file in `backend/alembic/versions`. |

## 3. Testing & Verification
| Script | Description |
| :--- | :--- |
| **`./test.sh`** | **Run Backend Tests**. Runs pytest inside the container. |
| | `test.sh -t unit` : Run only unit tests (faster). |
| | `test.sh -c` : Generate coverage report. |

## 4. Usage Rules
1.  **Always Check Output**: When running a script, verify it exited with code 0.
2.  **No `cd` Required**: These scripts are designed to be run from the root or `scripts/` dir, but for Agents, assuming `cwd` is root is safest.
    - Example: `bash scripts/test.sh`
