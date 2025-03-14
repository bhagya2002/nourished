"use client";
import { useState } from 'react';
import dynamic from "next/dynamic";
import { 
  Box, 
  Typography, 
  CircularProgress, 
  useTheme, 
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Grid
} from '@mui/material';
import DashboardCard from '../shared/DashboardCard';
import { ApexOptions } from "apexcharts";
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';

// Dynamically import ApexCharts to prevent SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface HappinessTrendsProps {
  happinessData: Array<{
    date: string;
    rating: number;
    taskId?: string;
    taskTitle?: string;
  }> | null;
  isLoading: boolean;
  error: string | null;
  showOverview?: boolean; // Make it optional with default value
}

// Helper function to calculate average happiness
const calculateAverageHappiness = (data: Array<{ rating: number }>) => {
  if (data.length === 0) return 0;
  const sum = data.reduce((total, item) => total + item.rating, 0);
  return parseFloat((sum / data.length).toFixed(1));
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const HappinessTrends: React.FC<HappinessTrendsProps> = ({ 
  happinessData, 
  isLoading, 
  error,
  showOverview = true // Default to true
}) => {
  const theme = useTheme();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  
  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeframe: 'week' | 'month' | null,
  ) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };
  
  const getChartData = () => {
    if (!happinessData || happinessData.length === 0) {
      return {
        dates: [],
        ratings: []
      };
    }
    
    // Determine date range based on timeframe
    const today = new Date();
    const startDate = new Date();
    
    if (timeframe === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else {
      startDate.setDate(today.getDate() - 30);
    }
    
    // Filter data within the timeframe
    const filteredData = happinessData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= today;
    });
    
    // Sort data by date
    const sortedData = [...filteredData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Group by date and average ratings
    const dateMap = new Map();
    
    sortedData.forEach(item => {
      const dateStr = new Date(item.date).toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { sum: item.rating, count: 1 });
      } else {
        const current = dateMap.get(dateStr);
        dateMap.set(dateStr, { 
          sum: current.sum + item.rating,
          count: current.count + 1
        });
      }
    });
    
    // Calculate averages and prepare data for chart
    const dates: string[] = [];
    const ratings: number[] = [];
    
    dateMap.forEach((value, key) => {
      const avgRating = value.sum / value.count;
      dates.push(formatDate(key));
      ratings.push(parseFloat(avgRating.toFixed(1)));
    });
    
    return { dates, ratings };
  };
  
  const { dates, ratings } = getChartData();
  
  const chartOptions: ApexOptions = {
    chart: {
      id: 'happiness-trends',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout' as const,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      dropShadow: {
        enabled: true,
        top: 3,
        left: 0,
        blur: 4,
        opacity: 0.2
      }
    },
    colors: ['#FF9800'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    grid: {
      borderColor: theme.palette.divider,
      row: {
        colors: ['transparent', 'transparent'],
        opacity: 0.2
      },
      xaxis: {
        lines: {
          show: false
        }
      },
    },
    markers: {
      size: 6,
      colors: ['#ffffff'],
      strokeColors: '#FF9800',
      strokeWidth: 3
    },
    xaxis: {
      categories: dates,
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    yaxis: {
      min: 1,
      max: 5,
      tickAmount: 4,
      labels: {
        style: {
          colors: theme.palette.text.secondary
        },
        formatter: (value: number) => {
          return value.toString();
        }
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (value: number) => {
          return `${value} / 5`;
        }
      }
    },
    annotations: {
      yaxis: [
        {
          y: 3,
          borderColor: theme.palette.divider,
          borderWidth: 1,
          strokeDashArray: 5,
          label: {
            text: 'Neutral',
            position: 'left',
            style: {
              color: theme.palette.text.secondary,
              background: 'transparent'
            }
          }
        }
      ]
    }
  };
  
  const series = [
    {
      name: 'Happiness Rating',
      data: ratings
    }
  ];
  
  if (isLoading) {
    return (
      <DashboardCard title="Happiness Trends">
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px' }}>
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }
  
  if (error) {
    return (
      <DashboardCard title="Happiness Trends">
        <Box sx={{ p: 3, textAlign: 'center', height: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography color="error" variant="body1">{error}</Typography>
        </Box>
      </DashboardCard>
    );
  }
  
  if (!happinessData || happinessData.length === 0) {
    return (
      <DashboardCard title="Happiness Trends">
        <Box sx={{ p: 3, textAlign: 'center', height: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No happiness data available yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Complete tasks and rate your happiness to see trends here.
          </Typography>
        </Box>
      </DashboardCard>
    );
  }
  
  // Sort data by date
  const sortedData = [...happinessData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate average happiness
  const averageHappiness = calculateAverageHappiness(happinessData);
  
  // Get emotion icon based on happiness rating
  const getEmotionIcon = (rating: number) => {
    if (rating >= 4.5) return <SentimentSatisfiedAltIcon sx={{ color: theme.palette.success.main, fontSize: 40 }} />;
    if (rating >= 3.5) return <SentimentSatisfiedIcon sx={{ color: theme.palette.success.light, fontSize: 40 }} />;
    if (rating >= 2.5) return <SentimentNeutralIcon sx={{ color: theme.palette.warning.main, fontSize: 40 }} />;
    if (rating >= 1.5) return <SentimentDissatisfiedIcon sx={{ color: theme.palette.warning.dark, fontSize: 40 }} />;
    return <SentimentVeryDissatisfiedIcon sx={{ color: theme.palette.error.main, fontSize: 40 }} />;
  };
  
  return (
    <DashboardCard 
      title="Happiness Insights"
      action={
        <ToggleButtonGroup
          size="small"
          value={timeframe}
          exclusive
          onChange={handleTimeframeChange}
          aria-label="timeframe"
        >
          <ToggleButton value="week" aria-label="week view">
            Week
          </ToggleButton>
          <ToggleButton value="month" aria-label="month view">
            Month
          </ToggleButton>
        </ToggleButtonGroup>
      }
    >
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {/* Happiness Overview Card - only shown if showOverview is true */}
          {showOverview && (
            <Grid item xs={12} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.palette.background.default
                }}
              >
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Average Rating
                </Typography>
                {getEmotionIcon(averageHappiness)}
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, mb: 0.5 }}>
                  {averageHappiness}/5
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  from {happinessData.length} ratings
                </Typography>
              </Paper>
            </Grid>
          )}
          
          {/* Happiness Trends Chart */}
          <Grid item xs={12} md={showOverview ? 9 : 12}>
            <Box sx={{ height: '350px' }}>
              {series[0].data.length > 0 ? (
                <Chart
                  options={chartOptions}
                  series={series}
                  type="line"
                  height="350px"
                />
              ) : (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'center', 
                  alignItems: 'center',
                  color: 'text.secondary'
                }}>
                  <Typography variant="body1">
                    Not enough data for this time period
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Try changing to a different timeframe or complete more tasks
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </DashboardCard>
  );
};

export default HappinessTrends; 