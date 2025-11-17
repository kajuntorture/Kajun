import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../src/api/client";

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

interface Route {
  id: string;
  name: string;
  description?: string | null;
  waypoint_ids: string[];
}

export default function NewRouteScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<Waypoint[], Error>({
    queryKey: ["waypoints"],
    queryFn: async () => {
      const res = await api.get<Waypoint[]>("/api/waypoints");
      return res.data;
    },
  });

  const waypoints = data ?? [];

  const canSave = useMemo(
    () => name.trim().length > 0 && selected.length >= 2 && !saving,
    [name, selected.length, saving]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await api.post<Route>("/api/routes", {
        name: name.trim(),
        description: description.trim() || undefined,
        waypoint_ids: selected,
      });
      await queryClient.invalidateQueries({ queryKey: ["routes"] });
      Alert.alert("Route created", res.data.name);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Failed to create route", e);
      Alert.alert("Error", "Could not create route.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>NEW ROUTE</Text>

          <Text style={styles.label}>Route name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Harbor to Bay"
            placeholderTextColor="#6b7280"
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Day sail route"
            placeholderTextColor="#6b7280"
            multiline
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Select waypoints (tap to toggle)</Text>

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
              <Text style={styles.infoText}>No waypoints.</Text>
              <Text style={styles.infoText}>Add some from the Chart screen first.</Text>
            </View>
          )}

          {!isLoading && !isError && waypoints.length > 0 && (
            <FlashList
              data={waypoints}
              keyExtractor={(item) => item.id}
              estimatedItemSize={56}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => toggleSelect(item.id)}
                  >
                    <Text style={styles.rowText}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity
            style={[styles.saveButton, !canSave && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={!canSave}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Creating route…" : "Create route"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heading: {
    color: "#22d3ee",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  label: {
    color: "#e5e7eb",
    fontSize: 13,
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#e5e7eb",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
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
    paddingBottom: 12,
    marginTop: 8,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#111827",
    marginBottom: 8,
  },
  rowSelected: {
    borderColor: "#22d3ee",
    backgroundColor: "#0b1120",
  },
  rowText: {
    color: "#e5e7eb",
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: "#22d3ee",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  saveButtonText: {
    color: "#020617",
    fontWeight: "600",
  },
});
