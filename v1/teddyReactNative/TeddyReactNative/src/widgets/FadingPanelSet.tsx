import * as React from "react";
import { Animated, View, ViewProps } from "react-native";
import { remify, styles } from "../styles/Style";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Button } from "react-native-paper";


export const FadingPanel = (props:any) => {
    return <View {...props} />;
};

interface Props {
    children?: React.ReactNode;
}

interface Functions {
    fadeToPanel: (text: string) => void;
    showStartPanel: () => void;
    fadeOutPanel: (callback?: () => void) => void;
    fadeInPanel: (text: string) => void;
}

export const FadingPanelSet = React.forwardRef<Functions, Props>((props, ref) => {

    const mainButtonParent = useRef(null);

    const [shownPanelkey, setShownPanelkey] = useState(null);
    const [displayBlocker, setDisplayBlocker] = useState(false);
    const buttonZoomInAnim = useRef(new Animated.Value(remify(300))).current;
    const buttonBlockerFadeAnim = useRef(new Animated.Value(1)).current;


    useEffect(() => {
        setShownPanelkey(null);
        setDisplayBlocker(false);
    }, []);

    const easeOutElastic = (x) => {
        const elasticity = 20;

        return x === 0
            ? 0
            : x === 1
                ? 1
                : Math.pow(2, -elasticity * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    };
    const showStartPanel = () => {
        setDisplayBlocker(false);
        setShownPanelkey(null);
        Animated.timing(
            buttonZoomInAnim,
            {
                toValue: 0,
                duration: 1400,
                easing: easeOutElastic,
                useNativeDriver: false
            }
        ).start();
    };
    const fadeToPanel = (panelLabel) => {
        fadeOutPanel(() => {
            fadeInPanel(panelLabel);
        });
    };
    const fadeInPanel = (panelLabel) => {
        setDisplayBlocker(true);
        buttonBlockerFadeAnim.setValue(1);
        setShownPanelkey(panelLabel);
        Animated.timing(
            buttonBlockerFadeAnim,
            {
                toValue: 0,
                duration: 500,
                useNativeDriver: true
            }
        ).start(() => {
            setDisplayBlocker(false);
        });
    };
    const fadeOutPanel = (callback) => {
        setDisplayBlocker(true);
        Animated.timing(
            buttonBlockerFadeAnim,
            {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }
        ).start(() => {
            if (callback) {
                callback();
            }
        });
    };
    useImperativeHandle(ref, () => ({

        fadeToPanel(panelLabel) {
            fadeToPanel(panelLabel);
        },
        fadeInPanel(panelLabel) {
            fadeInPanel(panelLabel);
        },
        fadeOutPanel(callback) {
            fadeOutPanel(callback);
        },
        showStartPanel() {
            showStartPanel();
        }

    }));

    return <View style={styles.fadingPanelSet}>

        {React.Children.map(props.children, (child) => {

            if (React.isValidElement(child)) {
                // @ts-ignore
                const { label } = child.props;

                const childNode = React.cloneElement(child, {
                    // @ts-ignore
                    style: [{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        justifyContent: "flex-end",
                        display: label == shownPanelkey ? "flex" : "none",
                        zIndex: 50
                    }]
                });

                if (label == null) {
                    return <Animated.View
                        ref={mainButtonParent}
                        style={{
                            position: "absolute",
                            top: buttonZoomInAnim,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            justifyContent: "flex-end",
                            display: shownPanelkey == null ? "flex" : "none",
                            zIndex: 50
                        }}>
                        {childNode}
                    </Animated.View>;
                }
                return childNode;
            }
        })}

        <View
            style={{
                position: "absolute",
                zIndex: 100,
                top: -50,
                left: -50,
                right: -50,
                bottom: -50,
                display: displayBlocker ? "flex" : "none"
            }}>
            <Animated.View
                style={{
                    backgroundColor: "white",
                    height: "100%",
                    width: "100%",
                    opacity: buttonBlockerFadeAnim
                }}>

            </Animated.View>
        </View>
    </View>;
});
