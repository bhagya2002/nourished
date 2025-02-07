'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomTextField from '@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

interface LoginProps {
  title?: string;
  subtitle?: JSX.Element | JSX.Element[];
  subtext?: JSX.Element | JSX.Element[];
}

const AuthLogin: React.FC<LoginProps> = ({ title, subtitle, subtext }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User not found in database.');
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err: any) {
      setError('Invalid email or password.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {title && (
        <Typography fontWeight='700' variant='h2' mb={1}>
          {title}
        </Typography>
      )}
      {subtext}

      <Box component='form' onSubmit={handleLogin}>
        <Stack>
          <Box>
            <Typography
              variant='subtitle1'
              fontWeight={600}
              component='label'
              htmlFor='email'
              mb='5px'
            >
              Email Address
            </Typography>
            <CustomTextField
              id='email'
              variant='outlined'
              fullWidth
              placeholder='JohnDoe@email.com'
              onChange={handleChange}
            />
          </Box>
          <Box mt='25px'>
            <Typography
              variant='subtitle1'
              fontWeight={600}
              component='label'
              htmlFor='password'
              mb='5px'
            >
              Password
            </Typography>
            <CustomTextField
              id='password'
              type='password'
              variant='outlined'
              fullWidth
              placeholder='********'
              onChange={handleChange}
            />
          </Box>
        </Stack>

        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Box mt={2}>
          <Button
            type='submit'
            color='primary'
            variant='contained'
            size='large'
            fullWidth
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color='inherit' />
            ) : (
              'Sign In'
            )}
          </Button>
        </Box>
      </Box>

      {subtitle}
    </>
  );
};

export default AuthLogin;
