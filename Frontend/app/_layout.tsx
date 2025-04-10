"use client";

import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { useEffect, useState } from "react";
import SmartGrocSplash from "./SmartGrocSplash";
import { useAuth } from "../hooks/useAuth";
import * as Notifications from "expo-notifications";
import {
  requestNotificationPermissions,
  checkAndScheduleExpiryNotifications,
  handleNotificationResponse,
} from "../utils/notifications";
import { registerBackgroundExpiryCheck } from "../utils/backgroudTasks";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootNavigation />
    </Provider>
  );
}

function RootNavigation() {
  const user = useAuth();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    // Handle splash screen timing
    setTimeout(() => {
      setIsSplashVisible(false);
    }, 4000);

    // Initialize notifications and background tasks
    const initApp = async () => {
      // Request permissions
      await requestNotificationPermissions();

      // Set up notification response handler
      const subscription =
        Notifications.addNotificationResponseReceivedListener(
          handleNotificationResponse
        );

      // Set up notification received handler to store in history
      const receivedSubscription =
        Notifications.addNotificationReceivedListener((notification) => {
          // Store notification in history
          storeNotificationInHistory({
            id: notification.request.identifier,
            title: notification.request.content.title || "Notification",
            body: notification.request.content.body || "",
            timestamp: Date.now(),
            read: false,
            type: notification.request.content.data?.type || "other",
            data: notification.request.content.data,
          });
        });

      // Check for expiring products if user is logged in
      if (user?.uid) {
        // Save user data for background tasks
        await AsyncStorage.setItem(
          "@user_data",
          JSON.stringify({ uid: user.uid })
        );

        // Check for expiring products
        await checkAndScheduleExpiryNotifications(user.uid);

        // Register background task
        await registerBackgroundExpiryCheck();
      }

      return () => {
        subscription.remove();
        receivedSubscription.remove();
      };
    };

    initApp();
  }, [user]);

  // Function to store notifications in history
  const storeNotificationInHistory = async (notification: any) => {
    try {
      const storedNotifications = await AsyncStorage.getItem(
        "@notifications_history"
      );
      let notifications = storedNotifications
        ? JSON.parse(storedNotifications)
        : [];

      // Add new notification to the beginning of the array
      notifications = [notification, ...notifications];

      // Store back in AsyncStorage
      await AsyncStorage.setItem(
        "@notifications_history",
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error("Error storing notification in history:", error);
    }
  };

  if (isSplashVisible) {
    return <SmartGrocSplash />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
        </>
      ) : (
        <Stack.Screen name="(main)" />
      )}
    </Stack>
  );
}
//
