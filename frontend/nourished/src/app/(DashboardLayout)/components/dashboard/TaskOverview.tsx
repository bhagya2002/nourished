'use client';
import dynamic from 'next/dynamic';
import { useTheme, Typography, Box, CircularProgress, Chip } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssignmentIcon from '@mui/icons-material/Assignment';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface TaskOverviewProps {
  completedCount: number;
  totalCount: number;
}

const TaskOverview: React.FC<TaskOverviewProps> = ({
  completedCount,
  totalCount,
}) => {
  const theme = useTheme();
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const options = {
    chart: { 
      type: 'donut' as const,
      offsetY: 0,
      sparkline: {
        enabled: true
      },
    },
    labels: ['Completed', 'Pending'],
    colors: [theme.palette.success.main, theme.palette.grey[300]],
    responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }],
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '80%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '22px',
              fontFamily: 'Inter, sans-serif',
              color: theme.palette.text.primary,
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '26px',
              fontFamily: 'Inter, sans-serif',
              color: theme.palette.text.primary,
              offsetY: 16,
              formatter: (val: any) => `${completionPercentage}%`
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Complete',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              color: theme.palette.text.secondary,
              formatter: () => `${completionPercentage}%`
            }
          }
        }
      }
    },
    stroke: {
      width: 0
    },
    tooltip: {
      enabled: true,
      fillSeriesColor: false,
      theme: theme.palette.mode,
      style: {
        fontSize: '14px'
      }
    }
  };
  
  const series = [completedCount, totalCount - completedCount];

  const getStatusColor = () => {
    if (completionPercentage >= 75) return theme.palette.success.main;
    if (completionPercentage >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getStatusText = () => {
    if (completionPercentage >= 75) return "On Track";
    if (completionPercentage >= 50) return "Making Progress";
    if (completionPercentage >= 25) return "Started";
    return "Just Beginning";
  };

  return (
    <DashboardCard 
      title='Task Progress'
      action={
        <Chip
          icon={<AssignmentIcon fontSize="small" />}
          label={`${completedCount}/${totalCount}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      }
    >
      <Box sx={{ p: 2, textAlign: 'center', position: 'relative' }}>
        <Chart 
          options={options} 
          series={series} 
          type='donut' 
          height={220}
        />
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 1, 
            display: 'flex', 
            alignItems: 'center',
            bgcolor: theme.palette.background.default
          }}>
            <CheckCircleOutlineIcon 
              color="success" 
              fontSize="small" 
              sx={{ mr: 1 }} 
            />
            <Typography variant="body2">
              {completedCount} Completed
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 1, 
            borderRadius: 1, 
            display: 'flex', 
            alignItems: 'center',
            bgcolor: theme.palette.background.default
          }}>
            <Box 
              sx={{ 
                width: 18, 
                height: 18, 
                borderRadius: '50%', 
                bgcolor: getStatusColor(),
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>
                {completionPercentage}
              </Typography>
            </Box>
            <Typography variant="body2">
              {getStatusText()}
            </Typography>
          </Box>
        </Box>
      </Box>
    </DashboardCard>
  );
};

export default TaskOverview;
