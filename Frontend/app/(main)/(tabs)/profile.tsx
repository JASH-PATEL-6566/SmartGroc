import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  TouchableWithoutFeedback,
  Modal,
  Pressable,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NUTRIENT_MAP } from "@/constants/nutritions";
import { COLOR_CONST } from "@/constants/color";
import { logout } from "@/utils/auth";
import Button from "@/components/Button";

const STORAGE_KEY = "@nutritional_preferences";

const saveNutritionalPreferences = async (preferences: string[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.error("Failed to save nutritional preferences to AsyncStorage", e);
  }
};

const resetNutritionalPreferences = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error("Failed to reset nutritional preferences to AsyncStorage", e);
  }
};

const loadDietaryPreferences = async (): Promise<string[]> => {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch (e) {
    console.error("Failed to load dietary preferences from AsyncStorage", e);
    return [];
  }
};

interface DietaryTagProps {
  label: string;
  onRemove: () => void;
}

const DietaryTag: React.FC<DietaryTagProps> = ({ label, onRemove }) => (
  <TouchableOpacity onPress={onRemove}>
    <View style={[styles.dietaryTag]}>
      <Text style={[styles.dietaryTagText]}>{label}</Text>
    </View>
  </TouchableOpacity>
);

export default function Profile() {
  const [expireAlerts, setExpireAlerts] = useState<boolean>(true);
  const [shoppingLists, setShoppingLists] = useState<boolean>(true);
  const [recipeSuggestions, setRecipeSuggestions] = useState<boolean>(false);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [nutritionalPreferences, setNutritionalPreferences] = useState<
    string[]
  >([]);

  const renderInputModal = () => {
    return (
      <Modal
        visible={showInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInput(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowInput(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder="Type a dietary preference"
                    autoFocus
                  />
                  <FlatList
                    data={filteredNutrients}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestionItem}
                        onPress={() => addPreference(item.name)}
                      >
                        <Text>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item.usda_tag}
                    style={styles.suggestionList}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  useEffect(() => {
    loadDietaryPreferences().then(setNutritionalPreferences);
  }, []);

  const filteredNutrients = NUTRIENT_MAP.filter((nutrient) =>
    nutrient.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const addPreference = (preference: string) => {
    if (!nutritionalPreferences.includes(preference)) {
      const newPreferences = [...nutritionalPreferences, preference];
      setNutritionalPreferences(newPreferences);
      saveNutritionalPreferences(newPreferences);
    }
    setInputValue("");
    setShowInput(false);
  };

  const resetPreferences = () => {
    Alert.alert(
      "Confirmation !",
      "Do you really want to reset nutritional prefrence?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          style: "destructive",
          onPress: () => {
            setNutritionalPreferences([]);
            resetNutritionalPreferences();
          },
        },
      ]
    );
  };

  const removePreference = (preference: string) => {
    Alert.alert(
      "Confirmation !",
      "Do you really want to remove this nutritional prefrence?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          style: "destructive",
          onPress: () => {
            const newPreferences = nutritionalPreferences.filter(
              (pref) => pref !== preference
            );
            setNutritionalPreferences(newPreferences);
            saveNutritionalPreferences(newPreferences);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image
            source={{
              uri: "https://avatar.iran.liara.run/public/100",
            }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>John Doe</Text>
            <Text style={styles.email}>john.doe@example.com</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutritional Preferences</Text>
          <View style={styles.dietaryTags}>
            {nutritionalPreferences.map((pref, index) => (
              <DietaryTag
                key={index}
                label={pref}
                onRemove={() => removePreference(pref)}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={() => setShowInput(true)}
          >
            <MaterialCommunityIcons name="plus" size={24} color="#007AFF" />
            <Text style={styles.addMoreText}>Add More</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Expiry Alerts</Text>
            <Switch
              value={expireAlerts}
              onValueChange={setExpireAlerts}
              trackColor={{ false: "#D1D1D6", true: COLOR_CONST.light_green }}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Shopping Lists</Text>
            <Switch
              value={shoppingLists}
              onValueChange={setShoppingLists}
              trackColor={{ false: "#D1D1D6", true: COLOR_CONST.light_green }}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Recipe Suggestions</Text>
            <Switch
              value={recipeSuggestions}
              onValueChange={setRecipeSuggestions}
              trackColor={{ false: "#D1D1D6", true: COLOR_CONST.light_green }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Settings</Text>
          <TouchableOpacity style={styles.dangerButton}>
            <View style={styles.dangerButtonContent}>
              <Text style={styles.dangerButtonText}>
                Clear Shopping History
              </Text>
              <MaterialCommunityIcons name="delete" size={24} color="#FF3B30" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetPreferences}
          >
            <View style={styles.resetButtonContent}>
              <Text style={styles.resetButtonText}>Reset Preferences</Text>
              <MaterialCommunityIcons
                name="refresh"
                size={24}
                color="#8E8E93"
              />
            </View>
          </TouchableOpacity>
        </View>
        <Button
          color="red"
          text="Logout"
          onPress={async () => await logout()}
          textColor="white"
        />
      </ScrollView>
      {renderInputModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
  },
  profileInfo: {
    marginLeft: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
  },
  email: {
    fontSize: 14,
    color: "#8E8E93",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  dietaryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dietaryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
  },
  activeDietaryTag: {
    backgroundColor: "#007AFF",
  },
  dietaryTagText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  addMoreText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#007AFF",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  dangerButton: {
    marginBottom: 12,
  },
  dangerButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dangerButtonText: {
    fontSize: 16,
    color: "#FF3B30",
  },
  resetButton: {
    marginTop: 4,
  },
  resetButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    color: "#8E8E93",
  },
  inputContainer: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
  },
  suggestionList: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    marginTop: 4,
  },
  suggestionItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
  },
});
