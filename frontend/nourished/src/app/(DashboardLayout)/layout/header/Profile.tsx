import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useAuth } from "@/context/AuthContext";
import { Box, Menu, Button, IconButton } from "@mui/material";
import DefaultAvatar from "../../components/shared/DefaultAvatar";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const router = useRouter();
  const { user } = useAuth();

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      router.push("/authentication/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show profile menu"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        onClick={handleClick2}
        sx={{
          ...(typeof anchorEl2 === "object" && {
            color: "primary.main",
          }),
        }}
      >
        <DefaultAvatar name={user?.displayName || undefined} />
      </IconButton>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        sx={{
          "& .MuiMenu-paper": {
            width: "200px",
            mt: 1.5,
          },
        }}
      >
        <Box>
          <Box sx={{ p: 2, pt: 0 }}>
            <Button
              color="primary"
              variant="outlined"
              fullWidth
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

export default Profile;
