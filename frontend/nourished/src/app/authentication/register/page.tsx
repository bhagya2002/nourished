"use client";
import {
  Grid,
  Box,
  Card,
  Typography,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleIcon from "@mui/icons-material/Google";
import { signInWithPopup } from "firebase/auth";
import { auth, provider, db } from "@/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Components
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import AuthRegister from "../auth/AuthRegister";

const Register2 = () => {
  const router = useRouter();
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
              <AuthRegister
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
                    {/* Already have an account? */}
                    <Stack direction="row" justifyContent="center" spacing={1}>
                      <Typography
                        color="textSecondary"
                        variant="h6"
                        fontWeight="400"
                      >
                        Already have an account?
                      </Typography>
                      <Typography
                        component={Link}
                        href="/authentication/login"
                        fontWeight="500"
                        sx={{
                          textDecoration: "none",
                          color: "primary.main",
                        }}
                      >
                        Sign In
                      </Typography>
                    </Stack>

                    {/* Google Sign-Up */}
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
                        "Sign up with Google"
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

export default Register2;
