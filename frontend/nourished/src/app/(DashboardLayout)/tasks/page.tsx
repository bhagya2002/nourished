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
  Stack,
  Typography,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

export default function TasksPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);

  // Success / Error messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<any | null>(null);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

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
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
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
      setSuccessMsg("Task created successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      setErrorMsg("Failed to create task. Please retry.");
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
      setSuccessMsg("Task updated successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
      setErrorMsg("Failed to update task.");
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
      setSuccessMsg("Task deleted successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      setErrorMsg("Failed to delete task.");
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
      <DashboardCard title="Tasks Manager">
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        <Grid container spacing={3} justifyContent="center" alignItems="flex-start">
          {tasks.map((task, index) => (
            <Grid item key={task.id || index} xs={12} sm={8} md={6} lg={4}>
              <Card sx={{ display: "flex", flexDirection: "column", minHeight: 250 }}>
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
                  <Button variant="outlined" /* your mark complete logic if needed */>
                    Mark Complete
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
      </DashboardCard>

      <TaskCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreate}
        userTasks={tasks}
      />
      {currentEditTask && (
        <TaskEditDialog
          open={editDialogOpen}
          onClose={() => {setEditDialogOpen(false); setCurrentEditTask(null);}}
          onSave={handleSaveEdit}
          initialTitle={currentEditTask.title}
          initialDescription={currentEditTask.description}
          initialFrequency={currentEditTask.frequency}
          userTasks={tasks}
        />
      )}
    </PageContainer>
  );
}