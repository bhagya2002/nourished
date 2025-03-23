'use client';
import { useState, useEffect, useRef } from 'react';
import { IconButton, Box, Tooltip, keyframes } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Define animations
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(126, 87, 194, 0.7);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(126, 87, 194, 0);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(126, 87, 194, 0);
    transform: scale(1);
  }
`;

const sparkle = keyframes`
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(-20px) rotate(90deg);
    opacity: 0;
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

interface DailyTipButtonProps {
  onClick: () => void;
  available?: boolean;
}

const DailyTipButton: React.FC<DailyTipButtonProps> = ({ 
  onClick, 
  available = true 
}) => {
  const [showSparkle, setShowSparkle] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Randomly show sparkle animation
  useEffect(() => {
    if (available) {
      const interval = setInterval(() => {
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 1500);
      }, 5000 + Math.random() * 3000); // Random interval between 5-8 seconds
      
      return () => clearInterval(interval);
    }
  }, [available]);

  const handleClick = () => {
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
    onClick();
  };

  return (
    <Tooltip
      title="Get your daily AI wellness tip"
      placement="left"
      arrow
    >
      <Box sx={{ position: 'relative' }}>
        {showSparkle && (
          <AutoAwesomeIcon
            sx={{
              position: 'absolute',
              color: 'primary.main',
              fontSize: '16px',
              top: 0,
              right: 0,
              animation: `${sparkle} 1.5s ease-out forwards`,
              zIndex: 1,
            }}
          />
        )}
        <IconButton
          ref={buttonRef}
          onClick={handleClick}
          color="primary"
          aria-label="Get your daily wellness tip"
          sx={{
            background: (theme) => 
              `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
            color: 'white',
            p: 1.5,
            position: 'relative',
            '&:hover': {
              background: (theme) => 
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              transform: 'scale(1.1)',
              boxShadow: 3,
            },
            animation: available ? `${pulse} 2s infinite` : 'none',
            boxShadow: 2,
            transition: 'all 0.3s ease',
            overflow: 'hidden',
          }}
        >
          {showRipple && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                animation: `${ripple} 0.6s ease-out forwards`,
              }}
            />
          )}
          <LightbulbIcon />
        </IconButton>
      </Box>
    </Tooltip>
  );
};

export default DailyTipButton; 