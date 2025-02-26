'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Grid, Box, CircularProgress, Typography } from '@mui/material';
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

const Dashboard = () => {
  console.log('🔥 Dashboard.tsx is rendering...');

  const [tasks, setTasks] = useState<any[]>([]);
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 Dashboard Auth Debug:', { user, token, loading });

    if (!loading && !user) {
      console.log('❌ No user, redirecting to login...');
      router.push('/login');
    }
  }, [user, token, loading, router]);

  useEffect(() => {
    if (user && token) {
      fetchTasks();
    }
  }, [user, token]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUserTasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const tasksData = await response.json();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

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

  if (!user) {
    return (
      <PageContainer title='Unauthorized' description='Access denied'>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height='80vh'
        >
          <Typography variant='h5'>Redirecting to login...</Typography>
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
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
