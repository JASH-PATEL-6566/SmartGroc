"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { NUTRIENT_MAP } from "@/constants/nutritions";
import { COLOR_CONST } from "@/constants/color";
import { logout } from "@/utils/auth";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AllergyTag from "@/components/AllergyTag";
import AllergySelector from "@/components/AllergySelector";
import * as ImagePicker from "expo-image-picker";

// Add S3 configuration constants
const S3_REGION = "us-east-2"; // Replace with your S3 region
const S3_BUCKET = "smartgroc-bucket"; // Replace with your S3 bucket name

// Add this function at the beginning of the file, after the imports
const loadUserPreferences = async () => {
  try {
    const userPrefs = await AsyncStorage.getItem("@user_preferences");
    if (userPrefs) {
      return JSON.parse(userPrefs);
    }
    // Default preferences
    return {
      expireAlerts: true,
      recipeSuggestions: false,
    };
  } catch (error) {
    console.error("Failed to load user preferences", error);
    return {
      expireAlerts: true,
      recipeSuggestions: false,
    };
  }
};

const loadDietaryPreferences = async (uid: string): Promise<string[]> => {
  try {
    if (!uid) {
      console.error("No UID found in AsyncStorage");
      return [];
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().nutritional_preferences || []; // Return array from Firestore
    } else {
      console.error("User document not found");
      return [];
    }
  } catch (error) {
    console.error("Failed to load dietary preferences from Firestore", error);
    return [];
  }
};

// Add this function to load allergies
const loadAllergies = async (uid: string): Promise<string[]> => {
  try {
    if (!uid) {
      console.error("No UID found");
      return [];
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data().allergies || []; // Return array from Firestore
    } else {
      console.error("User document not found");
      return [];
    }
  } catch (error) {
    console.error("Failed to load allergies from Firestore", error);
    return [];
  }
};

// Add function to load profile picture
const loadProfilePicture = async (uid: string): Promise<string | null> => {
  try {
    // First try to get from AsyncStorage for faster loading
    const cachedProfilePic = await AsyncStorage.getItem("@profile_picture");
    if (cachedProfilePic) {
      return cachedProfilePic;
    }

    if (!uid) {
      return null;
    }

    // If not in AsyncStorage, try to get from Firestore
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().profilePicture) {
      const profilePicUrl = userSnap.data().profilePicture;
      // Cache it in AsyncStorage for next time
      await AsyncStorage.setItem("@profile_picture", profilePicUrl);
      return profilePicUrl;
    }

    return null;
  } catch (error) {
    console.error("Failed to load profile picture:", error);
    return null;
  }
};

