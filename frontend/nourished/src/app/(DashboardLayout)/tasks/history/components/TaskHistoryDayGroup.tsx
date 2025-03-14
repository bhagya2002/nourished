'use client';
import React from 'react';
import {
  Box,
  Typography,
  Divider,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { motion } from 'framer-motion';
import TaskHistoryCard from './TaskHistoryCard';

interface TaskHistoryDayGroupProps {
  date: string;
  tasks: any[];
  index: number;
}

const TaskHistoryDayGroup: React.FC<TaskHistoryDayGroupProps> = ({
  date,
  tasks,
  index,
}) => {
  const theme = useTheme();
  
  // Format the date for display
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  // Calculate how many days ago this was
  const getDaysAgo = (dateString: string) => {
    const today = new Date();
    const taskDate = new Date(dateString);
    
    // Reset time part for accurate day calculation
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - taskDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };
  
  const daysAgo = getDaysAgo(date);
  
  // Calculate how many tasks were completed this day
  const taskCount = tasks.length;
  
  // Animation variants for staggered children animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1 * index,
      },
    },
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Box sx={{ mb: 4 }}>
        {/* Date header with days ago indicator */}
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            position: 'relative',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <CalendarTodayIcon 
              sx={{ 
                color: theme.palette.primary.main,
                opacity: 0.8,
              }} 
            />
            
            <Box>
              <Typography 
                variant="h6" 
                component="h2"
                sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  lineHeight: 1.3,
                }}
              >
                {formattedDate}
              </Typography>
              
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontWeight: 500,
                  }}
                >
                  {daysAgo}
                </Typography>
                
                <Box 
                  component="span" 
                  sx={{ 
                    width: '4px', 
                    height: '4px', 
                    borderRadius: '50%', 
                    backgroundColor: 'text.disabled' 
                  }} 
                />
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                  }}
                >
                  {taskCount} {taskCount === 1 ? 'task' : 'tasks'} completed
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        
        {/* Divider line */}
        <Divider 
          sx={{ 
            mb: 3,
            opacity: 0.7,
            background: alpha(theme.palette.primary.main, 0.1),
          }} 
        />
        
        {/* Task cards for this day */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <Stack spacing={2}>
            {tasks.map((task) => (
              <TaskHistoryCard key={task.id} task={task} />
            ))}
          </Stack>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default TaskHistoryDayGroup; 