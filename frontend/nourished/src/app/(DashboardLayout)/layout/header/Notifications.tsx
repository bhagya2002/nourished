import React, { useState } from 'react';
import {
  Menu,
  Badge,
  Box,
  IconButton,
} from '@mui/material';
import { IconBellRinging } from '@tabler/icons-react';

const Notifications = () => {
  const [notificationAnchorEl, setNotificationAnchorEl] = React.useState<null | HTMLElement>(null);
  const notificationOpen = Boolean(notificationAnchorEl);
  const [notifications, setNotifications] = useState([]);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  return (
    <Box>
      {/* Notification button */}
      <IconButton
        size='large'
        aria-label='notifications'
        id='notifications-button'
        color='primary'
        aria-controls={notificationOpen ? 'notifications-menu' : undefined}
        aria-expanded={notificationOpen ? 'true' : undefined}
        aria-haspopup='true'
        onClick={handleNotificationClick}
      >
        <Badge variant='dot' color='primary'>
          <IconBellRinging size='21' stroke='1.5' />
        </Badge>
      </IconButton>

      {/* Notification menu */}
      <Menu
        sx={{ 
          mr: 7,
        }}
        id='notifications-menu'
        MenuListProps={{ 'aria-labelledby': 'notifications-button' }}
        anchorEl={notificationAnchorEl}
        open={notificationOpen}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            style: {
              maxHeight: 64 * 4.5,
              maxWidth: 320,
            }
          }
        }}>
        {notifications.length === 0 && (
          <Box sx={{ py: 1, px: 2 }}>
            <Box sx={{ mb: 1 }}>Empty Notificationsaaasdasdasd asdasd asdasdasd asdasdasd asdasd asdasd</Box>
          </Box>
        )}
      </Menu>
    </Box>
  );
};

export default Notifications;