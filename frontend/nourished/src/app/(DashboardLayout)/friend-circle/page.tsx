'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PageContainer from "../components/container/PageContainer";
import { Goal } from "../goals/page"
import { 
  Box, 
  Grid, 
  Snackbar, 
  Alert, 
  AlertColor, 
  Container, 
  Paper,
  Typography,
  Divider,
  useTheme,
  alpha,
  Button,
  CircularProgress,
  Fab,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { TrendingUp } from '@mui/icons-material';

// Import our new components
import PageHeader from './components/PageHeader';
import PostCard from './components/PostCard';
import CommentDialog from './components/CommentDialog';
import PostDialog from './components/PostDialog';
import EmptyState from './components/EmptyState';

// Update API base URL to match environment variable name exactly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010";

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
  goal: Goal | null;
  createdAt: string;
  likes: string[];
  comments: Comment[];
};

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0),
}));

const FeedContainer = styled(Box)(({ theme }) => ({
  maxWidth: '700px',
  margin: '0 auto',
}));

const PostsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

const SidePanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: 'fit-content',
  borderRadius: '12px',
  position: 'sticky',
  top: theme.spacing(3),
}));

export default function FriendCirclePage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const theme = useTheme();

  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'info' as AlertColor,
  });
  
  // Post dialog state
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPostId, setEditingPostId] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postGoalLinkId, setPostGoalLinkId] = useState('');
  const [validationError, setValidationError] = useState('');

  // Comment dialog state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentDialogPostId, setCommentDialogPostId] = useState('');
  const [commentValidationError, setCommentValidationError] = useState('');

  // Data state
  const [posts, setPosts] = useState<Post[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Redirects to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/authentication/login');
    }
  }, [loading, user, router]);

  // Fetches posts while initializing the posts page
  useEffect(() => {
    if (!user && !loading) {
      router.push('/authentication/login');
    } else if (user && token) {
      fetchPosts();
      fetchGoals();
    }
  }, [user, token]);

  const refreshFeed = async () => {
    setIsRefreshing(true);
    try {
      await fetchPosts();
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error refreshing feed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatRefreshTime = () => {
    if (!lastRefreshed) return 'Not yet refreshed';
    
    const now = new Date();
    const diffMs = now.getTime() - lastRefreshed.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    return `${diffMins} minutes ago`;
  };

  const fetchPosts = async () => {
    try {
      if (!token) {
        console.error('No token available');
        return;
      }
      
      // Show loading state
      if (!isRefreshing) {
        setPosts([]);
      }
      
      const response = await fetch(`${API_BASE_URL}/getUserWithFriendPosts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      // Check for HTTP errors
      if (!response.ok) {
        let errorMessage = 'Failed to fetch posts';
        try {
          const errorText = await response.text();
          errorMessage = `${errorMessage}: ${errorText}`;
        } catch (e) {
          // If we can't parse the error text, just use the default message
        }
        throw new Error(errorMessage);
      }
      
      // Parse the JSON response
      const responseData = await response.json();
      
      // Check if the response has the expected structure
      if (!responseData.success) {
        throw new Error(responseData.error || 'Invalid response format');
      }
      
      // Ensure postsData is an array
      const postsArray = Array.isArray(responseData.data) 
        ? responseData.data 
        : [];
        
      // Sort posts by creation date (newest first)
      postsArray.sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setPosts(postsArray);
      
      // Only show success toast if posts were actually fetched
      if (postsArray.length > 0) {
        setToast({ 
          open: true, 
          message: `${postsArray.length} posts fetched successfully`, 
          severity: 'success' 
        });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setToast({
        open: true,
        message: `Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    }
  };

  // Fetches user's goals from the database to populate the list
  const fetchGoals = async () => {
    try {
      if (!token) {
        console.error('No token available');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/getUserGoals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      // Check for HTTP errors
      if (!response.ok) {
        let errorMessage = 'Failed to fetch goals';
        try {
          const errorText = await response.text();
          errorMessage = `${errorMessage}: ${errorText}`;
        } catch (e) {
          // If we can't parse the error text, just use the default message
        }
        throw new Error(errorMessage);
      }
      
      // Parse the JSON response
      const responseData = await response.json();
      
      // Check if the response has the expected structure
      if (!responseData.success) {
        throw new Error(responseData.error || 'Invalid response format');
      }
      
      // Ensure goalsData is an array
      const goalsArray = Array.isArray(responseData.data) 
        ? responseData.data 
        : [];
        
      setGoals(goalsArray);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setToast({
        open: true,
        message: `Failed to fetch goals: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    }
  };

  const handleAddPostClick = () => {
    setIsEditing(false);
    setPostContent('');
    setPostGoalLinkId('');
    setEditingPostId('');
    setPostDialogOpen(true);
  };

  const handlePostDialogClose = () => {
    setPostDialogOpen(false);
    setValidationError('');
  };

  const handlePost = async () => {
    if (!postContent.trim()) {
      setValidationError('Post content must be filled out');
      return;
    }
    if (!(user && token)) {
      router.push('/authentication/login');
      return;
    }

    if (!isEditing) {
      // create a new post in the database
      const postCreatedAt = new Date().toISOString();
      try {
        const response = await fetch(`${API_BASE_URL}/createPost`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            post: {
              name: user.displayName || '',
              email: user.email || '',
              content: postContent,
              goalId: postGoalLinkId,
              createdAt: postCreatedAt,
              likes: [],
              comments: []
            }
          }),
        });
        if (!response.ok) throw new Error('Failed to create post');
        const postData = await response.json();
        if (!(postData && postData.data)) {
          throw new Error('Failed to create post');
        }
        console.log(postData.data.post);
        setPosts(prevPosts => [postData.data.post, ...prevPosts]);
        setToast({ open: true, message: 'Post created successfully', severity: 'success' })
      } catch (error) {
        console.error('Error creating post:', error);
        setToast({
          open: true,
          message: 'Failed to create post',
          severity: 'error',
        });
      }
      setPostDialogOpen(false);
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
        };

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
              goal:
                goals.find((goal) => goal.id === postGoalLinkId) || null,
            };
          }
          return post;
        });
        setPosts(updatedPosts);
        setToast({
          open: true,
          message: 'Post updated successfully',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error updating post:', error);
        setToast({
          open: true,
          message: 'Failed to update post',
          severity: 'error',
        });
      }
      setPostDialogOpen(false);
      setPostContent('');
      setPostGoalLinkId('');
      setEditingPostId('');
    }
  };

  // Handle closing the toast box
  const handleToastClose = () => {
    setToast({ ...toast, open: false });
  };

  const handleEditPost = (post: Post) => {
    setIsEditing(true);
    setPostContent(post.content);
    setPostGoalLinkId(post.goal?.id || '');
    setEditingPostId(post.id);
    setPostDialogOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!user || !token) {
      router.push('/authentication/login');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/deletePost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, postId }),
      });
      if (!response.ok) throw new Error("Failed to delete post");
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      setToast({ open: true, message: 'Post deleted successfully', severity: 'success' })
    } catch (error) {
      console.error('Error deleting post:', error);
      setToast({
        open: true,
        message: 'Failed to delete post',
        severity: 'error',
      });
    }
  }

  const handlePostLike = async (postId: string) => {
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

  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      setCommentValidationError('Required');
      return;
    }
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
            postId: commentDialogPostId,
            comment: commentContent,
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
        if (post.id === commentDialogPostId) {
          return {
            ...post,
            comments: [...post.comments, { id: commentId, name: user.displayName || "", email: user.email || "", comment: commentContent, createdAt }],
          };
        }
        return post;
      });
      setPosts(updatedPosts);
      setToast({ open: true, message: 'Comment added successfully', severity: 'success' });
    } catch (error) {
      console.error("Error adding comment:", error);
      setToast({ open: true, message: 'Failed to add comment', severity: 'error' });
    }
    setCommentContent('');
    setCommentValidationError('');
  }

  const fetchPostComments = async (postId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/getCommentsOnPost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, postId }),
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      const commentsData = await response.json();
      if (!(commentsData && commentsData.data)) {
        throw new Error("Failed to fetch comments");
      }
      const commentsArray = Array.isArray(commentsData.data) ? commentsData.data : [];
      setPosts(prevPosts => {
        const updatedPost = prevPosts.find((post) => post.id === postId);
        if (updatedPost) {
          return prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                comments: commentsArray,
              };
            }
            return post;
          });
        }
        return prevPosts;
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
      setToast({ open: true, message: 'Failed to fetch comments', severity: 'error' });
    }
  }

  const handleCommentClick = (postId: string, commentCount: number) => {
    setCommentContent('');
    setCommentValidationError('');
    setCommentDialogPostId(postId);
    if (commentCount > 0 && typeof posts.find((post) => post.id === postId)?.comments[0] === 'string')
      fetchPostComments(postId);
    setCommentDialogOpen(true);
  }

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
    setCommentContent('');
    setCommentValidationError('');
    setCommentDialogPostId('');
  }

  const handleCommentDelete = async (commentId: string) => {
    if (!user || !token) {
      router.push("/authentication/login");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/deleteCommentOnPost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, data: { commentId, postId: commentDialogPostId } }),
      });
      if (!response.ok) throw new Error("Failed to delete comment");
      setPosts(prevPosts => {
        const updatedPost = prevPosts.find((post) => post.id === commentDialogPostId);
        if (updatedPost) {
          return prevPosts.map((post) => {
            if (post.id === commentDialogPostId) {
              return {
                ...post,
                comments: post.comments.filter(comment => comment.id !== commentId),
              };
            }
            return post;
          });
        }
        return prevPosts;
      });
      setToast({ open: true, message: 'Comment deleted successfully', severity: 'success' });
    } catch (error) {
      console.error("Error deleting comment:", error);
      setToast({ open: true, message: 'Failed to delete comment', severity: 'error' });
    }
  }

  // Get the current post for the comment dialog
  const currentPost = posts.find(post => post.id === commentDialogPostId);

  return (
    <PageContainer
      title='Friend Circle'
      description='Connect with your friends and share your journey'
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100%',
        position: 'relative'
      }}>
        <PageHeader
          title="Friend Circle"
          subtitle="Share your journey and connect with friends"
          onAddPost={handleAddPostClick}
        />

        <ContentContainer>
          <Grid container spacing={3}>
            {/* Main Feed Column */}
            <Grid item xs={12} md={8}>
              <FeedContainer>
                {/* Feed controls */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    borderRadius: '12px',
                    padding: 2,
                    background: alpha(theme.palette.background.default, 0.6),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      icon={<TrendingUp fontSize="small" />} 
                      label="Latest Posts" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                    {lastRefreshed && (
                      <Typography variant="caption" color="text.secondary">
                        Updated {formatRefreshTime()}
                      </Typography>
                    )}
                  </Box>
                  <Tooltip title="Refresh feed">
                    <IconButton 
                      onClick={refreshFeed} 
              color="primary" 
                      disabled={isRefreshing}
                    >
                      <AnimatePresence mode="wait">
                        {isRefreshing ? (
                          <motion.div
                            key="refreshing"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ 
                              duration: 1, 
                              repeat: Infinity, 
                              ease: "linear" 
                            }}
                          >
                            <AutorenewIcon />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="refresh"
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                          >
                            <RefreshIcon />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Post list */}
                <PostsContainer>
                  {isRefreshing && posts.length > 0 ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      my: 2,
                      height: '60px'
                    }}>
                      <CircularProgress size={36} color="primary" />
                      <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                        Refreshing feed...
                      </Typography>
                    </Box>
                  ) : !isRefreshing && posts.length === 0 ? (
                    <EmptyState onAddPost={handleAddPostClick} />
                  ) : (
                    <AnimatePresence>
                      {posts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ 
                            duration: 0.3,
                            delay: index * 0.05 
                          }}
                        >
                          <Box sx={{ mb: 3 }}>
                            <PostCard
                              post={post}
                              currentUserId={user?.uid || ''}
                              onLike={handlePostLike}
                              onComment={handleCommentClick}
                              onEdit={handleEditPost}
                              onDelete={handleDeletePost}
                            />
                          </Box>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </PostsContainer>
              </FeedContainer>
            </Grid>

            {/* Side Panel */}
            <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box sx={{ position: 'sticky', top: theme.spacing(3) }}>
                {/* Friends suggestions panel */}
                <SidePanel sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <PersonAddIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    Connect More
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Find like-minded friends to share your wellness journey with.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    startIcon={<PersonAddIcon />}
                    sx={{ 
                      borderRadius: '10px',
                      textTransform: 'none',
                    }}
                  >
                    Find Friends
                  </Button>
                </SidePanel>
                
                {/* Recent goals panel */}
                <SidePanel>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                    <EventNoteIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                    Recent Goals
                  </Typography>
                  {goals.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      You haven't created any goals yet.
                    </Typography>
                  ) : (
                    <>
                      {goals.slice(0, 3).map((goal, index) => (
                        <Box key={goal.id} sx={{ mb: 2 }}>
                          {index > 0 && <Divider sx={{ my: 1.5 }} />}
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {goal.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mt: 0.5,
                              display: '-webkit-box',
                              overflow: 'hidden',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                            }}
                          >
                            {goal.description}
                          </Typography>
                        </Box>
                      ))}
                      <Button 
                        variant="text" 
                        fullWidth 
                        href="/goals"
                        sx={{ 
                          mt: 1,
                          borderRadius: '10px',
                          textTransform: 'none',
                        }}
                      >
                        View All Goals
                      </Button>
                    </>
                  )}
                </SidePanel>
              </Box>
            </Grid>
        </Grid>
        </ContentContainer>

        {/* Floating action button for adding post on mobile */}
        <Box
          sx={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            display: { xs: 'block', sm: 'none' },
            zIndex: 5
          }}
        >
          <Fab
            color="primary"
            aria-label="add post"
            onClick={handleAddPostClick}
            sx={{
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
            }}
          >
            <AddCommentIcon />
          </Fab>
        </Box>

        {/* Dialog components */}
        <PostDialog
          open={postDialogOpen}
          onClose={handlePostDialogClose}
          isEditing={isEditing}
          postContent={postContent}
          setPostContent={setPostContent}
          postGoalLinkId={postGoalLinkId}
          setPostGoalLinkId={setPostGoalLinkId}
          validationError={validationError}
          goals={goals}
          onPost={handlePost}
        />

        <CommentDialog
          open={commentDialogOpen}
          onClose={handleCommentDialogClose}
          comments={
            posts.find((p) => p.id === commentDialogPostId)?.comments || []
          }
          postOwnerEmail={
            posts.find((p) => p.id === commentDialogPostId)?.email || ''
          }
          currentUserEmail={user?.email || ''}
          onAddComment={handleAddComment}
          onDeleteComment={handleCommentDelete}
          commentContent={commentContent}
          setCommentContent={setCommentContent}
          commentValidationError={commentValidationError}
          setCommentValidationError={setCommentValidationError}
        />

        <Snackbar
          open={toast.open}
          autoHideDuration={6000}
          onClose={handleToastClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleToastClose} severity={toast.severity as AlertColor}>
            {toast.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
