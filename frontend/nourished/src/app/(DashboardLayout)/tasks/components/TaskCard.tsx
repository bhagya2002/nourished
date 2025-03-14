'use client';
import React, { useState, useEffect } from 'react';
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
  alpha,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { motion, AnimatePresence } from 'framer-motion';

// Import task-related icons
import BookIcon from '@mui/icons-material/Book';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SchoolIcon from '@mui/icons-material/School';
import WorkIcon from '@mui/icons-material/Work';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ComputerIcon from '@mui/icons-material/Computer';
import SpaIcon from '@mui/icons-material/Spa';
import PetsIcon from '@mui/icons-material/Pets';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

// Styled components for enhanced UI
const StyledCard = styled(motion.div)(({ theme }) => ({
  position: 'relative',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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

// Function to determine the appropriate icon based on task title
const getTaskIcon = (title: string) => {
  const lowercaseTitle = title.toLowerCase();
  
  // Map of keywords to icons
  const iconMap: { [key: string]: React.ReactElement } = {
    // Reading, Books, Library
    book: <BookIcon />,
    read: <BookIcon />,
    library: <LocalLibraryIcon />,
    study: <SchoolIcon />,
    
    // Exercise, Fitness
    workout: <FitnessCenterIcon />,
    exercise: <FitnessCenterIcon />,
    gym: <FitnessCenterIcon />,
    fitness: <FitnessCenterIcon />,
    run: <DirectionsRunIcon />,
    jog: <DirectionsRunIcon />,
    walk: <DirectionsRunIcon />,
    
    // Food, Nutrition
    eat: <RestaurantIcon />,
    meal: <RestaurantIcon />,
    food: <RestaurantIcon />,
    cook: <RestaurantIcon />,
    diet: <RestaurantIcon />,
    
    // Education
    class: <SchoolIcon />,
    course: <SchoolIcon />,
    homework: <SchoolIcon />,
    learn: <SchoolIcon />,
    
    // Work
    work: <WorkIcon />,
    job: <WorkIcon />,
    meeting: <WorkIcon />,
    email: <EmailIcon />,
    call: <LocalPhoneIcon />,
    phone: <LocalPhoneIcon />,
    
    // Home
    home: <HomeIcon />,
    house: <HomeIcon />,
    clean: <CleaningServicesIcon />,
    laundry: <CleaningServicesIcon />,
    
    // Shopping
    shop: <ShoppingCartIcon />,
    buy: <ShoppingCartIcon />,
    purchase: <ShoppingCartIcon />,
    grocery: <ShoppingCartIcon />,
    
    // Health
    medicine: <LocalHospitalIcon />,
    doctor: <LocalHospitalIcon />,
    health: <LocalHospitalIcon />,
    meditate: <SpaIcon />,
    meditation: <SpaIcon />,
    
    // Entertainment
    music: <MusicNoteIcon />,
    play: <MusicNoteIcon />,
    
    // Technology
    computer: <ComputerIcon />,
    code: <ComputerIcon />,
    program: <ComputerIcon />,
    
    // Pets
    pet: <PetsIcon />,
    dog: <PetsIcon />,
    cat: <PetsIcon />,
    
    // Events
    event: <EventIcon />,
    appointment: <EventIcon />,
    
    // Finance
    money: <AttachMoneyIcon />,
    pay: <AttachMoneyIcon />,
    bill: <AttachMoneyIcon />,
  };
  
  // Check if any keyword is in the title
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (lowercaseTitle.includes(keyword)) {
      return icon;
    }
  }
  
  // Default icon if no match
  return <TaskAltIcon />;
};

// Confetti animation component
const Confetti = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: '50%', 
                y: '50%', 
                scale: 0,
                opacity: 1
              }}
              animate={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`, 
                scale: Math.random() * 0.5 + 0.5,
                opacity: 0
              }}
              transition={{ 
                duration: 1 + Math.random(), 
                ease: "easeOut" 
              }}
              style={{
                position: 'absolute',
                width: 8,
                height: 8,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                backgroundColor: [
                  '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', 
                  '#FFC107', '#FF9800', '#FF5722', '#F44336',
                  '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
                  '#2196F3', '#03A9F4', '#00BCD4', '#009688'
                ][Math.floor(Math.random() * 16)],
              }}
            />
          ))}
        </Box>
      )}
    </AnimatePresence>
  );
};

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
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [wasJustCompleted, setWasJustCompleted] = useState(false);

  // Reset wasJustCompleted when task changes
  useEffect(() => {
    setWasJustCompleted(false);
  }, [task.id]);

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
    
    // If we're completing (not uncompleting), show animation
    if (!task.completed) {
      setIsCompleting(true);
      setShowConfetti(true);
      
      // Set wasJustCompleted to true to keep the card visible during animation
      setWasJustCompleted(true);
      
      // Hide confetti after animation completes
      setTimeout(() => {
        setShowConfetti(false);
      }, 1500);
    }
    
    try {
      await onComplete(task.id);
    } finally {
      setIsLoading(false);
      
      // If we just completed the task, keep the animation state for a moment
      if (isCompleting) {
        setTimeout(() => {
          setIsCompleting(false);
        }, 1000);
      }
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

  // We want to show all tasks, including completed ones if showCompleted is true
  // This is now controlled by the parent component's filteredTasks logic
  
  return (
    <Fade in={true} timeout={500}>
      <Card
        component={motion.div}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          scale: isCompleting ? 1.03 : 1,
          boxShadow: isCompleting ? '0 8px 24px rgba(0,0,0,0.15)' : undefined
        }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
        whileHover={{ 
          translateY: -4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}
        transition={{ 
          duration: 0.3,
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          borderRadius: '12px',
          overflow: 'visible',
        }}
      >
        <Confetti isVisible={showConfetti} />
        
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
                task.completed || isCompleting
                  ? theme.palette.success.main 
                  : theme.palette.primary.main,
              transition: 'background-color 0.3s ease-in-out',
              opacity: task.completed || isCompleting ? 1 : 0.7,
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
            color={(task.completed || isCompleting) ? 'success' : 'default'}
            disabled={isLoading}
            sx={{
              animation: isLoading ? 'spin 1s linear infinite' : isCompleting ? 'pulse 0.5s ease-in-out' : 'none',
              '@keyframes spin': {
                '0%': {
                  transform: 'rotate(0deg)',
                },
                '100%': {
                  transform: 'rotate(360deg)',
                },
              },
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1)',
                },
                '50%': {
                  transform: 'scale(1.3)',
                },
                '100%': {
                  transform: 'scale(1)',
                },
              },
            }}
          >
            {task.completed || isCompleting ? (
              <CheckCircleIcon />
            ) : (
              <RadioButtonUncheckedIcon />
            )}
          </TaskStatusIcon>

          {/* Task Icon based on title */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 1.5,
              color: (theme) => task.completed || isCompleting ? theme.palette.text.secondary : theme.palette.primary.main
            }}
          >
            {getTaskIcon(task.title)}
          </Box>

          <Typography
            variant="h6"
            component={motion.h3}
            animate={{ 
              textDecoration: (task.completed || isCompleting) ? 'line-through' : 'none',
              color: (task.completed || isCompleting) ? 'text.secondary' : 'text.primary',
            }}
            transition={{ duration: 0.3 }}
            sx={{ mb: 1 }}
          >
            {task.title}
          </Typography>

          <Typography
            variant="body2"
            component={motion.p}
            animate={{ 
              textDecoration: (task.completed || isCompleting) ? 'line-through' : 'none',
              opacity: (task.completed || isCompleting) ? 0.7 : 1,
            }}
            transition={{ duration: 0.3 }}
            color="text.secondary"
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
      </Card>
    </Fade>
  );
};

export default TaskCard; 