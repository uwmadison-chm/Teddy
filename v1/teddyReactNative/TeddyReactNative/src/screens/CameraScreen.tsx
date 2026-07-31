"use strict";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    View,
    Text,
    Pressable,
    Platform,
    StatusBar,
    Animated,
    SafeAreaView,
    AppState,
    Image, Easing
} from "react-native";
import { zip, unzip, unzipAssets, subscribe } from "react-native-zip-archive";
import { RNCamera } from "react-native-camera";
import {Video, Audio, InterruptionModeIOS} from "expo-av";
import { accentColor, accentColorDark, remify, styles } from "../styles/Style";
import { Button } from "react-native-paper";
import Rive from "rive-react-native";
import SpeechBubble from "../widgets/SpeechBubble";
import { FadingPanel, FadingPanelSet } from "../widgets/FadingPanelSet";
import { resourceName } from "./IntroScreen";
import SpeechBubbleBlocker from "../widgets/SpeechBubbleBlocker";
import RNFetchBlob from "rn-fetch-blob";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import SystemSetting from "react-native-system-setting";
import * as IdleTimerManager from "react-native-idle-timer";
import AudioSession from 'react-native-audio-session';

import {
    canUploadData,
    getCurrentSessionState,
    getCurrentVideo,
    getSessionData,
    incrementAndSaveCurrentVideoIndex, isSectionInType, logEvent,
    saveSessionData, saveSessionState, SessionState
} from "../data/DataStore";
import { virgilCrypto } from "react-native-virgil-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Checkbox } from "react-native-paper";
import Icon from "react-native-vector-icons/Entypo";
import { default as ZoomIcon } from "react-native-vector-icons/Foundation";
import { default as FontAwesomeIcon } from "react-native-vector-icons/FontAwesome";
import DeviceInfo from "react-native-device-info";
import { TouchableOpacity } from "react-native";

const publicKeyRaw = "[FIXME this should be the .pem output from your encryption key generated in the Django project]"
const publicKey = virgilCrypto.importPublicKey(publicKeyRaw);

let videoPlayTimeoutId = null;
let startTellingStoryTimeoutId = null;
let recordingNextStep = null;

const MOCK_CAMERA = DeviceInfo.isEmulator();
let mockCameraRecordingPrefix = null;

let faceDetectionAnimationStartTime = null;
let faceDetectionAnimationRunning = false;
const faceDetectionAnimationDuration = 1000;

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const statFile = async (file) => {
    if (Platform.OS === "ios") {
        file = file.replace("file://", "");
    }
    console.log("Stating file", file);

    return await RNFetchBlob.fs.stat(file);
};

export const handleAndEncryptVideoFile = async (video_uri, recording_prefix) => {
    console.log("Original file stat", await statFile(video_uri));
    video_uri = video_uri.replace("file://", "");

    const filename = `${getSessionData("sessionId")}_${recording_prefix}${video_uri.slice(video_uri.lastIndexOf("."))}`;
    await RNFetchBlob.fs.mv(video_uri, `${RNFetchBlob.fs.dirs.DocumentDir}/` + filename);
    console.log("Moved file to", `${RNFetchBlob.fs.dirs.DocumentDir}/` + filename);

    // const reencode = false;
    // if (reencode) {
    //     const reencodinginput = video_uri.replace("file://", "");
    //     const reencodedfile = reencodinginput.replace(".mp4", ".compressed.mp4").replace(".mov", ".compressed.mov");
    //     const reencodedfileuri = "file://" + reencodedfile;
    //
    //     console.log("File Re-encoding Start", new Date());
    //     await RNFFmpeg.execute("-i " + reencodinginput + " -vf \"scale=-1:480,fps=30\" -preset ultrafast " + reencodedfile).then();
    //     RNFetchBlob.fs.unlink(video_uri);
    //     console.log("Reencoded file stat", await statFile(reencodedfileuri));
    // }
    console.log("File Zip Start", new Date());
    const unzippedfilename = filename;
    const zippedfilename = unzippedfilename + ".zip";
    console.log("Zip output:", await zip([`${RNFetchBlob.fs.dirs.DocumentDir}/` + unzippedfilename], `${RNFetchBlob.fs.dirs.DocumentDir}/` + zippedfilename));

    await RNFetchBlob.fs.unlink(`${RNFetchBlob.fs.dirs.DocumentDir}/` + unzippedfilename);
    console.log("File Encryption Start", new Date());

    const encryptedfilename = zippedfilename + ".enc";
    await virgilCrypto.encryptFile({
        inputPath: `${RNFetchBlob.fs.dirs.DocumentDir}/` + zippedfilename,
        outputPath: `${RNFetchBlob.fs.dirs.DocumentDir}/` + encryptedfilename,
        publicKeys: publicKey
    });
    await RNFetchBlob.fs.unlink(`${RNFetchBlob.fs.dirs.DocumentDir}/` + zippedfilename);
    console.log("Encrypted file stat", await statFile(`${RNFetchBlob.fs.dirs.DocumentDir}/` + encryptedfilename));
    console.log("File Encryption Ended", new Date());
    return encryptedfilename;
};

