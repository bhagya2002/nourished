"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  Box,
  Button,
  Grid,
  LinearProgress,
  Alert,
  useTheme,
  Snackbar,
  alpha,
  IconButton,
  Tooltip,
} from "@mui/material";

import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import InsightsIcon from "@mui/icons-material/Insights";
import EventNoteIcon from "@mui/icons-material/EventNote";
import RefreshIcon from "@mui/icons-material/Refresh";

import TaskHistoryDayGroup from "./components/TaskHistoryDayGroup";
import TaskStatsCard from "./components/TaskStatsCard";
import TaskHistoryFilters from "./components/TaskHistoryFilters";
import EmptyState from "./components/EmptyState";
import PageHeader from "./components/PageHeader";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

export default function TaskHistoryPage() {
  const theme = useTheme();
  const [completions, setCompletions] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token, user, loading: authLoading, refreshToken } = useAuth();
  const router = useRouter();

  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    completionsLast7Days: 0,
    completionsLast30Days: 0,
    totalCompletions: 0,
  });

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const [lastDoc, setLastDoc] = useState<any>(null);
  const [noMoreData, setNoMoreData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/authentication/login");
    }
  }, [authLoading, user, router]);

  const fetchHistory = async (isLoadMore = false) => {
    if (!token) return;

    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      if (firstLoad) {
        setErrorMsg(null);
        setNotification({
          open: true,
          message: "Loading task history...",
          severity: "info",
        });
        setFirstLoad(false);
      }

      const makeRequest = async (currentToken: string) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(`${API_BASE_URL}/getTaskHistory`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: currentToken,
              startDate,
              endDate,
              lastDoc: isLoadMore ? lastDoc : null,
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const responseText = await response.text();
            console.log("Error response:", responseText);

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
        } catch (error: any) {
          console.error("Request error:", error);
          if (error.name === "AbortError") {
            throw new Error("Request timed out. Please try again.");
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
            response = await makeRequest(freshToken);
          } else {
            throw new Error("Failed to refresh authentication token");
          }
        } else {
          throw error;
        }
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch task history");
      }

      const completionsData = data.data || {};
      const newData = completionsData.completions || [];

      // Set pagination state
      if (completionsData.lastDoc) {
        setLastDoc(completionsData.lastDoc);
      } else {
        setNoMoreData(true);
      }

      if (!isLoadMore) {
        const streaksData =
          completionsData.streaks || data.stats || data.streaks || {};

        setStats({
          currentStreak: streaksData.currentStreak || streaksData.current || 0,
          longestStreak: streaksData.longestStreak || streaksData.longest || 0,
          completionsLast7Days:
            streaksData.completionsLast7Days ||
            streaksData.last7Days ||
            streaksData.completions7Days ||
            0,
          completionsLast30Days:
            streaksData.completionsLast30Days ||
            streaksData.last30Days ||
            streaksData.completions30Days ||
            0,
          totalCompletions:
            streaksData.totalCompletions ||
            streaksData.total ||
            newData.length ||
            0,
        });
      }

      setCompletions(isLoadMore ? [...completions, ...newData] : newData);

      if (!isLoadMore && firstLoad) {
        setNotification({
          open: true,
          message: "Task history loaded successfully",
          severity: "success",
        });
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to load task history."
      );

      setNotification({
        open: true,
        message:
          err instanceof Error ? err.message : "Failed to load task history.",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token, startDate, endDate]);

  const handleApplyFilter = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setLastDoc(null);
    setNoMoreData(false);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    setLastDoc(null);
    setNoMoreData(false);
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  const completionsByDate = completions.reduce(
    (groups: Record<string, any[]>, item) => {
      const date = new Date(item.completedAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    },
    {}
  );

  return (
    <PageContainer title="Task History" description="View your completed tasks">
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <PageHeader
            title="Task History"
            subtitle="Track your progress and review all your completed tasks"
          />

          <Tooltip title="Refresh task history">
            <span>
              <IconButton
                onClick={() => fetchHistory()}
                color="primary"
                disabled={loading}
                sx={{
                  height: 40,
                  width: 40,
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: "rotate(180deg)",
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TaskStatsCard
              title="Current Streak"
              value={stats.currentStreak}
              description="consecutive days"
              icon={LocalFireDepartmentIcon}
              color="primary"
              delay={0.1}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TaskStatsCard
              title="Longest Streak"
              value={stats.longestStreak}
              description="day record"
              icon={EmojiEventsIcon}
              color="success"
              delay={0.2}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TaskStatsCard
              title="Last 7 Days"
              value={stats.completionsLast7Days}
              description="tasks completed"
              icon={InsightsIcon}
              color="info"
              delay={0.3}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TaskStatsCard
              title="Total"
              value={stats.totalCompletions}
              description="tasks completed"
              icon={EventNoteIcon}
              color="warning"
              delay={0.4}
            />
          </Grid>
        </Grid>

        <TaskHistoryFilters
          startDate={startDate}
          endDate={endDate}
          onFilterApply={handleApplyFilter}
          onFilterClear={handleClearFilter}
          isOpen={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        />

        {errorMsg && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: "10px" }}
            onClose={() => setErrorMsg(null)}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => fetchHistory()}
              >
                Retry
              </Button>
            }
          >
            {errorMsg}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 3, borderRadius: "4px" }} />}

        {/* Completions Content */}
        {!loading && completions.length === 0 ? (
          <EmptyState
            hasFilters={startDate !== "" || endDate !== ""}
            onClearFilters={handleClearFilter}
          />
        ) : (
          <>
            {Object.entries(completionsByDate).map(([date, items], index) => (
              <TaskHistoryDayGroup
                key={date}
                date={date}
                tasks={items}
                index={index}
              />
            ))}

            {!noMoreData && completions.length > 0 && (
              <Box
                sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 4 }}
              >
                <Button
                  variant="outlined"
                  disabled={loadingMore}
                  onClick={() => fetchHistory(true)}
                  sx={{
                    px: 4,
                    py: 1,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 500,
                    boxShadow: "none",
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    "&:hover": {
                      boxShadow: theme.shadows[1],
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </Button>
              </Box>
            )}
          </>
        )}

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            elevation={6}
            variant="filled"
            onClose={handleCloseNotification}
            severity={notification.severity}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
