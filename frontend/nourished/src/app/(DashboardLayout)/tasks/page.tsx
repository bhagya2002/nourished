"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { db, auth } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import TaskEditDialog from "./components/TaskEditDialog";
import TaskCreateDialog from "./components/TaskCreateDialog";

import {
  Alert,
  Box,
  Fab,
  Grid,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";

export default function TasksPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  const [tasks, setTasks] = useState<any[]>([]);

  // Success / Error messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<any | null>(null);

  // Auto-clear success/error after a few seconds
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
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const tasksRef = collection(db, "tasks");
      const q = query(tasksRef, where("uid", "==", user?.uid));
      const querySnapshot = await getDocs(q);

      const tasksData = querySnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Handle open/close create dialog
  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
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
      const tasksRef = collection(db, "tasks");
      await addDoc(tasksRef, {
        uid: user?.uid,
        goalId: "dummyGaol123", // example
        title,
        description,
        frequency,
        createdAt: new Date(),
      });

      setSuccessMsg("Task created successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      setErrorMsg("Failed to create task. Please retry.");
    }
  };

  // Handle open/close edit dialog
  const handleOpenEditDialog = (task: any) => {
    setCurrentEditTask(task);
    setEditDialogOpen(true);
  };

  // Save changes from edit
  const handleSaveEdit = async (updatedData: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    try {
      const taskDocRef = doc(db, "tasks", currentEditTask.id);
      await updateDoc(taskDocRef, {
        title: updatedData.title,
        description: updatedData.description,
        frequency: updatedData.frequency,
      });
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
      await deleteDoc(doc(db, "tasks", taskId));
      setSuccessMsg("Task deleted successfully!");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      setErrorMsg("Failed to delete task.");
    }
  };

  const handleMarkComplete = async (taskId: string) => {
    try {
      await addDoc(collection(db, "taskCompletions"), {
        uid: user?.uid,
        taskId,
        completedAt: new Date(),
      });
      setSuccessMsg("Task marked complete!");
    } catch (err) {
      console.error("Error marking task complete:", err);
      setErrorMsg("Failed to mark test complete.");
    }
  };

  return (
    <PageContainer title="Tasks Page" description="Manage your tasks here">
      <DashboardCard title="Tasks Manager">
        {/* Alerts */}
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMsg}
          </Alert>
        )}

        {/* Task Grid */}
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="flex-start"
        >
          {tasks.map((task) => (
            <Grid
              item
              key={task.id}
              xs={12}
              sm={8}
              md={6}
              lg={4}
            >
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
                  <Button
                    variant="outlined"
                    onClick={() => handleMarkComplete(task.id)}
                  >
                    Mark Complete
                  </Button>
                  
                  {/* Edit / Delete Icons */}
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
        {/* Floating Action Button to open Create Dialog */}
        <Box sx={{ position: "fixed", bottom: 16, right: 16 }}>
          <Fab color="primary" onClick={handleOpenCreateDialog}>
            <AddIcon />
          </Fab>
        </Box>
      </DashboardCard>

      {/* Create Dialog */}
      <TaskCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreate}
        userTasks={tasks}
      />

      {/* Edit Dialog */}
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