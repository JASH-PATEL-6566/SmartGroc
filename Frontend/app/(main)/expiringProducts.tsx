"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { COLOR_CONST } from "@/constants/color";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

type Product = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  expiryDate?: string | null;
  daysUntilExpiry: number | null;
  source: "scanned" | "purchased";
  data?: string;
  purchaseId?: string;
  foods?: any;
};

export default function ExpiringProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { uid } = useSelector((state: RootState) => state.auth.user);

  // Load all products and filter by expiry date
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const expiringProducts: Product[] = [];

      // 1. Load scanned products from AsyncStorage
      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        parsedProducts.forEach((product: any) => {
          if (product.expiryDate) {
            const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);
            if (
              daysUntilExpiry !== null &&
              daysUntilExpiry <= 10 &&
              daysUntilExpiry >= -1
            ) {
              expiringProducts.push({
                ...product,
                source: "scanned",
                daysUntilExpiry,
              });
            }
          }
        });
      }

      // 2. Load purchased products from Firestore
      if (uid) {
        // Get all purchases
        const purchasesRef = collection(db, "users", uid, "purchase");
        const purchasesSnapshot = await getDocs(purchasesRef);

        // For each purchase, get its products
        for (const purchaseDoc of purchasesSnapshot.docs) {
          const purchaseId = purchaseDoc.id;
          const productsRef = collection(
            db,
            "users",
            uid,
            "purchase",
            purchaseId,
            "products"
          );
          const productsSnapshot = await getDocs(productsRef);

          productsSnapshot.docs.forEach((productDoc) => {
            const productData = productDoc.data();
            if (productData.expiryDate) {
              const daysUntilExpiry = getDaysUntilExpiry(
                productData.expiryDate
              );
              if (
                daysUntilExpiry !== null &&
                daysUntilExpiry <= 10 &&
                daysUntilExpiry >= -1
              ) {
                expiringProducts.push({
                  id: productDoc.id,
                  name: productData.name || "Unknown Product",
                  brand: productData.brand || "",
                  imageUrl: productData.imageUrl || "",
                  expiryDate: productData.expiryDate,
                  daysUntilExpiry,
                  source: "purchased",
                  purchaseId,
                  foods: JSON.parse(productData.data).foods,
                });
              }
            }
          });
        }
      }

      // Sort by days until expiry (ascending)
      expiringProducts.sort((a, b) => {
        if (a.daysUntilExpiry === null) return 1;
        if (b.daysUntilExpiry === null) return -1;
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

      setProducts(expiringProducts);
    } catch (error) {
      console.error("Error loading expiring products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Calculate days until expiry
  const getDaysUntilExpiry = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const expiryDate = new Date(dateString);
      const today = new Date();

      // Reset time part for accurate day calculation
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      return null;
    }
  };

  // Get expiry status color
  const getExpiryStatusColor = (days: number | null) => {
    if (days === null) return "#888"; // No expiry date
    if (days < 0) return "#ff4d4f"; // Expired
    if (days === 0) return "#ff4d4f"; // Expires today
    if (days <= 3) return "#ff9800"; // Expiring soon (within 3 days)
    return COLOR_CONST.light_green; // Good (more than 3 days)
  };

  // Get expiry status text
  const getExpiryStatusText = (days: number | null) => {
    if (days === null) return "No expiry date";
    if (days < 0) return "Expired";
    if (days === 0) return "Expires today";
    if (days === 1) return "Expires tomorrow";
    return `Expires in ${days} days`;
  };

  // Group products by expiry status
  const groupedProducts = products.reduce(
    (groups: Record<string, Product[]>, product) => {
      let groupKey: string;

      if (product.daysUntilExpiry === null) {
        groupKey = "No Expiry Date";
      } else if (product.daysUntilExpiry < 0) {
        groupKey = "Expired";
      } else if (product.daysUntilExpiry === 0) {
        groupKey = "Expiring Today";
      } else if (product.daysUntilExpiry === 1) {
        groupKey = "Expiring Tomorrow";
      } else {
        groupKey = "Expiring Soon";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(product);
      return groups;
    },
    {}
  );

  // Order of groups to display
  const groupOrder = [
    "Expired",
    "Expiring Today",
    "Expiring Tomorrow",
    "Expiring Soon",
    "No Expiry Date",
  ];

  // View product details
  const viewProductDetails = (product: Product) => {
    if (product.data) {
      // Navigate to product details with data
      router.push({
        pathname: "/(main)/productDetails",
        params: { data: product.data, source: "expiring" },
      });
    } else if (product.source === "purchased") {
      // For purchased products without data, create a basic data structure
      const basicProductData = {
        foods: product.foods,
      };

      router.push({
        pathname: "/(main)/productDetails",
        params: { data: JSON.stringify(basicProductData), source: "expiring" },
      });
    } else {
      Alert.alert(
        "Info",
        "Detailed information is not available for this product."
      );
    }
  };

  // Render each product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => viewProductDetails(item)}
    >
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
        <View style={styles.expiryContainer}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={16}
            color={getExpiryStatusColor(item.daysUntilExpiry)}
          />
          <Text
            style={[
              styles.expiryText,
              { color: getExpiryStatusColor(item.daysUntilExpiry) },
            ]}
          >
            {getExpiryStatusText(item.daysUntilExpiry)}
          </Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#888" />
    </TouchableOpacity>
  );

  // Render section header
  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
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
        <Text style={styles.title}>Expiring Products</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_CONST.light_green} />
          <Text style={styles.loadingText}>Loading expiring products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="food-off" size={64} color="#888" />
          <Text style={styles.emptyText}>No expiring products found</Text>
          <Text style={styles.emptySubtext}>
            Products expiring in the next 10 days will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupOrder.flatMap((group) => {
            if (
              !groupedProducts[group] ||
              groupedProducts[group].length === 0
            ) {
              return [];
            }

            return [
              { type: "header", title: group, id: `header-${group}` },
              ...groupedProducts[group].map((product) => ({
                type: "item",
                ...product,
              })),
            ];
          })}
          renderItem={({ item }) => {
            if (item.type === "header") {
              // @ts-ignore
              return renderSectionHeader(item.title);
            }
            // @ts-ignore
            return renderProductItem({ item });
          }}
          keyExtractor={(item, index) =>
            item.type === "header" ? item.id : item.id || `product-${index}`
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadProducts();
              }}
              colors={[COLOR_CONST.light_green]}
            />
          }
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
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
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
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
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
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
  },
  productBrand: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  expiryText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: "500",
  },
});
