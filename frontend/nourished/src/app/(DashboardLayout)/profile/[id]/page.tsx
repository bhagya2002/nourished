'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Box,
  Avatar,
  Stack,
  Chip,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';


import { useAuth } from '@/context/AuthContext';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { IconMail, IconMapPin, IconCalendar, IconUsers, IconUserPlus, IconUserCheck } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';

interface Activity {
  id: string;
  title: string;
  completedAt?: string;
}

const UserProfilePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
    friends: string[];
    joinedDate?: string;
    location?: string;
    bio?: string;
    stats?: {
      tasksCompleted: number;
      currentStreak: number;
      bestStreak: number;
      averageHappiness: number;
    };
  } | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      if (!userId || userId === user?.uid) {
        router.push('/profile');
        return;
      }

      try {
        // Get user profile data from API
        const response = await fetch('/api/getUserProfile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: await user?.getIdToken(),
            userId: userId
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          setError(result.error || 'Failed to load user profile');
          setIsLoading(false);
          return;
        }

        const data = result.data;
        setIsFriend(data.isFriend);
        
        // Set user data
        setUserData({
          id: userId,
          name: data.name || 'Anonymous',
          email: data.email,
          friends: data.friends || [],
          joinedDate: data.createdAt || new Date().toISOString(),
          location: data.location || 'Not specified',
          bio: data.bio || 'No bio yet',
          stats: {
            tasksCompleted: data.taskHistory?.completions?.length || 0,
            currentStreak: data.taskHistory?.streaks?.current || 0,
            bestStreak: data.taskHistory?.streaks?.best || 0,
            averageHappiness: data.taskHistory?.averageHappiness || 0,
          },
        });

        // Set recent activity
        if (data.taskHistory?.completions) {
          setRecentActivity(data.taskHistory.completions.slice(0, 5).map((task: any) => ({
            id: task.id,
            title: task.title,
            completedAt: task.completedAt
          })));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, loading, userId, router]);

  const handleAddFriend = async () => {
    if (!user || !userData) return;

    try {
      const response = await fetch('/api/addFriendConnection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: await user.getIdToken(),
          uid1: user.uid,
          uid2: userData.id
        }),
      });

      if (response.ok) {
        setIsFriend(!isFriend);
      } else {
        console.error('Failed to update friend status');
      }
    } catch (error) {
      console.error('Error updating friends:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'PP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading || isLoading) {
    return (
      <PageContainer title="Loading..." description="Please wait">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Error" description="Something went wrong">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </PageContainer>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <PageContainer title={userData.name} description="View user profile">
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <DashboardCard>
            <Box sx={{ position: 'relative', pb: 3 }}>
              {/* Cover Image */}
              <Box
                sx={{
                  height: 200,
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: (theme) => 
                    `linear-gradient(45deg, ${theme.palette.secondary.light}, ${theme.palette.secondary.main})`,
                  mb: -8,
                }}
              />
              
              {/* Profile Info */}
              <Box
                sx={{
                  position: 'relative',
                  px: 3,
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 2,
                }}
              >
                <Avatar
                  src="/images/profile/user-1.jpg"
                  alt={userData.name}
                  sx={{
                    width: 120,
                    height: 120,
                    border: '4px solid white',
                    boxShadow: 1,
                  }}
                />
                <Box sx={{ flex: 1, mb: 2 }}>
                  <Typography variant="h4" fontWeight="bold">
                    {userData.name}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconMail size={16} />
                    <Typography variant="body2" color="text.secondary">
                      {userData.email}
                    </Typography>
                    {userData.location && (
                      <>
                        <IconMapPin size={16} />
                        <Typography variant="body2" color="text.secondary">
                          {userData.location}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </Box>
                <Button
                  variant={isFriend ? "outlined" : "contained"}
                  startIcon={isFriend ? <IconUserCheck size={18} /> : <IconUserPlus size={18} />}
                  onClick={handleAddFriend}
                  color={isFriend ? "secondary" : "primary"}
                >
                  {isFriend ? 'Friends' : 'Add Friend'}
                </Button>
              </Box>
            </Box>

            {/* Stats Row */}
            <Box sx={{ px: 3, py: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {userData.stats?.tasksCompleted || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasks Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {userData.stats?.currentStreak || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Streak
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {userData.friends.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Friends
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      {userData.stats?.averageHappiness || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg. Happiness
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DashboardCard>
        </Grid>

        {/* Content */}
        <Grid item xs={12} md={4}>
          <DashboardCard title="About">
            <Typography variant="body1" paragraph>
              {userData.bio}
            </Typography>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <IconCalendar size={20} />
                <Typography variant="body2">
                  Joined {formatDate(userData.joinedDate)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <IconUsers size={20} />
                <Typography variant="body2">
                  {userData.friends.length} Friends
                </Typography>
              </Box>
            </Stack>
          </DashboardCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <DashboardCard 
            title="Recent Activity"
            action={
              <Chip
                label={`${recentActivity.length} activities`}
                size="small"
                color="primary"
                variant="outlined"
              />
            }
          >
            <List>
              {recentActivity.map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemText
                    primary={activity.title}
                    secondary={formatDate(activity.completedAt)}
                  />
                  <Chip
                    label="Completed"
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                </ListItem>
              ))}
              {recentActivity.length === 0 && (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  No recent activity
                </Typography>
              )}
            </List>
          </DashboardCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default UserProfilePage; 