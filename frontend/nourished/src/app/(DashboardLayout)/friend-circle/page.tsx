"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageContainer from "../components/container/PageContainer";
import { Goal } from "../goals/page"
import { Fab, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Card, CardContent, Typography, List, ListItem, IconButton, CardActions, CardHeader, Avatar, Select, SelectChangeEvent, MenuItem, InputLabel, FormControl, Alert, Snackbar, AlertColor } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

// Define a type for the posts
export type Post = {
  id: string;
  name: string;
  email: string;
  content: string;
  goal: string;
  createdAt: string;
  likes: number;
  comments: string[];  // Assuming comments are just strings for simplicity
};

export default function FriendCirclePage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [toast, setToast] = useState({ open: false, message: 'nothing', severity: 'info' });
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);  // Use the Post type for the posts state
  const [postContent, setPostContent] = useState('');
  const [postGoalLinkId, setPostGoalLinkId] = useState("");
  const [validationError, setValidationError] = useState("");

  const [goals, setGoals] = useState<Goal[]>([]);

  // Redirects to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/authentication/login");
    }
  }, [loading, user, router]);

  // Fetches posts while initializing the posts page
  useEffect(() => {
    if (user && token) {
      fetchGoals();
    }
  }, [user, token]);

  // Fetches user's goals from the database to populate the list
  const fetchGoals = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUserGoals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to fetch goals");
      const goalsData = await response.json();
      setGoals(goalsData);
    } catch (error) {
      console.error("Error fetching goals:", error);
      setToast({ open: true, message: 'Failed to fetch goals', severity: 'error' });
    }
  };

  const handleAddPostClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handlePost = () => {
    if (postContent.trim() && user && token) {
      const newPost: Post = {
        id: "",
        name: user.displayName || "",
        email: user.email || "",
        content: postContent,
        goal: postGoalLinkId,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: []
      };
      setPosts(prevPosts => [...prevPosts, newPost]);
      setOpen(false);
      setPostContent('');
    }
  };

  // Handle closing the toast box
  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  return (
    <PageContainer title="Friend Circle" description="What are your friends doing?">
      <h2 style={{ padding: "0 16px" }}>Friend Circle</h2>

      {/* popup toast message */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleToastClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} sx={{ '&.MuiSnackbar-root': { bottom: 88, left: { lg: 270 + 16 } } }}>
        <Alert onClose={handleToastClose} severity={toast.severity as AlertColor} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Fab color="primary" onClick={handleAddPostClick} aria-label="Add Post">
          <AddIcon />
        </Fab>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create a New Post</DialogTitle>
        <DialogContent dividers>
          {validationError && <Alert severity="error" style={{ margin: '0px' }}>{validationError}</Alert>}
          <TextField
            autoFocus
            multiline
            rows={4}
            margin='normal'
            label="What's on your mind?"
            type="text"
            fullWidth
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            size="small"
          />
          <FormControl fullWidth margin='normal'>
            <InputLabel id='link-select-label' size='small'>For which goal?</InputLabel>
            <Select labelId='link-select-label' id='link-select' label="For which goal?"
              value={postGoalLinkId} onChange={(e: SelectChangeEvent) => setPostGoalLinkId(e.target.value)} size='small'>
              <MenuItem value={""}>None</MenuItem>
              {goals.map((goal, index) => (
                <MenuItem key={index} value={goal.id}>{goal.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant='contained' onClick={handlePost}>Post</Button>
        </DialogActions>
      </Dialog>

      <List sx={{ width: '100%' }}>
        {posts.map((post, index) => (
          <ListItem key={index} sx={{ display: 'block' }}>
            <Card sx={{ position: 'relative', marginBottom: 2 }}>
              <CardHeader
                avatar={
                  <Avatar>
                    {post.name.charAt(0)}
                  </Avatar>
                }
                title={post.name}
                subheader={post.createdAt}
              />
              <CardContent>
                <Typography variant="body1">{post.content}</Typography>
              </CardContent>
              <CardActions disableSpacing sx={{ justifyContent: 'flex-end' }}>
                <IconButton onClick={() => console.log('Like post id:', post.id)} color="primary">
                  <FavoriteBorderIcon />
                </IconButton>
                <IconButton onClick={() => console.log('Comment on post id:', post.id)} color="primary">
                  <CommentOutlinedIcon />
                </IconButton>
              </CardActions>
            </Card>
          </ListItem>
        ))}
      </List>
    </PageContainer>
  );
}