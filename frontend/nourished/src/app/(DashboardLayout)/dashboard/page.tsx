'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Grid, Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '@/context/AuthContext'; // Import Auth Context
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
// components
import SalesOverview from '@/app/(DashboardLayout)/components/dashboard/SalesOverview';
import YearlyBreakup from '@/app/(DashboardLayout)/components/dashboard/YearlyBreakup';
import RecentTransactions from '@/app/(DashboardLayout)/components/dashboard/RecentTransactions';
import ProductPerformance from '@/app/(DashboardLayout)/components/dashboard/ProductPerformance';
import Blog from '@/app/(DashboardLayout)/components/dashboard/Blog';
import MonthlyEarnings from '@/app/(DashboardLayout)/components/dashboard/MonthlyEarnings';

const Dashboard = () => {
  console.log('🔥 Dashboard.tsx is rendering...');

  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 Dashboard Auth Debug:', { user, token, loading });

    if (!loading && !user) {
      console.log('❌ No user, redirecting to login...');
      router.push('/login');
    }
  }, [user, token, loading, router]);

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
            <SalesOverview />
          </Grid>
          <Grid item xs={12} lg={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <YearlyBreakup />
              </Grid>
              <Grid item xs={12}>
                <MonthlyEarnings />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} lg={4}>
            <RecentTransactions />
          </Grid>
          <Grid item xs={12} lg={8}>
            <ProductPerformance />
          </Grid>
          <Grid item xs={12}>
            <Blog />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
