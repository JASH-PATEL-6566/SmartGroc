import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import Button from "@/components/Button";
import { COLOR_CONST } from "@/constants/color";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    image: require("../assets/images/welcome/track.png"),
    title: "Track Your Groceries",
    description: "Never forget an item again with smart tracking.",
  },
  {
    id: "2",
    image: require("../assets/images/welcome/receipe.png"),
    title: "Discover Recipes",
    description: "Find delicious meals based on what you have.",
  },
  {
    id: "3",
    image: require("../assets/images/welcome/check.png"),
    title: "Smart Food Scanner",
    description:
      "Scan barcodes to check ingredients, allergens, and nutritional values instantly.",
  },
];

export default function Welcome() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/(main)/(tabs)/home");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <LinearGradient colors={["#f0fff0", "#ffffff"]} style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
        contentContainerStyle={styles.carouselContainer}
      />

      {currentIndex !== slides.length - 1 && (
        <View style={styles.paginationContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : null,
              ]}
            />
          ))}
        </View>
      )}

      {currentIndex === slides.length - 1 && (
        <View style={styles.buttonContainer}>
          <Button
            color={COLOR_CONST.light_green}
            onPress={() => router.push("/(auth)/signup")}
            text="Get Started"
            textColor="#fff"
            marginBottom={15}
          />
          <Button
            color="#dcdcdc"
            onPress={() => router.push("/(auth)/login")}
            text="Log In"
            textColor="#000"
          />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  slide: {
    width,
    height,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: "cover",
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "gray",
    marginBottom: 30,
  },
  paginationContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#dcdcdc",
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: COLOR_CONST.light_green,
  },
  buttonContainer: {
    width: "100%",
    position: "absolute",
    bottom: 50,
    alignItems: "center",
    paddingHorizontal: 20,
  },
});
