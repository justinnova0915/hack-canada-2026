import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapComponent({ transactions = [] }: { transactions: any[] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🌍</Text>
        <Text style={styles.emptyTitle}>No locations yet</Text>
        <Text style={styles.emptyDesc}>
          Scan receipts to see your spending map.
        </Text>
      </View>
    );
  }

  // Calculate generic region or use first tx
  const defaultLat = transactions[0]?.latitude || 43.6532;
  const defaultLng = transactions[0]?.longitude || -79.3832;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: defaultLat,
        longitude: defaultLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      userInterfaceStyle="dark"
    >
      {transactions.map((tx) => (
        <Marker
          key={tx.id}
          coordinate={{ latitude: tx.latitude, longitude: tx.longitude }}
          title={tx.title}
          description={tx.description}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: '100%' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    margin: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    color: '#f0ece3',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  }
});