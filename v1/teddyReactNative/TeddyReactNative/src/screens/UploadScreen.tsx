import * as React from "react";
import { Button, Text } from "react-native-paper";
import { Platform, SafeAreaView, StyleSheet, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "react-native";
import { accentColor, accentColorDark, remify, styles } from "../styles/Style";
import { Chase } from "react-native-animated-spinkit";
import Icon from "react-native-vector-icons/Entypo";
import RNFetchBlob from "rn-fetch-blob";
import {
    getCurrentSession, logEvent,
    uploadDataToServer
} from "../data/DataStore";
import Rive from "rive-react-native";
import SpeechBubble from "../widgets/SpeechBubble";
import { FadingPanel, FadingPanelSet } from "../widgets/FadingPanelSet";
import SpeechBubbleBlocker from "../widgets/SpeechBubbleBlocker";
import { resourceName } from "./IntroScreen";

const UploadScreen = ({ navigation }) => {
    const rivePlayer = useRef(null);
    const speechBubble = useRef(null);
    const fadingPanelSet = useRef(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (Platform.OS == "android") {
            StatusBar.setBackgroundColor("white");
        }
        upload();
    }, []);

    const onUploadProgress = (percent) => {
        setUploadProgress(percent);
    };

    const upload = () => {
        fadingPanelSet.current.fadeOutPanel();
        speechBubble.current.showText("Uploading... This could take a bit. Please don't close the app!");
        setIsUploading(true);

        logEvent("upload");
        uploadDataToServer(getCurrentSession(), onUploadProgress).then(() => {
            navigation.navigate("FinishScreen");
        }).catch(() => {
            setIsUploading(false);
            rivePlayer.current.fireState("teddy", "sadness");
            speechBubble.current.showText("Oh no, looks like there was an error! Try again?", false, () => {
                fadingPanelSet.current.fadeInPanel("retry");
            });
        });
    };


    useEffect(() => {
    }, [navigation.state]);

    const retry = () => {
        upload();
    };

    const giveup = () => {
        navigation.navigate("FinishScreen");
    };

    return (<View>
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

                <View style={[styles.uploadSpinnerContainer, {
                    display: isUploading ? "flex" : "none",
                    alignContent: "center"
                }]}>
                    <Chase style={{
                        alignSelf: "center"
                    }} size={remify(100)}
                           color={accentColor} />
                    <View style={{
                        alignSelf: "center",
                        marginTop: remify(20),
                        alignContent: "center"
                    }}>
                        <Text style={{
                            fontSize: remify(24),
                            color: accentColorDark,
                            fontWeight: "bold"
                        }}>
                            {Math.round(uploadProgress * 100)}%
                        </Text>

                    </View>
                </View>

                <FadingPanelSet ref={fadingPanelSet}>

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
                                    giveup();
                                }}>
                                Try Later....
                            </Button>
                        </View>
                    </FadingPanel>

                </FadingPanelSet>


            </View>
        </SafeAreaView>
        <SpeechBubbleBlocker />
    </View>);

};

export default UploadScreen;
