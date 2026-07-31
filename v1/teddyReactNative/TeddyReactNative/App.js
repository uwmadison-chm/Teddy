/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from "react";
import { DefaultTheme, Provider as PaperProvider } from "react-native-paper";
import {
    DefaultTheme as NavigationDefaultTheme,
    NavigationContainer,
} from "@react-navigation/native";
import LoadingScreen from "./src/screens/LoadingScreen";
import CameraScreen from "./src/screens/CameraScreen";
import { createAppContainer, createSwitchNavigator } from "react-navigation";
import { BackHandler, Linking, Platform, SafeAreaView, StatusBar, Text, View } from "react-native";
import { LogBox } from "react-native";
import IntroScreen from "./src/screens/IntroScreen";
import PushNotification, { Importance } from "react-native-push-notification";
import LoginScreen from "./src/screens/LoginScreen";
import UploadScreen from "./src/screens/UploadScreen";
import FinishScreen from "./src/screens/FinishScreen";
import UploadPastSessionsScreen from "./src/screens/UploadPastSessionsScreen";
import GoAwayScreen from "./src/screens/GoAwayScreen";
import { setCurrentDeepLink } from "./src/data/DataStore";

// This is useless deprecation warning
LogBox.ignoreLogs(["Constants."]);
// This is useless deprecation warning
LogBox.ignoreLogs(["`new NativeEventEmitter"]);
// This is useless deprecation warning about not unsubscribing using an id that is never returned upon subscribing. Ridiculous.
LogBox.ignoreLogs(["EventEmitter.removeListener"]);

const theme = {
    ...DefaultTheme,
    roundness: 5000,
    colors: {
        ...DefaultTheme.colors,
        primary: "#19e0c3",
        accent: "#19e0c3",
        background: "#ffffff",
        disabled: "#999999FF",
    },
};

BackHandler.addEventListener("hardwareBackPress", function() {
    return true;
});

const MyNavigationTheme = {
    ...NavigationDefaultTheme,
    colors: {
        ...NavigationDefaultTheme.colors,
        background: "transparent",
    },
};

const linking = {
    prefixes: ["affectteddy://"],
};

const Navigator = createAppContainer(createSwitchNavigator({
    LoadingScreen: {
        screen: LoadingScreen,
        path: ":projectName/:userId/:sessionLabel?/:nextURL?",
    },
    LoginScreen: {
        screen: LoginScreen,
    },
    UploadPastSessionsScreen: {
        screen: UploadPastSessionsScreen,
    },
    IntroScreen: {
        screen: IntroScreen,
    },
    CameraScreen: {
        screen: CameraScreen,
    },
    UploadScreen: {
        screen: UploadScreen,
    },
    FinishScreen: {
        screen: FinishScreen,
    },
    GoAwayScreen: {
        screen: GoAwayScreen,
    },
    initialRouteName: "LoadingScreen",
}));

if (Platform.OS == "android") {
    StatusBar.setBackgroundColor("white");
}

PushNotification.configure({
    // (optional) Called when Token is generated (iOS and Android)
    onRegister: function(token) {
        // console.log("TOKEN:", token);
        PushNotification.createChannel(
            {
                channelId: "teddy", // (required)
                channelName: "Teddy", // (required)
                channelDescription: "Remind yourself to complete your Teddy activities!", // (optional) default: undefined.
                importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
                vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
            },
            (created) => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
        );

    },

    // (required) Called when a remote is received or opened, or local notification is opened
    onNotification: function(notification) {
        // console.log("NOTIFICATION:", notification);

        // process the notification

        // (required) Called when a remote is received or opened, or local notification is opened
        // notification.finish(PushNotificationIOS.FetchResult.NoData);
    },

    // (optional) Called when Registered Action is pressed and invokeApp is false, if true onNotification will be called (Android)
    onAction: function(notification) {
        // console.log("ACTION:", notification.action);
        // console.log("NOTIFICATION:", notification);

        // process the action
    },

    // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
    onRegistrationError: function(err) {
        console.error(err.message, err);
    },

    // IOS ONLY (optional): default: all - Permissions to register.
    permissions: {
        alert: true,
        badge: true,
        sound: true,
    },

    // Should the initial notification be popped automatically
    // default: true
    popInitialNotification: true,

    /**
     * (optional) default: true
     * - Specified if permissions (ios) and token (android and ios) will requested or not,
     * - if not, you must call PushNotificationsHandler.requestPermissions() later
     * - if you are not using remote notification or do not have Firebase installed, use this:
     *     requestPermissions: Platform.OS === 'ios'
     */
    requestPermissions: Platform.OS === "ios",
});

const persistenceKey = "persistenceKey";
const persistNavigationState = async (navState) => {
    try {
        await AsyncStorage.setItem(persistenceKey, JSON.stringify(navState));
    } catch (err) {
        // handle the error according to your needs
    }
};
const loadNavigationState = async () => {
    const jsonString = await AsyncStorage.getItem(persistenceKey);
    return JSON.parse(jsonString);
};


export default function App() {


    return (
        <PaperProvider uriPrefix={"affectteddy://"} theme={theme}>
            <View style={{ backgroundColor: "white", flex: 1 }}>
                <Navigator persistNavigationState={persistNavigationState}
                           loadNavigationState={loadNavigationState} />
            </View>
        </PaperProvider>
    );
};
