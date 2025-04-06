"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLOR_CONST } from "@/constants/color";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import ReactNativeZoomableView from "@openspacelabs/react-native-zoomable-view/src/ReactNativeZoomableView";

const { width, height } = Dimensions.get("window");

export default function ReceiptViewer() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const receiptUrl = params.receiptUrl as string;
  const purchaseDate = params.purchaseDate
    ? new Date(params.purchaseDate as string)
    : new Date();
  const storeAddress = params.storeAddress as string;

  useEffect(() => {
    // Check for media library permissions
    const checkPermissions = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermissionGranted(status === "granted");
    };

    checkPermissions();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError("Failed to load receipt image");
  };

  const shareReceipt = async () => {
    try {
      // Share the receipt URL
      await Share.share({
        url: receiptUrl,
        message: `Receipt from ${storeAddress} on ${formatDate(purchaseDate)}`,
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);
      Alert.alert("Error", "Failed to share receipt");
    }
  };

  const downloadReceipt = async () => {
    if (!permissionGranted) {
      Alert.alert(
        "Permission Required",
        "Storage permission is required to save the receipt to your device",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Grant Permission",
            onPress: async () => {
              const { status } = await MediaLibrary.requestPermissionsAsync();
              setPermissionGranted(status === "granted");
              if (status === "granted") {
                performDownload();
              }
            },
          },
        ]
      );
      return;
    }

    performDownload();
  };

  const performDownload = async () => {
    try {
      setDownloading(true);

      // Generate a unique filename
      const filename = `receipt-${Date.now()}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(
        receiptUrl,
        fileUri
      );

      if (downloadResult.status === 200) {
        // Save to media library
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync("SmartGroc Receipts", asset, false);

        Alert.alert("Success", "Receipt saved to your device");
      } else {
        throw new Error("Download failed");
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      Alert.alert("Error", "Failed to download receipt");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Receipt</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {formatDate(purchaseDate)} • {storeAddress}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLOR_CONST.light_green} />
            <Text style={styles.loadingText}>Loading receipt...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="image-off" size={64} color="#888" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ReactNativeZoomableView
            maxZoom={3}
            minZoom={1}
            zoomStep={0.5}
            initialZoom={1}
            bindToBorders={true}
            style={styles.zoomContainer}
          >
            <Image
              source={{ uri: receiptUrl }}
              style={styles.receiptImage}
              onLoad={handleImageLoad}
              onError={handleImageError}
              resizeMode="contain"
            />
          </ReactNativeZoomableView>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={shareReceipt}>
          <Feather name="share-2" size={20} color="white" />
          <Text style={styles.footerButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerButton,
            downloading && styles.footerButtonDisabled,
          ]}
          onPress={downloadReceipt}
          disabled={downloading}
        >
          {downloading ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.footerButtonText}>Downloading...</Text>
            </>
          ) : (
            <>
              <Feather name="download" size={20} color="white" />
              <Text style={styles.footerButtonText}>Save to Device</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  content: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  zoomContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  receiptImage: {
    width: width,
    height: height - 150, // Adjust for header and footer
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLOR_CONST.light_green,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  footerButtonDisabled: {
    backgroundColor: "#aaa",
  },
  footerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
});
