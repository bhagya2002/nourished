"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Fab, Box, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, List, ListItem, ListItemText, IconButton, ListItemSecondaryAction, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

export default function GoalsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ id:'' ,title: '', description: '', deadline: '', createAt: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [validationError, setValidationError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  // reset the form to initial state
  const resetNewGoal = () => {
    setNewGoal({ id: '', title: '', description: '', deadline: '', createAt: '' });
  }

  // Fetches user's goals from the database to populate the list
  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUserGoals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to fetch goals");
      const goalsData = await response.json();
      setGoals(goalsData);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  };

  // Opens and resets the form dialog
  const handleAddGoalClick = () => {
    resetNewGoal();
    setIsEditing(false);
    setOpen(true);
    setValidationError('');
  };

  // Populates form with goal data for editing
  const handleEditGoalClick = (index: number) => {
    setIsEditing(true);
    setEditingIndex(index);
    setNewGoal(goals[index]);
    setOpen(true);
  };

  // Deletes a goal after confirmation
  const handleDeleteGoalClick = async (index: number) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/deleteGoal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, goalId: goals[index].id }),
        });
        if (!response.ok) throw new Error("Failed to delete goal");
        setGoals(prevGoals => prevGoals.filter((_, i) => i !== index));
      } catch (error) {
        console.error("Error deleting goal:", error);
      }
    }
  };

  // Closes the dialog
  const handleClose = () => {
    setOpen(false);
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
      setValidationError("Title must be filled out.");
      return;
    }
    if (!newGoal.description.trim()) {
      setValidationError("Description must be filled out.");
      return;
    }
    if (!newGoal.deadline) {
      setValidationError("Deadline must be filled out.");
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
        }

        await Promise.all([
          updateField('title', newGoal.title),
          updateField('description', newGoal.description),
          updateField('deadline', newGoal.deadline),
        ]);
        setGoals(prevGoals => prevGoals.map((goal, idx) => idx === editingIndex ? newGoal : goal));
      } catch (error) {
        console.error("Error updating goal:", error);
      }
      setOpen(false);
      resetNewGoal();
    } else {
      // Otherwise, create a new goal in the database
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
              createAt: new Date().toISOString(),
            },
          }),
        });
        if (!response.ok) throw new Error('Failed to create goal');
        fetchGoals();
      } catch (error) {
        console.error("Error creating goal:", error);
      }
      setOpen(false);
      resetNewGoal();
    }
  };

  // Redirects to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/authentication/login");
    }
  }, [loading, user, router]);

  // Fetches goals while initializing the goals page
  useEffect(() => {
    if (user && token) {
      fetchGoals();
    }
  }, [user, token]);

  return (
    <div className="goals-container">
      <List>
        {goals.map((goal, index) => (
          <ListItem key={index}>
            <ListItemText primary={goal.title} secondary={`Description: ${goal.description}, Deadline: ${goal.deadline}`} />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => handleEditGoalClick(index)}>
                <EditIcon />
              </IconButton>
              <IconButton edge="end" onClick={() => handleDeleteGoalClick(index)}>
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Box sx={{ position: "fixed", bottom: 16, right: 16 }}>
        <Fab color="primary" onClick={handleAddGoalClick} aria-label="Add Goal">
          <AddIcon />
        </Fab>
      </Box>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Edit Goal' : 'Add a New Goal'}</DialogTitle>
        <DialogContent dividers>
          {validationError && <Alert severity="error" style={{ margin: '0px' }}>{validationError}</Alert>}
          <TextField autoFocus margin='normal' label="Title" type="text" fullWidth name="title" value={newGoal.title} onChange={handleInputChange} size="small" />
          <TextField margin='normal' label="Description" type="text" fullWidth name="description" value={newGoal.description} onChange={handleInputChange} size='small' />
          <TextField margin='normal' label="Deadline" type="date" fullWidth name="deadline" value={newGoal.deadline} onChange={handleInputChange} InputLabelProps={{ shrink: true }} size='small' inputProps={{ min: today }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant='contained' onClick={handleSubmit}>{isEditing ? 'Save' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};