# Database Schema

## Overview

The database is PostgreSQL 18.

## Tables

### 1. `employees`
Employee information.
| Column           | Type         | Constraints             |
|------------------|--------------|-------------------------|
| `id`             | SERIAL       | PRIMARY KEY             |
| `matricule`      | VARCHAR(50)  | UNIQUE NOT NULL         |
| `first_name`     | VARCHAR(100) | NOT NULL                |
| `last_name`      | VARCHAR(100) | NOT NULL                |
| `email`          | VARCHAR(150) | UNIQUE                  |
| `phone`          | VARCHAR(20)  |                         |
| `department`     | VARCHAR(100) |                         |
| `position`       | VARCHAR(100) |                         |
| `hire_date`      | DATE         | NOT NULL                |
| `created_at`     | TIMESTAMP    | DEFAULT NOW()           |

### 2. `absences`
Absence/leave records for employees.
| Column           | Type         | Constraints             |
|------------------|--------------|-------------------------|
| `id`             | SERIAL       | PRIMARY KEY             |
| `employee_id`    | INT          | REFERENCES employees(id)|
| `type`           | VARCHAR(50)  | e.g., Vacation, Sick    |
| `start_date`     | DATE         |                         |
| `end_date`       | DATE         |                         |
| `reason`         | TEXT         |                         |
| `status`         | VARCHAR(50)  | Pending/Validated       |
| `created_at`     | TIMESTAMP    | DEFAULT NOW()           |
| `validated_at`   | TIMESTAMP    |                         |

### 3. `attendance`
Daily check-in/check-out records.
| Column           | Type         | Constraints             |
|------------------|--------------|-------------------------|
| `id`             | SERIAL       | PRIMARY KEY             |
| `employee_id`    | INT          | REFERENCES employees(id)|
| `date`           | DATE         | NOT NULL                |
| `check_in`       | TIME         |                         |
| `check_out`      | TIME         |                         |
| `status`         | VARCHAR(50)  | Present/Absent          |
| `created_at`     | TIMESTAMP    | DEFAULT NOW()           |

### 4. `holidays`
Public holidays.
| Column           | Type         | Constraints             |
|------------------|--------------|-------------------------|
| `id`             | SERIAL       | PRIMARY KEY             |
| `holiday_date`   | DATE         | NOT NULL                |
| `name`           | VARCHAR(100) | NOT NULL                |
