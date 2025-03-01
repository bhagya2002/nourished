"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import TaskEditDialog from "./components/TaskEditDialog";
import TaskCreateDialog from "./components/TaskCreateDialog";
import {
  Alert,
  Box,
  Fab,
  Grid,
  Button,
  IconButton,
  Snackbar,
  Typography,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EventNoteIcon from '@mui/icons-material/EventNote';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

type NotificationSeverity = 'error' | 'warning' | 'info' | 'success';

export default function TasksPage() {
  const router = useRouter();
  const { user, token, loading, refreshToken } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<any | null>(null);

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: NotificationSeverity;
  }>({ open: false, message: '', severity: 'success' });

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/authentication/login");
    }
  }, [loading, user, router]);

  // Fetch tasks on mount (if logged in)
  useEffect(() => {
    if (user && token) {
      fetchTasks();
    }
  }, [user, token]);

  const fetchTasks = async () => {
    if (!token) {
      console.log("No token available");
      return;
    }

    try {
      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/getUserTasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: currentToken }),
        });
      };
      
      // First attempt with the current token
      let response = await makeRequest(token);
      
      // Check if we got a token expiration error
      if (response.status === 401) {
        const responseText = await response.text();
        console.log("Auth error response:", responseText);
        
        // If token has expired, try refreshing and retrying once
        if (responseText.includes('token has expired') || responseText.includes('auth/id-token-expired')) {
          console.log("Token expired, attempting to refresh...");
          const freshToken = await refreshToken();
          
          if (freshToken) {
            console.log("Token refreshed, retrying request");
            response = await makeRequest(freshToken);
          } else {
            // If token refresh failed, redirect to login
            router.push("/authentication/login");
            return;
          }
        } else {
          // Other auth error - redirect to login
          router.push("/authentication/login");
          return;
        }
      }
      
      const data = await response.json();
      console.log("Fetched tasks data:", data);

      if (!data) {
        throw new Error("No data received from server");
      }

      // Handle both cases: when data is wrapped in data property and when it's direct
      const tasksArray = Array.isArray(data) ? data : 
                        (data.data && Array.isArray(data.data)) ? data.data :
                        [];
      
      console.log("Setting tasks to:", tasksArray);
      setTasks(tasksArray);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setNotification({
        open: true,
        message: "Failed to fetch tasks. Please try again.",
        severity: "error"
      });
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
      console.log("Creating task:", { title, description, frequency }); // Debug log
      
      // Clear previous notification if any
      setNotification({ open: false, message: '', severity: 'success' });
      
      // Show loading notification
      setNotification({ open: true, message: "Creating task...", severity: "info" });
      
      // Try creating the task with the current token
      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/createTask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: currentToken,
            task: { 
              title, 
              description, 
              frequency, 
              completed: false, // Explicitly set to false
              createdAt: new Date().toISOString() 
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
        console.log("Auth error response:", responseText);
        
        // If token has expired, try refreshing and retrying once
        if (responseText.includes('token has expired') || responseText.includes('auth/id-token-expired')) {
          console.log("Token expired, attempting to refresh...");
          const freshToken = await refreshToken();
          
          if (freshToken) {
            console.log("Token refreshed, retrying request");
            response = await makeRequest(freshToken);
          }
        }
      }
      
      data = await response.json().catch(() => null);
      
      if (!response.ok) {
        const errorMessage = data?.error || "Failed to create task";
        throw new Error(errorMessage);
      }
      
      console.log("Create task response:", data); // Debug log
      
      setNotification({ open: true, message: "Task created successfully!", severity: "success" });
      await fetchTasks(); // Added await to ensure tasks are fetched after creation
    } catch (error: any) {
      console.error("Error creating task:", error);
      setNotification({ 
        open: true, 
        message: error.message || "Failed to create task. Please retry.", 
        severity: "error" 
      });
    }
  };

  // Delete task
  const handleDelete = async (taskId: string) => {
    try {
      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/deleteTask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: currentToken, taskId }),
        });
      };
      
      // First attempt with current token
      let response = await makeRequest(token!);
      
      // Check if we got a token expiration error
      if (response.status === 401) {
        const responseText = await response.text();
        console.log("Auth error response:", responseText);
        
        // If token has expired, try refreshing and retrying once
        if (responseText.includes('token has expired') || responseText.includes('auth/id-token-expired')) {
          console.log("Token expired, attempting to refresh...");
          const freshToken = await refreshToken();
          
          if (freshToken) {
            console.log("Token refreshed, retrying request");
            response = await makeRequest(freshToken);
          }
        }
      }

      const data = await response.json().catch(() => null);
      
      if (!response.ok) {
        const errorMessage = data?.error || "Failed to delete task";
        throw new Error(errorMessage);
      }

      setNotification({ open: true, message: "Task deleted successfully!", severity: "success" });
      fetchTasks();
    } catch (error: any) {
      console.error("Error deleting task:", error);
      setNotification({ open: true, message: error.message || "Failed to delete task", severity: "error" });
    }
  };
  
  // Save changes from edit
  const handleSaveEdit = async (updatedData: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    try {
      const updateField = async (field: string, value: string) => {
        const makeRequest = async (currentToken: string) => {
          return await fetch(`${API_BASE_URL}/editTask`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              token: currentToken, 
              taskId: currentEditTask.id, 
              fieldToChange: field, 
              newValue: value 
            }),
          });
        };
        
        // First attempt with current token
        let res = await makeRequest(token!);
        
        // Check if we got a token expiration error
        if (res.status === 401) {
          const responseText = await res.text();
          console.log("Auth error response:", responseText);
          
          // If token has expired, try refreshing and retrying once
          if (responseText.includes('token has expired') || responseText.includes('auth/id-token-expired')) {
            console.log("Token expired, attempting to refresh...");
            const freshToken = await refreshToken();
            
            if (freshToken) {
              console.log("Token refreshed, retrying request");
              res = await makeRequest(freshToken);
            }
          }
        }
        
        const data = await res.json().catch(() => null);
        
        if (!res.ok) {
          const errorMessage = data?.error || `Failed to update ${field}`;
          throw new Error(errorMessage);
        }
        
        return data;
      };

      await Promise.all([
        updateField("title", updatedData.title),
        updateField("description", updatedData.description),
        updateField("frequency", updatedData.frequency),
      ]);
      setNotification({ open: true, message: "Task updated successfully!", severity: "success" });
      fetchTasks();
    } catch (error: any) {
      console.error("Error updating task:", error);
      setNotification({ open: true, message: error.message || "Failed to update task", severity: "error" });
    }
  };

  // Toggle Task Completion (complete/incomplete)
  const handleComplete = async (taskId: string) => {
    try {
      if (!taskId) {
        console.warn("Invalid task ID provided");
        return;
      }

      // Find the current task
      const currentTask = tasks.find(task => task.id === taskId);
      if (!currentTask) {
        console.warn("Task not found in local state");
        return;
      }
      
      // New completed state (toggle current state)
      const newCompletedState = !currentTask.completed;
      
      // Show notification during toggle - this acts as a loading indicator
      setNotification({ 
        open: true, 
        message: "Updating task status...", 
        severity: "info" 
      });
      
      // Optimistically update UI first
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: newCompletedState } : task
      ));

      // Simple timeout handling to prevent UI freezing
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      console.log(`Sending toggle request for task ${taskId} to ${newCompletedState ? 'complete' : 'incomplete'}`);
      
      try {
        const makeRequest = async (currentToken: string) => {
          return await fetch(`${API_BASE_URL}/toggleTaskCompletion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              token: currentToken, 
              taskId,
              completed: newCompletedState 
            }),
            signal: controller.signal
          });
        };
        
        // First attempt with current token
        let response = await makeRequest(token!);
        
        // Check if we got a token expiration error
        if (response.status === 401) {
          const responseText = await response.text();
          console.log("Auth error response:", responseText);
          
          // If token has expired, try refreshing and retrying once
          if (responseText.includes('token has expired') || responseText.includes('auth/id-token-expired')) {
            console.log("Token expired, attempting to refresh...");
            const freshToken = await refreshToken();
            
            if (freshToken) {
              console.log("Token refreshed, retrying request");
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
            message: newCompletedState ? "Task marked complete!" : "Task marked incomplete", 
            severity: "success" 
          });
          return;
        }
        
        // If we get here, response was not OK
        let errorMessage = "Failed to update task completion";
        
        // Try to get a more specific error message if possible
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError);
          }
        } else {
          // Not JSON, try to get text
          try {
            const textError = await response.text();
            if (textError && textError.length > 0) {
              errorMessage = textError;
            }
          } catch (textError) {
            console.error("Error getting response text:", textError);
          }
        }
        
        console.error("Server returned error:", errorMessage);
        
        // Revert optimistic update
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completed: currentTask.completed } : task
        ));
        
        // Show error notification
        setNotification({ 
          open: true, 
          message: errorMessage, 
          severity: "error" 
        });
      } catch (fetchError) {
        // Handle network errors
        console.error("Network error during toggle task completion:", fetchError);
        
        // Revert optimistic update
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completed: currentTask.completed } : task
        ));
        
        // Show appropriate error message
        const errorMessage = fetchError instanceof Error && fetchError.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : (fetchError instanceof Error ? fetchError.message : 'Network error');
        
        setNotification({ 
          open: true, 
          message: errorMessage, 
          severity: "error" 
        });
      }
    } catch (error) {
      console.error("Unexpected error in handleComplete:", error);
      
      // Ensure tasks remain visible even on error
      setNotification({ 
        open: true, 
        message: error instanceof Error ? error.message : "An unexpected error occurred", 
        severity: "error" 
      });
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

  return (
    <PageContainer title="Task Manager" description="Manage your tasks">
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Your Tasks</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined"
              color="secondary"
              onClick={() => router.push('/tasks/history')}
              startIcon={<EventNoteIcon />}
            >
              History
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              Add Task
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : notification.open ? (
          <Snackbar
            open={notification.open}
            autoHideDuration={3000}
            onClose={() => setNotification({ ...notification, open: false })}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx = {{ width: "100%" }}>
              {notification.message}
            </Alert>
          </Snackbar>
        ) : (
          <>
            {tasks.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                You don't have any tasks yet. Click "Add Task" to create one.
              </Alert>
            ) : (
              <Grid container spacing={3} alignItems="stretch">
                {tasks.map((task) => (
                  <Grid item xs={12} sm={6} md={4} key={task.id} sx={{ display: 'flex' }}>
                    <Card 
                      sx={{ 
                        width: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'box-shadow 0.3s, transform 0.2s',
                        '&:hover': {
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        },
                        backgroundColor: 'white', // Always white background
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                        <Typography 
                          variant="h6" 
                          component="div" 
                          sx={{ 
                            mb: 1.5,
                            color: 'text.primary',
                          }}
                        >
                          {task.title}
                          {task.completed && (
                            <CheckCircleIcon 
                              fontSize="small" 
                              color="success" 
                              sx={{ ml: 1, verticalAlign: 'middle' }} 
                            />
                          )}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2, 
                            minHeight: '40px',
                            maxHeight: '60px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {task.description || "No description provided"}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(task.createdAt).toLocaleDateString()}
                          </Typography>
                          {task.frequency && (
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                              {task.frequency}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                      
                      <CardActions sx={{ 
                        justifyContent: 'space-between', 
                        padding: '16px',
                        paddingTop: '16px',
                        paddingBottom: '24px',
                        borderTop: '1px solid rgba(0,0,0,0.1)'
                      }}>
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={task.completed}
                                onChange={() => handleComplete(task.id)}
                                color="primary"
                                icon={<RadioButtonUncheckedIcon />}
                                checkedIcon={<CheckCircleIcon />}
                                disabled={loading}
                              />
                            }
                            label={
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: task.completed ? 'success.main' : 'text.secondary',
                                  fontWeight: task.completed ? 'medium' : 'normal',
                                  lineHeight: 1.2,
                                  whiteSpace: 'nowrap',
                                  display: 'block'
                                }}
                              >
                                {task.completed ? "Completed" : "Mark Complete"}
                              </Typography>
                            }
                          />
                        </Box>
                        <Box>
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenEditDialog(task)}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDelete(task.id)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>

      <TaskCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreate}
        userTasks={tasks}
      />
      <TaskEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveEdit}
        initialTitle={currentEditTask?.title || ""}
        initialDescription={currentEditTask?.description || ""}
        initialFrequency={currentEditTask?.frequency || ""}
        userTasks={tasks}
      />
    </PageContainer>
  );
}