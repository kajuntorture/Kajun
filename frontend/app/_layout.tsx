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
            tabBarActiveTintColor: "#00d8ff",
            tabBarInactiveTintColor: "#9ca3af",
            tabBarStyle: {
              backgroundColor: "#020617",
              borderTopColor: "#1f2933",
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
