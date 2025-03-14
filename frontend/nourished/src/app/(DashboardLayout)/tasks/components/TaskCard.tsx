'use client';
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Chip,
  Fade,
  styled,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

// Styled components for enhanced UI
const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '12px',
  overflow: 'visible', // Allow child elements to overflow for animations
}));

const TaskStatusIcon = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: '12px',
  right: '12px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.1) rotate(10deg)',
  },
}));

const FrequencyChip = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: '12px',
  left: '12px',
  fontSize: '0.75rem',
  height: '24px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    frequency?: string;
  };
  onComplete: (taskId: string) => Promise<void>;
  onEdit: (task: any) => void;
  onDelete: (taskId: string) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onComplete,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onComplete(task.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit(task);
  };

  const handleDelete = async () => {
    handleMenuClose();
    await onDelete(task.id);
  };

  return (
    <Fade in={true} timeout={500}>
      <StyledCard>
        <CardContent 
          sx={{ 
            position: 'relative', 
            pt: 5, 
            pb: 2,
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: (theme) => 
                task.completed 
                  ? theme.palette.success.main 
                  : theme.palette.primary.main,
              transition: 'background-color 0.3s ease-in-out',
              opacity: task.completed ? 1 : 0.7,
            },
          }}
        >
          {task.frequency && (
            <FrequencyChip
              label={task.frequency}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          
          <TaskStatusIcon
            onClick={handleComplete}
            color={task.completed ? 'success' : 'default'}
            disabled={isLoading}
            sx={{
              animation: isLoading ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': {
                  transform: 'rotate(0deg)',
                },
                '100%': {
                  transform: 'rotate(360deg)',
                },
              },
            }}
          >
            {task.completed ? (
              <CheckCircleIcon />
            ) : (
              <RadioButtonUncheckedIcon />
            )}
          </TaskStatusIcon>

          <Typography
            variant="h6"
            sx={{
              mb: 1,
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? 'text.secondary' : 'text.primary',
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {task.title}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textDecoration: task.completed ? 'line-through' : 'none',
              opacity: task.completed ? 0.7 : 1,
              transition: 'all 0.3s ease-in-out',
            }}
          >
            {task.description}
          </Typography>

          <Box sx={{ position: 'absolute', right: 8, bottom: 8 }}>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                opacity: 0.6,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { 
                  opacity: 1,
                  transform: 'rotate(90deg)',
                },
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            TransitionComponent={Fade}
            sx={{
              '& .MuiPaper-root': {
                borderRadius: '8px',
                minWidth: '120px',
                boxShadow: (theme) => theme.shadows[4],
              },
            }}
          >
            <MenuItem 
              onClick={handleEdit}
              sx={{
                transition: 'background-color 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              Edit
            </MenuItem>
            <MenuItem 
              onClick={handleDelete} 
              sx={{ 
                color: 'error.main',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'error.lighter',
                },
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </CardContent>
      </StyledCard>
    </Fade>
  );
};

export default TaskCard; 