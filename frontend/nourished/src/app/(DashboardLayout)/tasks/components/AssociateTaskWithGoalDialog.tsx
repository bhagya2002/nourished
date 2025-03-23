'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';

// Define props interface
interface AssociateTaskWithGoalDialogProps {
  open: boolean;
  onClose: () => void;
  onAssociate: (taskId: string, goalId: string) => Promise<void>;
  task: any; // The task to associate
  goals: any[]; // Available goals
  isLoading: boolean;
}

const AssociateTaskWithGoalDialog: React.FC<AssociateTaskWithGoalDialogProps> = ({
  open,
  onClose,
  onAssociate,
  task,
  goals,
  isLoading,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens or task changes
  useEffect(() => {
    if (open) {
      setSelectedGoalId('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, task]);

  // Handle association
  const handleAssociate = async () => {
    if (!selectedGoalId) {
      setError('Please select a goal');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onAssociate(task.id, selectedGoalId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to associate task with goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out goals that already have this task
  const availableGoals = goals.filter(goal => 
    !goal.taskIds?.includes(task?.id)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Task to Goal</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Associate <strong>{task?.title}</strong> with a goal to track your progress.
            </Typography>

            {availableGoals.length === 0 ? (
              <Alert severity="info">
                No available goals found. Either you have no goals created yet or this task is already associated with all your goals.
              </Alert>
            ) : (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="goal-select-label">Select Goal</InputLabel>
                <Select
                  labelId="goal-select-label"
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value as string)}
                  label="Select Goal"
                  disabled={isSubmitting}
                >
                  {availableGoals.map((goal) => (
                    <MenuItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAssociate}
          disabled={isSubmitting || availableGoals.length === 0 || !selectedGoalId}
        >
          {isSubmitting ? 'Associating...' : 'Associate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssociateTaskWithGoalDialog; 