import { Dimensions, StyleSheet } from "react-native";
// @ts-ignore
import EStyleSheet from "react-native-extended-stylesheet";


let { height, width } = Dimensions.get("window");
console.log("Screen size:", height, width);
const remValue = Math.min(width / 392, height / 753);
EStyleSheet.build({
    $rem: remValue
});

export const remify = (value) => {
    return value * remValue;
};

export const accentColor = "#19e0c3";
export const accentColorDark = "#1a837d";

export const styles = EStyleSheet.create({
    screenContainer: {
        padding: "20rem",
        height: "100%", width: "100%",
        position: "relative"
    },
    fadingPanelSet: {
        marginHorizontal: "30rem",
        marginBottom: "40rem",
        justifyContent: "flex-end",
        position: "relative",
        height: "270rem",
        zIndex: -100
    },
    mainbutton: {
        alignSelf: "flex-end",
        borderRadius: "200rem",
        elevation: 5,
        width: "100%"
    },
    secondButton: {
        marginTop: "20rem"
    },
    buttonText: {
        fontSize: "22rem",
        paddingVertical: "10rem",
        color: "white"
    },
    cancelbuttonContainer: {
        marginTop: "25rem",
        marginHorizontal: "30rem"
    },
    cancelbutton: {
        alignSelf: "flex-end",
        borderRadius: "200rem",
        elevation: 5,
        width: "100%",
        backgroundColor: "#ccc"
    },
    cancelButtonText: {
        fontSize: "20rem",
        paddingVertical: "7rem",
        color: "white"
    },
    reminderText: {
        marginBottom: "10rem",
        alignContent: "center",
        alignSelf: "center",
        fontSize: "16rem"
    },
    reminderCancelbuttonContainer: {
        marginTop: "20rem",
        marginHorizontal: "30rem",
        marginBottom: "-20rem"
    },
    stackedbutton: {
        alignSelf: "flex-end",
        marginTop: "5rem",
        elevation: "5rem",
        borderRadius: "8rem",
        width: "100%"
    },
    stackedButtonText: {
        lineHeight: "18rem",
        fontSize: "18rem",
        paddingVertical: "15rem",
        marginTop: "5rem",
        marginBottom: "0rem",
        color: "white",
        alignSelf: "stretch",
        textAlign: "center"
    },
    stackedbuttonTop: {
        borderTopLeftRadius: "20rem",
        borderTopRightRadius: "20rem"
    },
    stackedbuttonBottom: {
        borderBottomLeftRadius: "20rem",
        borderBottomRightRadius: "20rem"
    },
    stackedbutton1: {
        backgroundColor: accentColor
    },
    stackedbutton2: { backgroundColor: "#3bb4a2" },
    stackedbutton3: { backgroundColor: "#50938a" },
    stackedbutton4: {
        backgroundColor: "#648683"
    },
    portraitContainer: {
        position: "relative",
        height: "150rem",
        width: "100%",
        alignSelf: "center",
        marginBottom: "40rem",
        marginTop: "40rem",
        zIndex: 100
    },
    portraitFrame: {
        borderRadius: 1000,
        aspectRatio: 1,
        overflow: "hidden",
        height: "100%",
        alignSelf: "center",
        elevation: 3,
        shadowColor: "black",
        shadowOpacity: .1,
        shadowRadius: "3rem",
        shadowOffset: { width: 0, height: "1rem" }

    },
    fillParent: { width: "100%", height: "100%" },
    textBubble: {
        zIndex: 2000,
        position: "absolute",
        top: "100%",
        marginTop: "30rem",
        left: "20rem",
        right: "20rem",
        elevation: 5,
        borderRadius: "15rem",
        paddingVertical: "20rem",
        paddingHorizontal: "25rem",
        backgroundColor: "white",
        shadowColor: "black",
        shadowOpacity: .2,
        shadowRadius: "5rem",
        shadowOffset: { width: 0, height: "2rem" }
    },
    textBubbleText: {
        fontSize: "24rem",
        lineHeight: "32rem",
        textAlign: "center"
    },
    speechbubbleTailParent: {
        width: "70rem",
        height: "30rem",
        position: "absolute",
        top: "-29.9rem",
        left: "50%",
        marginLeft: "-70rem",
        overflow: "hidden"
    },
    speechbubbleTailParentLeft: {
        width: "70rem",
        height: "30rem",
        position: "absolute",
        top: "-29.9rem",
        left: "70rem",
        overflow: "hidden"
    },
    speechbubbleNextIcon: {
        position: "absolute",
        right: "10rem",
        bottom: "10rem"
    },
    cameraPreviewContainer: {
        position: "absolute",
        height: "145rem",
        aspectRatio: 1,
        alignSelf: "flex-end"
    },
    cameraPreviewFrame: {
        position: "absolute",
        height: "100%",
        aspectRatio: 1,
        borderRadius: "10000rem",
        overflow: "hidden",
        elevation: 5,
        shadowColor: "black",
        shadowOpacity: .1,
        shadowRadius: "3rem",
        shadowOffset: { width: 0, height: "1rem" }
    },
    cameraPreviewRecordingIndicator: {
        position: "absolute",
        bottom: "-15rem",
        zIndex: 1000,
        alignSelf: "center",
        elevation: 5,
        backgroundColor: "white",
        borderColor: accentColorDark,
        borderWidth: "2rem",
        borderRadius: "100rem",
        paddingRight: "15rem",
        paddingLeft: "15rem",
        paddingVertical: "5rem",
        shadowColor: "black",
        shadowOpacity: .2,
        shadowRadius: "5rem",
        shadowOffset: { width: 0, height: "2rem" }
    },
    cameraCharacterPortraitContainer: {
        position: "relative",
        height: "150rem",
        width: "100%",
        marginBottom: "40rem",
        marginTop: "40rem",
        zIndex: 2000
    },
    movieContainer: {
        position: "absolute",
        alignSelf: "center",
        top: "300rem",
        zIndex: 1500,
        borderRadius: "10rem",
        width: "100%",
        elevation: 5,
        padding: "10rem",
        justifyContent: "center",
        alignContent: "center",
        // margin: '-10rem',
        backgroundColor: "white",
        shadowColor: "black",
        shadowOpacity: .2,
        shadowRadius: "5rem",
        shadowOffset: { width: 0, height: "2rem" }
    },
    movieContainerZoomed: {
        position: "absolute",
        alignSelf: "center",
        top: "250rem",
        zIndex: 1500,
        left: "0rem",
        right: "0rem",
        elevation: 5,
        padding: "10rem",
        justifyContent: "center",
        alignContent: "center",
        // margin: '-10rem',
        backgroundColor: "white",
        shadowColor: "black",
        shadowOpacity: .2,
        shadowRadius: "5rem",
        shadowOffset: { width: 0, height: "2rem" }
    },
    movieVideo: {
        // alignSelf: "center",
        width: "100%",
        aspectRatio: 1.7
    },
    movieVideoZoomed: {
        width: "140%",
        aspectRatio: 1.7,
        marginLeft: "-20%"
    },
    movieFader: {
        position: "absolute",
        top: "-20rem",
        left: "-20rem",
        right: "-20rem",
        bottom: "-80rem",
        backgroundColor: "white",
        zIndex: 1600
    },
    movieTitle: {
        fontSize: "18rem",
        lineHeight: "20rem",
        // fontWeight: "300",
        marginTop: "4rem",
        marginBottom: "8rem",
        marginLeft: "5rem",
        marginRight: "60rem"
    },
    movieCredit: {
        color: "#888",
        fontSize: "14rem",
        textAlign: "right",
        marginTop: "5rem",
        marginBottom: "2rem"
    },
    movieZoomButton: {
        position: "absolute",
        right: "-10rem",
        top: "-12rem",
        padding: 0,
        zIndex: 700,
        borderRadius: 0
    },
    movieZoomButtonText: {
        fontSize: "25rem",
        color: accentColorDark,
        fontWeight: "600",
        padding: 0,
        margin: 0
    },
    movieZoomButtonContent: {
        height: "50rem",
        width: "50rem",
        padding: 0,
        margin: 0,
        borderRadius: 0
    },
    countdownText: { fontSize: "50rem", color: accentColor, fontWeight: "600" },
    checkboxlabel: {
        color: "black",
        marginRight: 5,
        fontSize: 15,
        alignContent: "center",
        lineHeight: 35,
        justifyContent: "center"
    },
    checkboxContainer: {
        elevation: 3,
        backgroundColor: "white",
        borderRadius: 1000,
        paddingHorizontal: 5,
        paddingRight: 8,
        paddingVertical: 0,
        shadowColor: "black",
        shadowOpacity: .1,
        shadowRadius: "3rem",
        shadowOffset: { width: 0, height: "1rem" }
    },
    faceCoveringToggleContainer: {
        flexDirection: "row",
        position: "absolute",
        top: "-50rem",
        left: "0rem",
        zIndex: 500000
    },
    loginPortraitContainer: {
        position: "relative",
        height: "120rem",
        width: "100%",
        alignSelf: "center",
        marginBottom: "40rem",
        marginTop: "0rem",
        zIndex: 100,
        transform: [{ scaleY: remify(1) }, { scaleX: remify(1) }]
    },
    loginTextStyleOverride: {
        fontSize: "20rem",
        lineHeight: "28rem"
    },
    loginSpeechBubbleStyleOverride: {
        paddingVertical: "15rem",
        marginTop: "20rem"
    },
    loginContainer: {
        marginHorizontal: "30rem",
        marginTop: "100rem",
        position: "relative"
    },
    loginButtonContainer: {
        position: "absolute",
        zIndex: 40,
        alignContent: "center",
        justifyContent: "center",
        right: 0,
        top: 0,
        bottom: 25,
        width: "40rem"
    },
    loginButton: {
        elevation: 0,
        top: 1.8,
        bottom: 10.6,
        right: 2,
        width: 30,
        color: "white",
        position: "absolute",
        shadowOpacity: 0,
        borderTopRightRadius: 5000,
        borderBottomRightRadius: 5000,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0
    },
    loginButtonText: {
        paddingRight: 5,
        lineHeight: 32,
        fontSize: 20,
        alignSelf: "center",
        color: "white",
        alignContent: "center",
        justifyContent: "center"
    },
    uploadSpinnerContainer: {
        position: "absolute",
        bottom: "80rem",
        left: 0,
        right: 0,
        zIndex: 100,
        height: "300rem",
        justifyContent: "center",
        alignContent: "center"
    },
    copyrighttext: {
        textAlign: "center",
        fontSize: "16rem",
        lineHeight: "26rem",
        paddingBottom: "20rem"
    },
    copyrighttextheader: {
        textAlign: "center",
        fontSize: "20rem",
        fontWeight: "bold",
        lineHeight: "26rem",
        paddingBottom: "20rem"
    }
});

