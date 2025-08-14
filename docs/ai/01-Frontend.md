# Frontend

The frontend code is written in React with NextJS. No server side rendering is used in this app.

## Component Structure

- Use functional components with hooks
- All code should be in the `client/src` directory.
- `client/src/utils` folder contains shared utility functions.
- `client/src/styles` contains all CSS and styles for the frontend.
- `client/src/common/components` has shared components across pages (such as NavBar)
- The frontend data models are in `client/src/common/types`. The backend data models in `server/app/src/data` must also be kept in sync when changes are made.
- `client/src/pages` contains the different pages for the site.
