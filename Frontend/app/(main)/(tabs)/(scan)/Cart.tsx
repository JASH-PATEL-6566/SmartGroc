"use client";

import {
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { COLOR_CONST } from "@/constants/color";
import { Feather } from "@expo/vector-icons";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Define the product type
export type ScannedProduct = {
  id: string;
  name: string;
  brand: string;
  calories: string;
  imageUrl: string;
  data: string;
  quantity: number;
  available_quantity: number; // Add this field
  expiryDate?: string | null;
};

type ScannedProductsListProps = {
  onScanPress: () => void;
};

export default function Cart({ onScanPress }: ScannedProductsListProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ScannedProduct[]>([]);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Load products when component mounts
  useEffect(() => {
    loadProducts();
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

  // Calculate total calories
  const totalCalories = useMemo(() => {
    return products.reduce((total, product) => {
      // Extract numeric value from calories string (e.g., "120 kcal" -> 120)
      const caloriesMatch = product.calories.match(/(\d+)/);
      if (caloriesMatch && caloriesMatch[1]) {
        const caloriesValue = Number.parseInt(caloriesMatch[1], 10);
        return total + caloriesValue * product.quantity;
      }
      return total;
    }, 0);
  }, [products]);

  const handleProductPress = useCallback(
    (productData: string) => {
      router.push({
        pathname: "/(main)/productDetails",
        params: { data: productData },
      });
    },
    [router]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      try {
        const updatedProducts = products.filter((product) => product.id !== id);
        setProducts(updatedProducts);
        await AsyncStorage.setItem(
          "@scanned_products",
          JSON.stringify(updatedProducts)
        );
      } catch (error) {
        console.error("Error deleting product:", error);
        Alert.alert("Error", "Failed to delete product. Please try again.");
      }
    },
    [products]
  );

  // Add reset cart function
  const resetCart = async () => {
    Alert.alert(
      "Reset Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("@scanned_products");
              setProducts([]);
            } catch (error) {
              console.error("Error resetting cart:", error);
              Alert.alert("Error", "Failed to reset cart. Please try again.");
            }
          },
        },
      ]
    );
  };

  // Add confirm purchase function
  const confirmPurchase = () => {
    if (products.length === 0) {
      Alert.alert("Error", "Your cart is empty!");
      return;
    }
    router.push("/(main)/(tabs)/(scan)/ConfirmPurchase");
  };

  const renderRightActions = useCallback(
    (id: string) => {
      return (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            // Close the swipeable
            swipeableRefs.current.get(id)?.close();
            // Show confirmation dialog
            Alert.alert(
              "Delete Product",
              "Are you sure you want to delete this product?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deleteProduct(id),
                },
              ]
            );
          }}
        >
          <Feather name="trash-2" size={24} color="white" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      );
    },
    [deleteProduct]
  );

  const renderItem = useCallback(
    ({ item }: { item: ScannedProduct }) => (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current.set(item.id, ref);
          } else {
            swipeableRefs.current.delete(item.id);
          }
        }}
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
      >
        <Pressable
          style={styles.productItem}
          onPress={() => handleProductPress(item.data)}
        >
          <Image
            source={{
              uri: item.imageUrl || "https://via.placeholder.com/60",
            }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productBrand}>{item.brand}</Text>
            <View style={styles.productDetails}>
              <Text style={styles.productCalories}>{item.calories}</Text>
              <Text style={styles.productQuantity}>Qty: {item.quantity}</Text>
            </View>
            {item.expiryDate && (
              <View style={styles.expiryContainer}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={14}
                  color={COLOR_CONST.light_green}
                />
                <Text style={styles.expiryText}>
                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
          <Feather name="chevron-right" size={24} color="#888" />
        </Pressable>
      </Swipeable>
    ),
    [renderRightActions, handleProductPress]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {products.length !== 0 && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Cart</Text>
              <TouchableOpacity
                style={styles.scanButtonHeader}
                onPress={onScanPress}
              >
                <Feather name="camera" size={20} color="white" />
                <Text style={styles.scanButtonText}>Scan</Text>
              </TouchableOpacity>
            </View>

            {/* Total Calories Counter */}
            <View style={styles.caloriesContainer}>
              <View style={styles.caloriesContent}>
                <Text style={styles.caloriesLabel}>Total Calories:</Text>
                <Text style={styles.caloriesValue}>{totalCalories} kcal</Text>
              </View>
            </View>
          </>
        )}
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products scanned yet</Text>
            <TouchableOpacity
              style={styles.scanButtonInList}
              onPress={onScanPress}
            >
              <Text style={styles.scanButtonText}>Scan Your First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
            />

            {/* Footer with purchase buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.footerButton, styles.resetButton]}
                onPress={resetCart}
              >
                <Feather name="trash-2" size={20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerButton, styles.confirmButton]}
                onPress={confirmPurchase}
              >
                <Feather name="check-circle" size={20} color="white" />
                <Text style={styles.footerButtonText}>Confirm Purchase</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  scanButtonHeader: {
    backgroundColor: COLOR_CONST.light_green,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  scanButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
  caloriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f9f9f9",
  },
  caloriesContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  caloriesLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  caloriesValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLOR_CONST.light_green,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  scanButtonInList: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  listContent: {
    paddingBottom: 80, // Space for footer
  },
  productItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
    backgroundColor: "white",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productBrand: {
    fontSize: 14,
    color: "#666",
  },
  productCalories: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  footerButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  resetButton: {
    backgroundColor: "#ff4d4f",
    marginRight: 8,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: COLOR_CONST.light_green,
    flex: 6,
  },
  deleteButton: {
    backgroundColor: "#ff4d4f",
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    height: "100%",
    flexDirection: "column",
  },
  deleteText: {
    color: "white",
    fontSize: 14,
    marginTop: 4,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: COLOR_CONST.light_green,
    fontWeight: "500",
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  expiryText: {
    fontSize: 12,
    color: COLOR_CONST.light_green,
    marginLeft: 4,
  },
});
