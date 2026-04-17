import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import type { GeoPoint } from "../types/checklist";

export const useLocationCapture = () => {
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);

  useEffect(() => {
    const requestPermissionAsync = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(permission.status === "granted");
    };

    void requestPermissionAsync();
  }, []);

  const captureLocationAsync = useCallback(async (): Promise<GeoPoint | null> => {
    if (!hasLocationPermission) {
      return null;
    }

    setIsLoadingLocation(true);

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  }, [hasLocationPermission]);

  return { hasLocationPermission, isLoadingLocation, captureLocationAsync };
};

