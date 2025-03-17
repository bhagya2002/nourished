'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Avatar,
} from '@mui/material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { IconCamera, IconLock, IconMail } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';

const AccountPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setFormData((prev) => ({
              ...prev,
              name: data.name || '',
              email: user.email || '',
              location: data.location || '',
              bio: data.bio || '',
            }));
          }
        } catch (error) {
          setError('Failed to load user data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear any previous error/success messages
    setError(null);
    setSuccess(null);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        bio: formData.bio,
      });
      setSuccess('Profile updated successfully');
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.currentPassword) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email || '',
        formData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, formData.email);
      await updateDoc(doc(db, 'users', user.uid), {
        email: formData.email,
      });

      setSuccess('Email updated successfully');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update email'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.currentPassword) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email || '',
        formData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, formData.newPassword);
      setSuccess('Password updated successfully');

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to update password'
      );
    } finally {
      setIsSaving(false);
    }
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

  return (
    <PageContainer
      title='Account Settings'
      description='Manage your account settings'
    >
      <Grid container spacing={3}>
        {/* Profile Settings */}
        {/* <Grid item xs={12} md={6}>
          <form onSubmit={handleProfileUpdate}>
            <DashboardCard title='Profile Settings'>
              <Stack spacing={3}>
                <Box display='flex' alignItems='center' gap={2}>
                  <Avatar
                    src={user?.photoURL || '/images/profile/user-1.jpg'}
                    sx={{ width: 100, height: 100 }}
                  />
                  <Box>
                    <Typography variant='subtitle1' gutterBottom>
                      Profile Picture
                    </Typography>
                    <Button
                      variant='outlined'
                      startIcon={<IconCamera size={18} />}
                      size='small'
                    >
                      Change Avatar
                    </Button>
                  </Box>
                </Box>

                <TextField
                  label='Display Name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />

                <TextField
                  label='Bio'
                  name='bio'
                  value={formData.bio}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  fullWidth
                />

                <Button
                  type='submit'
                  variant='contained'
                  disabled={isSaving}
                  fullWidth
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Stack>
            </DashboardCard>
          </form>
        </Grid> */}

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            {/* Email Settings */}
            {/* <form onSubmit={handleEmailUpdate}>
              <DashboardCard
                title='Email Settings'
                action={<IconMail size={20} />}
              >
                <Stack spacing={3}>
                  <TextField
                    label='Email Address'
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />

                  <TextField
                    label='Current Password'
                    name='currentPassword'
                    type='password'
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />

                  <Button
                    type='submit'
                    variant='contained'
                    disabled={isSaving}
                    fullWidth
                  >
                    Update Email
                  </Button>
                </Stack>
              </DashboardCard>
            </form> */}

            {/* Password Settings */}
            <form onSubmit={handlePasswordUpdate}>
              <DashboardCard
                title='Password Settings'
                action={<IconLock size={20} />}
              >
                <Stack spacing={3}>
                  <TextField
                    label='Current Password'
                    name='currentPassword'
                    type='password'
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />

                  <TextField
                    label='New Password'
                    name='newPassword'
                    type='password'
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />

                  <TextField
                    label='Confirm New Password'
                    name='confirmPassword'
                    type='password'
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />

                  <Button
                    type='submit'
                    variant='contained'
                    disabled={isSaving}
                    fullWidth
                  >
                    Update Password
                  </Button>
                </Stack>
              </DashboardCard>
            </form>
          </Stack>
        </Grid>
      </Grid>

      {/* Error/Success Messages */}
      <Box mt={3}>
        {error && (
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity='success' onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
      </Box>
    </PageContainer>
  );
};

export default AccountPage;