const CameraScreen = ({ navigation }) => {
    const camera = useRef(null);
    const videoPlayer = useRef(null);

    const rivePlayer = useRef(null);
    const speechBubble = useRef(null);
    const fadingPanelSet = useRef(null);
    const faceDetectProgressBar = useRef(null);

    const latestAppState = React.useRef(AppState.currentState);

    const [cameraKey, setCameraKey] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [playVideoKey, setPlayVideoKey] = useState(0);
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);
    const [isVideoShown, setIsVideoShown] = useState(false);
    const [didRestartFromInterruptedRecording, setDidRestartFromInterruptedRecording] = useState(false);
    const [isVideoZoomedIn, setIsVideoZoomedIn] = useState(false);
    const [isFadingMovie, setIsFadingMovie] = useState(false);
    const [didRateVideo, setDidRateVideo] = useState(false);

    const [isTellingStory, setIsTellingStory] = useState(false);
    const [timerKey, setTimerKey] = useState(0);

    const [tryingToDetectFace, setTryingToDetectFace] = useState(true);
    const [successfullyDetectingFace, setSuccessfullyDetectingFace] = useState(false);
    const [faceDetectionProgress, setFaceDetectionProgress] = useState(0);

    const movieFadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
            if (Platform.OS == "android") {
                StatusBar.setBackgroundColor("white");
            }
            setTryingToDetectFace(true);
            fadingPanelSet.current.showStartPanel();
            rivePlayer.current.setInputState("teddy", "is_peering", true);
            logEvent("loadedcamerastate");

            //enable these lines and comment out the preceding block to skip to a specific part
            // setTryingToDetectFace(false);
            // startTellingStory();

            setIsTellingStory(false);
            setTimerKey(timerKey + 1);

            // close();
        }, []
    );

    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            staysActiveInBackground: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            playsInSilentModeIOS: true });
        AudioSession.setActive(true);
    });

    const [appState, setAppState] = useState(null);

    const onAppStateChange = useCallback(nextAppState => {
        setAppState(nextAppState);
    }, []);

    useEffect(() => {
        if (appState === "active") {
            console.log("came back from inactive", isRecording);
            if (isRecording) {
                console.log("restarting from scratch");
                handleResumeRecordingFromAwake();
            }
        }
    }, [appState]);

    useEffect(() => {
        AppState.addEventListener("change", onAppStateChange);

        return () => {
            AppState.removeEventListener("change", onAppStateChange);
        };
    }, [onAppStateChange]);

    const handleResumeRecordingFromAwake = () => {
        logEvent("resetsessionfromresume");
        setIsRecording(false);
        setIsPlayingVideo(false);
        setIsVideoShown(false);
        setIsTellingStory(false);
        setTimerKey(timerKey + 1);
        setCameraKey(cameraKey + 1);
        setDidStartFirstSession(false);
        setDidShowVideoPreamble(false);
        clearTimeout(videoPlayTimeoutId);
        clearTimeout(startTellingStoryTimeoutId);
        speechBubble.current.show();
        setTryingToDetectFace(true);
        setDidRestartFromInterruptedRecording(true);
        rivePlayer.current.reset();
        setTimeout(() => {
            rivePlayer.current.setInputState("teddy", "is_peering", true);
        }, 200);
        speechBubble.current.showText("Seeing if I can detect your face...", true);
        fadingPanelSet.current.showStartPanel();
    };

    const [showSilhouette, setShowSilhouette] = useState(false);

    useEffect(() => {
        (async () => {
            const result = await AsyncStorage.getItem("showSilhouette");
            setShowSilhouette(result == "true");
        })();
    }, []);

    useEffect(() => {
        IdleTimerManager.setIdleTimerDisabled(true);
        return () => {
            IdleTimerManager.setIdleTimerDisabled(false);
        };
    }, []);

    const toggleSilhouette = () => {
        setShowSilhouette(!showSilhouette);
        AsyncStorage.setItem("showSilhouette", !showSilhouette ? "true" : "false");
    };

    const startRecording = async (recordingPrefix) => {
        mockCameraRecordingPrefix = recordingPrefix;
        if (camera) {
            saveSessionData(recordingPrefix + "RecordingStartTime", new Date().toISOString());
            saveSessionData(recordingPrefix + "RecordingStartShowSilhouette", showSilhouette);
            setIsRecording(true);
            recordingNextStep = null;
            logEvent("startedrecording" + recordingPrefix);
            const cameraPromise = camera.current.recordAsync({ quality: "480p" });
            const { uri } = await cameraPromise;
            console.info(uri);
            logEvent("stoppedrecording" + recordingPrefix);
            if (recordingNextStep != null) {

                setIsRecording(false);
                saveSessionData(recordingPrefix + "RecordingEndTime", new Date().toISOString());
                saveSessionData(recordingPrefix + "RecordingEndShowSilhouette", showSilhouette);
                const encryptedFilename = await handleAndEncryptVideoFile(uri, recordingPrefix);
                console.log("Encrypted file uri", encryptedFilename);
                saveSessionData(recordingPrefix + "RecordingFilename", encryptedFilename);

                if (recordingNextStep == "story") {
                    onAfterStoryRecordingProcessed(encryptedFilename);
                }
                if (recordingNextStep == "video") {
                    onAfterVideoRecordingProcessed(encryptedFilename);
                }
                logEvent("finishedprocessingrecording" + recordingPrefix);
            } else {
                RNFetchBlob.fs.unlink(uri);
                console.log("movie recording ended weirdly. killing the recording file.");
                videoPlayer.current.stopAsync();
                clearTimeout(videoPlayTimeoutId);
                saveSessionData(recordingPrefix + "RecordingError" + new Date(), true);
                logEvent("killedrecording" + recordingPrefix);
            }
            setCameraKey(cameraKey + 1);
            // uploadFileToServer(encryptedUri);
        }
    };
    const stopRecording = (recordingFinishStep) => {
        // if (MOCK_CAMERA) {
        //     if (mockCameraRecordingPrefix == "story") {
        //         askAboutUploadingFiles();
        //     }
        // }
        recordingNextStep = recordingFinishStep;
        speechBubble.current.show();
        speechBubble.current.showText("Encrypting your recording for safe keeping...", true);
        videoPlayer.current.stopAsync();
        camera.current.stopRecording();
    };

    const fadeInVideo = () => {
        clearTimeout(videoPlayTimeoutId);
        setIsVideoShown(true);
        movieFadeAnim.setValue(1);
        setIsFadingMovie(true);
        fadingPanelSet.current.fadeOutPanel();
        speechBubble.current.hide();
        rivePlayer.current.setInputState("teddy", "watch_movie", true);
        Animated.timing(
            movieFadeAnim,
            {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }
        ).start(() => {
            setIsFadingMovie(false);
            playVideo();
        });
    };

    const fadeOutVideo = () => {
        rivePlayer.current.setInputState("teddy", "watch_movie", false);
        movieFadeAnim.setValue(0);
        setIsFadingMovie(true);
        Animated.timing(
            movieFadeAnim,
            {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }
        ).start(() => {
            setIsFadingMovie(false);
            stopRecording("video");
            setIsVideoShown(false);
        });
    };

    const onAfterVideoRecordingProcessed = (videoURI) => {
        showPostVideoText();
    };

    const playVideo = async () => {
        await videoPlayer.current.replayAsync();
        setPlayVideoKey(playVideoKey + 1);
        setIsPlayingVideo(true);
    };

    const onVideoPlaybackStatusUpdate = (playbackStatus) => {
        if (playbackStatus.didJustFinish && isRecording) {
            fadeOutVideo();
        }
    };

    const onFaceDetected = ({ faces }) => {
        // console.log(faces)
        if (tryingToDetectFace) {
            if (faces[0]) {
                setSuccessfullyDetectingFace(true);
            } else {
                setSuccessfullyDetectingFace(false);
                faceDetectionAnimationRunning = false;
                faceDetectionAnimationStartTime = null;
            }
        }
    };

    const animateProgressBar = useCallback((amount) => {
        // console.log("Face detection progress:", amount);
        // setFaceDetectionProgress(amount * 100);
        faceDetectProgressBar.current.animate(amount * 100, 0, Easing.step0);
    }, [setFaceDetectionProgress]);

    const faceDetectAnimationCompleteCallback = useCallback(() => {
        setFaceDetectionProgress(0);
        setSuccessfullyDetectingFace(false);
        showStartRecordingText(true);
    }, []);

    useEffect(() => {
        if (successfullyDetectingFace && faceDetectionAnimationStartTime == null) {
            faceDetectionAnimationRunning = true;
            faceDetectionAnimationStartTime = Date.now();
            requestAnimationFrame(function animate(timestamp) {
                const now = Date.now();
                if (!faceDetectionAnimationRunning) {
                    animateProgressBar(0);
                    faceDetectionAnimationStartTime = null;
                    return;
                }
                if (now - faceDetectionAnimationStartTime >= faceDetectionAnimationDuration) {
                    animateProgressBar(1);
                    setTimeout(() => {
                        faceDetectAnimationCompleteCallback();
                        faceDetectionAnimationRunning = false;
                    }, 25);
                    faceDetectionAnimationStartTime = null;
                    return;
                }
                if (animateProgressBar != null) {
                    animateProgressBar((now - faceDetectionAnimationStartTime) / faceDetectionAnimationDuration);
                }

                requestAnimationFrame(animate);
            });
        } else {
            faceDetectionAnimationRunning = false;

        }
    }, [successfullyDetectingFace]);

    useEffect(() => {
        if (tryingToDetectFace) {
            speechBubble.current.showText("Seeing if I can detect your face...", true);
            fadingPanelSet.current.showStartPanel();
        }
    }, [speechBubble]);

    const onSpeechBubbleComplete = () => {
    };

    const showStartRecordingText = (wasDetected) => {
        saveSessionData("automaticallyDetectedFace", wasDetected);
        setSuccessfullyDetectingFace(false);
        faceDetectionAnimationStartTime = null;
        setTryingToDetectFace(false);
        fadingPanelSet.current.fadeOutPanel();
        if (didRestartFromInterruptedRecording) {
            setDidRestartFromInterruptedRecording(false);
            speechBubble.current.showTextSequence(["Looks like our last recording was interrupted, so we have to start it over...",
                "We'll get it this time! Please try to keep the app open until the recording is finished.",
                "Now then, let's get back to recording!"
            ], () => {
                if (getCurrentSessionState() == SessionState.videoRecordingComplete) {
                    fadingPanelSet.current.fadeInPanel("startstoryrecording");
                } else {
                    fadingPanelSet.current.fadeInPanel("startrecording");
                }
                // console.log("callback called?")
            });
            return;
        }
        rivePlayer.current.setInputState("teddy", "is_peering", false);
        setTimeout(() => {
            rivePlayer.current.fireState("teddy", "success");
        }, 400);
        speechBubble.current.showTextSequence([wasDetected ? "Ahh there you are! You're looking great!" : "Okay!\nPlease make sure you're visible and well lit!",
            "Now then, let's start recording."
        ], () => {
            fadingPanelSet.current.fadeInPanel("startrecording");
            // console.log("callback called?")
        });
    };

    const [didStartFirstSession, setDidStartFirstSession] = useState(false);
    const startFirstSession = () => {
        if (didStartFirstSession) {
            return;
        }
        setDidStartFirstSession(true);
        if (isSectionInType("video")) {
            showVideoPreamble();
        } else {
            showStoryPreamble();
        }
    };

    const [didShowVideoPreamble, setDidShowVideoPreamble] = useState(false);
    const showVideoPreamble = (wasDetected?) => {
        if (didShowVideoPreamble) {
            return;
        }
        setDidShowVideoPreamble(true);

        startRecording("video");

        fadingPanelSet.current.fadeOutPanel();
        const viewsText = getCurrentVideo().view;
        const durationText = getCurrentVideo().duration;
        rivePlayer.current.fireState("teddy", "slightly_happy");

        (async () => {
            const volume = await SystemSetting.getVolume();
            console.log("Current Volume", volume);

            const textSequence = [
                `I have a ${durationText} video for you to watch.`,
                `It's got ${viewsText} views on Youtube, and it's supposed to be super funny!`,
                volume > 0.1 ? "I hope it makes you smile!" : "You'll want to turn your volume up to hear it!"
            ];

            speechBubble.current.showTextSequence(textSequence, () => {
                fadingPanelSet.current.fadeInPanel("startmovie");
                videoPlayTimeoutId = setTimeout(() => {
                    fadeInVideo();
                }, 8000);
            }, 8000);

        })();

    };

    const showPostVideoText = () => {
        (async () => {
            speechBubble.current.show();
            await timeout(10);
            fadingPanelSet.current.fadeInPanel("movierate");
            speechBubble.current.showText("So, what'd you think?!", false, () => {
                console.log("showing movie rating");
            });

        })();
    };

    const rateVideo = (rating) => {
        if (didRateVideo) {
            return;
        }
        setDidRateVideo(true);
        const ratingResponses = ["Thanks for your feedback! We'll try to find better videos.",
            "Thanks for your feedback! Hopefully the next one will be better!",
            "Glad you liked it!",
            "I thought so too!!!"];
        const teddyReactions = ["sadness",
            null,
            "slightly_happy",
            "success"];
        saveSessionData("videoRating", rating);
        saveSessionState(SessionState.videoRecordingComplete);
        incrementAndSaveCurrentVideoIndex();
        if (teddyReactions[rating]) {
            rivePlayer.current.fireState("teddy", teddyReactions[rating]);
        }
        fadingPanelSet.current.fadeOutPanel();
        if (isSectionInType("story")) {
            speechBubble.current.showTextSequence([ratingResponses[rating], "Okay. You're almost done. Let's start recording again for the last task."], () => {
                fadingPanelSet.current.fadeInPanel("startstoryrecording");
            });
        } else {
            askAboutUploadingFiles([ratingResponses[rating]]);
        }
    };

    const showStoryPreamble = () => {

        startRecording("story");

        speechBubble.current.showText("Please tell me about an emotional experience, pleasant or unpleasant, that you had in the last 24 hours.", false, () => {
            startTellingStoryTimeoutId = setTimeout(() => {
                startTellingStory();
            }, 8000);
        });
        fadingPanelSet.current.fadeInPanel("startstory");
    };

    const [didStartTellingStory, setDidStartTellingStory] = useState(false);
    const startTellingStory = () => {
        if (didStartTellingStory) {
            return;
        }
        setDidStartTellingStory(true);
        setIsTellingStory(true);
        clearTimeout(startTellingStoryTimeoutId);
        rivePlayer.current.setInputState("teddy", "is_listening", true);
        // setTimeout(() => {
        // }, 1500);
        fadingPanelSet.current.fadeInPanel("storycountdown");
    };

    const finishTellingStory = () => {
        rivePlayer.current.setInputState("teddy", "is_listening", false);
        setIsTellingStory(false);
        stopRecording("story");
        fadingPanelSet.current.fadeOutPanel();
    };

    const onAfterStoryRecordingProcessed = (videoURI) => {
        askAboutUploadingFiles(["Thank you for sharing."]);
    };

    const askAboutUploadingFiles = (firstLines: string[] = []) => {
        saveSessionData("sessionEndTime", new Date().toISOString());
        saveSessionState(SessionState.complete);
        (async () => {
            const networkState = await NetInfo.fetch();
            if (!canUploadData(networkState)) {
                let totalSize = 0;
                for (const recordingPrefix of ["video", "story"]) {
                    const stat = await statFile(`${RNFetchBlob.fs.dirs.DocumentDir}/` + getSessionData(recordingPrefix + "RecordingFilename"));
                    if (stat && stat.size) {
                        totalSize += stat.size;
                    }
                }
                const sizembs = Math.ceil(totalSize / 1000000);
                console.log("Total Upload Size", sizembs);

                speechBubble.current.showTextSequence(firstLines.concat(["Now we just have to upload your recordings for safe keeping.", "Unfortunately, it looks like you're not on wifi at the moment...", `Are you sure you want to upload your ${sizembs} MB of recordings right now?`]), () => {
                    fadingPanelSet.current.fadeInPanel("uploadNotOnWifi");
                });

            } else {
                speechBubble.current.showTextSequence(firstLines.concat(["Now we just have to upload your recordings for safe keeping."]), () => {
                    fadingPanelSet.current.fadeInPanel("upload");
                });
            }

        })();

    };

    const [didClose, setDidClose] = useState(false);
    const close = () => {
        if (didClose) {
            return;
        }
        setDidClose(true);
        navigation.navigate("UploadScreen");
    };

    const closeButDontUpload = () => {
        if (didClose) {
            return;
        }
        setDidClose(true);
        navigation.navigate("FinishScreen");
    };

    const countdownChildren = ({ remainingTime }) => {

        return <Text style={styles.countdownText}>{remainingTime}</Text>;
    };

    const RenderCam = () => {
        return <RNCamera
            key={cameraKey}
            ref={camera}
            style={styles.fillParent}
            keepAudioSession={true}
            captureAudio={true}
            defaultVideoQuality={RNCamera.Constants.VideoQuality["4:3"]}
            type={RNCamera.Constants.Type.front}
            flashMode={RNCamera.Constants.FlashMode.on}
            onFacesDetected={onFaceDetected}
            onFaceDetectionError={(error) => {
                console.log("ERROR", error);
            }
            }
            androidCameraPermissionOptions={{
                title: "Permission to use camera",
                message: "We need your permission to use your camera",
                buttonPositive: "Ok",
                buttonNegative: "Cancel"
            }}
            androidRecordAudioPermissionOptions={{
                title: "Permission to use audio recording",
                message: "We need your permission to use your audio",
                buttonPositive: "Ok",
                buttonNegative: "Cancel"
            }}
        />;
    };

    function RenderVideo() {
        return <View
            style={[isVideoZoomedIn ? styles.movieContainerZoomed : styles.movieContainer, {
                display: isVideoShown ? "flex" : "none"
            }]}>
            <View style={{}}>
                <Text style={styles.movieTitle}>{getCurrentVideo().title}</Text>
                <Video
                    source={getCurrentVideo().video}   // Can be a URL or a local file.
                    ref={videoPlayer}
                    resizeMode="contain"
                    onPlaybackStatusUpdate=
                        {(playbackStatus) => onVideoPlaybackStatusUpdate(playbackStatus)}
                    style={isVideoZoomedIn ? styles.movieVideoZoomed : styles.movieVideo} />
                <Text style={styles.movieCredit}><Icon name="youtube" /> {getCurrentVideo().credit}</Text>
                <Button style={styles.movieZoomButton}
                        mode="text"
                        compact
                        contentStyle={styles.movieZoomButtonContent}
                        labelStyle={styles.movieZoomButtonText}
                        onPress={() => {
                            setIsVideoZoomedIn(!isVideoZoomedIn);
                        }}
                ><ZoomIcon style={styles.movieZoomButtonText}
                           name={isVideoZoomedIn ? "zoom-out" : "zoom-in"} /></Button>
            </View>
            <View style={{
                position: "absolute",
                width: remify(400),
                bottom: remify(-50),
                alignSelf: "center",
                zIndex: 100

            }}>
                <View style={{
                    borderColor: accentColorDark,
                    borderWidth: remify(2),
                    borderRadius: 500,
                    alignSelf: "center",
                    backgroundColor: "white",
                    shadowColor: "black",
                    shadowOpacity: .2,
                    shadowRadius: remify(5),
                    shadowOffset: { width: 0, height: remify(2) },
                    elevation: 5
                }}>
                    <Text style={{
                        paddingVertical: remify(6),
                        paddingHorizontal: remify(25),
                        fontWeight: "600",
                        textAlign: "center",
                        textAlignVertical: "center",

                        color: accentColorDark, fontSize: remify(14)
                    }}>Please stay visible while recording!</Text>

                </View>
            </View>

            <Animated.View
                style={[styles.movieFader, {
                    opacity: movieFadeAnim,
                    display: isFadingMovie ? "flex" : "none"
                }]}>


            </Animated.View>
        </View>;
    }

    return (
        <View style={styles.fillParent}>
            <SafeAreaView>


                <View style={[styles.screenContainer, {}]}>
                    <View style={{ flex: 2 }}>
                        <View style={[styles.cameraCharacterPortraitContainer, {}]}>


                            <View style={{
                                height: "100%",
                                width: "100%",
                                position: "absolute",
                                zIndex: -2
                            }}>
                                <View style={[styles.portraitFrame, { alignSelf: "flex-start" }]}>
                                    <Rive autoplay stateMachineName={"teddy"} resourceName={resourceName}
                                          ref={rivePlayer}
                                          style={styles.fillParent} />
                                </View>
                            </View>
                            <View style={{
                                height: "100%",
                                aspectRatio: 1,
                                left: 0,
                                top: 0,
                                position: "absolute",
                                zIndex: -1, overflow: "visible"
                            }}>
                                <AnimatedCircularProgress
                                    size={remify(40)}
                                    width={remify(20)}
                                    fill={0}
                                    rotation={0}
                                    tintColor={accentColor}
                                    style={{
                                        display: successfullyDetectingFace ? "flex" : "none",
                                        position: "absolute",
                                        zIndex: 5,
                                        left: "50%",
                                        bottom: remify(-20),
                                        marginLeft: remify(-20)
                                    }}
                                    ref={faceDetectProgressBar}
                                    backgroundColor="rgba(0,0,0,0)" />

                            </View>
                            <SpeechBubble
                                bubbleStyleOverride={{ marginTop: remify(35) }}
                                isFaceLeft={true}
                                ref={speechBubble}
                                onComplete={onSpeechBubbleComplete} />

                            <View style={[styles.cameraPreviewContainer, {}]}>
                                <View
                                    style={[styles.cameraPreviewRecordingIndicator, {
                                        display: isRecording ? "flex" : "none",
                                        opacity: isRecording ? 100 : 0
                                    }]}>
                                    <View style={{
                                        flexDirection: "row",
                                        justifyContent: "flex-start",
                                        alignContent: "flex-start"
                                    }}>
                                        <View style={{
                                            paddingRight: remify(10), justifyContent: "center",
                                            alignContent: "center"
                                        }}>
                                            <Icon style={{ alignSelf: "center" }} name="video-camera" size={remify(15)}
                                                  color={accentColorDark} />
                                        </View>
                                        <View style={{
                                            justifyContent: "center",
                                            alignContent: "center"
                                        }}>
                                            <Text style={{
                                                color: accentColorDark,
                                                fontSize: remify(13),
                                                fontWeight: "600",
                                                alignSelf: "center"
                                            }}>Recording</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={[styles.cameraPreviewFrame, {}]}>
                                    <View style={styles.fillParent}>
                                        {RenderCam()}
                                        <Image style={{
                                            tintColor: showSilhouette ? "rgba(255,255,255,1)" : "transparent",
                                            alignSelf: "center",
                                            height: "100%",
                                            width: "100%",
                                            position: "absolute"
                                        }} source={require("../images/silhouette.png")} />
                                    </View>

                                </View>
                                {/*<View style={{*/}
                                {/*    position: "absolute",*/}
                                {/*    display: "none",*/}
                                {/*    width: remify(400),*/}
                                {/*    bottom: remify(-50),*/}
                                {/*    alignSelf: "center",*/}
                                {/*    elevation: 5,*/}
                                {/*    zIndex: 5000*/}

                                {/*}}>*/}
                                {/*    <Text style={{*/}
                                {/*        borderColor: accentColorDark,*/}
                                {/*        borderWidth: remify(2),*/}
                                {/*        borderRadius: 500,*/}
                                {/*        alignSelf: "center",*/}
                                {/*        backgroundColor: "white",*/}
                                {/*        paddingVertical: remify(5),*/}
                                {/*        paddingHorizontal: remify(15),*/}
                                {/*        fontWeight: "600",*/}
                                {/*        textAlign: "center",*/}
                                {/*        textAlignVertical: "center",*/}
                                {/*        color: accentColorDark, fontSize: remify(14)*/}
                                {/*    }}>Please stay in frame!</Text>*/}
                                {/*</View>*/}
                            </View>
                            <View style={[styles.faceCoveringToggleContainer, {}]}>
                                <View style={styles.checkboxContainer}>
                                    <TouchableOpacity style={{
                                        flexDirection: "row"
                                    }} onPress={toggleSilhouette}>
                                        <Checkbox.Android
                                            status={showSilhouette ? "checked" : "unchecked"}
                                        />
                                        <Text style={styles.checkboxlabel}>Show Face Cover</Text>
                                    </TouchableOpacity>

                                </View>
                            </View>

                        </View>
                    </View>
                    <View style={{ flex: 4 }} />


                    <FadingPanelSet ref={fadingPanelSet}>
                        <FadingPanel label={null}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="face-man"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    showStartRecordingText(false);
                                }}>
                                I'm Here!
                            </Button>
                        </FadingPanel>

                        <FadingPanel label={"startrecording"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="record"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={startFirstSession}>
                                Record Away!
                            </Button>
                        </FadingPanel>

                        <FadingPanel label={"startmovie"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="movie-filter"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    fadeInVideo();
                                }}>
                                Sounds Great!
                            </Button>
                        </FadingPanel>

                        <FadingPanel label={"movierate"}>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton1, styles.stackedbuttonTop]}
                                mode="contained"
                                labelStyle={styles.stackedButtonText}
                                onPress={() => {
                                    rateVideo(3);
                                }}>
                                Hilarious!
                            </Button>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton2]}
                                mode="contained"
                                labelStyle={styles.stackedButtonText}
                                onPress={() => {
                                    rateVideo(2);
                                }}>
                                Funny
                            </Button>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton3]}
                                mode="contained"
                                labelStyle={styles.stackedButtonText}
                                onPress={() => {
                                    rateVideo(1);
                                }}>
                                ...Meh.
                            </Button>
                            <Button
                                style={[styles.stackedbutton, styles.stackedbutton4, styles.stackedbuttonBottom]}
                                mode="contained"
                                labelStyle={styles.stackedButtonText}
                                onPress={() => {
                                    rateVideo(0);
                                }}>
                                Not funny at all.
                            </Button>
                        </FadingPanel>

                        <FadingPanel label={"startstoryrecording"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="video"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    showStoryPreamble();
                                }}>
                                Resume!
                            </Button>
                        </FadingPanel>

                        <FadingPanel label={"startstory"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="timer"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    startTellingStory();
                                }}>
                                Start the Timer!
                            </Button>
                        </FadingPanel>

                        <FadingPanel label={"storycountdown"}>
                            <View style={{
                                marginBottom: remify(50),
                                alignSelf: "center",
                                position: "relative"
                            }}
                            >
                                <CountdownCircleTimer
                                    size={remify(180)}
                                    isPlaying={isTellingStory}
                                    isLinearGradient={true}
                                    duration={__DEV__ ? 6 : 90}
                                    key={timerKey}
                                    trailColor="transparent"
                                    colors={[[accentColor, 0], [accentColorDark, 1]]}
                                    onComplete={finishTellingStory}
                                >
                                    {countdownChildren}
                                </CountdownCircleTimer>
                                <View style={{
                                    position: "absolute",
                                    width: remify(400),
                                    bottom: remify(-50),
                                    alignSelf: "center",
                                    zIndex: 100,
                                    opacity: isTellingStory ? 100 : 0
                                }}>
                                    <View style={{
                                        borderColor: accentColorDark,
                                        borderWidth: remify(2),
                                        borderRadius: 500,
                                        alignSelf: "center",
                                        backgroundColor: "white",
                                        shadowColor: "black",
                                        shadowOpacity: .2,
                                        shadowRadius: remify(5),
                                        shadowOffset: { width: 0, height: remify(2) },
                                        elevation: 5
                                    }}>
                                        <Text style={{
                                            paddingVertical: remify(6),
                                            paddingHorizontal: remify(25),
                                            fontWeight: "600",
                                            textAlign: "center",
                                            textAlignVertical: "center",

                                            color: accentColorDark, fontSize: remify(14)
                                        }}>Please stay visible while recording!</Text>

                                    </View>
                                </View>

                            </View>

                        </FadingPanel>

                        <FadingPanel label={"upload"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="cloud-upload"
                                mode="contained"
                                labelStyle={[styles.buttonText, { fontSize: remify(20) }]}
                                onPress={() => {
                                    close();
                                }}>
                                Start Uploading!
                            </Button>
                        </FadingPanel>

                        <FadingPanel label={"uploadNotOnWifi"}>
                            <Button
                                style={[styles.mainbutton]}
                                icon="cloud-upload"
                                mode="contained"
                                labelStyle={styles.buttonText}
                                onPress={() => {
                                    close();
                                }}>
                                Let's Do It!
                            </Button>
                            <View style={styles.cancelbuttonContainer}>
                                <Button
                                    style={[styles.cancelbutton]}
                                    mode="contained"
                                    labelStyle={styles.cancelButtonText}
                                    onPress={() => {
                                        closeButDontUpload();
                                    }}>
                                    I'll Upload Later
                                </Button>
                            </View>
                        </FadingPanel>

                    </FadingPanelSet>

                    {
                        RenderVideo()
                    }

                </View>

            </SafeAreaView>
            <SpeechBubbleBlocker />
        </View>
    );

};

export default CameraScreen;
