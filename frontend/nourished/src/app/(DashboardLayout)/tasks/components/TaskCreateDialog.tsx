"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
} from "@mui/material";

interface TaskCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    frequency: string;
  }) => Promise<void>;
  userTasks: any[]; // to check for duplicates if needed
}

const TaskCreateDialog: React.FC<TaskCreateDialogProps> = ({
  open,
  onClose,
  onCreate,
  userTasks,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveClick = async () => {
    setErrorMsg(null);

    // Basic Validation
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

    // Optional: check for duplicates
    const duplicates = userTasks.filter(
      (t) => t.title.toLowerCase() === title.toLowerCase()
    );
    if (duplicates.length > 0) {
      setErrorMsg("A task with that title already exists!");
      return;
    }

    setSaving(true);
    try {
      await onCreate({ title, description, frequency });
      // Clear form after success
      setTitle("");
      setDescription("");
      setFrequency("");
      onClose();
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setErrorMsg(null);
    // Clear form if desired
    setTitle("");
    setDescription("");
    setFrequency("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>Add a New Task</DialogTitle>
      <DialogContent dividers>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}
        <Stack spacing={2}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="small"
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            size="small"
          />
          <TextField
            select
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            size="small"
          >
            <MenuItem value="">(none)</MenuItem>
            <MenuItem value="Daily">Daily</MenuItem>
            <MenuItem value="Weekly">Weekly</MenuItem>
            <MenuItem value="Monthly">Monthly</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSaveClick} disabled={saving}>
          {saving ? "Saving..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskCreateDialog;