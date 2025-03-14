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
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FlagIcon from '@mui/icons-material/Flag';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { Goal } from '../page';

interface GoalSummaryProps {
  goals: Goal[];
}

const GoalSummary: React.FC<GoalSummaryProps> = ({ goals }) => {
  const theme = useTheme();
  
  // Calculate goal statistics
  const stats = useMemo(() => {
    const total = goals.length;
    
    // Calculate goals with completed tasks
    const completedGoals = goals.filter(goal => 
      goal.totalTasks > 0 && goal.completedTasks === goal.totalTasks
    ).length;
    
    // Goals in progress (have tasks but not all completed)
    const inProgressGoals = goals.filter(goal => 
      goal.totalTasks > 0 && goal.completedTasks > 0 && goal.completedTasks < goal.totalTasks
    ).length;
    
    // Goals not started (have tasks but none completed)
    const notStartedGoals = goals.filter(goal => 
      goal.totalTasks > 0 && goal.completedTasks === 0
    ).length;

    // Goals with no tasks
    const plannedGoals = goals.filter(goal => goal.totalTasks === 0).length;
    
    // Overall completion rate - fixed calculation
    const totalTasks = goals.reduce((sum, goal) => {
      return sum + (goal.tasks?.length || 0);
    }, 0);
    
    const completedTasks = goals.reduce((sum, goal) => {
      return sum + (goal.tasks?.filter(t => t.completed)?.length || 0);
    }, 0);
    
    // Calculate completion rate, ensure we don't divide by zero
    let completionRate = 0;
    if (totalTasks > 0) {
      completionRate = Math.round((completedTasks / totalTasks) * 100);
    }
    
    // Enhanced debug logs to help identify issues
    console.log('Goal progress calculation:', {
      goals: goals.map(g => ({
        id: g.id,
        title: g.title,
        totalTasks: g.totalTasks,
        completedTasks: g.completedTasks,
        tasksLength: g.tasks?.length || 0,
        completedTasksCount: g.tasks?.filter(t => t.completed).length || 0
      })),
      totalTasks,
      completedTasks,
      completionRate
    });
    
    // Upcoming deadlines (within next 7 days)
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    
    const upcomingDeadlines = goals.filter(goal => {
      const deadline = new Date(goal.deadline);
      return deadline >= now && deadline <= nextWeek;
    }).length;
    
    return {
      total,
      completedGoals,
      inProgressGoals,
      notStartedGoals,
      plannedGoals,
      completionRate,
      totalTasks,
      completedTasks,
      upcomingDeadlines
    };
  }, [goals]);
  
  // Skip rendering if no goals
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
        
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            left: -10,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
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
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FlagIcon color="primary" />
            Goal Overview
          </Typography>
          
          <Grid container spacing={3}>
            {/* Progress Section */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Overall Progress
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
              
              <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
                <Tooltip title="Completed Goals">
                  <Chip
                    icon={<AssignmentTurnedInIcon />}
                    label={`${stats.completedGoals} Completed`}
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Tooltip>
                
                <Tooltip title="In Progress Goals">
                  <Chip
                    icon={<AssignmentIcon />}
                    label={`${stats.inProgressGoals} In Progress`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Tooltip>
                
                <Tooltip title="Not Started Goals">
                  <Chip
                    icon={<CalendarTodayIcon />}
                    label={`${stats.notStartedGoals} Not Started`}
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                  />
                </Tooltip>
              </Box>
            </Grid>
            
            {/* Stats Section */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlagIcon sx={{ color: theme.palette.info.main, fontSize: 24 }} />
                  <Typography variant="body1" fontWeight={500} sx={{ flex: 1 }}>
                    Total Goals
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {stats.total}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                  <Typography variant="body1" fontWeight={500} sx={{ flex: 1 }}>
                    Associated Tasks
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {stats.totalTasks}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventAvailableIcon sx={{ color: theme.palette.secondary.main, fontSize: 24 }} />
                  <Typography variant="body1" fontWeight={500} sx={{ flex: 1 }}>
                    Upcoming Deadlines
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {stats.upcomingDeadlines}
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

export default GoalSummary; 