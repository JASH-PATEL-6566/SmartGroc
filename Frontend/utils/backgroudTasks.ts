import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { checkAndScheduleExpiryNotifications } from "./notifications";

// Define the task name
const BACKGROUND_EXPIRY_CHECK = "background-expiry-check";

// Register the task
TaskManager.defineTask(BACKGROUND_EXPIRY_CHECK, async () => {
  try {
    // Get the user ID from AsyncStorage
    const userData = await AsyncStorage.getItem("@user_data");
    if (!userData) {
      console.log("No user data found for background task");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const { uid } = JSON.parse(userData);
    if (!uid) {
      console.log("No user ID found for background task");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Check for expiring products and schedule notifications
    await checkAndScheduleExpiryNotifications(uid);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Error in background task:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the background fetch task
export const registerBackgroundExpiryCheck = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_EXPIRY_CHECK, {
      minimumInterval: 60 * 60 * 24, // Once per day (in seconds)
      stopOnTerminate: false, // Continue running when app is terminated
      startOnBoot: true, // Run task when device reboots
    });
    console.log("Background expiry check registered");
  } catch (error) {
    console.error("Error registering background task:", error);
  }
};

// Unregister the background fetch task
export const unregisterBackgroundExpiryCheck = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_EXPIRY_CHECK);
    console.log("Background expiry check unregistered");
  } catch (error) {
    console.error("Error unregistering background task:", error);
  }
};
