import { View, Text, SafeAreaView } from "react-native";
import React from "react";
import { COLOR_CONST } from "@/constants/color";

const SafeAreaViewBackground = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLOR_CONST.white_bg }}>
      {children}
    </SafeAreaView>
  );
};

export default SafeAreaViewBackground;
