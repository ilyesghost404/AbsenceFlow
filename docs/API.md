# API Documentation

Base URL: `http://localhost:5000/api`

## Authentication
Not implemented yet (optional for future).

## Endpoints

### 1. Employees

| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| GET    | /employees         | List all employees           |
| GET    | /employees/:id     | Get employee by ID           |
| POST   | /employees         | Create employee              |
| PUT    | /employees/:id     | Update employee              |
| DELETE | /employees/:id     | Delete employee              |

### 2. Absences

| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| GET    | /absences          | List all absences            |
| GET    | /absences/:id      | Get absence by ID            |
| POST   | /absences          | Create absence               |
| PUT    | /absences/:id      | Update absence               |
| DELETE | /absences/:id      | Delete absence               |
| PUT    | /absences/:id/validate | Validate absence          |

### 3. Attendance

| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| GET    | /presence/today    | Today's attendance for all  |
| GET    | /presence/:id      | Get specific attendance      |
| POST   | /presence/check-in/:employeeId | Check-in employee    |
| PUT    | /presence/check-out/:employeeId | Check-out employee  |

### 4. Holidays

| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| GET    | /holidays          | List all holidays            |
| GET    | /holidays/:id      | Get holiday by ID            |
| POST   | /holidays          | Create holiday               |
| PUT    | /holidays/:id      | Update holiday               |
| DELETE | /holidays/:id      | Delete holiday               |

### 5. Reports

| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| GET    | /reports/monthly/:year/:month | Download Excel report  |
