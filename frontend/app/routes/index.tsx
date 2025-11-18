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

const CAMO_DARK = "#2d3a1f";
const CAMO_BROWN = "#4a3f2e";
const ORANGE_ACCENT = "#ff6b1a";
const ORANGE_TEXT = "#ff8c42";

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
            <ActivityIndicator color={ORANGE_ACCENT} />
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
            <ActivityIndicator color={ORANGE_ACCENT} />
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
    backgroundColor: CAMO_DARK,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  heading: {
    color: ORANGE_ACCENT,
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
    color: ORANGE_ACCENT,
    fontSize: 14,
    fontWeight: "600",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  infoText: {
    color: "#8a9077",
    fontSize: 14,
    textAlign: "center",
  },
  errorText: {
    color: ORANGE_TEXT,
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
    borderBottomColor: CAMO_BROWN,
  },
  activeRow: {
    borderColor: ORANGE_ACCENT,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "rgba(255, 107, 26, 0.1)",
  },
  name: {
    color: ORANGE_TEXT,
    fontSize: 16,
    fontWeight: "500",
  },
  coords: {
    color: "#8a9077",
    fontSize: 12,
    marginTop: 2,
  },
  activeLabel: {
    color: ORANGE_ACCENT,
    fontSize: 12,
    marginLeft: 8,
  },
});
