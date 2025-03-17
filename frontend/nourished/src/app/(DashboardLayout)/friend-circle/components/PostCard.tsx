'use client';
import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  MoreVert,
  Favorite,
  FavoriteBorderOutlined,
  ChatBubbleOutlineRounded,
  Edit,
  Delete,
  Flag,
  Share,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Post } from '../page';

// Helper function for haptic feedback
const triggerHapticFeedback = () => {
  if (navigator.vibrate) {
    navigator.vibrate(20); // Short vibration (20ms)
  }
};

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'visible',
  position: 'relative',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
    transform: 'translateY(-2px)',
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  width: 44,
  height: 44,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
}));

const GoalChip = styled(Chip)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  fontWeight: 500,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  '& .MuiChip-icon': {
    color: theme.palette.primary.main,
  },
}));

const LikeButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'isLiked',
})<{ isLiked?: boolean }>(({ theme, isLiked }) => ({
  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  color: isLiked ? '#ff3366' : 'inherit',
  position: 'relative',
  '&:hover': {
    transform: 'scale(1.15)',
    color: isLiked ? '#ff3366' : alpha('#ff3366', 0.7),
  },
  '&:active': {
    transform: 'scale(0.9)',
  },
}));

const HeartAnimation = styled(motion.div)({
  position: 'absolute',
  pointerEvents: 'none',
  zIndex: 5,
});

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: (postId: string) => void;
  onComment: (postId: string, commentCount: number) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  onLike,
  onComment,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const isMenuOpen = Boolean(anchorEl);
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUserId));
  const isCurrentUserPost = post.email === currentUserId;

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(post);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    }
    handleMenuClose();
  };

  const handleLike = () => {
    triggerHapticFeedback();
    onLike(post.id);

    if (!isLiked) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 700);
    }

    setIsLiked(!isLiked);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(date);
    }
  };

  const likeCount = post.likes.length;
  const commentCount = post.comments.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <StyledCard elevation={0}>
        <CardHeader
          avatar={
            <StyledAvatar>
              {post.name ? post.name.charAt(0).toUpperCase() : 'U'}
            </StyledAvatar>
          }
          action={
            isCurrentUserPost && (
              <IconButton
                aria-label='settings'
                onClick={handleMenuOpen}
                size='small'
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <MoreVert fontSize='small' />
              </IconButton>
            )
          }
          title={
            <Typography variant='subtitle2' fontWeight={600}>
              {post.name || 'Anonymous'}
            </Typography>
          }
          subheader={
            <Typography variant='caption' color='text.secondary'>
              {formatDate(post.createdAt)}
            </Typography>
          }
          sx={{ pb: 1 }}
        />

        <CardContent sx={{ pt: 0, pb: 1 }}>
          <Typography variant='body2' sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}>
            {post.content}
          </Typography>

          {post.goal && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <GoalChip
                icon={<Flag fontSize='small' />}
                label={post.goal.title}
                size='small'
                variant='outlined'
              />
            </Box>
          )}
        </CardContent>

        <Box sx={{ px: 2, pb: 1 }}>
          <Divider />
        </Box>

        <CardActions sx={{ px: 2, py: 0.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <LikeButton
                onClick={handleLike}
                isLiked={isLiked}
                size='small'
                sx={{ mr: 0.5 }}
                aria-label={isLiked ? 'Unlike' : 'Like'}
              >
                {isLiked ? (
                  <Favorite fontSize='small' />
                ) : (
                  <FavoriteBorderOutlined fontSize='small' />
                )}
              </LikeButton>

              <AnimatePresence>
                {showHeartAnimation && (
                  <HeartAnimation
                    initial={{ opacity: 1, scale: 0 }}
                    animate={{ opacity: 1, scale: 1.5 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                  >
                    <Favorite fontSize='small' sx={{ color: '#ff3366' }} />
                  </HeartAnimation>
                )}
              </AnimatePresence>
            </Box>

            {likeCount > 0 && (
              <Typography
                variant='caption'
                color={isLiked ? '#ff3366' : 'text.secondary'}
                sx={{ mr: 2, fontWeight: isLiked ? 600 : 400 }}
              >
                {likeCount}
              </Typography>
            )}

            <IconButton
              onClick={() => onComment(post.id, commentCount)}
              size='small'
              sx={{
                mr: 0.5,
                transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.1)' },
              }}
            >
              <ChatBubbleOutlineRounded fontSize='small' />
            </IconButton>
            {commentCount > 0 && (
              <Typography variant='caption' color='text.secondary'>
                {commentCount}
              </Typography>
            )}
          </Box>

          {/* <IconButton
            size='small'
            sx={{
              color: 'text.secondary',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.1)',
                color: theme.palette.primary.main,
              },
            }}
            aria-label='Share post'
          >
            <Share fontSize='small' />
          </IconButton> */}
        </CardActions>
      </StyledCard>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            borderRadius: '12px',
            minWidth: '160px',
            overflow: 'visible',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            mt: 1,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
            },
          },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <Edit fontSize='small' color='primary' />
          </ListItemIcon>
          <ListItemText>Edit Post</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Delete fontSize='small' color='error' />
          </ListItemIcon>
          <ListItemText>Delete Post</ListItemText>
        </MenuItem>
      </Menu>
    </motion.div>
  );
};

export default PostCard;
