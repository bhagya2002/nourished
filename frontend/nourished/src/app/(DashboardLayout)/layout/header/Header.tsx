import React from "react";
import {
  Box,
  AppBar,
  Toolbar,
  styled,
  Stack,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PropTypes from "prop-types";
// components
import Profile from "./Profile";
import Notifications from "./Notifications";
import { IconMenuOrder } from "@tabler/icons-react";
import MenuOpenOutlinedIcon from "@mui/icons-material/MenuOpenOutlined";

interface ItemType {
  toggleMobileSidebar: (event: React.MouseEvent<HTMLElement>) => void;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const Header = ({
  toggleMobileSidebar,
  toggleSidebar,
  isSidebarOpen,
}: ItemType) => {
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: "none",
    background: theme.palette.background.paper,
    justifyContent: "center",
    backdropFilter: "blur(4px)",
    [theme.breakpoints.up("lg")]: {
      minHeight: "70px",
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: "100%",
    color: theme.palette.text.secondary,
  }));

  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={toggleMobileSidebar}
          sx={{
            display: {
              lg: "none",
              xs: "inline",
            },
          }}
        >
          <MenuOpenOutlinedIcon sx={{ width: 24, height: 24 }} />
        </IconButton>
        {lgUp && toggleSidebar && (
          <IconButton
            color="primary"
            aria-label="toggle sidebar"
            onClick={toggleSidebar}
            sx={{
              transition: "all 0.3s ease",
              transform: isSidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
              position: "relative",
              zIndex: 1200,
              "&:hover": {
                backgroundColor:
                  theme.palette.primary.light || "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            <IconMenuOrder width="20" height="20" />
          </IconButton>
        )}
        <Stack spacing={1} direction="row" alignItems="center">
          <Notifications />
        </Stack>
        <Box flexGrow={1} />
        <Stack spacing={1} direction="row" alignItems="center">
          {/* <Button
            variant='contained'
            component={Link}
            href='/authentication/login'
            disableElevation
            color='primary'
          >
            Login
          </Button> */}
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
