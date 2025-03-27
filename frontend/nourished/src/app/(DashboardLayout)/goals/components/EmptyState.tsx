"use client";
import React from "react";
import { Box, Typography, Button, Paper, useTheme, alpha } from "@mui/material";
import { motion } from "framer-motion";
import FlagIcon from "@mui/icons-material/Flag";
import AddIcon from "@mui/icons-material/Add";

interface EmptyStateProps {
  onCreateGoal: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateGoal }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          textAlign: "center",
          borderRadius: "16px",
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: "absolute",
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            top: "-100px",
            right: "-80px",
            background: `radial-gradient(circle, ${alpha(
              theme.palette.primary.main,
              0.1
            )} 0%, ${alpha(
              theme.palette.primary.main,
              0.05
            )} 70%, transparent 100%)`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            bottom: "-60px",
            left: "-30px",
            background: `radial-gradient(circle, ${alpha(
              theme.palette.secondary.main,
              0.1
            )} 0%, ${alpha(
              theme.palette.secondary.main,
              0.05
            )} 70%, transparent 100%)`,
          }}
        />

        {/* Icon */}
        <Box
          sx={{
            width: "80px",
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: alpha(theme.palette.primary.main, 0.1),
            margin: "0 auto 24px",
            color: theme.palette.primary.main,
          }}
        >
          <FlagIcon sx={{ fontSize: 40 }} />
        </Box>

        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 600,
            mb: 1,
            color: theme.palette.text.primary,
          }}
        >
          Set Your Goals
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mb: 4,
            maxWidth: "500px",
            mx: "auto",
            lineHeight: 1.6,
          }}
        >
          Create goals to track your progress and stay motivated on your
          wellness journey. Break down big aspirations into manageable tasks.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onCreateGoal}
          sx={{
            px: 3,
            py: 1,
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 500,
            boxShadow: theme.shadows[2],
            "&:hover": {
              boxShadow: theme.shadows[4],
            },
          }}
        >
          Create Goal
        </Button>
      </Paper>
    </motion.div>
  );
};

export default EmptyState;
