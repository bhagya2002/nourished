'use client';
import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  useTheme,
  alpha,
  Tooltip,
  Card,
} from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';

interface TaskSummaryProps {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    frequency?: string;
  }>;
}

const TaskSummary: React.FC<TaskSummaryProps> = ({ tasks }) => {
  const theme = useTheme();
  
  // Calculate task statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Count by frequency
    const dailyTasks = tasks.filter(task => task.frequency === 'Daily').length;
    const weeklyTasks = tasks.filter(task => task.frequency === 'Weekly').length;
    const monthlyTasks = tasks.filter(task => task.frequency === 'Monthly').length;
    
    return {
      total,
      completed,
      pending,
      completionRate,
      dailyTasks,
      weeklyTasks,
      monthlyTasks
    };
  }, [tasks]);
  
  // Skip rendering if no tasks
  if (stats.total === 0) return null;
  
  return (
    <motion.div
      whileHover={{ 
        translateY: -4,
        transition: { duration: 0.3 }
      }}
    >
      <Card
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: '16px',
          background: theme.palette.background.default,
          border: '1px solid',
          borderColor: theme.palette.divider,
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            boxShadow: `0 4px 20px 0 ${theme.palette.mode === 'dark' 
              ? 'rgba(0,0,0,0.12)' 
              : 'rgba(0,0,0,0.05)'}`,
            borderRadius: 'inherit',
            transition: 'opacity 0.3s ease-in-out',
            opacity: 0,
            zIndex: -1,
          },
          '&:hover': {
            borderColor: theme.palette.primary.light,
            '&::before': {
              opacity: 1,
            }
          }
        }}
      >
        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
            zIndex: 0,
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              mb: 3,
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            Task Summary
          </Typography>
          
          <Grid container spacing={3}>
            {/* Completion Rate */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Completion Rate
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="primary.main">
                    {stats.completionRate}%
                  </Typography>
                </Box>
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.5 }}
                >
                  <LinearProgress
                    variant="determinate"
                    value={stats.completionRate}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      },
                    }}
                  />
                </motion.div>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
                <Tooltip title="Completed Tasks">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 24 }} />
                    <Typography variant="body1" fontWeight={500}>
                      {stats.completed} Completed
                    </Typography>
                  </Box>
                </Tooltip>
                
                <Tooltip title="Pending Tasks">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PendingIcon sx={{ color: theme.palette.warning.main, fontSize: 24 }} />
                    <Typography variant="body1" fontWeight={500}>
                      {stats.pending} Pending
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            </Grid>
            
            {/* Task Frequency */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TodayIcon sx={{ color: theme.palette.info.main, fontSize: 24 }} />
                  <Typography variant="body1" fontWeight={500} sx={{ flex: 1 }}>
                    Daily Tasks
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {stats.dailyTasks}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DateRangeIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                  <Typography variant="body1" fontWeight={500} sx={{ flex: 1 }}>
                    Weekly Tasks
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {stats.weeklyTasks}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DateRangeIcon sx={{ color: theme.palette.secondary.main, fontSize: 24 }} />
                  <Typography variant="body1" fontWeight={500} sx={{ flex: 1 }}>
                    Monthly Tasks
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {stats.monthlyTasks}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </motion.div>
  );
};

export default TaskSummary; 