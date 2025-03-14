'use client';
import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AddTaskIcon from '@mui/icons-material/AddTask';

interface EmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  hasFilters = false,
  onClearFilters,
}) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          borderRadius: '16px',
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            top: '-100px',
            right: '-80px',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 70%, transparent 100%)`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            bottom: '-60px',
            left: '-30px',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 70%, transparent 100%)`,
          }}
        />
        
        {/* Icon */}
        <Box 
          sx={{ 
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: alpha(theme.palette.primary.main, 0.1),
            margin: '0 auto 24px',
            color: theme.palette.primary.main,
          }}
        >
          <EventNoteIcon sx={{ fontSize: 40 }} />
        </Box>
        
        <Typography 
          variant="h5" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            mb: 1,
            color: theme.palette.text.primary,
          }}
        >
          {hasFilters ? 'No results found' : 'No completed tasks yet'}
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            mb: 4,
            maxWidth: '500px',
            mx: 'auto',
            lineHeight: 1.6,
          }}
        >
          {hasFilters
            ? 'Try adjusting your filters to see more results or clear the filters to see all completed tasks.'
            : 'Start completing tasks to build your task history. Completed tasks will appear here so you can track your progress.'}
        </Typography>
        
        {hasFilters ? (
          <Button
            variant="contained"
            color="primary"
            onClick={onClearFilters}
            sx={{
              px: 3,
              py: 1,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: theme.shadows[2],
              '&:hover': {
                boxShadow: theme.shadows[4],
              },
            }}
          >
            Clear Filters
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            component={Link}
            href="/tasks"
            startIcon={<AddTaskIcon />}
            sx={{
              px: 3,
              py: 1,
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: theme.shadows[2],
              '&:hover': {
                boxShadow: theme.shadows[4],
              },
            }}
          >
            Go to Tasks
          </Button>
        )}
      </Paper>
    </motion.div>
  );
};

export default EmptyState; 