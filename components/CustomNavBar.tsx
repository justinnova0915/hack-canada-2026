import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
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

const CustomNavBar: React.FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    return (
        <View style={styles.container}>
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
            case "profile":
                return <FontAwesome6 name="circle-user" size={18} color={color} />;
            default:
                return <Feather name="home" size={18} color={color} />;
        }
    }
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
