import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Avatar,
  Tooltip,
  Zoom,
  alpha,
  TextField,
  Button,
  Fade,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  IconMoodSmile,
  IconMoodHappy,
  IconMoodSad,
  IconMoodCry,
  IconMoodEmpty,
  IconMoodNervous,
} from '@tabler/icons-react';

// Mood options with ratings, icons, and colors
const moodOptions = [
  { 
    value: 5, 
    label: 'Ecstatic', 
    icon: IconMoodHappy, 
    color: '#4CAF50',
    description: 'Feeling amazing! On top of the world.'
  },
  { 
    value: 4, 
    label: 'Happy', 
    icon: IconMoodSmile, 
    color: '#8BC34A',
    description: 'In a good mood. Things are going well.'
  },
  { 
    value: 3, 
    label: 'Neutral', 
    icon: IconMoodEmpty, 
    color: '#FFC107',
    description: 'Neither good nor bad. Just okay.'
  },
  { 
    value: 2, 
    label: 'Down', 
    icon: IconMoodSad, 
    color: '#FF9800',
    description: 'Feeling a bit low or sad today.'
  },
  { 
    value: 1, 
    label: 'Terrible', 
    icon: IconMoodCry, 
    color: '#F44336',
    description: 'Having a really tough time.'
  },
  { 
    value: 0,
    label: 'Anxious', 
    icon: IconMoodNervous, 
    color: '#9C27B0',
    description: 'Feeling worried, stressed or anxious.'
  },
];

interface MoodSelectorProps {
  onSubmit: (rating: number, note: string) => Promise<void>;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ onSubmit }) => {
  const theme = useTheme();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNote, setShowNote] = useState(false);

  // Handle mood selection
  const handleSelectMood = (rating: number) => {
    setSelectedMood(rating);
    // Show note field when mood is selected
    setShowNote(true);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (selectedMood === null) return;
    
    // Validate rating
    if (selectedMood < 0 || selectedMood > 5 || !Number.isInteger(selectedMood)) {
      console.error('Invalid mood rating. Must be an integer between 0 and 5.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedMood, note);
      // Reset after successful submission
      setSelectedMood(null);
      setNote('');
      setShowNote(false);
    } catch (error) {
      console.error('Error submitting mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '16px',
        background: theme.palette.background.paper,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
        mb: 3,
      }}
    >
      {/* Decorative element */}
      <Box
        sx={{
          position: 'absolute',
          top: -15,
          right: -15,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
          zIndex: 0,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            mb: 1,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          How are you feeling today?
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Track your mood to gain insights into your emotional patterns.
        </Typography>

        {/* Mood options */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 2,
            mb: 3,
          }}
        >
          {/* Mood options to show negative on left, positive on right */}
          {moodOptions.slice().reverse().map((mood) => {
            const Icon = mood.icon;
            const isSelected = selectedMood === mood.value;
            
            return (
              <Tooltip
                key={mood.value}
                title={mood.description}
                arrow
                TransitionComponent={Zoom}
                placement="top"
              >
                <Box sx={{ textAlign: 'center' }}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Avatar
                      onClick={() => handleSelectMood(mood.value)}
                      sx={{
                        width: 64,
                        height: 64,
                        backgroundColor: isSelected
                          ? mood.color
                          : alpha(mood.color, 0.1),
                        color: isSelected ? '#fff' : mood.color,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        mb: 1,
                        '&:hover': {
                          backgroundColor: isSelected
                            ? mood.color
                            : alpha(mood.color, 0.2),
                          transform: 'translateY(-3px)',
                          boxShadow: `0 4px 8px ${alpha(mood.color, 0.3)}`,
                        },
                      }}
                    >
                      <Icon size={30} stroke={1.5} />
                    </Avatar>
                  </motion.div>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isSelected ? mood.color : 'text.secondary',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {mood.label}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Note field - appears after mood selection */}
        <Fade in={showNote} timeout={500}>
          <Box sx={{ mt: 2, mb: 3, display: showNote ? 'block' : 'none' }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Add notes about how you're feeling (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: selectedMood !== null 
                      ? moodOptions.find(m => m.value === selectedMood)?.color 
                      : theme.palette.primary.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: selectedMood !== null 
                      ? moodOptions.find(m => m.value === selectedMood)?.color 
                      : theme.palette.primary.main,
                  },
                }
              }}
            />
          </Box>
        </Fade>

        {/* Submit button - appears after mood selection */}
        <Fade in={showNote} timeout={700}>
          <Box 
            sx={{ 
              display: showNote ? 'flex' : 'none',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedMood === null}
              sx={{
                px: 4,
                py: 1,
                borderRadius: '12px',
                backgroundColor: selectedMood !== null
                  ? moodOptions.find(m => m.value === selectedMood)?.color
                  : theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: selectedMood !== null
                    ? alpha(
                        moodOptions.find(m => m.value === selectedMood)?.color || '',
                        0.9
                      )
                    : theme.palette.primary.dark,
                },
                transition: 'all 0.2s ease-in-out',
                boxShadow: selectedMood !== null
                  ? `0 4px 12px ${alpha(
                      moodOptions.find(m => m.value === selectedMood)?.color || '',
                      0.3
                    )}`
                  : undefined,
              }}
            >
              {isSubmitting ? 'Saving...' : 'Save Mood'}
            </Button>
          </Box>
        </Fade>
      </Box>
    </Paper>
  );
};

export default MoodSelector; 