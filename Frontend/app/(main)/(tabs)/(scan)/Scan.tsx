import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { COLOR_CONST } from "@/constants/color";
import ScannedProductsList from "./Cart";

const API_URL = "https://trackapi.nutritionix.com/v2/search/item/?upc=";
const API_HEADERS = {
  "x-app-key": process.env.EXPO_PUBLIC_NUTRITIONIX_KEY || "",
  "x-app-id": process.env.EXPO_PUBLIC_NUTRITIONIX_ID || "",
};

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastScannedBarcode = useRef<string | null>(null);
  const isProcessing = useRef(false);
  const router = useRouter();

  // **Handle Manual Permission Request**
  const handlePermissionRequest = async () => {
    const result = await requestPermission();
    console.log("Permission result:", result);
  };

  // **Show Permission Request UI if Not Granted**
  if (!permission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>
          We need permission to access the camera
        </Text>
        <TouchableOpacity
          onPress={handlePermissionRequest}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // **Barcode Scanning Function**
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (isProcessing.current || data === lastScannedBarcode.current) return;

    isProcessing.current = true;
    lastScannedBarcode.current = data;
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}${data}`, {
        headers: API_HEADERS,
      });

      if (!response.ok) throw new Error("Failed to fetch product details");

      const productData = await response.json();
      setLoading(false);
      setCameraActive(false);

      // Navigate to Product Details Screen
      router.push({
        pathname: "/(main)/(tabs)/(scan)/productDetails",
        params: { data: JSON.stringify(productData) },
      });
    } catch (error) {
      setLoading(false);
      alert("Failed to fetch product details. Try again.");
    } finally {
      setTimeout(() => {
        isProcessing.current = false;
      }, 3000);
    }
  };

  const handleScanPress = () => {
    setCameraActive(true);
    lastScannedBarcode.current = null;
    isProcessing.current = false;
  };

  // If camera is active, show the camera view
  if (cameraActive) {
    return (
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>
                Fetching product details...
              </Text>
            </View>
          ) : (
            <CameraView
              style={styles.camera}
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["upc_a", "upc_e"],
              }}
            >
              <View style={styles.scanArea} />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCameraActive(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </CameraView>
          )}
        </View>
      </View>
    );
  }

  // Otherwise, show the list of scanned products
  return <ScannedProductsList onScanPress={handleScanPress} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionButton: {
    backgroundColor: COLOR_CONST.light_green,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  permissionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: COLOR_CONST.light_green,
    borderRadius: 15,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -125 }, { translateY: -125 }],
  },
  closeButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    color: "white",
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
    color: "#666",
    textAlign: "center",
  },
});
