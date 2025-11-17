import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import api from "../../src/api/client";
import { useRouteStore } from "../../src/store/useRouteStore";

interface Waypoint {
  id: string;
  name: string;
  description?: string | null;
  lat: number;
  lon: number;
  created_at: string;
}

interface RouteItem {
  id: string;
  name: string;
  description?: string | null;
  waypoint_ids: string[];
  created_at: string;
}

function formatLatLon(lat: number, lon: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}  ${Math.abs(lon).toFixed(4)}°${ew}`;
}

export default function RoutesScreen() {
  const router = useRouter();
  const { activeRoute, setActiveRoute } = useRouteStore();

  const {
    data: waypointsData,
    isLoading: loadingWpts,
    isError: errorWpts,
    refetch: refetchWpts,
  } = useQuery<Waypoint[], Error>({
    queryKey: ["waypoints"],
    queryFn: async () => {
      const res = await api.get<Waypoint[]>("/api/waypoints");
      return res.data;
    },
  });

  const {
    data: routesData,
    isLoading: loadingRoutes,
    isError: errorRoutes,
    refetch: refetchRoutes,
  } = useQuery<RouteItem[], Error>({
    queryKey: ["routes"],
    queryFn: async () => {
      const res = await api.get<RouteItem[]>("/api/routes");
      return res.data;
    },
  });

  const waypoints = waypointsData ?? [];
  const routes = routesData ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>WAYPOINTS</Text>

        {loadingWpts && (
          <View style={styles.center}>
            <ActivityIndicator color="#22d3ee" />
            <Text style={styles.infoText}>Loading waypoints…</Text>
          </View>
        )}

        {errorWpts && !loadingWpts && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load waypoints.</Text>
            <TouchableOpacity onPress={() => refetchWpts()}>
              <Text style={[styles.infoText, { marginTop: 4 }]}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loadingWpts && !errorWpts && waypoints.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.infoText}>No waypoints yet.</Text>
            <Text style={styles.infoText}>Add one from the Chart screen.</Text>
          </View>
        )}

        {!loadingWpts && !errorWpts && waypoints.length > 0 && (
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

        <View style={styles.routesHeaderRow}>
          <Text style={styles.heading}>ROUTES</Text>
          <TouchableOpacity onPress={() => router.push("/routes/new")}>
            <Text style={styles.linkText}>New route</Text>
          </TouchableOpacity>
        </View>

        {loadingRoutes && (
          <View style={styles.center}>
            <ActivityIndicator color="#22d3ee" />
            <Text style={styles.infoText}>Loading routes…</Text>
          </View>
        )}

        {errorRoutes && !loadingRoutes && (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load routes.</Text>
            <TouchableOpacity onPress={() => refetchRoutes()}>
              <Text style={[styles.infoText, { marginTop: 4 }]}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loadingRoutes && !errorRoutes && routes.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.infoText}>No routes yet.</Text>
            <Text style={styles.infoText}>Create one with the New route button.</Text>
          </View>
        )}

        {!loadingRoutes && !errorRoutes && routes.length > 0 && (
          <FlashList
            data={routes}
            keyExtractor={(item) => item.id}
            estimatedItemSize={64}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isActive = activeRoute?.id === item.id;
              return (
                <TouchableOpacity
                  style={[styles.row, isActive && styles.activeRow]}
                  onPress={() => setActiveRoute({ id: item.id, name: item.name })}
                  onLongPress={() => router.push(`/routes/${item.id}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.coords}>{item.waypoint_ids.length} waypoints</Text>
                  </View>
                  {isActive && <Text style={styles.activeLabel}>Active</Text>}
                </TouchableOpacity>
              );
            }}
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
  routesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    color: "#22d3ee",
    fontSize: 14,
    fontWeight: "600",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
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
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#111827",
  },
  activeRow: {
    borderColor: "#22d3ee",
    borderWidth: 1,
    borderRadius: 8,
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
  activeLabel: {
    color: "#22d3ee",
    fontSize: 12,
    marginLeft: 8,
  },
});
