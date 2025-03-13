'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Container,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import MoodSelector from './components/MoodSelector';
import MoodCalendar from './components/MoodCalendar';
import MoodStats from './components/MoodStats';
import MoodDetails from './components/MoodDetails';

// Define the API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';

// Define Mood Entry type
interface MoodEntry {
  date: string;
  rating: number;
  note?: string;
}

export default function MoodPage() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token, loading: authLoading, refreshToken } = useAuth();
  
  // State variables
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'success';
  }>({ open: false, message: '', severity: 'info' });
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [selectedEntry, setSelectedEntry] = useState<MoodEntry | undefined>(undefined);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/authentication/login');
    }
  }, [authLoading, user, router]);
  
  // Fetch mood data on mount
  useEffect(() => {
    if (user && token) {
      fetchMoodData();
    }
  }, [user, token]);
  
  // Handle timeframe change
  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeframe: 'week' | 'month' | 'year' | null,
  ) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };
  
  // Fetch mood data from the backend
  const fetchMoodData = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/getHappinessData`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken }),
          signal: controller.signal,
        });
      };
      
      let response;
      try {
        response = await makeRequest(token);
      } catch (error: any) {
        if (error.message === 'token_expired' && refreshToken) {
          console.log('Token expired, attempting to refresh...');
          const freshToken = await refreshToken();
          
          if (freshToken) {
            response = await makeRequest(freshToken);
          } else {
            throw new Error('Failed to refresh authentication token');
          }
        } else {
          throw error;
        }
      } finally {
        clearTimeout(timeoutId);
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch mood data');
      }
      
      // Transform API data to our format
      const transformedData: MoodEntry[] = (data.data?.ratings || []).map((item: any) => ({
        date: item.date,
        rating: item.rating,
        note: item.note || '',
      }));
      
      setMoodEntries(transformedData);
    } catch (error) {
      console.error('Error fetching mood data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load mood data');
      
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to load mood data',
        severity: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit new mood entry
  const handleSubmitMood = async (rating: number, note: string) => {
    if (!token || !user) {
      setNotification({
        open: true,
        message: 'You must be logged in to submit a mood entry',
        severity: 'error',
      });
      return;
    }
    
    try {
      setNotification({
        open: true,
        message: 'Saving your mood...',
        severity: 'info',
      });
      
      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/submitHappinessRating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: currentToken,
            rating,
            note,
            date: new Date().toISOString(),
          }),
        });
      };
      
      let response;
      try {
        response = await makeRequest(token);
      } catch (error: any) {
        if (error.message === 'token_expired' && refreshToken) {
          console.log('Token expired, attempting to refresh...');
          const freshToken = await refreshToken();
          
          if (freshToken) {
            response = await makeRequest(freshToken);
          } else {
            throw new Error('Failed to refresh authentication token');
          }
        } else {
          throw error;
        }
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit mood');
      }
      
      // Update local state with the new entry
      const newEntry: MoodEntry = {
        date: new Date().toISOString(),
        rating,
        note,
      };
      
      setMoodEntries([...moodEntries, newEntry]);
      
      setNotification({
        open: true,
        message: 'Mood saved successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error submitting mood:', error);
      
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to submit mood',
        severity: 'error',
      });
    }
  };
  
  // Delete mood entry
  const handleDeleteMood = async (date: string) => {
    if (!token || !user) {
      setNotification({
        open: true,
        message: 'You must be logged in to delete a mood entry',
        severity: 'error',
      });
      return;
    }
    
    try {
      setNotification({
        open: true,
        message: 'Deleting mood entry...',
        severity: 'info',
      });
      
      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/deleteHappinessRating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: currentToken,
            date,
          }),
        });
      };
      
      let response;
      try {
        response = await makeRequest(token);
      } catch (error: any) {
        if (error.message === 'token_expired' && refreshToken) {
          console.log('Token expired, attempting to refresh...');
          const freshToken = await refreshToken();
          
          if (freshToken) {
            response = await makeRequest(freshToken);
          } else {
            throw new Error('Failed to refresh authentication token');
          }
        } else {
          throw error;
        }
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete mood entry');
      }
      
      // Update local state by removing the deleted entry
      setMoodEntries(moodEntries.filter(entry => entry.date !== date));
      
      setNotification({
        open: true,
        message: 'Mood entry deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete mood entry',
        severity: 'error',
      });
      
      throw error; // Re-throw for the component to handle
    }
  };
  
  // Update mood entry (note)
  const handleUpdateMood = async (date: string, note: string) => {
    if (!token || !user) {
      setNotification({
        open: true,
        message: 'You must be logged in to update a mood entry',
        severity: 'error',
      });
      return;
    }
    
    try {
      setNotification({
        open: true,
        message: 'Updating mood entry...',
        severity: 'info',
      });
      
      const makeRequest = async (currentToken: string) => {
        return await fetch(`${API_BASE_URL}/updateHappinessRating`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: currentToken,
            date,
            note,
          }),
        });
      };
      
      let response;
      try {
        response = await makeRequest(token);
      } catch (error: any) {
        if (error.message === 'token_expired' && refreshToken) {
          console.log('Token expired, attempting to refresh...');
          const freshToken = await refreshToken();
          
          if (freshToken) {
            response = await makeRequest(freshToken);
          } else {
            throw new Error('Failed to refresh authentication token');
          }
        } else {
          throw error;
        }
      }
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update mood entry');
      }
      
      // Update local state
      setMoodEntries(
        moodEntries.map(entry => 
          entry.date === date ? { ...entry, note } : entry
        )
      );
      
      // Update selected entry if it's the one being edited
      if (selectedEntry && selectedEntry.date === date) {
        setSelectedEntry({ ...selectedEntry, note });
      }
      
      setNotification({
        open: true,
        message: 'Mood entry updated successfully',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error updating mood entry:', error);
      
      setNotification({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to update mood entry',
        severity: 'error',
      });
      
      throw error; // Re-throw for the component to handle
    }
  };
  
  // Handle calendar day click
  const handleDayClick = (date: string, entry?: MoodEntry) => {
    if (entry) {
      setSelectedEntry(entry);
      setDetailsOpen(true);
    }
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // If loading authentication, show loading
  if (authLoading) {
    return (
      <PageContainer title="Mood Tracker" description="Track your daily mood">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer title="Mood Tracker" description="Track your daily mood">
      <Box sx={{ pb: 5 }}>
        {/* Page header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 600,
              letterSpacing: '-0.5px',
              color: 'text.primary',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.2,
              mb: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                display: 'inline',
              }}
            >
              Mood Tracker
            </Box>
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              letterSpacing: '0.15px',
              maxWidth: '800px',
            }}
          >
            Track your daily moods to gain insight into your emotional patterns and well-being.
            Regular tracking helps you understand what affects your mood and identify trends over time.
          </Typography>
        </Box>

        {/* Main content */}
        <Grid container spacing={3}>
          {/* Left column - Mood input and calendar */}
          <Grid item xs={12} md={8}>
            {/* Mood selector */}
            <MoodSelector onSubmit={handleSubmitMood} />
            
            {/* Mood calendar */}
            <MoodCalendar 
              moodEntries={moodEntries} 
              onDayClick={handleDayClick}
            />
          </Grid>
          
          {/* Right column - Mood stats */}
          <Grid item xs={12} md={4}>
            {/* Timeframe selector */}
            <Box 
              sx={{ 
                mb: 3, 
                display: 'flex', 
                justifyContent: 'center',
                background: alpha(theme.palette.background.paper, 0.7),
                borderRadius: '12px',
                p: 1
              }}
            >
              <ToggleButtonGroup
                value={timeframe}
                exclusive
                onChange={handleTimeframeChange}
                aria-label="timeframe"
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: '8px',
                    px: 2,
                    py: 0.5,
                    mx: 0.5,
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    '&.Mui-selected': {
                      background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.secondary.main, 0.9)})`,
                      color: 'white',
                      fontWeight: 600,
                    },
                  },
                }}
              >
                <ToggleButton value="week">
                  Week
                </ToggleButton>
                <ToggleButton value="month">
                  Month
                </ToggleButton>
                <ToggleButton value="year">
                  Year
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
            
            {/* Mood statistics */}
            <MoodStats 
              moodEntries={moodEntries} 
              timeframe={timeframe}
            />
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
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
} 