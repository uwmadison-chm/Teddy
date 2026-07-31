import * as React from "react";
import { Button, Text } from "react-native-paper";
import { Platform, SafeAreaView, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
// import AsyncStorage from "@react-native-community/async-storage";
import { styles } from "../styles/Style";
import uuid from "react-native-uuid";
import slugify from "react-slugify";

const HelplineScreen = ({ navigation }) => {

    useEffect(() => {
        if (Platform.OS == "android") {
            StatusBar.setBackgroundColor("white");
        }
    }, []);

    return <SafeAreaView>
        <View
            style={{
                padding: 20,
                height: "100%", width: "100%",
                position: "relative",
                justifyContent: "center",
                paddingBottom: 100
            }}>
            <Text>TODO</Text>
        </View>
    </SafeAreaView>;

};

export default HelplineScreen;
