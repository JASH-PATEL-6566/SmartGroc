import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLOR_CONST } from "@/constants/color";
import { useEffect, useState } from "react";
import { NUTRIENT_MAP } from "@/constants/nutritions";

const { width } = Dimensions.get("window");

export default function ProductDetails() {
  const router = useRouter();
  const { data }: any = useLocalSearchParams();
  const productData = data ? JSON.parse(data).foods[0] : null;
  const [isAlreadyScanned, setIsAlreadyScanned] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    checkIfProductExists();
  }, []);

  const checkIfProductExists = async () => {
    try {
      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      if (savedProducts) {
        const products = JSON.parse(savedProducts);
        const existingProduct = products.find(
          (product: any) =>
            product.nix_item_id === productData.nix_item_id ||
            (product.name === productData.food_name &&
              product.brand === productData.brand_name)
        );

        if (existingProduct) {
          setIsAlreadyScanned(true);
          setProductId(existingProduct.id);
        }
      }
    } catch (error) {
      console.error("Error checking product:", error);
    }
  };

  const handleAccept = () => {
    setQuantityModalVisible(true);
  };

  const handleSaveWithQuantity = async () => {
    try {
      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      const products = savedProducts ? JSON.parse(savedProducts) : [];

      const newProduct = {
        id: Date.now().toString(),
        name: productData.food_name,
        brand: productData.brand_name,
        nix_item_id: productData.nix_item_id,
        calories: `${productData.nf_calories} kcal`,
        imageUrl: productData.photo?.thumb || "",
        data: JSON.stringify({ foods: [productData] }),
        quantity: parseInt(quantity) || 1,
      };

      const updatedProducts = [newProduct, ...products];
      await AsyncStorage.setItem(
        "@scanned_products",
        JSON.stringify(updatedProducts)
      );

      setQuantityModalVisible(false);
      router.replace("/(main)/(tabs)/(scan)/Scan");
    } catch (error) {
      console.error("Failed to save product:", error);
      Alert.alert("Error", "Failed to save product. Please try again.");
    }
  };

  const handleDecline = () => {
    router.back();
  };

  const handleDelete = async () => {
    if (!productId) return;

    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product from your list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const savedProducts = await AsyncStorage.getItem(
                "@scanned_products"
              );
              if (savedProducts) {
                const products = JSON.parse(savedProducts);
                const updatedProducts = products.filter(
                  (p: any) => p.id !== productId
                );
                await AsyncStorage.setItem(
                  "@scanned_products",
                  JSON.stringify(updatedProducts)
                );
                router.back();
              }
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert(
                "Error",
                "Failed to delete product. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (!productData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No product details found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helper function to format nutrient values
  const formatNutrientValue = (value: number | null, unit: string) => {
    if (value === null) return "N/A";
    return `${value} ${unit}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="chevron-down" size={32} color="#666" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          {isAlreadyScanned && (
            <View style={styles.scannedBadge}>
              <Text style={styles.scannedBadgeText}>Already in your list</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: productData.photo?.thumb || "/placeholder.svg" }}
            style={styles.productImage}
          />
        </View>

        {/* Product Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>{productData.food_name}</Text>
          <Text style={styles.brandName}>{productData.brand_name}</Text>

          {/* Serving Information */}
          <View style={styles.servingInfo}>
            <Text style={styles.servingText}>
              Serving Size: {productData.serving_qty} {productData.serving_unit}
              {productData.nf_metric_qty && (
                <Text style={styles.metricText}>
                  {" "}
                  ({productData.nf_metric_qty} {productData.nf_metric_uom})
                </Text>
              )}
            </Text>
          </View>

          {/* Key Nutrients Summary */}
          <View style={styles.keyNutrients}>
            <View style={styles.nutrientBox}>
              <Text style={styles.nutrientValue}>
                {formatNutrientValue(productData.nf_calories, "kcal")}
              </Text>
              <Text style={styles.nutrientLabel}>Calories</Text>
            </View>
            <View style={styles.nutrientBox}>
              <Text style={styles.nutrientValue}>
                {formatNutrientValue(productData.nf_total_fat, "g")}
              </Text>
              <Text style={styles.nutrientLabel}>Total Fat</Text>
            </View>
            <View style={styles.nutrientBox}>
              <Text style={styles.nutrientValue}>
                {formatNutrientValue(productData.nf_total_carbohydrate, "g")}
              </Text>
              <Text style={styles.nutrientLabel}>Total Carbs</Text>
            </View>
            <View style={styles.nutrientBox}>
              <Text style={styles.nutrientValue}>
                {formatNutrientValue(productData.nf_protein, "g")}
              </Text>
              <Text style={styles.nutrientLabel}>Protein</Text>
            </View>
          </View>

          {/* Ingredients */}
          {productData.nf_ingredient_statement && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.ingredientsText}>
                {productData.nf_ingredient_statement}
              </Text>
            </View>
          )}

          {/* All Nutrition Facts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            <View style={styles.nutrientsGrid}>
              {productData.full_nutrients?.map((nutrient: any) => {
                const nutrientInfo = NUTRIENT_MAP.find(
                  (n: any) => n.attr_id === nutrient.attr_id
                );
                if (nutrientInfo) {
                  return (
                    <View key={nutrient.attr_id} style={styles.nutrientRow}>
                      <Text style={styles.nutrientRowName}>
                        {nutrientInfo.name}
                      </Text>
                      <Text style={styles.nutrientRowValue}>
                        {nutrient.value} {nutrientInfo.unit}
                      </Text>
                    </View>
                  );
                }
                return null;
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Quantity Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={quantityModalVisible}
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Quantity</Text>
            <Text style={styles.modalSubtitle}>
              How many servings of this product?
            </Text>

            <TextInput
              style={styles.quantityInput}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity"
              placeholderTextColor="#666"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setQuantityModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSaveWithQuantity}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Buttons - Only show if not already scanned */}
      {!isAlreadyScanned && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={handleDecline}
          >
            <Ionicons name="close" size={24} color="white" />
            <Text style={styles.actionButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleAccept}
          >
            <Ionicons name="checkmark" size={24} color="white" />
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
  },
  scannedBadge: {
    backgroundColor: COLOR_CONST.light_green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scannedBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: width * 0.8,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  productImage: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: "contain",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 20,
    margin: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  servingInfo: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  servingText: {
    fontSize: 16,
    color: "#444",
  },
  metricText: {
    color: "#666",
    fontSize: 14,
  },
  keyNutrients: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },
  nutrientBox: {
    alignItems: "center",
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLOR_CONST.light_green,
  },
  nutrientLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  ingredientsText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
  nutrientsGrid: {
    gap: 8,
  },
  nutrientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  nutrientRowName: {
    fontSize: 14,
    color: "#444",
  },
  nutrientRowValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  acceptButton: {
    backgroundColor: COLOR_CONST.light_green,
  },
  declineButton: {
    backgroundColor: "#ff4d4f",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
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
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  quantityInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#ff4d4f",
  },
  modalButtonConfirm: {
    backgroundColor: COLOR_CONST.light_green,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
