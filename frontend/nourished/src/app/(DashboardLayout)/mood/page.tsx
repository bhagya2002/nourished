"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
} from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import MoodSelector from "./components/MoodSelector";
import MoodCalendar from "./components/MoodCalendar";
import MoodStats from "./components/MoodStats";
import MoodDetails from "./components/MoodDetails";
import { motion } from "framer-motion";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

interface MoodEntry {
  date: string;
  rating: number;
  note?: string;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  }),
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1.0],
    },
  },
};

export default function MoodPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token, loading: authLoading, refreshToken } = useAuth();

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "warning" | "info" | "success";
  }>({ open: false, message: "", severity: "info" });
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">(
    "month"
  );
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | undefined>(
    undefined
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/authentication/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && token) {
      fetchMoodData();
    }
  }, [user, token]);

  useEffect(() => {
    if (!isLoading && !authLoading) {
      const timer = setTimeout(() => {
        setPageLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, authLoading]);

  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeframe: "week" | "month" | "year" | null
  ) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };

  const fetchMoodData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      let currentToken = token;
      if (refreshToken) {
        console.log("Forcing token refresh before fetching mood data");
        currentToken = await refreshToken();
        if (!currentToken) {
          throw new Error("Failed to refresh authentication token");
        }
      }

      const response = await fetch(`${API_BASE_URL}/getMoodData`, {
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
        throw new Error(data.error || "Failed to fetch mood data");
      }

      const transformedData: MoodEntry[] = (data.data?.ratings || []).map(
        (item: any) => ({
          date: item.date,
          rating: item.rating,
          note: item.note || "",
        })
      );

      setMoodEntries(transformedData);
    } catch (error) {
      console.error("Error fetching mood data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load mood data"
      );

      setNotification({
        open: true,
        message:
          error instanceof Error ? error.message : "Failed to load mood data",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitMood = async (rating: number, note: string) => {
    if (!user) {
      setNotification({
        open: true,
        message: "You must be logged in to submit a mood entry",
        severity: "error",
      });
      return;
    }

    try {
      let currentToken = token;
      if (refreshToken) {
        console.log("Forcing token refresh before submitting mood");
        currentToken = await refreshToken();
        if (!currentToken) {
          throw new Error("Failed to refresh authentication token");
        }
      }

      const today = new Date().toISOString().split("T")[0];

      const existingTodayMood = moodEntries.find((entry) => {
        const entryDate = new Date(entry.date);
        const entryDateStr = entryDate.toISOString().split("T")[0];
        return entryDateStr === today;
      });

      if (existingTodayMood) {
        console.log(
          "Found existing mood for today, updating instead of creating new one"
        );
        return await handleUpdateMood(existingTodayMood.date, note, rating);
      }

      setNotification({
        open: true,
        message: "Saving your mood...",
        severity: "info",
      });

      const response = await fetch(`${API_BASE_URL}/submitMood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: currentToken,
          rating,
          note,
          date: new Date().toISOString(),
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
        throw new Error(data.error || "Failed to submit mood");
      }

      await fetchMoodData();

      setNotification({
        open: true,
        message: "Mood saved successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error submitting mood:", error);

      setNotification({
        open: true,
        message:
          error instanceof Error ? error.message : "Failed to submit mood",
        severity: "error",
      });
    }
  };

  const handleDeleteMood = async (date: string) => {
    if (!user) {
      setNotification({
        open: true,
        message: "You must be logged in to delete a mood entry",
        severity: "error",
      });
      return;
    }

    try {
      setNotification({
        open: true,
        message: "Deleting mood entry...",
        severity: "info",
      });

      let currentToken = token;
      if (refreshToken) {
        console.log("Forcing token refresh before deleting mood");
        currentToken = await refreshToken();
        if (!currentToken) {
          throw new Error("Failed to refresh authentication token");
        }
      }

      const response = await fetch(`${API_BASE_URL}/deleteMood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: currentToken,
          date,
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
        throw new Error(data.error || "Failed to delete mood entry");
      }

      setMoodEntries(moodEntries.filter((entry) => entry.date !== date));

      setNotification({
        open: true,
        message: "Mood entry deleted successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting mood entry:", error);

      setNotification({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete mood entry",
        severity: "error",
      });

      throw error;
    }
  };

  const handleUpdateMood = async (
    date: string,
    note: string,
    rating?: number
  ) => {
    if (!user) {
      setNotification({
        open: true,
        message: "You must be logged in to update a mood entry",
        severity: "error",
      });
      return;
    }

    try {
      setNotification({
        open: true,
        message: "Updating mood entry...",
        severity: "info",
      });

      let currentToken = token;
      if (refreshToken) {
        console.log("Forcing token refresh before updating mood");
        currentToken = await refreshToken();
        if (!currentToken) {
          throw new Error("Failed to refresh authentication token");
        }
      }

      const response = await fetch(`${API_BASE_URL}/updateMood`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: currentToken,
          date,
          note,
          rating,
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
        throw new Error(data.error || "Failed to update mood entry");
      }

      await fetchMoodData();

      setNotification({
        open: true,
        message: "Mood entry updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating mood entry:", error);

      setNotification({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update mood entry",
        severity: "error",
      });

      throw error;
    }
  };

  const handleDayClick = (date: string, entry?: MoodEntry) => {
    if (entry) {
      setSelectedEntry(entry);
      setDetailsOpen(true);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  if (authLoading) {
    return (
      <PageContainer title="Mood Tracker" description="Track your daily mood">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "70vh",
          }}
        >
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Mood Tracker" description="Track your daily mood">
      <Box sx={{ pb: 5 }}>
        {/* Page header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={headerVariants}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                fontWeight: 600,
                letterSpacing: "-0.5px",
                color: "text.primary",
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.2,
                mb: 1,
              }}
            >
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  display: "inline",
                }}
              >
                Mood Tracker
              </Box>
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: "text.secondary",
                fontWeight: 400,
                letterSpacing: "0.15px",
                maxWidth: "800px",
              }}
            >
              Track your daily moods to gain insight into your emotional
              patterns and well-being. Regular tracking helps you understand
              what affects your mood and identify trends over time.
            </Typography>
          </Box>
        </motion.div>

        {/* Main content */}
        <Grid container spacing={3}>
          {/* Left column - Mood input and calendar */}
          <Grid item xs={12} md={8}>
            {/* Mood selector */}
            <motion.div
              custom={1}
              initial="hidden"
              animate={pageLoaded ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <MoodSelector onSubmit={handleSubmitMood} />
            </motion.div>

            {/* Mood calendar */}
            <motion.div
              custom={2}
              initial="hidden"
              animate={pageLoaded ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <MoodCalendar
                moodEntries={moodEntries}
                onDayClick={handleDayClick}
              />
            </motion.div>
          </Grid>

          {/* Right column - Mood stats */}
          <Grid item xs={12} md={4}>
            {/* Timeframe selector */}
            <motion.div
              custom={3}
              initial="hidden"
              animate={pageLoaded ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <Box
                sx={{
                  mb: 3,
                  display: "flex",
                  justifyContent: "center",
                  background: alpha(theme.palette.background.paper, 0.7),
                  borderRadius: "12px",
                  p: 1,
                }}
              >
                <ToggleButtonGroup
                  value={timeframe}
                  exclusive
                  onChange={handleTimeframeChange}
                  aria-label="timeframe"
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      borderRadius: "8px",
                      px: 2,
                      py: 0.5,
                      mx: 0.5,
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      "&.Mui-selected": {
                        background: `linear-gradient(45deg, ${alpha(
                          theme.palette.primary.main,
                          0.9
                        )}, ${alpha(theme.palette.secondary.main, 0.9)})`,
                        color: "white",
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <ToggleButton value="week">Week</ToggleButton>
                  <ToggleButton value="month">Month</ToggleButton>
                  <ToggleButton value="year">Year</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </motion.div>

            {/* Mood statistics */}
            <motion.div
              custom={4}
              initial="hidden"
              animate={pageLoaded ? "visible" : "hidden"}
              variants={fadeIn}
            >
              <MoodStats moodEntries={moodEntries} timeframe={timeframe} />
            </motion.div>
          </Grid>
        </Grid>

        {/* Mood details dialog */}
        <MoodDetails
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          entry={selectedEntry}
          onDelete={handleDeleteMood}
          onUpdate={handleUpdateMood}
        />

        {/* Notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: "100%" }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
