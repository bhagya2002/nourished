import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Grid,
  LinearProgress,
  Tooltip,
  alpha,
} from "@mui/material";
import dynamic from "next/dynamic";
import {
  IconMoodSmile,
  IconMoodHappy,
  IconMoodSad,
  IconMoodCry,
  IconMoodEmpty,
  IconMoodNervous,
} from "@tabler/icons-react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MoodEntry {
  date: string;
  rating: number;
  note?: string;
}

interface MoodStatsProps {
  moodEntries: MoodEntry[];
  timeframe?: "week" | "month" | "year";
}

const MoodStats: React.FC<MoodStatsProps> = ({
  moodEntries,
  timeframe = "month",
}) => {
  const theme = useTheme();

  const filteredMoodEntries = useMemo(() => {
    if (moodEntries.length === 0) return [];

    const today = new Date();
    const startDate = new Date();

    if (timeframe === "week") {
      startDate.setDate(today.getDate() - 7);
    } else if (timeframe === "month") {
      startDate.setMonth(today.getMonth() - 1);
    } else {
      startDate.setFullYear(today.getFullYear() - 1);
    }

    const timeframeEntries = moodEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= today;
    });

    const uniqueDayMap = new Map();

    timeframeEntries.forEach((entry) => {
      const dateKey = new Date(entry.date).toISOString().split("T")[0];

      if (
        !uniqueDayMap.has(dateKey) ||
        new Date(entry.date) > new Date(uniqueDayMap.get(dateKey).date)
      ) {
        uniqueDayMap.set(dateKey, entry);
      }
    });

    return Array.from(uniqueDayMap.values());
  }, [moodEntries, timeframe]);

  const moodDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0, 0];

    if (filteredMoodEntries.length === 0) return distribution;

    filteredMoodEntries.forEach((entry) => {
      distribution[entry.rating]++;
    });

    return distribution;
  }, [filteredMoodEntries]);

  const averageMood = useMemo(() => {
    if (filteredMoodEntries.length === 0) return 0;

    const sum = filteredMoodEntries.reduce(
      (total, entry) => total + entry.rating,
      0
    );
    return parseFloat((sum / filteredMoodEntries.length).toFixed(1));
  }, [filteredMoodEntries]);

  const mostCommonMood = useMemo(() => {
    if (filteredMoodEntries.length === 0) return null;

    const distribution = moodDistribution;
    let maxIndex = 0;

    for (let i = 1; i < distribution.length; i++) {
      if (distribution[i] > distribution[maxIndex]) {
        maxIndex = i;
      }
    }

    return maxIndex;
  }, [moodDistribution, filteredMoodEntries]);

  const getMoodInfo = (rating: number) => {
    switch (rating) {
      case 5:
        return { icon: IconMoodHappy, color: "#4CAF50", label: "Ecstatic" };
      case 4:
        return { icon: IconMoodSmile, color: "#8BC34A", label: "Happy" };
      case 3:
        return { icon: IconMoodEmpty, color: "#FFC107", label: "Neutral" };
      case 2:
        return { icon: IconMoodSad, color: "#FF9800", label: "Down" };
      case 1:
        return { icon: IconMoodCry, color: "#F44336", label: "Terrible" };
      case 0:
        return { icon: IconMoodNervous, color: "#9C27B0", label: "Anxious" };
      default:
        return { icon: IconMoodEmpty, color: "#FFC107", label: "Neutral" };
    }
  };

  const chartData = useMemo(() => {
    if (filteredMoodEntries.length === 0) {
      return {
        dates: [],
        ratings: [],
      };
    }

    const sortedData = [...filteredMoodEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const dateMap = new Map();

    sortedData.forEach((item) => {
      const dateStr = new Date(item.date).toISOString().split("T")[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { sum: item.rating, count: 1 });
      } else {
        const current = dateMap.get(dateStr);
        dateMap.set(dateStr, {
          sum: current.sum + item.rating,
          count: current.count + 1,
        });
      }
    });

    const dates: string[] = [];
    const ratings: number[] = [];

    dateMap.forEach((value, key) => {
      const avgRating = value.sum / value.count;
      const dateObj = new Date(key);
      const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      dates.push(formattedDate);
      ratings.push(parseFloat(avgRating.toFixed(1)));
    });

    return { dates, ratings };
  }, [filteredMoodEntries]);

  const chartOptions: any = {
    chart: {
      type: "line",
      toolbar: {
        show: false,
      },
      fontFamily: theme.typography.fontFamily,
    },
    colors: [theme.palette.primary.main],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 10,
        right: 0,
        bottom: 0,
        left: 10,
      },
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    xaxis: {
      categories: chartData.dates,
      labels: {
        style: {
          colors: theme.palette.text.secondary,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      min: 0,
      max: 5,
      tickAmount: 5,
      labels: {
        style: {
          colors: theme.palette.text.secondary,
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      y: {
        formatter: (val: number) => `${val} / 5`,
      },
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          chart: {
            height: 200,
          },
          markers: {
            size: 3,
          },
        },
      },
    ],
  };

  const chartSeries = [
    {
      name: "Mood Rating",
      data: chartData.ratings,
    },
  ];

  const mostCommonMoodInfo =
    mostCommonMood !== null ? getMoodInfo(mostCommonMood) : null;
  const Icon = mostCommonMoodInfo?.icon || IconMoodEmpty;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: "16px",
        background: theme.palette.background.paper,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        mt: 3,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: 2,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Mood Insights
      </Typography>

      <Grid container spacing={3}>
        {/* Mood stats cards */}
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "12px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Average Mood
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.main,
                mb: 1,
              }}
            >
              {averageMood}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              out of 5
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "12px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Most Common Mood
            </Typography>
            {mostCommonMoodInfo && (
              <>
                <Icon
                  size={40}
                  stroke={1.5}
                  color={mostCommonMoodInfo.color}
                  style={{ marginBottom: "8px" }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: mostCommonMoodInfo.color,
                  }}
                >
                  {mostCommonMoodInfo.label}
                </Typography>
              </>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "12px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 1, textAlign: "center" }}
            >
              Total Entries
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: theme.palette.secondary.main,
                textAlign: "center",
                mb: 1,
              }}
            >
              {filteredMoodEntries.length}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", mb: 1 }}
            >
              moods tracked
            </Typography>
          </Box>
        </Grid>

        {/* Chart */}
        <Grid item xs={12}>
          <Box sx={{ mt: 1, height: 300 }}>
            {typeof window !== "undefined" && chartData.dates.length > 0 ? (
              <Chart
                options={chartOptions}
                series={chartSeries}
                type="line"
                height={300}
              />
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px dashed ${theme.palette.divider}`,
                  borderRadius: "8px",
                }}
              >
                <Typography color="text.secondary">
                  No mood data available for the selected period
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Mood distribution */}
        <Grid item xs={12}>
          <Typography
            variant="subtitle1"
            sx={{ mt: 2, mb: 1, fontWeight: 600 }}
          >
            Mood Distribution
          </Typography>

          <Grid container spacing={2}>
            {[0, 1, 2, 3, 4, 5].map((rating) => {
              const moodInfo = getMoodInfo(rating);
              const Icon = moodInfo.icon;
              const count = moodDistribution[rating];
              const percentage =
                filteredMoodEntries.length > 0
                  ? Math.round((count / filteredMoodEntries.length) * 100)
                  : 0;

              return (
                <Grid item xs={12} key={rating}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        minWidth: "100px",
                      }}
                    >
                      <Icon
                        size={20}
                        color={moodInfo.color}
                        style={{ marginRight: "8px" }}
                      />
                      <Typography variant="body2">{moodInfo.label}</Typography>
                    </Box>

                    <Box sx={{ flex: 1, mx: 2 }}>
                      <Tooltip
                        title={`${count} entries (${percentage}%)`}
                        arrow
                        placement="top"
                      >
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(moodInfo.color, 0.2),
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: moodInfo.color,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Tooltip>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{ minWidth: "60px", textAlign: "right" }}
                    >
                      {percentage}%
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default MoodStats;
