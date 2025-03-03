'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Grid, Box, CircularProgress, Typography, Button } from '@mui/material';
import Spline from '@splinetool/react-spline';
import { useAuth } from '@/context/AuthContext';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
// Dashboard components
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

  const splineRef = useRef<any>(null); // ✅ Fix for "Missing Property" error
  const [plantState, setPlantState] = useState<string>('Base State'); // ✅ Track current state
  const [isSplineLoaded, setIsSplineLoaded] = useState<boolean>(false);

  useEffect(() => {
    console.log('🚀 Dashboard Auth Debug:', { user, token, loading });

    if (!loading && !user) {
      console.log('❌ No user, redirecting to login...');
      router.push('/login');
    }
  }, [user, token, loading, router]);

  // Store the Spline instance when it loads
  const handleSplineLoad = (spline: any) => {
    console.log('✅ Spline scene loaded');
    splineRef.current = spline;
    setIsSplineLoaded(true);
  };

  // Function to change Spline state (simulating key press event)
  const changePlantState = (key: string) => {
    if (!isSplineLoaded || !splineRef.current) {
      console.warn('⏳ Spline is not fully loaded yet.');
      return;
    }

    console.log(`🔄 Simulating key press: ${key}`);

    // Simulating a real keyboard event
    document.dispatchEvent(new KeyboardEvent('keydown', { key }));

    // Alternative: If `setVariable` works inside Spline, use this:
    // splineRef.current.setVariable('plantState', key);

    setPlantState(`Triggered ${key}`);
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
      {/* Spline Model Container (Auto-Resizing) */}
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        mb={4}
        width='100%'
      >
        {/* Full-width Spline Container inside the Grey Box */}
        <Box
          sx={{
            width: '100%', // ✅ Fills the entire available space
            height: '100%', // ✅ Fills the entire height
            maxWidth: '800px', // Prevents excessive stretching
            maxHeight: '600px',
            minWidth: '300px',
            minHeight: '300px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden', // ✅ Prevents scrolling
            backgroundColor: '#f0f0f0', // (Optional) Keep the background
            borderRadius: '12px', // (Optional) Smooth edges
          }}
        >
          <Spline
            scene='https://prod.spline.design/8VKOoWnnBtZ7SuPp/scene.splinecode'
            onLoad={handleSplineLoad}
            style={{
              width: '100%', // ✅ Makes sure it fills the container
              height: '100%',
              transform: 'scale(0.4)', // ✅ Adjust scale if needed
              transformOrigin: 'center', // ✅ Centers the Spline scene
            }}
          />
        </Box>

        {/* Buttons to Trigger Key Events */}
        <Box mt={2} display='flex' gap={2}>
          {[
            { key: 'q', label: '1 Leaf' },
            { key: 'w', label: '2 Leaves' },
            { key: 'e', label: '3 Leaves' },
            { key: 'r', label: '4 Leaves' },
            { key: 'y', label: '5 Leaves' },
            { key: 'u', label: '6 Leaves' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={
                plantState === `Triggered ${key}` ? 'contained' : 'outlined'
              }
              color='primary'
              disabled={!isSplineLoaded} // ✅ Disable until Spline is loaded
              onClick={() => changePlantState(key)}
            >
              {label}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Existing Dashboard Content */}
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
