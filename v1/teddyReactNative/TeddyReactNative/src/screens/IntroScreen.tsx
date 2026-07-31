import { Animated, Easing, SafeAreaView, StatusBar, StyleSheet, View, ViewProps } from "react-native";
import { useEffect, useRef, useState } from "react";
import { Button, Text } from "react-native-paper";
import * as React from "react";
import Rive from "rive-react-native";
import { styles } from "../styles/Style";
import SpeechBubbleBlocker from "../widgets/SpeechBubbleBlocker";
import SpeechBubble from "../widgets/SpeechBubble";
import { checkMultiple, requestMultiple, PERMISSIONS, RESULTS } from "react-native-permissions";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import PushNotification, { Importance, PushNotificationsHandler } from "react-native-push-notification";
import { Platform } from "react-native";
import { PermissionsAndroid } from 'react-native';
import { FadingPanel, FadingPanelSet } from "../widgets/FadingPanelSet";
// @ts-ignore
import moment from "moment";
import { getGreetingOverride, getSessionData, setGreetingOverride } from "../data/DataStore";
import { CreditPopup } from "../widgets/CreditPopup";
import {
    NOTIFICATION_SETTINGS,
    scheduleLocalNotification,
    unscheduleLocalNotifications
} from "../utils/localNotifications";
import notifee, {AuthorizationStatus} from "@notifee/react-native";


// teddy: https://rive.app/community/520-990-teddy-login-screen/
// face: https://rive.app/community/669-1300-facial-expression-demo/
export const resourceName = "teddy";


const cameraPermissionName = Platform.OS === "ios" ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;
const microphonePermissionName = Platform.OS === "ios" ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO;

