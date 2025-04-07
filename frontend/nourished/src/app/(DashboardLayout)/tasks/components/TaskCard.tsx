"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Chip,
  Fade,
  styled,
  alpha,
  useTheme,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { motion } from "framer-motion";
import FlagIcon from "@mui/icons-material/Flag";
import ConfirmationDialog from "./ConfirmationDialog";

import BookIcon from "@mui/icons-material/Book";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import SchoolIcon from "@mui/icons-material/School";
import WorkIcon from "@mui/icons-material/Work";
import HomeIcon from "@mui/icons-material/Home";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import ComputerIcon from "@mui/icons-material/Computer";
import SpaIcon from "@mui/icons-material/Spa";
import PetsIcon from "@mui/icons-material/Pets";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import EmailIcon from "@mui/icons-material/Email";
import EventIcon from "@mui/icons-material/Event";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

const StyledCard = styled(motion.div)(({ theme }) => ({
  position: "relative",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.palette.background.paper,
  borderRadius: "12px",
  overflow: "visible",
}));

const TaskStatusIcon = styled(IconButton)({
  position: "absolute",
  top: "12px",
  right: "12px",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "scale(1.1) rotate(10deg)",
  },
});

const FrequencyChip = styled(Chip)(({ theme }) => ({
  position: "absolute",
  top: "12px",
  left: "12px",
  fontSize: "0.75rem",
  height: "24px",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "scale(1.05)",
  },
}));

const GoalChip = styled(Chip)(({ theme }) => ({
  position: "absolute",
  top: "12px",
  right: "48px",
  fontSize: "0.75rem",
  height: "24px",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  fontWeight: 500,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  "& .MuiChip-icon": {
    color: theme.palette.primary.main,
  },
  "&:hover": {
    transform: "scale(1.05)",
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
  },
}));

const getTaskIcon = (title: string | undefined) => {
  if (!title) {
    return <TaskAltIcon />;
  }

  const lowercaseTitle = title.toLowerCase();

  const iconMap: { [key: string]: React.ReactElement } = {
    book: <BookIcon />,
    read: <BookIcon />,
    library: <LocalLibraryIcon />,
    study: <SchoolIcon />,

    workout: <FitnessCenterIcon />,
    exercise: <FitnessCenterIcon />,
    gym: <FitnessCenterIcon />,
    fitness: <FitnessCenterIcon />,
    run: <DirectionsRunIcon />,
    jog: <DirectionsRunIcon />,
    walk: <DirectionsRunIcon />,

    eat: <RestaurantIcon />,
    meal: <RestaurantIcon />,
    food: <RestaurantIcon />,
    cook: <RestaurantIcon />,
    diet: <RestaurantIcon />,

    class: <SchoolIcon />,
    course: <SchoolIcon />,
    homework: <SchoolIcon />,
    learn: <SchoolIcon />,

    work: <WorkIcon />,
    job: <WorkIcon />,
    meeting: <WorkIcon />,
    email: <EmailIcon />,
    call: <LocalPhoneIcon />,
    phone: <LocalPhoneIcon />,

    home: <HomeIcon />,
    house: <HomeIcon />,
    clean: <CleaningServicesIcon />,
    laundry: <CleaningServicesIcon />,

    shop: <ShoppingCartIcon />,
    buy: <ShoppingCartIcon />,
    purchase: <ShoppingCartIcon />,
    grocery: <ShoppingCartIcon />,

    medicine: <LocalHospitalIcon />,
    doctor: <LocalHospitalIcon />,
    health: <LocalHospitalIcon />,
    meditate: <SpaIcon />,
    meditation: <SpaIcon />,

    music: <MusicNoteIcon />,
    play: <MusicNoteIcon />,

    computer: <ComputerIcon />,
    code: <ComputerIcon />,
    program: <ComputerIcon />,

    pet: <PetsIcon />,
    dog: <PetsIcon />,
    cat: <PetsIcon />,

    event: <EventIcon />,
    appointment: <EventIcon />,

    money: <AttachMoneyIcon />,
    pay: <AttachMoneyIcon />,
    bill: <AttachMoneyIcon />,
  };

  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (lowercaseTitle.includes(keyword)) {
      return icon;
    }
  }

  return <TaskAltIcon />;
};

