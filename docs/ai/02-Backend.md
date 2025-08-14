# Backend Overview

The backend code is located in `server/app/src/` and is written in Python. It provides API endpoints for managing a curated collection of recipes. The backend is designed to be stateless and serverless, with all business logic implemented in Python functions that are deployed as AWS Lambda handlers.

## Component Structure

- All unit tests are written in `server/app/tests`
- The handlers for each function are defined in the directory of `server/app/src`
- The handlers should only handle parsing and routing of requests. All specific logic should be handled in `server/app/src/methods`
- `server/app/src/utilities` contains helper functions that are shared across methods
- All data models in the backend live in `server/app/src/data`. The frontend data models in `client/src/common/types` must also be kept in sync when changes are made.
- `server/app/src/network` contains HTTP responses that must be used by the handlers when responding