// Add function to upload profile picture to S3
const uploadProfilePictureToS3 = async (imageUri: string, uid: string) => {
  try {
    // Fetch the image file and convert it to a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Generate a unique filename for the image
    const filename = `profile_pictures/${uid}_${Date.now()}.jpg`;

    // Construct the S3 upload URL
    const uploadURL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${filename}`;

    // Create the headers
    const headers = {
      "Content-Type": "image/jpeg", // Content type of the image
    };

    // Upload the image to S3 using a PUT request
    const uploadRes = await fetch(uploadURL, {
      method: "PUT",
      body: blob,
      headers,
    });

    // Check if the upload was successful
    if (!uploadRes.ok) throw new Error("Failed to upload image");

    console.log("✅ Profile picture uploaded successfully to S3");

    // Return the URL of the uploaded image
    return uploadURL;
  } catch (error: unknown) {
    console.error(
      "❌ Error uploading to S3:",
      error instanceof Error ? error.message : error
    );
    throw error;
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

// Then update the Profile component to use this function
export default function Profile() {
  const [expireAlerts, setExpireAlerts] = useState<boolean>(true);
  const [recipeSuggestions, setRecipeSuggestions] = useState<boolean>(false);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [nutritionalPreferences, setNutritionalPreferences] = useState<
    string[]
  >([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [showAllergySelector, setShowAllergySelector] =
    useState<boolean>(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [showProfilePicOptions, setShowProfilePicOptions] =
    useState<boolean>(false);
  const { uid } = useSelector((state: RootState) => state.auth.user);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const prefs = await loadUserPreferences();
      setExpireAlerts(prefs.expireAlerts);
      setRecipeSuggestions(prefs.recipeSuggestions);
    };

    loadPreferences();
    loadDietaryPreferences(uid).then(setNutritionalPreferences);
    loadAllergies(uid).then(setAllergies);
    loadProfilePicture(uid).then(setProfilePicture);
  }, []);

  // Save user preferences when they change
  const saveUserPreferences = async (key: string, value: boolean) => {
    try {
      const prefs = await loadUserPreferences();
      prefs[key] = value;
      await AsyncStorage.setItem("@user_preferences", JSON.stringify(prefs));
    } catch (error) {
      console.error("Failed to save user preferences", error);
    }
  };

  // Update the toggle handlers
  const handleExpireAlertsToggle = (value: boolean) => {
    setExpireAlerts(value);
    saveUserPreferences("expireAlerts", value);
  };

  const handleRecipeSuggestionsToggle = (value: boolean) => {
    setRecipeSuggestions(value);
    saveUserPreferences("recipeSuggestions", value);
  };

  const filteredNutrients = NUTRIENT_MAP.filter((nutrient) =>
    nutrient.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const addPreference = async (preference: string) => {
    if (!nutritionalPreferences.includes(preference)) {
      const newPreferences = [...nutritionalPreferences, preference];
      setNutritionalPreferences(newPreferences);

      try {
        if (uid) {
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, {
            nutritional_preferences: arrayUnion(preference), // Add to Firestore array
          });
        }
      } catch (error) {
        console.error("Error updating nutritional preferences:", error);
      }
    }
    setInputValue("");
    setShowInput(false);
  };

  // Add allergen to user's allergies
  const addAllergen = async (allergen: string) => {
    if (!allergies.includes(allergen)) {
      const newAllergies = [...allergies, allergen];
      setAllergies(newAllergies);

      try {
        if (uid) {
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, {
            allergies: arrayUnion(allergen), // Add to Firestore array
          });

          // Also save to AsyncStorage for quick access during product scanning
          await AsyncStorage.setItem(
            "@user_allergies",
            JSON.stringify(newAllergies)
          );
        }
      } catch (error) {
        console.error("Error updating allergies:", error);
      }
    }
  };

  // Remove allergen from user's allergies
  const removeAllergen = async (allergen: string) => {
    Alert.alert(
      "Remove Allergen",
      `Are you sure you want to remove ${allergen} from your allergies?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            const newAllergies = allergies.filter((a) => a !== allergen);
            setAllergies(newAllergies);

            try {
              if (uid) {
                const userRef = doc(db, "users", uid);
                await updateDoc(userRef, {
                  allergies: arrayRemove(allergen), // Remove from Firestore array
                });

                // Update AsyncStorage
                await AsyncStorage.setItem(
                  "@user_allergies",
                  JSON.stringify(newAllergies)
                );
              }
            } catch (error) {
              console.error("Error removing allergen:", error);
            }
          },
        },
      ]
    );
  };

  const resetPreferences = async () => {
    Alert.alert(
      "Confirmation!",
      "Do you really want to reset nutritional preferences?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          style: "destructive",
          onPress: async () => {
            setNutritionalPreferences([]);

            try {
              if (uid) {
                const userRef = doc(db, "users", uid);
                await updateDoc(userRef, {
                  nutritional_preferences: [], // Reset Firestore array
                });
              }
            } catch (error) {
              console.error("Error resetting nutritional preferences:", error);
            }
          },
        },
      ]
    );
  };

  // Reset allergies
  const resetAllergies = async () => {
    Alert.alert(
      "Reset Allergies",
      "Are you sure you want to remove all your allergies?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setAllergies([]);

            try {
              if (uid) {
                const userRef = doc(db, "users", uid);
                await updateDoc(userRef, {
                  allergies: [], // Reset Firestore array
                });

                // Clear AsyncStorage
                await AsyncStorage.setItem(
                  "@user_allergies",
                  JSON.stringify([])
                );
              }
            } catch (error) {
              console.error("Error resetting allergies:", error);
            }
          },
        },
      ]
    );
  };

  const removePreference = async (preference: string) => {
    Alert.alert(
      "Confirmation!",
      "Do you really want to remove this nutritional preference?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          style: "destructive",
          onPress: async () => {
            const newPreferences = nutritionalPreferences.filter(
              (pref) => pref !== preference
            );
            setNutritionalPreferences(newPreferences);

            try {
              if (uid) {
                const userRef = doc(db, "users", uid);
                await updateDoc(userRef, {
                  nutritional_preferences: arrayRemove(preference), // Remove from Firestore array
                });
              }
            } catch (error) {
              console.error("Error removing nutritional preference:", error);
            }
          },
        },
      ]
    );
  };

  // Updated Profile picture function to use S3
  const pickImage = async (fromCamera = false) => {
    try {
      setUploading(true);

      // Request permissions first
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission needed",
            "Camera permission is required to take photos"
          );
          setUploading(false);
          return;
        }
      } else {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission needed",
            "Media library permission is required to select photos"
          );
          setUploading(false);
          return;
        }
      }

      // Launch camera or image picker
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        try {
          // Upload to S3
          const s3ImageUrl = await uploadProfilePictureToS3(imageUri, uid);

          // Save S3 URL to AsyncStorage for immediate display
          await AsyncStorage.setItem("@profile_picture", s3ImageUrl);
          setProfilePicture(s3ImageUrl);

          // Save S3 URL to Firestore if user is logged in
          if (uid) {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, {
              profilePicture: s3ImageUrl,
            });
          }

          Alert.alert("Success", "Profile picture uploaded successfully!");
        } catch (uploadError) {
          console.error("Error uploading to S3:", uploadError);

          // Fallback to local storage if S3 upload fails
          await AsyncStorage.setItem("@profile_picture", imageUri);
          setProfilePicture(imageUri);

          if (uid) {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, {
              profilePicture: imageUri,
            });
          }

          Alert.alert(
            "Warning",
            "Could not upload to cloud storage. Using local storage instead."
          );
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      setShowProfilePicOptions(false);
    }
  };

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

  const renderProfilePicOptionsModal = () => {
    return (
      <Modal
        visible={showProfilePicOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfilePicOptions(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setShowProfilePicOptions(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.profilePicModalContent}>
              <Text style={styles.profilePicModalTitle}>
                Change Profile Picture
              </Text>

              <TouchableOpacity
                style={styles.profilePicOption}
                onPress={() => pickImage(false)}
              >
                <MaterialCommunityIcons
                  name="image-outline"
                  size={24}
                  color={COLOR_CONST.light_green}
                />
                <Text style={styles.profilePicOptionText}>
                  Choose from Gallery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profilePicOption}
                onPress={() => pickImage(true)}
              >
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={24}
                  color={COLOR_CONST.light_green}
                />
                <Text style={styles.profilePicOptionText}>Take a Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.profilePicOption, styles.cancelOption]}
                onPress={() => setShowProfilePicOptions(false)}
              >
                <Text style={styles.cancelOptionText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Update the JSX to include the allergies section
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {uploading ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator
                  size="large"
                  color={COLOR_CONST.light_green}
                />
              </View>
            ) : (
              <Image
                source={
                  profilePicture
                    ? { uri: profilePicture }
                    : { uri: "https://avatar.iran.liara.run/public/100" }
                }
                style={styles.avatar}
              />
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => setShowProfilePicOptions(true)}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>John Doe</Text>
            <Text style={styles.email}>john.doe@example.com</Text>
          </View>
        </View>

        {/* Allergies Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={24}
              color={COLOR_CONST.light_green}
            />
            <Text style={styles.sectionTitle}>Food Allergies</Text>
          </View>
          <Text style={styles.sectionDescription}>
            We'll alert you when scanned products contain these allergens
          </Text>

          <View style={styles.allergiesContainer}>
            {allergies.length > 0 ? (
              <View style={styles.allergyTags}>
                {allergies.map((allergen, index) => (
                  <AllergyTag
                    key={index}
                    label={allergen}
                    onRemove={() => removeAllergen(allergen)}
                    severity="high"
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <MaterialCommunityIcons
                  name="food-off"
                  size={40}
                  color="#ccc"
                />
                <Text style={styles.noAllergiesText}>
                  No allergies added yet. Add allergens to receive alerts when
                  scanning products.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.allergyButtonsContainer}>
            <TouchableOpacity
              style={styles.addAllergyButton}
              onPress={() => setShowAllergySelector(true)}
            >
              <MaterialCommunityIcons name="plus" size={20} color="white" />
              <Text style={styles.addAllergyButtonText}>Add Allergen</Text>
            </TouchableOpacity>

            {allergies.length > 0 && (
              <TouchableOpacity
                style={styles.resetAllergiesButton}
                onPress={resetAllergies}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#666" />
                <Text style={styles.resetAllergiesButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Nutritional Preferences Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="food-apple-outline"
              size={24}
              color={COLOR_CONST.light_green}
            />
            <Text style={styles.sectionTitle}>Nutritional Preferences</Text>
          </View>

          {nutritionalPreferences.length > 0 ? (
            <View style={styles.dietaryTags}>
              {nutritionalPreferences.map((pref, index) => (
                <DietaryTag
                  key={index}
                  label={pref}
                  onRemove={() => removePreference(pref)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <MaterialCommunityIcons
                name="food-variant"
                size={40}
                color="#ccc"
              />
              <Text style={styles.noPreferencesText}>
                No nutritional preferences added yet. Add preferences to
                customize your experience.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.addPreferenceButton}
            onPress={() => setShowInput(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
            <Text style={styles.addPreferenceButtonText}>Add Preference</Text>
          </TouchableOpacity>

          {nutritionalPreferences.length > 0 && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetPreferences}
            >
              <View style={styles.resetButtonContent}>
                <Text style={styles.resetButtonText}>Reset Preferences</Text>
                <MaterialCommunityIcons
                  name="refresh"
                  size={20}
                  color="#8E8E93"
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification Settings Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color={COLOR_CONST.light_green}
            />
            <Text style={styles.sectionTitle}>Notification Settings</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialCommunityIcons
                name="clock-alert-outline"
                size={22}
                color="#666"
              />
              <Text style={styles.settingLabel}>Expiry Alerts</Text>
            </View>
            <Switch
              value={expireAlerts}
              onValueChange={handleExpireAlertsToggle}
              trackColor={{ false: "#D1D1D6", true: COLOR_CONST.light_green }}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialCommunityIcons
                name="food-fork-drink"
                size={22}
                color="#666"
              />
              <Text style={styles.settingLabel}>Recipe Suggestions</Text>
            </View>
            <Switch
              value={recipeSuggestions}
              onValueChange={handleRecipeSuggestionsToggle}
              trackColor={{ false: "#D1D1D6", true: COLOR_CONST.light_green }}
            />
          </View>
        </View>

        {/* Storage Settings Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="database-outline"
              size={24}
              color={COLOR_CONST.light_green}
            />
            <Text style={styles.sectionTitle}>Storage Settings</Text>
          </View>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionButtonContent}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={22}
                color="#FF3B30"
              />
              <Text style={[styles.actionButtonText, { color: "#FF3B30" }]}>
                Clear Shopping History
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#8E8E93"
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => await logout()}
        >
          <MaterialCommunityIcons name="logout" size={22} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>SmartGroc v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderInputModal()}
      {renderProfilePicOptionsModal()}
      <AllergySelector
        visible={showAllergySelector}
        onClose={() => setShowAllergySelector(false)}
        onSelectAllergen={addAllergen}
        selectedAllergies={allergies}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    width: 80,
    height: 80,
  },
  avatarLoading: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLOR_CONST.light_green,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLOR_CONST.light_green,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#666",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",

    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    marginLeft: 32,
  },
  allergiesContainer: {
    marginBottom: 16,
  },
  allergyTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginVertical: 10,
  },
  noAllergiesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  noPreferencesText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  allergyButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addAllergyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  addAllergyButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  resetAllergiesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetAllergiesButtonText: {
    color: "#666",
    fontWeight: "500",
    marginLeft: 8,
  },
  dietaryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dietaryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
  },
  dietaryTagText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  addPreferenceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  addPreferenceButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  resetButton: {
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    color: "#8E8E93",
    marginRight: 8,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
  actionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    alignItems: "center",
    marginBottom: 20,
  },
  versionText: {
    color: "#8E8E93",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  suggestionList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 8,
    marginTop: 8,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  // Profile picture modal styles
  profilePicModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profilePicModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  profilePicOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profilePicOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  cancelOption: {
    justifyContent: "center",
    marginTop: 10,
    borderBottomWidth: 0,
  },
  cancelOptionText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
