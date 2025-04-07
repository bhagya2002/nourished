"use client";
import {
  Box,
  Typography,
  useTheme,
  Grid,
  Paper,
  alpha,
  LinearProgress,
} from "@mui/material";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import OpacityIcon from "@mui/icons-material/Opacity";
import SpaIcon from "@mui/icons-material/Spa";

interface PlantGrowthInfoProps {
  plantHealth: number;
}

const plantStatusDescriptions = [
  {
    level: "Critical",
    text: "Your wellness plant needs attention! Complete tasks to nurture it back to health.",
    icon: <OpacityIcon />,
    colorName: "error",
  },
  {
    level: "Struggling",
    text: "Your plant is struggling. Regular task completion will help it grow stronger.",
    icon: <WaterDropIcon />,
    colorName: "warning",
  },
  {
    level: "Needs Attention",
    text: "Your plant needs more care. Keep up with your wellness tasks to help it thrive.",
    icon: <WbSunnyIcon />,
    colorName: "warning",
  },
  {
    level: "Good",
    text: "Your plant is doing well. Continue your wellness journey to help it flourish.",
    icon: <LocalFloristIcon />,
    colorName: "success",
  },
  {
    level: "Healthy",
    text: "Your plant is healthy and thriving. Great job maintaining your wellness routine!",
    icon: <SpaIcon />,
    colorName: "success",
  },
  {
    level: "Thriving",
    text: "Your plant is flourishing! Your dedication to wellness is creating beautiful results.",
    icon: <SpaIcon />,
    colorName: "success",
  },
];

const getPlantTips = (plantHealth: number) => {
  if (plantHealth >= 5) {
    return [
      "Continue your daily wellness routine",
      "Share your progress with friends",
      "Try adding new wellness activities",
    ];
  } else if (plantHealth >= 3) {
    return [
      "Complete tasks consistently",
      "Balance different wellness areas",
      "Set achievable daily goals",
    ];
  } else {
    return [
      "Start with small daily tasks",
      "Focus on consistency over quantity",
      "Track your progress regularly",
    ];
  }
};

const PlantGrowthInfo: React.FC<PlantGrowthInfoProps> = ({ plantHealth }) => {
  const theme = useTheme();
  const statusIndex = Math.min(Math.max(plantHealth - 1, 0), 5);
  const status = plantStatusDescriptions[statusIndex];
  const tips = getPlantTips(plantHealth);

  const getColorValue = () => {
    switch (status.colorName) {
      case "success":
        return theme.palette.success.main;
      case "warning":
        return theme.palette.warning.main;
      case "error":
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  return (
    <Box
      sx={{
        pt: 0.5,
        pb: 1,
        px: 2,
      }}
    >
      {/* Plant Health Progress Bar */}
      <Box sx={{ mb: 2, px: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Plant Health
          </Typography>
          <Typography variant="caption" fontWeight="medium">
            {plantHealth}/6
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(plantHealth / 6) * 100}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(0,0,0,0.05)",
            "& .MuiLinearProgress-bar": {
              background: `linear-gradient(90deg, ${getColorValue()} 0%, ${
                theme.palette.primary.light
              } 100%)`,
              borderRadius: 4,
            },
          }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2,
          p: 1.5,
          borderRadius: 2,
          bgcolor: alpha(getColorValue(), 0.1),
        }}
      >
        <Box
          sx={{
            mr: 2,
            color: getColorValue(),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {status.icon}
        </Box>
        <Box>
          <Typography
            variant="subtitle2"
            color={getColorValue()}
            fontWeight="medium"
          >
            {status.level}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {status.text}
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="subtitle2"
        sx={{
          mb: 1,
          display: "flex",
          alignItems: "center",
          "&::before": {
            content: '""',
            display: "block",
            width: 3,
            height: 16,
            bgcolor: "primary.main",
            mr: 1,
            borderRadius: 1,
          },
        }}
      >
        Growth Tips
      </Typography>

      <Grid container spacing={1} sx={{ mb: 1 }}>
        {tips.map((tip, index) => (
          <Grid item xs={12} key={index}>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                borderColor: theme.palette.divider,
                bgcolor: theme.palette.background.default,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  bgcolor: "primary.light",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 1.5,
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {index + 1}
              </Box>
              <Typography variant="body2">{tip}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PlantGrowthInfo;
