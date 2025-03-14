'use client';
import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { AddComment, GroupsRounded } from '@mui/icons-material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  borderRadius: 16,
  backgroundColor: theme.palette.background.paper,
  boxShadow: 'none',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  position: 'relative',
  overflow: 'hidden',
}));

const IconContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  width: 80,
  height: 80,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
}));

const BackgroundPattern = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0.03,
  backgroundImage: `radial-gradient(${theme.palette.primary.main} 2px, transparent 2px)`,
  backgroundSize: '24px 24px',
  pointerEvents: 'none',
  zIndex: 0,
}));

interface EmptyStateProps {
  onAddPost: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddPost }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StyledPaper>
        {/* Background pattern */}
        <BackgroundPattern />
        
        {/* Decorative gradient shapes */}
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 70%)`,
            zIndex: 0,
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            left: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.15)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 70%)`,
            zIndex: 0,
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <IconContainer>
              <GroupsRounded sx={{ fontSize: 40 }} />
            </IconContainer>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Typography 
              variant="h4" 
              fontWeight={700} 
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Friend Circle
            </Typography>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mb: 4 }}>
              Share your journey with friends and celebrate achievements together. 
              Create posts, engage with others, and stay motivated as a community.
            </Typography>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddComment />}
              onClick={onAddPost}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: theme.shadows[3],
                px: 3,
                py: 1,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              Create Your First Post
            </Button>
          </motion.div>
        </Box>
      </StyledPaper>
    </motion.div>
  );
};

export default EmptyState; 