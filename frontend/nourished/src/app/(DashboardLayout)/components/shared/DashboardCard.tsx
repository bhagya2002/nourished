import React, { ReactNode } from "react";
import { Card, CardContent, Typography, Stack, Box, useTheme } from "@mui/material";

type Props = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  footer?: JSX.Element;
  cardheading?: string | JSX.Element;
  headtitle?: string | JSX.Element;
  headsubtitle?: string | JSX.Element;
  children?: ReactNode;
  middlecontent?: string | JSX.Element;
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
}: Props) => {
  const theme = useTheme();
  
  return (
    <Card
      elevation={0}
      sx={{
        padding: 0,
        background: theme.palette.background.default,
        border: '1px solid',
        borderColor: theme.palette.divider,
        borderRadius: '16px',
        height: '100%',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          boxShadow: `0 4px 20px 0 ${theme.palette.mode === 'dark' 
            ? 'rgba(0,0,0,0.12)' 
            : 'rgba(0,0,0,0.05)'}`,
          borderRadius: 'inherit',
          transition: 'opacity 0.3s ease-in-out',
          opacity: 0,
          zIndex: -1,
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: theme.palette.primary.light,
          '&::before': {
            opacity: 1,
          },
          '& .MuiCardHeader-root': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(0,0,0,0.1)' 
              : 'rgba(0,0,0,0.01)',
          }
        }
      }}
    >
      {cardheading ? (
        <CardContent>
          <Typography variant="h5">{headtitle}</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {headsubtitle}
          </Typography>
        </CardContent>
      ) : (
        <CardContent sx={{ p: "30px" }}>
          {title ? (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="space-between"
              alignItems={"center"}
              mb={3}
            >
              <Box>
                {title ? <Typography variant="h5">{title}</Typography> : ""}

                {subtitle ? (
                  <Typography variant="subtitle2" color="textSecondary">
                    {subtitle}
                  </Typography>
                ) : (
                  ""
                )}
              </Box>
              {action}
            </Stack>
          ) : null}

          {children}
        </CardContent>
      )}

      {middlecontent}
      {footer}
    </Card>
  );
};

export default DashboardCard;
