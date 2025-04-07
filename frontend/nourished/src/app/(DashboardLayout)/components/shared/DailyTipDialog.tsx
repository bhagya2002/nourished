/**
 * FR19 - AI.DailyTips - The system shall generate personalized daily tips for users,
  based on their wellness trends and past activity data, to encourage
  continued engagement and improvement.
*/

"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Slide,
  CircularProgress,
  Paper,
  alpha,
  Button,
  useTheme,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import { keyframes } from "@mui/system";

const shimmer = keyframes`
  0% {
    left: -40%;
  }
  100% {
    left: 100%;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

interface DailyTipDialogProps {
  open: boolean;
  onClose: () => void;
  fetchTip: () => Promise<{ success: boolean; message?: any; error?: string }>;
}

const DailyTipDialog: React.FC<DailyTipDialogProps> = ({
  open,
  onClose,
  fetchTip,
}) => {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const [typingContent, setTypingContent] = useState("");
  const [typeIndex, setTypeIndex] = useState(0);
  const theme = useTheme();

  const getTipContent = async () => {
    setLoading(true);
    setError(null);
    setTip(null);
    setTypingContent("");
    setTypeIndex(0);

    try {
      const result = await fetchTip();

      if (result.success && result.message) {
        let formattedTip = "";

        if (typeof result.message === "string") {
          formattedTip = result.message;
        } else if (typeof result.message === "object") {
          if (result.message.title) {
            formattedTip = `${result.message.title}`;

            if (result.message.description) {
              formattedTip += `\n\n${result.message.description}`;
            }
          } else {
            formattedTip = JSON.stringify(result.message);
          }
        }

        setTip(formattedTip);
        simulateTyping(formattedTip);
      } else {
        setError(result.error || "Failed to get your daily tip");
      }
    } catch (err) {
      console.error("Error fetching daily tip:", err);
      setError("Unable to connect to AI service. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const simulateTyping = (text: string) => {
    setShowTypingEffect(true);

    setTypingContent("");
    setTypeIndex(0);

    const typingInterval = setInterval(() => {
      setTypeIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        setTypingContent(text.substring(0, newIndex));

        if (newIndex >= text.length) {
          clearInterval(typingInterval);
          setTimeout(() => setShowTypingEffect(false), 500);
          return text.length;
        }
        return newIndex;
      });
    }, 20);

    return () => clearInterval(typingInterval);
  };

  useEffect(() => {
    if (open) {
      getTipContent();
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={SlideTransition}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 5,
        sx: {
          borderRadius: 2,
          overflow: "visible",
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.95
            )} 0%, ${alpha(theme.palette.background.paper, 0.99)} 100%)`,
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      }}
    >
      {/* Dialog Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              boxShadow: 2,
            }}
          >
            <LocalFloristIcon sx={{ color: "white", fontSize: "20px" }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Daily Wellness Tip
          </Typography>
        </Box>

        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": {
              color: "text.primary",
              background: alpha(theme.palette.grey[500], 0.1),
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: 3, py: 4 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Generating your personalized tip...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="body1" color="error" gutterBottom>
              {error}
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={getTipContent}
              sx={{ mt: 2 }}
            >
              Try Again
            </Button>
          </Box>
        ) : tip ? (
          <Box sx={{ position: "relative" }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                background: (theme) => alpha(theme.palette.primary.light, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                position: "relative",
                overflow: "hidden",
                "&::after": showTypingEffect
                  ? {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "2px",
                      background: (theme) =>
                        `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundSize: "200% 100%",
                      animation: `${shimmer} 2s infinite linear`,
                    }
                  : {},
                animation: `${fadeIn} 0.5s ease-in-out`,
              }}
            >
              {/* Gemini/AI indicator */}
              <Box
                sx={{
                  position: "absolute",
                  right: 10,
                  top: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  background: alpha(theme.palette.background.paper, 0.7),
                  backdropFilter: "blur(4px)",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <AutoAwesomeIcon
                  sx={{ fontSize: "14px", color: theme.palette.primary.main }}
                />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 500, color: theme.palette.primary.main }}
                >
                  AI
                </Typography>
              </Box>

              <Typography
                variant="body1"
                component="div"
                sx={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontSize: "1rem",
                }}
              >
                {typingContent}
              </Typography>
            </Paper>
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default DailyTipDialog;
