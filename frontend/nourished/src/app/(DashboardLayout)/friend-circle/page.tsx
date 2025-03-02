"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import PageContainer from "../components/container/PageContainer";
import { Fab, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Card, CardContent, Typography, List, ListItem, IconButton, CardActions, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import CommentIcon from '@mui/icons-material/Comment';

// Define a type for the posts
type Post = {
  id: number;
  content: string;
  likes: number;
  comments: string[];  // Assuming comments are just strings for simplicity
};

export default function FriendCirclePage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [open, setOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);  // Use the Post type for the posts state

  // Redirects to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/authentication/login");
    }
  }, [loading, user, router]);

  // Fetches posts while initializing the posts page
  useEffect(() => {
    if (user && token) {
      // TODO: Fetch posts from the server
    }
  }, [user, token]);

  const handleAddPostClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handlePost = () => {
    if (postContent.trim()) {
      const newPost: Post = {
        content: postContent,
        id: posts.length,
        likes: 0,
        comments: []
      };
      setPosts(prevPosts => [...prevPosts, newPost]);
      setOpen(false);
      setPostContent('');
    }
  };

  return (
    <PageContainer title="Friend Circle" description="What are your friends doing?">
      <h2 style={{ padding: "0 16px" }}>Friend Circle</h2>
      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Fab color="primary" onClick={handleAddPostClick} aria-label="Add Post">
          <AddIcon />
        </Fab>
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create a New Post</DialogTitle>
        <DialogContent dividers>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant='contained' onClick={handlePost}>Post</Button>
        </DialogActions>
      </Dialog>

      <List sx={{ width: '100%' }}>
        {posts.map(post => (
          <ListItem key={post.id} sx={{ display: 'block' }}>
            <Card sx={{ position: 'relative', marginBottom: 2 }}>
              <CardContent>
                <Typography variant="body1">{post.content}</Typography>
              </CardContent>
              <CardActions disableSpacing sx={{ justifyContent: 'flex-end' }}>
                <IconButton onClick={() => console.log('Like post id:', post.id)} color="primary">
                  <ThumbUpAltIcon />
                </IconButton>
                <IconButton onClick={() => console.log('Comment on post id:', post.id)} color="primary">
                  <CommentIcon />
                </IconButton>
              </CardActions>
            </Card>
          </ListItem>
        ))}
      </List>
    </PageContainer>
  );
}