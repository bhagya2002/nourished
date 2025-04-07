/**
 * FR1 - Request.Registration - The system shall provide an interface for new users to
  register using an email address, password, or Google Authentication. It
  shall validate the email address for uniqueness and ensure it adheres to
  proper email formatting standards. If the registration succeeds, the system
  shall securely store user information in the database and log the user into
  the application.
*/

"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  useTheme,
  Stack,
} from "@mui/material";
import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import {
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { IconMail, IconLock, IconUser } from "@tabler/icons-react";

interface AuthRegisterProps {
  title?: string;
  subtitle?: JSX.Element | JSX.Element[];
  subtext?: JSX.Element | JSX.Element[];
}

const AuthRegister: React.FC<AuthRegisterProps> = ({
  title,
  subtitle,
  subtext,
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPassword = (password: string) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { name, email, password } = formData;

    if (!name.trim()) return setError("Name is required.");
    if (!isValidEmail(email)) return setError("Invalid email format.");
    if (!isValidPassword(password))
      return setError(
        "Password must be at least 8 characters, contain a number and a special character."
      );

    try {
      setLoading(true);

      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        createdAt: new Date(),
        tasks: [],
        goals: [],
        friends: [],
        plantHealth: 3,
      });

      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {title && (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      )}
      {subtext}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              component="label"
              htmlFor="name"
              mb="5px"
            >
              Name
            </Typography>
            <CustomTextField
              id="name"
              variant="outlined"
              fullWidth
              placeholder="John Doe"
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconUser size={20} color={theme.palette.text.secondary} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: "10px",
                  "& .MuiOutlinedInput-input": {
                    py: 1.5,
                  },
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              component="label"
              htmlFor="email"
              mb="5px"
            >
              Email Address
            </Typography>
            <CustomTextField
              id="email"
              variant="outlined"
              fullWidth
              placeholder="your@email.com"
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconMail size={20} color={theme.palette.text.secondary} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: "10px",
                  "& .MuiOutlinedInput-input": {
                    py: 1.5,
                  },
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              component="label"
              htmlFor="password"
              mb="5px"
            >
              Password
            </Typography>
            <CustomTextField
              id="password"
              type="password"
              variant="outlined"
              fullWidth
              placeholder="********"
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconLock size={20} color={theme.palette.text.secondary} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: "10px",
                  "& .MuiOutlinedInput-input": {
                    py: 1.5,
                  },
                },
              }}
            />
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        <Box mt={3}>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{
              borderRadius: "30px",
              py: 1.2,
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              "&:hover": {
                background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign Up"
            )}
          </Button>
        </Box>
      </Box>

      {subtitle}
    </>
  );
};

export default AuthRegister;