interface TaskCardProps {
  disabled?: boolean;
  task:
    | {
        id: string;
        title: string;
        description: string;
        completed: boolean;
        frequency?: string;
        goalId?: string;
        goalTitle?: string;
      }
    | undefined;
  onComplete: (taskId: string) => Promise<void>;
  onEdit: (task: any) => void;
  onDelete: (taskId: string) => Promise<void>;
  onAddToGoal?: (task: any) => void;
  onRemoveFromGoal?: (taskId: string) => Promise<void>;
  showCompleted?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  disabled = false,
  task,
  onComplete,
  onEdit,
  onDelete,
  onAddToGoal,
  onRemoveFromGoal,
  showCompleted = false,
}) => {
  if (!task || typeof task !== "object") {
    return null;
  }

  const {
    id = "",
    title = "",
    description = "",
    completed = false,
    frequency,
    goalId,
    goalTitle,
  } = task;

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [wasJustCompleted, setWasJustCompleted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setWasJustCompleted(false);
  }, [id]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);

    if (!completed) {
      setIsCompleting(true);
      setWasJustCompleted(true);

      setTimeout(() => {
        setIsCompleting(false);
      }, 2000);
    }

    try {
      await onComplete(id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(task);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    if (onDelete) {
      await onDelete(id);
    }
  };

  const handleAddToGoal = () => {
    handleMenuClose();
    if (onAddToGoal) {
      onAddToGoal(task);
    }
  };

  const handleRemoveFromGoal = async () => {
    handleMenuClose();
    if (onRemoveFromGoal) {
      await onRemoveFromGoal(id);
    }
  };

  return (
    <Fade in={true} timeout={500}>
      <Card
        component={motion.div}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: completed && !wasJustCompleted ? 0.85 : 1,
          y: 0,
          scale: isCompleting ? 1.02 : 1,
          x: completed && !wasJustCompleted && !showCompleted ? 0 : 0,
        }}
        exit={{
          opacity: 0,
          y: -20,
          transition: { duration: 0.3, ease: "easeInOut" },
        }}
        whileHover={{
          translateY: -4,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.paper",
          borderRadius: "12px",
          overflow: "visible",
          border: "1px solid",
          borderColor: (theme) =>
            completed || isCompleting
              ? alpha(theme.palette.success.main, 0.2)
              : theme.palette.divider,
          transition: "all 0.3s ease-in-out",
        }}
      >
        <CardContent
          sx={{
            position: "relative",
            pt: 5,
            pb: 2,
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: (theme) =>
                completed || isCompleting
                  ? `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.main})`
                  : `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              transition: "background 0.5s ease-in-out",
              opacity: completed || isCompleting ? 1 : 0.7,
              boxShadow:
                completed || isCompleting
                  ? "0 2px 8px rgba(76, 175, 80, 0.2)"
                  : "none",
            },
          }}
        >
          {/* Add goal chip if task is associated with a goal */}
          {goalId && (
            <GoalChip
              icon={<FlagIcon />}
              label={goalTitle || "Goal"}
              size="small"
            />
          )}

          {frequency && (
            <FrequencyChip
              label={frequency}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}

          <TaskStatusIcon
            onClick={handleComplete}
            color={completed || isCompleting ? "success" : "default"}
            disabled={isLoading || disabled}
            sx={{
              animation: isLoading ? "spin 1s linear infinite" : "none",
              "@keyframes spin": {
                "0%": {
                  transform: "rotate(0deg)",
                },
                "100%": {
                  transform: "rotate(360deg)",
                },
              },
              transform: isCompleting ? "scale(1.1)" : "scale(1)",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            {completed || isCompleting ? (
              <CheckCircleIcon />
            ) : (
              <RadioButtonUncheckedIcon />
            )}
          </TaskStatusIcon>

          {/* Task Icon based on title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1.5,
              color: (theme) =>
                completed || isCompleting
                  ? theme.palette.text.secondary
                  : theme.palette.primary.main,
            }}
          >
            {getTaskIcon(title)}
          </Box>

          <Typography
            variant="h6"
            component={motion.h3}
            animate={{
              textDecoration:
                completed || isCompleting ? "line-through" : "none",
              color:
                completed || isCompleting ? "text.secondary" : "text.primary",
            }}
            transition={{ duration: 0.3 }}
            sx={{ mb: 1 }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            component={motion.p}
            animate={{
              textDecoration:
                completed || isCompleting ? "line-through" : "none",
              opacity: completed || isCompleting ? 0.7 : 1,
            }}
            transition={{ duration: 0.3 }}
            color="text.secondary"
          >
            {description}
          </Typography>

          <Box sx={{ position: "absolute", right: 8, bottom: 8 }}>
            <IconButton
              disabled={disabled}
              size="small"
              onClick={handleMenuOpen}
              sx={{
                opacity: 0.6,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  opacity: 1,
                  transform: "rotate(90deg)",
                },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            TransitionComponent={Fade}
            sx={{
              "& .MuiPaper-root": {
                borderRadius: "8px",
                minWidth: "120px",
                boxShadow: (theme) => theme.shadows[4],
              },
            }}
          >
            <MenuItem
              onClick={handleEdit}
              sx={{
                transition: "background-color 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              onClick={handleDeleteClick}
              sx={{
                color: "error.main",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "error.lighter",
                },
              }}
            >
              Delete
            </MenuItem>
            {onAddToGoal && !goalId && (
              <MenuItem onClick={handleAddToGoal} disabled={isLoading}>
                Add to Goal
              </MenuItem>
            )}
            {onRemoveFromGoal && goalId && (
              <MenuItem
                onClick={handleRemoveFromGoal}
                disabled={isLoading}
                sx={{
                  color: "warning.main",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: "warning.lighter",
                  },
                }}
              >
                Remove from Goal
              </MenuItem>
            )}
          </Menu>
        </CardContent>

        {/* Add the confirmation dialog */}
        <ConfirmationDialog
          open={deleteDialogOpen}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteDialogOpen(false)}
        />
      </Card>
    </Fade>
  );
};

export default TaskCard;
