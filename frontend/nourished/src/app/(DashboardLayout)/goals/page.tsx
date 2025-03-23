'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Alert,
  Snackbar,
  AlertColor,
  Collapse,
  Typography,
  Divider,
  Grid,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PageContainer from '../components/container/PageContainer';
import TaskCreateDialog from '../tasks/components/TaskCreateDialog';
import TaskEditDialog from '../tasks/components/TaskEditDialog';
import HappinessDialog from '../tasks/components/HappinessDialog';
import TaskCard from '../tasks/components/TaskCard';
import { motion, AnimatePresence } from 'framer-motion';

// Import our new components
import PageHeader from './components/PageHeader';
import GoalCard from './components/GoalCard';
import EmptyState from './components/EmptyState';
import GoalSummary from './components/GoalSummary';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';

// Define a type for the goals
export type Goal = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  createdAt: string;
  tasks: any[];
  totalTasks: number;
  completedTasks: number;
};

export default function GoalsPage() {
  const router = useRouter();
  const { user, token, loading, refreshToken } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Goal>({
    id: '',
    title: '',
    description: '',
    deadline: '',
    createdAt: '',
    tasks: [],
    totalTasks: 0,
    completedTasks: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [validationError, setValidationError] = useState('');
  const [toast, setToast] = useState({
    open: false,
    message: 'nothing',
    severity: 'info',
  });
  const today = new Date().toISOString().split('T')[0];
  const [expandingGoalIndex, setExpandingGoalIndex] = useState(-1);
  // More actions menu for edition and deletion
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const goalMoreActionsOpen = Boolean(anchorEl);

  const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false);
  const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
  const [taskEditingIndex, setTaskEditingIndex] = useState(-1);

  // Add happiness dialog states
    const [happinessDialogOpen, setHappinessDialogOpen] = useState(false);
    const [ratingTaskId, setRatingTaskId] = useState<string | null>(null);
    const [ratingTaskTitle, setRatingTaskTitle] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);

  // Add a state to track expanded goals (multiple can be expanded at once)
  const [expandedGoals, setExpandedGoals] = useState<{[key: string]: boolean}>({});

  // Reset the form to initial state
  const resetNewGoal = () => {
    setNewGoal({
      id: '',
      title: '',
      description: '',
      deadline: '',
      createdAt: '',
      tasks: [],
      totalTasks: 0,
      completedTasks: 0,
    });
  };

  // Handle closing the toast box
  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  // Fetches user's goals from the database to populate the list
  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUsergoals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error('Failed to fetch goals');
      const goalsData = await response.json();

      // Ensure we're setting an array even if the API returns something else
      if (goalsData && goalsData.data && Array.isArray(goalsData.data)) {
        const goals = goalsData.data.map((goal: any) => ({
          ...goal,
          tasks: goal.taskIds || [],
        }));
        
        // Set goals first
        setGoals(goals);
        
        // Then fetch tasks for each goal
        for (let index = 0; index < goals.length; index++) {
          if (goals[index] && goals[index].id) {
            await fetchGoalTasks(index, goals);
          }
        }
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      setToast({
        open: true,
        message: 'Failed to fetch goals',
        severity: 'error',
      });
      setGoals([]); // Ensure goals is always an array even on error
    }
  };

  const fetchGoalTasks = async (index: number, currentGoals?: Goal[]) => {
    // Use either the passed goals array or the current state
    const goalsArray = currentGoals || goals;
    
    // Safety check to ensure the index and goal exist
    if (!goalsArray[index] || !goalsArray[index].id) {
      console.error('Invalid goal index or missing goal ID');
      return;
    }

    const goalId = goalsArray[index].id;
    try {
      const response = await fetch(`${API_BASE_URL}/getGoalTasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, goalId: goalId }),
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const tasksData = await response.json();

      // Ensure tasksData is an array
      const tasksArray = Array.isArray(tasksData)
        ? tasksData
        : tasksData && Array.isArray(tasksData.data)
          ? tasksData.data
          : [];
      
      setGoals((prevGoals) => {
        // Additional safety check
        if (!prevGoals[index]) return prevGoals;
        
        const updatedGoal = { ...prevGoals[index] };
        updatedGoal.tasks = tasksArray;
        return prevGoals.map((goal, idx) => (idx === index ? updatedGoal : goal));
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      console.error(`Failed to fetch tasks for goal ${goalId}`);
    }
  };

  // Opens and resets the form dialog
  const handleAddGoalClick = () => {
    setIsEditing(false);
    setGoalModalOpen(true);
    setValidationError('');
  };

  // Populates form with goal data for editing
  const handleEditGoalClick = (index: number) => {
    setIsEditing(true);
    setEditingIndex(index);
    setNewGoal(goals[index]);
    console.log(goals[index]);
    setGoalModalOpen(true);
  };

  // Deletes a goal after confirmation
  const handleDeleteGoalClick = async (index: number) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/deleteGoal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, goalId: goals[index].id }),
        });
        if (!response.ok) throw new Error('Failed to delete goal');
        setGoals((prevGoals) => prevGoals.filter((_, i) => i !== index));
        setToast({
          open: true,
          message: 'Goal deleted successfully!',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error deleting goal:', error);
        setToast({
          open: true,
          message: 'Failed to delete goal',
          severity: 'error',
        });
      }
    }
  };

  // Closes the dialog
  const handleClose = () => {
    setGoalModalOpen(false);
    setValidationError('');
  };

  // Updates form inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGoal({ ...newGoal, [e.target.name]: e.target.value });
    setValidationError('');
  };

  // Submits the form, adding or updating a goal
  const handleSubmit = async () => {
    if (!newGoal.title.trim()) {
      setValidationError('Title must be filled out.');
      return;
    }
    if (!newGoal.description.trim()) {
      setValidationError('Description must be filled out.');
      return;
    }
    if (!newGoal.deadline) {
      setValidationError('Deadline must be filled out.');
      return;
    }
    if (new Date(newGoal.deadline) < new Date(today)) {
      setValidationError("Deadline must be on or after today's date.");
      return;
    }

    console.log(token);

    // If we are editing, update the goal locally
    if (isEditing) {
      try {
        const updateField = async (field: string, value: string) => {
          const response = await fetch(`${API_BASE_URL}/editGoal`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              goalId: newGoal.id,
              fieldToChange: field,
              newValue: value,
            }),
          });
        };

        await Promise.all([
          updateField('title', newGoal.title),
          updateField('description', newGoal.description),
          updateField('deadline', newGoal.deadline),
        ]);
        // Update the goals array with the new goal (avoiding redundant fetches)
        setGoals((prevGoals) =>
          prevGoals.map((goal, idx) => (idx === editingIndex ? newGoal : goal))
        );
        setToast({
          open: true,
          message: 'Goal updated successfully!',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error updating goal:', error);
        setToast({
          open: true,
          message: 'Failed to update goal',
          severity: 'error',
        });
      }
      setGoalModalOpen(false);
      resetNewGoal();
    } else {
      // Otherwise, create a new goal in the database
      const goalCreatedAt = new Date().toISOString();
      try {
        const response = await fetch(`${API_BASE_URL}/createGoal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            goal: {
              title: newGoal.title,
              description: newGoal.description,
              deadline: newGoal.deadline,
              createdAt: goalCreatedAt,
              taskIds: [],
              totalTasks: 0,
              completedTasks: 0,
            },
          }),
        });
        if (!response.ok) throw new Error('Failed to create goal');
        const goalData = await response.json();
        if (!(goalData && goalData.data)) {
          throw new Error('Failed to create goal');
        }
        const goalId = goalData.data.id;
        // Update the goals array with the new goal (avoiding redundant fetches)
        setGoals((prevGoals) => [
          ...prevGoals,
          { ...newGoal, id: goalId, createdAt: goalCreatedAt },
        ]);
        setToast({
          open: true,
          message: 'Goal created successfully!',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error creating goal:', error);
        setToast({
          open: true,
          message: 'Failed to create goal',
          severity: 'error',
        });
      }
      setGoalModalOpen(false);
      resetNewGoal();
    }
  };

  // Function to toggle goal expansion
  const handleToggleGoalExpand = (goalId: string) => {
    setExpandedGoals(prev => {
      const newState = {...prev};
      newState[goalId] = !prev[goalId];
      
      // If we're expanding, make sure we fetch the tasks
      if (!prev[goalId]) {
        const goalIndex = goals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1) {
          if (goals[goalIndex].tasks && typeof goals[goalIndex].tasks[0] === 'string') {
            fetchGoalTasks(goalIndex);
          }
        }
      }
      
      return newState;
    });
  };
  
  // Function to handle adding a task to a goal
  const handleAddTaskToGoal = (goalId: string) => {
    const goalIndex = goals.findIndex(g => g.id === goalId);
    if (goalIndex !== -1) {
      setExpandingGoalIndex(goalIndex);
      setTaskCreateModalOpen(true);
    }
  };

  // Create a new task
  const handleGoalTaskCreate = async ({
    title,
    description,
    frequency,
  }: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    const taskCreatedAt = new Date().toISOString();
    // save the task to the database
    try {
      const response = await fetch(`${API_BASE_URL}/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          task: {
            title,
            description,
            frequency,
            createdAt: taskCreatedAt,
            goalId: goals[expandingGoalIndex].id,
          },
          goalId: goals[expandingGoalIndex].id,
        }),
      });
      if (!response.ok) throw new Error('Failed to create task');
      const taskData = await response.json();
      if (!(taskData && taskData.data)) {
        throw new Error('Failed to create task under goal');
      }
      const taskId = taskData.data.id;
      const newTask = {
        id: taskId,
        title,
        description,
        frequency,
        createdAt: taskCreatedAt,
        goalId: goals[expandingGoalIndex].id,
      }
      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[expandingGoalIndex] };
        updatedGoal.tasks = [...updatedGoal.tasks, newTask];
        // Update goal's totalTasks
        const goalDeadline = new Date(updatedGoal.deadline);
        const taskCreatedTime = new Date(taskCreatedAt);
        const daysLeft = Math.ceil((goalDeadline.getTime() - taskCreatedTime.getTime()) / (1000 * 60 * 60 * 24));
        let totalTasks = 0;
        // Calculate total tasks incompleted based on goal deadline and frequency
        switch (frequency) {
          case "Daily":
            totalTasks = Math.ceil(daysLeft / 1);
            break;
          case "Weekly":
            totalTasks = Math.ceil(daysLeft / 7);
            break;
          case "Monthly":
            totalTasks = Math.ceil(daysLeft / 30);
            break;
          default:
            totalTasks = 0;
            break;
        }
        updatedGoal.totalTasks += totalTasks;
        return prevGoals.map((goal, idx) =>
          idx === expandingGoalIndex ? updatedGoal : goal
        );
      })
      setToast({
        open: true,
        message: 'Task created successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      setToast({
        open: true,
        message: 'Failed to create task',
        severity: 'error',
      });
    }
  };

  // Save task changes from edit
  const handleGoalTaskEdit = async (updatedData: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    try {
      const prevFrequency = goals[expandingGoalIndex].tasks[taskEditingIndex].frequency;
      const updateField = async (field: string, value: string) => {
        const res = await fetch(`${API_BASE_URL}/editTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            taskId: goals[expandingGoalIndex].tasks[taskEditingIndex].id,
            fieldToChange: field,
            newValue: value,
          }),
        });
        if (!res.ok) throw new Error(`Failed to update ${field}`);
      };

      await Promise.all([
        updateField('title', updatedData.title),
        updateField('description', updatedData.description),
        updateField('frequency', updatedData.frequency),
      ]);
      // Update the goal tasks array with the new task (avoiding redundant fetches)
      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[expandingGoalIndex] };
        const updatedTasks = [...updatedGoal.tasks];
        updatedTasks[taskEditingIndex] = {
          ...updatedTasks[taskEditingIndex],
          ...updatedData,
        };
        updatedGoal.tasks = updatedTasks;
        // Update goal's totalTasks
        if (prevFrequency !== updatedData.frequency) {
          const goalDeadline = new Date(updatedGoal.deadline);
          const taskEditTime = new Date();
          let daysLeft = Math.ceil((goalDeadline.getTime() - taskEditTime.getTime()) / (1000 * 60 * 60 * 24));
          if (updatedTasks[taskEditingIndex].completedAt) {
            const completedAt: Date = new Date(updatedTasks[taskEditingIndex].completedAt);
            if (completedAt.getDate() === taskEditTime.getDate() && completedAt.getMonth() === taskEditTime.getMonth() && completedAt.getFullYear() === taskEditTime.getFullYear()) {
              daysLeft -= 1;
            }
          }
          let totalTasksDecreased = 0;
          let totalTasksIncreased = 0;
          switch (prevFrequency) {
            case "Daily":
              totalTasksDecreased = Math.ceil(daysLeft / 1);
              break;
            case "Weekly":
              totalTasksDecreased = Math.ceil(daysLeft / 7);
              break;
            case "Monthly":
              totalTasksDecreased = Math.ceil(daysLeft / 30);
              break;
            default:
              totalTasksDecreased = 0;
              break;
          }
          switch (updatedData.frequency) {
            case "Daily":
              totalTasksIncreased = Math.ceil(daysLeft / 1);
              break;
            case "Weekly":
              totalTasksIncreased = Math.ceil(daysLeft / 7);
              break;
            case "Monthly":
              totalTasksIncreased = Math.ceil(daysLeft / 30);
              break;
            default:
              totalTasksIncreased = 0;
              break;
          }
          updatedGoal.totalTasks -= totalTasksDecreased;
          updatedGoal.totalTasks += totalTasksIncreased;
        }
        return prevGoals.map((goal, idx) =>
          idx === expandingGoalIndex ? updatedGoal : goal
        );
      });
      setToast({
        open: true,
        message: 'Task updated successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      setToast({
        open: true,
        message: 'Failed to update task',
        severity: 'error',
      });
    }
  };

  // Delete task
  const handleGoalTaskDelete = async (taskId: string) => {
    try {
      if (!taskId) return;

      const taskToDelete = goals[expandingGoalIndex].tasks.find((task) => task.id === taskId);
      const taskName = taskToDelete?.title || 'Task';

      // Show notification before deleting
      setToast({
        open: true,
        message: `Deleting "${taskName}"...`,
        severity: 'info',
      });

      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/deleteTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: currentToken,
            taskId: taskId,
          }),
        });
      };

      let res = await makeRequest(token!);

      // Check for token expiration
      if (res.status === 401) {
        const responseText = await res.text();

        if (
          responseText.includes('token has expired') ||
          responseText.includes('auth/id-token-expired')
        ) {
          console.log('Token expired, attempting to refresh...');
          const freshToken = await refreshToken();

          if (freshToken) {
            console.log('Token refreshed, retrying request');
            res = await makeRequest(freshToken);
          }
        }
      }

      // Process the response
      if (res.ok) {
        // Success! 
        setGoals((prevGoals) => {
          const updatedGoal = { ...prevGoals[expandingGoalIndex] };
          const updatedTasks = [...updatedGoal.tasks];
          const taskIndex = updatedTasks.findIndex((task) => task.id === taskId);
          updatedTasks.splice(taskIndex, 1);
          updatedGoal.tasks = updatedTasks;
          // Update goal's totalTasks
          const goalDeadline = new Date(updatedGoal.deadline);
          const taskDeletedTime = new Date();
          let daysLeft = Math.ceil((goalDeadline.getTime() - taskDeletedTime.getTime()) / (1000 * 60 * 60 * 24));
          if (updatedTasks[taskIndex].completedAt) {
            const completedAt: Date = new Date(updatedTasks[taskIndex].completedAt);
            if (completedAt.getDate() === taskDeletedTime.getDate() && completedAt.getMonth() === taskDeletedTime.getMonth() && completedAt.getFullYear() === taskDeletedTime.getFullYear()) {
              daysLeft -= 1;
            }
          }
          let totalTasksDecreased = 0;
          switch (updatedTasks[taskIndex].frequency) {
            case "Daily":
              totalTasksDecreased = Math.ceil(daysLeft / 1);
              break;
            case "Weekly":
              totalTasksDecreased = Math.ceil(daysLeft / 7);
              break;
            case "Monthly":
              totalTasksDecreased = Math.ceil(daysLeft / 30);
              break;
            default:
              totalTasksDecreased = 0;
              break;
          }
          updatedGoal.totalTasks -= totalTasksDecreased;
          return prevGoals.map((goal, idx) =>
            idx === expandingGoalIndex ? updatedGoal : goal
          );
        });

        // Show success notification
        setToast({
          open: true,
          message: `"${taskName}" deleted successfully`,
          severity: 'success',
        });

        // No need to refresh, we've already updated optimistically
        return;
      }

      // If we get here, response was not OK
      const data = await res.json().catch(() => ({}));

      // Show error and revert the optimistic update
      setToast({
        open: true,
        message: data.error || 'Failed to delete task',
        severity: 'error',
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      setToast({
        open: true,
        message: error.message || 'Failed to delete task',
        severity: 'error',
      });
    }
  };

  // Toggle task completion
  const handleComplete = async (taskId: string) => {
    // Make sure we're not already processing another request
    if (isLoading) return;

    try {
      // Safety check for expandingGoalIndex
      if (expandingGoalIndex < 0 || expandingGoalIndex >= goals.length) {
        console.error('Invalid goal index:', expandingGoalIndex);
        return;
      }

      const currentTask = goals[expandingGoalIndex].tasks.find((task) => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }
      
      // New completed state (toggle current state)
      const newCompletedState = !currentTask.completed;

      setToast({ 
        open: true, 
        message: newCompletedState ? 'Task completed ✓' : 'Task marked incomplete', 
        severity: newCompletedState ? 'success' : 'info' 
      });

      // Optimistically update UI first
      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[expandingGoalIndex] };
        const updatedTasks = [...updatedGoal.tasks];
        const taskIndex = updatedTasks.findIndex((task) => task.id === taskId);
        
        if (taskIndex === -1) return prevGoals;
        
        // Update task completion status
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          completed: newCompletedState
        };
        
        // Update goal's tasks and completion count
        updatedGoal.tasks = updatedTasks;
        updatedGoal.completedTasks = newCompletedState ? updatedGoal.completedTasks + 1 : updatedGoal.completedTasks - 1;
        
        // Debug log
        console.log('Task completion update:', {
          goalId: updatedGoal.id,
          goalTitle: updatedGoal.title,
          taskId,
          newCompletedState,
          completedTasks: updatedGoal.completedTasks,
          totalTasks: updatedGoal.totalTasks,
        });
        
        return prevGoals.map((goal, idx) =>
          idx === expandingGoalIndex ? updatedGoal : goal
        );
      });

      // Send toggle request to server
      try {
        const makeRequest = async (currentToken: string) => {
          return await fetch(`${API_BASE_URL}/toggleTaskCompletion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: currentToken,
              taskId,
              completed: newCompletedState,
            }),
          });
        };

        // First attempt with current token
        let response = await makeRequest(token!);

        // Check if we got a token expiration error
        if (response.status === 401) {
          const responseText = await response.text();

          // If token has expired, try refreshing and retrying once
          if (
            responseText.includes('token has expired') ||
            responseText.includes('auth/id-token-expired')
          ) {
            console.log('Token expired, attempting to refresh...');
            const freshToken = await refreshToken();

            if (freshToken) {
              console.log('Token refreshed, retrying request');
              response = await makeRequest(freshToken);
            }
          }
        }

        // First check if the request was successful based on status code
        if (response.ok) {
          // Success! The optimistic update was correct, no need to fetch all goals
          // If marked as complete, open the happiness rating dialog
          if (newCompletedState) {
            setRatingTaskId(taskId);
            setRatingTaskTitle(currentTask.title);
            // Small delay to allow notification to be seen before showing happiness dialog
            setTimeout(() => {
              setHappinessDialogOpen(true);
            }, 1000);
          }
          return;
        }

        // If we get here, response was not OK
        throw new Error('Failed to update task completion');
      } catch (error) {
        console.error('Error toggling task completion:', error);
        setToast({
          open: true,
          message: 'Failed to toggle task completion',
          severity: 'error',
        });

        // Revert the optimistic UI update
        setGoals((prevGoals) => {
          const updatedGoal = { ...prevGoals[expandingGoalIndex] };
          const updatedTasks = [...updatedGoal.tasks];
          const taskIndex = updatedTasks.findIndex((task) => task.id === taskId);
          
          if (taskIndex === -1) return prevGoals;
          
          // Revert task completion status
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            completed: !newCompletedState
          };
          
          // Update goal's tasks and completion count
          updatedGoal.tasks = updatedTasks;
          updatedGoal.completedTasks = updatedTasks.filter(t => t.completed).length;
          
          return prevGoals.map((goal, idx) =>
            idx === expandingGoalIndex ? updatedGoal : goal
          );
        });
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      setToast({
        open: true,
        message: 'Failed to toggle task completion',
        severity: 'error',
      });
    }
  };

  const handleSubmitHappiness = async (taskId: string, rating: number) => {
    try {
      setToast({ open: true, message: 'Submitting happiness rating...', severity: 'info' });

      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/submitHappinessRating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: currentToken,
            taskId,
            rating,
            date: new Date().toISOString(),
          }),
        });
      };

      // First attempt with current token
      let response = await makeRequest(token!);

      // Check if we got a token expiration error
      if (response.status === 401) {
        const responseText = await response.text();

        // If token has expired, try refreshing and retrying once
        if (
          responseText.includes('token has expired') ||
          responseText.includes('auth/id-token-expired')
        ) {
          console.log('Token expired, attempting to refresh...');
          const freshToken = await refreshToken();

          if (freshToken) {
            console.log('Token refreshed, retrying request');
            response = await makeRequest(freshToken);
          }
        }
      }

      if (!response.ok) {
        throw new Error('Failed to submit happiness rating');
      }

      // Success! Show success notification
      setToast({
        open: true,
        message: 'Happiness rating submitted. Thank you!',
        severity:'success',
      });
    } catch (error) {
      console.error('Error submitting happiness rating:', error);
      setToast({ open: true, 
        message:
          error instanceof Error
            ? error.message
            : 'Failed to submit happiness rating',
        severity: 'error' 
      });
    }
  }

  // Redirects to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/authentication/login');
    }
  }, [loading, user, router]);

  // Fetches goals while initializing the goals page
  useEffect(() => {
    if (user && token) {
      fetchGoals();
    }
  }, [user, token]);

  return (
    <PageContainer title='Goals' description='Create and manage your goals'>
      <Box sx={{ mt: 2 }}>
        {/* popup toast message */}
        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={handleToastClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ '&.MuiSnackbar-root': { right: { sm: 40 } } }}
        >
          <Alert
            onClose={handleToastClose}
            severity={toast.severity as AlertColor}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>

        {/* Page Header Component */}
        <PageHeader 
          title="Goals"
          subtitle="Set and track your personal goals"
          onCreateGoal={handleAddGoalClick}
        />

        {/* Goal Summary */}
        <GoalSummary goals={goals} />

        {/* Goals List with Modern Cards */}
        <AnimatePresence>
          {goals.length === 0 ? (
            <EmptyState onCreateGoal={handleAddGoalClick} />
          ) : (
            <Stack spacing={3} sx={{ p: 1 }}>
          {goals.map((goal, index) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  isExpanded={Boolean(expandedGoals[goal.id])}
                  onEdit={() => handleEditGoalClick(index)}
                  onDelete={() => handleDeleteGoalClick(index)}
                  onToggleExpand={() => handleToggleGoalExpand(goal.id)}
                  onAddTask={() => handleAddTaskToGoal(goal.id)}
                  index={index}
                />
              ))}
            </Stack>
          )}
        </AnimatePresence>

        {/* Tasks list under expanded goals */}
        {goals.map((goal, goalIndex) => (
          <Collapse
            key={`tasks-${goal.id}`}
            in={expandedGoals[goal.id]}
            timeout="auto"
            unmountOnExit
            sx={{ px: 2, mt: -2, mb: 3 }}
          >
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, ml: 1 }}>
              Tasks for {goal.title}
            </Typography>
            <Grid container spacing={2}>
              {goal.tasks && goal.tasks.length > 0 && goal.tasks.map((task: any, taskIndex: number) => (
                <Grid item xs={12} sm={6} md={4} key={task.id || taskIndex}>
                  <TaskCard
                    task={task}
                    onComplete={async (taskId) => {
                      setExpandingGoalIndex(goalIndex);
                      await handleComplete(taskId);
                    }}
                    onEdit={() => {
                      setExpandingGoalIndex(goalIndex);
                      setTaskEditingIndex(taskIndex);
                      setTaskEditModalOpen(true);
                    }}
                    onDelete={() => handleGoalTaskDelete(task.id)}
                  />
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setExpandingGoalIndex(goalIndex);
                      setTaskCreateModalOpen(true);
                    }}
                    sx={{
                      height: '100%',
                      minHeight: 150,
                      borderRadius: 2,
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem'
                    }}
                  >
                    Add New Task
                  </Button>
                </motion.div>
              </Grid>
            </Grid>
          </Collapse>
        ))}

        {/* add/edit goal form dialog */}
        <Dialog open={goalModalOpen} onClose={handleClose}>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogContent dividers>
            {validationError && (
              <Alert severity='error' style={{ margin: '0px' }}>
                {validationError}
              </Alert>
            )}
            <TextField
              autoFocus
              margin='normal'
              label='Title'
              type='text'
              fullWidth
              name='title'
              value={newGoal.title}
              onChange={handleInputChange}
              size='small'
            />
            <TextField
              margin='normal'
              label='Description'
              type='text'
              fullWidth
              name='description'
              value={newGoal.description}
              onChange={handleInputChange}
              size='small'
            />
            <TextField
              margin='normal'
              label='Deadline'
              type='date'
              fullWidth
              name='deadline'
              value={newGoal.deadline}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              size='small'
              inputProps={{ min: today }}
              disabled={isEditing}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant='contained' onClick={handleSubmit}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* add/edit task form dialog */}
        <div>
          <TaskCreateDialog
            open={taskCreateModalOpen}
            onClose={() => setTaskCreateModalOpen(false)}
            onCreate={handleGoalTaskCreate}
            userTasks={
              expandingGoalIndex >= 0 && goals[expandingGoalIndex] !== undefined &&
                Array.isArray(goals[expandingGoalIndex].tasks)
                ? goals[expandingGoalIndex].tasks
                : []
            }
            token={token}
          />
          {expandingGoalIndex >= 0 &&
            taskEditingIndex >= 0 &&
            goals[expandingGoalIndex] !== undefined &&
            Array.isArray(goals[expandingGoalIndex].tasks) &&
            goals[expandingGoalIndex].tasks[taskEditingIndex] !== undefined && (
              <TaskEditDialog
                open={taskEditModalOpen}
                onClose={() => {
                  setTaskEditModalOpen(false);
                  setTaskEditingIndex(-1);
                }}
                onSave={handleGoalTaskEdit}
                initialTitle={
                  goals[expandingGoalIndex].tasks[taskEditingIndex].title
                }
                initialDescription={
                  goals[expandingGoalIndex].tasks[taskEditingIndex].description
                }
                initialFrequency={
                  goals[expandingGoalIndex].tasks[taskEditingIndex].frequency
                }
                userTasks={
                  Array.isArray(goals[expandingGoalIndex].tasks)
                    ? goals[expandingGoalIndex].tasks
                    : []
                }
              />
            )}
        </div>
        <HappinessDialog
          open={happinessDialogOpen}
          taskId={ratingTaskId || ''}
          taskTitle={ratingTaskTitle}
          onClose={() => setHappinessDialogOpen(false)}
          onSubmit={handleSubmitHappiness}
        />
      </Box>
    </PageContainer>
  );
}
