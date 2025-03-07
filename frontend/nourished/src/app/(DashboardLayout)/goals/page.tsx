'use client';

import React, { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Fab,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
  Alert,
  Snackbar,
  AlertColor,
  Collapse,
  ListItemButton,
  ListItemIcon,
  Card,
  CardContent,
  Typography,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PageContainer from '../components/container/PageContainer';
import TaskCreateDialog from '../tasks/components/TaskCreateDialog';
import TaskEditDialog from '../tasks/components/TaskEditDialog';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';

// Define a type for the goals
export type Goal = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  createdAt: string;
  tasks: any[];
};

export default function GoalsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Goal>({
    id: '',
    title: '',
    description: '',
    deadline: '',
    createdAt: '',
    tasks: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [validationError, setValidationError] = useState('');
  const [toast, setToast] = useState({
    open: false,
    message: 'nothing',
    severity: 'info',
  });
  const today = new Date().toISOString().split('T')[0];
  const [expandingGoalIndex, setExpandingGoalIndex] = useState(-1);

  const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false);
  const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
  const [taskEditingIndex, setTaskEditingIndex] = useState(-1);

  // reset the form to initial state
  const resetNewGoal = () => {
    setNewGoal({
      id: '',
      title: '',
      description: '',
      deadline: '',
      createdAt: '',
      tasks: [],
    });
  };

  // Handle closing the toast box
  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  // Fetches user's goals from the database to populate the list
  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUsergoals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error('Failed to fetch goals');
      const goalsData = await response.json();
      console.log(goalsData.data)

      // Ensure we're setting an array even if the API returns something else
      if (goalsData && goalsData.data && Array.isArray(goalsData.data)) {
        goalsData.data.forEach((goal: any) => {
          goal.tasks = goal.taskIds;
          delete goal.taskIds;
        });
        setGoals(goalsData.data);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      setToast({
        open: true,
        message: 'Failed to fetch goals',
        severity: 'error',
      });
      setGoals([]); // Ensure goals is always an array even on error
    }
  };

  const fetchGoalTasks = async (index: number) => {
    const goalId = goals[index].id;
    try {
      const response = await fetch(`${API_BASE_URL}/getGoalTasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, goalId: goalId }),
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const tasksData = await response.json();

      // Ensure tasksData is an array
      const tasksArray = Array.isArray(tasksData)
        ? tasksData
        : tasksData && Array.isArray(tasksData.data)
          ? tasksData.data
          : [];
      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[index] };
        updatedGoal.tasks = tasksArray;
        return prevGoals.map((goal, idx) => (idx === index ? updatedGoal : goal));
      });
      setToast({
        open: true,
        message: 'Tasks fetched successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setToast({
        open: true,
        message: 'Failed to fetch tasks',
        severity: 'error',
      });
    }
  };

  // Opens and resets the form dialog
  const handleAddGoalClick = () => {
    setIsEditing(false);
    setGoalModalOpen(true);
    setValidationError('');
  };

  // Populates form with goal data for editing
  const handleEditGoalClick = (index: number) => {
    setIsEditing(true);
    setEditingIndex(index);
    setNewGoal(goals[index]);
    console.log(goals[index]);
    setGoalModalOpen(true);
  };

  // Deletes a goal after confirmation
  const handleDeleteGoalClick = async (index: number) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/deleteGoal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, goalId: goals[index].id }),
        });
        if (!response.ok) throw new Error('Failed to delete goal');
        setGoals((prevGoals) => prevGoals.filter((_, i) => i !== index));
        setToast({
          open: true,
          message: 'Goal deleted successfully!',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error deleting goal:', error);
        setToast({
          open: true,
          message: 'Failed to delete goal',
          severity: 'error',
        });
      }
    }
  };

  // Closes the dialog
  const handleClose = () => {
    setGoalModalOpen(false);
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
      setValidationError('Title must be filled out.');
      return;
    }
    if (!newGoal.description.trim()) {
      setValidationError('Description must be filled out.');
      return;
    }
    if (!newGoal.deadline) {
      setValidationError('Deadline must be filled out.');
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
        };

        await Promise.all([
          updateField('title', newGoal.title),
          updateField('description', newGoal.description),
          updateField('deadline', newGoal.deadline),
        ]);
        // Update the goals array with the new goal (avoiding redundant fetches)
        setGoals((prevGoals) =>
          prevGoals.map((goal, idx) => (idx === editingIndex ? newGoal : goal))
        );
        setToast({
          open: true,
          message: 'Goal updated successfully!',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error updating goal:', error);
        setToast({
          open: true,
          message: 'Failed to update goal',
          severity: 'error',
        });
      }
      setGoalModalOpen(false);
      resetNewGoal();
    } else {
      // Otherwise, create a new goal in the database
      const goalCreatedAt = new Date().toISOString();
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
              createdAt: goalCreatedAt,
              taskIds: [],
            },
          }),
        });
        if (!response.ok) throw new Error('Failed to create goal');
        const goalData = await response.json();
        if (!(goalData && goalData.data)) {
          throw new Error('Failed to create post');
        }
        const goalId = goalData.data.id;
        // Update the goals array with the new goal (avoiding redundant fetches)
        setGoals((prevGoals) => [
          ...prevGoals,
          { ...newGoal, id: goalId, createdAt: goalCreatedAt },
        ]);
        setToast({
          open: true,
          message: 'Goal created successfully!',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error creating goal:', error);
        setToast({
          open: true,
          message: 'Failed to create goal',
          severity: 'error',
        });
      }
      setGoalModalOpen(false);
      resetNewGoal();
    }
  };

  const handleGoalExpand = (index: number) => {
    if (expandingGoalIndex !== index) {
      // Fetch goal tasks if needed
      if (goals[index].tasks && typeof goals[index].tasks[0] === 'string') {
        fetchGoalTasks(index);
      }
    }
    setExpandingGoalIndex(index === expandingGoalIndex ? -1 : index);
  };

  // Create a new task
  const handleGoalTaskCreate = async ({
    title,
    description,
    frequency,
  }: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    const taskCreatedAt = new Date().toISOString();
    // save the task to the database
    try {
      const response = await fetch(`${API_BASE_URL}/createTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          task: {
            title,
            description,
            frequency,
            createdAt: taskCreatedAt,
            goalId: goals[expandingGoalIndex].id,
          },
          goalId: goals[expandingGoalIndex].id,
        }),
      });
      if (!response.ok) throw new Error('Failed to create task');
      const taskId = (await response.json()).id;
      const newTask = {
        id: taskId,
        title,
        description,
        frequency,
        createdAt: taskCreatedAt,
        goalId: goals[expandingGoalIndex].id,
      }
      setGoals((prevGoals) =>
        prevGoals.map((goal, index) =>
          index === expandingGoalIndex
            ? { ...goal, tasks: [...goal.tasks, newTask] }
            : goal
        )
      );
      setToast({
        open: true,
        message: 'Task created successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      setToast({
        open: true,
        message: 'Failed to create task',
        severity: 'error',
      });
    }
  };

  // Save task changes from edit
  const handleGoalTaskEdit = async (updatedData: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    try {
      const updateField = async (field: string, value: string) => {
        const res = await fetch(`${API_BASE_URL}/editTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            taskId: goals[expandingGoalIndex].tasks[taskEditingIndex].id,
            fieldToChange: field,
            newValue: value,
          }),
        });
        if (!res.ok) throw new Error(`Failed to update ${field}`);
      };

      await Promise.all([
        updateField('title', updatedData.title),
        updateField('description', updatedData.description),
        updateField('frequency', updatedData.frequency),
      ]);
      // Update the goal tasks array with the new task (avoiding redundant fetches)
      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[expandingGoalIndex] };
        const updatedTasks = [...updatedGoal.tasks];
        updatedTasks[taskEditingIndex] = {
          ...updatedTasks[taskEditingIndex],
          ...updatedData,
        };
        updatedGoal.tasks = updatedTasks;
        return prevGoals.map((goal, idx) =>
          idx === expandingGoalIndex ? updatedGoal : goal
        );
      });
      setToast({
        open: true,
        message: 'Task updated successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      setToast({
        open: true,
        message: 'Failed to update task',
        severity: 'error',
      });
    }
  };

  // Delete task
  const handleGoalTaskDelete = async (
    taskId: string,
    goalId: string,
    taskDeletingIndex: number
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/deleteTask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, taskId, goalId }),
      });
      if (!response.ok) throw new Error('Failed to delete task');
      setToast({
        open: true,
        message: 'Task deleted successfully!',
        severity: 'success',
      });
      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[expandingGoalIndex] };
        const updatedTasks = [...updatedGoal.tasks];
        // Filter out the task to be deleted
        const filteredTasks = updatedTasks.filter(
          (_, i) => i !== taskDeletingIndex
        );
        // Update the specific goal's tasks
        updatedGoal.tasks = filteredTasks;
        return prevGoals.map((goal, idx) =>
          idx === expandingGoalIndex ? updatedGoal : goal
        );
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      setToast({
        open: true,
        message: 'Failed to delete task',
        severity: 'error',
      });
    }
  };

  // Redirects to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/authentication/login');
    }
  }, [loading, user, router]);

  // Fetches goals while initializing the goals page
  useEffect(() => {
    if (user && token) {
      fetchGoals();
    }
  }, [user, token]);

  return (
    <PageContainer title='Goals' description='Create and manage your goals'>
      <Box sx={{ mt: 2 }}>
        {/* popup toast message */}
        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={handleToastClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          sx={{ '&.MuiSnackbar-root': { bottom: 88, left: { lg: 270 + 16 } } }}
        >
          <Alert
            onClose={handleToastClose}
            severity={toast.severity as AlertColor}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>

        {/* Goals Page Title and Add Goal Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, ml: 2, mr: 2 }}>
          <Typography variant="h3">Your Goals</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddGoalClick}
            >
              Add Goal
            </Button>
          </Box>
        </Box>

        {/* goals list */}
        <List>
          {goals.map((goal, index) => (
            <Card key={index}
              sx={{
                mb: 2,
                mr: 2,
                ml: { xs: 4, sm: 6 },
                display: 'flex',
                flexDirection: 'row',
                overflow: 'initial',
                boxShadow: 4,
                borderRadius: 4,
                alignItems: 'center',
              }}>
              {/* progress bar */}
              <Card
                sx={{
                  marginY: 2,
                  width: { xs: 120, sm: 160 },
                  transform: 'translateX(-32px)',
                  ml: 0,
                  pb: { xs: 16, sm: 20 },
                  height: 0,
                  backgroundColor: 'secondary.main',
                  opacity: 0.5,
                  position: 'relative',
                  borderRadius: 4,
                  flexShrink: 0,
                  userSelect: 'none',
                  "&:after": {
                    content: '"%"',
                    position: 'absolute',
                    bottom: { xs: 32, sm: 40 },
                    right: 8,
                    fontSize: { xs: 80, sm: 120 },
                    fontWeight: 1000,
                    color: 'common.white',
                    opacity: 0.3,
                  }
                }}>
                <Typography sx={{ position: 'absolute', top: { xs: 32, sm: 48 }, left: 8, textAlign: 'center', color: 'common.white', fontSize: { xs: 80, sm: 120 }, fontWeight: 1000 }}>
                  99
                </Typography>
              </Card>
              {/* goal info */}
              <CardContent
                sx={{
                  '&.MuiCardContent-root': { p: 0 },
                  flex: 1,
                  my: 2,
                }}>
                <ListItem disablePadding
                  secondaryAction={
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, }}>
                      <IconButton
                        edge='end'
                        onClick={() => handleEditGoalClick(index)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge='end'
                        onClick={() => handleDeleteGoalClick(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }>
                  <ListItemButton onClick={() => handleGoalExpand(index)}
                    sx={{
                      p: 0,
                      transform: 'translateX(-16px)',
                      '&.MuiListItemButton-root': { p: 0, pr: 3 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-evenly',
                      alignItems: 'flex-start',
                      height: { xs: 120, sm: 160 }
                    }}>
                    <Typography color='common.grey' sx={{ opacity: 0.5, fontSize: 14, fontWeight: 600, pt: 0.5 }}>BEFORE {goal.deadline}</Typography>
                    <Typography sx={{ fontSize: { xs: 18, sm: 21 }, fontWeight: 600, pt: 0.5 }}>{goal.title}</Typography>
                    <Typography sx={{ fontSize: { xs: 14, sm: 16 }, fontWeight: 400, pt: 1 }}>{goal.description}</Typography>
                  </ListItemButton>
                </ListItem>
                <Collapse
                  in={index === expandingGoalIndex}
                  timeout='auto'
                  unmountOnExit
                >
                  {/* goal tasks list */}
                  <Divider sx={{ my: 1 }} />
                  <List component='div' disablePadding>
                    {goals[index].tasks !== undefined &&
                      goals[index].tasks.map((task: any, taskIndex: number) => (
                        <ListItem key={taskIndex} sx={{ pl: 4 }}>
                          <ListItemText
                            primary={task.title}
                            secondary={`ID: ${task.id}, Description: ${task.description}, CreatedAt: ${task.createdAt}, GoalId: ${task.goalId}`}
                          />
                          <ListItemSecondaryAction sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                            <IconButton
                              edge='end'
                              sx={{ right: 24 }}
                              onClick={() => {
                                setTaskEditModalOpen(true);
                                setTaskEditingIndex(taskIndex);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              edge='end'
                              sx={{ right: 24 }}
                              onClick={() => {
                                handleGoalTaskDelete(task.id, goal.id, taskIndex);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    <ListItemButton
                      sx={{ pl: 4 }}
                      dense
                      key={-1}
                      onClick={() => setTaskCreateModalOpen(true)}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <AddIcon fontSize='small' />
                      </ListItemIcon>
                      <ListItemText primary='Add a Task' />
                    </ListItemButton>
                  </List>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </List>

        {/* add/edit goal form dialog */}
        <Dialog open={goalModalOpen} onClose={handleClose}>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogContent dividers>
            {validationError && (
              <Alert severity='error' style={{ margin: '0px' }}>
                {validationError}
              </Alert>
            )}
            <TextField
              autoFocus
              margin='normal'
              label='Title'
              type='text'
              fullWidth
              name='title'
              value={newGoal.title}
              onChange={handleInputChange}
              size='small'
            />
            <TextField
              margin='normal'
              label='Description'
              type='text'
              fullWidth
              name='description'
              value={newGoal.description}
              onChange={handleInputChange}
              size='small'
            />
            <TextField
              margin='normal'
              label='Deadline'
              type='date'
              fullWidth
              name='deadline'
              value={newGoal.deadline}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              size='small'
              inputProps={{ min: today }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant='contained' onClick={handleSubmit}>
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* add/edit task form dialog */}
        <div>
          <TaskCreateDialog
            open={taskCreateModalOpen}
            onClose={() => setTaskCreateModalOpen(false)}
            onCreate={handleGoalTaskCreate}
            userTasks={
              goals[expandingGoalIndex] !== undefined &&
                Array.isArray(goals[expandingGoalIndex].tasks)
                ? goals[expandingGoalIndex].tasks
                : []
            }
          />
          {expandingGoalIndex >= 0 &&
            taskEditingIndex >= 0 &&
            goals[expandingGoalIndex] !== undefined &&
            Array.isArray(goals[expandingGoalIndex].tasks) &&
            goals[expandingGoalIndex].tasks[taskEditingIndex] !== undefined && (
              <TaskEditDialog
                open={taskEditModalOpen}
                onClose={() => {
                  setTaskEditModalOpen(false);
                  setTaskEditingIndex(-1);
                }}
                onSave={handleGoalTaskEdit}
                initialTitle={
                  goals[expandingGoalIndex].tasks[taskEditingIndex].title
                }
                initialDescription={
                  goals[expandingGoalIndex].tasks[taskEditingIndex].description
                }
                initialFrequency={
                  goals[expandingGoalIndex].tasks[taskEditingIndex].frequency
                }
                userTasks={
                  Array.isArray(goals[expandingGoalIndex].tasks)
                    ? goals[expandingGoalIndex].tasks
                    : []
                }
              />
            )}
        </div>
      </Box>
    </PageContainer>
  );
}
