import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { logReceipt } from '../../services/receiptService';

type ReceiptItem = {
    name?: string;
    amount?: number;
};

export default function EditScreen(): React.ReactElement {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { items, merchant, totals } = useLocalSearchParams<{ items?: string, merchant?: string, totals?: string }>();

    const initialItems = useMemo<ReceiptItem[]>(() => {
        if (!items || Array.isArray(items)) return [];

        try {
            const parsed = JSON.parse(items);
            if (!Array.isArray(parsed)) return [];
            return parsed;
        } catch {
            return [];
        }
    }, [items]);

    const initialMerchant = useMemo(() => {
        if (!merchant || Array.isArray(merchant)) return {};
        try {
            return JSON.parse(merchant);
        } catch {
            return {};
        }
    }, [merchant]);

    const initialTotals = useMemo(() => {
        if (!totals || Array.isArray(totals)) return {};
        try {
            return JSON.parse(totals);
        } catch {
            return {};
        }
    }, [totals]);

    const [editableItems, setEditableItems] = useState<ReceiptItem[]>(initialItems);
    const [saving, setSaving] = useState(false);

    const updateItem = (index: number, field: 'name' | 'amount', value: string) => {
        const updated = [...editableItems];
        if (field === 'amount') {
            const numValue = parseFloat(value);
            updated[index] = { ...updated[index], amount: isNaN(numValue) ? 0 : numValue };
        } else {
            updated[index] = { ...updated[index], name: value };
        }
        setEditableItems(updated);
    };

    const removeItem = (index: number) => {
        setEditableItems(editableItems.filter((_, i) => i !== index));
    };

    const addItem = () => {
        setEditableItems([...editableItems, { name: 'New Item', amount: 0 }]);
    };

    const calculateTotal = () => {
        return editableItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    const handleSave = async () => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to save receipts.');
            return;
        }

        // Filter out invalid items and ensure required fields
        const validItems = editableItems
            .filter(item => item.name && item.name.trim() !== '' && item.amount !== undefined)
            .map(item => ({
                name: item.name!,
                amount: item.amount!,
            }));

        if (validItems.length === 0) {
            Alert.alert('Error', 'Please add at least one valid item with a name and amount.');
            return;
        }

        setSaving(true);
        try {
            const newTotal = calculateTotal();
            const aiResult = {
                items: validItems,
                merchant: initialMerchant,
                totals: {
                    ...initialTotals,
                    subtotal: newTotal,
                    gross: newTotal + (initialTotals.tax || 0) + (initialTotals.tip || 0),
                },
                date: new Date().toLocaleDateString(),
                location: initialTotals.location || {},
                source: initialTotals.source || {},
            };

            await logReceipt(user.uid, aiResult);
            Alert.alert('Saved', 'Receipt has been saved successfully.', [
                {
                    text: 'OK',
                    onPress: () => router.push('/(tabs)/history'),
                },
            ]);
        } catch (e: any) {
            Alert.alert('Error', 'Failed to save receipt: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                    <Feather name="arrow-left" size={18} color="#e8a44a" />
                    <Text style={styles.backBtnText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Edit Receipt</Text>
                <Text style={styles.subtitle}>Review and adjust items before saving</Text>
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}>
                {editableItems.length > 0 ? (
                    <>
                        {editableItems.map((item, index) => (
                            <View key={`item-${index}`} style={styles.itemRow}>
                                <View style={styles.itemInputs}>
                                    <TextInput
                                        style={styles.nameInput}
                                        value={item.name || ''}
                                        onChangeText={(text) => updateItem(index, 'name', text)}
                                        placeholder="Item name"
                                        placeholderTextColor="rgba(240,236,227,0.3)"
                                    />
                                    <View style={styles.amountContainer}>
                                        <Text style={styles.dollarSign}>$</Text>
                                        <TextInput
                                            style={styles.amountInput}
                                            value={item.amount?.toString() || '0'}
                                            onChangeText={(text) => updateItem(index, 'amount', text)}
                                            keyboardType="decimal-pad"
                                            placeholder="0.00"
                                            placeholderTextColor="rgba(232,164,74,0.3)"
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    onPress={() => removeItem(index)}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="trash-2" size={16} color="#ff4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addBtn} onPress={addItem} activeOpacity={0.8}>
                            <Feather name="plus-circle" size={18} color="#e8a44a" />
                            <Text style={styles.addBtnText}>Add Item</Text>
                        </TouchableOpacity>

                        <View style={styles.totalCard}>
                            <Text style={styles.totalLabel}>New Total</Text>
                            <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No items</Text>
                        <Text style={styles.emptyDesc}>Add an item to get started.</Text>
                        <TouchableOpacity style={styles.emptyAddBtn} onPress={addItem} activeOpacity={0.8}>
                            <Feather name="plus" size={20} color="#e8a44a" />
                            <Text style={styles.emptyAddBtnText}>Add First Item</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.saveBar, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    activeOpacity={0.85}
                    disabled={saving || editableItems.length === 0}
                >
                    <Text style={styles.saveBtnText}>
                        {saving ? 'Saving...' : `Save Receipt (${editableItems.length} items)`}
                    </Text>
                </TouchableOpacity>
            </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        marginBottom: 12,
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
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(240,236,227,0.45)',
    },
    content: {
        padding: 20,
        gap: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    itemInputs: {
        flex: 1,
        gap: 8,
    },
    nameInput: {
        color: '#f0ece3',
        fontSize: 14,
        fontWeight: '500',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dollarSign: {
        color: '#e8a44a',
        fontSize: 15,
        fontWeight: '700',
    },
    amountInput: {
        color: '#e8a44a',
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },
    removeBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(255,68,68,0.1)',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(232,164,74,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(232,164,74,0.2)',
        borderStyle: 'dashed',
    },
    addBtnText: {
        color: '#e8a44a',
        fontSize: 14,
        fontWeight: '600',
    },
    totalCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        marginTop: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(232,164,74,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(232,164,74,0.15)',
    },
    totalLabel: {
        color: '#f0ece3',
        fontSize: 16,
        fontWeight: '700',
    },
    totalAmount: {
        color: '#e8a44a',
        fontSize: 24,
        fontWeight: '900',
    },
    emptyState: {
        paddingVertical: 60,
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
        marginBottom: 20,
    },
    emptyAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(232,164,74,0.15)',
    },
    emptyAddBtnText: {
        color: '#e8a44a',
        fontSize: 14,
        fontWeight: '600',
    },
    saveBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: 'rgba(13,17,23,0.95)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    saveBtn: {
        paddingVertical: 16,
        borderRadius: 22,
        backgroundColor: '#e8a44a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnDisabled: {
        backgroundColor: 'rgba(232,164,74,0.5)',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
