import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
};

// Calculate days until expiry
const getDaysUntilExpiry = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  try {
    const expiryDate = new Date(dateString);
    const today = new Date();

    // Reset time part for accurate day calculation
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    console.error("Error calculating days until expiry:", error);
    return null;
  }
};

// Check for products nearing expiry and schedule notifications
export const checkAndScheduleExpiryNotifications = async (uid: string) => {
  try {
    // Check if notifications are enabled in user preferences
    const userPrefs = await AsyncStorage.getItem("@user_preferences");
    const preferences = userPrefs
      ? JSON.parse(userPrefs)
      : { expireAlerts: true };

    if (!preferences.expireAlerts) {
      console.log("Expiry notifications are disabled in user preferences");
      return;
    }

    // Get permission status
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      console.log("Notification permissions not granted");
      return;
    }

    // Cancel any existing expiry notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Products that are exactly 10 days from expiry
    const productsToNotify: { name: string; expiryDate: string }[] = [];

    // 1. Check scanned products from AsyncStorage
    const savedProducts = await AsyncStorage.getItem("@scanned_products");
    if (savedProducts) {
      const parsedProducts = JSON.parse(savedProducts);
      parsedProducts.forEach((product: any) => {
        if (product.expiryDate) {
          const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);
          if (daysUntilExpiry === 10) {
            productsToNotify.push({
              name: product.name,
              expiryDate: product.expiryDate,
            });
          }
        }
      });
    }

    // 2. Check purchased products from Firestore
    if (uid) {
      const purchasesRef = collection(db, "users", uid, "purchase");
      const purchasesSnapshot = await getDocs(purchasesRef);

      for (const purchaseDoc of purchasesSnapshot.docs) {
        const purchaseId = purchaseDoc.id;
        const productsRef = collection(
          db,
          "users",
          uid,
          "purchase",
          purchaseId,
          "products"
        );
        const productsSnapshot = await getDocs(productsRef);

        productsSnapshot.docs.forEach((productDoc) => {
          const productData = productDoc.data();
          if (productData.expiryDate) {
            const daysUntilExpiry = getDaysUntilExpiry(productData.expiryDate);
            if (daysUntilExpiry === 10) {
              productsToNotify.push({
                name: productData.name || "Unknown Product",
                expiryDate: productData.expiryDate,
              });
            }
          }
        });
      }
    }

    // Schedule notifications for products that are 10 days from expiry
    if (productsToNotify.length > 0) {
      if (productsToNotify.length === 1) {
        // Single product notification
        const product = productsToNotify[0];
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Product Expiring Soon",
            body: `${product.name} will expire in 10 days (${new Date(
              product.expiryDate
            ).toLocaleDateString()})`,
            data: { type: "expiry", productName: product.name },
          },
          trigger: null, // Send immediately
        });
      } else {
        // Multiple products notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Products Expiring Soon",
            body: `${productsToNotify.length} products will expire in 10 days`,
            data: { type: "expiry", count: productsToNotify.length },
          },
          trigger: null, // Send immediately
        });
      }

      console.log(
        `Scheduled notifications for ${productsToNotify.length} products`
      );
    }
  } catch (error) {
    console.error("Error checking for expiring products:", error);
  }
};

// Function to handle notification response
export const handleNotificationResponse = (
  response: Notifications.NotificationResponse
) => {
  const data = response.notification.request.content.data;

  if (data?.type === "expiry") {
    // Navigate to expiring products screen
    // This would need to be implemented in your navigation system
    console.log("User tapped on expiry notification");
    // Example: router.push('/(main)/expiringProducts');
  }
};
