import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View, Image, TouchableOpacity, Modal } from 'react-native';
import CustomNavBar from '../../components/CustomNavBar';
import { useAuth } from '../../context/AuthContext';
import { getUserReceipts } from '../../services/receiptService';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return transactions;

    return transactions.filter((tx) => {
      const merchant = String(tx.merchant || '').toLowerCase();
      const category = String(tx.category || '').toLowerCase();
      const amount = Number(tx.amount || 0).toFixed(2);
      const date = String(tx.date || '').toLowerCase();

      return (
        merchant.includes(q) ||
        category.includes(q) ||
        amount.includes(q) ||
        date.includes(q)
      );
    });
  }, [transactions, searchQuery]);

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
          setLoading(true);
          const receipts = await getUserReceipts(user.uid);
          if (isActive) {
            const formattedTransactions = receipts.map(r => {
              const data = r.receiptData || {};
              return {
                id: r.id,
                merchant: data.merchant?.name || 'Unknown',
                date: data.date || 'Unknown Date',
                amount: data.totals?.gross || 0,
                category: data.merchant?.category || 'Misc',
                imageUrl: data.imageUrl || null
              };
            });
            setTransactions(formattedTransactions);
          }
        } catch (error) {
          console.error('Failed to fetch receipts', error);
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
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
        <Text style={styles.sectionLabel}>PAPER TRAIL</Text>
        <Text style={styles.heroTitle}>Digital Ledger</Text>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by merchant, category, amount, or date..."
            placeholderTextColor="rgba(240,236,227,0.4)"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.listContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#e8a44a" style={{ marginTop: 40 }} />
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <View key={tx.id} style={styles.transactionCard}>
                <View style={styles.leftCol}>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => { if (tx.imageUrl) setSelectedImage(tx.imageUrl) }}>
                    {tx.imageUrl ? (
                      <Image source={{ uri: tx.imageUrl }} style={styles.iconBox} />
                    ) : (
                      <View style={styles.iconBox}>
                        <Text style={{ fontSize: 20 }}>💸</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View>
                    <Text style={styles.merchantText}>{tx.merchant}</Text>
                    <Text style={styles.dateText}>{tx.date}</Text>
                  </View>
                </View>
                <View style={styles.rightCol}>
                  <Text style={styles.amountText}>${tx.amount.toFixed(2)}</Text>
                  <Text style={styles.categoryText}>{tx.category}</Text>
                </View>
              </View>
            ))
          ) : transactions.length > 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔎</Text>
              <Text style={styles.emptyTitle}>No matching transactions</Text>
              <Text style={styles.emptyDesc}>Try a different merchant, category, amount, or date.</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptyDesc}>Snap a receipt on the home tab to start logging.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.closeBtn} activeOpacity={0.8} onPress={() => setSelectedImage(null)}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Close</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      <CustomNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  content: {
    padding: 24,
    paddingTop: 64,
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
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchPlaceholder: {
    color: 'rgba(240,236,227,0.4)',
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#f0ece3',
    fontSize: 14,
    paddingVertical: 0,
  },
  listContainer: {
    gap: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(232,164,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  merchantText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0ece3',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(240,236,227,0.5)',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e8a44a',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: 'rgba(240,236,227,0.5)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  }
});
