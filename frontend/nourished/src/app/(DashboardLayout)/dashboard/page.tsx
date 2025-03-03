'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Grid, Box, CircularProgress, Typography, Button, Chip, Divider, Stack } from '@mui/material';
import { useAuth } from '@/context/AuthContext'; // Import Auth Context
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
// components
import TaskOverview from '@/app/(DashboardLayout)/components/dashboard/TaskOverview';
import TaskCompletionTrends from '@/app/(DashboardLayout)/components/dashboard/TaskCompletionTrends';
import HappinessTrends from '@/app/(DashboardLayout)/components/dashboard/HappinessTrends';
import StreakCounter from '@/app/(DashboardLayout)/components/dashboard/StreakCounter';
import WellnessCategories from '@/app/(DashboardLayout)/components/dashboard/WellnessCategories';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });
};

// Helper function to format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Dashboard = () => {
  console.log('🔥 Dashboard.tsx is rendering...');

  const [tasks, setTasks] = useState<any[]>([]);
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const { user, token, loading, refreshToken } = useAuth();
  const router = useRouter();
  const [happinessData, setHappinessData] = useState<any[]>([]);
  const [isLoadingHappiness, setIsLoadingHappiness] = useState(false);
  const [happinessError, setHappinessError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 Dashboard Auth Debug:', { user, token, loading });

    if (!loading && !user) {
      console.log('❌ No user, redirecting to login...');
      router.push('/login');
    }
  }, [user, token, loading, router]);

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    setTaskError(null);
    
    try {
      try {
        // Add timeout to prevent long-hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
        
        const response = await fetch(`${API_BASE_URL}/getUserTasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal
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
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          console.error("Request timed out. Server might be overloaded.");
          throw new Error("Request timed out. The server might be overloaded. Please try again later.");
        }
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          console.error("Cannot connect to server. Please ensure the backend is running.");
          throw new Error("Cannot connect to the server. Please check if the backend server is running.");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTaskError(error instanceof Error ? error.message : "Failed to load tasks");
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Function to fetch recent completed tasks
  const fetchRecentCompletions = async () => {
    if (!token) return;
    
    setIsLoadingHistory(true);
    setHistoryError(null);
    
    try {
      // Add timeout to prevent long-hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      // Call the getTaskHistory endpoint to get recent completions
      const makeRequest = async (currentToken: string) => {
        const response = await fetch(`${API_BASE_URL}/getTaskHistory`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: currentToken }),
          signal: controller.signal
        });
        
        if (!response.ok) {
          const responseText = await response.text();
          console.log("Error response:", responseText);
          
          // Handle token expiration
          if (response.status === 401 && (responseText.includes('token has expired') || responseText.includes('auth/id-token-expired'))) {
            throw new Error("token_expired");
          } else {
            throw new Error(`Server error: ${response.status} - ${responseText || 'Failed to fetch task history'}`);
          }
        }
        
        return response;
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
            throw new Error("Authentication error. Please log in again.");
          }
        } else if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error("Request timed out. The server might be overloaded. Please try again later.");
        } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new Error("Cannot connect to the server. Please check if the backend server is running.");
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
      
      // Take only the first 5 for the dashboard
      const recentCompletions = data.data && data.data.completions 
        ? data.data.completions.slice(0, 5) 
        : [];
        
      setCompletedTasks(recentCompletions);
    } catch (error) {
      console.error("Error fetching recent completions:", error);
      setHistoryError(error instanceof Error ? error.message : "Failed to load recent completions");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Function to fetch happiness data
  const fetchHappinessData = async () => {
    if (!token) return;
    
    setIsLoadingHappiness(true);
    setHappinessError(null);
    
    try {
      // Add timeout to prevent long-hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
      
      // Call the getHappinessData endpoint
      const makeRequest = async (currentToken: string) => {
        const response = await fetch(`${API_BASE_URL}/getHappinessData`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: currentToken }),
          signal: controller.signal
        });
        
        if (!response.ok) {
          const responseText = await response.text();
          
          // Handle token expiration
          if (response.status === 401 && (responseText.includes('token has expired') || responseText.includes('auth/id-token-expired'))) {
            throw new Error("token_expired");
          } else {
            throw new Error(`Server error: ${response.status} - ${responseText || 'Failed to fetch happiness data'}`);
          }
        }
        
        return response;
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
            throw new Error("Authentication error. Please log in again.");
          }
        } else if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error("Request timed out. The server might be overloaded. Please try again later.");
        } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new Error("Cannot connect to the server. Please check if the backend server is running.");
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
      setHappinessError(error instanceof Error ? error.message : "Failed to load happiness data");
    } finally {
      setIsLoadingHappiness(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchTasks();
      fetchRecentCompletions();
      fetchHappinessData();
    }
  }, [user, token]);

  if (loading) {
    return (
      <PageContainer title='Loading...' description='Please wait'>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height='80vh'
        >
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }
  
  // Show task loading state
  if (isLoadingTasks) {
    return (
      <PageContainer title='Dashboard' description='Your personal dashboard'>
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 1 
                }}
              >
                <CircularProgress size={40} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Loading your tasks...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  This should only take a few seconds
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </PageContainer>
    );
  }
  
  // Show error state
  if (taskError) {
    return (
      <PageContainer title='Dashboard' description='Your personal dashboard'>
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                  borderRadius: 2,
                  boxShadow: 1 
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
    <PageContainer title='Nourished' description='Welcome to Nourished'>
      <Box>
        <Grid container spacing={3}>
          {/* First Row: Combined Key Metrics & Welcome */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              {/* Task Overview */}
              <Grid item xs={12} sm={4}>
                <TaskOverview 
                  completedCount={tasks.filter(t => t.completed).length} 
                  totalCount={tasks.length} 
                />
              </Grid>
              
              {/* Streak Counter */}
              <Grid item xs={12} sm={4}>
                <StreakCounter 
                  taskHistory={completedTasks}
                  isLoading={isLoadingHistory}
                />
              </Grid>

              {/* Recent Activity - More prominent placement */}
              <Grid item xs={12} sm={4}>
                <DashboardCard title="Recent Activity">
                  <Box sx={{ p: 2 }}>
                    {completedTasks.length > 0 ? (
                      completedTasks.slice(0, 3).map((task, index) => (
                        <Box key={index} sx={{ 
                          py: 1.5, 
                          display: 'flex', 
                          alignItems: 'center',
                          borderBottom: index < completedTasks.slice(0, 3).length - 1 ? '1px solid' : 'none',
                          borderColor: 'divider'
                        }}>
                          <CheckCircleIcon color="success" sx={{ mr: 1.5, fontSize: '1rem' }} />
                          <Box>
                            <Typography variant="body2" noWrap sx={{ maxWidth: '140px' }}>
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(task.completedAt)}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No completed tasks yet
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </DashboardCard>
              </Grid>
            </Grid>
          </Grid>
          
          {/* Second Row: Main Dashboard Content */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {/* Task Completion Trends Chart */}
              <Grid item xs={12}>
                <TaskCompletionTrends 
                  taskHistory={completedTasks}
                  isLoading={isLoadingHistory}
                  error={historyError}
                />
              </Grid>
              
              {/* Simplified Happiness Trends (without redundant overview) */}
              <Grid item xs={12}>
                <HappinessTrends
                  happinessData={happinessData}
                  isLoading={isLoadingHappiness}
                  error={happinessError}
                  showOverview={true}
                />
              </Grid>
            </Grid>
          </Grid>
          
          {/* Wellness Categories */}
          <Grid item xs={12} md={4}>
            <WellnessCategories 
              tasks={tasks}
              isLoading={isLoadingTasks}
            />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
