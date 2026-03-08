import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import CustomNavBar from '../../components/CustomNavBar';
import { useAuth } from '../../context/AuthContext';
import { getUserReceipts } from '../../services/receiptService';

// @ts-ignore: Metro resolves .native or .web automatically at runtime
import MapComponent from '../../components/MapComponent';

export default function MapScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchReceipts = async () => {
        if (!user) {
          if (isActive) {
            setTransactions([]);
            setLoading(false);
          }
          return;
        }

        try {
          if (isActive) setLoading(true);
          const receipts = await getUserReceipts(user.uid);

          if (isActive) {
            const mappedTransactions = receipts.map((r) => {
              const data = r.receiptData || {};
              const latitude = Number((data.location as any)?.latitude);
              const longitude = Number((data.location as any)?.longitude);

              if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                return null;
              }

              return {
                id: r.id,
                latitude,
                longitude,
                title: data.merchant?.name || 'Unknown Merchant',
                description: `$${data.totals?.gross?.toFixed(2) || '0.00'} - ${data.date || 'Unknown Date'}`,
              };
            }).filter(Boolean) as any[];
            setTransactions(mappedTransactions);
          }
        } catch (error) {
          console.error('Failed to fetch map receipts', error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchReceipts();

      return () => {
        isActive = false;
      };
    }, [user])
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>GEOSPATIAL</Text>
          <Text style={styles.heroTitle}>SpendMap</Text>
        </View>

        <View style={styles.mapFrame}>
          {loading ? (
            <View style={[styles.mapFrame, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#e8a44a" />
            </View>
          ) : (
            <MapComponent transactions={transactions} />
          )}
        </View>
      </View>
      <CustomNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 20,
    backgroundColor: '#0d1117',
    zIndex: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#e8a44a',
    opacity: 0.8,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#f0ece3',
    lineHeight: 40,
  },
  mapFrame: {
  flex: 1,
  marginBottom: 90,
},
});
