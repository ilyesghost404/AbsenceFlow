# Architecture

## Overview

AbsenceFlow follows a classic MVC pattern:
- Models handle database queries
- Controllers handle request/response cycles
- Routes define API endpoints

## Backend Architecture

```
backend/src/
├── config/        # Database configuration
├── controllers/   # Route handlers
├── models/        # Database models
├── routes/        # API routes
├── services/      # Business logic & calculations
├── app.js         # Express app config
└── server.js      # Server startup
```

## Frontend Architecture

```
frontend/src/
├── components/    # Reusable UI components
├── layouts/       # Page layouts
├── pages/         # Main page components
├── routes/        # Routing config
└── services/      # API clients
```

## Key Technologies

- **Express**: Web framework for REST API
- **pg**: PostgreSQL client for database queries
- **ExcelJS**: Excel file generation for reports
- **node-cron**: Scheduling automatic attendance checks
- **React**: Frontend UI library
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
