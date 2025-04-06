"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { COLOR_CONST } from "@/constants/color";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

type Purchase = {
  id: string;
  timestamp: Date;
  grandTotal: number;
  receiptUrl?: string;
  products: any[];
};

export default function PurchaseHistory() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { uid } = useSelector((state: RootState) => state.auth.user);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState<string>("");

  const latitude = Number.parseFloat(params.latitude as string);
  const longitude = Number.parseFloat(params.longitude as string);
  const address = params.address as string;

  useEffect(() => {
    fetchPurchaseHistory();
  }, []);

  const fetchPurchaseHistory = async () => {
    if (!uid || isNaN(latitude) || isNaN(longitude)) return;

    try {
      setLoading(true);
      const purchasesRef = collection(db, "users", uid, "purchase");

      // Query purchases at this location
      const purchasesSnapshot = await getDocs(purchasesRef);

      const purchasesList: Purchase[] = [];
      let debugInfo = `Target: ${latitude.toFixed(6)}, ${longitude.toFixed(
        6
      )}\n`;

      // Filter purchases by location with a more lenient comparison
      for (const doc of purchasesSnapshot.docs) {
        const purchaseData = doc.data();

        if (purchaseData.location) {
          const purchaseLat = purchaseData.location.latitude;
          const purchaseLng = purchaseData.location.longitude;

          // Add to debug info
          debugInfo += `Doc ${doc.id}: ${purchaseLat.toFixed(
            6
          )}, ${purchaseLng.toFixed(6)}\n`;

          // Use a more lenient comparison (0.001 is roughly 100 meters)
          const latDiff = Math.abs(purchaseLat - latitude);
          const lngDiff = Math.abs(purchaseLng - longitude);

          if (latDiff < 0.001 && lngDiff < 0.001) {
            debugInfo += `✓ MATCH\n`;

            // For each purchase, get its products
            const productsRef = collection(
              db,
              "users",
              uid,
              "purchase",
              doc.id,
              "products"
            );
            const productsSnapshot = await getDocs(productsRef);
            const products = productsSnapshot.docs.map((productDoc) =>
              productDoc.data()
            );

            purchasesList.push({
              id: doc.id,
              timestamp: purchaseData.timestamp?.toDate() || new Date(),
              grandTotal: purchaseData.grandTotal || 0,
              receiptUrl: purchaseData.receiptUrl,
              products: products,
            });
          } else {
            debugInfo += `✗ NO MATCH (diff: ${latDiff.toFixed(
              6
            )}, ${lngDiff.toFixed(6)})\n`;
          }
        }
      }

      // Sort purchases by date (newest first)
      purchasesList.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      setPurchases(purchasesList);
      setDebug(debugInfo);
    } catch (error) {
      console.error("Error fetching purchase history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderPurchaseItem = ({ item }: { item: Purchase }) => (
    <TouchableOpacity
      style={styles.purchaseItem}
      onPress={() => {
        // Navigate to purchase detail screen
        router.push({
          pathname: "/(main)/purchaseDetail",
          params: { purchaseId: item.id },
        });
      }}
    >
      <View style={styles.purchaseHeader}>
        <Text style={styles.purchaseDate}>{formatDate(item.timestamp)}</Text>
        <Text style={styles.purchaseTotal}>${item.grandTotal.toFixed(2)}</Text>
      </View>

      <View style={styles.productsContainer}>
        <Text style={styles.productsTitle}>
          {item.products.length} {item.products.length === 1 ? "item" : "items"}
        </Text>

        <View style={styles.productsList}>
          {item.products.slice(0, 3).map((product, index) => (
            <View key={index} style={styles.productItem}>
              {product.imageUrl ? (
                <Image
                  source={{ uri: product.imageUrl }}
                  style={styles.productImage}
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <MaterialCommunityIcons name="food" size={20} color="#888" />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name || "Unknown Product"}
                </Text>
                <Text style={styles.productQuantity}>
                  Qty: {product.quantity || 1}
                </Text>
              </View>
            </View>
          ))}

          {item.products.length > 3 && (
            <Text style={styles.moreProducts}>
              +{item.products.length - 3} more items
            </Text>
          )}
        </View>
      </View>

      <View style={styles.viewDetailsContainer}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Feather
          name="chevron-right"
          size={16}
          color={COLOR_CONST.light_green}
        />
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.title}>Purchase History</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_CONST.light_green} />
          <Text style={styles.loadingText}>Loading purchase history...</Text>
        </View>
      ) : purchases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            // @ts-ignore
            name="receipt-text-outline"
            size={64}
            color="#888"
          />
          <Text style={styles.emptyText}>
            No purchases found at this location
          </Text>

          {/* Debug info - remove in production */}
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => alert(debug)}
          >
            <Text style={styles.debugButtonText}>Debug Info</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={purchases}
          renderItem={renderPurchaseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  listContent: {
    padding: 16,
  },
  purchaseItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  purchaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  purchaseDate: {
    fontSize: 16,
    fontWeight: "500",
  },
  purchaseTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLOR_CONST.light_green,
  },
  productsContainer: {
    marginTop: 8,
  },
  productsTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  productsList: {
    gap: 8,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
  },
  productQuantity: {
    fontSize: 12,
    color: "#888",
  },
  moreProducts: {
    fontSize: 12,
    color: COLOR_CONST.light_green,
    marginTop: 4,
    fontStyle: "italic",
  },
  debugButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  debugButtonText: {
    color: "#666",
    fontSize: 14,
  },
  viewDetailsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  viewDetailsText: {
    fontSize: 14,
    color: COLOR_CONST.light_green,
    fontWeight: "500",
    marginRight: 4,
  },
});
