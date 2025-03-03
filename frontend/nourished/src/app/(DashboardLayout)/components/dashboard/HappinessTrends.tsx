"use client";
import { useState } from 'react';
import dynamic from "next/dynamic";
import { 
  Box, 
  Typography, 
  CircularProgress, 
  useTheme, 
  Paper, 
  Chip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import DashboardCard from '../shared/DashboardCard';
import { ApexOptions } from "apexcharts";
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

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
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const HappinessTrends: React.FC<HappinessTrendsProps> = ({ 
  happinessData, 
  isLoading, 
  error 
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
  
  return (
    <DashboardCard 
      title="Happiness Trends" 
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
      <Box sx={{ p: 3, height: '350px' }}>
        {(!happinessData || happinessData.length === 0) ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            textAlign: 'center',
            p: 2
          }}>
            <Typography variant="body1" color="text.secondary">
              No happiness data available yet.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Complete tasks and rate your happiness to see trends over time.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Chip 
                icon={<SentimentSatisfiedAltIcon />} 
                label="Happy" 
                color="success" 
                variant="outlined"
              />
              <Chip 
                icon={<SentimentVeryDissatisfiedIcon />} 
                label="Unhappy" 
                color="error" 
                variant="outlined"
              />
            </Box>
            <Chart
              options={chartOptions}
              series={series}
              type="line"
              height="280"
            />
          </>
        )}
      </Box>
    </DashboardCard>
  );
};

export default HappinessTrends; 