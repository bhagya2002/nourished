"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Fade,
  Alert,
} from "@mui/material";

interface TaskEditProps {
  open: boolean;
  onClose: () => void;
  onSave: (updateData: {
    title: string;
    description: string;
    frequency: string;
  }) => Promise<void>;

  initialTitle: string;
  initialDescription: string;
  initialFrequency: string;
  userTasks: any[];
}

const TaskEditDialog: React.FC<TaskEditProps> = ({
  open,
  onClose,
  onSave,
  initialTitle,
  initialDescription,
  initialFrequency,
  userTasks,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [frequency, setFrequency] = useState(initialFrequency);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setFrequency(initialFrequency);
      setErrorMsg(null);
    }
  }, [open, initialTitle, initialDescription, initialFrequency]);

  const handleSaveClick = async () => {
    setErrorMsg(null);

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
    if (!frequency.trim()) {
      setErrorMsg("Frequency is required.");
      return;
    }

    const duplicates = userTasks.filter(
      (t) =>
        t.title.toLowerCase() === title.toLowerCase() && t.title != initialTitle
    );
    if (duplicates.length > 0) {
      setErrorMsg("A task with that title alreadyv exist!");
      return;
    }

    setSaving(true);
    try {
      await onSave({ title, description, frequency });
      onClose();
    } catch (error: any) {
      setErrorMsg(error.message || "Update failed-please retry.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setErrorMsg(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Fade}
    >
      <DialogTitle>Edit Task</DialogTitle>
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
            required
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            size="small"
          >
            <MenuItem value="">Select frequency</MenuItem>
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
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskEditDialog;
