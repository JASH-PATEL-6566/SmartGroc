"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLOR_CONST } from "@/constants/color";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

type Notification = {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  type: "expiry" | "system" | "promotion" | "other";
  data?: any;
};

export default function NotificationHistory() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const storedNotifications = await AsyncStorage.getItem(
        "@notifications_history"
      );

      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
      } else {
        // If no notifications exist yet, create sample data for demonstration
        const sampleNotifications: Notification[] = [
          {
            id: "1",
            title: "Products Expiring Soon",
            body: "3 products will expire in 10 days",
            timestamp: Date.now() - 86400000, // 1 day ago
            read: true,
            type: "expiry",
          },
          {
            id: "2",
            title: "Milk Expiring Soon",
            body: "Your milk will expire tomorrow",
            timestamp: Date.now() - 172800000, // 2 days ago
            read: false,
            type: "expiry",
          },
          {
            id: "3",
            title: "Welcome to SmartGroc",
            body: "Thank you for using SmartGroc! Start scanning your products to track them.",
            timestamp: Date.now() - 604800000, // 7 days ago
            read: true,
            type: "system",
          },
          {
            id: "4",
            title: "Allergen Alert",
            body: "A scanned product contains allergens you've listed in your profile",
            timestamp: Date.now() - 259200000, // 3 days ago
            read: false,
            type: "other",
          },
        ];

        setNotifications(sampleNotifications);
        await AsyncStorage.setItem(
          "@notifications_history",
          JSON.stringify(sampleNotifications)
        );
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const updatedNotifications = notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      );

      setNotifications(updatedNotifications);
      await AsyncStorage.setItem(
        "@notifications_history",
        JSON.stringify(updatedNotifications)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
      await AsyncStorage.removeItem("@notifications_history");
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read when pressed
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "expiry") {
      router.push("/(main)/expiringProducts");
    }
    // Add other navigation options based on notification types
  };

  const formatTimestamp = (timestamp: number) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);

    // If it's today
    if (notificationDate.toDateString() === now.toDateString()) {
      return `Today, ${notificationDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // If it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (notificationDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${notificationDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    // Otherwise show the date
    return notificationDate.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expiry":
        return (
          <MaterialCommunityIcons
            name="calendar-clock"
            size={24}
            color="#ff9800"
          />
        );
      case "system":
        return (
          <MaterialCommunityIcons
            name="information"
            size={24}
            color="#2196f3"
          />
        );
      case "promotion":
        return <MaterialCommunityIcons name="tag" size={24} color="#4caf50" />;
      default:
        return <MaterialCommunityIcons name="bell" size={24} color="#757575" />;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        {getNotificationIcon(item.type)}
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
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
        <Text style={styles.title}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllNotifications}
          >
            <Feather name="trash-2" size={20} color="#ff4d4f" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLOR_CONST.light_green} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="bell-off-outline"
            size={64}
            color="#888"
          />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            When you receive notifications, they will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications();
              }}
              colors={[COLOR_CONST.light_green]}
            />
          }
        />
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    marginLeft: 8,
  },
  clearButton: {
    padding: 8,
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
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    position: "relative",
  },
  unreadNotification: {
    backgroundColor: "#f0f9ff",
    borderColor: "#e1f5fe",
  },
  notificationIcon: {
    marginRight: 16,
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#888",
  },
  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLOR_CONST.light_green,
  },
});
