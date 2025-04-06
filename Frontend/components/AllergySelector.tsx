"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { foodAllergens, getAllAllergens } from "@/constants/allergens";
import { COLOR_CONST } from "@/constants/color";

interface AllergySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelectAllergen: (allergen: string) => void;
  selectedAllergies: string[];
}

const AllergySelector: React.FC<AllergySelectorProps> = ({
  visible,
  onClose,
  onSelectAllergen,
  selectedAllergies,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    "commonAllergens"
  );
  const [filteredAllergens, setFilteredAllergens] = useState<string[]>([]);

  // Update filtered allergens when search query or category changes
  useEffect(() => {
    if (searchQuery.trim()) {
      // If there's a search query, filter all allergens
      const allAllergens = getAllAllergens();
      setFilteredAllergens(
        allAllergens.filter(
          (allergen) =>
            allergen.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !selectedAllergies.includes(allergen)
        )
      );
    } else if (selectedCategory) {
      // Otherwise, show allergens from selected category
      setFilteredAllergens(
        (
          foodAllergens[
            selectedCategory as keyof typeof foodAllergens
          ] as string[]
        ).filter((allergen) => !selectedAllergies.includes(allergen))
      );
    } else {
      setFilteredAllergens([]);
    }
  }, [searchQuery, selectedCategory, selectedAllergies]);

  const renderCategoryButton = (category: string, label: string) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.selectedCategoryButton,
      ]}
      onPress={() => {
        setSelectedCategory(category);
        setSearchQuery("");
      }}
    >
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category && styles.selectedCategoryButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Allergies</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search allergens..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />

            {!searchQuery && (
              <View style={styles.categoriesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {renderCategoryButton("commonAllergens", "Common")}
                  {renderCategoryButton("treeNuts", "Tree Nuts")}
                  {renderCategoryButton("shellfish", "Shellfish")}
                  {renderCategoryButton("fruits", "Fruits")}
                  {renderCategoryButton("vegetables", "Vegetables")}
                  {renderCategoryButton("grainsAndLegumes", "Grains & Legumes")}
                  {renderCategoryButton("seeds", "Seeds")}
                  {renderCategoryButton("spices", "Spices")}
                  {renderCategoryButton("meats", "Meats")}
                  {renderCategoryButton("additives", "Additives")}
                  {renderCategoryButton("others", "Others")}
                </ScrollView>
              </View>
            )}

            <FlatList
              data={filteredAllergens}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.allergenItem}
                  onPress={() => {
                    onSelectAllergen(item);
                    // Don't close modal to allow multiple selections
                  }}
                >
                  <Text style={styles.allergenName}>{item}</Text>
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color={COLOR_CONST.light_green}
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery
                      ? "No matching allergens found"
                      : "No allergens available in this category"}
                  </Text>
                </View>
              }
            />

            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

import { ScrollView } from "react-native";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 5,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: COLOR_CONST.light_green,
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#666",
  },
  selectedCategoryButtonText: {
    color: "white",
    fontWeight: "500",
  },
  allergenItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  allergenName: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  doneButton: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  doneButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default AllergySelector;
