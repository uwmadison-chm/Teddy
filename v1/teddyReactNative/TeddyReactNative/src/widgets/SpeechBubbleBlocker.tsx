import { useEffect, useRef, useState } from "react";
import { SafeAreaView, TouchableWithoutFeedback, View } from "react-native";
import { styles } from "../styles/Style";
import Rive from "rive-react-native";
import { Button, Text } from "react-native-paper";
import * as React from "react";
import emitter from "tiny-emitter/instance";

export default () => {
    const [isUp, setIsUp] = useState(false);

    useEffect(() => {
        // Update the document title using the browser API
        emitter.on("speechbubble", function(isPlaying) {
            setIsUp(isPlaying);
        });
        return () => {
            emitter.off("speechbubble");
        };
    }, []);
    if (!isUp) {
        return <View />;
    }

    return (
        <View style={{
            position: "absolute",
            zIndex: 10000,
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        }}>
            <TouchableWithoutFeedback
                onPress={() => {
                    emitter.emit("speechbubbleautocomplete");
                }}
            >
                <View
                    style={{ width: "100%", height: "100%" }} />
            </TouchableWithoutFeedback>
        </View>
    );
};
