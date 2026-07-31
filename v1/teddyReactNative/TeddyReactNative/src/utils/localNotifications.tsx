import notifee, { RepeatFrequency, TimestampTrigger, TriggerType } from "@notifee/react-native";
import { Platform } from "react-native";
import PushNotificationIOS from "@react-native-community/push-notification-ios";

const NOTIFICATION_TITLE = "Teddy Reminder";
const NOTIFICATION_BODY = "Please complete your Teddy recording session!";
export const NOTIFICATION_SETTINGS = {
  channelId: "teddy",
};

export function unscheduleLocalNotifications() {
  notifee.cancelAllNotifications();
  if (Platform.OS == "ios") {
    PushNotificationIOS.cancelAllLocalNotifications();
  }
}

export function scheduleLocalNotification(nextFireDate) {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: nextFireDate.getTime(),
  };

  try {
    notifee.createTriggerNotification({
      title: NOTIFICATION_TITLE,
      body: NOTIFICATION_BODY,
      android: {
        channelId: NOTIFICATION_SETTINGS.channelId,
        smallIcon: "iconsmall",
        color: "#ffffff",
        // pressAction is needed if you want the notification to open the app when pressed
        pressAction: {
          launchActivity: "default",
          id: "default",
        },
      },

    }, trigger);
    console.log("Local notification scheduled for", nextFireDate);
  } catch (e) {
    console.log(e);
  }

}
