import { useEffect, useRef, useState } from "react";
import Spline from "@splinetool/react-spline";
import { Box, Typography, CircularProgress, useTheme } from "@mui/material";

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
  const [isLoading, setIsLoading] = useState(true);

  const handleSplineLoad = (spline: any) => {
    console.log("✅ Spline scene loaded");
    splineRef.current = spline;
    setIsSplineLoaded(true);
    setIsLoading(false);

    // Trigger the start event after a short delay
    setTimeout(() => {
      console.log("▶️ Triggering Start event");
      spline.emitEvent("Start");
    }, 500);
  };

  const changePlantState = (key: string) => {
    if (!isSplineLoaded || !splineRef.current) {
      console.warn("⏳ Spline is not fully loaded yet.");
      return;
    }

    console.log(`🔹 Attempting to trigger key ${key}`);

    // Emit keyPress event to the Spline scene
    splineRef.current.emitEvent("keyPress", key);

    // Dispatch a KeyboardEvent to simulate a key press
    const keyCode = 48 + parseInt(key, 10);
    const keyEvent = new KeyboardEvent("keydown", {
      key: key,
      code: `Digit${key}`,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(keyEvent);
  };

  // When the plantHealth prop changes (and Spline is loaded), trigger the animation change.
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

  return (
    <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
      {isLoading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            bgcolor: "rgba(255,255,255,0.7)",
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
        style={{ height: "100%", width: "100%" }}
      />
    </Box>
  );
}
