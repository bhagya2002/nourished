"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageContainer from "../components/container/PageContainer";
import { Goal } from "../goals/page"
import { Fab, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Card, CardContent, Typography, List, ListItem, IconButton, CardActions, CardHeader, Avatar, Select, SelectChangeEvent, MenuItem, InputLabel, FormControl, Alert, Snackbar, AlertColor, Collapse, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';
import Badge, { BadgeProps } from '@mui/material/Badge';
import AddIcon from '@mui/icons-material/Add';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import { Comment, Delete, Edit, Favorite, ModeCommentOutlined, MoreVert } from '@mui/icons-material';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

export type Comment = {
  id: string;
  name: string;
  email: string;
  comment: string;
  createdAt: string;
}

// Define a type for the posts
export type Post = {
  id: string;
  name: string;
  email: string;
  content: string;
  goal: Goal;
  createdAt: string;
  likes: string[];
  comments: Comment[];
};

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -4,
    top: 0,
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}));

export default function FriendCirclePage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [toast, setToast] = useState({ open: false, message: 'nothing', severity: 'info' });
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);  // Use the Post type for the posts state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const postMoreOpen = Boolean(anchorEl);
  const [postContent, setPostContent] = useState('');
  const [postGoalLinkId, setPostGoalLinkId] = useState('');
  const [validationError, setValidationError] = useState('');

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
      fetchPosts();
      fetchGoals();
    }
  }, [user, token]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/getUserPosts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error("Failed to fetch posts");
      const postsData = await response.json();
      // Ensure postsData is an array
      const postsArray = Array.isArray(postsData) ? postsData :
        (postsData && Array.isArray(postsData.data)) ? postsData.data : [];
      setPosts(postsArray);
      console.log(postsArray);
      setToast({ open: true, message: 'Posts fetched successfully', severity: 'success' })
    } catch (error) {
      console.error("Error fetching posts:", error);
      setToast({ open: true, message: 'Failed to fetch posts', severity: 'error' });
    }
  }

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
      // Ensure goalsData is an array
      const goalsArray = Array.isArray(goalsData) ? goalsData :
        (goalsData && Array.isArray(goalsData.data)) ? goalsData.data : [];
      setGoals(goalsArray);
    } catch (error) {
      console.error("Error fetching goals:", error);
      setToast({ open: true, message: 'Failed to fetch goals', severity: 'error' });
    }
  };

  const handleAddPostClick = () => {
    setIsEditing(false);
    setPostContent('');
    setPostGoalLinkId('');
    setEditingPostId('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setValidationError('');
  };

  const handlePost = async () => {
    if (!postContent.trim()) {
      setValidationError('Post content must be filled out');
      return;
    }
    if (!(user && token)) {
      router.push("/authentication/login");
      return;
    }

    if (!isEditing) {
      // create a new post in the database
      const postCreatedAt = new Date().toISOString();
      try {
        const response = await fetch(`${API_BASE_URL}/createPost`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            post: {
              name: user.displayName || "",
              email: user.email || "",
              content: postContent,
              goalId: postGoalLinkId,
              createdAt: postCreatedAt,
              likes: [],
              comments: []
            }
          }),
        });
        if (!response.ok) throw new Error("Failed to create post");
        const postData = await response.json();
        if (!(postData && postData.data)) {
          throw new Error("Failed to create post");
        }
        console.log(postData.data.post);
        setPosts(prevPosts => [...prevPosts, postData.data.post]);
        setToast({ open: true, message: 'Post created successfully', severity: 'success' })
      } catch (error) {
        console.error("Error creating post:", error);
        setToast({ open: true, message: 'Failed to create post', severity: 'error' });
      }
      setOpen(false);
      setPostContent('');
      setPostGoalLinkId('');
    } else {
      // update an existing post in the database
      try {
        const updateField = async (field: string, value: string) => {
          const response = await fetch(`${API_BASE_URL}/editPost`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token,
              postId: editingPostId,
              fieldToChange: field,
              newValue: value,
            }),
          });
        }

        await Promise.all([
          updateField('content', postContent),
          updateField('goalId', postGoalLinkId),
        ]);
        // Update the post Array
        const updatedPosts = posts.map((post) => {
          if (post.id === editingPostId) {
            return {
              ...post,
              content: postContent,
              goal: goals.find((goal) => goal.id === postGoalLinkId) || post.goal,
            };
          }
          return post;
        });
        setPosts(updatedPosts);
        setToast({ open: true, message: 'Post updated successfully', severity: 'success' })
      } catch (error) {
        console.error("Error updating goal:", error);
        setToast({ open: true, message: 'Failed to update goal', severity: 'error' });
      }
      setOpen(false);
      setPostContent('');
      setPostGoalLinkId('');
      setEditingPostId('');
    };
  }

  // Handle closing the toast box
  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  const handlePostMoreClick = (event: React.MouseEvent<HTMLButtonElement>, post: Post) => {
    console.log(post);
    setAnchorEl(event.currentTarget);
    setPostContent(post.content);
    setPostGoalLinkId(post.goal?.id || '');
    setEditingPostId(post.id);
  };

  const handlePostMoreClose = () => {
    setAnchorEl(null);
  };

  const handleEditPostClick = () => {
    setIsEditing(true);
    setOpen(true);
  }

  const handleDeletePostClick = async () => {
    if (!user || !token) {
      router.push("/authentication/login");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/deletePost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, postId: editingPostId }),
      });
      if (!response.ok) throw new Error("Failed to delete post");
      setPosts(prevPosts => prevPosts.filter(post => post.id !== editingPostId));
      setToast({ open: true, message: 'Post deleted successfully', severity: 'success' })
    } catch (error) {
      console.error("Error deleting post:", error);
      setToast({ open: true, message: 'Failed to delete post', severity: 'error' });
    }
    setPostContent('');
    setPostGoalLinkId('');
    setEditingPostId('');
  }

  const handlePostLikeClick = async (postId: string) => {
    if (!user || !token) {
      router.push("/authentication/login");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/likePost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, postId }),
      });
      if (!response.ok) throw new Error("Failed to like/unlike post");
      const updatedPosts = posts.map((post) => {
        if (post.id === postId) {
          if (post.likes.includes(user.uid)) {
            return {
              ...post,
              likes: post.likes.filter(uid => uid !== user.uid),
            };
          } else {
            return {
              ...post,
              likes: [...post.likes, user.uid],
            };
          }
        }
        return post;
      });
      setPosts(updatedPosts);
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      setToast({ open: true, message: 'Failed to like/unlike post', severity: 'error' });
    }
  }

  const handleAddComment = async (postId: string) => {
    const comment = "I am a genius!";
    const createdAt = new Date().toISOString();
    if (!user || !token) {
      router.push("/authentication/login");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/commentOnPost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          data: {
            name: user.displayName,
            email: user.email,
            postId,
            comment: comment,
            createdAt,
          }
        }),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      const commentData = await response.json();
      if (!(commentData && commentData.data)) {
        throw new Error("Failed to create post");
      }
      const commentId = commentData.data.id;
      const updatedPosts = posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, { id: commentId, name: user.displayName || "", email: user.email || "", comment, createdAt }],
          };
        }
        return post;
      });
      console.log(updatedPosts);
      setPosts(updatedPosts);
      setToast({ open: true, message: 'Comment added successfully', severity: 'success' });
    } catch (error) {
      console.error("Error adding comment:", error);
      setToast({ open: true, message: 'Failed to add comment', severity: 'error' });
    }
  }

  return (
    <PageContainer title="Friend Circle" description="What are your friends doing?">
      <Box sx={{ mt: 2 }}>
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, ml: 2 }}>
          <Typography variant="h4">Friend Circle</Typography>
        </Box>

        <List sx={{ width: '100%' }}>
          {user && posts.map((post) => (
            <ListItem key={post.id} sx={{ display: 'block' }}>
              <Card sx={{ position: 'relative', marginBottom: 2 }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ width: 32, height: 32, }} variant='rounded'>
                      {post.name.charAt(0)}
                    </Avatar>
                  }
                  action={post.name === user?.displayName &&
                    <IconButton aria-label='settings' aria-haspopup='true' aria-expanded={postMoreOpen ? 'true' : undefined} id='post-more-button' onClick={(e) => handlePostMoreClick(e, post)}>
                      <MoreVert />
                    </IconButton>
                  }
                  title={post.name}
                  subheader={new Date(post.createdAt).toLocaleString()}
                />
                <CardContent>
                  <Typography variant="body1">{post.content}</Typography>
                  {post.goal && <Typography variant="body2" sx={{ mt: 1 }}>For goal: {post.goal.title}</Typography>}
                </CardContent>
                <Menu id='post-more-menu' anchorEl={anchorEl} open={postMoreOpen} onClose={handlePostMoreClose} MenuListProps={{ 'aria-labelledby': 'post-more-button' }}>
                  <MenuItem onClick={() => { handleEditPostClick(); handlePostMoreClose(); }}>
                    <ListItemIcon>
                      <Edit fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Edit</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => { handleDeletePostClick(); handlePostMoreClose(); }}>
                    <ListItemIcon>
                      <Delete fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                  </MenuItem>
                </Menu>
                <CardActions disableSpacing sx={{ justifyContent: 'flex-end' }}>
                  <IconButton onClick={() => handlePostLikeClick(post.id)} color={post.likes.includes(user.uid) ? 'primary' : 'default'} sx={{ mr: 1 }} >
                    {post.likes.includes(user.uid) ? <Favorite /> : <FavoriteBorderIcon />}
                    <StyledBadge badgeContent={post.likes.length} color='secondary' overlap='circular' />
                  </IconButton>
                  <IconButton onClick={() => handleAddComment(post.id)} color="secondary" sx={{ mr: 1 }} >
                    {post.comments.length > 0 ? <CommentOutlinedIcon /> : <ModeCommentOutlined />}
                    <StyledBadge badgeContent={post.comments.length} color="secondary" overlap='circular' />
                  </IconButton>
                </CardActions>
              </Card>
            </ListItem>
          ))}
        </List>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Edit Post' : 'Create New Post'}</DialogTitle>
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
            onChange={(e) => { setPostContent(e.target.value); setValidationError(''); }}
            size="small"
          />
          <FormControl fullWidth margin='normal'>
            <InputLabel id='link-select-label' size='small'>For which goal?</InputLabel>
            <Select labelId='link-select-label' id='link-select' label="For which goal?"
              value={postGoalLinkId} onChange={(e: SelectChangeEvent) => { setPostGoalLinkId(e.target.value); }} size='small'>
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
    </PageContainer>
  );
}