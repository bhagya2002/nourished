"use client";

import { useState, useEffect } from "react";
import {
  Grid,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
} from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/context/AuthContext";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { IconLock, IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

const AccountPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    isPrivate: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/authentication/login");
      return;
    }

    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setFormData((prev) => ({
              ...prev,
              name: data.name || "",
              email: user.email || "",
              location: data.location || "",
              bio: data.bio || "",
              isPrivate: data.isPrivate || false,
            }));
          }
        } catch (error) {
          setError("Failed to load user data");
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

    setError(null);
    setSuccess(null);
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));

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
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        bio: formData.bio,
        isPrivate: formData.isPrivate,
      });
      setSuccess("Profile updated successfully");
    } catch (error) {
      setError("Failed to update profile");
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
      const credential = EmailAuthProvider.credential(
        user.email || "",
        formData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      await updateEmail(user, formData.email);
      await updateDoc(doc(db, "users", user.uid), {
        email: formData.email,
      });

      setSuccess("Email updated successfully");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update email"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.currentPassword) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const credential = EmailAuthProvider.credential(
        user.email || "",
        formData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, formData.newPassword);
      setSuccess("Password updated successfully");

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update password"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <PageContainer title="Loading..." description="Please wait">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Account Settings"
      description="Manage your account settings"
    >
      <Box sx={{ mb: 3 }}>
        <Button
          variant="text"
          startIcon={<IconArrowLeft size={18} />}
          onClick={() => router.push("/profile")}
        >
          Back to Profile
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <form onSubmit={handleProfileUpdate}>
            <DashboardCard title="Profile Settings">
              <Stack spacing={3}>
                <TextField
                  label="Display Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />

                <TextField
                  label="Bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  multiline
                  rows={4}
                  fullWidth
                />

                <Divider />

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Privacy Settings
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isPrivate}
                        onChange={handleSwitchChange}
                        name="isPrivate"
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">Private Account</Typography>
                        <Typography variant="body2" color="text.secondary">
                          When enabled, only approved users can follow you
                        </Typography>
                      </Box>
                    }
                  />
                </Box>

                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSaving}
                  startIcon={
                    isSaving ? <CircularProgress size={20} /> : undefined
                  }
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </Stack>
            </DashboardCard>
          </form>
        </Grid>

        {/**
         * FR3 - Change.Password - The system shall allow users to securely change their
          password by verifying their current password. It shall hash and store the
          new password in the database after validation.
        */}
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <form onSubmit={handlePasswordUpdate}>
              <DashboardCard
                title="Password Settings"
                action={<IconLock size={20} />}
              >
                <Stack spacing={3}>
                  <TextField
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />

                  <TextField
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />

                  <TextField
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />

                  <Button
                    type="submit"
                    variant="contained"
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

      <Box mt={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
      </Box>
    </PageContainer>
  );
};

export default AccountPage;
