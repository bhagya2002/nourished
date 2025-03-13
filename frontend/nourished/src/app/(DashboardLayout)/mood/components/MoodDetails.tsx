import React, { useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  useTheme,
  IconButton,
  Slide,
  alpha,
  Tooltip,
  Avatar,
  DialogTitle,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { 
  IconX, 
  IconEdit, 
  IconTrash, 
  IconMoodSmile,
  IconMoodHappy,
  IconMoodSad,
  IconMoodCry,
  IconMoodEmpty,
  IconMoodNervous
} from '@tabler/icons-react';

// Slide transition for dialog
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface MoodEntry {
  date: string;
  rating: number;
  note?: string;
}

interface MoodDetailsProps {
  open: boolean;
  onClose: () => void;
  onDelete: (date: string) => Promise<void>;
  onUpdate: (date: string, note: string) => Promise<void>;
  entry?: MoodEntry;
}

const MoodDetails: React.FC<MoodDetailsProps> = ({
  open,
  onClose,
  onDelete,
  onUpdate,
  entry,
}) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(entry?.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!entry) return null;

  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get mood info based on rating
  const getMoodInfo = (rating: number) => {
    switch (rating) {
      case 5:
        return { icon: IconMoodHappy, color: '#4CAF50', label: 'Ecstatic' };
      case 4:
        return { icon: IconMoodSmile, color: '#8BC34A', label: 'Happy' };
      case 3:
        return { icon: IconMoodEmpty, color: '#FFC107', label: 'Neutral' };
      case 2:
        return { icon: IconMoodSad, color: '#FF9800', label: 'Down' };
      case 1:
        return { icon: IconMoodCry, color: '#F44336', label: 'Terrible' };
      case 0:
        return { icon: IconMoodNervous, color: '#9C27B0', label: 'Anxious' };
      default:
        return { icon: IconMoodEmpty, color: '#FFC107', label: 'Neutral' };
    }
  };

  const moodInfo = getMoodInfo(entry.rating);
  const MoodIcon = moodInfo.icon;

  const handleStartEditing = () => {
    setIsEditing(true);
    setNote(entry?.note || '');
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setNote(entry?.note || '');
  };

  const handleSaveNote = async () => {
    if (!entry) return;
    
    setIsSubmitting(true);
    try {
      await onUpdate(entry.date, note);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating mood note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    
    setIsDeleting(true);
    try {
      await onDelete(entry.date);
      onClose();
    } catch (error) {
      console.error('Error deleting mood entry:', error);
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={isSubmitting || isDeleting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          background: `linear-gradient(to right, ${alpha(moodInfo.color, 0.2)}, ${alpha(
            moodInfo.color,
            0.05
          )})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Mood Details
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          disabled={isSubmitting || isDeleting}
          aria-label="close"
        >
          <IconX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 2,
              mr: { xs: 0, sm: 3 },
              mb: { xs: 2, sm: 0 },
              borderRadius: '16px',
              background: alpha(moodInfo.color, 0.1),
              minWidth: { xs: '100%', sm: '120px' },
            }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                backgroundColor: moodInfo.color,
                mb: 1,
              }}
            >
              <MoodIcon size={36} stroke={1.5} color="#fff" />
            </Avatar>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: moodInfo.color }}
            >
              {moodInfo.label}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
              {formattedDate}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Notes
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add your notes here..."
                variant="outlined"
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: moodInfo.color,
                    },
                  },
                }}
              />
            ) : (
              <Typography
                variant="body1"
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  minHeight: '100px',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {entry.note || 'No notes added for this entry.'}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          justifyContent: isEditing ? 'flex-end' : 'space-between',
        }}
      >
        {isEditing ? (
          <>
            <Button
              variant="outlined"
              onClick={handleCancelEditing}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveNote}
              disabled={isSubmitting}
              sx={{
                ml: 2,
                bgcolor: moodInfo.color,
                '&:hover': {
                  bgcolor: alpha(moodInfo.color, 0.9),
                },
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <>
            <Tooltip title="Delete this mood entry">
              <Button
                variant="outlined"
                color="error"
                onClick={handleDelete}
                disabled={isDeleting}
                startIcon={<IconTrash size={18} />}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              onClick={handleStartEditing}
              startIcon={<IconEdit size={18} />}
              sx={{
                bgcolor: moodInfo.color,
                '&:hover': {
                  bgcolor: alpha(moodInfo.color, 0.9),
                },
              }}
            >
              Edit Notes
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MoodDetails; 