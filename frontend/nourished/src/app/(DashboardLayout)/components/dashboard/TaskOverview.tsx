'use client';
import dynamic from 'next/dynamic';
import { useTheme, Typography, Box } from '@mui/material';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';

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
  const options = {
    chart: { type: 'pie' as const },
    labels: ['Completed', 'Incomplete'],
    colors: [theme.palette.success.main, theme.palette.error.main],
    responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }],
  };
  const series = [completedCount, totalCount - completedCount];

  return (
    <DashboardCard title='Task Overview'>
      <Box>
        <Chart options={options} series={series} type='pie' width='100%' />
        <Typography variant='subtitle2' align='center' mt={2}>
          {completedCount} of {totalCount} task completed
        </Typography>
      </Box>
    </DashboardCard>
  );
};

export default TaskOverview;
