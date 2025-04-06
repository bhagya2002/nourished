# Nourished Backend API

## Overview

This is the backend service for the Nourished task management application. It provides API endpoints for task management, user authentication, and happiness tracking.

## Architecture

- **Node.js** with **Express** for the API server
- **Firebase Admin SDK** for authentication and Firestore database access
- RESTful API design
- Token-based authentication

## API Endpoints

### Authentication

- `POST /userInfo` - Get user information
- Auth Token required in request body

### Task Management

- `POST /createTask` - Create a new task
- `POST /getUserTasks` - Get all tasks for a user
- `POST /toggleTaskCompletion` - Mark a task as complete or incomplete
- `POST /deleteTask` - Delete a task
- `POST /editTask` - Update task fields
- `POST /getTaskHistory` - Get task completion history

### Happiness Tracking

- `POST /submitHappinessRating` - Submit a happiness rating for a completed task
- `POST /getHappinessData` - Get happiness ratings data for analysis

### Goals Management

- `POST /createGoal` - Create a new goal
- `POST /getUserGoals` - Get all goals for a user
- `POST /editGoal` - Update goal fields
- `POST /deleteGoal` - Delete a goal
- `POST /getGoalTasks` - Get tasks associated with a goal

## Database Schema

### Users Collection

```
users/{userId}
  - email: string
  - displayName: string
  - tasks: Array<string> (task IDs)
  - goals: Array<string> (goal IDs)
  - happiness: Array<string> (happiness rating IDs)
  - friends: Array<string> (user IDs)
  - createdAt: timestamp
```

### Tasks Collection

```
tasks/{taskId}
  - uid: string (user ID)
  - title: string
  - description: string
  - frequency: string (Daily, Weekly, Monthly, or empty)
  - completed: boolean
  - completedAt: timestamp (when marked as complete)
  - createdAt: timestamp
  - goalId: string (optional, if task is part of a goal)
```

### Happiness Collection

```
happiness/{happinessId}
  - uid: string (user ID)
  - taskId: string
  - taskTitle: string
  - rating: number (1-5)
  - date: string (ISO date)
  - createdAt: timestamp
```

### Goals Collection

```
goals/{goalId}
  - uid: string (user ID)
  - title: string
  - description: string
  - tasks: Array<string> (task IDs)
  - createdAt: timestamp
```

## Happiness Rating Implementation

The happiness rating feature allows users to provide feedback on their emotional state after completing tasks. This data is stored and analyzed to help users understand how different tasks impact their well-being.

### Key Components:

1. **Data Capture**:

   - When a user marks a task as complete, they are prompted to rate their happiness (1-5)
   - The rating is stored with task context (task ID, title) and timestamp

2. **Duplicate Prevention**:

   - Server validates that a task has been completed before accepting a rating
   - Checks for existing ratings for the same task on the same day to prevent duplicates
   - Updates existing ratings instead of creating new ones if a duplicate is detected

3. **Data Retrieval and Analysis**:

   - Endpoint provides ratings data with optional date filtering
   - Calculates average happiness scores
   - Returns data structured for visualization in the frontend

4. **Security**:
   - All endpoints require valid authentication
   - Task ownership verification prevents rating tasks owned by other users

## Installation and Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Set up environment variables in `.env`:

```
PORT=3010
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

3. Start the server:

```bash
npm start
```

4. For development with hot reloading:

```bash
npm run dev
```

## Error Handling

The API follows a consistent error response format:

```json
{
  "success": false,
  "error": "Error message explaining what went wrong"
}
```

Success responses follow this format:

```json
{
  "success": true,
  "data": { ... } // Response data if applicable
}
```
