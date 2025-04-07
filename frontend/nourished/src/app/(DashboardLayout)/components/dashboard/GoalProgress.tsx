"use client";
import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  useTheme,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
} from "@mui/material";
import DashboardCard from "../shared/DashboardCard";
import FlagIcon from "@mui/icons-material/Flag";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";

interface GoalProgressProps {
  goals: Array<{
    id: string;
    title: string;
    description: string;
    deadline: string;
    completedTasks?: number;
    totalTasks?: number;
    tasks?: Array<{
      id: string;
      title: string;
      completed: boolean;
    }>;
  }> | null;
  isLoading: boolean;
}

const GoalProgress: React.FC<GoalProgressProps> = ({ goals, isLoading }) => {
  const theme = useTheme();

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateProgress = (goal: any) => {
    if (!goal.tasks || goal.tasks.length === 0) return 0;

    const completedTasks = goal.tasks.filter(
      (task: any) => task.completed
    ).length;
    const totalTasks = goal.tasks.length;

    return Math.round((completedTasks / totalTasks) * 100);
  };

  const getTopGoals = () => {
    if (!goals || goals.length === 0) return [];

    return [...goals]
      .sort((a, b) => {
        const daysA = getDaysRemaining(a.deadline);
        const daysB = getDaysRemaining(b.deadline);
        return daysA - daysB;
      })
      .slice(0, 3);
  };

  const topGoals = getTopGoals();

  if (isLoading) {
    return (
      <DashboardCard title="Goal Progress">
        <Box
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "300px",
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Goal Progress"
      action={
        <Link href="/goals" passHref>
          <Button variant="text" endIcon={<ArrowForwardIcon />} size="small">
            View All
          </Button>
        </Link>
      }
    >
      <Box sx={{ p: 3 }}>
        {!goals || goals.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <FlagIcon
              sx={{
                fontSize: 48,
                color: "text.secondary",
                opacity: 0.5,
                mb: 2,
              }}
            />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No goals created yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set goals to track your progress towards wellness targets
            </Typography>
            <Link href="/goals" passHref>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FlagIcon />}
                size="small"
              >
                Create Goal
              </Button>
            </Link>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {topGoals.map((goal, index) => {
              const progress = calculateProgress(goal);
              const daysRemaining = getDaysRemaining(goal.deadline);
              const isUrgent = daysRemaining <= 3 && daysRemaining >= 0;
              const isOverdue = daysRemaining < 0;

              return (
                <Grid item xs={12} key={goal.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: theme.palette.divider,
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight="medium"
                          noWrap
                          sx={{ maxWidth: "70%" }}
                        >
                          {goal.title}
                        </Typography>
                        <Chip
                          label={
                            isOverdue
                              ? "Overdue"
                              : isUrgent
                              ? "Urgent"
                              : `${daysRemaining} days left`
                          }
                          size="small"
                          color={
                            isOverdue
                              ? "error"
                              : isUrgent
                              ? "warning"
                              : "default"
                          }
                          variant={
                            isOverdue || isUrgent ? "filled" : "outlined"
                          }
                        />
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Box sx={{ flexGrow: 1, mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "rgba(0,0,0,0.05)",
                              "& .MuiLinearProgress-bar": {
                                backgroundColor:
                                  progress === 100
                                    ? theme.palette.success.main
                                    : theme.palette.primary.main,
                              },
                            }}
                          />
                        </Box>
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={
                            progress === 100 ? "success.main" : "text.primary"
                          }
                        >
                          {progress}%
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Due: {formatDeadline(goal.deadline)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {goal.tasks
                            ? `${
                                goal.tasks.filter((t) => t.completed).length
                              }/${goal.tasks.length} tasks`
                            : "No tasks"}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}

            {goals.length > 3 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: "center", py: 1 }}>
                  <Link href="/goals" passHref>
                    <Button
                      variant="text"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                    >
                      View {goals.length - 3} more goals
                    </Button>
                  </Link>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </DashboardCard>
  );
};

export default GoalProgress;
