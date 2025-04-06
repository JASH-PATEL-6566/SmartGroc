"use client";

import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { COLOR_CONST } from "@/constants/color";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import SafeAreaViewBackground from "@/components/SafeAreaViewBackground";

const { width, height } = Dimensions.get("window");

type PurchaseLocation = {
  id: string;
  storeAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  purchaseCount: number;
  totalSpent: number;
};

export default function MapScreen() {
  const router = useRouter();
  const { uid } = useSelector((state: RootState) => state.auth.user);
  const [purchaseLocations, setPurchaseLocations] = useState<
    PurchaseLocation[]
  >([]);
  const [filteredLocations, setFilteredLocations] = useState<
    PurchaseLocation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchPurchaseLocations();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLocations(purchaseLocations);
      setShowSuggestions(false);
    } else {
      const filtered = purchaseLocations.filter((location) =>
        location.storeAddress.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowSuggestions(true);
    }
  }, [searchQuery, purchaseLocations]);

  const fetchPurchaseLocations = async () => {
    if (!uid) return;

    try {
      setLoading(true);
      const purchasesRef = collection(db, "users", uid, "purchase");
      const purchasesSnapshot = await getDocs(purchasesRef);

      // Group purchases by location
      const locationMap = new Map<string, PurchaseLocation>();

      purchasesSnapshot.forEach((doc) => {
        const purchaseData = doc.data();

        if (purchaseData.location) {
          // Create a unique key for this location
          const locationKey = `${purchaseData.location.latitude}-${purchaseData.location.longitude}`;

          if (locationMap.has(locationKey)) {
            // Update existing location data
            const existingLocation = locationMap.get(locationKey)!;
            locationMap.set(locationKey, {
              ...existingLocation,
              purchaseCount: existingLocation.purchaseCount + 1,
              totalSpent:
                existingLocation.totalSpent + (purchaseData.grandTotal || 0),
            });
          } else {
            // Add new location
            locationMap.set(locationKey, {
              id: doc.id,
              storeAddress: purchaseData.storeAddress || "Unknown Location",
              location: purchaseData.location,
              purchaseCount: 1,
              totalSpent: purchaseData.grandTotal || 0,
            });
          }
        }
      });

      const locations = Array.from(locationMap.values());
      setPurchaseLocations(locations);
      setFilteredLocations(locations);

      // If we have locations, center the map on the first one
      if (locations.length > 0) {
        setRegion({
          latitude: locations[0].location.latitude,
          longitude: locations[0].location.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error("Error fetching purchase locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (location: PurchaseLocation) => {
    router.push({
      pathname: "/(main)/purchaseHistory",
      params: {
        latitude: location.location.latitude.toString(),
        longitude: location.location.longitude.toString(),
        address: location.storeAddress,
      },
    });
  };

  const handleSuggestionPress = (location: PurchaseLocation) => {
    setSearchQuery(location.storeAddress);
    setShowSuggestions(false);

    // Animate to the selected location
    mapRef.current?.animateToRegion(
      {
        latitude: location.location.latitude,
        longitude: location.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setShowSuggestions(false);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaViewBackground>
        <View style={styles.container}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Feather
                name="search"
                size={20}
                color="#666"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search locations..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setShowSuggestions(true)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Feather name="x" size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchPurchaseLocations}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={24}
                color={COLOR_CONST.light_green}
              />
            </TouchableOpacity>
          </View>

          {/* Location Suggestions */}
          {showSuggestions && filteredLocations.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={filteredLocations}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(item)}
                  >
                    <Feather
                      name="map-pin"
                      size={16}
                      color="#666"
                      style={styles.suggestionIcon}
                    />
                    <View style={styles.suggestionTextContainer}>
                      <Text style={styles.suggestionText}>
                        {item.storeAddress}
                      </Text>
                      <Text style={styles.suggestionSubtext}>
                        {item.purchaseCount}{" "}
                        {item.purchaseCount === 1 ? "purchase" : "purchases"} •
                        ${item.totalSpent.toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.suggestionsList}
              />
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLOR_CONST.light_green} />
              <Text style={styles.loadingText}>
                Loading purchase locations...
              </Text>
            </View>
          ) : purchaseLocations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={64}
                color="#888"
              />
              <Text style={styles.emptyText}>No purchase locations found</Text>
              <Text style={styles.emptySubtext}>
                Your purchase history locations will appear here
              </Text>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
            >
              {purchaseLocations.map((location, index) => (
                <Marker
                  key={index}
                  coordinate={{
                    latitude: location.location.latitude,
                    longitude: location.location.longitude,
                  }}
                  pinColor={COLOR_CONST.light_green}
                >
                  <Callout tooltip onPress={() => handleMarkerPress(location)}>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>
                        {location.storeAddress}
                      </Text>
                      <Text style={styles.calloutText}>
                        {location.purchaseCount}{" "}
                        {location.purchaseCount === 1
                          ? "purchase"
                          : "purchases"}
                      </Text>
                      <Text style={styles.calloutText}>
                        Total: ${location.totalSpent.toFixed(2)}
                      </Text>
                      <View style={styles.calloutButton}>
                        <Text style={styles.calloutAction}>
                          Tap to view details
                        </Text>
                      </View>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          )}
        </View>
      </SafeAreaViewBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 64,
    left: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsList: {
    borderRadius: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  suggestionSubtext: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#555",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  calloutContainer: {
    width: 200,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  calloutButton: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 8,
    alignItems: "center",
  },
  calloutAction: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
    textAlign: "center",
  },
});
