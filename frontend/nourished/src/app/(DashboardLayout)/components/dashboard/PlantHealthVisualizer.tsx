import { useEffect, useRef, useState } from "react";
import Spline from "@splinetool/react-spline";

interface PlantHealthVisualizerProps {
  plantHealth: number;
}

export default function PlantHealthVisualizer({
  plantHealth,
}: PlantHealthVisualizerProps) {
  const splineRef = useRef<{
    emitEvent: (event: string, key?: any) => void;
  } | null>(null);
  const [isSplineLoaded, setIsSplineLoaded] = useState(false);
  const [plantState, setPlantState] = useState("Base State");

  const handleSplineLoad = (spline: any) => {
    console.log("✅ Spline scene loaded");
    splineRef.current = spline;
    setIsSplineLoaded(true);

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

  return (
    <Spline
      scene="https://prod.spline.design/8VKOoWnnBtZ7SuPp/scene.splinecode"
      onLoad={handleSplineLoad}
    />
  );
}
