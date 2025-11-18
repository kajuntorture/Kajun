import React, { useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import api from "../../src/api/client";
import { useRouteStore } from "../../src/store/useRouteStore";
import { computeRouteStats, LatLon } from "../../src/utils/geo";

interface RouteItem {
  id: string;
  name: string;
  description?: string | null;
  waypoint_ids: string[];
  created_at: string;
}

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export default function RouteDetailScreen() {
  const { routeId } = useLocalSearchParams<{ routeId: string }>();
  const { activeRoute, setActiveRoute } = useRouteStore();
  const router = useRouter();

  const {
    data: route,
    isLoading: loadingRoute,
    isError: errorRoute,
  } = useQuery<RouteItem, Error>({
    queryKey: ["route", routeId],
    enabled: !!routeId,
    queryFn: async () => {
      const res = await api.get<RouteItem>(`/api/routes/${routeId}`);
      return res.data;
    },
  });

  const {
    data: waypointsData,
    isLoading: loadingWpts,
    isError: errorWpts,
  } = useQuery<Waypoint[], Error>({
    queryKey: ["waypoints"],
    queryFn: async () => {
      const res = await api.get<Waypoint[]>("/api/waypoints");
      return res.data;
    },
  });

  const stats = useMemo(() => {
    if (!route || !waypointsData) return null;
    const byId = new Map(waypointsData.map((w) => [w.id, w]));
    const ordered: LatLon[] = [];
    route.waypoint_ids.forEach((id) => {
      const w = byId.get(id);
      if (w) ordered.push({ lat: w.lat, lon: w.lon });
    });
    return computeRouteStats(ordered);
  }, [route, waypointsData]);

  const handleSetActive = () => {
    if (!route) return;
    setActiveRoute({ id: route.id, name: route.name });
    router.back();
  };

  if (loadingRoute || loadingWpts) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color="#ff6b1a" />
          <Text style={styles.infoText}>Loading route…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorRoute || !route) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load route.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const legs = stats?.legs ?? [];
  const totalNm = stats ? stats.totalDistanceNm : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>{route.name}</Text>
        {route.description ? <Text style={styles.desc}>{route.description}</Text> : null}

        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Total distance</Text>
            <Text style={styles.summaryValue}>{totalNm.toFixed(2)} nm</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Legs</Text>
            <Text style={styles.summaryValue}>{legs.length}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.activeButton} onPress={handleSetActive}>
          <Text style={styles.activeButtonText}>
            {activeRoute?.id === route.id ? "Active on chart" : "Set as active on chart"}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.heading, { fontSize: 16, marginTop: 16 }]}>Legs</Text>
        {legs.length === 0 && (
          <Text style={styles.infoText}>Not enough waypoints to compute legs.</Text>
        )}

        {legs.map((leg, idx) => (
          <View key={idx} style={styles.legRow}>
            <Text style={styles.legIndex}>Leg {idx + 1}</Text>
            <Text style={styles.legDistance}>{leg.distanceNm.toFixed(2)} nm</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#2d3a1f",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    color: "#ff6b1a",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  desc: {
    color: "#8a9077",
    fontSize: 14,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    color: "#8a9077",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: "#fecaca",
    fontSize: 14,
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    color: "#8a9077",
    fontSize: 12,
  },
  summaryValue: {
    color: "#ff8c42",
    fontSize: 16,
    fontWeight: "600",
  },
  activeButton: {
    marginTop: 8,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff6b1a",
  },
  activeButtonText: {
    color: "#ff6b1a",
    fontWeight: "600",
  },
  legRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#111827",
  },
  legIndex: {
    color: "#ff8c42",
    fontSize: 14,
  },
  legDistance: {
    color: "#ff8c42",
    fontSize: 14,
    fontWeight: "500",
  },
});
