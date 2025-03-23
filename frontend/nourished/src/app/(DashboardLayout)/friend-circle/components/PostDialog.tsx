import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  IconButton,
  Divider,
  SelectChangeEvent,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Close, Flag } from '@mui/icons-material';
import { Goal } from '../../goals/page';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    overflow: 'hidden',
  },
}));

const DialogHeader = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2, 3),
  backgroundColor: theme.palette.background.default,
  fontWeight: 600,
  fontSize: '1.25rem'
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  backgroundColor: theme.palette.background.default,
}));

const FormField = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

interface PostDialogProps {
  open: boolean;
  onClose: () => void;
  isEditing: boolean;
  postContent: string;
  setPostContent: (content: string) => void;
  postGoalLinkId: string;
  setPostGoalLinkId: (id: string) => void;
  validationError: string;
  goals: Goal[];
  onPost: () => void;
}

const PostDialog: React.FC<PostDialogProps> = ({
  open,
  onClose,
  isEditing,
  postContent,
  setPostContent,
  postGoalLinkId,
  setPostGoalLinkId,
  validationError,
  goals,
  onPost
}) => {
  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostContent(e.target.value);
  };

  const handleGoalChange = (e: SelectChangeEvent) => {
    setPostGoalLinkId(e.target.value);
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogHeader>
        {isEditing ? 'Edit Post' : 'Create New Post'}
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <Close />
        </IconButton>
      </DialogHeader>
      
      <Divider />
      
      <StyledDialogContent>
        {validationError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center'
              }
            }}
          >
            {validationError}
          </Alert>
        )}
        
        <FormField>
          <TextField
            autoFocus
            label="What's on your mind?"
            multiline
            rows={4}
            fullWidth
            value={postContent}
            onChange={handleContentChange}
            variant="outlined"
            placeholder="Share your thoughts, achievements, or challenges..."
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              }
            }}
          />
        </FormField>
        
        <FormField>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="goal-select-label">Link to a Goal (Optional)</InputLabel>
            <Select
              labelId="goal-select-label"
              id="goal-select"
              value={postGoalLinkId}
              onChange={handleGoalChange}
              label="Link to a Goal (Optional)"
              sx={{
                borderRadius: '12px',
              }}
              startAdornment={postGoalLinkId ? <Flag color="primary" sx={{ ml: 1, mr: 1 }} /> : null}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {goals.map((goal) => (
                <MenuItem key={goal.id} value={goal.id}>
                  {goal.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </FormField>
      </StyledDialogContent>
      
      <Divider />
      
      <StyledDialogActions>
        <Button 
          onClick={onClose}
          sx={{ 
            borderRadius: '10px',
            px: 3
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={onPost}
          variant="contained" 
          color="primary"
          disabled={!postContent.trim()}
          sx={{ 
            borderRadius: '10px',
            px: 3,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
            }
          }}
        >
          {isEditing ? 'Update' : 'Post'}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default PostDialog; 