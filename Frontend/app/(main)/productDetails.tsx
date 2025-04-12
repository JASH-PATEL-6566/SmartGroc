"use client";

import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLOR_CONST } from "@/constants/color";
import { useEffect, useState } from "react";
import { NUTRIENT_MAP } from "@/constants/nutritions";
import DateTimePicker from "@react-native-community/datetimepicker";
// Add this import at the top of the file
import { checkProductForAllergens } from "@/constants/allergens";
import { DatePicker } from "@/components/DatePicker";

const { width } = Dimensions.get("window");

export default function ProductDetails() {
  // Update the beginning of the component to properly parse the data
  const router = useRouter();
  const { data, source }: any = useLocalSearchParams();
  const [productData, setProductData] = useState<any>(null);
  const [isAlreadyScanned, setIsAlreadyScanned] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Add this to track if we're coming from scanner or elsewhere
  const isFromScanner = source === "scanner" || !source;
  // Add a state to track if the picker is for month only (iOS)
  const [datePickerMode, setDatePickerMode] = useState<"date" | "month">(
    "month"
  );

  // Add this function inside the ProductDetails component, before the return statement
  const checkForAllergens = async (ingredients: string | undefined) => {
    if (!ingredients) return;

    try {
      // Get user allergies from AsyncStorage
      const userAllergiesJson = await AsyncStorage.getItem("@user_allergies");
      if (!userAllergiesJson) return;

      const userAllergies = JSON.parse(userAllergiesJson);
      if (!userAllergies || userAllergies.length === 0) return;

      // Check if product contains any allergens
      const foundAllergens = checkProductForAllergens(
        ingredients,
        userAllergies
      );

      if (foundAllergens.length > 0) {
        // Show alert to user
        Alert.alert(
          "Allergen Warning!",
          `This product contains ${foundAllergens.join(
            ", "
          )}, which you've listed as an allergen. Do you still want to add this product?`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => handleDecline(),
            },
            {
              text: "Add Anyway",
              style: "destructive",
              onPress: () => handleAccept(),
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error("Error checking for allergens:", error);
    }
  };

  // Modify the useEffect hook to check for allergens when product data is loaded
  useEffect(() => {
    // Parse the product data from the URL parameter
    if (data) {
      try {
        // First try to parse the data as JSON
        const parsedData = JSON.parse(data);

        // If the data contains a foods array, use the first item
        if (parsedData.foods && parsedData.foods[0]) {
          setProductData(parsedData.foods[0]);

          // Check for allergens in ingredients
          if (parsedData.foods[0].nf_ingredient_statement) {
            checkForAllergens(parsedData.foods[0].nf_ingredient_statement);
          }
        } else {
          // If it's not in the expected format, set it directly
          setProductData(parsedData);

          // Check for allergens if ingredients are available
          if (parsedData.nf_ingredient_statement) {
            checkForAllergens(parsedData.nf_ingredient_statement);
          }
        }
      } catch (error) {
        console.error("Error parsing product data:", error);
        setProductData(null);
      }
    }

    checkIfProductExists();
  }, [data]);

  // Update the checkIfProductExists function to handle the parsed data
  const checkIfProductExists = async () => {
    try {
      if (!productData) return;

      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      if (savedProducts) {
        const products = JSON.parse(savedProducts);
        const existingProduct = products.find(
          (product: any) =>
            (productData.nix_item_id &&
              product.nix_item_id === productData.nix_item_id) ||
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

  // Updated handleDateChange to handle month-year selection better
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // For Android, hide the picker immediately
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    // Only update the date if a date was actually selected
    if (selectedDate) {
      // Set the day to the 1st of the selected month to ensure we're only tracking month/year
      const firstOfMonth = new Date(selectedDate);
      firstOfMonth.setDate(1);
      setExpiryDate(firstOfMonth);
    }
  };

  // Format date to show only month and year
  const formatDate = (date: Date | null) => {
    if (!date) return "Not set";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  // Update the handleSaveWithQuantity function to preserve all the original data
  const handleSaveWithQuantity = async () => {
    try {
      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      const products = savedProducts ? JSON.parse(savedProducts) : [];

      // Create a new product object that preserves all the original data
      const newProduct = {
        id: Date.now().toString(),
        name: productData.food_name || productData.name,
        brand: productData.brand_name || productData.brand,
        nix_item_id: productData.nix_item_id,
        calories: productData.nf_calories
          ? `${productData.nf_calories} kcal`
          : "N/A",
        imageUrl: productData.photo?.thumb || productData.imageUrl || "",
        data: JSON.stringify({ foods: [productData] }), // Store the complete data
        quantity: Number.parseInt(quantity) || 1,
        available_quantity: Number.parseInt(quantity) || 1,
        expiryDate: expiryDate ? expiryDate.toISOString() : null,
        // Preserve all nutritional data directly from the original object
        ...productData,
      };

      // console.log("Saving product:", newProduct);

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

  // Fix the issue with undefined nutritional values
  // Update the formatNutrientValue function to handle undefined values properly
  const formatNutrientValue = (
    value: number | null | undefined,
    unit: string
  ) => {
    if (value === null || value === undefined) return "N/A";
    return `${value} ${unit}`;
  };

  // Helper function to get nutrient name from attr_id
  const getNutrientName = (attrId: number) => {
    const nutrient = NUTRIENT_MAP.find((n) => n.attr_id === attrId);
    return nutrient ? nutrient.name : `Nutrient ${attrId}`;
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                productData.photo?.thumb ||
                productData.imageUrl ||
                "/placeholder.svg",
            }}
            style={styles.productImage}
          />
        </View>

        {/* Product Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.productName}>
            {productData.food_name || productData.name}
          </Text>
          <Text style={styles.brandName}>
            {productData.brand_name || productData.brand}
          </Text>

          {/* Serving Information */}
          <View style={styles.servingInfo}>
            <Text style={styles.servingText}>
              Serving Size: {productData.serving_qty || 1}{" "}
              {productData.serving_unit || "serving"}
              {productData.nf_metric_qty && (
                <Text style={styles.metricText}>
                  {" "}
                  ({productData.nf_metric_qty}{" "}
                  {productData.nf_metric_uom || "g"})
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
              {/* Display additional nutrients that aren't in the main summary */}
              {productData.nf_saturated_fat !== undefined && (
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientRowName}>Saturated Fat</Text>
                  <Text style={styles.nutrientRowValue}>
                    {productData.nf_saturated_fat} g
                  </Text>
                </View>
              )}
              {productData.nf_cholesterol !== undefined && (
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientRowName}>Cholesterol</Text>
                  <Text style={styles.nutrientRowValue}>
                    {productData.nf_cholesterol} mg
                  </Text>
                </View>
              )}
              {productData.nf_sodium !== undefined && (
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientRowName}>Sodium</Text>
                  <Text style={styles.nutrientRowValue}>
                    {productData.nf_sodium} mg
                  </Text>
                </View>
              )}
              {productData.nf_dietary_fiber !== undefined && (
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientRowName}>Dietary Fiber</Text>
                  <Text style={styles.nutrientRowValue}>
                    {productData.nf_dietary_fiber} g
                  </Text>
                </View>
              )}
              {productData.nf_sugars !== undefined && (
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientRowName}>Sugars</Text>
                  <Text style={styles.nutrientRowValue}>
                    {productData.nf_sugars} g
                  </Text>
                </View>
              )}
              {productData.nf_potassium !== undefined && (
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientRowName}>Potassium</Text>
                  <Text style={styles.nutrientRowValue}>
                    {productData.nf_potassium} mg
                  </Text>
                </View>
              )}

              {/* Display full nutrients if available */}
              {productData.full_nutrients &&
                productData.full_nutrients.map((nutrient: any) => {
                  // Skip nutrients that we've already displayed above
                  const skipAttrIds = [
                    203, 204, 205, 208, 269, 291, 307, 601, 605, 606,
                  ];
                  if (skipAttrIds.includes(nutrient.attr_id)) return null;

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

      {/* Quantity and Expiry Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={quantityModalVisible}
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Product</Text>
                <Text style={styles.modalSubtitle}>
                  {productData.food_name}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.quantityInput}
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={setQuantity}
                    placeholder="Enter quantity"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Expiry Month</Text>
                  <DatePicker
                    value={expiryDate}
                    onChange={setExpiryDate}
                    label="Expiry Date"
                  />
                </View>

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
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Action Buttons - Only show if not already scanned AND coming from scanner */}
      {!isAlreadyScanned && isFromScanner && (
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
    width: "85%",
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
  inputGroup: {
    width: "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  quantityInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  datePickerButtonText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
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

  // Improved date picker container with better styling
  datePickerContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePicker: {
    width: "100%",
  },
  datePickerDoneButton: {
    alignSelf: "flex-end",
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  datePickerDoneText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
