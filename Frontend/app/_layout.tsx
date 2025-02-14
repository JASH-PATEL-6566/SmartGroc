import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import { useEffect, useState } from "react";
import SmartGrocSplash from "./SmartGrocSplash";
import { useAuth } from "../hooks/useAuth";

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
    setTimeout(() => {
      setIsSplashVisible(false);
    }, 4000);
  }, []);

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
