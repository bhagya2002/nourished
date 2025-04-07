/**
 * FR2 - Request.Login - The system shall allow users to enter their email and
  password. It shall validate the provided credentials against the stored
  records. If the credentials match, the user will gain access to the system;
  otherwise, an error message will be displayed.
 * FR4 - Login.Status - The system shall maintain a logged-in session for 24 hours by
  storing session data securely using local storage. It shall prompt the user to
  log in again after the session expires.
*/

"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  InputAdornment,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import {
  signInWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import { IconMail, IconLock } from "@tabler/icons-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

interface LoginProps {
  title?: string;
  subtitle?: JSX.Element | JSX.Element[];
  subtext?: JSX.Element | JSX.Element[];
}

const AuthLogin: React.FC<LoginProps> = ({ title, subtitle, subtext }) => {
  const router = useRouter();
  const theme = useTheme();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      const token = await user.getIdToken();

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        throw new Error("User not found in database.");
      }

      localStorage.setItem("authToken", token);

      if (!user.displayName) {
        const fetchUserInfo = await fetch(`${API_BASE_URL}/userInfo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        if (!fetchUserInfo.ok) throw new Error("Failed to fetch userInfo");
        const userData = await fetchUserInfo.json();
        if (userData && userData.data) {
          await updateProfile(user, { displayName: userData.data.name });
        }
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
      console.error("Login error:", err);
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

      <Box component="form" onSubmit={handleLogin}>
        <Stack spacing={3}>
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
              "Sign In"
            )}
          </Button>
        </Box>
      </Box>

      {subtitle}
    </>
  );
};

export default AuthLogin;
