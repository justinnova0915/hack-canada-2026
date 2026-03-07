import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ReceiptItem = {
    name?: string;
    amount?: number;
};

export default function MoreScreen(): React.ReactElement {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { items } = useLocalSearchParams<{ items?: string }>();

    const parsedItems = useMemo<ReceiptItem[]>(() => {
        if (!items || Array.isArray(items)) return [];

        try {
            const parsed = JSON.parse(items);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch {
            return [];
        }
    }, [items]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                    <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>All Receipt Items</Text>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
                {parsedItems.length > 0 ? (
                    parsedItems.map((item, index) => (
                        <View key={`${item.name || 'item'}-${index}`} style={styles.itemRow}>
                            <Text numberOfLines={1} style={styles.itemName}>
                                {item.name || `Item ${index + 1}`}
                            </Text>
                            <Text style={styles.itemAmount}>${Number(item.amount || 0).toFixed(2)}</Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No items to display</Text>
                        <Text style={styles.emptyDesc}>Return to the receipt screen and analyze again.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d1117',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    backBtn: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    backBtnText: {
        color: '#e8a44a',
        fontSize: 13,
        fontWeight: '600',
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#f0ece3',
    },
    content: {
        padding: 20,
        gap: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    itemName: {
        flex: 1,
        marginRight: 10,
        color: '#f0ece3',
        fontSize: 14,
        fontWeight: '500',
    },
    itemAmount: {
        color: '#e8a44a',
        fontSize: 15,
        fontWeight: '700',
    },
    emptyState: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        color: '#f0ece3',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptyDesc: {
        color: 'rgba(240,236,227,0.55)',
        fontSize: 13,
    },
});
