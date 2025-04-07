"use client";
import React from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  Chip,
  Tooltip,
  styled,
} from "@mui/material";
import { motion } from "framer-motion";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import RepeatIcon from "@mui/icons-material/Repeat";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "16px",
  overflow: "hidden",
  padding: 0,
  position: "relative",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[4],
  },
}));

interface TaskHistoryCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    frequency?: string;
    completedAt: string;
  };
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TaskHistoryCard: React.FC<TaskHistoryCardProps> = ({ task }) => {
  const theme = useTheme();

  const getAccentColor = (id: string) => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.info.main,
    ];

    const hash = id.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  const accentColor = getAccentColor(task.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <StyledPaper elevation={1}>
        {/* Colored accent bar at the top */}
        <Box
          sx={{
            height: "6px",
            width: "100%",
            background: `linear-gradient(90deg, ${accentColor}, ${alpha(
              accentColor,
              0.7
            )})`,
          }}
        />

        <Box p={3}>
          {/* Task title and completion badge */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "text.primary",
                flex: 1,
              }}
            >
              {task.title}
            </Typography>

            <Chip
              icon={<CheckCircleIcon style={{ fontSize: "16px" }} />}
              label="Completed"
              size="small"
              color="success"
              sx={{
                fontWeight: 500,
                fontSize: "0.75rem",
                height: "24px",
                borderRadius: "12px",
                ml: 2,
                background: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                "& .MuiChip-icon": {
                  color: theme.palette.success.main,
                },
              }}
            />
          </Box>

          {/* Task description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              lineHeight: 1.6,
            }}
          >
            {task.description}
          </Typography>

          {/* Task metadata */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              mt: 2,
            }}
          >
            {/* Completion date */}
            <Tooltip title="Completion date" arrow placement="top">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "text.secondary",
                }}
              >
                <CalendarTodayIcon sx={{ fontSize: 16, mr: 0.75 }} />
                <Typography variant="caption">
                  {formatDate(task.completedAt)}
                </Typography>
              </Box>
            </Tooltip>

            {/* Completion time */}
            <Tooltip title="Completion time" arrow placement="top">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "text.secondary",
                }}
              >
                <AccessTimeIcon sx={{ fontSize: 16, mr: 0.75 }} />
                <Typography variant="caption">
                  {formatTime(task.completedAt)}
                </Typography>
              </Box>
            </Tooltip>

            {/* Task frequency (if available) */}
            {task.frequency && (
              <Tooltip title="Task frequency" arrow placement="top">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: "text.secondary",
                  }}
                >
                  <RepeatIcon sx={{ fontSize: 16, mr: 0.75 }} />
                  <Typography variant="caption">{task.frequency}</Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        </Box>
      </StyledPaper>
    </motion.div>
  );
};

export default TaskHistoryCard;
