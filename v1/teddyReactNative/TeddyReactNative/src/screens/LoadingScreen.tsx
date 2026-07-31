import * as React from "react";
import { Button, Text } from "react-native-paper";
import { Linking, Platform, SafeAreaView, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import {
    canUploadData,
    checkForPreviousSessions,
    SESSION_TYPES,
    createNewSession,
    finishPreviouslyUnratedSessionsInBackground,
    getCurrentDeepLink,
    getPreviousSessionsToUpload,
    getPreviousUnratedSessionsToUpload,
    setCurrentDeepLink,
    getProjectInfo,
    loadSavedProjectInfo,
    saveProjectInfo,
    getSessionData
} from "../data/DataStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles, remify, accentColor } from "../styles/Style";
import uuid from "react-native-uuid";
import slugify from "react-slugify";
import NetInfo from "@react-native-community/netinfo";
import { URL, URLSearchParams } from "react-native-url-polyfill";
import { Chase } from "react-native-animated-spinkit";

const LoadingScreen = ({ navigation }) => {

    useEffect(() => {
        if (Platform.OS == "android") {
            StatusBar.setBackgroundColor("white");
        }

        Linking.removeAllListeners("url");
        Linking.addEventListener("url", (url) => {
            console.log("Deep Link Detected!", url["url"]);
            setCurrentDeepLink(url["url"]);
            navigation.navigate("LoadingScreen");
        });
    }, []);

    const [dataLoaded, setDataLoaded] = useState(false);

    const loadPlayerData = async () => {
            let userId = "";
            let projectName = null;
            let sessionLabel = null;
            let nextURL = null;
            let sessionType = "all";
            const currentDeepLink = getCurrentDeepLink();
            setCurrentDeepLink(null);
            const deeplink = currentDeepLink || await Linking.getInitialURL();
            if (false) {
                // disabled for now, this path lets react navigation parse things, but we don't want that for now.
                console.log("navigation params:", navigation.state.params);
                userId = slugify(navigation.state.params.userId) || userId;
                projectName = navigation.state.params.projectName;
                sessionLabel = navigation.state.params.sessionLabel || null;
                nextURL = navigation.state.params.nextURL || null;
            } else {
                // parse the deeplink ourselves.
                if (deeplink && deeplink.includes("affectteddy://")) {
                    const deeplinkURL = new URL(deeplink);
                    const pathParts = deeplinkURL.pathname.split("/");

                    userId = slugify(pathParts[1]) || userId;
                    projectName = deeplinkURL.hostname;
                    sessionLabel = pathParts.length > 2 ? pathParts[2] : null;

                    if (pathParts.length > 3 && SESSION_TYPES.includes(pathParts[3].toLowerCase())) {
                        sessionType = pathParts[3].toLowerCase();
                    }
                    console.log(pathParts, SESSION_TYPES, sessionType);


                    let urlStartParam = -1;
                    for (let i = 0; i < pathParts.length; i++) {
                        if (pathParts[i].startsWith("https")) {
                            urlStartParam = i;
                            break;
                        }
                    }
                    if (urlStartParam > 1) {
                        nextURL = pathParts.length > urlStartParam ? pathParts.slice(urlStartParam).join("/") : null;
                    }
                }
                console.log("deep link", deeplink);
            }

            if (nextURL) {
                nextURL = decodeURIComponent(nextURL);
                if (!nextURL || !nextURL.startsWith("https://redcap.ictr.wisc.edu/")) {
                    nextURL = null;
                }
            }
            userId = await createNewSession(userId, projectName, sessionLabel, sessionType, nextURL);

            const networkState = await NetInfo.fetch();

            if ((await getPreviousSessionsToUpload()).length) {
                navigation.navigate("UploadPastSessionsScreen");
                return;
            } else {
                finishPreviouslyUnratedSessionsInBackground().then(() => {

                });
            }

            if (userId) {
                // setDataLoaded(true);
                // navigation.navigate('UploadScreen');
                navigation.navigate("IntroScreen");
            } else {
                navigation.navigate("LoginScreen");
                // load login sreen
            }

        }
    ;

    useEffect(() => {
        loadPlayerData();
    }, [navigation.state]);

    return <SafeAreaView>
        <View
            style={[styles.screenContainer, { alignContent: "center", justifyContent: "center" }]}>
            <Chase style={{
                alignSelf: "center"
            }} size={remify(100)}
                   color={accentColor} />
        </View>
    </SafeAreaView>;

};

export default LoadingScreen;
