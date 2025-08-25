import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

type IoniconsName =
  | "close"
  | "contrast-outline"
  | "log-out-outline"
  | "home-outline"
  | "person-outline"
  | "time-outline"
  | "book-outline"
  | "help-circle-outline"
  | "settings-outline"
  | "lock-closed-outline";

interface MenuItem {
  name: string;
  icon: IoniconsName;
  onPress?: () => void;
}

interface DrawerMenuProps {
  onClose: () => void;
  userName: string;
  userPhoto: string | null;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({ onClose, userName, userPhoto }) => {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);
  const router = useRouter();

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      // Remove the access token from AsyncStorage
      await AsyncStorage.removeItem('access_token');
      console.log('Access token removed successfully');
      
      // Navigate to the login screen and clear navigation stack
      router.replace('/auth/login');
      
      // Optionally close the drawer after logout
      onClose();
    } catch (error) {
      console.error('Error during logout:', error);
      // Optionally, show an alert to the user
      alert('Failed to log out. Please try again.');
    }
  };

  const menuItems: MenuItem[] = [
    
    { name: "Reset Password", icon: "lock-closed-outline", onPress: () => router.push("/reset") },
  ];

  const closeIcon: IoniconsName = "close";
  const themeIcon: IoniconsName = "contrast-outline";
  const logoutIcon: IoniconsName = "log-out-outline";

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#1C2526" : "#FFFFFF" },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              userPhoto
                ? { uri: userPhoto }
                : { uri: "" }
            }
            style={styles.avatar}
          />
        </View>
        <Text style={[styles.username, { color: isDarkTheme ? "#FFFFFF" : "#000000" }]}>
          Hello, {userName}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons
            name={closeIcon}
            size={24}
            color={isDarkTheme ? "#FFFFFF" : "#000000"}
          />
        </TouchableOpacity>
      </View>

      {/* Theme Toggle */}
      <View style={styles.themeContainer}>
        <View style={styles.themeLabelContainer}>
          <Ionicons
            name={themeIcon}
            size={24}
            color={isDarkTheme ? "#FFFFFF" : "#000000"}
            style={styles.themeIcon}
          />
          <Text
            style={[styles.themeLabel, { color: isDarkTheme ? "#FFFFFF" : "#000000" }]}
          >
            Theme
          </Text>
        </View>
        <View style={styles.themeSwitchContainer}>
          <Text
            style={[styles.themeText, { color: isDarkTheme ? "#FFFFFF" : "#000000" }]}
          >
            Light
          </Text>
          <Switch
            value={isDarkTheme}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={isDarkTheme ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
          />
          <Text
            style={[styles.themeText, { color: isDarkTheme ? "#FFFFFF" : "#000000" }]}
          >
            Dark
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <Ionicons
              name={item.icon}
              size={24}
              color={isDarkTheme ? "#FFFFFF" : "#000000"}
              style={styles.menuIcon}
            />
            <Text
              style={[styles.menuText, { color: isDarkTheme ? "#FFFFFF" : "#000000" }]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons
          name={logoutIcon}
          size={24}
          color={isDarkTheme ? "#FFFFFF" : "#000000"}
          style={styles.logoutIcon}
        />
        <Text
          style={[styles.logoutText, { color: isDarkTheme ? "#FFFFFF" : "#000000" }]}
        >
          Logout
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginRight: 10,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  themeContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  themeLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  themeIcon: {
    marginRight: 10,
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  themeSwitchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeText: {
    fontSize: 14,
  },
  menuContainer: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    paddingHorizontal: 20,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    paddingHorizontal: 20,
    marginTop: "auto",
  },
  logoutIcon: {
    marginRight: 15,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DrawerMenu;