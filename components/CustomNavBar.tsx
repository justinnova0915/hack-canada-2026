import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRef, useState } from "react";
import { Easing, Animated as RNAnimated, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
} from "react-native-reanimated";

const AnimatedTouchableOpacity =
    Animated.createAnimatedComponent(TouchableOpacity);

const APP_BG = "#0d1117";
const APP_ACCENT = "#e8a44a";
const APP_TEXT_MUTED = "#ccbfa8";

const CustomNavBar: React.FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    const [expanded, setExpanded] = useState(false);
    const expandAnim = useRef(new RNAnimated.Value(0)).current;
    const rotateAnim = useRef(new RNAnimated.Value(0)).current;

    const toggle = () => {
        const toValue = expanded ? 0 : 1;
        RNAnimated.parallel([
            RNAnimated.spring(expandAnim, {
                toValue,
                useNativeDriver: false,
                friction: 8,
                tension: 60,
            }),
            RNAnimated.timing(rotateAnim, {
                toValue,
                duration: 300,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
        setExpanded(!expanded);
    };

    const containerWidth = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [56, 280],
    });

    const chevronRotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    const tabOpacity = expandAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1],
    });

    return (
        <View style={styles.wrapper}>
            <RNAnimated.View style={[styles.container, { width: containerWidth }]}>
                {/* Chevron toggle */}
                <TouchableOpacity
                    style={styles.toggleBtn}
                    onPress={toggle}
                    activeOpacity={0.8}
                >
                    <RNAnimated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                        <Feather name="chevron-right" size={22} color={APP_ACCENT} />
                    </RNAnimated.View>
                </TouchableOpacity>

                {/* Tab items — only rendered when expanding */}
                <RNAnimated.View style={[styles.tabsRow, { opacity: tabOpacity }]}>
                    {state.routes.map((route, index) => {
                        if (["_sitemap", "+not-found"].includes(route.name)) return null;

                        const { options } = descriptors[route.key];
                        const label =
                            options.tabBarLabel !== undefined
                                ? options.tabBarLabel
                                : options.title !== undefined
                                    ? options.title
                                    : route.name;

                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: "tabPress",
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name, route.params);
                            }
                            // Collapse after navigating
                            if (expanded) {
                                toggle();
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: "tabLongPress",
                                target: route.key,
                            });
                        };

                        return (
                            <AnimatedTouchableOpacity
                                layout={LinearTransition.springify().mass(0.5)}
                                key={route.key}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={options.tabBarButtonTestID}
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
                                        {label as string}
                                    </Animated.Text>
                                )}
                            </AnimatedTouchableOpacity>
                        );
                    })}
                </RNAnimated.View>
            </RNAnimated.View>
        </View>
    );

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
                return <FontAwesome6 name="circle-user" size={18} color={color} />;
            default:
                return <Feather name="home" size={18} color={color} />;
        }
    }
};

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        bottom: 36,
        left: 24,
        zIndex: 100,
    },
    container: {
        flexDirection: "row",
        alignItems: "center",
        height: 56,
        backgroundColor: "rgba(13, 17, 23, 0.95)",
        borderWidth: 1,
        borderColor: "rgba(232, 164, 74, 0.28)",
        borderRadius: 28,
        paddingLeft: 4,
        paddingRight: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
        overflow: "hidden",
    },
    toggleBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    tabsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginLeft: 2,
    },
    tabItem: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: 40,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    text: {
        color: APP_BG,
        marginLeft: 6,
        fontWeight: "700",
        fontSize: 12,
    },
});

export default CustomNavBar;