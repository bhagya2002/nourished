"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  IconButton,
  Fade,
  Paper,
  useTheme,
} from "@mui/material";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import SentimentNeutralIcon from "@mui/icons-material/SentimentNeutral";
import SentimentSatisfiedIcon from "@mui/icons-material/SentimentSatisfied";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import CloseIcon from "@mui/icons-material/Close";

interface HappinessDialogProps {
  open: boolean;
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onSubmit: (taskId: string, rating: number) => Promise<void>;
}

const HappinessDialog: React.FC<HappinessDialogProps> = ({
  open,
  taskId,
  taskTitle,
  onClose,
  onSubmit,
}) => {
  const [happiness, setHappiness] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);
  const theme = useTheme();

  const handleHappinessChange = (
    _event: Event,
    newValue: number | number[]
  ) => {
    setHappiness(newValue as number);
  };

  const handleSubmit = async () => {
    if (!taskId) return;

    setSubmitting(true);
    try {
      await onSubmit(taskId, happiness);
      onClose();
    } catch (error) {
      console.error("Error submitting happiness rating:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getHappinessIcon = (value: number) => {
    switch (value) {
      case 1:
        return (
          <SentimentVeryDissatisfiedIcon
            fontSize="large"
            sx={{ color: "#f44336" }}
          />
        );
      case 2:
        return (
          <SentimentDissatisfiedIcon
            fontSize="large"
            sx={{ color: "#ff9800" }}
          />
        );
      case 3:
        return (
          <SentimentNeutralIcon fontSize="large" sx={{ color: "#2196f3" }} />
        );
      case 4:
        return (
          <SentimentSatisfiedIcon fontSize="large" sx={{ color: "#4caf50" }} />
        );
      case 5:
        return (
          <SentimentSatisfiedAltIcon
            fontSize="large"
            sx={{ color: "#00c853" }}
          />
        );
      default:
        return <SentimentNeutralIcon fontSize="large" />;
    }
  };

  const getHappinessLabel = (value: number) => {
    switch (value) {
      case 1:
        return "Very Unhappy";
      case 2:
        return "Unhappy";
      case 3:
        return "Neutral";
      case 4:
        return "Happy";
      case 5:
        return "Very Happy";
      default:
        return "Neutral";
    }
  };

  const marks = [
    { value: 1, label: <SentimentVeryDissatisfiedIcon /> },
    { value: 2, label: <SentimentDissatisfiedIcon /> },
    { value: 3, label: <SentimentNeutralIcon /> },
    { value: 4, label: <SentimentSatisfiedIcon /> },
    { value: 5, label: <SentimentSatisfiedAltIcon /> },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          background: theme.palette.primary.main,
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography component="div" variant="h6">
          How do you feel after completing this task?
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 3, pb: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Task: <strong>{taskTitle}</strong>
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              mt: 2,
              mb: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: theme.palette.background.default,
              borderRadius: 2,
            }}
          >
            <Box sx={{ mb: 2 }}>{getHappinessIcon(happiness)}</Box>
            <Typography variant="h6" align="center" gutterBottom>
              {getHappinessLabel(happiness)}
            </Typography>

            <Box sx={{ width: "100%", px: 2, mt: 3 }}>
              <Slider
                value={happiness}
                onChange={handleHappinessChange}
                step={1}
                marks={marks}
                min={1}
                max={5}
                valueLabelDisplay="off"
                sx={{
                  "& .MuiSlider-thumb": {
                    width: 28,
                    height: 28,
                    transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
                    "&:before": {
                      boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)",
                    },
                    "&:hover, &.Mui-focusVisible": {
                      boxShadow: `0px 0px 0px 8px ${
                        theme.palette.mode === "dark"
                          ? "rgb(255 255 255 / 16%)"
                          : "rgb(0 0 0 / 16%)"
                      }`,
                    },
                    "&.Mui-active": {
                      width: 34,
                      height: 34,
                    },
                  },
                  "& .MuiSlider-rail": {
                    opacity: 0.5,
                  },
                }}
              />
            </Box>
          </Paper>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 2 }}
          >
            Your feedback helps us understand how tasks affect your well-being.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          color="primary"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HappinessDialog;
