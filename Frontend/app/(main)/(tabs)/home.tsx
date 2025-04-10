"use client";

import {
  StatusBar,
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import type { RootState } from "@/redux/store";
import TopHeader from "@/components/home/topHeader";
import WhiteBackView from "@/components/home/WhiteBackView";
import SafeAreaViewBackground from "@/components/SafeAreaViewBackground";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLOR_CONST } from "@/constants/color";
import { useRouter } from "expo-router";

type Product = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  expiryDate?: string | null;
  daysUntilExpiry?: number | null;
  foods: any;
};

type ShoppingList = {
  id: string;
  name: string;
  createdAt: number;
  itemCount: number;
  description: string;
};

type Recipe = {
  name: string;
  brand: string;
  description: string;
  imageUrl: string;
};

const Home = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { uid } = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

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

  // Load expiring products
  const loadExpiringProducts = useCallback(async () => {
    try {
      setLoading(true);
      const expiringItems: Product[] = [];

      // 1. Load scanned products from AsyncStorage
      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        parsedProducts.forEach((product: any) => {
          // Skip products with available_quantity of 0
          if (product.available_quantity === 0) {
            return;
          }

          if (product.expiryDate) {
            const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);
            if (
              daysUntilExpiry !== null &&
              daysUntilExpiry <= 10 &&
              daysUntilExpiry >= -1
            ) {
              expiringItems.push({
                ...product,
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

            // Skip products with available_quantity of 0
            if (productData.available_quantity === 0) {
              return;
            }

            if (productData.expiryDate) {
              const daysUntilExpiry = getDaysUntilExpiry(
                productData.expiryDate
              );
              if (
                daysUntilExpiry !== null &&
                daysUntilExpiry <= 10 &&
                daysUntilExpiry >= -1
              ) {
                expiringItems.push({
                  id: productDoc.id,
                  name: productData.name || "Unknown Product",
                  brand: productData.brand || "",
                  imageUrl: productData.imageUrl || "",
                  expiryDate: productData.expiryDate,
                  daysUntilExpiry,
                  foods: JSON.parse(productData.data).foods,
                });
              }
            }
          });
        }
      }

      // Sort by days until expiry (ascending)
      expiringItems.sort((a, b) => {
        if (a.daysUntilExpiry === null) return 1;
        if (b.daysUntilExpiry === null) return -1;
        // @ts-ignore
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

      // Take only the first 3 items
      setExpiringProducts(expiringItems.slice(0, 3));
    } catch (error) {
      console.error("Error loading expiring products:", error);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Add this function to load shopping lists
  const loadShoppingLists = useCallback(async () => {
    try {
      const lists: ShoppingList[] = [];

      // First try to load from Firestore if user is logged in
      if (uid) {
        const listsRef = collection(db, "users", uid, "shopping_lists");
        const listsSnapshot = await getDocs(listsRef);

        if (!listsSnapshot.empty) {
          listsSnapshot.forEach((doc) => {
            const listData = doc.data();
            const nonPurchasedItems = (listData.items || []).filter(
              (item: any) => !item.purchased
            );
            if (nonPurchasedItems.length > 0) {
              lists.push({
                id: doc.id,
                name: listData.name || "Untitled List",
                createdAt: listData.createdAt || Date.now(),
                itemCount: nonPurchasedItems.length,
                description: `${nonPurchasedItems.length} ${
                  nonPurchasedItems.length === 1 ? "item" : "items"
                } remaining`,
              });
            }
          });
          // Sort by most recent lists first
          lists.sort((a, b) => b.createdAt - a.createdAt);

          // Take only the first 3 lists
          setShoppingLists(lists.slice(0, 3));
          return;
        }
      }

      // Fall back to AsyncStorage if Firestore has no data or user is not logged in
      const savedLists = await AsyncStorage.getItem("@shopping_lists");
      if (savedLists) {
        const parsedLists = JSON.parse(savedLists);

        parsedLists.forEach((list: any) => {
          const nonPurchasedItems = (list.items || []).filter(
            (item: any) => !item.purchased
          );

          lists.push({
            id: list.id,
            name: list.name || "Untitled List",
            createdAt: list.createdAt || Date.now(),
            itemCount: nonPurchasedItems.length,
            description: `${nonPurchasedItems.length} ${
              nonPurchasedItems.length === 1 ? "item" : "items"
            } remaining`,
          });
        });

        // Sort by most recent lists first
        lists.sort((a, b) => b.createdAt - a.createdAt);

        // Take only the first 3 lists
        setShoppingLists(lists.slice(0, 3));
        return;
      }

      // If no lists found, set default list
      if (lists.length === 0) {
        setShoppingLists([
          {
            id: "default",
            name: "Grocery List",
            createdAt: Date.now(),
            itemCount: 3,
            description: "3 items remaining",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading shopping lists:", error);
      // Set default list if there's an error
      setShoppingLists([
        {
          id: "default",
          name: "Grocery List",
          createdAt: Date.now(),
          itemCount: 3,
          description: "3 items remaining",
        },
      ]);
    }
  }, [uid]);

  // Load recipes from storage or fetch if not available
  const loadRecipes = useCallback(async () => {
    // We're not loading recipes on the home page anymore
    // This is just a placeholder function to maintain compatibility
  }, [uid]);

  useEffect(() => {
    loadExpiringProducts();
    loadShoppingLists();
    // Removed loadRecipes() call
  }, [loadExpiringProducts, loadShoppingLists]);

  return (
    <SafeAreaViewBackground>
      <StatusBar hidden={false} />
      <ScrollView style={styles.container}>
        <TopHeader user={user} />
        <WhiteBackView
          heading="Expiring Soon"
          next="/(main)/expiringProducts"
          items={expiringProducts}
        />
        <WhiteBackView
          heading="Shopping List"
          next="/(main)/shopping-lists"
          items={shoppingLists}
          marginBottom={20}
        />
        <View style={styles.aiRecipeContainer}>
          <View style={styles.aiRecipeHeader}>
            <Text style={styles.aiRecipeTitle}>AI Recipe Generator</Text>
          </View>
          <View style={styles.aiRecipeContent}>
            <MaterialCommunityIcons
              name="robot-excited"
              size={60}
              color={COLOR_CONST.light_green}
            />
            <View style={styles.aiRecipeTextContainer}>
              <Text style={styles.aiRecipeDescription}>
                Generate personalized recipes based on ingredients in your
                inventory
              </Text>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => router.push("/(main)/recipes")}
              >
                <MaterialCommunityIcons
                  name="chef-hat"
                  size={20}
                  color="white"
                />
                <Text style={styles.generateButtonText}>Generate Recipes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaViewBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  aiRecipeContainer: {
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    padding: 16,
    marginBottom: 20,
  },
  aiRecipeHeader: {
    marginBottom: 12,
  },
  aiRecipeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  aiRecipeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  aiRecipeTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  aiRecipeDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: COLOR_CONST.light_green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  generateButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default Home;
