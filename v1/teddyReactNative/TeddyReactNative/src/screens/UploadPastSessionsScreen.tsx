import { SafeAreaView, StatusBar, View } from "react-native";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Button, Text } from "react-native-paper";
import Rive from "rive-react-native";
import { accentColor, accentColorDark, remify, styles } from "../styles/Style";
import SpeechBubbleBlocker from "../widgets/SpeechBubbleBlocker";
import SpeechBubble from "../widgets/SpeechBubble";
import { PERMISSIONS } from "react-native-permissions";
import { Platform } from "react-native";
import { FadingPanel, FadingPanelSet } from "../widgets/FadingPanelSet";
import {
    deleteUploadedSessions,
    getCurrentSessionState,
    getSessionData,
    saveSessionData,
    saveSessionState,
    SessionState, setGreetingOverride, tryToUploadPastSessions,
    uploadFinalSessionDataToServer
} from "../data/DataStore";
import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import { resourceName } from "./IntroScreen";
import { Chase } from "react-native-animated-spinkit";

export default ({ navigation }) => {
    const rivePlayer = useRef(null);
    const speechBubble = useRef(null);
    const fadingPanelSet = useRef(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (Platform.OS == "android") {
            StatusBar.setBackgroundColor("white");
        }
    }, []);

    useEffect(() => {
        setTimeout(() => {
            rivePlayer.current.fireState("teddy", "wave");
        }, 500);
        speechBubble.current.showTextSequence(["Hello there! It's great to see you again!", "It looks like you have some un-uploaded recordings.", "Would you like to upload them now?", "These files are large, so please make sure you're on wifi first!"], () => {
            fadingPanelSet.current.fadeInPanel("start");
        });
    }, []);

    const onUploadProgress = (percent) => {
        setUploadProgress(percent);
    };

    const uploadSessions = () => {

        if (isUploading) {
            return;
        }
        setIsUploading(true);
        fadingPanelSet.current.fadeOutPanel();
        speechBubble.current.showText("Uploading now! This might take a bit. Please do not close the app!");


        tryToUploadPastSessions(onUploadProgress).then(() => {
            setIsUploading(false);
            fadingPanelSet.current.fadeOutPanel();
            rivePlayer.current.fireState("teddy", "success");
            speechBubble.current.showText("Great, you're all synced up! Thank you so much!!!", false, () => {
                fadingPanelSet.current.fadeInPanel("done");
            });
        }).catch((e) => {
            console.log(e);
            setIsUploading(false);
            rivePlayer.current.fireState("teddy", "sadness");
            speechBubble.current.showText("Oh no, looks like there was an error! Try again?", false, () => {
                fadingPanelSet.current.fadeInPanel("retry");
            });
        });
    };

    const showNextScreen = () => {
        navigation.navigate("IntroScreen");
    };

    const cancel = () => {
        setGreetingOverride("Okay then! Next time!");
        showNextScreen();
    };

    const retry = () => {
        uploadSessions();
    };

    const success = () => {
        setGreetingOverride("Now then, on with the show!");
        showNextScreen();
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

                    <View style={[styles.uploadSpinnerContainer, {
                        display: isUploading ? "flex" : "none"
                    }]}>
                        <Chase style={{
                            alignSelf: "center"
                        }} size={remify(100)}
                               color={accentColor} />
                        <Text style={{
                            alignSelf: "center",
                            marginTop: remify(20),
                            fontSize: remify(24),
                            color: accentColorDark,
                            fontWeight: "bold"
                        }}>
                            {Math.round(uploadProgress * 100)}%
                        </Text>

                    </View>


                    <FadingPanelSet ref={fadingPanelSet}>
                        <FadingPanel label={"start"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="cloud-upload"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    uploadSessions();
                                }}>
                                Upload Them!
                            </Button>
                            <View style={styles.cancelbuttonContainer}>
                                <Button
                                    style={styles.cancelbutton}
                                    mode="contained"
                                    labelStyle={styles.cancelButtonText}
                                    onPress={() => {
                                        cancel();
                                    }}>
                                    Later
                                </Button>
                            </View>

                        </FadingPanel>

                        <FadingPanel label={"retry"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="redo"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    retry();
                                }}>
                                Retry!
                            </Button>
                            <View style={styles.cancelbuttonContainer}>
                                <Button
                                    style={styles.cancelbutton}
                                    mode="contained"
                                    labelStyle={styles.cancelButtonText}
                                    onPress={() => {
                                        cancel();
                                    }}>
                                    Try Later....
                                </Button>
                            </View>
                        </FadingPanel>

                        <FadingPanel label={"done"}>
                            <Button
                                style={[styles.mainbutton]}
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    success();
                                }}>
                                Hooray!
                            </Button>
                        </FadingPanel>


                    </FadingPanelSet>

                </View>
            </SafeAreaView>
            <SpeechBubbleBlocker />
        </View>
    );

};
