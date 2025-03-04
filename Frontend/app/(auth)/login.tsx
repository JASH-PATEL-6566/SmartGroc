import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { loginWithEmailPassword } from "../../utils/auth";
import Input from "@/components/Input";
import PasswordInput from "@/components/PasswordInput";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    await loginWithEmailPassword(email, password);
    setLoading(false);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <ImageBackground
            source={require("../../assets/images/login/login_bg.png")}
            style={styles.background}
          >
            <View style={styles.overlay}>
              <View style={styles.formContainer}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

                <Input
                  lable="Email"
                  value={email}
                  setValue={setEmail}
                  placeholder="abc@abc.com"
                  keyboardType="email-address"
                />

                <PasswordInput
                  password={password}
                  setPassword={setPassword}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />

                {/* <Button
                  loading={loading}
                  onPress={handleLogin}
                  loadingText="Logging in..."
                  text="Sign In"
                  textColor="#fff"
                  color="#28a745"
                  marginTop={20}
                />
                 */}
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <Text style={styles.loginText}>
                    {loading ? "Logging in..." : "Sign In"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    Don't have an account?
                    <Text
                      style={styles.switchLink}
                      onPress={() => router.push("/(auth)/signup")}
                    >
                      {" "}
                      Sign Up
                    </Text>
                  </Text>
                </View>
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
    width,
    height,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  overlay: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: "100%",
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

  loginButton: {
    backgroundColor: "#28a745",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
