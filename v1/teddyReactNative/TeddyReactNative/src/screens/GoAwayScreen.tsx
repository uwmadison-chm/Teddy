import { AppState, Linking, SafeAreaView, StatusBar, View } from "react-native";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "react-native-paper";
import Rive from "rive-react-native";
import { accentColor, remify, styles } from "../styles/Style";
import SpeechBubbleBlocker from "../widgets/SpeechBubbleBlocker";
import SpeechBubble from "../widgets/SpeechBubble";
import { PERMISSIONS } from "react-native-permissions";
import { Platform } from "react-native";
import { FadingPanel, FadingPanelSet } from "../widgets/FadingPanelSet";
import {
    deleteUploadedSessions, getCurrentSession,
    getCurrentSessionState,
    getSessionData,
    saveSessionData,
    saveSessionState,
    SessionState,
    uploadFinalSessionDataToServer
} from "../data/DataStore";
import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import { resourceName } from "./IntroScreen";


export default ({ navigation }) => {
    const rivePlayer = useRef(null);
    const speechBubble = useRef(null);

    useEffect(() => {
        if (Platform.OS == "android") {
            StatusBar.setBackgroundColor("white");
        }
    }, []);

    useEffect(() => {
        rivePlayer.current.fireState("teddy", "wave");
        if (getSessionData("nextURL")) {
            speechBubble.current.showText("Thank you!\nBye!!!");

            (async () => {
                await Linking.openURL(getSessionData("nextURL"));
            })();
        } else {
            speechBubble.current.showText("Bye!!!\nYou can safely exit the app now!");
        }


    }, []);

    const [appState, setAppState] = useState(null);

    const onAppStateChange = useCallback(nextAppState => {
        setAppState(nextAppState);
    }, []);

    useEffect(() => {
        if (appState === "active") {
            navigation.navigate("LoadingScreen");
        }
    }, [appState]);

    useEffect(() => {
        AppState.addEventListener("change", onAppStateChange);

        return () => {
            AppState.removeEventListener("change", onAppStateChange);
        };
    }, [onAppStateChange]);

    return (
        <View>
            <SafeAreaView>
                <View style={styles.screenContainer}>
                    <View style={{ flex: 2 }}>
                        <View style={styles.portraitContainer}>
                            <View style={styles.portraitFrame}>
                                <Rive autoplay stateMachineName={"teddy"} resourceName={resourceName}
                                      ref={rivePlayer}
                                      style={styles.fillParent} />
                            </View>
                            <SpeechBubble
                                ref={speechBubble}
                            />
                        </View>
                    </View>
                    <View style={{ flex: 4 }} />


                </View>
            </SafeAreaView>
            <SpeechBubbleBlocker />
        </View>
    );

};
