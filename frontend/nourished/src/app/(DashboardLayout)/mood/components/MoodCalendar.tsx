import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Grid,
  IconButton,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  IconChevronLeft,
  IconChevronRight,
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

interface MoodCalendarProps {
  moodEntries: MoodEntry[];
  onDayClick?: (date: string, entry?: MoodEntry) => void;
}

const MoodCalendar: React.FC<MoodCalendarProps> = ({
  moodEntries,
  onDayClick,
}) => {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get icon and color based on mood rating
  const getMoodIcon = (rating: number) => {
    switch (rating) {
      case 5:
        return { icon: IconMoodHappy, color: "#4CAF50" };
      case 4:
        return { icon: IconMoodSmile, color: "#8BC34A" };
      case 3:
        return { icon: IconMoodEmpty, color: "#FFC107" };
      case 2:
        return { icon: IconMoodSad, color: "#FF9800" };
      case 1:
        return { icon: IconMoodCry, color: "#F44336" };
      case 0:
        return { icon: IconMoodNervous, color: "#9C27B0" };
      default:
        return { icon: IconMoodEmpty, color: "#FFC107" };
    }
  };

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() - 1);
      return date;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      date.setMonth(date.getMonth() + 1);
      return date;
    });
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar data
  const generateCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const calendarDays = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push({ day: null, entry: null });
    }

    // Create a map to store the latest mood entry for each day (to handle duplicate entries)
    const dayMoodMap = new Map();

    // Process all mood entries to find the latest for each calendar day
    moodEntries.forEach((entry) => {
      const entryDate = new Date(entry.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth();
      const entryDay = entryDate.getDate();

      // Only process entries for the current month/year
      if (entryYear === year && entryMonth === month) {
        const dayKey = entryDay.toString();

        // If no entry exists for this day, or if this entry is newer, use it
        if (
          !dayMoodMap.has(dayKey) ||
          new Date(entry.date) > new Date(dayMoodMap.get(dayKey).date)
        ) {
          dayMoodMap.set(dayKey, entry);
        }
      }
    });

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${(month + 1)
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

      // Get the mood entry for this day from our map (if any)
      const entry = dayMoodMap.get(day.toString());

      calendarDays.push({ day, entry, dateString });
    }

    return calendarDays;
  };

  const calendarData = generateCalendarData();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "16px",
        background: theme.palette.background.paper,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}
    >
      {/* Calendar header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Mood Calendar
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            onClick={goToPreviousMonth}
            size="small"
            sx={{
              mr: 1,
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              },
            }}
          >
            <IconChevronLeft size={20} />
          </IconButton>

          <Typography
            variant="h6"
            sx={{ fontWeight: 500, minWidth: "120px", textAlign: "center" }}
          >
            {`${monthName} ${currentDate.getFullYear()}`}
          </Typography>

          <IconButton
            onClick={goToNextMonth}
            size="small"
            sx={{
              ml: 1,
              color: theme.palette.text.secondary,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              },
            }}
          >
            <IconChevronRight size={20} />
          </IconButton>
        </Box>
      </Box>

      {/* Weekday headers */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {weekDays.map((day) => (
          <Grid item xs={12 / 7} key={day}>
            <Typography
              variant="caption"
              align="center"
              sx={{
                display: "block",
                fontWeight: 500,
                color: theme.palette.text.secondary,
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar grid */}
      <Grid container spacing={1}>
        {calendarData.map((cell, index) => {
          const isToday = cell.day
            ? new Date().toDateString() ===
              new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                cell.day
              ).toDateString()
            : false;

          // If the cell has a mood entry, get the icon and color
          const moodStyle = cell.entry ? getMoodIcon(cell.entry.rating) : null;

          const Icon = moodStyle ? moodStyle.icon : null;

          return (
            <Grid item xs={12 / 7} key={index}>
              <Box
                onClick={() =>
                  cell.day &&
                  onDayClick &&
                  onDayClick(cell.dateString, cell.entry)
                }
                sx={{
                  height: { xs: 50, sm: 60 },
                  border: "1px solid",
                  borderColor: isToday
                    ? theme.palette.primary.main
                    : theme.palette.divider,
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  background: isToday
                    ? alpha(theme.palette.primary.main, 0.05)
                    : cell.entry
                    ? alpha(moodStyle!.color, 0.25)
                    : "transparent",
                  cursor: cell.day ? "pointer" : "default",
                  transition: "all 0.2s",
                  "&:hover": cell.day
                    ? {
                        borderColor: cell.entry
                          ? moodStyle!.color
                          : theme.palette.primary.main,
                        boxShadow: `0 4px 8px ${alpha(
                          cell.entry
                            ? moodStyle!.color
                            : theme.palette.primary.main,
                          0.15
                        )}`,
                        transform: "translateY(-2px)",
                      }
                    : {},
                }}
              >
                {cell.day && (
                  <>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isToday ? 700 : cell.entry ? 600 : 400,
                        color: isToday
                          ? theme.palette.primary.main
                          : cell.entry
                          ? moodStyle!.color
                          : theme.palette.text.primary,
                        fontSize: cell.entry ? "0.95rem" : "inherit",
                      }}
                    >
                      {cell.day}
                    </Typography>

                    {cell.entry && Icon && (
                      <Tooltip
                        title={cell.entry.note || "No notes for this day"}
                        arrow
                        placement="top"
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: "4px",
                            color: moodStyle!.color,
                          }}
                        >
                          <Icon size={20} />
                        </Box>
                      </Tooltip>
                    )}
                  </>
                )}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default MoodCalendar;
