'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
    friends: string[];
  } | null>(null);
  const [friendCount, setFriendCount] = useState(0);
  const [users, setUsers] = useState<
    { id: string; name: string; email: string; friends?: string[] }[]
  >([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  //  Redirect if user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  //  Fetch Firestore user data only if logged in
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserData({
            id: user.uid,
            name: userData.name,
            email: userData.email,
            friends: userData.friends || [],
          });
          setFriendCount(userData.friends ? userData.friends.length : 0);
        }
      }
    };

    fetchUserData();
  }, [user]);

  //  Handle Email Change
  const handleEmailChange = async () => {
    if (newEmail && user) {
      try {
        await updateEmail(user, newEmail);
        await updateDoc(doc(db, 'users', user.uid), { email: newEmail });
        alert('Email updated successfully!');
        setOpenEmailDialog(false);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : 'An unknown error occurred'
        );
      }
    }
  };

  // Handle Password Change
  const handlePasswordChange = async () => {
    if (!user) return alert('User not authenticated');
    if (newPassword && currentPassword) {
      try {
        const credential = EmailAuthProvider.credential(
          user.email || '',
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        alert('Password updated successfully!');
        setOpenPasswordDialog(false);
      } catch (error) {
        alert(
          error instanceof Error ? error.message : 'An unknown error occurred'
        );
      }
    }
  };

  // Fetch users to add as friends
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as { id: string; name: string; email: string; friends?: string[] }[];

      setUsers(usersList.filter((u) => u.id !== user?.uid));
      setOpenDialog(true);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Ensure authentication is initialized before rendering
  if (loading) {
    return (
      <PageContainer title='Loading...' description='Please wait'>
        <Typography variant='h5' align='center'>
          <CircularProgress />
        </Typography>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer title='Unauthorized' description='Access denied'>
        <Typography variant='h5' align='center'>
          Redirecting to login...
        </Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer title='My Account' description='Manage your profile'>
      <DashboardCard title='My Account'>
        {userData ? (
          <>
            <Typography variant='h5'>Hi, {userData.name}</Typography>
            <Typography variant='subtitle1'>Friends: {friendCount}</Typography>

            <Button
              variant='contained'
              color='primary'
              onClick={() => setOpenEmailDialog(true)}
            >
              Change Email
            </Button>

            <Button
              variant='contained'
              color='secondary'
              onClick={() => setOpenPasswordDialog(true)}
            >
              Change Password
            </Button>

            <Button variant='outlined' color='primary' onClick={fetchUsers}>
              Add Friend
            </Button>
          </>
        ) : (
          <Typography>Loading...</Typography>
        )}
      </DashboardCard>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Friend</DialogTitle>
        <DialogContent>
          {users.length > 0 ? (
            <List>
              {users.map((u) => (
                <ListItem key={u.id}>
                  <ListItemText primary={u.name} secondary={u.email} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge='end'
                      onClick={() => console.log('Add Friend', u.id)}
                    >
                      <AddIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No Users found</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default ProfilePage;
