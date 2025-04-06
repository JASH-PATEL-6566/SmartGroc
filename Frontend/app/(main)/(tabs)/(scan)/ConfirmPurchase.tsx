// "use client"

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { collection, addDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLOR_CONST } from "@/constants/color";
import { db } from "@/config/firebaseConfig";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type ProductWithExpiry = {
  id: string;
  name: string;
  brand: string;
  calories: string;
  imageUrl: string;
  data: string;
  quantity: number;
  expiryDate?: string | null;
};

// AWS S3 Configuration
// These should be stored in environment variables in a production app
const S3_REGION = "us-east-2"; // e.g., us-east-1
const S3_BUCKET = "smartgroc-bucket";

// Upload to AWS S3 using direct PUT request

export default function ConfirmOrder() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [storeAddress, setStoreAddress] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [grandTotal, setGrandTotal] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithExpiry[]>([]);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const { uid } = useSelector((state: RootState) => state.auth.user);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadProducts();
    requestLocationPermission();
  }, []);

  const loadProducts = async () => {
    try {
      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        // console.log("Loaded products from AsyncStorage:", parsedProducts);
        setProducts(parsedProducts);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        getCurrentLocation();
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const currentLoc = await Location.getCurrentPositionAsync({});
      setCurrentLocation(currentLoc);

      // If no location is set yet, also set it as the selected location
      if (!location) {
        setLocation(currentLoc);
      }

      // Update map region to show current location
      setMapRegion({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const searchAddress = async () => {
    if (!storeAddress.trim()) {
      Alert.alert("Error", "Please enter a store address");
      return;
    }

    try {
      setIsLoading(true);
      const geocodedLocation = await Location.geocodeAsync(storeAddress);

      if (geocodedLocation.length > 0) {
        const { latitude, longitude } = geocodedLocation[0];

        // Create a location object similar to what getCurrentLocation provides
        const newLocation = {
          coords: {
            latitude,
            longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        };

        setLocation(newLocation);
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      } else {
        Alert.alert(
          "Error",
          "Could not find the location. Please try a different address."
        );
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      Alert.alert("Error", "Failed to find the location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      Alert.alert("Select Receipt", "Choose how you want to add your receipt", [
        {
          text: "Take Photo",
          onPress: takePhoto,
        },
        {
          text: "Choose from Gallery",
          onPress: chooseFromGallery,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("Error with image picker:", error);
      Alert.alert("Error", "Failed to open image picker. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera permission is required to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setReceipt(result.assets[0].uri);
        // Call API to extract grand total from receipt
        extractGrandTotal(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const chooseFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setReceipt(result.assets[0].uri);
        // Call API to extract grand total from receipt
        extractGrandTotal(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const extractGrandTotal = async (imageUri: string) => {
    setIsLoading(true);
    try {
      // For now, just set a default value
      setGrandTotal("2.5");
    } catch (error) {
      console.error("Error extracting grand total:", error);
      Alert.alert(
        "Manual Entry Required",
        "Could not extract grand total. Please enter it manually."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const uploadToS3 = async (imageUri: string) => {
    setUploadingReceipt(true);
    setUploadProgress(0);

    try {
      // Fetch the image file and convert it to a blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Generate a unique filename for the image
      const filename = `receipts/${uid}_${Date.now()}.jpg`;

      // Construct the S3 upload URL
      const uploadURL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${filename}`;

      // Create the headers
      const headers = {
        "Content-Type": "image/jpeg", // Content type of the image
      };

      // Upload the image to S3 using a PUT request
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: blob,
        headers,
      });

      // Check if the upload was successful
      if (!uploadRes.ok) throw new Error("Failed to upload image");

      // console.log("✅ Image uploaded successfully:", uploadURL);

      return uploadURL; // Return the URL of the uploaded image
    } catch (error: unknown) {
      console.error(
        "❌ Error uploading to S3:",
        error instanceof Error ? error.message : error
      );
      Alert.alert(
        "Upload Error",
        error instanceof Error ? error.message : "Unknown upload error."
      );
      throw error;
    } finally {
      setUploadingReceipt(false); // Reset the uploading state
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert("Error", "Please provide a store location");
      return;
    }

    if (!grandTotal) {
      Alert.alert("Error", "Please provide the grand total");
      return;
    }

    setIsLoading(true);

    try {
      if (!uid) {
        Alert.alert("Error", "User not found");
        return;
      }

      let receiptUrl = "";
      if (receipt) {
        try {
          receiptUrl = await uploadToS3(receipt);
        } catch (error) {
          console.error("Failed to upload receipt:", error);
          Alert.alert(
            "Warning",
            "Failed to upload receipt image, but we'll continue with the purchase."
          );
        }
      }

      // Reference to user's purchase collection
      const userPurchaseRef = collection(db, "users", uid, "purchase");

      // Save purchase document
      const purchaseData = {
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        storeAddress,
        receiptUrl,
        grandTotal: Number.parseFloat(grandTotal),
        timestamp: new Date(),
      };

      const purchaseDocRef = await addDoc(userPurchaseRef, purchaseData);

      // Reference to products collection within the purchase document
      const productsRef = collection(purchaseDocRef, "products");

      // console.log("Products to save to Firestore:", products);

      // Store entire product objects inside the products subcollection
      const productPromises = products.map((product) => {
        // Parse the product data if available
        let productDetails = null;
        if (product.data) {
          try {
            productDetails = JSON.parse(product.data);
          } catch (error) {
            console.error("Error parsing product data:", error);
          }
        }

        // console.log("Saving product to Firestore:", {
        //   ...product,
        //   expiryDate: product.expiryDate || null,
        //   data: product.data || null, // Store the complete product data
        // });

        return addDoc(productsRef, {
          name: product.name,
          brand: product.brand,
          calories: product.calories,
          imageUrl: product.imageUrl,
          quantity: product.quantity,
          available_quantity: product.quantity, // Initialize available_quantity to be the same as quantity
          expiryDate: product.expiryDate || null,
          data: product.data || null, // Store the complete product data JSON string
          // Store additional fields from productDetails if available
          ...(productDetails?.foods?.[0]
            ? {
                serving_qty: productDetails.foods[0].serving_qty,
                serving_unit: productDetails.foods[0].serving_unit,
                nf_calories: productDetails.foods[0].nf_calories,
                nf_total_fat: productDetails.foods[0].nf_total_fat,
                nf_total_carbohydrate:
                  productDetails.foods[0].nf_total_carbohydrate,
                nf_protein: productDetails.foods[0].nf_protein,
                nf_ingredient_statement:
                  productDetails.foods[0].nf_ingredient_statement,
                full_nutrients: productDetails.foods[0].full_nutrients,
              }
            : {}),
        });
      });

      await Promise.all(productPromises);

      // Clear cart
      await AsyncStorage.setItem("@scanned_products", JSON.stringify([]));

      Alert.alert("Success", "Purchase recorded successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/(main)/(tabs)/(scan)/Scan"),
        },
      ]);
    } catch (error) {
      console.error("Error recording purchase:", error);
      Alert.alert("Error", "Failed to record purchase. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const renderProductItem = ({ item }: { item: ProductWithExpiry }) => (
    <View style={styles.productItem}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <MaterialCommunityIcons name="food" size={24} color="#888" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productBrand} numberOfLines={1}>
          {item.brand}
        </Text>
        <View style={styles.productDetails}>
          <Text style={styles.productQuantity}>Qty: {item.quantity}</Text>
          {item.expiryDate && (
            <View style={styles.expiryInfo}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={14}
                color={COLOR_CONST.light_green}
              />
              <Text style={styles.expiryText}>
                Expires: {formatDate(item.expiryDate)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Confirm Purchase</Text>

            {/* Store Address Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Store Location</Text>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Enter store address"
                  value={storeAddress}
                  onChangeText={setStoreAddress}
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={searchAddress}
                  disabled={isLoading}
                >
                  <Feather name="search" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Map Section */}
            <View style={styles.mapContainer}>
              {mapRegion ? (
                <MapView style={styles.map} region={mapRegion}>
                  {/* Selected location marker */}
                  {location && (
                    <Marker
                      coordinate={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                      }}
                      pinColor="#1890ff" // Blue pin for selected location
                      title="Selected Location"
                    />
                  )}

                  {/* Current location marker (always shown) */}
                  {currentLocation && (
                    <Marker
                      coordinate={{
                        latitude: currentLocation.coords.latitude,
                        longitude: currentLocation.coords.longitude,
                      }}
                      pinColor={COLOR_CONST.light_green} // Green pin for current location
                      title="Current Location"
                    >
                      <View style={styles.currentLocationMarker}>
                        <View style={styles.currentLocationDot} />
                      </View>
                    </Marker>
                  )}
                </MapView>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Text>Loading map...</Text>
                </View>
              )}

              {/* Current Location Button */}
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={getCurrentLocation}
              >
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={24}
                  color={COLOR_CONST.light_green}
                />
              </TouchableOpacity>
            </View>

            {/* Products Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Products ({products.length})
              </Text>

              <View style={styles.productsList}>
                <FlatList
                  data={products}
                  renderItem={renderProductItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                  )}
                />
              </View>
            </View>

            {/* Receipt Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload Receipt</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                {receipt ? (
                  <View style={styles.receiptContainer}>
                    <Image
                      source={{ uri: receipt }}
                      style={styles.receiptPreview}
                    />
                    <TouchableOpacity
                      style={styles.changeReceiptButton}
                      onPress={pickImage}
                    >
                      <Text style={styles.changeReceiptText}>Change</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Feather
                      name="camera"
                      size={32}
                      color={COLOR_CONST.light_green}
                    />
                    <Text style={styles.uploadButtonText}>
                      Take Photo or Select Receipt
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.receiptNote}>
                Receipt will be stored securely and can be viewed later in
                purchase details
              </Text>
            </View>

            {/* Grand Total */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Grand Total</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter grand total"
                value={grandTotal}
                onChangeText={setGrandTotal}
                keyboardType="numeric"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading || uploadingReceipt}
            >
              {isLoading || uploadingReceipt ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" />
                  <Text style={styles.loadingText}>
                    {uploadingReceipt
                      ? "Uploading receipt..."
                      : "Recording purchase..."}
                  </Text>
                </View>
              ) : (
                <Text style={styles.submitButtonText}>Record Purchase</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  currentLocationButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 50,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  currentLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 150, 0, 0.2)",
    borderWidth: 1,
    borderColor: COLOR_CONST.light_green,
    justifyContent: "center",
    alignItems: "center",
  },
  currentLocationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLOR_CONST.light_green,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: COLOR_CONST.light_green,
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 12,
    overflow: "hidden",
  },
  uploadPlaceholder: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: COLOR_CONST.light_green,
    fontSize: 16,
    textAlign: "center",
  },
  receiptContainer: {
    position: "relative",
    width: "100%",
  },
  receiptPreview: {
    width: "100%",
    height: 200,
  },
  changeReceiptButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  changeReceiptText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  receiptNote: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  submitButton: {
    backgroundColor: COLOR_CONST.light_green,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  productsList: {
    marginTop: 10,
  },
  productItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
  },
  productBrand: {
    fontSize: 14,
    color: "#666",
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#888",
  },
  expiryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  expiryText: {
    fontSize: 12,
    color: COLOR_CONST.light_green,
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
});
