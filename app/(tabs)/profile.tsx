import { StyleSheet, TouchableOpacity } from 'react-native';

import CustomNavBar from '@/components/CustomNavBar';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const colorScheme = useColorScheme();

    return (
        <>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
                headerImage={
                    <IconSymbol
                        size={310}
                        color="#808080"
                        name="person.fill"
                        style={styles.headerImage}
                    />
                }>
                <ThemedView style={styles.titleContainer}>
                    <ThemedText type="title">Profile</ThemedText>
                </ThemedView>

                <ThemedView style={styles.userInfoContainer}>
                    <ThemedText style={styles.label}>Email</ThemedText>
                    <ThemedText style={styles.emailText}>{user?.email || 'Not logged in'}</ThemedText>
                </ThemedView>

                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                    onPress={signOut}
                >
                    <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
                </TouchableOpacity>
            </ParallaxScrollView>
            <CustomNavBar />
        </>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        color: '#808080',
        bottom: -90,
        left: -35,
        position: 'absolute',
    },
    titleContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    userInfoContainer: {
        marginVertical: 16,
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    logoutButton: {
        marginTop: 24,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
