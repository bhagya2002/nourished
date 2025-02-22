'use client';
import { Typography } from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';


const CalendarPage = () => {
    return (
        <PageContainer title="Calendar Page" description="this is calendar page">
            <DashboardCard title="Calendar Page">
                <Typography>This is a sample page</Typography>
            </DashboardCard>
        </PageContainer>
    );
};

export default CalendarPage;