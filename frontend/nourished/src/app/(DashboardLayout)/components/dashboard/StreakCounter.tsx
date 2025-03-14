'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Chip,
  LinearProgress,
  Tooltip,
  CircularProgress,
  Fade,
} from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BoltIcon from '@mui/icons-material/Bolt';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DashboardCard from '../shared/DashboardCard';

interface StreakCounterProps {
  taskHistory: Array<{
    taskId: string;
    taskTitle: string;
    completedAt: string;
    completedStatus: boolean;
  }> | null;
  isLoading: boolean;
  streakData?: {
    currentStreak: number;
    longestStreak: number;
    completionsLast7Days: number;
    completionsLast30Days: number;
    totalCompletions: number;
  };
}

const StreakCounter: React.FC<StreakCounterProps> = ({
  taskHistory,
  isLoading,
  streakData
}) => {
  const theme = useTheme();
  const [streakCount, setStreakCount] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakPercent, setStreakPercent] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (streakData) {
      // Use streak data from backend
      const currentStreak = streakData.currentStreak;
      const maxStreak = streakData.longestStreak;
      
      // Animate if streak count changes
      if (currentStreak !== streakCount) {
        setAnimate(true);
        setTimeout(() => setAnimate(false), 1500);
      }

      setStreakCount(currentStreak);
      setBestStreak(maxStreak);

      // Calculate percentage for milestone
      const nextMilestone =
        currentStreak < 7
          ? 7
          : currentStreak < 14
          ? 14
          : currentStreak < 30
          ? 30
          : currentStreak < 60
          ? 60
          : 100;

      setStreakPercent((currentStreak / nextMilestone) * 100);
    } else {
      setStreakCount(0);
      setBestStreak(0);
      setStreakPercent(0);
    }
  }, [streakData]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress size={30} />
      </Box>
    );
  }

  const getStreakIcon = () => {
    if (streakCount >= 30)
      return (
        <LocalFireDepartmentIcon
          fontSize='large'
          sx={{ color: theme.palette.error.main }}
        />
      );
    if (streakCount >= 14)
      return (
        <BoltIcon fontSize='large' sx={{ color: theme.palette.warning.main }} />
      );
    if (streakCount >= 7)
      return (
        <WhatshotIcon
          fontSize='large'
          sx={{ color: theme.palette.warning.light }}
        />
      );
    return (
      <CheckCircleIcon
        fontSize='large'
        sx={{ color: theme.palette.primary.main }}
      />
    );
  };

  const getNextMilestone = () => {
    if (streakCount < 7) return 7;
    if (streakCount < 14) return 14;
    if (streakCount < 30) return 30;
    if (streakCount < 60) return 60;
    return 100;
  };

  return (
    <DashboardCard
      title="Your Streak"
      action={
        <Tooltip title='Complete tasks daily to build your streak' arrow>
          <span>
            <Chip
              label='Daily Streak'
              size='small'
              color='primary'
              variant='outlined'
            />
          </span>
        </Tooltip>
      }
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 2
        }}
      >
        <Fade in={animate} timeout={800}>
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            {getStreakIcon()}
          </Box>
        </Fade>

        <Typography
          variant='h2'
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            animation: animate ? 'pulse 1s ease-in-out' : 'none',
            transition: 'all 0.3s ease-in-out',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)', opacity: 0.7 },
              '50%': { transform: 'scale(1.2)', opacity: 1 },
              '100%': { transform: 'scale(1)', opacity: 0.7 },
            },
          }}
        >
          {streakCount}
        </Typography>

        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          {streakCount === 0
            ? 'Start your streak today!'
            : streakCount === 1
            ? '1 day streak - Keep it going!'
            : `${streakCount} day streak - Great job!`}
        </Typography>

        <Box sx={{ width: '100%', mb: 2 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
          >
            <Typography variant='caption' color='text.secondary'>
              Progress to {getNextMilestone()} days
            </Typography>
            <Typography variant='caption' fontWeight='medium'>
              {Math.round(streakPercent)}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={streakPercent}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.05)',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                borderRadius: 4,
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: 'shimmer 2s infinite linear',
              },
              '@keyframes shimmer': {
                '0%': {
                  backgroundPosition: '-200% 0',
                },
                '100%': {
                  backgroundPosition: '200% 0',
                },
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
          <EmojiEventsIcon
            fontSize='small'
            sx={{ color: theme.palette.warning.main, mr: 1 }}
          />
          <Typography variant='body2' fontWeight='medium'>
            Best streak: {bestStreak} {bestStreak === 1 ? 'day' : 'days'}
          </Typography>
        </Box>
      </Box>
    </DashboardCard>
  );
};

export default StreakCounter;
