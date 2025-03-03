'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Grid, Box, CircularProgress, Typography, Button, Card, CardContent, CardHeader, Chip, Divider, Stack } from '@mui/material';
import { useAuth } from '@/context/AuthContext'; // Import Auth Context
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
// components
import TaskOverview from '@/app/(DashboardLayout)/components/dashboard/TaskOverview';
import SalesOverview from '@/app/(DashboardLayout)/components/dashboard/SalesOverview';
import YearlyBreakup from '@/app/(DashboardLayout)/components/dashboard/YearlyBreakup';
import RecentTransactions from '@/app/(DashboardLayout)/components/dashboard/RecentTransactions';
import ProductPerformance from '@/app/(DashboardLayout)/components/dashboard/ProductPerformance';
import Blog from '@/app/(DashboardLayout)/components/dashboard/Blog';
import MonthlyEarnings from '@/app/(DashboardLayout)/components/dashboard/MonthlyEarnings';
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

  useEffect(() => {
    if (user && token) {
      fetchTasks();
      fetchRecentCompletions();
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
          <Grid item xs={12} lg={8}>
            <DashboardCard title="Task Progress">
              <Box sx={{ p: 3, height: '400px' }}>
                {/* Placeholder for task completion trend chart */}
                <Typography variant="h6" mb={2}>Task Completion Trends</Typography>
                {/* We'll implement the actual chart later */}
                <Box sx={{ 
                  height: '300px', 
                  bgcolor: 'background.paper',
                  border: '1px dashed grey',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  Chart Coming Soon
                </Box>
              </Box>
            </DashboardCard>
          </Grid>
          <Grid item xs={12} lg={4}>
            <TaskOverview 
              completedCount={tasks.filter(t => t.completed).length} 
              totalCount={tasks.length} 
            />
          </Grid>
          <Grid item xs={12}>
            <DashboardCard title="Wellness Streaks">
              <Box sx={{ p: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: 1
                    }}>
                      <Typography variant="h3" textAlign="center">
                        {tasks.filter(t => t.completed).length}
                      </Typography>
                      <Typography variant="subtitle1" textAlign="center">
                        Tasks Completed Today
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: 1
                    }}>
                      <Typography variant="h3" textAlign="center">
                        5 {/* Placeholder - will implement streak logic */}
                      </Typography>
                      <Typography variant="subtitle1" textAlign="center">
                        Day Streak
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      boxShadow: 1
                    }}>
                      <Typography variant="h3" textAlign="center">
                        {tasks.length}
                      </Typography>
                      <Typography variant="subtitle1" textAlign="center">
                        Total Active Tasks
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </DashboardCard>
          </Grid>
          <Grid item xs={12} lg={6}>
            <DashboardCard title="Recent Completions">
              {isLoadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : historyError ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <ErrorOutlineIcon color="error" sx={{ fontSize: 40, mb: 2 }} />
                  <Typography color="error">{historyError}</Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }} 
                    onClick={fetchRecentCompletions}
                  >
                    Retry
                  </Button>
                </Box>
              ) : completedTasks.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    No completed tasks yet.
                  </Typography>
                  <Button 
                    variant="contained" 
                    component={Link} 
                    href="/tasks" 
                    sx={{ mt: 2 }}
                  >
                    Go to Tasks
                  </Button>
                </Box>
              ) : (
                <Box>
                  {completedTasks.map((task, index) => (
                    <Box key={task.id}>
                      <Box sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {task.title}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                <CalendarTodayIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                <Typography variant="caption">
                                  {formatDate(task.completedAt)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                                <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                <Typography variant="caption">
                                  {formatTime(task.completedAt)}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>
                          <Chip 
                            label="Completed" 
                            size="small" 
                            color="success"
                            icon={<CheckCircleIcon />}
                          />
                        </Stack>
                      </Box>
                      {index < completedTasks.length - 1 && <Divider />}
                    </Box>
                  ))}
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Button 
                      component={Link}
                      href="/tasks/history"
                      variant="text"
                    >
                      View All History
                    </Button>
                  </Box>
                </Box>
              )}
            </DashboardCard>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
