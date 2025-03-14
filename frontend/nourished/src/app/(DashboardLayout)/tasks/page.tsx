'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import TaskEditDialog from './components/TaskEditDialog';
import TaskCreateDialog from './components/TaskCreateDialog';
import HappinessDialog from './components/HappinessDialog';
import {
  Alert,
  Box,
  Fab,
  Grid,
  Button,
  Snackbar,
  Typography,
  FormControlLabel,
  Switch,
  CircularProgress,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EventNoteIcon from '@mui/icons-material/EventNote';
import TaskCard from './components/TaskCard';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';

type NotificationSeverity = 'error' | 'warning' | 'info' | 'success';

export default function TasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, loading: authLoading, refreshToken } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<any | null>(null);

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: NotificationSeverity;
  }>({ open: false, message: '', severity: 'success' });

  // Add happiness dialog states
  const [happinessDialogOpen, setHappinessDialogOpen] = useState(false);
  const [ratingTaskId, setRatingTaskId] = useState<string | null>(null);
  const [ratingTaskTitle, setRatingTaskTitle] = useState<string>('');

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/authentication/login');
    }
  }, [authLoading, user, router]);

  // Fetch tasks on mount (if logged in)
  useEffect(() => {
    if (user && token) {
      fetchTasks();
    }
  }, [user, token]);

  // Update filtered tasks when tasks or showCompleted changes
  useEffect(() => {
    setFilteredTasks(
      tasks.filter((task) => !task.completed || showCompleted)
    );
  }, [tasks, showCompleted]);

  const fetchTasks = async () => {
    if (!token) {
      console.log('No token available');
      return;
    }

    // Update loading state
    setIsLoading(true);

    // Clear any previous error messages
    setNotification({
      open: true,
      message: 'Loading tasks...',
      severity: 'info',
    });

    try {
      const makeRequest = async (currentToken: string) => {
        try {
          // Add timeout to prevent long-hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

          const response = await fetch(`${API_BASE_URL}/getUserTasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: currentToken }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const text = await response.text();
            console.error(`Server responded with ${response.status}: ${text}`);

            if (response.status === 401) {
              throw new Error('token_expired');
            }

            throw new Error(`Server error: ${response.status}`);
          }

          return response;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Request timed out. Server might be overloaded.');
          }
          if (
            error instanceof TypeError &&
            error.message === 'Failed to fetch'
          ) {
            // Network error - server might be down
            throw new Error(
              'Cannot connect to server. Please ensure the backend server is running.'
            );
          }
          throw error;
        }
      };

      // First attempt with the current token
      let response;
      try {
        response = await makeRequest(token);
      } catch (error: any) {
        // Token expiration handling
        if (error.message === 'token_expired' && refreshToken) {
          console.log('Token expired, attempting to refresh...');
          const freshToken = await refreshToken();

          if (freshToken) {
            console.log('Token refreshed, retrying request');
            response = await makeRequest(freshToken);
          } else {
            console.error('Failed to refresh token');
            router.push('/authentication/login');
            return;
          }
        } else {
          // Re-throw other errors
          throw error;
        }
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load tasks');
      }

      // Update tasks state with the data
      setTasks(data.data || []);

      // Show success notification
      setNotification({
        open: true,
        message: 'Tasks loaded successfully',
        severity: 'success',
      });

      // Auto-hide the success message after 3 seconds
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, open: false }));
      }, 3000);
    } catch (err) {
      console.error('Error fetching tasks:', err);

      // Show error notification
      setNotification({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to load tasks',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new task
  const handleCreate = async ({
    title,
    description,
    frequency,
  }: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    try {
      console.log('Creating task:', { title, description, frequency }); // Debug log

      // Clear previous notification if any
      setNotification({ open: false, message: '', severity: 'success' });

      // Show loading notification
      setNotification({
        open: true,
        message: 'Creating task...',
        severity: 'info',
      });

      // Try creating the task with the current token
      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/createTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: currentToken,
            task: {
              title,
              description,
              frequency,
              completed: false, // Explicitly set to false
              createdAt: new Date().toISOString(),
            },
          }),
        });
      };

      // First attempt with the current token
      let response = await makeRequest(token!);
      let data;

      // Check if we got a token expiration error
      if (response.status === 401) {
        const responseText = await response.text();
        console.log('Auth error response:', responseText);

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

      // Get the response data
      data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create task');
      }

      // Add the new task to local state instead of refreshing
      const newTask = data.data; // Assuming the API returns the created task

      // Ensure newTask has required properties before adding to state
      if (newTask && newTask.id) {
        // Create a structured task object to ensure all required fields exist
        const validTask = {
          id: newTask.id,
          title: newTask.title || title,
          description: newTask.description || description,
          frequency: newTask.frequency || frequency,
          completed:
            newTask.completed !== undefined ? newTask.completed : false,
          createdAt: newTask.createdAt || new Date().toISOString(),
        };

        setTasks([...tasks, validTask]);
      } else {
        console.warn(
          'Created task returned from API does not have expected properties',
          newTask
        );
        // Add a local placeholder task with generated ID in case API doesn't return proper data
        const placeholderTask = {
          id: `local-${Date.now()}`,
          title,
          description,
          frequency,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        setTasks([...tasks, placeholderTask]);
      }

      // Show success notification
      setNotification({
        open: true,
        message: 'Task created successfully!',
        severity: 'success',
      });

      // No need to refresh the page
      return data;
    } catch (error: any) {
      console.error('Error creating task:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to create task. Please retry.',
        severity: 'error',
      });
    }
  };

  // Delete task
  const handleDelete = async (taskId: string) => {
    try {
      if (!taskId) return;

      // Optimistically update UI
      const taskToDelete = tasks.find((t) => t.id === taskId);
      const taskName = taskToDelete?.title || 'Task';

      // Optimistically remove from UI
      setTasks(tasks.filter((task) => task.id !== taskId));

      // Show notification
      setNotification({
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

      let response = await makeRequest(token!);

      // Check for token expiration
      if (response.status === 401) {
        const responseText = await response.text();

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

      // Process the response
      if (response.ok) {
        // Success! Show success notification
        setNotification({
          open: true,
          message: `"${taskName}" deleted successfully`,
          severity: 'success',
        });

        // No need to refresh, we've already updated optimistically
        return;
      }

      // If we get here, something went wrong
      const data = await response.json().catch(() => ({}));

      // Show error and revert the optimistic update
      setNotification({
        open: true,
        message: data.error || 'Failed to delete task',
        severity: 'error',
      });

      // Revert the optimistic update
      setTasks((prev) => [...prev, taskToDelete]);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      setNotification({
        open: true,
        message: error.message || 'Failed to delete task',
        severity: 'error',
      });
    }
  };

  // Save changes from edit
  const handleSaveEdit = async (updatedData: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    try {
      if (!currentEditTask) {
        console.error('No task selected for editing');
        setNotification({
          open: true,
          message: 'Error: No task selected for editing',
          severity: 'error',
        });
        return;
      }

      console.log(
        'Updating task:',
        currentEditTask.id,
        'with data:',
        updatedData
      );

      // Validate input
      if (!updatedData.title || updatedData.title.trim() === '') {
        setNotification({
          open: true,
          message: 'Title cannot be empty',
          severity: 'error',
        });
        return;
      }

      // Show loading notification
      setNotification({
        open: true,
        message: 'Updating task...',
        severity: 'info',
      });

      // Save original state in case we need to revert
      const originalTask = { ...currentEditTask };

      // Optimistically update the UI immediately
      setTasks(
        tasks.map((task) =>
          task.id === currentEditTask.id ? { ...task, ...updatedData } : task
        )
      );

      const taskId = currentEditTask.id;

      // Update each field separately for robustness
      const updateField = async (field: string, value: string) => {
        const makeRequest = async (currentToken: string) => {
          return await fetch(`${API_BASE_URL}/editTask`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: currentToken,
              taskId,
              fieldToChange: field,
              newValue: value,
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
            console.log('Token expired for update, refreshing...');
            const freshToken = await refreshToken();

            if (freshToken) {
              console.log('Token refreshed, retrying update');
              response = await makeRequest(freshToken);
            }
          }
        }

        if (!response.ok) {
          // Try to get more detailed error information
          let errorDetail = '';
          try {
            const errorResponse = await response.json();
            errorDetail = errorResponse.error || '';
          } catch (e) {
            // If we can't parse JSON, try to get plain text
            try {
              errorDetail = await response.text();
            } catch (textError) {
              // If even that fails, just use the status
              errorDetail = `Status ${response.status}`;
            }
          }

          console.error(`Failed to update ${field}:`, errorDetail);
          throw new Error(
            `Failed to update ${field}${errorDetail ? ': ' + errorDetail : ''}`
          );
        }

        return response;
      };

      // Update all fields in parallel for efficiency
      console.log('Sending task update requests...');
      const results = await Promise.all([
        updateField('title', updatedData.title),
        updateField('description', updatedData.description),
        updateField('frequency', updatedData.frequency || ''),
      ]);

      console.log('Task update results:', results);

      // All updates were successful
      setNotification({
        open: true,
        message: 'Task updated successfully!',
        severity: 'success',
      });

      // No need to refresh
    } catch (error) {
      console.error('Error updating task:', error);

      // Revert optimistic update in case of error
      if (currentEditTask) {
        setTasks(
          tasks.map((task) =>
            task.id === currentEditTask.id ? currentEditTask : task
          )
        );
      }

      // Show error notification
      setNotification({
        open: true,
        message:
          error instanceof Error ? error.message : 'Failed to update task',
        severity: 'error',
      });
    }
  };

  // Toggle Task Completion (complete/incomplete)
  const handleComplete = async (taskId: string) => {
    // Make sure we're not already processing another request
    if (isLoading) return;

    try {
      if (!taskId) {
        console.warn('Invalid task ID provided');
        return;
      }

      // Find the current task
      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask) {
        console.warn('Task not found in local state');
        return;
      }

      // New completed state (toggle current state)
      const newCompletedState = !currentTask.completed;

      // Show notification during toggle - this acts as a loading indicator
      setNotification({
        open: true,
        message: 'Updating task status...',
        severity: 'info',
      });

      // Optimistically update UI first
      setTasks(
        tasks.map((task) =>
          task.id === taskId ? { ...task, completed: newCompletedState } : task
        )
      );

      // Simple timeout handling to prevent UI freezing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      console.log(
        `Sending toggle request for task ${taskId} to ${
          newCompletedState ? 'complete' : 'incomplete'
        }`
      );

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
          setNotification({
            open: true,
            message: newCompletedState
              ? 'Task marked complete!'
              : 'Task marked incomplete',
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
        const errorMessage = 'Failed to update task completion';

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
            // Revert the optimistic update
            setTasks(
              tasks.map((task) =>
                task.id === taskId
                  ? { ...task, completed: !newCompletedState }
                  : task
              )
            );
            setNotification({
              open: true,
              message: 'Authentication error. Please log in again.',
              severity: 'error',
            });
            router.push('/authentication/login');
            throw refreshError;
          }
        } else {
          // Revert the optimistic update for other errors
          setTasks(
            tasks.map((task) =>
              task.id === taskId
                ? { ...task, completed: !newCompletedState }
                : task
            )
          );
          setNotification({
            open: true,
            message: 'Failed to update task status',
            severity: 'error',
          });
          throw new Error('Failed to update task status');
        }
      } catch (err) {
        console.error('Error toggling task completion:', err);

        // Revert the optimistic update
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? { ...task, completed: !newCompletedState }
              : task
          )
        );

        setNotification({
          open: true,
          message: 'Failed to update task status',
          severity: 'error',
        });
      }
    } catch (err) {
      console.error('Error toggling task completion:', err);
      // Already handled in the inner catch blocks
    }
  };

  // Open Dialogs
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (task: any) => {
    setCurrentEditTask(task);
    setEditDialogOpen(true);
  };

  // Add handleSubmitHappiness handler
  const handleSubmitHappiness = async (taskId: string, rating: number) => {
    try {
      // Show notification
      setNotification({
        open: true,
        message: 'Submitting happiness rating...',
        severity: 'info',
      });

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

      // Show success notification
      setNotification({
        open: true,
        message: 'Happiness rating submitted. Thank you!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error submitting happiness rating:', error);
      setNotification({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to submit happiness rating',
        severity: 'error',
      });
    }
  };

  return (
    <PageContainer title="Tasks" description="Manage your tasks">
      <Box sx={{ position: 'relative', minHeight: '70vh' }}>
        {/* Loading overlay */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Task filters and controls */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                />
              }
              label="Show Completed"
            />
            <Button
              variant="outlined"
              startIcon={<EventNoteIcon />}
              onClick={() => router.push('/tasks/history')}
              sx={{
                ml: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              History
            </Button>
          </Box>
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleOpenCreateDialog}
            sx={{
              position: { xs: 'fixed', sm: 'static' },
              bottom: { xs: 16, sm: 'auto' },
              right: { xs: 16, sm: 'auto' },
              zIndex: { xs: 1000, sm: 1 },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'rotate(90deg)',
              },
            }}
          >
            <AddIcon />
          </Fab>
        </Box>

        {/* Tasks grid */}
        <Grid container spacing={3}>
          {filteredTasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <TaskCard
                task={task}
                onComplete={handleComplete}
                onEdit={handleOpenEditDialog}
                onDelete={handleDelete}
              />
            </Grid>
          ))}
          {filteredTasks.length === 0 && !isLoading && (
            <Grid item xs={12}>
              <Box
                sx={{
                  textAlign: 'center',
                  py: 8,
                  px: 2,
                  backgroundColor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <EventNoteIcon
                  sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No tasks found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {showCompleted
                    ? "You haven't completed any tasks yet"
                    : "You don't have any active tasks"}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateDialog}
                  sx={{ mt: 3 }}
                >
                  Create Task
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Notification snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {/* Dialogs */}
        <TaskCreateDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onCreate={handleCreate}
          userTasks={tasks}
        />

        <TaskEditDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setCurrentEditTask(null);
          }}
          onSave={handleSaveEdit}
          initialTitle={currentEditTask?.title || ''}
          initialDescription={currentEditTask?.description || ''}
          initialFrequency={currentEditTask?.frequency || ''}
          userTasks={tasks}
        />

        <HappinessDialog
          open={happinessDialogOpen}
          onClose={() => {
            setHappinessDialogOpen(false);
            setRatingTaskId(null);
            setRatingTaskTitle('');
          }}
          onSubmit={handleSubmitHappiness}
          taskId={ratingTaskId || ''}
          taskTitle={ratingTaskTitle}
        />
      </Box>
    </PageContainer>
  );
}
