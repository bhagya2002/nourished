"use client";
import {
  Grid,
  Box,
  Card,
  Stack,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleIcon from "@mui/icons-material/Google";
import { auth, provider, db } from "@/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Components
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import AuthLogin from "../auth/AuthLogin";

const Login2 = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleDelayedNavigation = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      router.push("/authentication/register");
      setLoading(false);
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Fetch ID Token
      const token = await user.getIdToken();

      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        throw new Error("User not found in database.");
      }

      // Store token in localStorage
      localStorage.setItem("authToken", token);

      // Redirect
      router.push("/dashboard");
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <PageContainer title="Nourished Login" description="Login to Nourished">
      <Box
        sx={{
          position: "relative",
          "&:before": {
            content: '""',
            background: "radial-gradient(#d2f1df, #d3d7fa, #bad8f4)",
            backgroundSize: "400% 400%",
            animation: "gradient 15s ease infinite",
            position: "absolute",
            height: "100%",
            width: "100%",
            opacity: "0.3",
          },
        }}
      >
        <Grid
          container
          spacing={0}
          justifyContent="center"
          sx={{ height: "100vh" }}
        >
          <Grid
            item
            xs={12}
            sm={12}
            lg={4}
            xl={3}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Card
              elevation={9}
              sx={{ p: 4, zIndex: 1, width: "100%", maxWidth: "500px" }}
            >
              <Box display="flex" alignItems="center" justifyContent="center">
                <Typography
                  variant="h1"
                  textAlign="center"
                  color="textPrimary"
                  mb={1}
                  fontWeight="700"
                >
                  Nourished
                </Typography>
              </Box>
              <AuthLogin
                subtext={
                  <Typography
                    variant="subtitle1"
                    textAlign="center"
                    color="textSecondary"
                    mb={1}
                  >
                    Wellness Made Simple
                  </Typography>
                }
                subtitle={
                  <Stack direction="column" spacing={2} mt={3}>
                    {/* Create an account */}
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Typography
                        color="textSecondary"
                        variant="h6"
                        fontWeight="500"
                      >
                        New to Nourished?
                      </Typography>
                      <Typography
                        component="a"
                        href="/authentication/register"
                        fontWeight="500"
                        onClick={handleDelayedNavigation}
                        sx={{
                          textDecoration: "none",
                          color: loading ? "grey" : "primary.main",
                          cursor: loading ? "default" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          "Create an account"
                        )}
                      </Typography>
                    </Stack>

                    {/* Google Sign-In */}
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<GoogleIcon />}
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                    >
                      {googleLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        "Sign in with Google"
                      )}
                    </Button>
                  </Stack>
                }
              />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Login2;
