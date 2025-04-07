/**
 * FR15 - Dashboard.Summary - The system shall provide a dashboard summarizing
  the user’s wellness activities, including task completion, goal progress, and
  happiness ratings. The data shall be displayed in an intuitive format.
 * FR16 - Dashboard.Visuals - The dashboard shall include graphs, charts, and streak
  counters to visually represent the user’s progress, enabling better insights
  and engagement.
*/

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Grid,
  Box,
  CircularProgress,
  Typography,
  Button,
  Chip,
  Tooltip,
} from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";

import TaskOverview from "@/app/(DashboardLayout)/components/dashboard/TaskOverview";
import TaskCompletionTrends from "@/app/(DashboardLayout)/components/dashboard/TaskCompletionTrends";
import HappinessTrends from "@/app/(DashboardLayout)/components/dashboard/HappinessTrends";
import StreakCounter from "@/app/(DashboardLayout)/components/dashboard/StreakCounter";
import WellnessCategories from "@/app/(DashboardLayout)/components/dashboard/WellnessCategories";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GoalProgress from "@/app/(DashboardLayout)/components/dashboard/GoalProgress";
import PlantHealthVisualizer from "../components/dashboard/PlantHealthVisualizer";
import PlantGrowthInfo from "../components/dashboard/PlantGrowthInfo";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import DailyTipButton from "../components/shared/DailyTipButton";
import DailyTipDialog from "../components/shared/DailyTipDialog";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const Dashboard = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [streakData, setStreakData] = useState<any>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const { user, token, loading, refreshToken } = useAuth();
  const router = useRouter();
  const [happinessData, setHappinessData] = useState<any[]>([]);
  const [isLoadingHappiness, setIsLoadingHappiness] = useState(false);
  const [happinessError, setHappinessError] = useState<string | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tipDialogOpen, setTipDialogOpen] = useState(false);

  const getFirstName = () => {
    if (userProfile?.firstName) {
      return userProfile.firstName;
    }

    if (userProfile?.name) {
      const nameParts = userProfile.name.trim().split(/\s+/);
      return nameParts[0];
    }

    if (user?.displayName) {
      const nameParts = user.displayName.trim().split(/\s+/);
      return nameParts[0];
    }

    return "there";
  };

  const fetchUserProfile = async () => {
    if (!token || !user?.uid) return;

    try {
      const response = await fetch(`${API_BASE_URL}/getUserProfile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error(
          "Failed to fetch user profile:",
          errorData || response.statusText
        );
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      if (data.success) {
        setUserProfile(data.data);
      } else {
        console.error("User profile fetch was not successful:", data.error);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      console.log("❌ No user, redirecting to login...");
      router.push("/");
    }
  }, [user, token, loading, router]);

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    setTaskError(null);

    try {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${API_BASE_URL}/getUserTasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const text = await response.text();
          console.error(`Server responded with ${response.status}: ${text}`);
          throw new Error(`Server error: ${response.status}`);
        }

        const tasksData = await response.json();

        if (!tasksData.success) {
          throw new Error(tasksData.error || "Failed to load tasks");
        }

        setTasks(tasksData.data || []);
      } catch (fetchError) {
        if (
          fetchError instanceof DOMException &&
          fetchError.name === "AbortError"
        ) {
          console.error("Request timed out. Server might be overloaded.");
          throw new Error(
            "Request timed out. The server might be overloaded. Please try again later."
          );
        }
        if (
          fetchError instanceof TypeError &&
          fetchError.message === "Failed to fetch"
        ) {
          console.error(
            "Cannot connect to server. Please ensure the backend is running."
          );
          throw new Error(
            "Cannot connect to the server. Please check if the backend server is running."
          );
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTaskError(
        error instanceof Error ? error.message : "Failed to load tasks"
      );
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const fetchRecentCompletions = async () => {
    if (!token) return;

    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const makeRequest = async (currentToken: string) => {
        const response = await fetch(`${API_BASE_URL}/getTaskHistory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: currentToken }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const responseText = await response.text();
          if (
            response.status === 401 &&
            (responseText.includes("token has expired") ||
              responseText.includes("auth/id-token-expired"))
          ) {
            throw new Error("token_expired");
          } else {
            throw new Error(
              `Server error: ${response.status} - ${
                responseText || "Failed to fetch task history"
              }`
            );
          }
        }
        return response;
      };

      let response;
      try {
        response = await makeRequest(token);
      } catch (error: any) {
        if (error.message === "token_expired" && refreshToken) {
          const freshToken = await refreshToken();
          if (freshToken) {
            response = await makeRequest(freshToken);
          } else {
            throw new Error("Authentication error. Please log in again.");
          }
        } else {
          throw error;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load task history data");
      }

      setCompletedTasks(data.data.completions || []);
      setStreakData(data.data.streaks || null);
    } catch (error) {
      console.error("Error fetching recent completions:", error);
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Failed to load recent completions"
      );
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchHappinessData = async () => {
    if (!token) return;

    setIsLoadingHappiness(true);
    setHappinessError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const makeRequest = async (currentToken: string) => {
        const response = await fetch(`${API_BASE_URL}/getHappinessData`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: currentToken }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const responseText = await response.text();

          if (
            response.status === 401 &&
            (responseText.includes("token has expired") ||
              responseText.includes("auth/id-token-expired"))
          ) {
            throw new Error("token_expired");
          } else {
            throw new Error(
              `Server error: ${response.status} - ${
                responseText || "Failed to fetch happiness data"
              }`
            );
          }
        }

        return response;
      };

      let response;
      try {
        response = await makeRequest(token);
      } catch (error: any) {
        if (error.message === "token_expired" && refreshToken) {
          const freshToken = await refreshToken();

          if (freshToken) {
            response = await makeRequest(freshToken);
          } else {
            console.error("Failed to refresh token");
            throw new Error("Authentication error. Please log in again.");
          }
        } else if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          throw new Error(
            "Request timed out. The server might be overloaded. Please try again later."
          );
        } else if (
          error instanceof TypeError &&
          error.message === "Failed to fetch"
        ) {
          throw new Error(
            "Cannot connect to the server. Please check if the backend server is running."
          );
        } else {
          throw error;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load happiness data");
      }

      setHappinessData(data.data?.ratings || []);
    } catch (error) {
      console.error("Error fetching happiness data:", error);
      setHappinessError(
        error instanceof Error ? error.message : "Failed to load happiness data"
      );
    } finally {
      setIsLoadingHappiness(false);
    }
  };

  const fetchGoals = async () => {
    if (!token) return;

    setIsLoadingGoals(true);
    setGoalsError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/getUsergoals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        console.error(`Server responded with ${response.status}: ${text}`);
        throw new Error(`Server error: ${response.status}`);
      }

      const goalsData = await response.json();

      if (goalsData && goalsData.success && Array.isArray(goalsData.data)) {
        const goalsWithTasks = await Promise.all(
          goalsData.data.map(async (goal: any) => {
            try {
              if (goal.taskIds && goal.taskIds.length > 0) {
                const taskResponse = await fetch(
                  `${API_BASE_URL}/getGoalTasks`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, goalId: goal.id }),
                  }
                );

                if (taskResponse.ok) {
                  const taskData = await taskResponse.json();
                  if (taskData.success && Array.isArray(taskData.data)) {
                    return { ...goal, tasks: taskData.data };
                  }
                }
              }

              return { ...goal, tasks: [] };
            } catch (error) {
              console.error(`Error fetching tasks for goal ${goal.id}:`, error);
              return { ...goal, tasks: [] };
            }
          })
        );

        setGoals(goalsWithTasks);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
      setGoalsError(
        error instanceof Error ? error.message : "Failed to load goals"
      );
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const handleOpenTipDialog = () => {
    setTipDialogOpen(true);
  };

  /**
   * FR19 - AI.DailyTips - The system shall generate personalized daily tips for users,
    based on their wellness trends and past activity data, to encourage
    continued engagement and improvement.
  */
  const fetchDailyTip = async () => {
    if (!token) {
      return {
        success: false,
        error: "Authentication required. Please log in again.",
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/getAITip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error fetching AI tip:", errorText);
        return {
          success: false,
          error: "Failed to fetch your daily tip. Please try again.",
        };
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error in fetchDailyTip:", err);
      return {
        success: false,
        error: "Connection error. Please check your internet connection.",
      };
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchUserProfile();
      fetchTasks();
      fetchRecentCompletions();
      fetchHappinessData();
      fetchGoals();
    }
  }, [user, token]);

  if (loading) {
    return (
      <PageContainer title="Loading..." description="Please wait">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="80vh"
        >
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (isLoadingTasks) {
    return (
      <PageContainer title="Dashboard" description="Your personal dashboard">
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                <CircularProgress size={40} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Loading your tasks...
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  This should only take a few seconds
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </PageContainer>
    );
  }

  if (taskError) {
    return (
      <PageContainer title="Dashboard" description="Your personal dashboard">
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  bgcolor: "error.light",
                  color: "error.contrastText",
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                <ErrorOutlineIcon sx={{ fontSize: 48 }} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Error Loading Tasks
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {taskError}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 2 }}
                  onClick={() => fetchTasks()}
                >
                  Try Again
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard" description="Welcome to your dashboard">
      {/* Daily Tip Dialog */}
      <DailyTipDialog
        open={tipDialogOpen}
        onClose={() => setTipDialogOpen(false)}
        fetchTip={fetchDailyTip}
      />

      {/* Welcome Message */}
      <Box sx={{ mb: 3, position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                fontWeight: 600,
                letterSpacing: "-0.5px",
                color: "text.primary",
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              Welcome back,{" "}
              <Box
                component="span"
                sx={{
                  background: (theme) =>
                    `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  display: "inline",
                }}
              >
                {getFirstName()}
              </Box>
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: "text.secondary",
                fontWeight: 400,
                letterSpacing: "0.15px",
              }}
            >
              Here's an overview of your wellness journey
            </Typography>
          </Box>

          {/* Daily Tip Button - always available */}
          <Tooltip title="Get your daily AI wellness tip" placement="left">
            <Box>
              <DailyTipButton onClick={handleOpenTipDialog} available={true} />
            </Box>
          </Tooltip>
        </Box>
      </Box>

      {/* Rest of the dashboard content */}
      <Grid container spacing={3}>
        {/* First Row: Plant Visualization and Wellness Overview */}
        {/* 
        * FR17 - Plant.Growth - The system shall gamify the user’s wellness journey by
          visually representing their progress as the growth of a virtual plant. The
          growth shall reflect completed tasks, maintained streaks, and achieved
          goals.
        */}
        <Grid item xs={12} md={6}>
          {userProfile === null ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                "& .MuiCard-root": {
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                },
              }}
            >
              <DashboardCard
                title="Your Wellness Plant"
                action={
                  <Chip
                    icon={<LocalFloristIcon />}
                    label={
                      userProfile.plantHealth >= 5
                        ? "Healthy"
                        : userProfile.plantHealth >= 3
                        ? "Growing"
                        : "Needs Care"
                    }
                    size="small"
                    color={
                      userProfile.plantHealth >= 5
                        ? "success"
                        : userProfile.plantHealth >= 3
                        ? "primary"
                        : "warning"
                    }
                    variant="filled"
                  />
                }
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <Box
                    sx={{ position: "relative", height: 350, width: "100%" }}
                  >
                    <PlantHealthVisualizer
                      plantHealth={userProfile.plantHealth ?? 5}
                    />
                  </Box>
                  <PlantGrowthInfo plantHealth={userProfile.plantHealth ?? 5} />
                </Box>
              </DashboardCard>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container spacing={3}>
            {/* Task Overview */}
            <Grid item xs={12}>
              <TaskOverview
                completedCount={tasks.filter((t) => t.completed).length}
                totalCount={tasks.length}
              />
            </Grid>

            {/* Streak Counter */}
            <Grid item xs={12}>
              <StreakCounter
                taskHistory={completedTasks}
                isLoading={isLoadingHistory}
                streakData={streakData}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Second Row: Goals and Recent Activity */}
        <Grid item xs={12} lg={8}>
          <GoalProgress goals={goals} isLoading={isLoadingGoals} />
        </Grid>

        <Grid item xs={12} lg={4}>
          <DashboardCard title="Recent Activity">
            <Box sx={{ p: 2 }}>
              {isLoadingHistory ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : completedTasks.length > 0 ? (
                completedTasks.slice(0, 5).map((task, index) => (
                  <Box
                    key={index}
                    sx={{
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      borderBottom:
                        index < completedTasks.slice(0, 5).length - 1
                          ? "1px solid"
                          : "none",
                      borderColor: "divider",
                    }}
                  >
                    <CheckCircleIcon
                      color="success"
                      sx={{ mr: 1.5, fontSize: "1rem" }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "medium",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {task.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(task.completedAt)}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box sx={{ py: 2, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No completed tasks yet
                  </Typography>
                </Box>
              )}
            </Box>
          </DashboardCard>
        </Grid>

        {/* Third Row: Charts */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {/* Task Completion Trends and Happiness Trends side by side */}
            <Grid item xs={12} md={6}>
              <TaskCompletionTrends
                taskHistory={completedTasks}
                isLoading={isLoadingHistory}
                error={historyError}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <HappinessTrends
                happinessData={happinessData}
                isLoading={isLoadingHappiness}
                error={happinessError}
                showOverview={true}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Fourth Row: Wellness Categories */}
        <Grid item xs={12}>
          <WellnessCategories tasks={tasks} isLoading={isLoadingTasks} />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Dashboard;
