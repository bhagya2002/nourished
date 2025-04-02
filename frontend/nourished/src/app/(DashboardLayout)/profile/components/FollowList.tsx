'use client';
import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import DefaultAvatar from '../../components/shared/DefaultAvatar';

interface FollowData {
  id: string;
  name: string;  // Changed from displayName to name
  photoURL?: string;
}

interface FollowListProps {
  followers: FollowData[];
  followees: FollowData[];
}

const FollowSection = ({ title, users }: { title: string; users: FollowData[] }) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        {title} <Typography component="span" color="text.secondary">({users.length})</Typography>
      </Typography>
      <List>
        {users.map((user) => (
          <ListItem key={user.id}>
            <ListItemAvatar>
              {user.photoURL ? (
                <Avatar src={user.photoURL} />
              ) : (
                <DefaultAvatar name={user.name} />
              )}
            </ListItemAvatar>
            <ListItemText primary={user.name} />
          </ListItem>
        ))}
        {users.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            Connect with others to see them here
          </Typography>
        )}
      </List>
    </Box>
  );
};

const FollowList: React.FC<FollowListProps> = ({ followers, followees }) => {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3,
            height: '100%',
            bgcolor: alpha(theme.palette.background.paper, 0.1),
          }}
        >
          <FollowSection title="Followers" users={followers} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3,
            height: '100%',
            bgcolor: alpha(theme.palette.background.paper, 0.1),
          }}
        >
          <FollowSection title="Following" users={followees} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default FollowList; 