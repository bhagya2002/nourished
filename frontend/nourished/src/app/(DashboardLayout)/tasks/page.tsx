"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import TaskEditDialog from "./components/TaskEditDialog";
import TaskCreateDialog from "./components/TaskCreateDialog";
import HappinessDialog from "./components/HappinessDialog";
import AssociateTaskWithGoalDialog from "./components/AssociateTaskWithGoalDialog";
import PageHeader from "./components/PageHeader";
import TaskSummary from "./components/TaskSummary";
import {
  Alert,
  Box,
  Fab,
  Grid,
  Button,
  Snackbar,
  Typography,
  FormControlLabel,
  Switch,
  CircularProgress,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TaskCard from "./components/TaskCard";
import { motion, AnimatePresence } from "framer-motion";
import { alpha } from "@mui/material/styles";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

type NotificationSeverity = "error" | "warning" | "info" | "success";

interface CelebrationProps {
  isVisible: boolean;
  onAnimationComplete: () => void;
}

const Celebration: React.FC<CelebrationProps> = ({
  isVisible,
  onAnimationComplete,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8 } }}
          onAnimationComplete={onAnimationComplete}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 1500,
            backdropFilter: "blur(2px)",
            background: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
            }}
          >
            {[...Array(60)].map((_, i) => (
              <Box
                component={motion.div}
                key={i}
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: Math.random() * 0.8 + 0.3,
                  opacity: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  ease: [0.23, 1, 0.32, 1],
                  delay: Math.random() * 0.5,
                }}
                sx={{
                  position: "absolute",
                  width: 8 + Math.random() * 12,
                  height: 8 + Math.random() * 12,
                  borderRadius: "50%",
                  background: (theme) =>
                    `${
                      [
                        "#4CAF50",
                        "#8BC34A",
                        "#CDDC39",
                        "#FFC107",
                        "#FF9800",
                        "#2196F3",
                      ][Math.floor(Math.random() * 6)]
                    }`,
                  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                }}
              />
            ))}
          </Box>

          <Box
            component={motion.div}
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2,
              },
            }}
            exit={{
              scale: 1.2,
              opacity: 0,
              transition: { duration: 0.5 },
            }}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: (theme) => theme.palette.success.main,
              borderRadius: "16px",
              padding: "20px 40px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: 1,
                transition: {
                  duration: 0.8,
                  times: [0, 0.5, 1],
                  repeat: 1,
                  repeatDelay: 0.5,
                },
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: 40,
                  color: "#000",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                }}
              />
            </motion.div>
            <Box>
              <Typography
                variant="h5"
                fontWeight={600}
                component={motion.h3}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { delay: 0.3 },
                }}
                sx={{ color: "#000" }}
              >
                Task Completed!
              </Typography>
              <Typography
                variant="body2"
                component={motion.p}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { delay: 0.5 },
                }}
                sx={{ color: "#000", fontWeight: 500 }}
              >
                Great job on your progress!
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default function TasksPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, loading: authLoading, refreshToken } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState({
    title: "",
    description: "",
    frequency: "",
    isOpen: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState<any | null>(null);

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: NotificationSeverity;
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const [happinessDialogOpen, setHappinessDialogOpen] = useState(false);
  const [ratingTaskId, setRatingTaskId] = useState("");
  const [ratingTaskTitle, setRatingTaskTitle] = useState("");

  const [isLoadingGoals, setIsLoadingGoals] = useState(false);

  const [associateDialogOpen, setAssociateDialogOpen] = useState(false);
  const [taskToAssociate, setTaskToAssociate] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/authentication/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && token) {
      fetchTasks();
      fetchGoals();
    }
  }, [user, token]);

  useEffect(() => {
    const tasksWithGoalTitles = tasks.map((task) => {
      if (task.goalId) {
        const goal = goals.find((g) => g.id === task.goalId);
        return {
          ...task,
          goalTitle: goal?.title || "Goal",
        };
      }
      return task;
    });

    const filtered = tasksWithGoalTitles.filter((task) => {
      if (selectedTab === 0) {
        return showCompleted ? true : !task.completed;
      } else if (selectedTab === 1) {
        return (
          task.frequency === "Daily" && (showCompleted ? true : !task.completed)
        );
      } else if (selectedTab === 2) {
        return (
          task.frequency === "Weekly" &&
          (showCompleted ? true : !task.completed)
        );
      } else {
        return (
          task.frequency === "Monthly" &&
          (showCompleted ? true : !task.completed)
        );
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, selectedTab, showCompleted, goals]);

  const fetchTasks = async () => {
    if (!token) {
      console.log("No token available");
      return;
    }

    setIsLoading(true);

    setNotification({
      open: true,
      message: "Loading tasks...",
      severity: "info",
    });

    try {
      const makeRequest = async (currentToken: string) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(`${API_BASE_URL}/getUserTasks`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: currentToken }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const text = await response.text();
            console.error(`Server responded with ${response.status}: ${text}`);

            if (response.status === 401) {
              throw new Error("token_expired");
            }

            throw new Error(`Server error: ${response.status}`);
          }

          return response;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Request timed out. Server might be overloaded.");
          }
          if (
            error instanceof TypeError &&
            error.message === "Failed to fetch"
          ) {
            throw new Error(
              "Cannot connect to server. Please ensure the backend server is running."
            );
          }
          throw error;
        }
      };

      let response;
      try {
        response = await makeRequest(token);
      } catch (error: any) {
        if (error.message === "token_expired" && refreshToken) {
          console.log("Token expired, attempting to refresh...");
          const freshToken = await refreshToken();

          if (freshToken) {
            console.log("Token refreshed, retrying request");
            response = await makeRequest(freshToken);
          } else {
            console.error("Failed to refresh token");
            router.push("/authentication/login");
            return;
          }
        } else {
          throw error;
        }
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to load tasks");
      }

      setTasks(data.data || []);

      setNotification({
        open: true,
        message: "Tasks loaded successfully",
        severity: "success",
      });

      setTimeout(() => {
        setNotification((prev) => ({ ...prev, open: false }));
      }, 3000);
    } catch (err) {
      console.error("Error fetching tasks:", err);

      setNotification({
        open: true,
        message: err instanceof Error ? err.message : "Failed to load tasks",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGoals = async () => {
    if (!token) return;

    setIsLoadingGoals(true);

    try {
      let currentToken = token || "";
      if (refreshToken) {
        console.log("Forcing token refresh before fetching goals");
        const refreshedToken = await refreshToken();
        if (refreshedToken) {
          currentToken = refreshedToken;
        } else {
          throw new Error("Failed to refresh authentication token");
        }
      }

      const response = await fetch(`${API_BASE_URL}/getUserGoals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: currentToken }),
      });

      if (!response.ok) {
        console.error("Server response:", response.status, response.statusText);
        const errorBody = await response.text();
        console.error("Error body:", errorBody);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch goals");
      }

      setGoals(data.data || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setIsLoadingGoals(false);
    }
  };

  const handleCreate = async ({
    title,
    description,
    frequency,
    goalId,
  }: {
    title: string;
    description: string;
    frequency: string;
    goalId?: string;
  }) => {
    try {
      console.log("Creating task:", { title, description, frequency });

      setNotification({ open: false, message: "", severity: "success" });

      setNotification({
        open: true,
        message: "Creating task...",
        severity: "info",
      });

      const taskData = {
        title,
        description,
        frequency,
        createdAt: new Date().toISOString(),
      };

      const requestBody: any = {
        token,
        task: taskData,
      };

      if (goalId) {
        requestBody.task.goalId = goalId;
        requestBody.goalId = goalId;
      }

      const makeRequest = async (currentToken: string) => {
        requestBody.token = currentToken;
        return await fetch(`${API_BASE_URL}/createTask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
      };

      let response = await makeRequest(token!);
      let data;

      if (response.status === 401) {
        const responseText = await response.text();
        console.log("Auth error response:", responseText);

        if (
          responseText.includes("token has expired") ||
          responseText.includes("auth/id-token-expired")
        ) {
          console.log("Token expired, attempting to refresh...");
          const freshToken = await refreshToken();

          if (freshToken) {
            console.log("Token refreshed, retrying request");
            response = await makeRequest(freshToken);
          }
        }
      }

      data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create task");
      }

      const newTask = data.data;

      if (newTask && newTask.id) {
        const validTask = {
          id: newTask.id,
          title: newTask.title || title,
          description: newTask.description || description,
          frequency: newTask.frequency || frequency,
          completed:
            newTask.completed !== undefined ? newTask.completed : false,
          createdAt: newTask.createdAt || new Date().toISOString(),
        };

        setTasks([...tasks, validTask]);
      } else {
        console.warn(
          "Created task returned from API does not have expected properties",
          newTask
        );

        const placeholderTask = {
          id: `local-${Date.now()}`,
          title,
          description,
          frequency,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        setTasks([...tasks, placeholderTask]);
      }

      setNotification({
        open: true,
        message: "Task created successfully!",
        severity: "success",
      });

      return data;
    } catch (error: any) {
      console.error("Error creating task:", error);
      setNotification({
        open: true,
        message: error.message || "Failed to create task. Please retry.",
        severity: "error",
      });
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      if (!taskId) return;

      const taskToDelete = tasks.find((t) => t.id === taskId);
      const taskName = taskToDelete?.title || "Task";

      setTasks(tasks.filter((task) => task.id !== taskId));

      setNotification({
        open: true,
        message: `Deleting "${taskName}"...`,
        severity: "info",
      });

      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/deleteTask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: currentToken,
            taskId: taskId,
          }),
        });
      };

      let response = await makeRequest(token!);

      if (response.status === 401) {
        const responseText = await response.text();

        if (
          responseText.includes("token has expired") ||
          responseText.includes("auth/id-token-expired")
        ) {
          console.log("Token expired, attempting to refresh...");
          const freshToken = await refreshToken();

          if (freshToken) {
            console.log("Token refreshed, retrying request");
            response = await makeRequest(freshToken);
          }
        }
      }

      if (response.ok) {
        setNotification({
          open: true,
          message: `"${taskName}" deleted successfully`,
          severity: "success",
        });

        return;
      }

      const data = await response.json().catch(() => ({}));

      setNotification({
        open: true,
        message: data.error || "Failed to delete task",
        severity: "error",
      });

      setTasks((prev) => [...prev, taskToDelete]);
    } catch (error: any) {
      console.error("Error deleting task:", error);
      setNotification({
        open: true,
        message: error.message || "Failed to delete task",
        severity: "error",
      });
    }
  };

  const handleSaveEdit = async (updatedData: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    try {
      if (!currentEditTask) {
        console.error("No task selected for editing");
        setNotification({
          open: true,
          message: "Error: No task selected for editing",
          severity: "error",
        });
        return;
      }

      console.log(
        "Updating task:",
        currentEditTask.id,
        "with data:",
        updatedData
      );

      if (!updatedData.title || updatedData.title.trim() === "") {
        setNotification({
          open: true,
          message: "Title cannot be empty",
          severity: "error",
        });
        return;
      }

      setNotification({
        open: true,
        message: "Updating task...",
        severity: "info",
      });

      const originalTask = { ...currentEditTask };

      setTasks(
        tasks.map((task) =>
          task.id === currentEditTask.id ? { ...task, ...updatedData } : task
        )
      );

      const taskId = currentEditTask.id;

      const updateField = async (field: string, value: string) => {
        const makeRequest = async (currentToken: string) => {
          return await fetch(`${API_BASE_URL}/editTask`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: currentToken,
              taskId,
              fieldToChange: field,
              newValue: value,
            }),
          });
        };

        let response = await makeRequest(token!);

        if (response.status === 401) {
          const responseText = await response.text();

          if (
            responseText.includes("token has expired") ||
            responseText.includes("auth/id-token-expired")
          ) {
            console.log("Token expired for update, refreshing...");
            const freshToken = await refreshToken();

            if (freshToken) {
              console.log("Token refreshed, retrying update");
              response = await makeRequest(freshToken);
            }
          }
        }

        if (!response.ok) {
          let errorDetail = "";
          try {
            const errorResponse = await response.json();
            errorDetail = errorResponse.error || "";
          } catch (e) {
            try {
              errorDetail = await response.text();
            } catch (textError) {
              errorDetail = `Status ${response.status}`;
            }
          }

          console.error(`Failed to update ${field}:`, errorDetail);
          throw new Error(
            `Failed to update ${field}${errorDetail ? ": " + errorDetail : ""}`
          );
        }

        return response;
      };

      console.log("Sending task update requests...");
      const results = await Promise.all([
        updateField("title", updatedData.title),
        updateField("description", updatedData.description),
        updateField("frequency", updatedData.frequency || ""),
      ]);

      console.log("Task update results:", results);

      setNotification({
        open: true,
        message: "Task updated successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating task:", error);

      if (currentEditTask) {
        setTasks(
          tasks.map((task) =>
            task.id === currentEditTask.id ? currentEditTask : task
          )
        );
      }

      setNotification({
        open: true,
        message:
          error instanceof Error ? error.message : "Failed to update task",
        severity: "error",
      });
    }
  };

  const handleComplete = async (taskId: string) => {
    if (isLoading) return;

    try {
      if (!taskId) {
        console.warn("Invalid task ID provided");
        return;
      }

      const currentTask = tasks.find((task) => task.id === taskId);
      if (!currentTask) {
        console.warn("Task not found in local state");
        return;
      }

      const newCompletedState = !currentTask.completed;

      setNotification({
        open: true,
        message: newCompletedState
          ? `Great job! "${currentTask.title}" completed 🎉`
          : `"${currentTask.title}" marked as incomplete`,
        severity: newCompletedState ? "success" : "info",
      });

      // if (newCompletedState) {
      //   pass;
      // }

      if (newCompletedState && !showCompleted) {
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? { ...task, completed: newCompletedState }
              : task
          )
        );

        setTimeout(() => {
          setFilteredTasks(filteredTasks.filter((task) => task.id !== taskId));
        }, 3000);
      } else {
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? { ...task, completed: newCompletedState }
              : task
          )
        );
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      console.log(
        `Sending toggle request for task ${taskId} to ${
          newCompletedState ? "complete" : "incomplete"
        }`
      );

      try {
        const makeRequest = async (currentToken: string) => {
          return await fetch(`${API_BASE_URL}/toggleTaskCompletion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: currentToken,
              taskId,
              completed: newCompletedState,
            }),
            signal: controller.signal,
          });
        };

        let response = await makeRequest(token!);

        if (response.status === 401) {
          const responseText = await response.text();

          if (
            responseText.includes("token has expired") ||
            responseText.includes("auth/id-token-expired")
          ) {
            console.log("Token expired, attempting to refresh...");
            const freshToken = await refreshToken();

            if (freshToken) {
              console.log("Token refreshed, retrying request");
              response = await makeRequest(freshToken);
            }
          }
        }

        clearTimeout(timeoutId);

        if (response.ok) {
          setNotification({
            open: true,
            message: newCompletedState
              ? "Task marked complete!"
              : "Task marked incomplete",
            severity: "success",
          });

          if (newCompletedState) {
            setRatingTaskId(taskId);
            setRatingTaskTitle(currentTask.title);
            setTimeout(() => {
              setHappinessDialogOpen(true);
            }, 500);
          }
          return;
        }

        const errorMessage = "Failed to update task completion";

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          try {
            const freshToken = await refreshToken();
            if (freshToken) {
              const result = await makeRequest(freshToken);

              const resultData = await result.json().catch(() => ({}));
              if (!resultData.success) {
                throw new Error(
                  resultData.error || "Failed to update task status"
                );
              }
              return resultData;
            } else {
              throw new Error("Failed to refresh authentication token");
            }
          } catch (refreshError) {
            console.error("Error refreshing token:", refreshError);

            setTasks(
              tasks.map((task) =>
                task.id === taskId
                  ? { ...task, completed: !newCompletedState }
                  : task
              )
            );
            setNotification({
              open: true,
              message: "Authentication error. Please log in again.",
              severity: "error",
            });
            router.push("/authentication/login");
            throw refreshError;
          }
        } else {
          setTasks(
            tasks.map((task) =>
              task.id === taskId
                ? { ...task, completed: !newCompletedState }
                : task
            )
          );
          setNotification({
            open: true,
            message: "Failed to update task status",
            severity: "error",
          });
          throw new Error("Failed to update task status");
        }
      } catch (err) {
        console.error("Error toggling task completion:", err);

        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? { ...task, completed: !newCompletedState }
              : task
          )
        );

        setNotification({
          open: true,
          message: "Failed to update task status",
          severity: "error",
        });
      }
    } catch (err) {
      console.error("Error toggling task completion:", err);
    }
  };

  const handleOpenCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (task: any) => {
    setCurrentEditTask(task);
    setEditDialogOpen(true);
  };

  const handleSubmitHappiness = async (taskId: string, rating: number) => {
    try {
      setNotification({
        open: true,
        message: "Submitting happiness rating...",
        severity: "info",
      });

      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/submitHappinessRating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: currentToken,
            taskId,
            rating,
            date: new Date().toISOString(),
          }),
        });
      };

      let response = await makeRequest(token!);

      if (response.status === 401) {
        const responseText = await response.text();

        if (
          responseText.includes("token has expired") ||
          responseText.includes("auth/id-token-expired")
        ) {
          console.log("Token expired, attempting to refresh...");
          const freshToken = await refreshToken();

          if (freshToken) {
            console.log("Token refreshed, retrying request");
            response = await makeRequest(freshToken);
          }
        }
      }

      if (!response.ok) {
        throw new Error("Failed to submit happiness rating");
      }

      setNotification({
        open: true,
        message: "Happiness rating submitted. Thank you!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error submitting happiness rating:", error);
      setNotification({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit happiness rating",
        severity: "error",
      });
    }
  };

  const handleAssociateTask = async (taskId: string, goalId: string) => {
    try {
      setNotification({
        open: true,
        message: "Associating task with goal...",
        severity: "info",
      });

      let currentToken = token || "";
      if (refreshToken) {
        console.log("Forcing token refresh before associating task with goal");
        const refreshedToken = await refreshToken();
        if (refreshedToken) {
          currentToken = refreshedToken;
        } else {
          throw new Error("Failed to refresh authentication token");
        }
      }

      const response = await fetch(`${API_BASE_URL}/associateTaskWithGoal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: currentToken,
          taskId,
          goalId,
        }),
      });

      if (!response.ok) {
        console.error("Server response:", response.status, response.statusText);
        const errorBody = await response.text();
        console.error("Error body:", errorBody);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to associate task with goal");
      }

      await fetchTasks();

      await fetchGoals();

      setNotification({
        open: true,
        message: "Task associated with goal successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error associating task with goal:", error);

      setNotification({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to associate task with goal",
        severity: "error",
      });
    }
  };

  const handleUnassociateTask = async (taskId: string) => {
    try {
      setNotification({
        open: true,
        message: "Removing task from goal...",
        severity: "info",
      });

      let currentToken = token || "";
      if (refreshToken) {
        console.log(
          "Forcing token refresh before unassociating task from goal"
        );
        const refreshedToken = await refreshToken();
        if (refreshedToken) {
          currentToken = refreshedToken;
        } else {
          throw new Error("Failed to refresh authentication token");
        }
      }

      const response = await fetch(`${API_BASE_URL}/unassociateTaskFromGoal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: currentToken,
          taskId,
        }),
      });

      if (!response.ok) {
        console.error("Server response:", response.status, response.statusText);
        const errorBody = await response.text();
        console.error("Error body:", errorBody);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to remove task from goal");
      }

      await fetchTasks();

      await fetchGoals();

      setNotification({
        open: true,
        message: "Task removed from goal successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error removing task from goal:", error);

      setNotification({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to remove task from goal",
        severity: "error",
      });
    }
  };

  const handleOpenAssociateDialog = (task: any) => {
    setTaskToAssociate(task);
    setAssociateDialogOpen(true);
  };

  return (
    <PageContainer title="Tasks" description="Manage your tasks">
      <Box sx={{ position: "relative", minHeight: "70vh" }}>
        {/* Loading overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: isLoading ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>

        {/* Page Header */}
        <PageHeader
          title="My Tasks"
          subtitle="Organize and track your daily, weekly, and monthly tasks"
          onCreateTask={handleOpenCreateDialog}
        />

        {/* Task filters */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            background: (theme) => alpha(theme.palette.background.paper, 0.7),
            p: 2,
            borderRadius: "10px",
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
              />
            }
            label="Show Completed"
          />
        </Box>

        {/* Task Summary */}
        {tasks.length > 0 && <TaskSummary tasks={tasks} />}

        {/* Tasks grid with improved layout */}
        <Grid container spacing={3}>
          {filteredTasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <TaskCard
                task={task}
                onComplete={handleComplete}
                onEdit={handleOpenEditDialog}
                onDelete={handleDelete}
                onAddToGoal={handleOpenAssociateDialog}
                onRemoveFromGoal={handleUnassociateTask}
                showCompleted={showCompleted}
              />
            </Grid>
          ))}
          {filteredTasks.length === 0 && !isLoading && (
            <Grid item xs={12}>
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  px: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.background.paper, 0.7),
                  borderRadius: "16px",
                  boxShadow: 1,
                  border: (theme) =>
                    `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <EventNoteIcon
                    sx={{
                      fontSize: 64,
                      color: "text.secondary",
                      mb: 2,
                      opacity: 0.7,
                    }}
                  />
                  <Typography
                    variant="h5"
                    color="text.primary"
                    gutterBottom
                    fontWeight={600}
                  >
                    {showCompleted
                      ? "You haven't completed any tasks yet"
                      : "You don't have any active tasks"}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 3, maxWidth: "600px", mx: "auto" }}
                  >
                    {showCompleted
                      ? "Complete some tasks to see your progress here. Your completed tasks will be displayed in this section."
                      : "Create your first task to get started. Tasks help you stay organized and track your progress."}
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreateDialog}
                    sx={{
                      mt: 2,
                      borderRadius: "10px",
                      textTransform: "none",
                      px: 4,
                      py: 1,
                      fontWeight: 500,
                    }}
                  >
                    Create Task
                  </Button>
                </motion.div>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Floating action button for mobile */}
        <Box sx={{ display: { sm: "none" } }}>
          <Fab
            color="primary"
            aria-label="add"
            onClick={handleOpenCreateDialog}
            sx={{
              position: "fixed",
              bottom: 16,
              right: 16,
              zIndex: 1000,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "rotate(90deg)",
              },
            }}
          >
            <AddIcon />
          </Fab>
        </Box>

        {/* Notification snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={() =>
              setNotification((prev) => ({ ...prev, open: false }))
            }
            severity={notification.severity}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {/* Dialogs */}
        <TaskCreateDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onCreate={handleCreate}
          userTasks={tasks}
          goals={goals}
          token={token}
        />

        <TaskEditDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setCurrentEditTask(null);
          }}
          onSave={handleSaveEdit}
          initialTitle={currentEditTask?.title || ""}
          initialDescription={currentEditTask?.description || ""}
          initialFrequency={currentEditTask?.frequency || ""}
          userTasks={tasks}
        />

        <HappinessDialog
          open={happinessDialogOpen}
          taskId={ratingTaskId}
          taskTitle={ratingTaskTitle}
          onClose={() => {
            setHappinessDialogOpen(false);
            setRatingTaskId("");
            setRatingTaskTitle("");
          }}
          onSubmit={handleSubmitHappiness}
        />

        {/* Associate Task With Goal Dialog */}
        <AssociateTaskWithGoalDialog
          open={associateDialogOpen}
          onClose={() => setAssociateDialogOpen(false)}
          onAssociate={handleAssociateTask}
          task={taskToAssociate}
          goals={goals}
          isLoading={isLoadingGoals}
        />
      </Box>
    </PageContainer>
  );
}
