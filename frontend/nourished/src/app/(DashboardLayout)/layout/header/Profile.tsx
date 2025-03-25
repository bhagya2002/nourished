import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import {
  Avatar,
  Box,
  Menu,
  Button,
  IconButton,
  MenuItem,
  ListItemIcon,
  Divider,
} from '@mui/material';
import { AccountCircle, Logout, PersonSearch } from '@mui/icons-material';
import UserSearchDialog from '../components/UserSearchDialog';

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
      localStorage.removeItem('authToken');
      router.push('/authentication/login');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <Box>
      <IconButton
        size='large'
        aria-label='show profile menu'
        color='inherit'
        aria-controls='profile-menu'
        aria-haspopup='true'
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src='/images/profile/user-1.jpg'
          alt='User Avatar'
          sx={{
            width: 35,
            height: 35,
          }}
        />
      </IconButton>

      {/* ------------------------------------------- */}
      {/* Profile Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id='profile-menu'
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: 'auto',
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
          <MenuItem sx={{ py: 1.5 }} onClick={() => { handleClose2(); router.push('/profile'); }}>
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            My Profile
          </MenuItem>
          <Divider />
          <MenuItem sx={{ py: 1.5 }} onClick={() => { handleClose2(); setFriendSearchOpen(true); }}>
            <ListItemIcon>
              <PersonSearch fontSize="small" />
            </ListItemIcon>
            Search Friends
          </MenuItem>
          <MenuItem sx={{ py: 1.5 }} onClick={() => { handleClose2(); handleLogout(); }}>
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
