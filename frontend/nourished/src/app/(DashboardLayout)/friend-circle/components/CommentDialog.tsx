'use client';
import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Box, 
  IconButton,
  Typography,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Close, Send, ChatBubble } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import CommentList from './CommentList';
import { Comment } from '../page';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  '& .MuiTypography-root': {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const CommentForm = styled('form')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  margin: theme.spacing(2, 0, 0),
  position: 'sticky',
  bottom: 0,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2, 0),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
}));

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  comments: Comment[];
  postOwnerEmail: string;
  currentUserEmail: string;
  onAddComment: () => void;
  onDeleteComment: (commentId: string) => void;
  commentContent: string;
  setCommentContent: (content: string) => void;
  commentValidationError: string;
  setCommentValidationError: (error: string) => void;
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  open,
  onClose,
  comments,
  postOwnerEmail,
  currentUserEmail,
  onAddComment,
  onDeleteComment,
  commentContent,
  setCommentContent,
  commentValidationError,
  setCommentValidationError
}) => {
  const theme = useTheme();
  const commentsCount = comments.length;
  
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommentContent(e.target.value);
    if (e.target.value.trim()) {
      setCommentValidationError('');
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      setCommentValidationError('Please enter a comment');
      return;
    }
    onAddComment();
  };
  
  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      aria-labelledby="comment-dialog-title"
    >
      <StyledDialogTitle id="comment-dialog-title">
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ChatBubble 
            sx={{ 
              marginRight: 1.5,
              color: theme.palette.primary.main
            }} 
          />
          <Typography variant="h6">
            {commentsCount > 0 ? `Comments (${commentsCount})` : 'Add Comment'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" edge="end" aria-label="close">
          <Close fontSize="small" />
        </IconButton>
      </StyledDialogTitle>
      
      <StyledDialogContent dividers>
        <CommentList
          comments={comments}
          currentUserEmail={currentUserEmail}
          postOwnerEmail={postOwnerEmail}
          onDeleteComment={onDeleteComment}
        />

        <CommentForm onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={4}
            placeholder="Write a comment..."
            value={commentContent}
            onChange={handleCommentChange}
            variant="outlined"
            size="small"
            error={!!commentValidationError}
            helperText={commentValidationError}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            endIcon={<Send />}
            disabled={!commentContent.trim()}
            sx={{
              borderRadius: '10px',
              height: '40px',
              minWidth: '90px',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: 'none',
            }}
          >
            Post
          </Button>
        </CommentForm>
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default CommentDialog; 