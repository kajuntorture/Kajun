import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/api/client";

interface Waypoint {
  id: string;
  name: string;
  description?: string | null;
  lat: number;
  lon: number;
  created_at: string;
}

function formatLatLon(lat: number, lon: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}  ${Math.abs(lon).toFixed(4)}°${ew}`;
}

export default function RoutesScreen() {
  const { data, isLoading, isError, refetch } = useQuery<Waypoint[], Error>({
    queryKey: ["waypoints"],
    queryFn: async () => {
      const res = await api.get<Waypoint[]>("/api/waypoints");
      return res.data;
    },
  });

  const waypoints = data ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>WAYPOINTS</Text>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color="#22d3ee" />
            <Text style={styles.infoText}>Loading waypoints…</Text>
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load waypoints.</Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={[styles.infoText, { marginTop: 4 }]}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && !isError && waypoints.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.infoText}>No waypoints yet.</Text>
            <Text style={styles.infoText}>Add one from the Chart screen.</Text>
          </View>
        )}

        {!isLoading && !isError && waypoints.length > 0 && (
          <FlashList
            data={waypoints}
            keyExtractor={(item) => item.id}
            estimatedItemSize={64}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.coords}>{formatLatLon(item.lat, item.lon)}</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    color: "#22d3ee",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 14,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#111827",
  },
  name: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "500",
  },
  coords: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
});
