import type React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface AllergyTagProps {
  label: string;
  onRemove: () => void;
  severity?: "high" | "medium" | "low";
}

const AllergyTag: React.FC<AllergyTagProps> = ({
  label,
  onRemove,
  severity = "medium",
}) => {
  // Determine tag color based on severity
  const getTagColor = () => {
    switch (severity) {
      case "high":
        return "#FF3B30"; // Red for high severity
      case "medium":
        return "#FF9500"; // Orange for medium severity
      case "low":
        return "#FFCC00"; // Yellow for low severity
      default:
        return "#FF9500"; // Default to orange
    }
  };

  return (
    <View style={[styles.allergyTag, { backgroundColor: getTagColor() }]}>
      <Text style={styles.allergyTagText}>{label}</Text>
      <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
        <MaterialCommunityIcons name="close" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  allergyTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  allergyTagText: {
    fontSize: 14,
    color: "white",
    fontWeight: "500",
  },
  removeButton: {
    marginLeft: 6,
  },
});

export default AllergyTag;
