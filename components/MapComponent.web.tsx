import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

    const lat = transactions[0]?.latitude || 43.6532;
    const lng = transactions[0]?.longitude || -79.3832;

    return (
        <View style={styles.mapContainer}>
            {/* Using a standard iframe to bypass all library issues on web preview */}
            <iframe
                width="100%"
                height="100%"
                style={{ border: 0, backgroundColor: '#0d1117' }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${lat},${lng}&z=12&output=embed`}
            ></iframe>

            <View style={styles.overlay}>
                <Text style={styles.overlayText}>WEB PREVIEW: {transactions.length} LOGS</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: { flex: 1, position: 'relative' },
    overlay: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(232, 164, 74, 0.1)',
        padding: 8,
        borderWidth: 1,
        borderColor: '#e8a44a',
    },
    overlayText: { color: '#e8a44a', fontSize: 10, fontWeight: '800' },
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
    emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.8 },
    emptyTitle: { color: '#f0ece3', fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyDesc: { color: 'rgba(240,236,227,0.5)', fontSize: 14, textAlign: 'center', maxWidth: 240 }
});