export default ({ navigation }) => {
    const rivePlayer = useRef(null);
    const speechBubble = useRef(null);
    const fadingPanelSet = useRef(null);

    const [deniedPermissions, setDeniedPermissions] = useState(false);
    const [handsup, setHandsup] = useState(false);

    useEffect(() => {
        if (Platform.OS == "android") {
            StatusBar.setBackgroundColor("white");
        }
    }, []);

    useEffect(() => {
        if (!getGreetingOverride()) {
            setTimeout(() => {
                rivePlayer.current.fireState("teddy", "wave_short");
            }, 500);
        }
        speechBubble.current.showTextSequence([getGreetingOverride() ? getGreetingOverride() : "Hello, there! It's great to see you!", "Do you have time now for a quick interaction using the camera?"],
            () => {
                fadingPanelSet.current.showStartPanel();
                setGreetingOverride(null);
            }
        );
        setDeniedPermissions(false);
        unscheduleLocalNotifications();
    }, []);


    const goToNextScreen = () => {
        navigation.navigate("CameraScreen");
    };

    const checkForPermissions = (retrying = false) => {
        (async () => {
            console.log("checking for permissions");
            const statuses = await checkMultiple([cameraPermissionName, microphonePermissionName]);

            if (statuses[cameraPermissionName] == RESULTS.GRANTED && statuses[microphonePermissionName] == RESULTS.GRANTED) {
                if (retrying) {
                    fadingPanelSet.current.fadeToPanel("permissionsGranted");
                    speechBubble.current.showText("Great! Thank you!\nNow let's start that camera.");
                } else {
                    goToNextScreen();
                }
                return;
            }
            if (retrying || statuses[cameraPermissionName] == RESULTS.BLOCKED || statuses[cameraPermissionName] == RESULTS.BLOCKED) {
                setDeniedPermissions(true);
                speechBubble.current.showText("Looks like you denied the app permissions, but it can't run without them!\nPlease grant the permissions below or via your device's Settings!");
            } else {
                setDeniedPermissions(false);
                speechBubble.current.showText("The app is about to ask you for camera and microphone permissions. Please grant both, or the app won't work!");
            }

            fadingPanelSet.current.fadeToPanel("permissionsDenied");

        })();
    };

    const askForPermissions = () => {
        (async () => {
            await requestMultiple([cameraPermissionName, microphonePermissionName]);
            checkForPermissions(true);
        })();
    };

    const onNotificationPermissionsGranted = () => {
        fadingPanelSet.current.fadeToPanel("reminders");
        speechBubble.current.showText("Okay, no problem! Do you want a reminder notification?");
    }
    const onNotificationPermissionsDenied = () => {
        playGoodbye(false);
    }

    const askForReminder = () => {
        (async ()=>{
            const settings = await notifee.requestPermission();
            console.log("notification permissions", settings, AuthorizationStatus.AUTHORIZED)
            rivePlayer.current.fireState("teddy", "slightly_happy");

            if (settings.authorizationStatus == AuthorizationStatus.AUTHORIZED) {
                if (Platform.OS == "android") {
                    notifee.createChannel({
                        id: "teddy",
                        name: "Teddy",
                    }).then((channelId)=> {
                        NOTIFICATION_SETTINGS.channelId = channelId;
                        onNotificationPermissionsGranted()
                    });
                } else {
                    onNotificationPermissionsGranted()
                }

            } else {
                onNotificationPermissionsDenied()
            }

        })();

    };


    const playGoodbye = (alarmTime) => {
        fadingPanelSet.current.fadeToPanel("goodbye");
        const nextURL = getSessionData("nextURL");
        if (alarmTime) {
            const timeString = moment(alarmTime).format("h:mm a");
            if (nextURL) {
                speechBubble.current.showTextSequence([`Alright! I've set a reminder for ${timeString}. See you in a bit!`, "Click the button below to return to your survey!"]);
            } else {
                speechBubble.current.showText(`Alright! I've set a reminder for ${timeString}. See you in a bit!`);
            }
        } else {
            if (nextURL) {
                speechBubble.current.showTextSequence([`Alright! See you later!`, "Click the button below to return to your survey!"]);
            } else {
                speechBubble.current.showText("Alright! See you later!");
            }
        }
        rivePlayer.current.fireState("teddy", "wave");
    };

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleDateConfirm = (time) => {
        hideDatePicker();
        scheduleAlarm(time);
    };

    const scheduleAlarm = (time) => {
        while (time < Date.now()) {
            time = moment(time).add(1, "days").toDate();
        }
        scheduleLocalNotification(time);
        playGoodbye(time);
    };

    const quit = () => {
        navigation.navigate("GoAwayScreen");
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
                            />
                        </View>
                    </View>
                    <View style={{ flex: 4 }} />

                    <FadingPanelSet ref={fadingPanelSet}>
                        <FadingPanel label={null}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="flag"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    checkForPermissions();
                                }}>
                                Let's Do It!
                            </Button>
                            <View style={styles.cancelbuttonContainer}>
                                <Button
                                    style={styles.cancelbutton}
                                    mode="contained"
                                    labelStyle={styles.cancelButtonText}
                                    onPress={() => {
                                        askForReminder();
                                    }}>
                                    Not Now
                                </Button>
                            </View>
                        </FadingPanel>

                        <FadingPanel label={"permissionsGranted"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="video"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    goToNextScreen();
                                }}>
                                I'm Ready!
                            </Button>
                        </FadingPanel>

                        <FadingPanel
                            label={"permissionsDenied"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon={deniedPermissions ? null : "heart"}
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    askForPermissions();
                                }}>
                                {deniedPermissions ? "Okay. Retry." : "Okay! I will!"}
                            </Button>
                        </FadingPanel>

                        <FadingPanel
                            label={"reminders"}>
                            <Text style={styles.reminderText}>Remind
                                Me In...</Text>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton1, styles.stackedbuttonTop]}
                                icon={"clock"}
                                mode="contained"
                                labelStyle={styles.stackedButtonText}
                                onPress={() => {
                                    scheduleAlarm(new Date(Date.now() + 30 * 60 * 1000));
                                }}>
                                30 minutes
                            </Button>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton2]}
                                icon={"clock"}
                                mode="contained"
                                labelStyle={[styles.stackedButtonText]}
                                onPress={() => {
                                    scheduleAlarm(new Date(Date.now() + 60 * 60 * 1000));
                                }}>
                                60 minutes
                            </Button>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton3, styles.stackedbuttonBottom]}
                                icon={"clock"}
                                mode="contained"
                                labelStyle={[styles.stackedButtonText]}
                                onPress={() => {
                                    showDatePicker();
                                }}>
                                Custom Time
                            </Button>
                            <View style={styles.reminderCancelbuttonContainer}>
                                <Button
                                    style={styles.cancelbutton}
                                    icon={""}
                                    mode="contained"
                                    labelStyle={[styles.cancelButtonText]}
                                    onPress={() => {
                                        playGoodbye(false);
                                    }}>
                                    No thanks
                                </Button>
                            </View>
                        </FadingPanel>

                        <FadingPanel
                            label={"goodbye"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="hand-wave"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    quit();
                                }}>
                                Bye bye!
                            </Button>
                        </FadingPanel>

                    </FadingPanelSet>


                </View>
            </SafeAreaView>
            <SpeechBubbleBlocker />
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="time"
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
            />
            <CreditPopup />
        </View>
    );

};
