"use client";
import {
  Grid,
  Box,
  Card,
  Typography,
  Stack,
  Button,
  CircularProgress,
  useTheme,
  Avatar,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleIcon from "@mui/icons-material/Google";
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "@/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { IconLeaf } from "@tabler/icons-react";

// Components
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import AuthRegister from "../auth/AuthRegister";

const Register2 = () => {
  const router = useRouter();
  const theme = useTheme();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create user record in Firestore
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || "New User",
          email: user.email,
          createdAt: new Date(),
          tasks: [],
          goals: [],
          friends: [],
          plantHealth: 2,
        });
      }

      console.log("User signed in:", user);
      router.push("/dashboard");
    } catch (error) {
      console.error("Google sign-in error:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <PageContainer
      title="Nourished Register"
      description="Register for Nourished"
    >
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
              sx={{ 
                p: 4, 
                zIndex: 1, 
                width: "100%", 
                maxWidth: "500px",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
                position: "relative",
                overflow: "hidden",
                "&:before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "6px",
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                }
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" mb={4}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.light})`,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                    mb: 2,
                  }}
                >
                  <IconLeaf size={40} />
                </Avatar>
                <Typography
                  variant="h2"
                  textAlign="center"
                  color="textPrimary"
                  fontWeight="700"
                  sx={{
                    backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    letterSpacing: "0.5px",
                  }}
                >
                  Nourished
                </Typography>
              </Box>
              
              <AuthRegister
                subtext={
                  <Typography
                    variant="subtitle1"
                    textAlign="center"
                    color="textSecondary"
                    mb={3}
                  >
                    Wellness Made Simple
                  </Typography>
                }
                subtitle={
                  <Stack direction="row" justifyContent="center" spacing={1} mt={3}>
                    <Typography
                      color="textSecondary"
                      variant="body1"
                      fontWeight="500"
                    >
                      Already have an account?
                    </Typography>
                    <Typography
                      component={Link}
                      href="/authentication/login"
                      fontWeight="500"
                      sx={{
                        color: theme.palette.primary.main,
                        textDecoration: "none",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Sign In
                    </Typography>
                  </Stack>
                }
              />
              
              <Box mt={3} textAlign="center">
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={
                    googleLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <GoogleIcon />
                    )
                  }
                  disabled={googleLoading}
                  onClick={handleGoogleSignIn}
                  sx={{
                    borderRadius: "30px",
                    textTransform: "none",
                    py: 1.2,
                  }}
                >
                  Sign Up With Google
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Register2;
