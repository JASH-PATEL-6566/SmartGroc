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
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { COLOR_CONST } from "@/constants/color";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

type Product = {
  id: string;
  name: string;
  brand: string;
  calories: string;
  imageUrl: string;
  quantity: number;
  expiryDate?: string | null;
  foods?: any;
};

type Purchase = {
  id: string;
  timestamp: Date;
  grandTotal: number;
  storeAddress: string;
  receiptUrl?: string;
  products: Product[];
};

export default function PurchaseDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { uid } = useSelector((state: RootState) => state.auth.user);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  const purchaseId = params.purchaseId as string;

  useEffect(() => {
    fetchPurchaseDetail();
  }, []);

  const fetchPurchaseDetail = async () => {
    if (!uid || !purchaseId) return;

    try {
      setLoading(true);

      // Get purchase document
      const purchaseRef = doc(db, "users", uid, "purchase", purchaseId);
      const purchaseDoc = await getDoc(purchaseRef);

      if (!purchaseDoc.exists()) {
        console.error("Purchase not found");
        return;
      }

      const purchaseData = purchaseDoc.data();

      // Get products subcollection
      const productsRef = collection(purchaseRef, "products");
      const productsSnapshot = await getDocs(productsRef);

      const products = productsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unknown Product",
          brand: data.brand || "",
          calories: data.calories || "",
          imageUrl: data.imageUrl || "",
          quantity: data.quantity || 1,
          expiryDate: data.expiryDate || null,
          foods: JSON.parse(data.data).foods,
        };
      });

      setPurchase({
        id: purchaseDoc.id,
        timestamp: purchaseData.timestamp?.toDate() || new Date(),
        grandTotal: purchaseData.grandTotal || 0,
        storeAddress: purchaseData.storeAddress || "Unknown Location",
        receiptUrl: purchaseData.receiptUrl || undefined,
        products: products,
      });
    } catch (error) {
      console.error("Error fetching purchase detail:", error);
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

  const formatExpiryDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const viewReceipt = () => {
    if (purchase?.receiptUrl) {
      router.push({
        pathname: "/(main)/receiptViewer",
        params: {
          receiptUrl: purchase.receiptUrl,
          purchaseDate: purchase.timestamp.toISOString(),
          storeAddress: purchase.storeAddress,
        },
      });
    } else {
      Alert.alert("No Receipt", "No receipt was uploaded for this purchase.");
    }
  };

  function routeToProductDetails(item: Product) {
    // console.log(JSON.stringify(item));

    router.push({
      pathname: "/(main)/productDetails",
      params: { data: JSON.stringify(item), source: "purchase" },
    });
  }

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => routeToProductDetails(item)}
      style={styles.productItem}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={styles.productImagePlaceholder}>
          <MaterialCommunityIcons name="food" size={24} color="#888" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        {item.brand && <Text style={styles.productBrand}>{item.brand}</Text>}
        <View style={styles.productDetails}>
          <Text style={styles.productQuantity}>Qty: {item.quantity}</Text>
          {item.calories && (
            <Text style={styles.productCalories}>{item.calories}</Text>
          )}
        </View>
        <View style={styles.expiryContainer}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={16}
            color={item.expiryDate ? COLOR_CONST.light_green : "#888"}
          />
          <Text
            style={[
              styles.expiryText,
              item.expiryDate ? styles.expiryTextSet : {},
            ]}
          >
            {item.expiryDate
              ? `Expires: ${formatExpiryDate(item.expiryDate)}`
              : "No expiry date set"}
          </Text>
        </View>
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
          <Text style={styles.title}>Purchase Details</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_CONST.light_green} />
          <Text style={styles.loadingText}>Loading purchase details...</Text>
        </View>
      ) : !purchase ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            // @ts-ignore
            name="receipt-text-off"
            size={64}
            color="#888"
          />
          <Text style={styles.emptyText}>Purchase not found</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.purchaseInfoCard}>
            <Text style={styles.purchaseDate}>
              {formatDate(purchase.timestamp)}
            </Text>
            <Text style={styles.purchaseLocation}>{purchase.storeAddress}</Text>
            <View style={styles.purchaseTotalContainer}>
              <Text style={styles.purchaseTotalLabel}>Total:</Text>
              <Text style={styles.purchaseTotal}>
                ${purchase.grandTotal.toFixed(2)}
              </Text>
            </View>

            {purchase.receiptUrl && (
              <TouchableOpacity
                style={styles.receiptButton}
                onPress={viewReceipt}
              >
                <MaterialCommunityIcons
                  name="receipt"
                  size={20}
                  color="white"
                />
                <Text style={styles.receiptButtonText}>View Receipt</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>
              Products ({purchase.products.length})
            </Text>
            <FlatList
              data={purchase.products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.productsList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  purchaseInfoCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
  },
  purchaseDate: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  purchaseLocation: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  purchaseTotalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginBottom: 12,
  },
  purchaseTotalLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  purchaseTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLOR_CONST.light_green,
  },
  receiptButton: {
    backgroundColor: COLOR_CONST.light_green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  receiptButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  productsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  productsList: {
    paddingBottom: 20,
  },
  productItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 70,
    height: 70,
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
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  productDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 14,
    color: "#888",
  },
  productCalories: {
    fontSize: 14,
    color: "#888",
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  expiryText: {
    fontSize: 14,
    color: "#888",
    marginLeft: 4,
  },
  expiryTextSet: {
    color: COLOR_CONST.light_green,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
});
