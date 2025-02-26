"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

type NotificationSeverity = 'error' | 'warning' | 'info' | 'success';

const defaultTasks = [
  {
    id: "default-1",
    title: "Morning Meditation",
    description: "15 minutes of mindfulness meditation",
    frequency: "Daily",
    completed: false,
    uid: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-2",
    title: "Workout Session",
    description: "30 minutes cardio and strength training",
    frequency: "3x Weekly",
    completed: false,
    uid: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-3",
    title: "Meal Planning",
    description: "Plan healthy meals for the week ahead",
    frequency: "Weekly",
    completed: false,
    uid: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-4",
    title: "Water Intake",
    description: "Drink 8 glasses of water",
    frequency: "Daily",
    completed: false,
    uid: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-5",
    title: "Reading",
    description: "Read a book for 30 minutes",
    frequency: "Daily",
    completed: false,
    uid: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-6",
    title: "Vitamin Supplements",
    description: "Take daily vitamins and supplements",
    frequency: "Daily",
    completed: false,
    uid: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "default-7",
    title: "Sleep Schedule",
    description: "Maintain consistent sleep/wake times",
    frequency: "Daily",
    completed: false,
    uid: null,
    createdAt: new Date().toISOString(),
  },
];

export default function TasksPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [tasks, setTasks] = useState<any[]>(defaultTasks);

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
    try {
      const response = await fetch(`${API_BASE_URL}/getUserTasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const tasksData = await response.json();
      setTasks(tasksData.length > 0 ? tasksData : defaultTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks(defaultTasks); // Fallback to default tasks on error
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
      const response = await fetch(`${API_BASE_URL}/createTask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          task: { title, description, frequency, createdAt: new Date().toISOString() },
        }),
      });
      if (!response.ok) throw new Error("Failed to create task");
      setNotification({ open: true, message: "Task created successfully!", severity: "success" });
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      setNotification({ open: true, message: "Failed to create task. Please retry.", severity: "error" });
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
        const res = await fetch(`${API_BASE_URL}/editTask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, taskId: currentEditTask.id, fieldToChange: field, newValue: value }),
        });
        if (!res.ok) throw new Error(`Failed to update ${field}`)
      };

      await Promise.all([
        updateField("title", updatedData.title),
        updateField("description", updatedData.description),
        updateField("frequency", updatedData.frequency),
      ]);
      setNotification({ open: true, message: "Task updated successfully!", severity: "success" });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      setNotification({ open: true, message: "Failed to update task", severity: "error" });
    }
  };

  // Delete task
  const handleDelete = async (taskId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/deleteTask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, taskId }),
      });
      if (!response.ok) throw new Error("Failed to delete task");
      setNotification({ open: true, message: "Task deleted successfully!", severity: "success" });
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      setNotification({ open: true, message: "Failed to delete task", severity: "error" });
    }
  };

  // Mark Task Complete
  const handleComplete = async (taskId: string) => {
    // If it's a default task (starts with "default-"), don't try to update backend
    if (taskId.startsWith("default-")) {
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      ));
      setNotification({ open: true, message: "Task marked complete!", severity: "success" });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/completeTask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, taskId }),
      });
      if (!response.ok) throw new Error("Failed to mark task complete");
      setNotification({ open: true, message: "Task marked complete!", severity: "success" });
      fetchTasks();
    } catch (error: any) {
      console.error(error);
      setNotification({ open: true, message: "Error completing task", severity: "error" });
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
    <PageContainer title="Tasks Page" description="Manage your tasks here">
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
      <DashboardCard title="Tasks Manager">
        <Box>
          <Grid container spacing={3} justifyContent="flex-start" alignItems="flex-start">
            {tasks.map((task, index) => (
              <Grid item key={task.id || index} xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="600">
                      {task.title}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {task.description}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Frequency: {task.frequency || "(none)"}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "space-between" }}>
                    <Button 
                      variant="contained" 
                      onClick={() => handleComplete(task.id)}
                      sx={{ 
                        bgcolor: task.completed ? 'success.main' : 'primary.main',
                        '&:hover': {
                          bgcolor: task.completed ? 'success.dark' : 'primary.dark',
                        }
                      }}
                    >
                      {task.completed ? "Completed ✓" : "Mark Complete"}
                    </Button>
                    <Box>
                      <IconButton color="primary" onClick={() => handleOpenEditDialog(task)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(task.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ position: "fixed", bottom: 16, right: 16 }}>
            <Fab color="primary" onClick={handleOpenCreateDialog}>
              <AddIcon />
            </Fab>
          </Box>
        </Box>
      </DashboardCard>

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