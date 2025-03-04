"use client";
import React from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Chip,
  Grid,
  Skeleton,
  LinearProgress,
  Paper
} from '@mui/material';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import DashboardCard from '../shared/DashboardCard';

interface HappinessOverviewProps {
  happinessData: Array<{
    date: string;
    rating: number;
    taskId?: string;
    taskTitle?: string;
  }> | null;
  isLoading: boolean;
  error: string | null;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getHappinessIcon = (value: number) => {
  switch(Math.round(value)) {
    case 1: return <SentimentVeryDissatisfiedIcon fontSize="small" color="error" />;
    case 2: return <SentimentDissatisfiedIcon fontSize="small" color="warning" />;
    case 3: return <SentimentNeutralIcon fontSize="small" color="info" />;
    case 4: return <SentimentSatisfiedIcon fontSize="small" color="success" />;
    case 5: return <SentimentSatisfiedAltIcon fontSize="small" color="success" />;
    default: return <SentimentNeutralIcon fontSize="small" />;
  }
};

const getHappinessLabel = (value: number) => {
  switch(Math.round(value)) {
    case 1: return "Very Unhappy";
    case 2: return "Unhappy";
    case 3: return "Neutral";
    case 4: return "Happy";
    case 5: return "Very Happy";
    default: return "Neutral";
  }
};

const calculateAverageHappiness = (data: HappinessOverviewProps['happinessData']) => {
  if (!data || data.length === 0) return 0;
  const sum = data.reduce((acc, item) => acc + item.rating, 0);
  return sum / data.length;
};

// Custom simple bar component to replace recharts
const SimpleBar = ({ value, maxValue, color, label }: { value: number, maxValue: number, color: string, label: string }) => {
  const percentage = (value / maxValue) * 100;
  
  return (
    <Box sx={{ mb: 1.5, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight="medium">{value.toFixed(1)}</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          backgroundColor: 'rgba(0,0,0,0.05)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 4,
          }
        }}
      />
    </Box>
  );
};

const HappinessOverview: React.FC<HappinessOverviewProps> = ({ happinessData, isLoading, error }) => {
  const theme = useTheme();
  
  // Calculate average happiness
  const averageHappiness = happinessData ? calculateAverageHappiness(happinessData) : 0;
  
  // Prepare data (make sure they're in date order)
  const sortedData = happinessData 
    ? [...happinessData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];
  
  // Get trend data (last 7 days if available)
  const recentData = sortedData.slice(Math.max(0, sortedData.length - 7));
  
  // Calculate counts for each rating level (1-5)
  const ratingCounts = [0, 0, 0, 0, 0]; // index 0 = rating 1, index 4 = rating 5
  if (happinessData) {
    happinessData.forEach(item => {
      const ratingIndex = Math.round(item.rating) - 1;
      if (ratingIndex >= 0 && ratingIndex < 5) {
        ratingCounts[ratingIndex]++;
      }
    });
  }
  
  if (isLoading) {
    return (
      <DashboardCard title="Your Happiness">
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rectangular" height={20} width="60%" sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={20} width="40%" sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" height={200} width="100%" />
        </Box>
      </DashboardCard>
    );
  }
  
  if (error) {
    return (
      <DashboardCard title="Your Happiness">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </DashboardCard>
    );
  }
  
  if (!happinessData || happinessData.length === 0) {
    return (
      <DashboardCard title="Your Happiness">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No happiness data available yet. Complete tasks and rate your happiness to see insights here.
          </Typography>
        </Box>
      </DashboardCard>
    );
  }
  
  // Calculate trend (comparing first and last items in recent data)
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (recentData.length >= 2) {
    const first = recentData[0].rating;
    const last = recentData[recentData.length - 1].rating;
    if (last > first) trend = 'up';
    else if (last < first) trend = 'down';
  }
  
  // Get the most recent ratings (up to 5)
  const latestRatings = [...happinessData]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  return (
    <DashboardCard 
      title="Your Happiness" 
      action={
        <Chip 
          label={`${happinessData.length} ratings`} 
          size="small" 
          variant="outlined" 
          color="primary" 
        />
      }
    >
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={6}>
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <Typography variant="h2" color="primary" gutterBottom>
                {averageHappiness.toFixed(1)}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                {getHappinessIcon(averageHappiness)}
                <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                  Average Happiness
                </Typography>
              </Box>
              <Chip 
                label={trend === 'up' ? 'Trending Up 🚀' : trend === 'down' ? 'Trending Down 📉' : 'Stable 🔄'} 
                size="small" 
                color={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default'} 
                variant="outlined"
              />
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom align="left">Rating Distribution</Typography>
                <SimpleBar value={ratingCounts[4]} maxValue={Math.max(...ratingCounts, 1)} color={theme.palette.success.main} label="Very Happy (5)" />
                <SimpleBar value={ratingCounts[3]} maxValue={Math.max(...ratingCounts, 1)} color={theme.palette.success.light} label="Happy (4)" />
                <SimpleBar value={ratingCounts[2]} maxValue={Math.max(...ratingCounts, 1)} color={theme.palette.info.main} label="Neutral (3)" />
                <SimpleBar value={ratingCounts[1]} maxValue={Math.max(...ratingCounts, 1)} color={theme.palette.warning.main} label="Unhappy (2)" />
                <SimpleBar value={ratingCounts[0]} maxValue={Math.max(...ratingCounts, 1)} color={theme.palette.error.main} label="Very Unhappy (1)" />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={6}>
            <Typography variant="subtitle2" gutterBottom>Recent Happiness Ratings</Typography>
            <Box sx={{ mt: 2 }}>
              {latestRatings.map((rating, index) => (
                <Paper 
                  key={index} 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 1.5, 
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.default,
                    border: '1px solid',
                    borderColor: theme.palette.divider
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {rating.taskTitle || "Task"}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(rating.date)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary" sx={{ mr: 0.5 }}>
                        {rating.rating}
                      </Typography>
                      {getHappinessIcon(rating.rating)}
                    </Box>
                  </Box>
                </Paper>
              ))}
              
              {latestRatings.length === 0 && (
                <Typography variant="body2" color="textSecondary" align="center">
                  No recent ratings available.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="textSecondary" align="center">
          Your happiness ratings help us understand the impact of tasks on your well-being.
        </Typography>
      </CardContent>
    </DashboardCard>
  );
};

export default HappinessOverview; 