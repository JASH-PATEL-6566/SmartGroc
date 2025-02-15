import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { signUpWithEmailPassword } from "../../utils/auth";
import Input from "@/components/Input";
import PasswordInput from "@/components/PasswordInput";
import Button from "@/components/Button";

const { width, height } = Dimensions.get("window");

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) return;
    setLoading(true);
    await signUpWithEmailPassword(username, email, password);
    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ImageBackground
            source={require("../../assets/images/login/login_bg.png")}
            style={styles.background}
          >
            <View style={styles.formContainer}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Start your smart shopping journey
              </Text>

              <Input
                lable="Username"
                placeholder="Joe"
                setValue={setUsername}
                value={username}
                autoCapitalize="none"
              />

              <Input
                lable="Email"
                placeholder="joe@joe.com"
                keyboardType="email-address"
                setValue={setEmail}
                value={email}
                autoCapitalize="none"
              />

              <PasswordInput
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
              />

              <Button
                color="#28a745"
                loading={loading}
                onPress={handleSignup}
                loadingText="Signing up..."
                text="Sign Up"
                textColor="#fff"
                marginTop={20}
              />

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  Do you already have an account?
                  <Text
                    style={styles.switchLink}
                    onPress={() => router.push("/(auth)/login")}
                  >
                    {" "}
                    Login
                  </Text>
                </Text>
              </View>
            </View>
          </ImageBackground>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  background: {
    width: "100%",
    height: height,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "gray",
    marginBottom: 20,
  },
  switchContainer: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  switchLink: {
    color: "#007bff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
