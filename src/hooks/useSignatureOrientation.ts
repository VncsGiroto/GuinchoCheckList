import { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";

export const useSignatureOrientation = (isOpen: boolean) => {
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [signatureKey, setSignatureKey] = useState(0);

  useEffect(() => {
    const waitForLandscapeAsync = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { width, height } = Dimensions.get("window");
        if (width > height) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    };

    const applySignatureOrientationAsync = async () => {
      if (isOpen) {
        setIsCanvasReady(false);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        await waitForLandscapeAsync();
        await new Promise((resolve) => setTimeout(resolve, 120));
        setSignatureKey((current) => current + 1);
        setIsCanvasReady(true);
      } else {
        setIsCanvasReady(false);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    };

    void applySignatureOrientationAsync();

    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [isOpen]);

  return { isCanvasReady, signatureKey };
};
