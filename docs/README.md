# AbsenceFlow - Professional HR Attendance Management

AbsenceFlow is a complete HR management application for employee attendance, absence, and leave tracking. It features automatic calculation, Excel report generation, and role-based access control.

## Features

- **Employee Management**: Add, edit, and delete employees with details like matricule, contact information, and department.
- **Attendance Tracking**: Real-time check-in/check-out for employees.
- **Absence Management**: Automatic and manual absence records with validation.
- **Holiday Management**: Manage public holidays and exclude them from working days.
- **Reporting**: Generate monthly Excel attendance reports with detailed statistics.
- **Automatic Calculation**: Calculates working days, attendance rate, and absence days automatically.
- **Scheduler**: Automatic absenteeism recording for employees who don't check in by end of day.

## Tech Stack

### Backend
- Node.js with Express.js
- PostgreSQL 18
- ExcelJS for report generation
- node-cron for task scheduling

### Frontend
- React.js
- Vite
- Tailwind CSS
- Lucide React icons
- React Hot Toast for notifications

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 18
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AbsenceFlow
```

2. Set up the PostgreSQL database:
   - Create a database named `absenceflow`
   - Use the SQL schema from `/database/schema.sql`

3. Set up the backend:
```bash
cd backend
npm install
# Create a .env file with your database credentials
npm start
```

4. Set up the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
AbsenceFlow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── services/
└── docs/
```

## Usage

1. Navigate to the frontend URL (usually http://localhost:5173)
2. Use the sidebar to access different sections
3. Add employees, manage attendance/absences, and generate reports

## License

MIT
