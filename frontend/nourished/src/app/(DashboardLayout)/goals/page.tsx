"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Alert,
  Snackbar,
  AlertColor,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControl,
  Chip,
} from "@mui/material";
import PageContainer from "../components/container/PageContainer";
import TaskCreateDialog from "../tasks/components/TaskCreateDialog";
import TaskEditDialog from "../tasks/components/TaskEditDialog";
import HappinessDialog from "../tasks/components/HappinessDialog";
import { AnimatePresence } from "framer-motion";

import PageHeader from "./components/PageHeader";
import GoalCard from "./components/GoalCard";
import EmptyState from "./components/EmptyState";
import GoalSummary from "./components/GoalSummary";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

export type Goal = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  createdAt: string;
  tasks: any[];
  totalTasks: number;
  completedTasks: number;
  isChallenge: boolean;
};

export type Challenge = {
  id: string;
  goalId: string;
  participants: string[];
  uid: string;
};

export default function GoalsPage() {
  const router = useRouter();
  const { user, token, loading, refreshToken } = useAuth();

  const [friends, setFriends] = useState<any[]>([]);
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Goal>({
    id: "",
    title: "",
    description: "",
    deadline: "",
    createdAt: "",
    tasks: [],
    totalTasks: 0,
    completedTasks: 0,
    isChallenge: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [validationError, setValidationError] = useState("");
  const [toast, setToast] = useState({
    open: false,
    message: "nothing",
    severity: "info",
  });
  const today = new Date().toISOString().split("T")[0];
  const [expandingGoalIndex, setExpandingGoalIndex] = useState(-1);

  const [taskCreateModalOpen, setTaskCreateModalOpen] = useState(false);
  const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
  const [taskEditingIndex, setTaskEditingIndex] = useState(-1);

  const [happinessDialogOpen, setHappinessDialogOpen] = useState(false);
  const [ratingTaskId, setRatingTaskId] = useState<string | null>(null);
  const [ratingTaskTitle, setRatingTaskTitle] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  const [expandedGoals, setExpandedGoals] = useState<{
    [key: string]: boolean;
  }>({});

  const resetNewGoal = () => {
    setNewGoal({
      id: "",
      title: "",
      description: "",
      deadline: "",
      createdAt: "",
      tasks: [],
      totalTasks: 0,
      completedTasks: 0,
      isChallenge: false,
    });
  };

  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getFriends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to fetch friends");
      const friendsData = await response.json();

      if (friendsData && friendsData.data && Array.isArray(friendsData.data)) {
        setFriends(friendsData.data);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
      setToast({
        open: true,
        message: "Failed to fetch friends",
        severity: "error",
      });
      setFriends([]);
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getChallenges`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to fetch challenges");
      const challengesData = await response.json();

      if (
        challengesData &&
        challengesData.data &&
        Array.isArray(challengesData.data)
      ) {
        setChallenges(challengesData.data);
      } else {
        setChallenges([]);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
      setToast({
        open: true,
        message: "Failed to fetch challenges",
        severity: "error",
      });
      setChallenges([]);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUsergoals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to fetch goals");
      const goalsData = await response.json();

      if (goalsData && goalsData.data && Array.isArray(goalsData.data)) {
        const goalsDetail = goalsData.data.map((goal: any) => ({
          ...goal,
          tasks: goal.taskIds || [],
        }));

        setGoals(goalsDetail);

        for (let index = 0; index < goalsDetail.length; index++) {
          if (goalsDetail[index] && goalsDetail[index].id) {
            await fetchGoalTasks(index, goalsDetail);
          }
        }
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
      setToast({
        open: true,
        message: "Failed to fetch goals",
        severity: "error",
      });
      setGoals([]);
    }
  };

  const fetchGoalTasks = async (index: number, currentGoals?: Goal[]) => {
    const goalsArray = currentGoals || goals;

    if (!goalsArray[index] || !goalsArray[index].id) {
      console.error("Invalid goal index or missing goal ID");
      return;
    }

    const goalId = goalsArray[index].id;
    try {
      const response = await fetch(`${API_BASE_URL}/getGoalTasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, goalId: goalId }),
      });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const tasksData = await response.json();

      const tasksArray = Array.isArray(tasksData)
        ? tasksData
        : tasksData && Array.isArray(tasksData.data)
        ? tasksData.data
        : [];

      setGoals((prevGoals) => {
        if (!prevGoals[index]) return prevGoals;

        const updatedGoal = { ...prevGoals[index] };
        updatedGoal.tasks = tasksArray;
        return prevGoals.map((goal, idx) =>
          idx === index ? updatedGoal : goal
        );
      });
    } catch (error) {
      console.error("Error fetching tasks:", error);
      console.error(`Failed to fetch tasks for goal ${goalId}`);
    }
  };

  const handleAddGoalClick = () => {
    setIsEditing(false);
    setGoalModalOpen(true);
    setValidationError("");
  };

  const handleEditGoalClick = (index: number, userId: string) => {
    const goalId = goals[index].id;
    setIsEditing(true);
    setEditingIndex(index);
    setNewGoal(goals[index]);
    setInviteeIds(
      challenges
        .find((c) => c.goalId === goalId)
        ?.participants.filter((uid) => uid !== userId) || []
    );
    console.log(goals[index]);
    setGoalModalOpen(true);
  };

  const handleDeleteGoalClick = async (index: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/deleteGoal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, goalId: goals[index].id }),
      });
      if (!response.ok) throw new Error("Failed to delete goal");
      setGoals((prevGoals) => prevGoals.filter((_, i) => i !== index));
      setToast({
        open: true,
        message: "Goal deleted successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting goal:", error);
      setToast({
        open: true,
        message: "Failed to delete goal",
        severity: "error",
      });
    }
  };

  const handleClose = () => {
    setGoalModalOpen(false);
    setValidationError("");
    resetNewGoal();
    setInviteeIds([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewGoal({ ...newGoal, [e.target.name]: e.target.value });
    setValidationError("");
  };

  const handleSubmit = async () => {
    if (!user || !token) {
      console.error("User or token not found");
      router.push("/authentication/login");
      return;
    }

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

    if (isEditing) {
      try {
        const updateField = async (field: string, value: string) => {
          const response = await fetch(`${API_BASE_URL}/editGoal`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
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
          updateField("title", newGoal.title),
          updateField("description", newGoal.description),
          updateField("deadline", newGoal.deadline),
        ]);

        setGoals((prevGoals) =>
          prevGoals.map((goal, idx) => (idx === editingIndex ? newGoal : goal))
        );
        setToast({
          open: true,
          message: "Goal updated successfully!",
          severity: "success",
        });
      } catch (error) {
        console.error("Error updating goal:", error);
        setToast({
          open: true,
          message: "Failed to update goal",
          severity: "error",
        });
      }
      setGoalModalOpen(false);
      resetNewGoal();
      setInviteeIds([]);
    } else {
      const goalCreatedAt = new Date().toISOString();
      try {
        const response = await fetch(`${API_BASE_URL}/createGoal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            goal: {
              title: newGoal.title,
              description: newGoal.description,
              deadline: newGoal.deadline,
              createdAt: goalCreatedAt,
              taskIds: [],
              totalTasks: 0,
              completedTasks: 0,
              isChallenge: newGoal.isChallenge,
            },
            invitees: inviteeIds,
          }),
        });
        if (!response.ok) throw new Error("Failed to create goal");
        const goalData = await response.json();
        if (!(goalData && goalData.data)) {
          throw new Error("Failed to create goal");
        }
        const goalId = goalData.data.id;
        const challengeId = goalData.data.challengeId;

        if (newGoal.isChallenge && challengeId) {
          setChallenges((prevChallenges) => [
            ...prevChallenges,
            {
              id: challengeId,
              goalId: goalId,
              participants: [user.uid],
              uid: user.uid,
            },
          ]);
        }

        setGoals((prevGoals) => [
          ...prevGoals,
          { ...newGoal, id: goalId, createdAt: goalCreatedAt, uid: user.uid },
        ]);
        setToast({
          open: true,
          message: "Goal created successfully!",
          severity: "success",
        });
      } catch (error) {
        console.error("Error creating goal:", error);
        setToast({
          open: true,
          message: "Failed to create goal",
          severity: "error",
        });
      }
      setGoalModalOpen(false);
      resetNewGoal();
      setInviteeIds([]);
    }
  };

  const handleToggleGoalExpand = (goalId: string) => {
    setExpandedGoals((prev) => {
      const newState = { ...prev };
      newState[goalId] = !prev[goalId];

      if (!prev[goalId]) {
        const goalIndex = goals.findIndex((g) => g.id === goalId);
        if (goalIndex !== -1) {
          if (
            goals[goalIndex].tasks &&
            typeof goals[goalIndex].tasks[0] === "string"
          ) {
            fetchGoalTasks(goalIndex);
          }
        }
      }

      return newState;
    });
    setExpandingGoalIndex(goals.findIndex((g) => g.id === goalId));
  };

  const handleAddTaskToGoal = (goalId: string) => {
    const goalIndex = goals.findIndex((g) => g.id === goalId);
    if (goalIndex !== -1) {
      setExpandingGoalIndex(goalIndex);
      setTaskCreateModalOpen(true);
    }
  };

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

    try {
      const response = await fetch(`${API_BASE_URL}/createTask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      if (!response.ok) throw new Error("Failed to create task");
      const taskData = await response.json();
      if (!(taskData && taskData.data)) {
        throw new Error("Failed to create task under goal");
      }
      const taskId = taskData.data.id;
      const newTask = {
        id: taskId,
        title,
        description,
        frequency,
        createdAt: taskCreatedAt,
        goalId: goals[expandingGoalIndex].id,
      };
      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[expandingGoalIndex] };
        updatedGoal.tasks = [...updatedGoal.tasks, newTask];

        const goalDeadline = new Date(updatedGoal.deadline);
        const taskCreatedTime = new Date(taskCreatedAt);
        const daysLeft = Math.ceil(
          (goalDeadline.getTime() - taskCreatedTime.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        let totalTasks = 0;

        switch (frequency) {
          case "Daily":
            totalTasks = Math.ceil(daysLeft / 1);
            break;
          case "Weekly":
            totalTasks = Math.ceil(daysLeft / 7);
            break;
          case "Monthly":
            totalTasks = Math.ceil(daysLeft / 30);
            break;
          default:
            totalTasks = 0;
            break;
        }
        updatedGoal.totalTasks += totalTasks;
        return prevGoals.map((goal, idx) =>
          idx === expandingGoalIndex ? updatedGoal : goal
        );
      });
      setToast({
        open: true,
        message: "Task created successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      setToast({
        open: true,
        message: "Failed to create task",
        severity: "error",
      });
    }
  };

  const handleGoalTaskEdit = async (updatedData: {
    title: string;
    description: string;
    frequency: string;
  }) => {
    try {
      const prevFrequency =
        goals[expandingGoalIndex].tasks[taskEditingIndex].frequency;
      const updateField = async (field: string, value: string) => {
        const res = await fetch(`${API_BASE_URL}/editTask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
        updateField("title", updatedData.title),
        updateField("description", updatedData.description),
        updateField("frequency", updatedData.frequency),
      ]);

      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[expandingGoalIndex] };
        const updatedTasks = [...updatedGoal.tasks];
        updatedTasks[taskEditingIndex] = {
          ...updatedTasks[taskEditingIndex],
          ...updatedData,
        };
        updatedGoal.tasks = updatedTasks;

        if (prevFrequency !== updatedData.frequency) {
          const goalDeadline = new Date(updatedGoal.deadline);
          const taskEditTime = new Date();
          let daysLeft = Math.ceil(
            (goalDeadline.getTime() - taskEditTime.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (updatedTasks[taskEditingIndex].completedAt) {
            const completedAt: Date = new Date(
              updatedTasks[taskEditingIndex].completedAt
            );
            if (
              completedAt.getDate() === taskEditTime.getDate() &&
              completedAt.getMonth() === taskEditTime.getMonth() &&
              completedAt.getFullYear() === taskEditTime.getFullYear()
            ) {
              daysLeft -= 1;
            }
          }
          let totalTasksDecreased = 0;
          let totalTasksIncreased = 0;
          switch (prevFrequency) {
            case "Daily":
              totalTasksDecreased = Math.ceil(daysLeft / 1);
              break;
            case "Weekly":
              totalTasksDecreased = Math.ceil(daysLeft / 7);
              break;
            case "Monthly":
              totalTasksDecreased = Math.ceil(daysLeft / 30);
              break;
            default:
              totalTasksDecreased = 0;
              break;
          }
          switch (updatedData.frequency) {
            case "Daily":
              totalTasksIncreased = Math.ceil(daysLeft / 1);
              break;
            case "Weekly":
              totalTasksIncreased = Math.ceil(daysLeft / 7);
              break;
            case "Monthly":
              totalTasksIncreased = Math.ceil(daysLeft / 30);
              break;
            default:
              totalTasksIncreased = 0;
              break;
          }
          updatedGoal.totalTasks -= totalTasksDecreased;
          updatedGoal.totalTasks += totalTasksIncreased;
        }
        return prevGoals.map((goal, idx) =>
          idx === expandingGoalIndex ? updatedGoal : goal
        );
      });
      setToast({
        open: true,
        message: "Task updated successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      setToast({
        open: true,
        message: "Failed to update task",
        severity: "error",
      });
    }
  };

  const handleGoalTaskDelete = async (taskId: string) => {
    try {
      if (!taskId) return;

      const taskToDelete = goals[expandingGoalIndex].tasks.find(
        (task) => task.id === taskId
      );
      const taskName = taskToDelete?.title || "Task";

      setToast({
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

      let res = await makeRequest(token!);

      if (res.status === 401) {
        const responseText = await res.text();

        if (
          responseText.includes("token has expired") ||
          responseText.includes("auth/id-token-expired")
        ) {
          console.log("Token expired, attempting to refresh...");
          const freshToken = await refreshToken();

          if (freshToken) {
            console.log("Token refreshed, retrying request");
            res = await makeRequest(freshToken);
          }
        }
      }

      if (res.ok) {
        setGoals((prevGoals) => {
          const updatedGoal = { ...prevGoals[expandingGoalIndex] };
          const updatedTasks = [...updatedGoal.tasks];
          const taskIndex = updatedTasks.findIndex(
            (task) => task.id === taskId
          );

          const goalDeadline = new Date(updatedGoal.deadline);
          const taskDeletedTime = new Date();
          let daysLeft = Math.ceil(
            (goalDeadline.getTime() - taskDeletedTime.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (updatedTasks[taskIndex].completedAt) {
            const completedAt: Date = new Date(
              updatedTasks[taskIndex].completedAt
            );
            if (
              completedAt.getDate() === taskDeletedTime.getDate() &&
              completedAt.getMonth() === taskDeletedTime.getMonth() &&
              completedAt.getFullYear() === taskDeletedTime.getFullYear()
            ) {
              daysLeft -= 1;
            }
          }
          let totalTasksDecreased = 0;
          switch (updatedTasks[taskIndex].frequency) {
            case "Daily":
              totalTasksDecreased = Math.ceil(daysLeft / 1);
              break;
            case "Weekly":
              totalTasksDecreased = Math.ceil(daysLeft / 7);
              break;
            case "Monthly":
              totalTasksDecreased = Math.ceil(daysLeft / 30);
              break;
            default:
              totalTasksDecreased = 0;
              break;
          }
          updatedGoal.totalTasks -= totalTasksDecreased;
          updatedTasks.splice(taskIndex, 1);
          updatedGoal.tasks = updatedTasks;
          return prevGoals.map((goal, idx) =>
            idx === expandingGoalIndex ? updatedGoal : goal
          );
        });

        setToast({
          open: true,
          message: `"${taskName}" deleted successfully`,
          severity: "success",
        });

        return;
      }

      const data = await res.json().catch(() => ({}));

      setToast({
        open: true,
        message: data.error || "Failed to delete task",
        severity: "error",
      });
    } catch (error: any) {
      console.error("Error deleting task:", error);
      setToast({
        open: true,
        message: error.message || "Failed to delete task",
        severity: "error",
      });
    }
  };

  const handleComplete = async (taskId: string) => {
    if (isLoading) return;

    try {
      if (expandingGoalIndex < 0 || expandingGoalIndex >= goals.length) {
        console.error("Invalid goal index:", expandingGoalIndex);
        return;
      }

      const currentTask = goals[expandingGoalIndex].tasks.find(
        (task) => task.id === taskId
      );
      if (!currentTask) {
        console.error("Task not found:", taskId);
        return;
      }

      const newCompletedState = !currentTask.completed;

      setToast({
        open: true,
        message: newCompletedState
          ? "Task completed ✓"
          : "Task marked incomplete",
        severity: newCompletedState ? "success" : "info",
      });

      setGoals((prevGoals) => {
        const updatedGoal = { ...prevGoals[expandingGoalIndex] };
        const updatedTasks = [...updatedGoal.tasks];
        const taskIndex = updatedTasks.findIndex((task) => task.id === taskId);

        if (taskIndex === -1) return prevGoals;

        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          completed: newCompletedState,
        };

        updatedGoal.tasks = updatedTasks;
        updatedGoal.completedTasks = newCompletedState
          ? updatedGoal.completedTasks + 1
          : updatedGoal.completedTasks - 1;

        console.log("Task completion update:", {
          goalId: updatedGoal.id,
          goalTitle: updatedGoal.title,
          taskId,
          newCompletedState,
          completedTasks: updatedGoal.completedTasks,
          totalTasks: updatedGoal.totalTasks,
        });

        return prevGoals.map((goal, idx) =>
          idx === expandingGoalIndex ? updatedGoal : goal
        );
      });

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
          if (newCompletedState) {
            setRatingTaskId(taskId);
            setRatingTaskTitle(currentTask.title);

            setTimeout(() => {
              setHappinessDialogOpen(true);
            }, 1000);
          }
          return;
        }

        throw new Error("Failed to update task completion");
      } catch (error) {
        console.error("Error toggling task completion:", error);
        setToast({
          open: true,
          message: "Failed to toggle task completion",
          severity: "error",
        });

        setGoals((prevGoals) => {
          const updatedGoal = { ...prevGoals[expandingGoalIndex] };
          const updatedTasks = [...updatedGoal.tasks];
          const taskIndex = updatedTasks.findIndex(
            (task) => task.id === taskId
          );

          if (taskIndex === -1) return prevGoals;

          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            completed: !newCompletedState,
          };

          updatedGoal.tasks = updatedTasks;
          updatedGoal.completedTasks = updatedTasks.filter(
            (t) => t.completed
          ).length;

          return prevGoals.map((goal, idx) =>
            idx === expandingGoalIndex ? updatedGoal : goal
          );
        });
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
      setToast({
        open: true,
        message: "Failed to toggle task completion",
        severity: "error",
      });
    }
  };

  const handleSubmitHappiness = async (taskId: string, rating: number) => {
    try {
      setToast({
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

      setToast({
        open: true,
        message: "Happiness rating submitted. Thank you!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error submitting happiness rating:", error);
      setToast({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit happiness rating",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/authentication/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && token) {
      fetchFriends();
      fetchGoals();
      fetchChallenges();
    }
  }, [user, token]);

  return (
    <PageContainer title="Goals" description="Create and manage your goals">
      <Box sx={{ mt: 2 }}>
        {/* popup toast message */}
        <Snackbar
          open={toast.open}
          autoHideDuration={3000}
          onClose={handleToastClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{ "&.MuiSnackbar-root": { right: { sm: 40 } } }}
        >
          <Alert
            onClose={handleToastClose}
            severity={toast.severity as AlertColor}
            sx={{ width: "100%" }}
          >
            {toast.message}
          </Alert>
        </Snackbar>

        {/* Page Header Component */}
        <PageHeader
          title="Goals & Challenges"
          subtitle="Set and track your personal goals and group goals (challenges)"
          onCreateGoal={handleAddGoalClick}
        />

        {/* Goal Summary */}
        <GoalSummary goals={goals} />

        {/* Goals List with Modern Cards */}
        {user && (
          <AnimatePresence>
            {goals.length === 0 ? (
              <EmptyState onCreateGoal={handleAddGoalClick} />
            ) : (
              <Stack spacing={3} sx={{ p: 1 }}>
                {/**
                 * FR8 - Task.Delete - The system shall allow users to delete wellness tasks. It shall
                  display a confirmation prompt to prevent accidental deletion and remove
                  the task from the database upon confirmation.
                 * FR13 - Goal.Delete - The system shall allow users to delete personal goals. A
                  confirmation prompt shall be displayed before the goal is removed from the
                  database.
                */}
                {goals.map((goal, index) => (
                  <GoalCard
                    isOwner={
                      goal.isChallenge
                        ? user.uid ===
                          challenges.find(
                            (challenge) => challenge.goalId === goal.id
                          )?.uid
                        : true
                    }
                    key={goal.id}
                    goal={goal}
                    isExpanded={Boolean(expandedGoals[goal.id])}
                    onEdit={() => handleEditGoalClick(index, user.uid)}
                    onDelete={() => handleDeleteGoalClick(index)}
                    onToggleExpand={() => handleToggleGoalExpand(goal.id)}
                    onAddTask={() => handleAddTaskToGoal(goal.id)}
                    onCompleteTask={async (taskId: string) => {
                      setExpandingGoalIndex(index);
                      await handleComplete(taskId);
                    }}
                    onEditTask={(task: any, taskIndex: number) => {
                      setExpandingGoalIndex(index);
                      setTaskEditingIndex(taskIndex);
                      setTaskEditModalOpen(true);
                    }}
                    onDeleteTask={async (taskId: string) => {
                      setExpandingGoalIndex(index);
                      await handleGoalTaskDelete(taskId);
                    }}
                    index={index}
                  />
                ))}
              </Stack>
            )}
          </AnimatePresence>
        )}

        {/* Tasks list under expanded goals */}
        {/* {user && goals.map((goal, goalIndex) => (
          <Collapse
            key={`tasks-${goal.id}`}
            in={expandedGoals[goal.id]}
            timeout="auto"
            unmountOnExit
            sx={{ px: 2, mt: -2, mb: 3 }}
          >
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, ml: 1 }}>
              Tasks for {goal.title}
            </Typography>
            <Grid container spacing={2}>
              {goal.tasks && goal.tasks.length > 0 && goal.tasks.map((task: any, taskIndex: number) => (
                <Grid item xs={12} sm={6} md={4} key={task.id || taskIndex}>
                  <TaskCard
                    disabled={!(goal.isChallenge ? user.uid === challenges.find((challenge) => challenge.goalId === goal.id)?.uid : true)}
                    task={task}
                    onComplete={async (taskId) => {
                      setExpandingGoalIndex(goalIndex);
                      await handleComplete(taskId);
                    }}
                    onEdit={() => {
                      setExpandingGoalIndex(goalIndex);
                      setTaskEditingIndex(taskIndex);
                      setTaskEditModalOpen(true);
                    }}
                    onDelete={() => handleGoalTaskDelete(task.id)}
                  />
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={4}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    disabled={!(goal.isChallenge ? user.uid === challenges.find((challenge) => challenge.goalId === goal.id)?.uid : true)}
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setExpandingGoalIndex(goalIndex);
                      setTaskCreateModalOpen(true);
                    }}
                    sx={{
                      height: '100%',
                      minHeight: 150,
                      borderRadius: 2,
                      borderStyle: 'dashed',
                      borderWidth: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem'
                    }}
                  >
                    Add New Task
                  </Button>
                </motion.div>
              </Grid>
            </Grid>
          </Collapse>
        ))} */}

        {/* add/edit goal form dialog */}
        {user && (
          /**
           * FR11 - Goal.Creation - The system shall allow users to create personal goals by
            providing a title, description, and deadline. It shall validate the inputs and
            save the goal to the database for tracking.
           * FR12 - Goal.Edit - The system shall enable users to edit existing goals. It shall
            validate the modifications and update the goal details in the database.
          */
          <Dialog open={goalModalOpen} onClose={handleClose}>
            <DialogTitle>
              {isEditing
                ? newGoal.isChallenge
                  ? challenges.find(
                      (challenge) => challenge.goalId === newGoal.id
                    )?.goalId === newGoal.id
                    ? "Challenge Info"
                    : "Edit Challenge"
                  : "Edit goal"
                : "Create New Goal"}
            </DialogTitle>
            <DialogContent dividers>
              {validationError && (
                <Alert severity="error" style={{ margin: "0px" }}>
                  {validationError}
                </Alert>
              )}
              <TextField
                autoFocus
                margin="normal"
                label="Title"
                type="text"
                fullWidth
                name="title"
                value={newGoal.title}
                onChange={handleInputChange}
                size="small"
                disabled={
                  isEditing &&
                  newGoal.isChallenge &&
                  user.uid !==
                    challenges.find(
                      (challenge) => challenge.goalId === newGoal.id
                    )?.uid
                }
              />
              <TextField
                margin="normal"
                label="Description"
                type="text"
                fullWidth
                name="description"
                value={newGoal.description}
                onChange={handleInputChange}
                size="small"
                disabled={
                  isEditing &&
                  newGoal.isChallenge &&
                  user.uid !==
                    challenges.find(
                      (challenge) => challenge.goalId === newGoal.id
                    )?.uid
                }
              />
              <TextField
                margin="normal"
                label="Deadline"
                type="date"
                fullWidth
                name="deadline"
                value={newGoal.deadline}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                size="small"
                inputProps={{ min: today }}
                disabled={isEditing}
              />

              {/* Goal type toggle (goal or challenge) */}
              {/**
               * FR21 - Friend.Challenges - The system shall enable users to create and participate
                in group challenges, tracking collective progress and displaying updates to
                all participants.
              */}
              <ToggleButtonGroup
                disabled={isEditing}
                sx={{ mt: 2, mb: 1 }}
                color="primary"
                value={newGoal.isChallenge}
                exclusive
                onChange={(event, value) =>
                  setNewGoal({ ...newGoal, isChallenge: value })
                }
                aria-label="goal-challenge-toggle"
              >
                <ToggleButton value={false}>Personal Goal</ToggleButton>
                <ToggleButton value={true}>Group Challenge</ToggleButton>
              </ToggleButtonGroup>

              {/* Friend selection for group challenges */}
              {newGoal.isChallenge && (
                <FormControl margin="dense" fullWidth sx={{ display: "flex" }}>
                  <InputLabel id="challenge-invite-label">
                    {isEditing ? "Friends in Challenge" : "Select Friends"}
                  </InputLabel>
                  <Select
                    disabled={isEditing}
                    sx={{ minHeight: 104 }}
                    labelId="challenge-invite-label"
                    id="challenge-invite-select"
                    multiple
                    value={inviteeIds}
                    onChange={(event) => {
                      const {
                        target: { value },
                      } = event;
                      setInviteeIds(
                        typeof value === "string" ? value.split(",") : value
                      );
                    }}
                    input={
                      <OutlinedInput
                        label={
                          isEditing ? "Friends in Challenge" : "Select Friends"
                        }
                      />
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {friends
                          .filter((friend) => selected.includes(friend.id))
                          .map((friend) => (
                            <Chip key={friend.id} label={friend.name} />
                          ))}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 48 * 4.5 + 8,
                        },
                      },
                    }}
                  >
                    {friends.map((friend) => (
                      <MenuItem key={friend.id} value={friend.id}>
                        <Checkbox checked={inviteeIds.includes(friend.id)} />
                        <ListItemText primary={friend.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              {!(
                isEditing &&
                newGoal.isChallenge &&
                user.uid !==
                  challenges.find(
                    (challenge) => challenge.goalId === newGoal.id
                  )?.uid
              ) && (
                <Button variant="contained" onClick={handleSubmit}>
                  {isEditing ? "Update" : "Create"}
                </Button>
              )}
            </DialogActions>
          </Dialog>
        )}

        {/* add/edit task form dialog */}
        <Box>
          {/**
           * FR6 - Task.Creation - The system shall allow users to create wellness tasks by
            providing a title, description, and frequency (e.g., daily, weekly). It shall
            validate the inputs and save the task details to the database.
          */}
          <TaskCreateDialog
            open={taskCreateModalOpen}
            onClose={() => setTaskCreateModalOpen(false)}
            onCreate={handleGoalTaskCreate}
            userTasks={
              expandingGoalIndex >= 0 &&
              goals[expandingGoalIndex] !== undefined &&
              Array.isArray(goals[expandingGoalIndex].tasks)
                ? goals[expandingGoalIndex].tasks
                : []
            }
            token={token}
          />
          {expandingGoalIndex >= 0 &&
            taskEditingIndex >= 0 &&
            goals[expandingGoalIndex] !== undefined &&
            Array.isArray(goals[expandingGoalIndex].tasks) &&
            goals[expandingGoalIndex].tasks[taskEditingIndex] !== undefined && (
              /**
               * FR7 - Task.Edit - The system shall allow users to edit existing tasks by modifying
                the title, description, or frequency. The changes shall be validated and
                updated in the database upon user confirmation.
              */
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
        </Box>
        {/** 
         * FR10 - Task.Happiness - The system shall prompt users daily to rate their happiness
          on a scale. The ratings shall be validated, stored in the database, and used
          for generating insights.
        */}
        <HappinessDialog
          open={happinessDialogOpen}
          taskId={ratingTaskId || ""}
          taskTitle={ratingTaskTitle}
          onClose={() => setHappinessDialogOpen(false)}
          onSubmit={handleSubmitHappiness}
        />
      </Box>
    </PageContainer>
  );
}
