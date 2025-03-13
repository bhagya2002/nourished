import React from "react";
import Menuitems from "./MenuItems";
import { usePathname } from "next/navigation";
import { Box, List, useTheme } from "@mui/material";
import NavItem from "./NavItem";
import NavGroup from "./NavGroup/NavGroup";

interface SidebarItemsProps {
  toggleMobileSidebar?: (event: React.MouseEvent<HTMLElement>) => void;
}

const SidebarItems = ({ toggleMobileSidebar }: SidebarItemsProps) => {
  const pathname = usePathname();
  const pathDirect = pathname;
  const theme = useTheme();

  return (
    <Box 
      sx={{ 
        px: 3,
        '& .MuiList-root': {
          py: 1,
        },
      }}
    >
      <List 
        sx={{ 
          pt: 0,
          '& .MuiListItemButton-root': {
            borderRadius: '10px',
            mb: 1,
            transition: 'all 0.2s ease-in-out',
          },
          '& .MuiListItemIcon-root': {
            minWidth: '36px',
            color: theme.palette.text.secondary,
          },
          '& .Mui-selected': {
            color: 'white',
            '& .MuiListItemIcon-root': {
              color: 'white',
            },
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            boxShadow: `0 3px 10px rgba(0, 0, 0, 0.15)`,
            '&:hover': {
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            },
          },
        }} 
        className="sidebarNav" 
        component="div"
      >
        {Menuitems.map((item) => {
          // {/********SubHeader**********/}
          if (item.subheader) {
            return <NavGroup item={item} key={item.subheader} />;

            // {/********If Sub Menu**********/}
            /* eslint no-else-return: "off" */
          } else {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
                onClick={toggleMobileSidebar}
              />
            );
          }
        })}
      </List>
    </Box>
  );
};

export default SidebarItems;
