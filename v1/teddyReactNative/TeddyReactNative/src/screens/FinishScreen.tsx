import { Linking, SafeAreaView, StatusBar, View } from "react-native";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
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
import { Chase } from "react-native-animated-spinkit";

const uploadResponseToServer = async () => {
    const networkState = await NetInfo.fetch();
    return new Promise(function(resolve, reject) {

        console.log("Network state", networkState);
        if (!networkState.isConnected || networkState.isInternetReachable === false || networkState["isWifiEnabled"] === false) {
            reject(null);
            return;
        }
        uploadFinalSessionDataToServer(getCurrentSession()).then((data) => {
            resolve(data);
        }).catch((reason) => {
            reject(reason);
        });

    });
};

export default ({ navigation }) => {
    const rivePlayer = useRef(null);
    const speechBubble = useRef(null);
    const fadingPanelSet = useRef(null);

    const [contactingServer, setContactingServer] = useState(false);

    useEffect(() => {
        if (Platform.OS == "android") {
            StatusBar.setBackgroundColor("white");
        }
    }, []);

    useEffect(() => {
        rivePlayer.current.fireState("teddy", "success");
        const hasNextURL = getSessionData("nextURL");
        let textSequence = [];
        if (hasNextURL) {
            textSequence = ["All set, thank you so much!", "Press a button below to return to your survey."];
        } else {
            textSequence = ["All set!", "Thanks so much for helping advance important research!", "Please take care."];
        }
        speechBubble.current.showTextSequence(textSequence, () => {
            rivePlayer.current.fireState("teddy", "wave");
            fadingPanelSet.current.showStartPanel();
        });
    }, []);

    const finish = () => {
        navigation.navigate("GoAwayScreen");
    };

    const uploadResponse = (response) => {

        if (contactingServer) {
            return;
        }
        saveSessionData("finalResponse", response);
        setContactingServer(true);
        fadingPanelSet.current.fadeInPanel("uploading");

        uploadResponseToServer().then(() => {
            // TODO: clear myDataStore from long term storage
            console.log("final response upload success!");
            (async () => {
                await saveSessionState(SessionState.finished);
                await deleteUploadedSessions();
                finish();
            })();

        }).catch((e) => {
            // TODO: save myDataStore to long term storage
            console.log("final response upload error!", e);

            (async () => {
                await saveSessionState(SessionState.finalRatingFailed);
                await deleteUploadedSessions();
                finish();
            })();

        });
    };

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
                                onComplete={() => {
                                    fadingPanelSet.current.showStartPanel();
                                }} />
                        </View>
                    </View>
                    <View style={{ flex: 4 }} />

                    <FadingPanelSet ref={fadingPanelSet}>
                        <FadingPanel label={null}>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton1, styles.stackedbuttonTop]}
                                icon=""
                                mode="contained"
                                labelStyle={[styles.stackedButtonText]}
                                onPress={() => {
                                    uploadResponse(2);
                                }}>
                                See you later!!!
                            </Button>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton2]}
                                icon=""
                                mode="contained"
                                labelStyle={[styles.stackedButtonText]}
                                onPress={() => {
                                    uploadResponse(1);
                                }}>
                                Thanks for the video!
                            </Button>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton3, styles.stackedbuttonBottom]}
                                icon=""
                                mode="contained"
                                labelStyle={[styles.stackedButtonText]}
                                onPress={() => {
                                    uploadResponse(0);
                                }}>
                                Bye.
                            </Button>
                            {/*<Button*/}
                            {/*    style={[styles.stackedbutton, styles.stackedbutton3, styles.stackedbuttonBottom]}*/}
                            {/*    icon=""*/}
                            {/*    mode="contained"*/}
                            {/*    labelStyle={[styles.stackedButtonText]}*/}
                            {/*    onPress={() => {*/}
                            {/*        uploadResponse(0);*/}
                            {/*    }}>*/}
                            {/*    I need help...*/}
                            {/*</Button>*/}
                        </FadingPanel>
                        <FadingPanel label={"uploading"}>
                            <View
                                style={[styles.fillParent, { alignContent: "center", justifyContent: "center" }]}>
                                <Chase style={{
                                    alignSelf: "center"
                                }} size={remify(100)}
                                       color={accentColor} />
                            </View>

                        </FadingPanel>

                    </FadingPanelSet>


                </View>
            </SafeAreaView>
            <SpeechBubbleBlocker />
        </View>
    );

};
