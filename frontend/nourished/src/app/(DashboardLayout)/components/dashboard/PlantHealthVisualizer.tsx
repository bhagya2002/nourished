import { useEffect, useRef, useState } from "react";
import Spline from "@splinetool/react-spline";
import { Box, Typography, CircularProgress, LinearProgress, useTheme } from "@mui/material";

interface PlantHealthVisualizerProps {
  plantHealth: number;
}

export default function PlantHealthVisualizer({
  plantHealth,
}: PlantHealthVisualizerProps) {
  const theme = useTheme();
  const splineRef = useRef<{
    emitEvent: (event: string, key?: any) => void;
  } | null>(null);
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const [plantState, setPlantState] = useState("Base State");
  const [isLoading, setIsLoading] = useState(true);

  const handleSplineLoad = (spline: any) => {
    console.log("✅ Spline scene loaded");
    splineRef.current = spline;
    setIsSplineLoaded(true);
    setIsLoading(false);

    setTimeout(() => {
      console.log("▶️ Triggering Start event");
      spline.emitEvent("Start");
    }, 500);
  };

  const changePlantState = (key: any) => {
    if (!isSplineLoaded || !splineRef.current) {
      console.warn("⏳ Spline is not fully loaded yet.");
      return;
    }

    console.log(`🔹 Attempting to trigger key ${key}`);

    splineRef.current.emitEvent("keyPress", key);

    const keyEvent = new KeyboardEvent("keydown", {
      key: key,
      code: `Digit${key}`,
      keyCode: 48 + parseInt(key),
      which: 48 + parseInt(key),
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(keyEvent);

    setPlantState(`Triggered ${key}`);
  };

  useEffect(() => {
    if (
      isSplineLoaded &&
      plantHealth !== null &&
      plantHealth >= 1 &&
      plantHealth <= 6
    ) {
      setTimeout(() => {
        console.log(`🌱 Triggering plant health state: ${plantHealth}`);
        changePlantState(String(plantHealth));
      }, 500);
    }
  }, [isSplineLoaded, plantHealth]);

  const getPlantStatusColor = () => {
    if (plantHealth >= 6) return theme.palette.success.dark;
    if (plantHealth >= 5) return theme.palette.success.main;
    if (plantHealth >= 4) return theme.palette.success.light;
    if (plantHealth >= 3) return theme.palette.warning.main;
    if (plantHealth >= 2) return theme.palette.warning.dark;
    return theme.palette.error.main;
  };

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            bgcolor: 'rgba(255,255,255,0.7)',
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Growing your plant...
          </Typography>
        </Box>
      )}
      
      <Spline
        scene="https://prod.spline.design/8VKOoWnnBtZ7SuPp/scene.splinecode"
        onLoad={handleSplineLoad}
        style={{ height: '100%', width: '100%' }}
      />
    </Box>
  );
}
