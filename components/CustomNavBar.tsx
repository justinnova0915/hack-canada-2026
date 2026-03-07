import Feather from "@expo/vector-icons/Feather";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
} from "react-native-reanimated";

const AnimatedTouchableOpacity =
    Animated.createAnimatedComponent(TouchableOpacity);

const APP_BG = "#0d1117";
const APP_ACCENT = "#e8a44a";
const APP_TEXT = "#f0ece3";
const APP_TEXT_MUTED = "#ccbfa8";

const ROUTES = [
    { name: 'index', path: '/(tabs)', label: 'Home' },
    { name: 'history', path: '/(tabs)/history', label: 'History' },
    { name: 'stats', path: '/(tabs)/stats', label: 'Stats' },
    { name: 'map', path: '/(tabs)/map', label: 'Map' },
    { name: 'profile', path: '/(tabs)/profile', label: 'Profile' },
];

function getIconByRouteName(routeName: string, color: string) {
        switch (routeName) {
            case "index":
                return <Feather name="home" size={18} color={color} />;
        case "history":
            return <Feather name="clock" size={18} color={color} />;
        case "stats":
            return <Feather name="pie-chart" size={18} color={color} />;
            case "map":
                return <Feather name="map" size={18} color={color} />;
            case "profile":
                return <Feather name="user" size={18} color={color} />;
            default:
                return <Feather name="home" size={18} color={color} />;
        }
}

const CustomNavBar: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <View style={styles.container}>
            {ROUTES.map((route) => {
                const isFocused = pathname === route.path || pathname === `/${route.name}`;

                const onPress = () => {
                    if (!isFocused) {
                        router.push(route.path as any);
                    }
                };

                return (
                    <AnimatedTouchableOpacity
                        layout={LinearTransition.springify().mass(0.5)}
                        key={route.name}
                        onPress={onPress}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        style={[
                            styles.tabItem,
                            {
                                backgroundColor: isFocused ? APP_ACCENT : "transparent",
                                borderColor: isFocused ? APP_ACCENT : "transparent",
                            },
                        ]}
                    >
                        {getIconByRouteName(
                            route.name,
                            isFocused ? APP_BG : APP_TEXT_MUTED
                        )}
                        {isFocused && (
                            <Animated.Text
                                entering={FadeIn.duration(200)}
                                exiting={FadeOut.duration(200)}
                                style={styles.text}
                            >
                                {route.label}
                            </Animated.Text>
                        )}
                    </AnimatedTouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(13, 17, 23, 0.95)",
        borderWidth: 1,
        borderColor: "rgba(232, 164, 74, 0.28)",
        width: "90%",
        alignSelf: "center",
        bottom: 28,
        borderRadius: 40,
        paddingHorizontal: 10,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 8,
    },
    tabItem: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: 40,
        paddingHorizontal: 12,
        borderRadius: 24,
        borderWidth: 1,
    },
    text: {
        color: APP_BG,
        marginLeft: 8,
        fontWeight: "700",
    },
});

export default CustomNavBar;
