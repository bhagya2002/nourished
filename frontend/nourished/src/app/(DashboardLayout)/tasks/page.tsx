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
import { Alert, Box, Button, MenuItem, TextField, Typography, IconButton, Stack } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { update } from "lodash";


export default function TasksPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/authentication/login");
    }
  }, [loading, user, router]);

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

  // Create a new task
  const handleCreate = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Input Validation
    if (!title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Description is required.");
      return;
    }
    if (title.length > 50) {
      setErrorMsg("Title must be <= 50 characters.");
      return;
    }
    if (description.length > 200) {
      setErrorMsg("Description must be <= 200 characters.");
      return;
    }

    try {
      console.log("Creating task...")

      const tasksRef = collection(db, "tasks");
      await addDoc(tasksRef, {
        uid: user?.uid,
        goalId: "dummyGaol123", // dummy goal
        title,
        description,
        frequency,
        CreatedAt: new Date(),
      });

      setSuccessMsg("Task created successfully!");

      // Clear form
      setTitle("");
      setDescription("");
      setFrequency("");

      // Refresh
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
      setErrorMsg("Failed to create task. Please retry.");
    }
  };

  // Edit an existing task
  const handleEdit = (taskId: string, curTitle: string, curDesc: string, curFreq: string) => {
    setEditId(taskId);
    setTitle(curTitle);
    setDescription(curDesc);
    setFrequency(curFreq);
  };

  // Submit the edit
  const handleUpdate = async () => {
    if (!editId) return;
    try {
      const taskDocRef = doc(db, "tasks", editId);
      await updateDoc(taskDocRef, {
        title,
        description,
        frequency,
      });

      // Clear form
      setTitle("");
      setDescription("");
      setFrequency("");
      setEditId(null);

      // Refresh
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDelete = async (taskId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      console.log("Deleting task ID:", taskId);
      await deleteDoc(doc(db, "tasks", taskId));
      setSuccessMsg("task deleted successfully");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      setErrorMsg("Failed to delete task.")
    }
  };

  return (
    <PageContainer title="Tasks Page" description="Manage your tasks here">
      <DashboardCard title="Tasks Manager">
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2}}>
            {successMsg}
          </Alert>
        )}
        {/* Form for Create or Edit */}
        <Box mb={2}>
          <Typography variant="h6" gutterBottom>
            {editId ? "Edit Task" : "Create a New Task"}
          </Typography>
          <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
            <TextField
              label="Title"
              variant="outlined"
              size="small"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Description"
              variant="outlined"
              size="small"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
              select
              label="Frequency"
              variant="outlined"
              size="small"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              sx={{ width: 140 }}
            >
              <MenuItem value="">(none)</MenuItem>
              <MenuItem value="Daily">Daily</MenuItem>
              <MenuItem value="Weekly">Weekly</MenuItem>
              <MenuItem value="Monthly">Monthly</MenuItem>
            </TextField>
          </Stack>

          {!editId && (
            <Button variant="contained" onClick={handleCreate}>
              Create Task
            </Button>
          )}
          {editId && (
            <Button variant="contained" color="secondary" onClick={handleUpdate}>
              Update Task
            </Button>
          )}
        </Box>

        {/* Render tasks */}
        <Box>
          {tasks.map((task) => (
            <Box
              key={task.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 1,
                p: 1,
                border: "1px solid #ccc",
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {task.title}
                </Typography>
                <Typography variant="body2">Description: {task.description}</Typography>
                <Typography variant="body2">Frequency: {task.frequency}</Typography>
              </Box>
              <Box>
                <IconButton
                  color="primary"
                  onClick={() => handleEdit(task.id, task.title, task.description, task.frequency)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(task.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      </DashboardCard>
    </PageContainer>
  );
}