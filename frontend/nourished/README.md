# Nourished - Task Management Application

## Overview
Nourished is a comprehensive task management application designed to help users track their tasks, monitor completion patterns, and measure how tasks impact their happiness and well-being.

## Features

### Task Management
- Create, edit, and delete tasks
- Mark tasks as complete/incomplete
- Categorize tasks by frequency (Daily, Weekly, Monthly)
- Track task completion history

### Happiness Tracking
- Rate how you feel after completing tasks (1-5 scale)
- View happiness trends over time
- Analyze correlation between tasks and well-being
- Visual dashboard with happiness metrics

### Dashboard
- Overview of active and completed tasks
- Happiness trends visualization
- Recent activity tracking
- Intuitive, responsive UI that works on all devices

## Technical Stack

### Frontend
- **Next.js**: React framework for server-rendered applications
- **Material UI**: Component library for consistent and beautiful UI
- **TypeScript**: Type-safe JavaScript
- **Recharts**: Charting library for visualizing happiness data
- **Firebase Auth**: User authentication

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **Firebase/Firestore**: Database and authentication

## Installation

### Prerequisites
- Node.js (v14 or later recommended)
- npm or yarn
- Firebase account (for authentication and database)

### Setup
1. Clone the repository
2. Install dependencies:
```bash
cd frontend/nourished
npm install
```

3. Set up environment variables in `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3010
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
```

5. Navigate to `http://localhost:3000` in your browser

## Key Dependencies

### Frontend
- `next`: ^15.1.6
- `react`: 18.2.0
- `@mui/material`: 5.15.15
- `@mui/icons-material`: 5.15.15
- `firebase`: ^11.3.0
- `recharts`: ^2.15.1 (for happiness data visualization)

### Backend
- `express`: ^4.18.2
- `firebase-admin`: ^11.10.1
- `cors`: ^2.8.5

## Development Notes

### Adding New Dependencies
When adding new dependencies to the project, please update both the package.json and this README.md file to keep documentation current.

Example:
```bash
npm install [package-name] --save
```

### Happiness Rating Feature
The happiness rating system lets users provide feedback on how completing tasks makes them feel. This data is visualized on the dashboard to help users understand their emotional responses to different types of tasks.

Key components:
- `HappinessDialog.tsx`: UI for collecting happiness ratings
- `HappinessOverview.tsx`: Dashboard component for displaying happiness trends
- Backend endpoints: `/submitHappinessRating` and `/getHappinessData`
