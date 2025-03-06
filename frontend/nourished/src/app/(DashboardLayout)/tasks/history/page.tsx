'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

// Icons
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RepeatIcon from '@mui/icons-material/Repeat';
import InsightsIcon from '@mui/icons-material/Insights';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterListIcon from '@mui/icons-material/FilterList';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SearchIcon from '@mui/icons-material/Search';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper function to format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TaskHistoryPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [completions, setCompletions] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token, user, loading: authLoading, refreshToken } = useAuth();
  const router = useRouter();

  // Stats state
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    completionsLast7Days: 0,
    completionsLast30Days: 0,
    totalCompletions: 0,
  });

  // Date filter
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [noMoreData, setNoMoreData] = useState(false);

  // Polling
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [firstLoad, setFirstLoad] = useState(true);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/authentication/login');
    }
  }, [authLoading, user, router]);

  const fetchHistory = async (isLoadMore = false) => {
    if (!token) return;

    setLoading(true);
    if (firstLoad) {
      setErrorMsg('Loading task history...');
      setFirstLoad(false);
    }

    try {
      // Add a loading message if this is the first load
      const makeRequest = async (currentToken: string) => {
        try {
          // Add timeout to prevent long-hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

          const response = await fetch(`${API_BASE_URL}/getTaskHistory`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
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

          // Check if response is ok immediately to avoid potential issues
          if (!response.ok) {
            const responseText = await response.text();
            console.log('Error response:', responseText);

            // Handle different error scenarios
            if (
              response.status === 401 &&
              (responseText.includes('token has expired') ||
                responseText.includes('auth/id-token-expired'))
            ) {
              throw new Error('token_expired');
            } else {
              throw new Error(
                `Server error: ${response.status} - ${
                  responseText || 'Failed to fetch task history'
                }`
              );
            }
          }

          return response;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Request timed out. Server might be overloaded.');
          }
          if (
            error instanceof TypeError &&
            error.message === 'Failed to fetch'
          ) {
            // This is a network error - server might be down
            throw new Error(
              'Cannot connect to server. Please ensure the backend server is running.'
            );
          }
          throw error;
        }
      };

      // First attempt with current token
      let response;
      try {
        response = await makeRequest(token);
      } catch (error: any) {
        // Only attempt to refresh token if the error is due to token expiration
        if (error.message === 'token_expired' && refreshToken) {
          console.log('Token expired, attempting to refresh...');
          const freshToken = await refreshToken();

          if (freshToken) {
            console.log('Token refreshed, retrying request');
            response = await makeRequest(freshToken);
          } else {
            console.error('Failed to refresh token');
            router.push('/authentication/login');
            return;
          }
        } else {
          // Re-throw for other errors
          throw error;
        }
      }

      const data = await response.json();

      // Clear any loading message
      setErrorMsg(null);

      if (!data.success) {
        throw new Error(data.error || 'Failed to load task history data');
      }

      // Handle streaks and statistics
      if (data.data && data.data.streaks) {
        setStats(data.data.streaks);
      }

      // Handle task completions
      const newData =
        data.data && data.data.completions ? data.data.completions : [];
      setLastDoc(data.data && data.data.lastDoc ? data.data.lastDoc : null);
      setNoMoreData(newData.length === 0 || !(data.data && data.data.lastDoc));
      setCompletions(isLoadMore ? [...completions, ...newData] : newData);
    } catch (err) {
      console.error('Error fetching history:', err);
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to load task history.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Set up polling to periodically check for new task completions
  useEffect(() => {
    if (token) {
      fetchHistory();

      // Set up polling interval (every 30 seconds) to get updates
      if (!pollingInterval) {
        const interval = setInterval(() => {
          if (!loading) fetchHistory();
        }, 30000); // 30 seconds
        setPollingInterval(interval);
      }

      // Cleanup
      return () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      };
    }
  }, [token, startDate, endDate]); // Re-run when filters change

  // Group completions by date
  const completionsByDate = completions.reduce((groups, item) => {
    const date = new Date(item.completedAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  return (
    <PageContainer title='Task History' description='View your completed tasks'>
      <Box>
        {/* Header with back button and title */}
        <Stack direction='row' alignItems='center' spacing={2} sx={{ mb: 3 }}>
          <IconButton
            onClick={() => router.push('/tasks')}
            size='small'
            sx={{
              backgroundColor: theme.palette.background.default,
              '&:hover': { backgroundColor: theme.palette.background.paper },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant='h4' component='h1'>
            Task History
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant='outlined'
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            size='small'
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Stack>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
                color: 'white',
                boxShadow: `0 4px 20px 0 rgba(${theme.palette.primary.main}, 0.14)`,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Box>
                    <Typography variant='overline' sx={{ opacity: 0.8 }}>
                      Current Streak
                    </Typography>
                    <Typography
                      variant='h3'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {stats.currentStreak}
                    </Typography>
                    <Typography variant='body2' sx={{ opacity: 0.8 }}>
                      consecutive days
                    </Typography>
                  </Box>
                  <LocalFireDepartmentIcon
                    sx={{ fontSize: 48, opacity: 0.8 }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: `linear-gradient(135deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
                color: 'white',
                boxShadow: `0 4px 20px 0 rgba(${theme.palette.success.main}, 0.14)`,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Box>
                    <Typography variant='overline' sx={{ opacity: 0.8 }}>
                      Longest Streak
                    </Typography>
                    <Typography
                      variant='h3'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {stats.longestStreak}
                    </Typography>
                    <Typography variant='body2' sx={{ opacity: 0.8 }}>
                      day record
                    </Typography>
                  </Box>
                  <EmojiEventsIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: `linear-gradient(135deg, ${theme.palette.info.light}, ${theme.palette.info.main})`,
                color: 'white',
                boxShadow: `0 4px 20px 0 rgba(${theme.palette.info.main}, 0.14)`,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Box>
                    <Typography variant='overline' sx={{ opacity: 0.8 }}>
                      Last 7 Days
                    </Typography>
                    <Typography
                      variant='h3'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {stats.completionsLast7Days}
                    </Typography>
                    <Typography variant='body2' sx={{ opacity: 0.8 }}>
                      tasks completed
                    </Typography>
                  </Box>
                  <InsightsIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: `linear-gradient(135deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`,
                color: 'white',
                boxShadow: `0 4px 20px 0 rgba(${theme.palette.warning.main}, 0.14)`,
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack
                  direction='row'
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Box>
                    <Typography variant='overline' sx={{ opacity: 0.8 }}>
                      Total
                    </Typography>
                    <Typography
                      variant='h3'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {stats.totalCompletions}
                    </Typography>
                    <Typography variant='body2' sx={{ opacity: 0.8 }}>
                      tasks completed
                    </Typography>
                  </Box>
                  <EventNoteIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Error Message */}
        {errorMsg && (
          <Alert
            severity='error'
            sx={{ mb: 3 }}
            onClose={() => setErrorMsg(null)}
            action={
              <Button
                color='inherit'
                size='small'
                onClick={() => fetchHistory()}
              >
                Retry
              </Button>
            }
          >
            {errorMsg}
          </Alert>
        )}

        {/* No Data Message */}
        {!loading && completions.length === 0 && !errorMsg && (
          <DashboardCard>
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <EventNoteIcon
                  sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}
                />
                <Typography variant='h5' gutterBottom>
                  No Completed Tasks Found
                </Typography>
                <Typography
                  variant='body1'
                  color='text.secondary'
                  sx={{ mb: 3 }}
                >
                  {startDate || endDate
                    ? 'No completed tasks found in the selected date range.'
                    : "You haven't completed any tasks yet."}
                </Typography>
                <Button variant='contained' component={Link} href='/tasks'>
                  Go to Tasks
                </Button>
              </Box>
            </CardContent>
          </DashboardCard>
        )}

        {/* Date Range Filters */}
        {showFilters && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant='h6' gutterBottom>
              Filter History
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <TextField
                label='Start Date'
                type='date'
                size='small'
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label='End Date'
                type='date'
                size='small'
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant='contained'
                onClick={() => {
                  setLastDoc(null);
                  setNoMoreData(false);
                  fetchHistory(false);
                }}
                startIcon={<SearchIcon />}
                sx={{ minWidth: '120px' }}
              >
                Apply
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Loading Indicator */}
        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* Render Completions Grouped by Date */}
        {Object.keys(completionsByDate).length > 0 ? (
          <Stack spacing={3}>
            {Object.entries(completionsByDate).map(([date, items]) => (
              <Box key={date}>
                <Typography
                  variant='h6'
                  sx={{
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'text.secondary',
                  }}
                >
                  <CalendarTodayIcon sx={{ mr: 1, fontSize: 20 }} />
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>

                <Stack spacing={2}>
                  {(items as any[]).map((item) => (
                    <Card
                      key={item.id}
                      sx={{
                        borderRadius: 2,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                        },
                      }}
                    >
                      <CardContent>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2}
                          alignItems={{ sm: 'center' }}
                          justifyContent='space-between'
                        >
                          <Box>
                            <Typography variant='h6' color='text.primary'>
                              {item.title}
                            </Typography>

                            <Typography
                              variant='body2'
                              color='text.secondary'
                              sx={{ mb: 1 }}
                            >
                              {item.description}
                            </Typography>

                            <Stack
                              direction='row'
                              spacing={2}
                              alignItems='center'
                              sx={{ color: 'text.secondary' }}
                            >
                              <Box
                                sx={{ display: 'flex', alignItems: 'center' }}
                              >
                                <AccessTimeIcon
                                  sx={{ fontSize: 16, mr: 0.5 }}
                                />
                                <Typography variant='caption'>
                                  {formatTime(item.completedAt)}
                                </Typography>
                              </Box>

                              {item.frequency && (
                                <Box
                                  sx={{ display: 'flex', alignItems: 'center' }}
                                >
                                  <RepeatIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                  <Typography variant='caption'>
                                    {item.frequency}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Box>

                          <Chip
                            label='Completed'
                            color='success'
                            size='small'
                            sx={{
                              fontWeight: 'medium',
                              borderRadius: '12px',
                              px: 1,
                            }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            ))}

            {/* Pagination Button */}
            {!noMoreData && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant='outlined'
                  disabled={loading || noMoreData}
                  onClick={() => fetchHistory(true)}
                  sx={{ px: 4, borderRadius: '12px' }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </Box>
            )}
          </Stack>
        ) : (
          !loading && (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Typography variant='h6' gutterBottom color='text.secondary'>
                No completed tasks found
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                Mark some tasks as complete to see them appear here
              </Typography>
              <Button variant='contained' component={Link} href='/tasks'>
                Go to Tasks
              </Button>
            </Paper>
          )
        )}
      </Box>
    </PageContainer>
  );
}
