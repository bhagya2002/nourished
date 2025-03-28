import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Menu, Badge, Box, IconButton, ListSubheader } from "@mui/material";
import { IconBellRinging } from "@tabler/icons-react";
import Groups2Icon from "@mui/icons-material/Groups2";
import { Cancel, CheckCircle, Handshake } from "@mui/icons-material";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

export type Invitation = {
  id: string;
  createdAt: string;
  invitee: string;
  inviter: string;
  inviterName: string;
  targetId: string;
  targetTitle: string;
  type: number;
};

const Notifications = () => {
  const router = useRouter();
  const { user, token, loading, refreshToken } = useAuth();
  const pathname = usePathname();

  const [notificationAnchorEl, setNotificationAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const notificationOpen = Boolean(notificationAnchorEl);
  const [notifications, setNotifications] = useState<Invitation[]>([]);

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    console.log("Notifications: ", notifications);
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const fetchInvites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUserInvites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
        }),
      });
      if (!response.ok) throw new Error("Failed to fetch friends");
      const invitesData = await response.json();
      if (invitesData && invitesData.data && Array.isArray(invitesData.data)) {
        setNotifications(invitesData.data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error(error);
      setNotifications([]);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    console.log("Accepted Invitation");
    const invitation = notifications.find((invite) => invite.id === inviteId);
    if (!invitation) return;
    try {
      const acceptInviteResponse = await fetch(`${API_BASE_URL}/acceptInvite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          data: invitation,
        }),
      });
      if (!acceptInviteResponse.ok) throw new Error("Failed to accept invite");
      // Success, remove the invite from the list
      setNotifications((prevInvites) =>
        prevInvites.filter((invite) => invite.id !== inviteId)
      );
      if (invitation.type === 1 && pathname === "/goals") {
        location.reload();
      } else if (invitation.type === 0 && pathname === '/profile') {
        location.reload();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    console.log("Declined Invitation");
    try {
      const declineInviteResponse = await fetch(
        `${API_BASE_URL}/declineInvite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            data: {
              id: inviteId,
            },
          }),
        }
      );
      if (!declineInviteResponse.ok)
        throw new Error("Failed to decline invite");
      // Success, remove the invite from the list
      setNotifications((prevInvites) =>
        prevInvites.filter((invite) => invite.id !== inviteId)
      );
    } catch (error) {
      console.error(error);
    }
  };

  // Redirects to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/authentication/login');
    }
  }, [loading, user, router]);

  // Fetches notifications while initializing the page
  useEffect(() => {
    if (user && token) {
      fetchInvites();
    }
  }, [user, token]);

  return (
    <Box>
      {/* Notification button */}
      <IconButton
        size="large"
        aria-label="notifications"
        id="notifications-button"
        color="primary"
        aria-controls={notificationOpen ? "notifications-menu" : undefined}
        aria-expanded={notificationOpen ? "true" : undefined}
        aria-haspopup="true"
        onClick={handleNotificationClick}
      >
        <Badge
          variant="dot"
          color="primary"
          invisible={notifications.length === 0}
        >
          <IconBellRinging size="21" stroke="1.5" />
        </Badge>
      </IconButton>

      {/* Notification menu */}
      <Menu
        sx={{
          mr: 7,
        }}
        id="notifications-menu"
        MenuListProps={{ "aria-labelledby": "notifications-button" }}
        anchorEl={notificationAnchorEl}
        open={notificationOpen}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            style: {
              maxHeight: 64 * 4.5,
              maxWidth: 320,
            },
          },
        }}
      >
        <ListSubheader sx={{ fontWeight: "bold", userSelect: "none" }}>
          {notifications.length === 0 && "No Notifications"}
        </ListSubheader>
        {/* For Friend Requests */}
        <ListSubheader sx={{ fontWeight: "bold", userSelect: "none" }}>
          {notifications.filter((notification) => notification.type === 0)
            .length > 0 && "Friend Requests"}
        </ListSubheader>
        {notifications.length > 0 && notifications.filter(notification => notification.type === 0).map((notification) => (
          <Box
            key={notification.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
          >
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Handshake />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ fontWeight: 'bold' }}>{notification.inviterName}</Box>
              {/* <Box sx={{ fontSize: 14, color: 'grey.600' }}>follows you, follow back!</Box> */}
            </Box>
            <Box sx={{ ml: 2, display: 'flex', flexDirection: 'row', gap: 1 }}>
              <CheckCircle color='primary' onClick={() => handleAcceptInvite(notification.id)}
                sx={{
                  cursor: 'pointer',
                  opacity: 0.3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    opacity: 1,
                  }
                }}
              />
              <Cancel color='error' onClick={() => handleDeclineInvite(notification.id)}
                sx={{
                  cursor: 'pointer',
                  opacity: 0.2,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    opacity: 1,
                  }
                }}
              />
            </Box>
          </Box>
        ))}

        {/* For Challenges Invites */}
        <ListSubheader sx={{ fontWeight: "bold", userSelect: "none" }}>
          {notifications.filter((notification) => notification.type === 1)
            .length > 0 && "Challenges Invites"}
        </ListSubheader>
        {notifications.length > 0 && notifications.filter(notification => notification.type === 1).map((notification) => (
          <Box
            key={notification.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'grey.100',
              },
            }}
          >
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Groups2Icon />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ fontWeight: 'bold' }}>{notification.inviterName}</Box>
              <Box sx={{ fontSize: 14, color: 'grey.600' }}>{notification.targetTitle}</Box>
            </Box>
            <Box sx={{ ml: 2, display: 'flex', flexDirection: 'row', gap: 1 }}>
              <CheckCircle color='primary' onClick={() => handleAcceptInvite(notification.id)}
                sx={{
                  cursor: 'pointer',
                  opacity: 0.3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    opacity: 1,
                  }
                }}
              />
              <Cancel color='error' onClick={() => handleDeclineInvite(notification.id)}
                sx={{
                  cursor: 'pointer',
                  opacity: 0.2,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    opacity: 1,
                  }
                }}
              />
            </Box>
          </Box>
        ))}
      </Menu>
    </Box>
  );
};

export default Notifications;
