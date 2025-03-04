// import { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   Image,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
//   SafeAreaView,
// } from "react-native";
// import { useRouter } from "expo-router";
// import MapView, { Marker } from "react-native-maps";
// import * as Location from "expo-location";
// import * as ImagePicker from "expo-image-picker";
// import { Feather } from "@expo/vector-icons";
// import { collection, addDoc } from "firebase/firestore";
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { COLOR_CONST } from "@/constants/color";
// import { db, storage } from "@/config/firebaseConfig";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// type ReceiptFile = {
//   uri: string;
//   type: string;
//   name: string;
// };

// type MapRegion = {
//   latitude: number;
//   longitude: number;
//   latitudeDelta: number;
//   longitudeDelta: number;
// };

// export default function ConfirmOrder() {
//   const router = useRouter();
//   const [location, setLocation] = useState<Location.LocationObject | null>(
//     null
//   );
//   const [storeAddress, setStoreAddress] = useState("");
//   const [receipt, setReceipt] = useState<string | null>(null);
//   const [grandTotal, setGrandTotal] = useState<string>("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [products, setProducts] = useState([]);
//   const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);

//   useEffect(() => {
//     loadProducts();
//     requestLocationPermission();
//   }, []);

//   const loadProducts = async () => {
//     try {
//       const savedProducts = await AsyncStorage.getItem("@scanned_products");
//       if (savedProducts) {
//         setProducts(JSON.parse(savedProducts));
//       }
//     } catch (error) {
//       console.error("Error loading products:", error);
//     }
//   };

//   const requestLocationPermission = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status === "granted") {
//         getCurrentLocation();
//       }
//     } catch (error) {
//       console.error("Error requesting location permission:", error);
//     }
//   };

//   const getCurrentLocation = async () => {
//     try {
//       const currentLocation = await Location.getCurrentPositionAsync({});
//       setLocation(currentLocation);
//       setMapRegion({
//         latitude: currentLocation.coords.latitude,
//         longitude: currentLocation.coords.longitude,
//         latitudeDelta: 0.005,
//         longitudeDelta: 0.005,
//       });
//     } catch (error) {
//       console.error("Error getting location:", error);
//     }
//   };

//   const searchAddress = async () => {
//     if (!storeAddress.trim()) {
//       Alert.alert("Error", "Please enter a store address");
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const geocodedLocation = await Location.geocodeAsync(storeAddress);

//       if (geocodedLocation.length > 0) {
//         const { latitude, longitude } = geocodedLocation[0];

//         // Create a location object similar to what getCurrentLocation provides
//         const newLocation = {
//           coords: {
//             latitude,
//             longitude,
//             altitude: null,
//             accuracy: null,
//             altitudeAccuracy: null,
//             heading: null,
//             speed: null,
//           },
//           timestamp: Date.now(),
//         };

//         setLocation(newLocation);
//         setMapRegion({
//           latitude,
//           longitude,
//           latitudeDelta: 0.005,
//           longitudeDelta: 0.005,
//         });
//       } else {
//         Alert.alert(
//           "Error",
//           "Could not find the location. Please try a different address."
//         );
//       }
//     } catch (error) {
//       console.error("Error geocoding address:", error);
//       Alert.alert("Error", "Failed to find the location. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const pickImage = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 1,
//       });

//       if (!result.canceled) {
//         setReceipt(result.assets[0].uri);
//         // Call API to extract grand total from receipt
//         extractGrandTotal(result.assets[0].uri);
//       }
//     } catch (error) {
//       console.error("Error picking image:", error);
//       Alert.alert("Error", "Failed to pick image. Please try again.");
//     }
//   };

//   const extractGrandTotal = async (imageUri: string) => {
//     setIsLoading(true);
//     try {
//       const formData = new FormData();

//       // Create the file object with the correct type
//       const fileToUpload = {
//         uri: imageUri,
//         type: "image/jpeg",
//         name: "receipt.jpg",
//       } as unknown as Blob;

//       // Append to FormData
//       formData.append("receipt", fileToUpload);

