'use client';
import { Typography } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';


const TasksPage = () => {
  return (
    <PageContainer title="Tasks Page" description="this is tasks page">
      <DashboardCard title="Tasks Page">
        <Typography>This is a sample page</Typography>
      </DashboardCard>
    </PageContainer>
  );
};

export default TasksPage;