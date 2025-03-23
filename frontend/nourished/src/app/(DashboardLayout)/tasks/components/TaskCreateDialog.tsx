'use client';
import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
  Fade,
  FormControl,
  InputLabel,
  Select,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Popper,
  Paper,
  Zoom,
  Grow,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Define AI suggestion animation keyframes
const aiButtonPulse = {
  '@keyframes pulse': {
    '0%': { boxShadow: '0 0 0 0 rgba(126, 87, 194, 0.7)' },
    '70%': { boxShadow: '0 0 0 10px rgba(126, 87, 194, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(126, 87, 194, 0)' },
  },
};

// Add global styles for keyframe animations
const globalStyles = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }
`;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3010';

// Add a debounce helper to prevent multiple rapid clicks
const useDebounce = (callback: Function, delay: number) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: any[]) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

interface TaskCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    description: string;
    frequency: string;
    goalId?: string;
  }) => Promise<void>;
  userTasks: any[]; // to check for duplicates if needed
  goals?: any[]; // available goals to assign task to
  token?: string | null; // token for API calls
}

const TaskCreateDialog: React.FC<TaskCreateDialogProps> = ({
  open,
  onClose,
  onCreate,
  userTasks,
  goals = [],
  token,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [goalId, setGoalId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // AI Suggestion states
  const [aiButtonEl, setAiButtonEl] = useState<null | HTMLElement>(null);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any | null>(null);
  const [loadingAiSuggestion, setLoadingAiSuggestion] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [typingEffect, setTypingEffect] = useState('');
  const [typeIndex, setTypeIndex] = useState(0);
  
  // Add last fetch timestamp to prevent repeated calls
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const handleSaveClick = async () => {
    setErrorMsg(null);

    // Basic Validation
    if (!title.trim()) {
      setErrorMsg('Title is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Description is required.');
      return;
    }
    if (title.length > 50) {
      setErrorMsg('Title must be <= 50 characters.');
      return;
    }
    if (description.length > 200) {
      setErrorMsg('Description must be <= 200 characters.');
      return;
    }

    // Optional: check for duplicates
    const duplicates = userTasks.filter(
      (t) => t.title.toLowerCase() === title.toLowerCase()
    );
    if (duplicates.length > 0) {
      setErrorMsg('A task with that title already exists!');
      return;
    }

    setSaving(true);
    try {
      await onCreate({ title, description, frequency, goalId });
      // Clear form after success
      setTitle('');
      setDescription('');
      setFrequency('');
      setGoalId('');
      onClose();
    } catch (error: any) {
      setErrorMsg(error.message || 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setErrorMsg(null);
    // Clear form if desired
    setTitle('');
    setDescription('');
    setFrequency('');
    setGoalId('');
    onClose();
  };

  // Handle AI suggestion click with debounce
  const handleAiButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    // If already showing, just close it
    if (showAiSuggestion) {
      setShowAiSuggestion(false);
      return;
    }
    
    // Set anchor element for the popper
    setAiButtonEl(event.currentTarget);
    
    // Prevent rapid repeated clicks
    const now = Date.now();
    if (now - lastFetchTime < 3000) { // 3 second cooldown
      setShowAiSuggestion(true);
      return;
    }
    
    // Fetch new suggestion
    fetchAiSuggestion();
    setLastFetchTime(now);
  };

  // Update fetchAiSuggestion to better handle errors
  const fetchAiSuggestion = async () => {
    if (!token) {
      setShowAiSuggestion(true);
      setAiError("Authentication required. Please log in again.");
      return;
    }
    
    setLoadingAiSuggestion(true);
    setAiError(null);
    setShowAiSuggestion(true);
    setTypingEffect('');
    setTypeIndex(0);
    setAiSuggestion(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/getAITaskRecommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      const responseText = await response.text();
      
      // Handle different error cases
      if (!response.ok) {
        console.error('AI Recommendation error:', response.status, responseText);
        
        // Specific handling for "no task history" case
        if (responseText.includes('Failed to find document') || 
            responseText.includes('not found') || 
            responseText.includes('No ratings data found')) {
          console.log('No task history found, using fallback suggestions');
          provideFallbackSuggestion();
          return;
        }
        
        throw new Error('Unable to get AI suggestions at this time');
      }
      
      // Try to parse the JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse API response as JSON:', responseText);
        provideFallbackSuggestion();
        return;
      }
      
      if (!data.success || !data.message) {
        console.warn('AI API returned success:false or no message:', data);
        provideFallbackSuggestion();
        return;
      }
      
      setAiSuggestion(data.message);
      
      // Start typing effect with the actual suggestion
      if (data.message.title) {
        const fullText = data.message.title + (data.message.description ? ': ' + data.message.description : '');
        simulateTyping(fullText);
      }
    } catch (error) {
      console.error('Error fetching AI suggestion:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to fetch suggestion');
      // Fall back to generic suggestions on error
      provideFallbackSuggestion();
    } finally {
      setLoadingAiSuggestion(false);
    }
  };
  
  // Improved fallback suggestion implementation
  const provideFallbackSuggestion = () => {
    // Clear any existing errors
    setAiError(null);
    
    const fallbackSuggestions = [
      {
        title: "Morning stretch routine",
        description: "Start your day with a 5-minute stretching routine to boost energy and mood",
        frequency: "Daily"
      },
      {
        title: "Drink more water",
        description: "Set a goal to drink at least 8 glasses of water throughout the day",
        frequency: "Daily"
      },
      {
        title: "Take a nature walk",
        description: "Spend 30 minutes walking in nature to reduce stress and improve mental wellbeing",
        frequency: "Weekly"
      },
      {
        title: "Digital detox hour",
        description: "Set aside one hour each evening free from screens and digital devices",
        frequency: "Daily"
      },
      {
        title: "Gratitude journaling",
        description: "Write down three things you're grateful for before bed",
        frequency: "Daily"
      },
      {
        title: "Mindful meditation",
        description: "Practice 10 minutes of meditation to calm your mind and reduce stress",
        frequency: "Daily"
      },
      {
        title: "Read for pleasure",
        description: "Take time to read something you enjoy, even if just for 15 minutes",
        frequency: "Daily"
      }
    ];
    
    // Pick a random suggestion
    const randomSuggestion = fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)];
    setAiSuggestion(randomSuggestion);
    
    const fullText = randomSuggestion.title + ': ' + randomSuggestion.description;
    simulateTyping(fullText);
  };
  
  // Simulate typing effect for AI suggestion
  const simulateTyping = (text: string) => {
    setTypingEffect('');
    setTypeIndex(0);
    
    const typingInterval = setInterval(() => {
      setTypingEffect((prev) => {
        const nextChar = text.charAt(typeIndex);
        setTypeIndex((prevIndex) => prevIndex + 1);
        
        if (typeIndex >= text.length) {
          clearInterval(typingInterval);
        }
        
        return prev + nextChar;
      });
    }, 30); // Adjust typing speed here
    
    return () => clearInterval(typingInterval);
  };
  
  // Apply AI suggestion to form
  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setTitle(aiSuggestion.title || '');
      setDescription(aiSuggestion.description || '');
      setFrequency(aiSuggestion.frequency || '');
      setShowAiSuggestion(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth='sm'
      TransitionComponent={Fade}
    >
      {/* Add global styles using style tag */}
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      
      <DialogTitle>
        Add a New Task
        <Box sx={{ position: 'absolute', right: '24px', top: '12px' }}>
          <Tooltip 
            title="Get AI task suggestions based on your mood patterns" 
            placement="left"
            arrow
          >
            <IconButton
              onClick={handleAiButtonClick}
              aria-label="Get AI suggestions"
              sx={{
                color: 'white',
                background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                borderRadius: '50%',
                p: 1,
                transition: 'all 0.3s ease',
                animation: showAiSuggestion ? 'none' : 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { 
                    boxShadow: '0 0 0 0 rgba(126, 87, 194, 0.7)',
                    transform: 'scale(1)' 
                  },
                  '70%': { 
                    boxShadow: '0 0 0 8px rgba(126, 87, 194, 0)',
                    transform: 'scale(1.05)' 
                  },
                  '100%': { 
                    boxShadow: '0 0 0 0 rgba(126, 87, 194, 0)',
                    transform: 'scale(1)' 
                  },
                },
                '&:hover': {
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 15px rgba(126, 87, 194, 0.5)',
                },
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: '20px' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* AI Suggestion Popper */}
      <Popper
        open={showAiSuggestion}
        anchorEl={aiButtonEl}
        placement="bottom-end"
        transition
        sx={{ zIndex: 1300, maxWidth: '320px', width: '100%' }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={350}>
            <Paper 
              elevation={5}
              sx={{
                p: 2,
                borderRadius: 2,
                background: (theme) => `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.secondary.light, 0.15)} 100%)`,
                border: (theme) => `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesomeIcon fontSize="small" sx={{ color: (theme) => theme.palette.secondary.main }} />
                  AI Suggestion
                </Typography>
                <IconButton size="small" onClick={() => setShowAiSuggestion(false)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              
              {loadingAiSuggestion ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Analyzing your mood patterns...
                  </Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: '4px', 
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    background: (theme) => alpha(theme.palette.secondary.main, 0.1),
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '30%',
                      height: '100%',
                      background: (theme) => theme.palette.secondary.main,
                      animation: 'shimmer 1.5s infinite',
                      borderRadius: '4px',
                    }
                  }} />
                </Box>
              ) : aiError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {aiError}
                </Alert>
              ) : aiSuggestion ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1.5, minHeight: '60px' }}>
                    {typingEffect}
                    <span 
                      className="cursor" 
                      style={{ 
                        marginLeft: '2px',
                        borderRight: '2px solid #7e57c2',
                        animation: 'blink 1s step-end infinite',
                      }}
                    ></span>
                  </Typography>
                  
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      onClick={applyAiSuggestion}
                    >
                      Use suggestion
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Typography variant="body2">No suggestions available.</Typography>
              )}
            </Paper>
          </Grow>
        )}
      </Popper>
      
      <DialogContent dividers>
        {errorMsg && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {errorMsg}
          </Alert>
        )}
        <Stack spacing={2}>
          <TextField
            label='Title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size='small'
          />
          <TextField
            label='Description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            size='small'
          />
          <TextField
            select
            label='Frequency'
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            size='small'
          >
            <MenuItem value=''>(none)</MenuItem>
            <MenuItem value='Daily'>Daily</MenuItem>
            <MenuItem value='Weekly'>Weekly</MenuItem>
            <MenuItem value='Monthly'>Monthly</MenuItem>
          </TextField>

          {goals && goals.length > 0 && (
            <FormControl fullWidth size="small">
              <InputLabel id="goal-select-label">Assign to Goal (Optional)</InputLabel>
              <Select
                labelId="goal-select-label"
                value={goalId}
                label="Assign to Goal (Optional)"
                onChange={(e) => setGoalId(e.target.value)}
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
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSaveClick} disabled={saving}>
          {saving ? 'Saving...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskCreateDialog;
