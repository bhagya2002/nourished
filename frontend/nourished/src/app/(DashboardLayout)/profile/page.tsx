'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Box,
  Avatar,
  Tab,
  Tabs,
  Stack,
  Chip,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import {
  IconEdit,
  IconMail,
  IconMapPin,
  IconCalendar,
  IconUsers,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
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
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [allActivity, setAllActivity] = useState<
    Array<{
      id: string;
      title: string;
      completedAt: string;
      happiness?: number;
    }>
  >([]);
  const [friendsList, setFriendsList] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      photoURL?: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          // Fetch user profile data
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();

            // Calculate average happiness from tasks
            const tasksQuery = query(
              collection(db, 'tasks'),
              where('uid', '==', user.uid),
              where('completed', '==', true)
            );
            const tasksSnap = await getDocs(tasksQuery);
            const tasks = tasksSnap.docs.map((doc) => doc.data());

            const happinessValues = tasks
              .filter((task) => task.happiness !== undefined)
              .map((task) => task.happiness);

            const avgHappiness =
              happinessValues.length > 0
                ? Math.round(
                    (happinessValues.reduce((a, b) => a + b, 0) /
                      happinessValues.length) *
                      10
                  ) / 10
                : 0;

            // Calculate current streak
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const hasCompletedToday = tasks.some((task) => {
              const completedDate = new Date(task.completedAt);
              completedDate.setHours(0, 0, 0, 0);
              return completedDate.getTime() === today.getTime();
            });

            const hasCompletedYesterday = tasks.some((task) => {
              const completedDate = new Date(task.completedAt);
              completedDate.setHours(0, 0, 0, 0);
              return completedDate.getTime() === yesterday.getTime();
            });

            const currentStreak = hasCompletedToday
              ? hasCompletedYesterday
                ? data.currentStreak
                : 1
              : 0;

            setUserData({
              id: user.uid,
              name: data.name || 'Anonymous',
              email: data.email,
              friends: data.friends || [],
              joinedDate: data.createdAt || new Date().toISOString(),
              location: data.location || 'Not specified',
              bio: data.bio || 'No bio yet',
              stats: {
                tasksCompleted: tasks.length,
                currentStreak: currentStreak,
                bestStreak: data.bestStreak || 0,
                averageHappiness: avgHappiness,
              },
            });

            // Fetch friends data
            if (data.friends && data.friends.length > 0) {
              const friendsData = await Promise.all(
                data.friends.map(async (friendId: string) => {
                  const friendDoc = await getDoc(doc(db, 'users', friendId));
                  if (friendDoc.exists()) {
                    const friend = friendDoc.data();
                    return {
                      id: friendDoc.id,
                      name: friend.name,
                      email: friend.email,
                      photoURL: friend.photoURL,
                    };
                  }
                  return null;
                })
              );
              setFriendsList(friendsData.filter(Boolean));
            }
          }

          // Fetch all activity
          const activityQuery = query(
            collection(db, 'tasks'),
            where('uid', '==', user.uid),
            where('completed', '==', true)
          );
          const activitySnap = await getDocs(activityQuery);
          const allActivityData = activitySnap.docs.map((doc) => ({
            id: doc.id,
            title: doc.data().title,
            completedAt: doc.data().completedAt,
            happiness: doc.data().happiness,
          }));

          // Sort by completion date
          allActivityData.sort(
            (a, b) =>
              new Date(b.completedAt).getTime() -
              new Date(a.completedAt).getTime()
          );

          setAllActivity(allActivityData);
          setRecentActivity(allActivityData.slice(0, 5));
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading || isLoading) {
    return (
      <PageContainer title='Loading...' description='Please wait'>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='400px'
        >
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!user || !userData) {
    return (
      <PageContainer title='Unauthorized' description='Access denied'>
        <Typography variant='h5' align='center'>
          Redirecting to login...
        </Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer title='Profile' description='View and manage your profile'>
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
                    `linear-gradient(45deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
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
                  src={user.photoURL || '/images/profile/user-1.jpg'}
                  alt={userData.name}
                  sx={{
                    width: 120,
                    height: 120,
                    border: '4px solid white',
                    boxShadow: 1,
                  }}
                />
                <Box sx={{ flex: 1, mb: 2 }}>
                  <Typography variant='h4' fontWeight='bold'>
                    {userData.name}
                  </Typography>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <IconMail size={16} />
                    <Typography variant='body2' color='text.secondary'>
                      {userData.email}
                    </Typography>
                    {userData.location && (
                      <>
                        <IconMapPin size={16} />
                        <Typography variant='body2' color='text.secondary'>
                          {userData.location}
                        </Typography>
                      </>
                    )}
                  </Stack>
                </Box>
                <Button
                  variant='contained'
                  startIcon={<IconEdit size={18} />}
                  onClick={() => router.push('/profile/account')}
                >
                  Edit Profile
                </Button>
              </Box>
            </Box>

            {/* Stats Row */}
            <Box sx={{ px: 3, py: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={3}>
                  <Box textAlign='center'>
                    <Typography variant='h4' fontWeight='bold' color='primary'>
                      {userData.stats?.tasksCompleted || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Tasks Completed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign='center'>
                    <Typography variant='h4' fontWeight='bold' color='primary'>
                      {userData.stats?.currentStreak || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Current Streak
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign='center'>
                    <Typography variant='h4' fontWeight='bold' color='primary'>
                      {userData.friends.length}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Friends
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box textAlign='center'>
                    <Typography variant='h4' fontWeight='bold' color='primary'>
                      {userData.stats?.averageHappiness || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Avg. Happiness
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label='profile tabs'
                variant='standard'
                sx={{
                  minHeight: 48,
                  '& .MuiTabs-flexContainer': {
                    borderBottom: 'none',
                  },
                }}
              >
                <Tab label='Overview' sx={{ minHeight: 48 }} />
                <Tab label='Activity' sx={{ minHeight: 48 }} />
                <Tab label='Friends' sx={{ minHeight: 48 }} />
              </Tabs>
            </Box>
          </DashboardCard>
        </Grid>

        {/* Tab Content */}
        <Grid item xs={12}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <DashboardCard title='About'>
                  <Typography variant='body1' paragraph>
                    {userData.bio}
                  </Typography>
                  <Stack spacing={2}>
                    <Box display='flex' alignItems='center' gap={1}>
                      <IconCalendar size={20} />
                      <Typography variant='body2'>
                        Joined{' '}
                        {new Date(userData.joinedDate!).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box display='flex' alignItems='center' gap={1}>
                      <IconUsers size={20} />
                      <Typography variant='body2'>
                        {userData.friends.length} Friends
                      </Typography>
                    </Box>
                  </Stack>
                </DashboardCard>
              </Grid>
              <Grid item xs={12} md={8}>
                <DashboardCard title='Recent Activity'>
                  <List>
                    {recentActivity.map((activity) => (
                      <ListItem key={activity.id}>
                        <ListItemText
                          primary={activity.title}
                          secondary={new Date(
                            activity.completedAt
                          ).toLocaleDateString()}
                        />
                        <Chip
                          label='Completed'
                          color='success'
                          size='small'
                          variant='outlined'
                        />
                      </ListItem>
                    ))}
                  </List>
                </DashboardCard>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <DashboardCard title='Activity History'>
              <List>
                {allActivity.map((activity) => (
                  <ListItem key={activity.id}>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <>
                          <Typography
                            component='span'
                            variant='body2'
                            color='text.secondary'
                          >
                            Completed on{' '}
                            {format(new Date(activity.completedAt), 'PPp')}
                          </Typography>
                          {activity.happiness && (
                            <Typography
                              component='span'
                              variant='body2'
                              color='text.secondary'
                              sx={{ ml: 2 }}
                            >
                              Happiness: {activity.happiness}/5
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <Chip
                      label='Completed'
                      color='success'
                      size='small'
                      variant='outlined'
                    />
                  </ListItem>
                ))}
                {allActivity.length === 0 && (
                  <Typography
                    color='text.secondary'
                    align='center'
                    sx={{ py: 3 }}
                  >
                    No completed tasks yet
                  </Typography>
                )}
              </List>
            </DashboardCard>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <DashboardCard title='Friends'>
              <List>
                {friendsList.map((friend) => (
                  <ListItem key={friend.id}>
                    <ListItemAvatar>
                      <Avatar
                        src={friend.photoURL || '/images/profile/user-1.jpg'}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={friend.name}
                      secondary={friend.email}
                    />
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={() => router.push(`/profile/${friend.id}`)}
                    >
                      View Profile
                    </Button>
                  </ListItem>
                ))}
                {friendsList.length === 0 && (
                  <Typography
                    color='text.secondary'
                    align='center'
                    sx={{ py: 3 }}
                  >
                    No friends added yet
                  </Typography>
                )}
              </List>
            </DashboardCard>
          </TabPanel>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default ProfilePage;
