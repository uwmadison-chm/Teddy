/**
 * @format
 */

import "react-native-gesture-handler";
import { AppRegistry, Text } from "react-native";
import App from "./App"; // './src/screens/CameraTest';
import { name as appName } from "./app.json";

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

global.Promise = require("promise");

require("promise/lib/rejection-tracking").enable({
    allRejections: true,
    onUnhandled: (id, error) => {
        console.log(id, error);
    },
});

AppRegistry.registerComponent(appName, () => App);
