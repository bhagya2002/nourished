"use client";
import { useState } from 'react';
import dynamic from "next/dynamic";
import { useTheme, Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton } from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts to prevent SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TaskCompletionTrendsProps {
  taskHistory: Array<{
    taskId: string;
    taskTitle: string;
    completedAt: string;
    completedStatus: boolean;
  }> | null;
  isLoading: boolean;
  error: string | null;
}

const TaskCompletionTrends: React.FC<TaskCompletionTrendsProps> = ({ 
  taskHistory, 
  isLoading, 
  error 
}) => {
  const theme = useTheme();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  
  // Process data for chart
  const getChartData = () => {
    // If no task history or loading, return empty data
    if (isLoading || !taskHistory) {
      return {
        dates: [],
        completedCounts: [],
        isEmpty: true
      };
    }
    
    // Process real data when available
    const today = new Date();
    const startDate = new Date();
    
    if (timeframe === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else {
      startDate.setDate(today.getDate() - 30);
    }
    
    // Group completions by date
    const dateMap = new Map();
    const dateLabels: string[] = [];
    
    // Initialize all dates in the range with 0 completions
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
      dateLabels.push(dateStr);
    }
    
    // Count completions per date
    taskHistory.forEach(item => {
      // Check only for completedAt since that's the reliable indicator
      if (item.completedAt) {
        const completedDate = new Date(item.completedAt);
        // Ensure the date is valid
        if (!isNaN(completedDate.getTime()) && completedDate >= startDate && completedDate <= today) {
          const dateStr = completedDate.toISOString().split('T')[0];
          dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
        }
      }
    });
    
    // Convert to arrays for the chart
    const completedCounts = dateLabels.map(date => dateMap.get(date) || 0);
    
    // Format date labels for display
    const formattedDates = dateLabels.map(date => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    
    // Only consider empty if no completions in the entire period
    const hasCompletions = completedCounts.some(count => count > 0);
    
    return {
      dates: formattedDates,
      completedCounts,
      isEmpty: !hasCompletions
    };
  };
  
  const { dates, completedCounts, isEmpty } = getChartData();
  
  const chartOptions: ApexOptions = {
    chart: {
      id: 'task-completion-trends',
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
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
      sparkline: {
        enabled: false
      },
      background: 'transparent'
    },
    colors: [theme.palette.primary.main],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      lineCap: 'round'
    },
    grid: {
      borderColor: theme.palette.divider,
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      strokeDashArray: 5,
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      }
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
          colors: theme.palette.text.secondary,
          fontSize: '12px'
        },
        offsetY: 5,
        rotate: 0
      }
    },
    yaxis: {
      min: 0,
      max: Math.max(...completedCounts, 2),
      tickAmount: 4,
      labels: {
        style: {
          colors: theme.palette.text.secondary,
          fontSize: '12px'
        },
        formatter: (value: number) => {
          return Math.floor(value).toString();
        }
      }
    },
    tooltip: {
      theme: theme.palette.mode,
      x: {
        format: 'dd/MM/yy'
      },
      y: {
        formatter: (value: number) => {
          return `${Math.floor(value)} tasks`;
        }
      },
      marker: {
        show: true
      },
      style: {
        fontSize: '12px'
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        type: 'vertical',
        shadeIntensity: 0.4,
        opacityFrom: 0.9,
        opacityTo: 0.5,
        stops: [0, 90, 100],
        colorStops: [
          {
            offset: 0,
            color: theme.palette.primary.main,
            opacity: 0.9
          },
          {
            offset: 100,
            color: theme.palette.primary.light,
            opacity: 0.4
          }
        ]
      }
    },
    markers: {
      size: 4,
      colors: [theme.palette.background.paper],
      strokeColors: theme.palette.primary.main,
      strokeWidth: 2,
      hover: {
        size: 6
      }
    }
  };
  
  const series = [
    {
      name: 'Tasks Completed',
      data: completedCounts
    }
  ];
  
  const handleTimeframeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeframe: 'week' | 'month' | null,
  ) => {
    if (newTimeframe !== null) {
      setTimeframe(newTimeframe);
    }
  };
  
  return (
    <DashboardCard
      title="Task Completion Trends"
      action={
        <ToggleButtonGroup
          value={timeframe}
          exclusive
          onChange={handleTimeframeChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.5,
              fontSize: '0.875rem',
              borderRadius: '4px !important',
              borderColor: theme.palette.divider,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              },
            },
          }}
        >
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      }
    >
      <Box sx={{ mt: 3, height: 350, position: 'relative' }}>
        {isLoading ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography color="error" variant="body1">
              {error}
            </Typography>
          </Box>
        ) : isEmpty ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography color="textSecondary" variant="body1">
              No task completion data available for this period
            </Typography>
          </Box>
        ) : (
          <Chart
            options={chartOptions}
            series={series}
            type="area"
            height="100%"
          />
        )}
      </Box>
    </DashboardCard>
  );
};

export default TaskCompletionTrends; 