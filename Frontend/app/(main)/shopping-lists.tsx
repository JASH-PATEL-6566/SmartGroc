"use client";

import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { COLOR_CONST } from "@/constants/color";
import { useRouter } from "expo-router";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

// Define types for shopping lists
type ShoppingListItem = {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
  note?: string;
};

type ShoppingList = {
  id: string;
  name: string;
  createdAt: number;
  items: ShoppingListItem[];
};

export default function ShoppingLists() {
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListModalVisible, setNewListModalVisible] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [newItemModalVisible, setNewItemModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("1");
  const [newItemNote, setNewItemNote] = useState("");
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);
  const { uid } = useSelector((state: RootState) => state.auth.user);

  // Load shopping lists from Firestore and AsyncStorage
  const loadLists = useCallback(async () => {
    try {
      setLoading(true);

      if (uid) {
        // Load from Firestore if user is logged in
        const listsRef = collection(db, "users", uid, "shopping_lists");
        const listsSnapshot = await getDocs(listsRef);

        if (!listsSnapshot.empty) {
          const loadedLists: ShoppingList[] = [];

          listsSnapshot.forEach((doc) => {
            const listData = doc.data() as ShoppingList;
            loadedLists.push({
              ...listData,
              id: doc.id,
            });
          });

          // Sort lists by creation date (newest first)
          loadedLists.sort((a, b) => b.createdAt - a.createdAt);

          setLists(loadedLists);

          // If there's at least one list, set the first one as active
          if (loadedLists.length > 0 && !activeList) {
            setActiveList(loadedLists[0]);
          }

          // Also save to AsyncStorage for offline access
          await AsyncStorage.setItem(
            "@shopping_lists",
            JSON.stringify(loadedLists)
          );
          setLoading(false);
          return;
        }
      }

      // Fall back to AsyncStorage if Firestore has no data or user is not logged in
      const savedLists = await AsyncStorage.getItem("@shopping_lists");
      if (savedLists) {
        const parsedLists = JSON.parse(savedLists);
        setLists(parsedLists);

        // If there's at least one list, set the first one as active
        if (parsedLists.length > 0 && !activeList) {
          setActiveList(parsedLists[0]);
        }

        // If user is logged in, sync AsyncStorage data to Firestore
        if (uid && parsedLists.length > 0) {
          await syncListsToFirestore(parsedLists);
        }
      }
    } catch (error) {
      console.error("Error loading shopping lists:", error);
      Alert.alert("Error", "Failed to load your shopping lists");
    } finally {
      setLoading(false);
    }
  }, [activeList, uid]);

  // Sync lists from AsyncStorage to Firestore
  const syncListsToFirestore = async (listsToSync: ShoppingList[]) => {
    if (!uid) return;

    try {
      for (const list of listsToSync) {
        const listRef = doc(db, "users", uid, "shopping_lists", list.id);
        await setDoc(listRef, list);
      }
    } catch (error) {
      console.error("Error syncing lists to Firestore:", error);
    }
  };

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // Save lists to Firestore and AsyncStorage
  const saveLists = async (updatedLists: ShoppingList[]) => {
    try {
      // Save to AsyncStorage first (for offline access)
      await AsyncStorage.setItem(
        "@shopping_lists",
        JSON.stringify(updatedLists)
      );

      // Then save to Firestore if user is logged in
      if (uid) {
        for (const list of updatedLists) {
          // Create a clean version of the list with no undefined values
          const cleanList = {
            id: list.id,
            name: list.name || "",
            createdAt: list.createdAt || Date.now(),
            items: list.items.map((item) => ({
              id: item.id,
              name: item.name || "",
              quantity: item.quantity || 1,
              purchased: item.purchased || false,
              note: item.note || "", // Convert undefined to empty string
            })),
          };

          const listRef = doc(db, "users", uid, "shopping_lists", list.id);
          await setDoc(listRef, cleanList);
        }
      }

      setLists(updatedLists);
    } catch (error) {
      console.error("Error saving shopping lists:", error);
      Alert.alert("Error", "Failed to save your shopping lists");
    }
  };

  // Create a new shopping list
  const createNewList = async () => {
    if (!newListName.trim()) {
      Alert.alert("Error", "Please enter a list name");
      return;
    }

    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      createdAt: Date.now(),
      items: [],
    };

    const updatedLists = [...lists, newList];
    await saveLists(updatedLists);
    setNewListName("");
    setNewListModalVisible(false);
    setActiveList(newList);
  };

  // Delete a shopping list
  const deleteList = async (listId: string) => {
    Alert.alert(
      "Delete List",
      "Are you sure you want to delete this shopping list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedLists = lists.filter((list) => list.id !== listId);

              // Delete from Firestore if user is logged in
              if (uid) {
                const listRef = doc(db, "users", uid, "shopping_lists", listId);
                await deleteDoc(listRef);
              }

              // Update AsyncStorage and state
              await AsyncStorage.setItem(
                "@shopping_lists",
                JSON.stringify(updatedLists)
              );
              setLists(updatedLists);

              if (activeList?.id === listId) {
                setActiveList(updatedLists.length > 0 ? updatedLists[0] : null);
              }
            } catch (error) {
              console.error("Error deleting list:", error);
              Alert.alert("Error", "Failed to delete the shopping list");
            }
          },
        },
      ]
    );
  };

  // Add or edit an item in the active list
  const saveItem = async () => {
    if (!activeList) return;
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter an item name");
      return;
    }

    const quantity = Number.parseInt(newItemQuantity) || 1;

    const updatedLists = [...lists];
    const listIndex = updatedLists.findIndex(
      (list) => list.id === activeList.id
    );

    if (listIndex === -1) return;

    if (editingItem) {
      // Edit existing item
      const itemIndex = updatedLists[listIndex].items.findIndex(
        (item) => item.id === editingItem.id
      );
      if (itemIndex !== -1) {
        updatedLists[listIndex].items[itemIndex] = {
          ...updatedLists[listIndex].items[itemIndex],
          name: newItemName.trim(),
          quantity,
          note: newItemNote.trim(),
        };
      }
    } else {
      // Add new item
      const newItem: ShoppingListItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        quantity,
        purchased: false,
        note: newItemNote.trim() || undefined,
      };
      updatedLists[listIndex].items.push(newItem);
    }

    await saveLists(updatedLists);
    setActiveList(updatedLists[listIndex]);
    resetItemForm();
  };

  // Toggle item purchased status with confirmation
  const toggleItemPurchased = async (itemId: string) => {
    if (!activeList) return;

    const updatedLists = [...lists];
    const listIndex = updatedLists.findIndex(
      (list) => list.id === activeList.id
    );
    if (listIndex === -1) return;

    const itemIndex = updatedLists[listIndex].items.findIndex(
      (item) => item.id === itemId
    );
    if (itemIndex === -1) return;

    const item = updatedLists[listIndex].items[itemIndex];

    // If the item is already purchased, just toggle it back without confirmation
    if (item.purchased) {
      updatedLists[listIndex].items[itemIndex].purchased = false;
      await saveLists(updatedLists);
      setActiveList(updatedLists[listIndex]);
      return;
    }

    // Show confirmation dialog for marking as purchased
    Alert.alert(
      "Confirm Purchase",
      `Do you really want to mark "${item.name}" as purchased?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Mark as Purchased",
          onPress: async () => {
            updatedLists[listIndex].items[itemIndex].purchased = true;
            await saveLists(updatedLists);
            setActiveList(updatedLists[listIndex]);
          },
        },
      ]
    );
  };

  // Handle scan button press for a specific item
  const handleItemScan = (item: ShoppingListItem) => {
    if (!activeList) return;

    Alert.alert(
      "Confirm Purchase",
      `Do you really want to mark "${item.name}" as purchased?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes and Scan More",
          onPress: async () => {
            try {
              // Mark item as purchased
              const updatedLists = [...lists];
              const listIndex = updatedLists.findIndex(
                (list) => list.id === activeList.id
              );
              if (listIndex === -1) return;

              const itemIndex = updatedLists[listIndex].items.findIndex(
                (i) => i.id === item.id
              );
              if (itemIndex === -1) return;

              updatedLists[listIndex].items[itemIndex].purchased = true;

              // Save changes before navigation
              await saveLists(updatedLists);

              // Update local state
              setActiveList({
                ...updatedLists[listIndex],
              });

              // Navigate to scan page with a slight delay to ensure state is updated
              setTimeout(() => {
                router.push("/(main)/(tabs)/(scan)/Scan");
              }, 300);
            } catch (error) {
              console.error("Error marking item as purchased:", error);
              Alert.alert("Error", "Failed to mark item as purchased");
            }
          },
        },
      ]
    );
  };

  // Delete an item from the active list
  const deleteItem = async (itemId: string) => {
    if (!activeList) return;

    Alert.alert(
      "Delete Item",
      "Are you sure you want to remove this item from your list?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const updatedLists = [...lists];
            const listIndex = updatedLists.findIndex(
              (list) => list.id === activeList.id
            );
            if (listIndex === -1) return;

            updatedLists[listIndex].items = updatedLists[
              listIndex
            ].items.filter((item) => item.id !== itemId);

            await saveLists(updatedLists);
            setActiveList(updatedLists[listIndex]);
          },
        },
      ]
    );
  };

  // Edit an existing item
  const editItem = (item: ShoppingListItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity.toString());
    setNewItemNote(item.note || "");
    setNewItemModalVisible(true);
  };

  // Reset the item form
  const resetItemForm = () => {
    setNewItemName("");
    setNewItemQuantity("1");
    setNewItemNote("");
    setEditingItem(null);
    setNewItemModalVisible(false);
  };

  // Calculate progress for a list
  const calculateProgress = (list: ShoppingList) => {
    if (list.items.length === 0) return 0;
    const purchasedItems = list.items.filter((item) => item.purchased).length;
    return (purchasedItems / list.items.length) * 100;
  };

  // Render a shopping list item
  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        activeList?.id === item.id && styles.activeListItem,
      ]}
      onPress={() => setActiveList(item)}
    >
      <View style={styles.listItemContent}>
        <Text style={styles.listItemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.listItemCount}>
          {item.items.length} {item.items.length === 1 ? "item" : "items"}
        </Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${calculateProgress(item)}%` },
              calculateProgress(item) === 100 && styles.progressBarComplete,
            ]}
          />
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteListButton}
        onPress={() => deleteList(item.id)}
      >
        <Feather name="trash-2" size={18} color="#ff4d4f" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render a shopping list item
  const renderShoppingItem = ({ item }: { item: ShoppingListItem }) => (
    <View style={[styles.shoppingItem, item.purchased && styles.purchasedItem]}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => toggleItemPurchased(item.id)}
      >
        <View
          style={[styles.checkbox, item.purchased && styles.checkboxChecked]}
        >
          {item.purchased && <Feather name="check" size={14} color="white" />}
        </View>
      </TouchableOpacity>
      <View style={styles.itemContent}>
        <Text
          style={[styles.itemName, item.purchased && styles.purchasedText]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.note && (
          <Text
            style={[styles.itemNote, item.purchased && styles.purchasedText]}
            numberOfLines={1}
          >
            {item.note}
          </Text>
        )}
      </View>
      <Text
        style={[styles.itemQuantity, item.purchased && styles.purchasedText]}
      >
        x{item.quantity}
      </Text>
      <View style={styles.itemActions}>
        {!item.purchased && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => handleItemScan(item)}
          >
            <Feather name="camera" size={16} color="#1e88e5" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editItem(item)}
        >
          <Feather name="edit-2" size={16} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteItemButton}
          onPress={() => deleteItem(item.id)}
        >
          <Feather name="trash-2" size={16} color="#ff4d4f" />
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.title}>Shopping Lists</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setNewListModalVisible(true)}
        >
          <Feather name="plus" size={20} color="white" />
          <Text style={styles.addButtonText}>New List</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_CONST.light_green} />
          <Text style={styles.loadingText}>Loading your shopping lists...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Lists Section */}
          <View style={styles.listsSection}>
            <Text style={styles.sectionTitle}>Your Lists</Text>
            {lists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="clipboard-list-outline"
                  size={48}
                  color="#888"
                />
                <Text style={styles.emptyText}>
                  You don't have any shopping lists yet
                </Text>
                <TouchableOpacity
                  style={styles.createListButton}
                  onPress={() => setNewListModalVisible(true)}
                >
                  <Text style={styles.createListText}>
                    Create Your First List
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={lists}
                renderItem={renderListItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listsContainer}
              />
            )}
          </View>

          {/* Active List Section */}
          {activeList && (
            <View style={styles.activeListSection}>
              <View style={styles.activeListHeader}>
                <Text style={styles.activeListTitle}>{activeList.name}</Text>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={() => setNewItemModalVisible(true)}
                >
                  <Feather name="plus" size={18} color="white" />
                  <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {activeList.items.length === 0 ? (
                <View style={styles.emptyItemsContainer}>
                  <MaterialCommunityIcons
                    name="basket-outline"
                    size={48}
                    color="#888"
                  />
                  <Text style={styles.emptyItemsText}>
                    No items in this list yet
                  </Text>
                  <TouchableOpacity
                    style={styles.addFirstItemButton}
                    onPress={() => setNewItemModalVisible(true)}
                  >
                    <Text style={styles.addFirstItemText}>
                      Add Your First Item
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={activeList.items}
                  renderItem={renderShoppingItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.itemsContainer}
                />
              )}
            </View>
          )}
        </View>
      )}

      {/* New List Modal */}
      <Modal
        visible={newListModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNewListModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create New Shopping List</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="List Name"
                  value={newListName}
                  onChangeText={setNewListName}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setNewListName("");
                      setNewListModalVisible(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.createButton]}
                    onPress={createNewList}
                  >
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* New Item Modal */}
      <Modal
        visible={newItemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={resetItemForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingItem ? "Edit Item" : "Add Item to List"}
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Item Name"
                  value={newItemName}
                  onChangeText={setNewItemName}
                  autoFocus
                />
                <View style={styles.quantityContainer}>
                  <Text style={styles.quantityLabel}>Quantity:</Text>
                  <TextInput
                    style={styles.quantityInput}
                    keyboardType="numeric"
                    value={newItemQuantity}
                    onChangeText={setNewItemQuantity}
                  />
                </View>
                <TextInput
                  style={[styles.modalInput, styles.noteInput]}
                  placeholder="Note (optional)"
                  value={newItemNote}
                  onChangeText={setNewItemNote}
                  multiline
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={resetItemForm}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.createButton]}
                    onPress={saveItem}
                  >
                    <Text style={styles.createButtonText}>
                      {editingItem ? "Save" : "Add"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    marginBottom: 16,
  },
  createListButton: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createListText: {
    color: "white",
    fontWeight: "500",
  },
  listsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  listsContainer: {
    paddingBottom: 8,
  },
  listItem: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 200,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activeListItem: {
    borderWidth: 2,
    borderColor: COLOR_CONST.light_green,
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  listItemCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLOR_CONST.light_green,
  },
  progressBarComplete: {
    backgroundColor: "#4caf50",
  },
  deleteListButton: {
    padding: 4,
  },
  activeListSection: {
    flex: 1,
  },
  activeListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activeListTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  addItemText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 4,
  },
  emptyItemsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyItemsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    marginBottom: 16,
  },
  addFirstItemButton: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addFirstItemText: {
    color: "white",
    fontWeight: "500",
  },
  itemsContainer: {
    paddingBottom: 20,
  },
  shoppingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  purchasedItem: {
    backgroundColor: "#f0f0f0",
    opacity: 0.8,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLOR_CONST.light_green,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLOR_CONST.light_green,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  itemNote: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  purchasedText: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 12,
  },
  itemActions: {
    flexDirection: "row",
  },
  scanButton: {
    padding: 6,
    marginRight: 4,
  },
  editButton: {
    padding: 6,
    marginRight: 4,
  },
  deleteItemButton: {
    padding: 6,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  noteInput: {
    height: 80,
    textAlignVertical: "top",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  quantityLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  createButton: {
    backgroundColor: COLOR_CONST.light_green,
  },
  createButtonText: {
    color: "white",
    fontWeight: "500",
  },
  // Camera styles
  cameraContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: COLOR_CONST.light_green,
    borderRadius: 15,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -125 }, { translateY: -125 }],
  },
  closeButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  scanInstructions: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scanInstructionsText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});
