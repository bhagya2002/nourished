"use client";
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  useTheme, 
  Chip, 
  LinearProgress, 
  Tooltip,
  CircularProgress,
  Fade 
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface StreakCounterProps {
  taskHistory: Array<{
    taskId: string;
    taskTitle: string;
    completedAt: string;
    completedStatus: boolean;
  }> | null;
  isLoading: boolean;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ 
  taskHistory,
  isLoading
}) => {
  const theme = useTheme();
  const [streakCount, setStreakCount] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakPercent, setStreakPercent] = useState(0);
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    if (taskHistory) {
      calculateStreaks();
    }
  }, [taskHistory]);
  
  const calculateStreaks = () => {
    if (!taskHistory || taskHistory.length === 0) {
      setStreakCount(0);
      setBestStreak(0);
      return;
    }
    
    // Sort task history by date
    const sortedHistory = [...taskHistory]
      .filter(task => task.completedStatus)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    
    if (sortedHistory.length === 0) {
      setStreakCount(0);
      setBestStreak(0);
      return;
    }
    
    // Calculate current streak
    let currentStreak = 1;
    let maxStreak = 1;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format dates to YYYY-MM-DD for comparison
    const formatDateString = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Check if most recent task was completed today or yesterday
    const mostRecentDate = new Date(sortedHistory[0].completedAt);
    const mostRecentDateStr = formatDateString(mostRecentDate);
    const todayStr = formatDateString(today);
    const yesterdayStr = formatDateString(yesterday);
    
    // If most recent task wasn't completed today or yesterday, streak is broken
    if (mostRecentDateStr !== todayStr && mostRecentDateStr !== yesterdayStr) {
      setStreakCount(0);
      // Get the best streak from history
      if (sortedHistory.length > 0) {
        // Group by date to count tasks per day
        const tasksByDate = new Map();
        sortedHistory.forEach(task => {
          const dateStr = formatDateString(new Date(task.completedAt));
          tasksByDate.set(dateStr, true);
        });
        
        // Convert to array of dates
        const dates = Array.from(tasksByDate.keys())
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        // Calculate longest streak
        let currentMax = 1;
        let current = 1;
        
        for (let i = 1; i < dates.length; i++) {
          const prevDate = new Date(dates[i-1]);
          const currDate = new Date(dates[i]);
          
          const dayDiff = Math.floor(
            (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (dayDiff === 1) {
            current++;
            currentMax = Math.max(currentMax, current);
          } else {
            current = 1;
          }
        }
        
        setBestStreak(currentMax);
      } else {
        setBestStreak(0);
      }
      setStreakPercent(0);
      return;
    }
    
    // Count consecutive days
    const dateMap = new Map();
    sortedHistory.forEach(task => {
      const dateStr = formatDateString(new Date(task.completedAt));
      dateMap.set(dateStr, true);
    });
    
    // Convert dates to array and sort
    const dates = Array.from(dateMap.keys())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    // Calculate current streak (consecutive days)
    for (let i = 0; i < dates.length - 1; i++) {
      const currentDate = new Date(dates[i]);
      const nextDate = new Date(dates[i + 1]);
      
      // Calculate difference in days
      const dayDiff = Math.floor(
        (currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Set the best streak if current is higher
    maxStreak = Math.max(currentStreak, bestStreak);
    
    // Animate if streak count changes
    if (currentStreak !== streakCount) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1500);
    }
    
    setStreakCount(currentStreak);
    setBestStreak(maxStreak);
    
    // Calculate percentage for milestone
    const nextMilestone = currentStreak < 7 ? 7 : 
                        currentStreak < 14 ? 14 : 
                        currentStreak < 30 ? 30 : 
                        currentStreak < 60 ? 60 : 100;
    
    setStreakPercent((currentStreak / nextMilestone) * 100);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={30} />
      </Box>
    );
  }
  
  const getStreakIcon = () => {
    if (streakCount >= 30) return <LocalFireDepartmentIcon fontSize="large" sx={{ color: theme.palette.error.main }} />;
    if (streakCount >= 14) return <BoltIcon fontSize="large" sx={{ color: theme.palette.warning.main }} />;
    if (streakCount >= 7) return <WhatshotIcon fontSize="large" sx={{ color: theme.palette.warning.light }} />;
    return <CheckCircleIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />;
  };
  
  const getNextMilestone = () => {
    if (streakCount < 7) return 7;
    if (streakCount < 14) return 14;
    if (streakCount < 30) return 30;
    if (streakCount < 60) return 60;
    return 100;
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        height: '100%',
        borderRadius: 2,
        background: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="medium">
          Your Streak
        </Typography>
        <Tooltip title="Complete tasks daily to build your streak" arrow>
          <Chip 
            label="Daily Streak" 
            size="small" 
            color="primary" 
            variant="outlined" 
            sx={{ ml: 'auto' }} 
          />
        </Tooltip>
      </Box>
      
      <Box 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Fade in={animate} timeout={800}>
          <Box 
            sx={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2
            }}
          >
            {getStreakIcon()}
          </Box>
        </Fade>
        
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            animation: animate ? 'pulse 1s ease-in-out' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.2)' },
              '100%': { transform: 'scale(1)' }
            }
          }}
        >
          {streakCount}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {streakCount === 0 
            ? "Start your streak today!" 
            : streakCount === 1 
              ? "1 day streak - Keep it going!"
              : `${streakCount} day streak - Great job!`}
        </Typography>
        
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Progress to {getNextMilestone()} days
            </Typography>
            <Typography variant="caption" fontWeight="medium">
              {Math.round(streakPercent)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={streakPercent} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.05)',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                borderRadius: 4,
                transition: 'transform 1s ease-in-out'
              }
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
          <EmojiEventsIcon fontSize="small" sx={{ color: theme.palette.warning.main, mr: 1 }} />
          <Typography variant="body2" fontWeight="medium">
            Best streak: {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default StreakCounter; 