//       const response = await fetch("YOUR_RECEIPT_OCR_API_ENDPOINT", {
//         method: "POST",
//         body: formData,
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       const data = await response.json();
//       if (data.grandTotal) {
//         setGrandTotal(data.grandTotal.toString());
//       } else {
//         Alert.alert(
//           "Manual Entry Required",
//           "Could not extract grand total. Please enter it manually."
//         );
//       }
//     } catch (error) {
//       console.error("Error extracting grand total:", error);
//       Alert.alert(
//         "Manual Entry Required",
//         "Could not extract grand total. Please enter it manually."
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const extractGrandTotalWithXHR = async (imageUri: string) => {
//     setIsLoading(true);

//     return new Promise((resolve, reject) => {
//       const xhr = new XMLHttpRequest();
//       const formData = new FormData();

//       formData.append("receipt", {
//         uri: imageUri,
//         type: "image/jpeg",
//         name: "receipt.jpg",
//       } as unknown as Blob);

//       xhr.onreadystatechange = () => {
//         if (xhr.readyState === 4) {
//           if (xhr.status === 200) {
//             try {
//               const response = JSON.parse(xhr.responseText);
//               if (response.grandTotal) {
//                 setGrandTotal(response.grandTotal.toString());
//                 resolve(response);
//               } else {
//                 Alert.alert(
//                   "Manual Entry Required",
//                   "Could not extract grand total. Please enter it manually."
//                 );
//                 reject(new Error("No grand total found"));
//               }
//             } catch (error) {
//               console.error("Error parsing response:", error);
//               reject(error);
//             }
//           } else {
//             reject(new Error("Request failed"));
//           }
//           setIsLoading(false);
//         }
//       };

//       xhr.open("POST", "YOUR_RECEIPT_OCR_API_ENDPOINT");
//       xhr.setRequestHeader("Content-Type", "multipart/form-data");
//       xhr.setRequestHeader("Accept", "application/json");
//       xhr.send(formData);
//     });
//   };

//   const handleSubmit = async () => {
//     if (!location) {
//       Alert.alert("Error", "Please provide a store location");
//       return;
//     }

//     if (!receipt) {
//       Alert.alert("Error", "Please upload a receipt");
//       return;
//     }

//     if (!grandTotal) {
//       Alert.alert("Error", "Please provide the grand total");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       // Create a blob from the receipt URI
//       const response = await fetch(receipt);
//       const blob = await response.blob();

//       // Upload receipt to Firebase Storage
//       const storageRef = ref(storage, `receipts/${Date.now()}.jpg`);
//       await uploadBytes(storageRef, blob);
//       const receiptUrl = await getDownloadURL(storageRef);

//       // Save purchase to Firestore
//       const purchaseData = {
//         products,
//         location: {
//           latitude: location.coords.latitude,
//           longitude: location.coords.longitude,
//         },
//         storeAddress: storeAddress,
//         receiptUrl,
//         grandTotal: Number.parseFloat(grandTotal),
//         timestamp: new Date(),
//       };

//       await addDoc(collection(db, "purchases"), purchaseData);

//       // Clear cart
//       await AsyncStorage.setItem("@scanned_products", JSON.stringify([]));

//       Alert.alert("Success", "Purchase recorded successfully!", [
//         {
//           text: "OK",
//           onPress: () => router.replace("/(main)/(tabs)/(scan)/Scan"),
//         },
//       ]);
//     } catch (error) {
//       console.error("Error recording purchase:", error);
//       Alert.alert("Error", "Failed to record purchase. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
//       <ScrollView style={styles.container}>
//         <Text style={styles.title}>Confirm Purchase</Text>

//         {/* Store Address Input */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Store Location</Text>
//           <View style={styles.searchContainer}>
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Enter store address"
//               value={storeAddress}
//               onChangeText={setStoreAddress}
//             />
//             <TouchableOpacity
//               style={styles.searchButton}
//               onPress={searchAddress}
//               disabled={isLoading}
//             >
//               <Feather name="search" size={20} color="white" />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Map Section */}
//         <View style={styles.mapContainer}>
//           {mapRegion ? (
//             <MapView style={styles.map} region={mapRegion}>
//               {location && (
//                 <Marker
//                   coordinate={{
//                     latitude: location.coords.latitude,
//                     longitude: location.coords.longitude,
//                   }}
//                 />
//               )}
//             </MapView>
//           ) : (
//             <View style={styles.mapPlaceholder}>
//               <Text>Loading map...</Text>
//             </View>
//           )}

//           {/* Current Location Button */}
//           <TouchableOpacity
//             style={styles.currentLocationButton}
//             onPress={getCurrentLocation}
//           >
//             <MaterialCommunityIcons
//               name="crosshairs-gps"
//               size={24}
//               color={COLOR_CONST.light_green}
//             />
//           </TouchableOpacity>
//         </View>

//         {/* Receipt Upload */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Upload Receipt</Text>
//           <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
//             {receipt ? (
//               <Image source={{ uri: receipt }} style={styles.receiptPreview} />
//             ) : (
//               <>
//                 <Feather
//                   name="upload"
//                   size={24}
//                   color={COLOR_CONST.light_green}
//                 />
//                 <Text style={styles.uploadButtonText}>Select Receipt</Text>
//               </>
//             )}
//           </TouchableOpacity>
//         </View>

//         {/* Grand Total */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Grand Total</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Enter grand total"
//             value={grandTotal}
//             onChangeText={setGrandTotal}
//             keyboardType="numeric"
//           />
//         </View>

//         {/* Submit Button */}
//         <TouchableOpacity
//           style={styles.submitButton}
//           onPress={handleSubmit}
//           disabled={isLoading}
//         >
//           {isLoading ? (
//             <ActivityIndicator color="white" />
//           ) : (
//             <Text style={styles.submitButtonText}>Record Purchase</Text>
//           )}
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     padding: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   mapContainer: {
//     height: 250,
//     borderRadius: 12,
//     overflow: "hidden",
//     marginBottom: 20,
//     position: "relative",
//   },
//   map: {
//     flex: 1,
//   },
//   mapPlaceholder: {
//     flex: 1,
//     backgroundColor: "#f0f0f0",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   currentLocationButton: {
//     position: "absolute",
//     bottom: 16,
//     right: 16,
//     backgroundColor: "white",
//     borderRadius: 50,
//     width: 48,
//     height: 48,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   section: {
//     marginBottom: 15,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "600",
//     marginBottom: 10,
//   },
//   searchContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   searchInput: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     marginRight: 8,
//   },
//   searchButton: {
//     backgroundColor: COLOR_CONST.light_green,
//     padding: 12,
//     borderRadius: 8,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//   },
//   uploadButton: {
//     borderWidth: 2,
//     borderColor: "#ddd",
//     borderStyle: "dashed",
//     borderRadius: 12,
//     padding: 20,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   uploadButtonText: {
//     // marginTop: 8,
//     color: COLOR_CONST.light_green,
//     fontSize: 16,
//   },
//   receiptPreview: {
//     width: "100%",
//     height: 200,
//     borderRadius: 8,
//   },
//   submitButton: {
//     backgroundColor: COLOR_CONST.light_green,
//     padding: 16,
//     borderRadius: 12,
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   submitButtonText: {
//     color: "white",
//     fontSize: 18,
//     fontWeight: "bold",
//   },
// });
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
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLOR_CONST } from "@/constants/color";
import { db, storage } from "@/config/firebaseConfig";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type ReceiptFile = {
  uri: string;
  type: string;
  name: string;
};

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export default function ConfirmOrder() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [storeAddress, setStoreAddress] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [grandTotal, setGrandTotal] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);

  useEffect(() => {
    loadProducts();
    requestLocationPermission();
  }, []);

  const loadProducts = async () => {
    try {
      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
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
        aspect: [4, 3],
        quality: 1,
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
        aspect: [4, 3],
        quality: 1,
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
      const formData = new FormData();

      // Create the file object with the correct type
      const fileToUpload = {
        uri: imageUri,
        type: "image/jpeg",
        name: "receipt.jpg",
      } as unknown as Blob;

      // Append to FormData
      formData.append("file", fileToUpload);

      const response = await fetch(
        "http://18.119.129.231:5001/extract_receipt_data",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const data = await response.json();
      console.log(data);

      if (data.total_amount) {
        setGrandTotal(data.total_amount.toString());
      } else {
        Alert.alert(
          "Manual Entry Required",
          "Could not extract grand total. Please enter it manually."
        );
      }
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

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert("Error", "Please provide a store location");
      return;
    }

    if (!receipt) {
      Alert.alert("Error", "Please upload a receipt");
      return;
    }

    if (!grandTotal) {
      Alert.alert("Error", "Please provide the grand total");
      return;
    }

    setIsLoading(true);

    try {
      // Create a blob from the receipt URI
      const response = await fetch(receipt);
      const blob = await response.blob();

      // Upload receipt to Firebase Storage
      const storageRef = ref(storage, `receipts/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const receiptUrl = await getDownloadURL(storageRef);

      // Save purchase to Firestore
      const purchaseData = {
        products,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        storeAddress: storeAddress,
        receiptUrl,
        grandTotal: Number.parseFloat(grandTotal),
        timestamp: new Date(),
      };

      await addDoc(collection(db, "purchases"), purchaseData);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView style={styles.container}>
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
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Record Purchase</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  submitButton: {
    backgroundColor: COLOR_CONST.light_green,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    // marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
