import React from "react";
import { Tabs, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#ff6b1a",
            tabBarInactiveTintColor: "#8a9077",
            tabBarStyle: {
              backgroundColor: "#1a2412",
              borderTopColor: "#4a3f2e",
            },
          }}
        >
          <Tabs.Screen
            name="chart/index"
            options={{
              title: "Chart",
            }}
          />
          <Tabs.Screen
            name="tides/index"
            options={{
              title: "Tides",
            }}
          />
          <Tabs.Screen
            name="routes/index"
            options={{
              title: "Routes",
            }}
          />
          <Tabs.Screen
            name="trips/index"
            options={{
              title: "Trips",
            }}
          />
        </Tabs>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
