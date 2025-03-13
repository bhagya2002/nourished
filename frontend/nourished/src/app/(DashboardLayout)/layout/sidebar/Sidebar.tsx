import { useMediaQuery, Box, Drawer, Typography, Avatar, useTheme } from '@mui/material';
import SidebarItems from './SidebarItems';
import { Sidebar } from 'react-mui-sidebar';
import { IconLeaf } from '@tabler/icons-react';

interface ItemType {
  isMobileSidebarOpen: boolean;
  onSidebarClose: (event: React.MouseEvent<HTMLElement>) => void;
  isSidebarOpen: boolean;
}

const MSidebar = ({
  isMobileSidebarOpen,
  onSidebarClose,
  isSidebarOpen,
}: ItemType) => {
  const theme = useTheme();
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));

  const sidebarWidth = '270px';
  const collapsedWidth = '0px';

  // Custom CSS for scrollbar
  const scrollbarStyles = {
    '&::-webkit-scrollbar': {
      width: '5px', // Thinner scrollbar
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(0, 0, 0, 0.1)', // More subtle color
      borderRadius: '10px',
    },
  };

  // Modern logo component
  const Logo = () => (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        my: 3,
        transition: 'all 0.3s ease',
      }}
    >
      <Avatar 
        sx={{ 
          width: 56, 
          height: 56, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.light})`,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          mb: 1
        }}
      >
        <IconLeaf size={30} />
      </Avatar>
      
      {isSidebarOpen && (
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600,
            backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '0.5px',
            mt: 1
          }}
        >
          Nourished
        </Typography>
      )}
    </Box>
  );

  if (lgUp) {
    return (
      <Box
        sx={{
          width: isSidebarOpen ? sidebarWidth : collapsedWidth,
          flexShrink: 0,
          transition: 'width 0.3s ease',
          marginLeft: isSidebarOpen ? 0 : '0px',
        }}
      >
        {/* ------------------------------------------- */}
        {/* Sidebar for desktop */}
        {/* ------------------------------------------- */}
        <Drawer
          anchor="left"
          open={true}
          variant="permanent"
          PaperProps={{
            sx: {
              width: isSidebarOpen ? sidebarWidth : collapsedWidth,
              boxSizing: 'border-box',
              border: 'none',
              boxShadow: '0 0 20px rgba(0,0,0,0.05)',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
              transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              visibility: isSidebarOpen ? 'visible' : 'hidden',
              opacity: isSidebarOpen ? 1 : 0,
              ...scrollbarStyles,
            },
          }}
        >
          {/* ------------------------------------------- */}
          {/* Sidebar Box */}
          {/* ------------------------------------------- */}
          <Box
            sx={{
              height: '100%',
            }}
          >
            <Sidebar
              width={sidebarWidth}
              collapsewidth={collapsedWidth}
              open={isSidebarOpen}
              isCollapse={!isSidebarOpen}
              themeColor={theme.palette.primary.main}
              themeSecondaryColor={theme.palette.secondary.main}
              showProfile={false}
            >
              {/* ------------------------------------------- */}
              {/* Logo */}
              {/* ------------------------------------------- */}
              <Logo />
              <Box>
                {/* ------------------------------------------- */}
                {/* Sidebar Items */}
                {/* ------------------------------------------- */}
                <SidebarItems />
              </Box>
            </Sidebar>
          </Box>
        </Drawer>
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={isMobileSidebarOpen}
      onClose={onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: sidebarWidth,
          boxSizing: 'border-box',
          boxShadow: theme.shadows[8],
          border: 'none',
          ...scrollbarStyles,
        },
      }}
    >
      {/* ------------------------------------------- */}
      {/* Sidebar Box */}
      {/* ------------------------------------------- */}
      <Box px={2}>
        <Sidebar
          width={sidebarWidth}
          collapsewidth={collapsedWidth}
          isCollapse={false}
          mode="light"
          direction="ltr"
          themeColor={theme.palette.primary.main}
          themeSecondaryColor={theme.palette.secondary.main}
          showProfile={false}
        >
          {/* ------------------------------------------- */}
          {/* Logo */}
          {/* ------------------------------------------- */}
          <Logo />
          {/* ------------------------------------------- */}
          {/* Sidebar Items */}
          {/* ------------------------------------------- */}
          <SidebarItems toggleMobileSidebar={onSidebarClose} />
        </Sidebar>
      </Box>
      {/* ------------------------------------------- */}
      {/* Sidebar For Mobile */}
      {/* ------------------------------------------- */}
    </Drawer>
  );
};

export default MSidebar;
