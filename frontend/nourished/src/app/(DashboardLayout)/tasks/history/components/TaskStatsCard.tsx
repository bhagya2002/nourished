"use client";
import React from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  SvgIconProps,
} from "@mui/material";
import { motion } from "framer-motion";

interface TaskStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<SvgIconProps>;
  color: "primary" | "secondary" | "success" | "info" | "warning";
  delay?: number;
}

const TaskStatsCard: React.FC<TaskStatsCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  color,
  delay = 0,
}) => {
  const theme = useTheme();

  const getColorFromTheme = (colorName: string) => {
    switch (colorName) {
      case "primary":
        return theme.palette.primary;
      case "secondary":
        return theme.palette.secondary;
      case "success":
        return theme.palette.success;
      case "info":
        return theme.palette.info;
      case "warning":
        return theme.palette.warning;
      default:
        return theme.palette.primary;
    }
  };

  const themeColor = getColorFromTheme(color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          overflow: "hidden",
          height: "100%",
          position: "relative",
          transition: "all 0.3s",
          border: `1px solid ${alpha(themeColor.main, 0.1)}`,
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: `0 8px 24px ${alpha(themeColor.main, 0.15)}`,
          },
        }}
      >
        {/* Background gradient decoration */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "150px",
            height: "100%",
            opacity: 0.05,
            background: `linear-gradient(to right, transparent, ${themeColor.main})`,
            borderRadius: "0 16px 16px 0",
          }}
        />

        <Box
          sx={{
            position: "relative",
            p: 3,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Icon with circle background */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: alpha(themeColor.main, 0.1),
              color: themeColor.main,
              mb: 2,
            }}
          >
            <Icon sx={{ fontSize: "24px" }} />
          </Box>

          {/* Card title */}
          <Typography
            variant="subtitle1"
            component="div"
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              mb: 1,
            }}
          >
            {title}
          </Typography>

          {/* Value - large and prominent */}
          <Typography
            variant="h3"
            component="div"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.5px",
              mb: 0.5,
              color: themeColor.main,
            }}
          >
            {value}
          </Typography>

          {/* Optional description */}
          {description && (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mt: "auto",
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

export default TaskStatsCard;
