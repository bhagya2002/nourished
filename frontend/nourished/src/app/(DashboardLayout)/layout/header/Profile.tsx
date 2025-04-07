import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useAuth } from "@/context/AuthContext";
import {
  Box,
  Menu,
  IconButton,
  MenuItem,
  ListItemIcon,
  Divider,
} from "@mui/material";
import { AccountCircle, Logout, PersonSearch } from "@mui/icons-material";
import UserSearchDialog from "../components/UserSearchDialog";
import DefaultAvatar from "../../components/shared/DefaultAvatar";

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
  const router = useRouter();
  const { user, token, loading, refreshToken } = useAuth();

  const [friendSearchOpen, setFriendSearchOpen] = useState(false);

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
            width: "auto",
          },
        }}
      >
        {/* <MenuItem onClick={() => { router.push('/profile'); handleClose2(); }}>
          <ListItemIcon>
            <IconUser width={20} />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { router.push('/profile/account'); handleClose2(); }}>
          <ListItemIcon>
            <IconMail width={20} />
          </ListItemIcon>
          <ListItemText>My Account</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { router.push('/tasks'); handleClose2(); }}>
          <ListItemIcon>
            <IconListCheck width={20} />
          </ListItemIcon>
          <ListItemText>My Tasks</ListItemText>
        </MenuItem> */}
        <Box>
          <MenuItem
            sx={{ py: 1.5 }}
            onClick={() => {
              handleClose2();
              router.push("/profile");
            }}
          >
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            My Profile
          </MenuItem>
          <Divider />
          {/**
           * FR20 - Friend.Invite - The system shall allow users to invite friends to join the
            platform. Invitations shall be sent securely using usernames or email
            addresses.
          */}
          <MenuItem
            sx={{ py: 1.5 }}
            onClick={() => {
              handleClose2();
              setFriendSearchOpen(true);
            }}
          >
            <ListItemIcon>
              <PersonSearch fontSize="small" />
            </ListItemIcon>
            Search Friends
          </MenuItem>
          {/**
           * FR5 - Request.Logout - The system shall allow users to log out securely at any time
            and redirect the user to the login screen.
          */}
          <MenuItem
            sx={{ py: 1.5 }}
            onClick={() => {
              handleClose2();
              handleLogout();
            }}
          >
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Box>
      </Menu>
      <UserSearchDialog
        open={friendSearchOpen}
        onClose={() => setFriendSearchOpen(false)}
      />
    </Box>
  );
};

export default Profile;
