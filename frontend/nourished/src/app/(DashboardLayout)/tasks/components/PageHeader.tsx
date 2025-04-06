"use client";
import React from "react";
import { Box, Typography, useTheme, alpha, Button } from "@mui/material";
import { motion } from "framer-motion";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AddTaskIcon from "@mui/icons-material/AddTask";
import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onCreateTask: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onCreateTask,
}) => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Box
      sx={{
        mb: 4,
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        p: { xs: 3, md: 4 },
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.light,
          0.1
        )}, ${alpha(theme.palette.primary.main, 0.05)})`,
      }}
    >
      {/* Decorative elements */}
      <Box
        sx={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(
            theme.palette.primary.main,
            0.2
          )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 70%)`,
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          bottom: -20,
          left: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(
            theme.palette.secondary.main,
            0.15
          )} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 70%)`,
          zIndex: 0,
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {title}
              </Typography>
            </motion.div>

            {subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  sx={{ maxWidth: "650px" }}
                >
                  {subtitle}
                </Typography>
              </motion.div>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Button
                variant="outlined"
                startIcon={<EventNoteIcon />}
                onClick={() => router.push("/tasks/history")}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 500,
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.shadows[2],
                  },
                }}
              >
                History
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Button
                variant="contained"
                startIcon={<AddTaskIcon />}
                onClick={onCreateTask}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 500,
                  boxShadow: theme.shadows[3],
                  transition: "all 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                Create Task
              </Button>
            </motion.div>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
