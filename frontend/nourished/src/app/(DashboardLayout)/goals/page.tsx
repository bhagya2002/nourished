'use client';

import React, { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Fab,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
  Alert,
  Snackbar,
  AlertColor,
  Collapse,
  ListItemButton,
  ListItemIcon,
  Card,
  CardContent,
  Typography,
  Divider,
  Menu,
  MenuItem,
  Grid,
  CardActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PageContainer from '../components/container/PageContainer';
import TaskCreateDialog from '../tasks/components/TaskCreateDialog';
import TaskEditDialog from '../tasks/components/TaskEditDialog';
import HappinessDialog from '../tasks/components/HappinessDialog';
import TaskCard from '../tasks/components/TaskCard';
import { MoreVert } from '@mui/icons-material';

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
      console.log(goalsData.data)

      // Ensure we're setting an array even if the API returns something else
      if (goalsData && goalsData.data && Array.isArray(goalsData.data)) {
        goalsData.data.forEach((goal: any) => {
          goal.tasks = goal.taskIds;
          delete goal.taskIds;
        });
        setGoals(goalsData.data);
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

  const fetchGoalTasks = async (index: number) => {
    const goalId = goals[index].id;
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
        const updatedGoal = { ...prevGoals[index] };
        updatedGoal.tasks = tasksArray;
        return prevGoals.map((goal, idx) => (idx === index ? updatedGoal : goal));
      });
      setToast({
        open: true,
        message: 'Tasks fetched successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setToast({
        open: true,
        message: 'Failed to fetch tasks',
        severity: 'error',
      });
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

  const handleGoalExpand = (index: number) => {
    if (expandingGoalIndex !== index) {
      // Fetch goal tasks if needed
      if (goals[index].tasks && typeof goals[index].tasks[0] === 'string') {
        fetchGoalTasks(index);
      }
    }
    setExpandingGoalIndex(index === expandingGoalIndex ? -1 : index);
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
      // setGoals((prevGoals) =>
      //   prevGoals.map((goal, index) =>
      //     index === expandingGoalIndex
      //       ? { ...goal, tasks: [...goal.tasks, newTask] }
      //       : goal
      //   )
      // );
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
      const currentTask = goals[expandingGoalIndex].tasks.find((task) => task.id === taskId);
      if (!currentTask) return;
      
      // New completed state (toggle current state)
      const newCompletedState = !currentTask.completed;

      setToast({ open: true, message: 'Updating task status...', severity: 'info' });

      // Optimistically update UI first
      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[expandingGoalIndex] };
        updatedGoal.completedTasks = newCompletedState ? updatedGoal.completedTasks + 1 : updatedGoal.completedTasks - 1;
        const updatedTasks = [...updatedGoal.tasks];
        const taskIndex = updatedTasks.findIndex((task) => task.id === taskId);
        updatedTasks[taskIndex].completed = newCompletedState;
        updatedGoal.tasks = updatedTasks;
        return prevGoals.map((goal, idx) =>
          idx === expandingGoalIndex ? updatedGoal : goal
        );
      });

      // Simple timeout handling to prevent UI freezing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      console.log(
        `Sending toggle request for task ${taskId} to ${
          newCompletedState ? 'complete' : 'incomplete'
        }`
      );

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
            signal: controller.signal,
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

        clearTimeout(timeoutId);

        // First check if the request was successful based on status code
        if (response.ok) {
          // Success! Show success notification
          setToast({
            open: true,
            message: newCompletedState
              ? 'Task marked complete!'
              : 'Task marked incomplete!',
            severity: 'success',
          });

          // If marked as complete, open the happiness rating dialog
          if (newCompletedState) {
            setRatingTaskId(taskId);
            setRatingTaskTitle(currentTask.title);
            // Small delay to allow notification to be seen before showing happiness dialog
            setTimeout(() => {
              setHappinessDialogOpen(true);
            }, 500);
          }

          // Task was already optimistically updated, no need to refresh
          return;
        }

        // If we get here, response was not OK
        let errorMessage = 'Failed to update task completion';

        // Try to get a more specific error message if possible
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          try {
            const freshToken = await refreshToken();
            if (freshToken) {
              const result = await makeRequest(freshToken);
              // Convert response to JSON to access properties
              const resultData = await result.json().catch(() => ({}));
              if (!resultData.success) {
                throw new Error(
                  resultData.error || 'Failed to update task status'
                );
              }
              return resultData;
            } else {
              throw new Error('Failed to refresh authentication token');
            }
          } catch (refreshError) {
            console.error('Error refreshing token:', refreshError);
            setToast({
              open: true,
              message: 'Failed to toggle task completion',
              severity: 'error',
            });
    
            // Revert the optimistic UI update
            setGoals((prevGoals) => {
              const updatedGoal = { ...prevGoals[expandingGoalIndex] };
              updatedGoal.completedTasks = newCompletedState ? updatedGoal.completedTasks - 1 : updatedGoal.completedTasks + 1;
              const updatedTasks = [...updatedGoal.tasks];
              const taskIndex = updatedTasks.findIndex((task) => task.id === taskId);
              updatedTasks[taskIndex].completed = !newCompletedState;
              updatedGoal.tasks = updatedTasks;
              return prevGoals.map((goal, idx) =>
                idx === expandingGoalIndex ? updatedGoal : goal
              );
            });
            router.push('/authentication/login');
            throw refreshError;
          }
        } else {
          setToast({
            open: true,
            message: 'Failed to toggle task completion',
            severity: 'error',
          });
  
          // Revert the optimistic UI update
          setGoals((prevGoals) => {
            const updatedGoal = { ...prevGoals[expandingGoalIndex] };
            updatedGoal.completedTasks = newCompletedState ? updatedGoal.completedTasks - 1 : updatedGoal.completedTasks + 1;
            const updatedTasks = [...updatedGoal.tasks];
            const taskIndex = updatedTasks.findIndex((task) => task.id === taskId);
            updatedTasks[taskIndex].completed = !newCompletedState;
            updatedGoal.tasks = updatedTasks;
            return prevGoals.map((goal, idx) =>
              idx === expandingGoalIndex ? updatedGoal : goal
            );
          });
          throw new Error('Failed to update task status');
        }
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
          updatedGoal.completedTasks = newCompletedState ? updatedGoal.completedTasks - 1 : updatedGoal.completedTasks + 1;
          const updatedTasks = [...updatedGoal.tasks];
          const taskIndex = updatedTasks.findIndex((task) => task.id === taskId);
          updatedTasks[taskIndex].completed = !newCompletedState;
          updatedGoal.tasks = updatedTasks;
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
  }

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

        {/* Goals Page Title and Add Goal Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, ml: 2, mr: 2 }}>
          <Typography variant="h3">Your Goals</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddGoalClick}
            >
              Add Goal
            </Button>
          </Box>
        </Box>

        {/* goals list */}
        <List>
          {goals.map((goal, index) => (
            <Card key={index}
              sx={{
                mb: 2,
                mr: 2,
                ml: { xs: 4, sm: 6 },
                display: 'flex',
                flexDirection: 'row',
                overflow: 'initial',
                boxShadow: 4,
                borderRadius: 4,
                alignItems: 'center',
              }}>

              {/* progress bar */}
              <Card
                sx={{
                  marginY: 2,
                  width: { xs: 120, sm: 160 },
                  transform: 'translateX(-32px)',
                  ml: 0,
                  pb: { xs: 16, sm: 20 },
                  height: 0,
                  backgroundColor: (() => {
                    const percentage = Math.round((goal.completedTasks / goal.totalTasks) * 100);
                    return percentage > 66
                      ? 'secondary.main'
                      : percentage > 33
                      ? 'orange'
                      : 'red';
                  })(),
                  opacity: 0.5,
                  position: 'relative',
                  borderRadius: 4,
                  flexShrink: 0,
                  userSelect: 'none',
                  "&:after": {
                    content: '"%"',
                    position: 'absolute',
                    bottom: { xs: 32, sm: 40 },
                    right: 8,
                    fontSize: { xs: 80, sm: 120 },
                    fontWeight: 1000,
                    color: 'common.white',
                    opacity: 0.3,
                  }
                }}>
                <Typography sx={{ position: 'absolute', top: { xs: 32, sm: 48 }, left: 8, textAlign: 'center', color: 'common.white', fontWeight: 1000, 
                  fontSize: { 
                    xs: Math.round((goal.completedTasks / goal.totalTasks) * 100) >= 100 ? 60 : 80, 
                    sm: Math.round((goal.completedTasks / goal.totalTasks) * 100) >= 100 ? 80 : 120 
                  }}}>
                  {Math.round((goal.completedTasks / goal.totalTasks) * 100) >= 100 ? 100 : Math.round((goal.completedTasks / goal.totalTasks) * 100)}
                </Typography>
              </Card>

              {/* goal actions menu */}
              <Menu id='goal-more-menu' anchorEl={anchorEl} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} open={goalMoreActionsOpen} onClose={() => { setAnchorEl(null); }} MenuListProps={{ 'aria-labelledby': 'goal-more-button' }}>
                <MenuItem onClick={() => { handleEditGoalClick(index); setAnchorEl(null); }}>
                  <ListItemIcon>
                    <EditIcon fontSize='small' color='primary' />
                  </ListItemIcon>
                  <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleDeleteGoalClick(index);
                    setAnchorEl(null);
                  }}
                >
                  <ListItemIcon>
                    <DeleteIcon fontSize='small' color='error' />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>

              {/* goal info */}
              <CardContent
                sx={{
                  '&.MuiCardContent-root': { p: 0 },
                  flex: 1,
                  my: 2,
                }}>
                <ListItem disablePadding>
                  {/* Goal details */}
                  <ListItemButton onClick={() => handleGoalExpand(index)}
                    sx={{
                      p: 0,
                      transform: 'translateX(-16px)',
                      '&.MuiListItemButton-root': { p: 0, pr: { xs: 0, sm: 0 }, pl: { xs: 0, sm: 1 } },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-evenly',
                      alignItems: 'flex-start',
                      minHeight: { xs: 120, sm: 160 }
                    }}>
                    <Typography color='common.grey' sx={{ opacity: 0.5, fontSize: 14, fontWeight: 600, pt: 0.5 }}>BEFORE {goal.deadline}</Typography>
                    <Typography sx={{ fontSize: { xs: 18, sm: 21 }, fontWeight: 600, pt: 0.5 }}>{goal.title}</Typography>
                    <Typography sx={{ fontSize: { xs: 14, sm: 16 }, fontWeight: 400, pt: 1 }}>{goal.description}</Typography>
                  </ListItemButton>

                  {/* goal actions trigger button */}
                  <IconButton aria-label='goal-actions' aria-haspopup='true' aria-expanded={goalMoreActionsOpen ? 'true' : undefined} id='goal-more-button'
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: 0,
                    }}>
                    <MoreVert color='primary' />
                  </IconButton>
                </ListItem>

                {/* Tasks list under each goal */}
                <Collapse
                  in={index === expandingGoalIndex}
                  timeout='auto'
                  unmountOnExit
                >
                  {/* goal tasks list */}
                  <Divider sx={{ my: 1 }} />
                  <Grid container alignItems='stretch' columnSpacing={2} rowSpacing={1} sx={{ pl: 2, pr: 2 }}>
                    {goals[index].tasks !== undefined &&
                      goals[index].tasks.map((task: any, taskIndex: number) => (
                        <Grid item xs={12} sm={6} key={taskIndex}>
                          <TaskCard
                            task={task}
                            onComplete={handleComplete}
                            onEdit={() => {setTaskEditModalOpen(true); setTaskEditingIndex(taskIndex);}}
                            onDelete={handleGoalTaskDelete}
                          />
                        </Grid>
                      ))
                    }

                    {/* Add new task button */}
                    <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Card
                        onClick={() => setTaskCreateModalOpen(true)}
                        sx={(theme) => ({
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[8],
                          },
                          borderRadius: '12px',
                          marginY: 2,
                          width: "100%",
                          m: 0,
                          height: 112,
                          backgroundColor: theme.palette.background.paper,
                          position: 'relative',
                          flexShrink: 0,
                          userSelect: 'none',
                          "&:before": {
                            content: '"Add"',
                            position: 'absolute',
                            top: 30,
                            left: 8,
                            fontSize: { xs: 40, sm: 64 },
                            fontWeight: 1000,
                            color: 'secondary.light',
                            opacity: 0.7,
                          },
                          "&:after": {
                            content: '"Task"',
                            position: 'absolute',
                            bottom: 24,
                            right: 8,
                            fontSize: { xs: 40, sm: 64 },
                            fontWeight: 1000,
                            color: 'secondary.light',
                            opacity: 0.7,
                          }
                        })}>
                          <Typography sx={{ fontSize: 96, fontWeight: 1000, color: 'secondary.light', opacity: 0.3 }}>
                            New
                          </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </List>

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
              goals[expandingGoalIndex] !== undefined &&
                Array.isArray(goals[expandingGoalIndex].tasks)
                ? goals[expandingGoalIndex].tasks
                : []
            }
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
