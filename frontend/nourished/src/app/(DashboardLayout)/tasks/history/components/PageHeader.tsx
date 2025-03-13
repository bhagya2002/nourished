'use client';
import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
}) => {
  const theme = useTheme();
  const router = useRouter();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box 
        sx={{ 
          mb: 4, 
          position: 'relative',
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Tooltip title="Go back to tasks">
          <IconButton
            onClick={() => router.push('/tasks')}
            size="medium"
            color="primary"
            sx={{
              mr: { xs: 0, sm: 2 },
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              transition: 'all 0.2s',
              '&:hover': { 
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'translateX(-2px)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
              lineHeight: 1.2,
              mt: { xs: 1, sm: 0 },
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}
          >
            {title}
          </Typography>
          
          {subtitle && (
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{
                mt: 0.5,
                fontWeight: 400,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                maxWidth: '650px',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

export default PageHeader; 