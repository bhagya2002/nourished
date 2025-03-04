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
    if (!taskHistory || taskHistory.length === 0) {
      return {
        dates: [],
        completedCounts: []
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
      completedCounts
    };
  };
  
  const { dates, completedCounts } = getChartData();
  
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
      }
    },
    colors: [theme.palette.primary.main],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 3
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
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
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
          colors: theme.palette.text.secondary
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.text.secondary
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
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.4,
        opacityFrom: 0.9,
        opacityTo: 0.5,
        stops: [0, 100]
      }
    },
    markers: {
      size: 4,
      colors: [theme.palette.background.paper],
      strokeColors: theme.palette.primary.main,
      strokeWidth: 2
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
      <Box sx={{ p: 3, height: '400px' }}>
        {(!taskHistory || taskHistory.length === 0) ? (
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
              No task completion data available yet.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Complete tasks to see your trends over time.
            </Typography>
          </Box>
        ) : (
          <Chart
            options={chartOptions}
            series={series}
            type="line"
            height="350"
          />
        )}
      </Box>
    </DashboardCard>
  );
};

export default TaskCompletionTrends; 