"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { COLOR_CONST } from "@/constants/color";
import { useRouter } from "expo-router";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

// First, modify the Product type to include available_quantity
type Product = {
  id: string;
  name: string;
  brand: string;
  calories: string;
  imageUrl: string;
  quantity: number;
  available_quantity: number; // Add this field to track current available quantity
  expiryDate?: string | null;
  data?: string;
  source: "scanned" | "purchased";
  purchaseId?: string;
  foods: any;
  // For aggregated products
  instances?: {
    id: string;
    purchaseDate?: Date;
    quantity: number;
    available_quantity: number;
    expiryDate?: string | null;
    purchaseId?: string;
  }[];
};

export default function InventoryList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { uid } = useSelector((state: RootState) => state.auth.user);

  // Then modify the loadProducts function to aggregate products with the same name and brand
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Load scanned products from AsyncStorage
      const scannedProducts: Product[] = [];
      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        parsedProducts.forEach((product: any) => {
          // Skip products with available_quantity of 0
          if (product.available_quantity === 0) {
            return;
          }

          scannedProducts.push({
            ...product,
            source: "scanned",
            available_quantity: product.available_quantity || product.quantity, // Use available_quantity if exists, otherwise use quantity
            instances: [
              {
                id: product.id,
                quantity: product.quantity,
                available_quantity:
                  product.available_quantity || product.quantity,
                expiryDate: product.expiryDate || null,
              },
            ],
          });
        });
      }

      // 2. Load purchased products from Firestore
      const purchasedProducts: Product[] = [];
      if (uid) {
        // Get all purchases
        const purchasesRef = collection(db, "users", uid, "purchase");
        const purchasesSnapshot = await getDocs(purchasesRef);

        // For each purchase, get its products
        for (const purchaseDoc of purchasesSnapshot.docs) {
          const purchaseId = purchaseDoc.id;
          const purchaseData = purchaseDoc.data();
          const purchaseDate = purchaseData.timestamp?.toDate() || new Date();

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

            // Skip products with available_quantity of 0
            if (productData.available_quantity === 0) {
              return;
            }

            purchasedProducts.push({
              id: productDoc.id,
              name: productData.name || "Unknown Product",
              brand: productData.brand || "",
              calories: productData.calories || "",
              imageUrl: productData.imageUrl || "",
              quantity: productData.quantity || 1,
              available_quantity:
                productData.available_quantity || productData.quantity || 1,
              expiryDate: productData.expiryDate || null,
              source: "purchased",
              foods: JSON.parse(productData.data).foods,
              purchaseId,
              instances: [
                {
                  id: productDoc.id,
                  purchaseDate,
                  quantity: productData.quantity || 1,
                  available_quantity:
                    productData.available_quantity || productData.quantity || 1,
                  expiryDate: productData.expiryDate || null,
                  purchaseId,
                },
              ],
            });
          });
        }
      }

      // 3. Combine and aggregate products with the same name and brand
      const productMap = new Map<string, Product>();

      // Process all products (scanned and purchased)
      [...scannedProducts, ...purchasedProducts].forEach((product) => {
        // Create a unique key for each product based on name and brand
        const key = `${product.name.toLowerCase()}-${product.brand.toLowerCase()}`;

        if (productMap.has(key)) {
          // Product already exists, update it
          const existingProduct = productMap.get(key)!;

          // Add this instance to the existing product
          existingProduct.instances = [
            ...(existingProduct.instances || []),
            ...(product.instances || [
              {
                id: product.id,
                purchaseDate:
                  product.source === "purchased" ? new Date() : undefined,
                quantity: product.quantity,
                available_quantity: product.available_quantity,
                expiryDate: product.expiryDate,
                purchaseId: product.purchaseId,
              },
            ]),
          ];

          // Update the total quantity and available quantity
          existingProduct.quantity += product.quantity;
          existingProduct.available_quantity += product.available_quantity;

          // Keep the image URL if the existing one is empty
          if (!existingProduct.imageUrl && product.imageUrl) {
            existingProduct.imageUrl = product.imageUrl;
          }

          // Prefer scanned products for data and source
          if (
            product.source === "scanned" &&
            existingProduct.source !== "scanned"
          ) {
            existingProduct.source = "scanned";
            existingProduct.data = product.data;
          }
        } else {
          // New product, add it to the map
          productMap.set(key, {
            ...product,
            instances: product.instances || [
              {
                id: product.id,
                purchaseDate:
                  product.source === "purchased" ? new Date() : undefined,
                quantity: product.quantity,
                available_quantity: product.available_quantity,
                expiryDate: product.expiryDate,
                purchaseId: product.purchaseId,
              },
            ],
          });
        }
      });

      // Convert map to array
      const combinedProducts = Array.from(productMap.values());

      setProducts(combinedProducts);
      setFilteredProducts(combinedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      Alert.alert("Error", "Failed to load your inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // Update the updateQuantity function to handle available_quantity
  const updateQuantity = async (id: string, newQuantity: number) => {
    // If quantity is 0, ask user if they want to remove the product
    if (newQuantity === 0) {
      Alert.alert(
        "Remove Product",
        "Do you want to remove this product from your inventory?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                // Find the product
                const productToUpdate = products.find((p) => p.id === id);

                if (!productToUpdate) return;

                // For scanned products, remove from AsyncStorage
                if (productToUpdate.source === "scanned") {
                  const scannedProducts = await AsyncStorage.getItem(
                    "@scanned_products"
                  );
                  if (scannedProducts) {
                    const parsedProducts = JSON.parse(scannedProducts);

                    // Filter out all instances of this product
                    const updatedScannedProducts = parsedProducts.filter(
                      (product: any) => {
                        return !productToUpdate.instances?.some(
                          (instance) => instance.id === product.id
                        );
                      }
                    );

                    // Update AsyncStorage
                    await AsyncStorage.setItem(
                      "@scanned_products",
                      JSON.stringify(updatedScannedProducts)
                    );
                  }
                } else if (productToUpdate.source === "purchased" && uid) {
                  // For purchased products, update Firestore
                  // We need to update all instances of this product
                  for (const instance of productToUpdate.instances || []) {
                    if (instance.purchaseId) {
                      const productRef = doc(
                        db,
                        "users",
                        uid,
                        "purchase",
                        instance.purchaseId,
                        "products",
                        instance.id
                      );

                      await updateDoc(productRef, {
                        available_quantity: 0,
                      });
                    }
                  }
                }

                // Remove product from state
                const updatedProducts = products.filter(
                  (product) => product.id !== id
                );
                setProducts(updatedProducts);
                setFilteredProducts(
                  updatedProducts.filter(
                    (product) =>
                      searchQuery.trim() === "" ||
                      product.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      product.brand
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                );
              } catch (error) {
                console.error("Error removing product:", error);
                Alert.alert("Error", "Failed to remove product");
              }
            },
          },
        ]
      );
      return;
    }

    if (newQuantity < 0) return;

    try {
      // Find the product
      const productToUpdate = products.find((p) => p.id === id);

      if (!productToUpdate) return;

      const oldAvailableQuantity = productToUpdate.available_quantity;
      const quantityDifference = newQuantity - oldAvailableQuantity;

      // Only scanned products can have their quantity updated in AsyncStorage
      if (productToUpdate.source === "scanned") {
        const scannedProducts = await AsyncStorage.getItem("@scanned_products");
        if (scannedProducts) {
          const parsedProducts = JSON.parse(scannedProducts);

          // Find all instances of this product in AsyncStorage
          const updatedScannedProducts = parsedProducts.map((product: any) => {
            // Check if this is one of our product instances
            const isTargetProduct = productToUpdate.instances?.some(
              (instance) => instance.id === product.id
            );

            if (isTargetProduct) {
              // Update the available_quantity
              return {
                ...product,
                available_quantity: newQuantity,
              };
            }
            return product;
          });

          // Update AsyncStorage
          await AsyncStorage.setItem(
            "@scanned_products",
            JSON.stringify(updatedScannedProducts)
          );
        }
      } else if (productToUpdate.source === "purchased") {
        // For purchased products, update Firestore
        // We need to update all instances of this product
        for (const instance of productToUpdate.instances || []) {
          if (instance.purchaseId) {
            const productRef = doc(
              db,
              "users",
              uid,
              "purchase",
              instance.purchaseId,
              "products",
              instance.id
            );

            await updateDoc(productRef, {
              available_quantity: newQuantity,
            });
          }
        }
      }

      // Update state for all products
      const updatedProducts = products.map((product) =>
        product.id === id
          ? { ...product, available_quantity: newQuantity }
          : product
      );
      setProducts(updatedProducts);
      setFilteredProducts(
        updatedProducts.filter(
          (product) =>
            searchQuery.trim() === "" ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.brand.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      Alert.alert("Error", "Failed to update quantity");
    }
  };

  // Delete product
  const deleteProduct = async (id: string) => {
    // Find the product to delete for showing its name in the confirmation
    const productToDelete = products.find((p) => p.id === id);
    if (!productToDelete) return;

    Alert.alert(
      "Delete Item",
      `Are you sure you want to remove ${productToDelete.name} from your inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Only scanned products can be deleted from AsyncStorage
              if (productToDelete.source === "scanned") {
                const scannedProducts = products.filter(
                  (p) => p.source === "scanned"
                );
                const updatedScannedProducts = scannedProducts.filter(
                  (product) => product.id !== id
                );

                // Update AsyncStorage
                await AsyncStorage.setItem(
                  "@scanned_products",
                  JSON.stringify(
                    updatedScannedProducts.map((p) => {
                      // Remove the source field before saving to AsyncStorage
                      const { source, ...productWithoutSource } = p;
                      return productWithoutSource;
                    })
                  )
                );
              } else {
                // For purchased products, we just remove them from the local state
                // They remain in Firestore for purchase history
                Alert.alert(
                  "Note",
                  "This item will be removed from your inventory list but will still appear in your purchase history."
                );
              }

              // Update state for all products
              const updatedProducts = products.filter(
                (product) => product.id !== id
              );
              setProducts(updatedProducts);
              setFilteredProducts(
                updatedProducts.filter(
                  (product) =>
                    searchQuery.trim() === "" ||
                    product.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    product.brand
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                )
              );
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Failed to delete item");
            }
          },
        },
      ]
    );
  };

  // View product details
  const viewProductDetails = (product: Product) => {
    if (product.data) {
      // Navigate to product details with data
      router.push({
        pathname: "/(main)/productDetails",
        params: { data: product.data, source: "list" },
      });
    } else if (product.source === "purchased") {
      // For purchased products without data, create a basic data structure
      const basicProductData = {
        foods: product.foods,
      };

      router.push({
        pathname: "/(main)/productDetails",
        params: { data: JSON.stringify(basicProductData), source: "list" },
      });
    } else {
      Alert.alert(
        "Info",
        "Detailed information is not available for this product."
      );
    }
  };

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
  const getExpiryStatusColor = (dateString: string | null | undefined) => {
    const days = getDaysUntilExpiry(dateString);
    if (days === null) return "#888"; // No expiry date
    if (days < 0) return "#ff4d4f"; // Expired
    if (days <= 3) return "#ff9800"; // Expiring soon
    return COLOR_CONST.light_green; // Good
  };

  // Get expiry status text
  const getExpiryStatusText = (dateString: string | null | undefined) => {
    const days = getDaysUntilExpiry(dateString);
    if (days === null) return "No expiry date";
    if (days < 0) return "Expired";
    if (days === 0) return "Expires today";
    if (days === 1) return "Expires tomorrow";
    return `Expires in ${days} days`;
  };

  // Dismiss keyboard
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Update the renderItem function to use available_quantity instead of quantity
  const renderItem = ({ item }: { item: Product }) => {
    // Function to handle quantity decrease with confirmation
    const handleDecreaseQuantity = () => {
      if (item.available_quantity <= 0) return;

      Alert.alert(
        "Decrease Quantity",
        `Are you sure you want to decrease the quantity of ${item.name} from ${
          item.available_quantity
        } to ${item.available_quantity - 1}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Decrease",
            onPress: () => updateQuantity(item.id, item.available_quantity - 1),
          },
        ]
      );
    };

    // Function to handle quantity increase with confirmation
    const handleIncreaseQuantity = () => {
      // Don't allow increasing beyond the original total quantity
      if (item.available_quantity >= item.quantity) {
        Alert.alert(
          "Maximum Quantity Reached",
          `You cannot increase the quantity beyond the original purchase amount of ${item.quantity}.`
        );
        return;
      }

      Alert.alert(
        "Increase Quantity",
        `Are you sure you want to increase the quantity of ${item.name} from ${
          item.available_quantity
        } to ${item.available_quantity + 1}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Increase",
            onPress: () => updateQuantity(item.id, item.available_quantity + 1),
          },
        ]
      );
    };

    return (
      <View style={styles.productItem}>
        <TouchableOpacity
          style={styles.productContent}
          onPress={() => viewProductDetails(item)}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.productImage}
            />
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
            {item.instances && item.instances.length > 1 && (
              <Text style={styles.instancesText}>
                From {item.instances.length} purchases
              </Text>
            )}
            {item.expiryDate && (
              <View style={styles.expiryContainer}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={14}
                  color={getExpiryStatusColor(item.expiryDate)}
                />
                <Text
                  style={[
                    styles.expiryText,
                    { color: getExpiryStatusColor(item.expiryDate) },
                  ]}
                >
                  {getExpiryStatusText(item.expiryDate)}
                </Text>
              </View>
            )}
            {item.source === "purchased" && (
              <View style={styles.sourceContainer}>
                <MaterialCommunityIcons
                  name="shopping"
                  size={12}
                  color="#888"
                />
                <Text style={styles.sourceText}>From purchase history</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={handleDecreaseQuantity}
            disabled={item.available_quantity <= 0}
          >
            <Feather
              name="minus"
              size={18}
              color={
                item.available_quantity <= 0 ? "#ccc" : COLOR_CONST.light_green
              }
            />
          </TouchableOpacity>
          <TextInput
            style={styles.quantityInput}
            value={item.available_quantity.toString()}
            onChangeText={(text) => {
              const newQuantity = Number.parseInt(text) || 0;
              // Don't allow setting more than the original quantity
              if (newQuantity <= item.quantity) {
                updateQuantity(item.id, newQuantity);
              } else {
                Alert.alert(
                  "Maximum Quantity Exceeded",
                  `You cannot set the quantity higher than the original purchase amount of ${item.quantity}.`
                );
              }
            }}
            keyboardType="numeric"
            selectTextOnFocus
          />
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={handleIncreaseQuantity}
            disabled={item.available_quantity >= item.quantity}
          >
            <Feather
              name="plus"
              size={18}
              color={
                item.available_quantity >= item.quantity
                  ? "#ccc"
                  : COLOR_CONST.light_green
              }
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteProduct(item.id)}
        >
          <Feather name="trash-2" size={18} color="#ff4d4f" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>
            {products.length} {products.length === 1 ? "item" : "items"} in your
            inventory
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={18}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Feather name="x" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLOR_CONST.light_green} />
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="food-off" size={64} color="#888" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No matching products found"
                : "Your inventory is empty"}
            </Text>
            {searchQuery ? (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearSearchText}>Clear search</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => router.push("/(main)/(tabs)/(scan)/Scan")}
              >
                <Text style={styles.scanButtonText}>Scan products</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
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
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// Add this style for the instances text
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
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
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  scanButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  clearSearchButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLOR_CONST.light_green,
  },
  clearSearchText: {
    color: COLOR_CONST.light_green,
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  productContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 6,
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
    fontSize: 12,
    marginLeft: 4,
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  sourceText: {
    fontSize: 11,
    color: "#888",
    marginLeft: 4,
    fontStyle: "italic",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityInput: {
    width: 40,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
  },
  // Add this style for the instances text
  instancesText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 2,
  },
});
