import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ScrollView,
} from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import TopHeader from "@/components/home/topHeader";
import WhiteBackView from "@/components/home/WhiteBackView";
import SafeAreaViewBackground from "@/components/SafeAreaViewBackground";

const Home = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <SafeAreaViewBackground>
      <StatusBar hidden={false} />
      {/* <TopHeader user={user} /> */}
      <ScrollView style={styles.container}>
        <TopHeader user={user} />
        <WhiteBackView heading="Expiring Soon" next="next/page" />
        <WhiteBackView heading="Recipe Suggestions" next="next/page" />
        <WhiteBackView heading="abc" next="next/page" marginBottom={20} />
      </ScrollView>
    </SafeAreaViewBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
    // marginBottom: 20,
  },
});

export default Home;
