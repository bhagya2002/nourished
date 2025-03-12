'use client';
import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Paper,
  Chip,
  useTheme,
  LinearProgress,
} from '@mui/material';
import DashboardCard from '../shared/DashboardCard';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SpaIcon from '@mui/icons-material/Spa';
import SchoolIcon from '@mui/icons-material/School';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';

interface WellnessCategoriesProps {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    frequency: string;
    createdAt: string;
    category?: string;
  }>;
  isLoading: boolean;
}

interface CategoryData {
  name: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  completedCount: number;
}

const WellnessCategories: React.FC<WellnessCategoriesProps> = ({
  tasks,
  isLoading,
}) => {
  const theme = useTheme();

  const getCategoryFromTask = (taskTitle: string): string => {
    const title = taskTitle.toLowerCase();
    if (
      title.includes('exercise') ||
      title.includes('workout') ||
      title.includes('run') ||
      title.includes('gym')
    ) {
      return 'Exercise';
    } else if (
      title.includes('meditat') ||
      title.includes('mind') ||
      title.includes('relax')
    ) {
      return 'Meditation';
    } else if (
      title.includes('food') ||
      title.includes('eat') ||
      title.includes('meal') ||
      title.includes('diet')
    ) {
      return 'Nutrition';
    } else if (
      title.includes('study') ||
      title.includes('read') ||
      title.includes('learn')
    ) {
      return 'Learning';
    } else if (
      title.includes('sleep') ||
      title.includes('rest') ||
      title.includes('nap')
    ) {
      return 'Rest';
    } else if (
      title.includes('hobby') ||
      title.includes('fun') ||
      title.includes('play')
    ) {
      return 'Leisure';
    }
    return 'Other';
  };

  const getCategoryData = (): CategoryData[] => {
    const categories: CategoryData[] = [
      {
        name: 'Exercise',
        icon: <FitnessCenterIcon />,
        color: theme.palette.error.main,
        count: 0,
        completedCount: 0,
      },
      {
        name: 'Meditation',
        icon: <SelfImprovementIcon />,
        color: theme.palette.info.main,
        count: 0,
        completedCount: 0,
      },
      {
        name: 'Nutrition',
        icon: <LocalDiningIcon />,
        color: theme.palette.success.main,
        count: 0,
        completedCount: 0,
      },
      {
        name: 'Learning',
        icon: <SchoolIcon />,
        color: theme.palette.warning.main,
        count: 0,
        completedCount: 0,
      },
      {
        name: 'Rest',
        icon: <BeachAccessIcon />,
        color: theme.palette.primary.main,
        count: 0,
        completedCount: 0,
      },
      {
        name: 'Leisure',
        icon: <SpaIcon />,
        color: theme.palette.secondary.main,
        count: 0,
        completedCount: 0,
      },
      {
        name: 'Other',
        icon: null,
        color: theme.palette.grey[500],
        count: 0,
        completedCount: 0,
      },
    ];

    // Map tasks to categories
    tasks.forEach((task) => {
      const categoryName = task.category || getCategoryFromTask(task.title);
      const categoryIndex = categories.findIndex(
        (c) => c.name === categoryName
      );

      if (categoryIndex !== -1) {
        categories[categoryIndex].count++;
        if (task.completed) {
          categories[categoryIndex].completedCount++;
        }
      } else {
        // If not found, add to Other
        const otherIndex = categories.findIndex((c) => c.name === 'Other');
        categories[otherIndex].count++;
        if (task.completed) {
          categories[otherIndex].completedCount++;
        }
      }
    });

    // Filter out categories with no tasks
    return categories.filter((category) => category.count > 0);
  };

  const categoryData = getCategoryData();

  if (isLoading) {
    return (
      <DashboardCard title='Wellness Categories'>
        <Box
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title='Wellness Categories'>
      <Box sx={{ p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : categoryData.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No tasks created yet
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {categoryData.map((category, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    background: theme.palette.background.default,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease-in-out',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(45deg, ${category.color}08, ${category.color}03)`,
                      opacity: 0,
                      transition: 'opacity 0.3s ease-in-out',
                    },
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: `${category.color}40`,
                      '&::before': {
                        opacity: 1,
                      },
                      '& .MuiLinearProgress-root': {
                        transform: 'scaleX(1.02)',
                      },
                      '& .category-icon': {
                        transform: 'scale(1.1)',
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip
                      icon={React.isValidElement(category.icon) ? category.icon : undefined}
                      label={category.name}
                      sx={{
                        bgcolor: `${category.color}20`,
                        color: category.color,
                        transition: 'all 0.3s ease-in-out',
                        '& .MuiChip-icon': { 
                          color: category.color,
                          transition: 'transform 0.3s ease-in-out',
                        },
                        '&:hover .MuiChip-icon': {
                          transform: 'scale(1.1)',
                        }
                      }}
                    />

                    <Typography
                      variant="body2"
                      sx={{ ml: 'auto', fontWeight: 'medium' }}
                    >
                      {category.completedCount}/{category.count}
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={(category.completedCount / category.count) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mb: 1,
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      transform: 'scaleX(1)',
                      transition: 'all 0.3s ease-in-out',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: category.color,
                        borderRadius: 4,
                      },
                    }}
                  />

                  <Typography variant="caption" color="text.secondary">
                    {Math.round(
                      (category.completedCount / category.count) * 100
                    )}
                    % complete
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </DashboardCard>
  );
};

export default WellnessCategories;
