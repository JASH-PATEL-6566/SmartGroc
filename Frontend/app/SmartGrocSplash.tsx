import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  interpolateColor,
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

const SmartGrocSplash = () => {
  const tScale = useSharedValue(1); // Scale for 'T'
  const textScale = useSharedValue(1); // Scale for the entire text
  const otherTextOpacity = useSharedValue(1); // Opacity for other characters
  const tPositionY = useSharedValue(0); // Move 'T' to the center
  const textPositionX = useSharedValue(0); // Continuous left movement
  const textColorValue = useSharedValue(0);

  useEffect(() => {
    const delayStart = 2000; // **Delay before animation starts**

    // Scale up the entire text slightly
    textScale.value = withDelay(delayStart, withTiming(70, { duration: 2000 }));

    // Fade out other characters except 'T'
    otherTextOpacity.value = withDelay(
      delayStart + 1000, // Delay before fading starts
      withTiming(0, { duration: 1000 }) // Fade effect
    );

    // Move 'T' to the middle of the screen
    tPositionY.value = withDelay(
      delayStart + 1000, // Move after fade starts
      withTiming(height / 2 - 50, { duration: 1000 }) // Adjust Y position
    );

    // **Continuous slow left movement**
    textPositionX.value = withDelay(
      delayStart, // Start moving left after initial delay
      withTiming(-3.6, { duration: 1500 }) // Moves slightly left over time
    );

    // Scale up 'T' to cover the screen
    tScale.value = withDelay(
      delayStart + 1000, // Scale after text moves left
      withTiming(20, { duration: 1000 }) // Scale up animation
    );

    textColorValue.value = withDelay(
      delayStart, // Start after delay
      withTiming(1, { duration: 2000 }) // Color change over 3 seconds
    );
  }, []);

  // Animated style for 'T' scaling and positioning
  const tAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tScale.value }],
    top: tPositionY.value, // Moves 'T' to the middle
    position: "absolute",
  }));

  // Animated style for the entire text scaling and continuously moving left
  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: textScale.value },
      { translateX: textPositionX.value },
    ],
  }));

  // Animated style for fading out other text
  const otherTextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(otherTextOpacity.value, { duration: 1500 }),
  }));

  const textColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      textColorValue.value,
      [0, 1], // Transition phase
      ["#28a745", "#FFFFFF"] // White to Green
    ),
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={textAnimatedStyle}>
        <View style={styles.textContainer}>
          {Array.from("SmartGroc").map((char, i) =>
            char === "T" ? (
              <Animated.View
                key={i}
                style={[styles.charContainer, tAnimatedStyle]}
              >
                <Text style={styles.char}>T</Text>
              </Animated.View>
            ) : (
              <Animated.Text
                key={i}
                style={[styles.char, otherTextStyle, textColorStyle]}
              >
                {char}
              </Animated.Text>
            )
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000", // Dark background for better visibility
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  charContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  char: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#28a745",
    textAlign: "center",
  },
});

export default SmartGrocSplash;
