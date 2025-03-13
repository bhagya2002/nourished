import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  styled,
  Stack,
  IconButton,
  Badge,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import PropTypes from 'prop-types';
import Link from 'next/link';
// components
import Profile from './Profile';
import { IconBellRinging, IconMenu, IconMenuOrder } from '@tabler/icons-react';

interface ItemType {
  toggleMobileSidebar: (event: React.MouseEvent<HTMLElement>) => void;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const Header = ({ toggleMobileSidebar, toggleSidebar, isSidebarOpen }: ItemType) => {
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none',
    background: theme.palette.background.paper,
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    [theme.breakpoints.up('lg')]: {
      minHeight: '70px',
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: theme.palette.text.secondary,
  }));

  return (
    <AppBarStyled position='sticky' color='default'>
      <ToolbarStyled>
        <IconButton
          color='inherit'
          aria-label='menu'
          onClick={toggleMobileSidebar}
          sx={{
            display: {
              lg: 'none',
              xs: 'inline',
            },
          }}
        >
          <IconMenu width='20' height='20' />
        </IconButton>

        {lgUp && toggleSidebar && (
          <IconButton
            color='primary'
            aria-label='toggle sidebar'
            onClick={toggleSidebar}
            sx={{
              transition: 'all 0.3s ease',
              transform: isSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
              position: 'relative',
              zIndex: 1200,
              '&:hover': {
                backgroundColor: theme.palette.primary.light || 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <IconMenuOrder width='20' height='20' />
          </IconButton>
        )}

        <IconButton
          size='large'
          aria-label='show notifications'
          color='inherit'
          aria-controls='msgs-menu'
          aria-haspopup='true'
        >
          <Badge variant='dot' color='primary'>
            <IconBellRinging size='21' stroke='1.5' />
          </Badge>
        </IconButton>
        <Box flexGrow={1} />
        <Stack spacing={1} direction='row' alignItems='center'>
          <Button
            variant='contained'
            component={Link}
            href='/authentication/login'
            disableElevation
            color='primary'
          >
            Login
          </Button>
          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
