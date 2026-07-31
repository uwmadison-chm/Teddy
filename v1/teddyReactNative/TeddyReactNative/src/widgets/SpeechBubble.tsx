import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Image, SafeAreaView, View } from "react-native";
import { accentColor, accentColorDark, remify, styles } from "../styles/Style";
import Rive from "rive-react-native";
import { Button, Text } from "react-native-paper";
import * as React from "react";
import emitter from "tiny-emitter/instance";
import TypeWriter from "react-native-typewriter";
import Icon from "react-native-vector-icons/FontAwesome";

interface Props {
    text?: string;
    onComplete?: () => void;
    isFaceLeft?: boolean;
    textStyleOverride?: object;
    bubbleStyleOverride?: object;
}

interface Functions {
    showText: (text: string, autoShow?: boolean, callback?: () => void, maxTimeout?: number) => void;
    showTextSequence: (textArray: Array<string>, callback?: () => void, maxTimeout?: number) => void;
    blockerTapped: () => void;
    hide: () => void;
    show: () => void;
}

export default React.forwardRef<Functions, Props>((props, ref) => {
    const [isVisible, setIsVisible] = useState(true);
    const typeWriter = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isBlockerUp, setIsBlockerUp] = useState(false);
    const [text, setText] = useState("");
    const [autoShow, setAutoShow] = useState(false);
    const [extraText, setExtraText] = useState([]);
    const [shouldShowNextPageIndicator, setShouldShowNextPageIndicator] = useState(false);
    const [callback, setCallback] = useState(null);
    const [maxTimeout, setMaxTimeout] = useState(null);
    const [timeoutId, setTimeoutId] = useState(null);
    const [didTimeout, setDidTimeout] = useState(false);


    useEffect(() => {
        emitter.on("speechbubbleautocomplete", function() {
            ref["current"].blockerTapped();
        });
        setIsTyping(true);
        if (props.text) {
            setText(props.text);
        }
        return () => {
            emitter.off("speechbubbleautocomplete");
        };
    }, []);


    const cancelTimeout = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }

    };

    const setNewTimeout = () => {
        cancelTimeout();
        if (maxTimeout) {
            setTimeoutId(setTimeout(() => {
                setDidTimeout(true);
            }, maxTimeout));
        }
    };

    useEffect(() => {
        if (didTimeout) {
            blockerTapped();
            setDidTimeout(false);
        }
    }, [didTimeout]);

    useEffect(() => {
        if (isTyping) {
            setShouldShowNextPageIndicator(false);
            setIsBlockerUp(true);
            setNewTimeout();
        }
    }, [isTyping]);

    useEffect(() => {
        emitter.emit("speechbubble", isBlockerUp);
    }, [isBlockerUp]);

    useEffect(() => {
        if (autoShow) {
            typeWriter.current.setState({ visibleChars: 100000 });
            setAutoShow(false);
            setNewTimeout();
        }
    }, [autoShow]);

    const blockerTapped = () => {
        if (isTyping) {
            typeWriter.current.setState({ visibleChars: 100000 });
        } else {
            cancelTimeout();
            if (extraText.length > 0) {
                setText(extraText.shift());
                typeWriter.current.reset();
                setIsTyping(true);
                setExtraText([...extraText]);
            } else {
                setIsBlockerUp(false);
            }
        }
    };

    useImperativeHandle(ref, () => ({
        showText: (newText, autoShow, callback, maxTimeout) => {
            setText(newText);
            setCallback(() => callback);
            setMaxTimeout(maxTimeout);
            // console.log(newText, autoShow, callback, maxTimeout);
            if (autoShow) {
                setIsTyping(false);
                setAutoShow(true);
            } else {
                typeWriter.current.reset();
                setIsTyping(true);
            }
        },
        showTextSequence: (textArray, callback, maxTimeout) => {
            setText(textArray.shift());
            setCallback(() => callback);
            setMaxTimeout(maxTimeout);
            typeWriter.current.reset();
            setIsTyping(true);
            setExtraText([...textArray]);
        },
        blockerTapped: () => {
            blockerTapped();
        },
        hide: () => {
            cancelTimeout();
            setIsTyping(false);
            setIsBlockerUp(false);
            setIsVisible(false);
        },
        show: () => {
            setIsVisible(true);
        }
    }));

    return (
        <View
            style={[styles.textBubble, {
                display: isVisible ? "flex" : "none",
                paddingBottom: extraText.length > 0 && text ? remify(40) : remify(20)
            }, (props.bubbleStyleOverride ? props.bubbleStyleOverride : {})]}>
            <View style={props.isFaceLeft ? styles.speechbubbleTailParentLeft : styles.speechbubbleTailParent}>
                {/*<View style={props.isFaceLeft ? styles.speechbubbletailLeft : styles.speechbubbletail}/>*/}
                <Image style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "100%",
                    width: "100%"
                }}
                       source={props.isFaceLeft ? require("../images/speechbubbletailleft.png") : require("../images/speechbubbletail.png")} />
            </View>
            <TypeWriter ref={typeWriter} fixed typing={1} maxDelay={10} minDelay={10}
                        onTypingEnd={() => {
                            if (!isTyping) {
                                return;
                            }
                            setIsTyping(false);
                            if (extraText.length > 0 && text) {
                                setShouldShowNextPageIndicator(true);
                                return;
                            }
                            setIsBlockerUp(false);
                            if (props.onComplete) {
                                props.onComplete();
                            }
                            if (callback) {
                                callback();
                                setCallback(null);
                            }
                        }}
                        style={props.textStyleOverride ? [styles.textBubbleText, props.textStyleOverride] : styles.textBubbleText}>{text}</TypeWriter>
            <Icon name="play" size={remify(15)} color={accentColor}
                  style={[styles.speechbubbleNextIcon, { display: shouldShowNextPageIndicator ? "flex" : "none" }]} />
            <Text
                style={{
                    fontSize: remify(12),
                    position: "absolute",
                    bottom: remify(10),
                    right: remify(27),
                    color: accentColorDark,
                    // fontWeight: "bold",
                    display: shouldShowNextPageIndicator ? "flex" : "none"
                }}>Tap to Continue</Text>
        </View>
    );
});
