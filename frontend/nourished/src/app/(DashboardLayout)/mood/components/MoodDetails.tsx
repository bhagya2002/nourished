import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Box,
  useTheme,
  alpha,
  Avatar,
  Tooltip,
  Zoom,
} from "@mui/material";
import {
  IconX,
  IconTrash,
  IconEdit,
  IconMoodSmile,
  IconMoodHappy,
  IconMoodSad,
  IconMoodCry,
  IconMoodEmpty,
  IconMoodNervous,
} from "@tabler/icons-react";

interface MoodEntry {
  date: string;
  rating: number;
  note?: string;
}

interface MoodDetailsProps {
  open: boolean;
  onClose: () => void;
  entry?: MoodEntry;
  onDelete: (date: string) => Promise<void>;
  onUpdate: (date: string, note: string, rating?: number) => Promise<void>;
}

const moodOptions = [
  {
    value: 5,
    label: "Ecstatic",
    icon: IconMoodHappy,
    color: "#4CAF50",
    description: "Feeling amazing! On top of the world.",
  },
  {
    value: 4,
    label: "Happy",
    icon: IconMoodSmile,
    color: "#8BC34A",
    description: "In a good mood. Things are going well.",
  },
  {
    value: 3,
    label: "Neutral",
    icon: IconMoodEmpty,
    color: "#FFC107",
    description: "Neither good nor bad. Just okay.",
  },
  {
    value: 2,
    label: "Down",
    icon: IconMoodSad,
    color: "#FF9800",
    description: "Feeling a bit low or sad today.",
  },
  {
    value: 1,
    label: "Terrible",
    icon: IconMoodCry,
    color: "#F44336",
    description: "Having a really tough time.",
  },
  {
    value: 0,
    label: "Anxious",
    icon: IconMoodNervous,
    color: "#9C27B0",
    description: "Feeling worried, stressed or anxious.",
  },
];

const MoodDetails: React.FC<MoodDetailsProps> = ({
  open,
  onClose,
  entry,
  onDelete,
  onUpdate,
}) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  useEffect(() => {
    if (entry) {
      setNote(entry.note || "");
      setSelectedRating(entry.rating);
    }
    setIsEditing(false);
    setIsDeleting(false);
    setIsProcessing(false);
  }, [entry]);

  const getMoodInfo = (rating: number) => {
    const moodInfo = moodOptions.find((option) => option.value === rating);
    if (!moodInfo) {
      return moodOptions[3];
    }
    return moodInfo;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (!entry) return;

    setIsProcessing(true);
    try {
      await onDelete(entry.date);
      onClose();
    } catch (error) {
      console.error("Error deleting mood:", error);
      setIsDeleting(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!entry) return;

    setIsProcessing(true);
    try {
      await onUpdate(
        entry.date,
        note,
        selectedRating !== null ? selectedRating : entry.rating
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating mood:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectMood = (rating: number) => {
    setSelectedRating(rating);
  };

  if (!entry) return null;

  const moodInfo = getMoodInfo(entry.rating);
  const Icon = moodInfo.icon;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 1,
          fontWeight: 600,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Mood Details
        <IconButton onClick={onClose} edge="end">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 1 }}>
        {/* Date and mood */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 3,
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ minWidth: { sm: "120px" } }}
          >
            Date:
          </Typography>
          <Typography variant="body1">{formatDate(entry.date)}</Typography>
        </Box>

        {/* Current mood display (when not editing) */}
        {!isEditing && (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              mb: 3,
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ minWidth: { sm: "120px" } }}
            >
              Mood:
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  backgroundColor: alpha(moodInfo.color, 0.1),
                  color: moodInfo.color,
                  mr: 1,
                }}
              >
                <Icon size={24} />
              </Avatar>
              <Typography
                variant="body1"
                sx={{
                  color: moodInfo.color,
                  fontWeight: 500,
                }}
              >
                {moodInfo.label}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Mood selection in edit mode */}
        {isEditing && (
          <Box
            sx={{
              mb: 3,
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Update your mood:
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                justifyContent: "center",
                mb: 2,
              }}
            >
              {moodOptions
                .slice()
                .reverse()
                .map((mood) => {
                  const MoodIcon = mood.icon;
                  const isSelected = selectedRating === mood.value;

                  return (
                    <Tooltip
                      key={mood.value}
                      title={mood.description}
                      arrow
                      TransitionComponent={Zoom}
                      placement="top"
                    >
                      <Avatar
                        onClick={() => handleSelectMood(mood.value)}
                        sx={{
                          width: 50,
                          height: 50,
                          backgroundColor: isSelected
                            ? mood.color
                            : alpha(mood.color, 0.1),
                          color: isSelected ? "#fff" : mood.color,
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            backgroundColor: isSelected
                              ? mood.color
                              : alpha(mood.color, 0.2),
                            transform: "scale(1.05)",
                          },
                        }}
                      >
                        <MoodIcon size={24} stroke={1.5} />
                      </Avatar>
                    </Tooltip>
                  );
                })}
            </Box>

            <Box sx={{ textAlign: "center", mb: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color:
                    selectedRating !== null
                      ? getMoodInfo(selectedRating).color
                      : "text.secondary",
                  fontWeight: 500,
                }}
              >
                {selectedRating !== null
                  ? getMoodInfo(selectedRating).label
                  : "Select a mood"}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Display note when not editing */}
        {!isEditing && (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              mb: 2,
              gap: { xs: 1, sm: 2 },
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ minWidth: { sm: "120px" } }}
            >
              Notes:
            </Typography>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: "pre-wrap",
                flex: 1,
              }}
            >
              {entry.note || "No notes for this mood entry"}
            </Typography>
          </Box>
        )}

        {/* Edit note input */}
        {isEditing && (
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes (optional)"
            placeholder="How are you feeling today? What's on your mind?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                borderRadius: "12px",
              },
            }}
          />
        )}

        {/* Delete confirmation */}
        {isDeleting && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              bgcolor: alpha(theme.palette.error.main, 0.1),
              borderRadius: "12px",
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
            }}
          >
            <Typography
              variant="body1"
              sx={{ mb: 1, color: theme.palette.error.main }}
            >
              Are you sure you want to delete this mood entry?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          pt: 2,
          display: "flex",
          justifyContent:
            isEditing || isDeleting ? "space-between" : "flex-end",
        }}
      >
        {/* Delete confirmation buttons */}
        {isDeleting && (
          <>
            <Button
              onClick={() => setIsDeleting(false)}
              variant="outlined"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              disabled={isProcessing}
            >
              {isProcessing ? "Deleting..." : "Confirm Delete"}
            </Button>
          </>
        )}

        {/* Edit mode buttons */}
        {isEditing && !isDeleting && (
          <>
            <Button
              onClick={() => {
                setIsEditing(false);
                setNote(entry.note || "");
                setSelectedRating(entry.rating);
              }}
              variant="outlined"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              variant="contained"
              disabled={
                isProcessing ||
                (note === entry.note && selectedRating === entry.rating)
              }
            >
              {isProcessing ? "Saving..." : "Save Changes"}
            </Button>
          </>
        )}

        {/* Default action buttons */}
        {!isEditing && !isDeleting && (
          <>
            <Button
              onClick={() => setIsDeleting(true)}
              color="error"
              startIcon={<IconTrash size={18} />}
              sx={{ ml: "auto", mr: 1 }}
            >
              Delete
            </Button>
            <Button
              onClick={() => setIsEditing(true)}
              variant="contained"
              startIcon={<IconEdit size={18} />}
            >
              Edit
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MoodDetails;
