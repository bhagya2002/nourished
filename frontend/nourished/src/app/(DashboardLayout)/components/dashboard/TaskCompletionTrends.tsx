"use client";
import { useState, useEffect } from 'react';
import dynamic from "next/dynamic";
import { useTheme, Box, Typography, CircularProgress, Stack, ToggleButtonGroup, ToggleButton } from "@mui/material";
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
    // If no task history, generate sample data for visual display
    if (!taskHistory || taskHistory.length === 0) {
      const today = new Date();
      const dates = [];
      const completedCounts = [];
      
      // Generate dates (past 7 days or past 30 days)
      const startDate = new Date();
      if (timeframe === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else {
        startDate.setDate(today.getDate() - 30);
      }
      
      // Create empty data points
      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const formattedDate = `${d.getMonth() + 1}/${d.getDate()}`;
        dates.push(formattedDate);
        completedCounts.push(0);
      }
      
      return {
        dates,
        completedCounts,
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
      if (item.completedStatus) {
        const completedDate = new Date(item.completedAt);
        if (completedDate >= startDate && completedDate <= today) {
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
    
    return {
      dates: formattedDates,
      completedCounts,
      isEmpty: false
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
        offsetY: 5
      }
    },
    yaxis: {
      min: 0,
      max: Math.max(...completedCounts, 1) + 1,
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
  
  if (isLoading) {
    return (
      <DashboardCard title="Task Completion Trends">
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <CircularProgress />
        </Box>
      </DashboardCard>
    );
  }
  
  if (error) {
    return (
      <DashboardCard title="Task Completion Trends">
        <Box sx={{ p: 3, textAlign: 'center', height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography color="error" variant="body1">{error}</Typography>
        </Box>
      </DashboardCard>
    );
  }
  
  return (
    <DashboardCard 
      title="Task Completion Trends"
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
      <Box sx={{ p: 2, height: '300px' }}>
        {(!taskHistory || taskHistory.length === 0) ? (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            textAlign: 'center',
            px: 3
          }}>
            <Typography variant="body1" gutterBottom>
              {isEmpty ? "No task completion data yet" : "Loading task data..."}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Complete tasks to see your progress trends here
            </Typography>
            
            {/* Show sample chart even when empty for better UX */}
            <Box sx={{ width: '100%', height: '70%', opacity: 0.3 }}>
              <Chart
                options={chartOptions}
                series={[{
                  name: 'Sample Data',
                  data: completedCounts
                }]}
                type="area"
                height="100%"
              />
            </Box>
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