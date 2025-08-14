# Backend Overview

The backend code is located in `server/src/` and is written in Python. It provides API endpoints for managing a curated collection of recipes. The backend is designed to be stateless and serverless, with all business logic implemented in Python functions that are deployed as AWS Lambda handlers.

## Component Structure

- All unit tests are written in server/src/tests
- The handlers for each function are defined in the directory of server/src/app
- The handlers should only handle parsing and routing of requests. All specific logic should be handled in server/src/app/methods
- server/src/app/utilities contains helper functions that are shared across methods
- All data models in the backend live in server/src/app/data. The frontend data models in client/src/common/types must also be kept in sync when changes are made.
- server/src/app/network contains HTTP responses that must be used by the handlers when responding
