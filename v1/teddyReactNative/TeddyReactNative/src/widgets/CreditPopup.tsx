import * as React from "react";
import {
    Animated,
    View,
    ViewProps,
    Button as ReactButton,
    ScrollView,
    Linking,
    SafeAreaView,
    Keyboard,
    TouchableOpacity
} from "react-native";
import { accentColor, accentColorDark, remify, styles } from "../styles/Style";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button, IconButton, Text } from "react-native-paper";
// @ts-ignore
import EntypoIcon from "react-native-vector-icons/Entypo";
// @ts-ignore
import IonIcon from "react-native-vector-icons/Ionicons";


interface Props {
    smallVersion?: boolean,
}

interface Functions {
}

export const CreditPopup = React.forwardRef<Functions, Props>((props, ref) => {

    const buttonRef = useRef(null);
    const [showCreditPopup, setShowCreditPopup] = useState(false);


    useEffect(() => {
    }, []);

    useImperativeHandle(ref, () => ({}));

    const show = () => {
        setShowCreditPopup(true);
        Keyboard.dismiss();
        console.log("SHOWING");
    };

    const close = () => {
        setShowCreditPopup(false);
    };

    return (<View style={{
        width: showCreditPopup ? "100%" : 0,
        height: showCreditPopup ? "100%" : 0,
        zIndex: 50000,
        top: 0,
        right: 0,
        position: "absolute",
        overflow: "visible"

    }}>
        <SafeAreaView style={{ position: "relative", flex: 1 }}>
            <View style={{ position: "relative", flex: 1 }}>

                <View style={{
                    position: "absolute",
                    top: props.smallVersion ? remify(0) : remify(10),
                    right: remify(20),
                    zIndex: remify(10)
                }}>
                    <TouchableOpacity
                        onPress={show}
                    >
                        <IonIcon name="information-circle-outline"
                                 color={accentColor}
                                 size={remify(50)} />
                    </TouchableOpacity>

                </View>
            </View>

        </SafeAreaView>

        <View style={{
            width: showCreditPopup ? "100%" : 0,
            height: showCreditPopup ? "100%" : 0,
            zIndex: 5000,
            position: "absolute",
            backgroundColor: "white",
            overflow: "hidden"
        }}>
            <SafeAreaView style={{ position: "relative", flex: 1 }}>
                <View style={{ position: "relative", flex: 1 }}>

                    <View style={{
                        justifyContent: "flex-end",
                        flexDirection: "row",
                        paddingRight: remify(20),
                        paddingTop: remify(5)
                    }}>
                        <TouchableOpacity
                            onPress={close}
                        >
                            <IonIcon name="close"
                                     color={accentColor}
                                     size={remify(50)} />
                        </TouchableOpacity>

                    </View>

                    <View style={{ flex: 1 }}>
                        <ScrollView style={{}} contentContainerStyle={{ padding: remify(30), flexGrow: 1 }}>
                            <Text style={styles.copyrighttextheader}>About Teddy</Text>
                            <Text
                                style={styles.copyrighttext}>{"Teddy is a research tool created by the MIT Media Lab affective computing group and the Center for Healthy Minds at the University of Wisconsin-Madison."}</Text>

                            <Text style={styles.copyrighttext}>Please see our <Text style={{ color: "blue" }}
                                                                                    onPress={() => Linking.openURL("https://teddy.media.mit.edu/privacy/")}>Privacy
                                Policy</Text> for information about what data we do and do not collect.</Text>
                            <Text
                                style={styles.copyrighttext}>{"Teddy the Bear was originally created by Juan Carlos Cruz, aka "}
                                <Text style={{ color: "blue" }}
                                      onPress={() => Linking.openURL("https://rive.app/blog/animated-login-screen-design")}>{"JcToon at Rive"}</Text>
                                {" and has been modified under the Creative Commons License "}
                                <EntypoIcon
                                    name={"creative-commons"}
                                    style={{ fontSize: remify(18) }} />
                                {"."}
                            </Text>

                            <Text
                                style={styles.copyrighttext}>{"Viral videos are presented under Fair Use in Copyright and are intended for the sole purpose of research. We do not claim any rights over viral video content. All rights reserved to the respective video copyright owners, as credited."}</Text>

                            <Text
                                style={styles.copyrighttext}>{"App version 1.1.7"}</Text>

                        </ScrollView>
                    </View>

                </View>
            </SafeAreaView>
        </View>

    </View>);
});
