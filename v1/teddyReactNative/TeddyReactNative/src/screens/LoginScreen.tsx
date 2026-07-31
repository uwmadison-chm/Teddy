import * as React from "react";
import { Button, IconButton, Text, TextInput } from "react-native-paper";
import { Animated, Platform, SafeAreaView, StyleSheet, View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { accentColor, remify, styles } from "../styles/Style";
import { TextField, FilledTextField, OutlinedTextField } from "../rn-material-ui-textfield";
import slugify from "react-slugify";
import {
    createNewSession,
    getSessionData,
    loginToServer,
    saveSessionData,
    setGreetingOverride
} from "../data/DataStore";
import Rive from "rive-react-native";
import { resourceName } from "./IntroScreen";
import SpeechBubble from "../widgets/SpeechBubble";
import { FadingPanel, FadingPanelSet } from "../widgets/FadingPanelSet";
import SpeechBubbleBlocker from "../widgets/SpeechBubbleBlocker";
import Icon from "react-native-vector-icons/Entypo";
import { CreditPopup } from "../widgets/CreditPopup";

export default ({ navigation }) => {

    const rivePlayer = useRef(null);
    const speechBubble = useRef(null);
    const fadingPanelSet = useRef(null);

    const loginFadeAnim = useRef(new Animated.Value(0)).current;
    const [showLogin, setShowLogin] = useState(false);

    useEffect(() => {
        if (Platform.OS == "android") {
            StatusBar.setBackgroundColor("white");
        }
    }, []);

    const [userId, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [didLogin, setDidLogin] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordIsFocused, setPasswordIsFocused] = useState(false);
    const userIdInput = useRef(null);
    const passwordInput = useRef(null);

    useEffect(() => {
        if (getSessionData("userId")) {
            setUserId(getSessionData("userId"));
        }
        speechBubble.current.showTextSequence(["Hello, there!", "To use this app, you should open it through a link from a website.", "If you don't have a link and still want to log in, please use the User ID and password you were given at the start of the study.", "And if you don't have a User ID and password, ask for one!"], () => {
            fadingPanelSet.current.fadeInPanel("login");

            loginFadeAnim.setValue(0);
            setShowLogin(true);
            userIdInput.current.focus();
            Animated.timing(
                loginFadeAnim,
                {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                }
            ).start(() => {
            });
        });
        rivePlayer.current.fireState("teddy", "wave");

    }, []);

    const userIdIsInvalid = userId == null || userId.length < 4;
    const passwordIsInvalid = password == null || password.length < 6;

    const doLogin = () => {

        speechBubble.current.showText("Verifying...", true);

        setIsLoggingIn(true);
        loginToServer(userId, password).then((response) => {
            const result = JSON.parse(response as string);
            if (result.success) {
                saveSessionData("projectName", result["project_name"]);
                AsyncStorage.setItem("projectName", result["project_name"]);
                saveUserId();
            } else {
                speechBubble.current.showText("Looks like that wasn't right. Please double check your info!");
                setIsLoggingIn(false);
            }
        }).catch(() => {
            speechBubble.current.showText("Looks like that wasn't right. Please double check your info!");
            setIsLoggingIn(false);
        });
    };

    const saveUserId = () => {
        if (userIdIsInvalid) {
            return;
        }
        (async () => {
            await AsyncStorage.setItem("userId", userId);
            await createNewSession(userId, null, null, null, null);

            userIdInput.current.blur();
            passwordInput.current.blur();
            Animated.timing(
                loginFadeAnim,
                {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true
                }
            ).start(() => {
                setShowLogin(false);
            });
            setDidLogin(true);
            fadingPanelSet.current.fadeOutPanel();
            speechBubble.current.showText("Login successful! Enjoy the app!", false, () => {
                fadingPanelSet.current.fadeInPanel("finish");
            });

        })();
    };

    const showBye = () => {
        userIdInput.current.blur();
        Animated.timing(
            loginFadeAnim,
            {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }
        ).start(() => {
            setShowLogin(false);
        });
        fadingPanelSet.current.fadeOutPanel();
        speechBubble.current.showText("Okay, Bye for now!", false, () => {
            fadingPanelSet.current.fadeInPanel("bye");
        });

    };

    const quit = () => {
        navigation.navigate("GoAwayScreen");
    };

    const showNextScreen = () => {
        setGreetingOverride("Now that you're logged in, we can continue!");
        navigation.navigate("IntroScreen");
    };


    return (<View>
            <SafeAreaView>
                <View style={[styles.screenContainer, { height: "100%" }]}>
                    <View style={{ flex: 2, position: "absolute", zIndex: 5, top: 0, right: 0, left: 0 }}>
                        <View style={styles.loginPortraitContainer}>
                            <View style={styles.portraitFrame}>
                                <Rive autoplay stateMachineName={"teddy"} resourceName={resourceName}
                                      ref={rivePlayer}
                                      style={styles.fillParent} />
                            </View>
                            <SpeechBubble
                                textStyleOverride={styles.loginTextStyleOverride}
                                bubbleStyleOverride={styles.loginSpeechBubbleStyleOverride}
                                ref={speechBubble}
                            />
                        </View>
                        <Animated.View style={[styles.loginContainer, {
                            opacity: loginFadeAnim,
                            display: showLogin ? "flex" : "none", zIndex: 50
                        }]}
                        >
                            <OutlinedTextField
                                label="User ID"
                                contentInset={{ left: remify(20), right: remify(80) }}
                                labelOffset={{ x0: remify(-18) }}
                                tintColor={accentColor}
                                ref={userIdInput}
                                lineWidth={2}
                                baseColor={"#ddd"}
                                blurOnSubmit={false}
                                autoCapitalize={"none"}
                                autoCompleteType={"off"}
                                autoCorrect={false}
                                keyboardType="visible-password"
                                returnKeyType={"next"}
                                onChangeText={text => setUserId(slugify(text))}
                                onSubmitEditing={() => {
                                    if (userIdIsInvalid) {
                                        userIdInput.current.focus();
                                    } else {
                                        passwordInput.current.focus();
                                    }
                                }}
                            />
                            <View style={{
                                marginTop: remify(5),
                                position: "relative"
                            }}>

                                <OutlinedTextField
                                    label="Password"
                                    contentInset={{ left: remify(55), right: remify(80) }}
                                    labelOffset={{ x0: remify(-18), x1: remify(-45) }}
                                    tintColor={accentColor}
                                    secureTextEntry={!isPasswordVisible}
                                    ref={passwordInput}
                                    blurOnSubmit={false}
                                    lineWidth={2}
                                    baseColor={"#ddd"}
                                    autoCapitalize={"none"}
                                    autoCompleteType={"off"}
                                    autoCorrect={false}
                                    focus={() => {
                                        setPasswordIsFocused(true);
                                    }}
                                    blur={() => {
                                        setPasswordIsFocused(false);
                                    }}
                                    keyboardType={isPasswordVisible ? "visible-password" : null}
                                    onChangeText={text => setPassword(slugify(text))}
                                    onSubmitEditing={() => {
                                        if (userIdIsInvalid) {
                                            userIdInput.current.focus();
                                        } else if (passwordIsInvalid) {
                                            passwordInput.current.focus();
                                        } else {
                                            doLogin();
                                        }
                                    }}
                                />
                                <Button
                                    mode="contained"
                                    style={[styles.loginButton, {
                                        backgroundColor: isLoggingIn || userIdIsInvalid || passwordIsInvalid ? "#eee" : accentColor
                                    }]}
                                    disabled={isLoggingIn || userIdIsInvalid || passwordIsInvalid}
                                    contentStyle={{ alignContent: "center", justifyContent: "center" }}
                                    labelStyle={styles.loginButtonText}
                                    onPress={() => {
                                        doLogin();
                                    }}
                                ><Icon name="login"
                                       size={20} /></Button>

                                <IconButton
                                    style={{
                                        position: "absolute",
                                        top: remify(5),
                                        left: remify(5)
                                    }}
                                    color={"#ddd"}
                                    icon={isPasswordVisible ? "eye" : "eye-off"}
                                    onPress={() => {
                                        setIsPasswordVisible(!isPasswordVisible);
                                    }}
                                />
                            </View>

                        </Animated.View>

                    </View>
                    <View style={{ flex: 2 }} />


                    <FadingPanelSet ref={fadingPanelSet}>

                        <FadingPanel label={"login"}>

                            <View style={styles.cancelbuttonContainer}>
                                <Button
                                    style={styles.cancelbutton}
                                    mode="contained"
                                    labelStyle={styles.cancelButtonText}
                                    onPress={() => {
                                        showBye();
                                    }}>
                                    Try Later....
                                </Button>
                            </View>
                        </FadingPanel>

                        <FadingPanel label={"bye"}>
                            <Button
                                style={[styles.mainbutton]}
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    quit();
                                }}>
                                Bye!
                            </Button>
                        </FadingPanel>

                        <FadingPanel label={"finish"}>
                            <Button
                                style={[styles.mainbutton]}
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    showNextScreen();
                                }}>
                                Let's Go!
                            </Button>
                        </FadingPanel>

                    </FadingPanelSet>


                </View>
            </SafeAreaView>
            <SpeechBubbleBlocker />
            <CreditPopup smallVersion={true} />
        </View>

    );


};

