"use client";
import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
  Button,
  Grid,
  Collapse,
  Divider,
} from "@mui/material";
import { motion } from "framer-motion";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Groups2Icon from "@mui/icons-material/Groups2";
import AddTaskIcon from "@mui/icons-material/AddTask";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import TaskCard from "../../tasks/components/TaskCard";
import ConfirmationDialog from "../../tasks/components/ConfirmationDialog";
import { Goal } from "../page";

interface GoalCardProps {
  isOwner?: boolean;
  goal: Goal;
  isExpanded: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  onAddTask: () => void;
  onCompleteTask: (taskId: string) => Promise<void>;
  onEditTask: (task: any, taskIndex: number) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  index: number;
}

const GoalCard: React.FC<GoalCardProps> = ({
  isOwner = true,
  goal,
  isExpanded,
  onEdit,
  onDelete,
  onToggleExpand,
  onAddTask,
  onCompleteTask,
  onEditTask,
  onDeleteTask,
  index,
}) => {
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const taskStats = useMemo(() => {
    const { totalTasks, completedTasks } = goal;

    const total = typeof totalTasks === "number" ? totalTasks : 0;
    const completed = typeof completedTasks === "number" ? completedTasks : 0;

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      percentage,
    };
  }, [goal.totalTasks, goal.completedTasks]);

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining(goal.deadline);
  const isUrgent = daysRemaining <= 3 && daysRemaining >= 0;
  const isOverdue = daysRemaining < 0;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    onEdit();
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    onDelete();
  };

  const handleConfirmDelete = () => {
    setDeleteDialogOpen(false);
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card
        sx={{
          position: "relative",
          overflow: "visible",
          boxShadow: theme.shadows[isExpanded ? 8 : 2],
          borderRadius: "16px",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: theme.shadows[isExpanded ? 12 : 4],
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Progress bar */}
          <Box sx={{ position: "relative", mb: 3 }}>
            {/* 
            * FR14 - Goal.Progress - The system shall visually represent the user’s progress
              toward achieving their goals using progress indicators, such as bars or
              percentage displays.
            */}
            <LinearProgress
              variant="determinate"
              value={taskStats.percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                right: 0,
                top: -20,
                fontWeight: 600,
                color: theme.palette.primary.main,
              }}
            >
              {taskStats.percentage}%
            </Typography>
          </Box>

          {/* Goal header section */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {goal.isChallenge ? "Challenge: " : ""}
                {goal.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {goal.description}
              </Typography>
            </Box>
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>

          {/* Goal metadata */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Chip
              icon={<CalendarTodayIcon />}
              label={`Due ${formatDeadline(goal.deadline)}`}
              color={isOverdue ? "error" : isUrgent ? "warning" : "default"}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`${goal.tasks.filter((t) => t.completed).length}/${
                goal.tasks.length
              } tasks`}
              color="primary"
              size="small"
              variant="outlined"
            />
            {goal.isChallenge && (
              <Chip
                icon={<Groups2Icon />}
                label={"Challenge"}
                color="error"
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Expand/Collapse button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Button
              startIcon={
                isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />
              }
              onClick={onToggleExpand}
              sx={{ textTransform: "none" }}
            >
              {isExpanded ? "Hide Tasks" : "Show Tasks"}
            </Button>
            <Button
              disabled={!isOwner}
              startIcon={<AddTaskIcon />}
              onClick={onAddTask}
              variant="contained"
              size="small"
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  boxShadow: theme.shadows[2],
                },
              }}
            >
              Add Task
            </Button>
          </Box>

          {/* Tasks section */}
          <Collapse in={isExpanded} timeout="auto">
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Grid container spacing={2}>
                {goal.tasks && goal.tasks.length > 0 ? (
                  goal.tasks.map((task: any, taskIndex: number) => (
                    <Grid item xs={12} sm={6} key={task.id || taskIndex}>
                      <TaskCard
                        disabled={!isOwner}
                        task={task}
                        onComplete={async () => {
                          onCompleteTask(task.id);
                        }}
                        onEdit={() => {
                          onEditTask(task, taskIndex);
                        }}
                        onDelete={async () => {
                          onDeleteTask(task.id);
                        }}
                      />
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography color="text.secondary" align="center">
                      No tasks added yet. Click "Add Task" to get started.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Collapse>
        </CardContent>

        {/* More actions menu */}
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        >
          <MenuItem
            onClick={() => {
              onEdit();
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              {isOwner ? (
                <EditIcon fontSize="small" />
              ) : (
                <InfoIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>{isOwner ? "Edit" : "Info"}</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              setAnchorEl(null);
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Add the confirmation dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          title="Delete Goal"
          message="Are you sure you want to delete this goal? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      </Card>
    </motion.div>
  );
};

export default GoalCard;
