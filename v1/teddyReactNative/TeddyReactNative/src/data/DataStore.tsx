import uuid from "react-native-uuid";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFetchBlob from "rn-fetch-blob";
import { NetInfoStateType } from "@react-native-community/netinfo";
import DeviceInfo from "react-native-device-info";

const currentSession = {};
const projectInfo = {};
const previousSessions = [];
let currentVideoIndex = 0;
let greetingOverride = null;
let deepLink = null;

const CURRENT_VIDEO_INDEX = "currentVideoIndex";
const SAVED_DATASTORES = "SAVED_DATASTORES";
const SAVED_PROJECT_INFO = "SAVED_PROJECT_INFO";
const SESSION_STATE = "sessionState";

export const SESSION_TYPES = ["all", "story", "video"];

const HOSTNAME = "[FIXME:MY HOSTNAME]"; // FIXME: Customize this

export enum SessionState {
    start = "start",
    videoRecordingComplete = "videoRecordingComplete",
    complete = "complete",
    uploaded = "uploaded",
    finalRatingFailed = "finalRatingFailed",
    finished = "finished",
}

// FIXME: Create your video list of this template
const TEMPLATE_VIDEOS = [
    {
        video: require("../videos/[VIDEONAME].mp4"), // Path to your video file
        view: "6 million", // A user-readable description of the number of views. Doesn't need to be exact/real
        id: "myvideo", // The id of the video
        duration: "1 minute", // User-readable length of the video
        title: "Test Video", // Video's name
        credit: "Best Videos Plus" // Who made the video?
    },
];
const MISC_VIDEOS = [
];
const ALL_VIDEOS = { "template": TEMPLATE_VIDEOS, "misc": MISC_VIDEOS };

let all_videos = [];
for (const key in ALL_VIDEOS) {
    all_videos = all_videos.concat(ALL_VIDEOS[key]);
}
ALL_VIDEOS["all"] = all_videos;

const ALL_VIDEOS_BY_ID = Object.assign({}, ...Object.values(ALL_VIDEOS).flat().map((x) => ({ [x.id]: x })));

function get(object, key, default_value) {
    var result = object[key];
    return (typeof result !== "undefined") ? result : default_value;
};

export const generateVideosList = (projectInfo) => {
    if (projectInfo["videoList"]) {
        return projectInfo["videoList"];
    }
    var videos = [];
    videos.push(...ALL_VIDEOS[get(projectInfo, "videoSet", "misc")]); // FIXME: Change the default value if you want
    videos = videos.map(({ id }) => id);
    if (projectInfo["randomizeVideos"]) {
        videos = videos.map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    }
    projectInfo["videoList"] = videos;
    return videos;
};

export const incrementAndSaveCurrentVideoIndex = () => {
    currentVideoIndex += 1;
    AsyncStorage.setItem(CURRENT_VIDEO_INDEX, currentVideoIndex.toString());
};

export const getVideosList = () => {
    let myVideos = projectInfo["videoList"];
    if (!myVideos) {
        myVideos = generateVideosList(projectInfo);
        AsyncStorage.setItem(SAVED_PROJECT_INFO, JSON.stringify(projectInfo));
    }
    return myVideos;
};
export const getCurrentVideo = () => {
    var myVideos = getVideosList();
    return ALL_VIDEOS_BY_ID[myVideos[getSessionData(CURRENT_VIDEO_INDEX) % myVideos.length]];
};

export const saveProjectInfo = async (serverPInfo) => {
    for (var member in projectInfo) delete projectInfo[member];
    projectInfo["videoSet"] = serverPInfo["video_set"];
    projectInfo["randomizeVideos"] = serverPInfo["randomize_videos"];
    projectInfo["projectName"] = serverPInfo["project_name"];
    generateVideosList(projectInfo);

    await AsyncStorage.setItem(SAVED_PROJECT_INFO, JSON.stringify(projectInfo));
};
export const loadSavedProjectInfo = async () => {
    const loadedString = await AsyncStorage.getItem(SAVED_PROJECT_INFO);
    if (loadedString) {
        const pInfo = JSON.parse(loadedString);
        for (var member in projectInfo) delete projectInfo[member];
        for (var member in pInfo) projectInfo[member] = pInfo[member];
        delete projectInfo["videoList"];
        generateVideosList(projectInfo);
    }
    return projectInfo;
};

export const getCurrentDeepLink = () => {
    return deepLink;
};

export const setCurrentDeepLink = (url) => {
    deepLink = url;
};

export const isSectionInType = (sessionType) => {
    return !currentSession["sessionType"] || currentSession["sessionType"] == "all" || currentSession["sessionType"] == sessionType;
};

export const getInstallationId = async () => {
    let installation_id = await AsyncStorage.getItem("installationId");
    if (!installation_id) {
        installation_id = uuid.v4().toString();
        await AsyncStorage.setItem("installationId", installation_id);
    }
    return installation_id;
};

export const createNewSession = async (newUserId, projectName, sessionLabel, sessionType, nextURL) => {

    const savedUserId = await AsyncStorage.getItem("userId") || "";
    const savedProjectName = await AsyncStorage.getItem("projectName") || "";

    let storedVideoIndex = await AsyncStorage.getItem(CURRENT_VIDEO_INDEX);
    if (storedVideoIndex) {
        currentVideoIndex = Number(storedVideoIndex);
    }

    for (var member in currentSession) delete currentSession[member];
    currentSession["userId"] = newUserId || savedUserId;
    currentSession["currentVideoIndex"] = currentVideoIndex;
    currentSession["sessionId"] = uuid.v4();
    currentSession[SESSION_STATE] = SessionState.start;
    currentSession["sessionStartTime"] = new Date().toISOString();
    currentSession["AppVersion"] = DeviceInfo.getReadableVersion();
    currentSession["sessionLabel"] = sessionLabel;
    currentSession["sessionType"] = sessionType;
    currentSession["installationID"] = await getInstallationId();
    currentSession["projectName"] = projectName || savedProjectName;
    currentSession["nextURL"] = nextURL;

    if (currentSession["userId"] !== savedUserId) {
        await AsyncStorage.setItem("userId", currentSession["userId"]);
    }
    if (currentSession["projectName"] !== savedProjectName) {
        await AsyncStorage.setItem("projectName", currentSession["projectName"]);
    }

    const projectInfo = await loadSavedProjectInfo();
    if (!projectInfo["videoSet"] || projectInfo["projectName"] != currentSession["projectName"]) {
        try {
            const projectInfoResult = await getProjectInfo(currentSession["projectName"]) as string;
            const parsedResult = JSON.parse(projectInfoResult);
            if (parsedResult && parsedResult["success"]) {
                await saveProjectInfo(parsedResult);
            }
        } catch (e) {
        }
    }
    var myVideos = getVideosList();
    currentSession["currentVideo"] = myVideos[currentVideoIndex % myVideos.length];
    currentSession["videoList"] = projectInfo["videoList"];

    console.log("Initial projectInfo:", projectInfo);
    console.log("Initial datastore:", currentSession);
    if (currentSession["userId"]) {
        await uploadDataToServer(currentSession, null).then(() => {

        }).catch(() => {

        });
    }

    return currentSession["userId"];
};

export const saveSessionData = async (key, value) => {
    currentSession[key] = value;
};

export const getSessionData = (key) => {
    return currentSession[key];
};

export const getCurrentSession = () => {
    return currentSession;
};

export const saveSessionState = async (value: SessionState) => {
    currentSession[SESSION_STATE] = value;
    await saveCurrentSessionToDisk();
};

export const getCurrentSessionState = () => {
    return currentSession[SESSION_STATE];
};

export const saveCurrentSessionToDisk = async () => {
    if (!currentSession["sessionId"]) {
        return;
    }
    const previousDataStores = await checkForPreviousSessions();
    const previousDataStoresCached = [...previousDataStores];
    for (const previousSession of previousDataStoresCached) {
        if (previousSession["sessionId"] == currentSession["sessionId"]) {
            removeItem(previousSessions, previousSession);
        }
    }
    previousDataStores.push(currentSession);
    console.log("Saving current session to disk", previousDataStores);
    await AsyncStorage.setItem(SAVED_DATASTORES, JSON.stringify(previousDataStores));
};

export const checkForPreviousSessions = async () => {
    let savedDataStores = [];
    previousSessions.length = 0;
    const loadedString = await AsyncStorage.getItem(SAVED_DATASTORES);
    if (loadedString) {
        savedDataStores = JSON.parse(loadedString);
    }
    previousSessions.push(...savedDataStores);
    return previousSessions;
};


const addRecording = async (session, body, prefix) => {
    const filename = session[prefix + "RecordingFilename"];
    console.log("Recording URI:", filename);
    if (!filename || session[prefix + "RecordingUploaded"]) {
        return;
    }
    try {
        console.log("Adding video", await RNFetchBlob.fs.stat(`${RNFetchBlob.fs.dirs.DocumentDir}/` + filename));
    } catch (e) {
        logEvent("VideoMissing-" + prefix);
        session[prefix + "RecordingUploaded"] = true;
        return;
    }

    const video = {
        uri: `file://${RNFetchBlob.fs.dirs.DocumentDir}/` + filename,
        type: "application/octet-stream",
        name: prefix + "recording" + (filename.includes(".mp4.enc") ? ".mp4" : ".mov") + ".enc"
    };
    // @ts-ignore
    body.append(prefix + "Recording", video);
};
export const uploadDataToServer = (session, onProgress) => {
    return new Promise(async function(resolve, reject) {
        const body = new FormData();

        body.append("userId", session["userId"]);
        body.append("sessionId", session["sessionId"]);
        body.append("sessionStartTime", session["sessionStartTime"]);
        body.append("data", JSON.stringify(session));

        await addRecording(session, body, "video");
        await addRecording(session, body, "story");

        const xhr = new XMLHttpRequest();

        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                console.log("Upload Data Success", xhr.responseText);

                for (const prefix in ["video", "story"]) {
                    if (session[prefix + "RecordingFilename"]) {
                        try {
                            RNFetchBlob.fs.unlink(`${RNFetchBlob.fs.dirs.DocumentDir}/` + session[prefix + "RecordingFilename"]);
                        } catch (e) {
                            console.log(e);
                        }
                        session[prefix + "RecordingUploaded"] = true;
                    }
                }
                session[SESSION_STATE] = SessionState.uploaded;

                resolve(xhr.response);
            } else {
                logEvent("uploadFailed-response");
                reject({
                    description: "Session upload failed",
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function() {
            logEvent("uploadFailed-error");
            reject({
                description: "Session upload errored",
                status: this.status,
                statusText: xhr.statusText
            });
        };

        if (onProgress != null) {
            xhr.upload.onprogress = (event) => {
                onProgress(event.loaded / event.total);
            };
        }

        xhr.open("POST", HOSTNAME + "upload/");
        const response = xhr.send(body);
    });
};
export const uploadFinalSessionDataToServer = (session) => {
    return new Promise(function(resolve, reject) {

        const body = new FormData();

        body.append("userId", session["userId"]);
        body.append("sessionId", session["sessionId"]);
        body.append("finalResponse", session["finalResponse"]);

        const xhr = new XMLHttpRequest();

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                session[SESSION_STATE] = SessionState.finished;
                resolve(xhr.response);
            } else {
                session[SESSION_STATE] = SessionState.finalRatingFailed;
                reject({
                    description: "Final response upload failed",
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function(e) {
            session[SESSION_STATE] = SessionState.finalRatingFailed;
            console.error("Request error", e);
            reject({
                description: "Final response upload errored",
                status: this.status,
                statusText: xhr.statusText
            });
        };

        xhr.open("POST", HOSTNAME + "finalresponse/");
        // xhr.setRequestHeader("Keep-Alive", "timeout=0,max=0")
        xhr.send(body);
    });

};

export const getPreviousSessionsToUpload = async () => {
    await checkForPreviousSessions();
    const sessions = [];
    for (const session of previousSessions) {
        if (session[SESSION_STATE] == SessionState.complete || session[SESSION_STATE] == SessionState.videoRecordingComplete || session[SESSION_STATE] == SessionState.finalRatingFailed) {
            sessions.push(session);
        }
    }
    console.log("Loading sessions to upload:", sessions);
    return sessions;
};

export const getPreviousUnratedSessionsToUpload = async () => {
    await checkForPreviousSessions();
    const sessions = [];
    for (const session of previousSessions) {
        if (session[SESSION_STATE] == SessionState.finalRatingFailed) {
            sessions.push(session);
        }
    }
    return sessions;
};

export const tryToUploadPastSessions = (onProgress) => {
    return new Promise(function(resolve, reject) {
        (async () => {
            for (const session of previousSessions) {
                if (session[SESSION_STATE] == SessionState.complete || session[SESSION_STATE] == SessionState.videoRecordingComplete) {
                    await uploadDataToServer(session, onProgress).catch((reason) => {

                    });
                } else if (session[SESSION_STATE] == SessionState.finalRatingFailed) {
                    await uploadFinalSessionDataToServer(session).catch((reason) => {

                    });
                }
            }
            await deleteUploadedSessions();
            const remainingSessions = await getPreviousSessionsToUpload();
            console.log("remaining sessions to upload", remainingSessions);
            if (remainingSessions.length) {
                reject();
            } else {
                resolve(true);
            }
        })();
    });
};

export const finishPreviouslyUnratedSessionsInBackground = async () => {
    const sessionsToComplete = await getPreviousUnratedSessionsToUpload();
    for (const session of sessionsToComplete) {
        await uploadFinalSessionDataToServer(session);
    }
    await deleteUploadedSessions();

};

export const deleteUploadedSessions = async () => {
    const sessions = [...previousSessions];
    for (const session of sessions) {
        if (session[SESSION_STATE] == SessionState.uploaded || session[SESSION_STATE] == SessionState.finished) {
            removeItem(previousSessions, session);
            for (const prefix in ["video", "story"]) {
                if (session[prefix + "RecordingFilename"]) {
                    try {
                        await RNFetchBlob.fs.unlink(`${RNFetchBlob.fs.dirs.DocumentDir}/` + session[prefix + "RecordingFilename"]);
                    } catch (e) {
                        console.log(e);
                    }
                    session[prefix + "RecordingUploaded"] = true;
                }
            }
        }
    }
    console.log("Saving sessions after removing finished ones:", JSON.stringify(previousSessions));
    await AsyncStorage.setItem(SAVED_DATASTORES, JSON.stringify(previousSessions));
};

export const canUploadData = (networkState) => {
    console.log("Network state", networkState);
    console.log("Network state", networkState.type == NetInfoStateType.cellular);
    console.log("Network state", networkState.details.isConnectionExpensive);
    console.log("Network state", !networkState.isConnected);
    console.log("Network state", networkState.isInternetReachable === false);
    console.log("Network state", networkState["isWifiEnabled"] === false);

    const cannotUpload = (networkState.type == NetInfoStateType.cellular
        || networkState.details.isConnectionExpensive
        || !networkState.isConnected
        || networkState.isInternetReachable === false
        || networkState["isWifiEnabled"] === false);

    console.log("Network state cannot upload", cannotUpload);

    return !cannotUpload;
};

function removeItem<T>(arr: Array<T>, value: T): Array<T> {
    const index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}


export function getGreetingOverride() {
    return greetingOverride;
}

export function setGreetingOverride(override) {
    greetingOverride = override;
}


export const loginToServer = (userId, password) => {
    return new Promise(function(resolve, reject) {

        const body = new FormData();

        body.append("userId", userId);
        body.append("password", password);

        const xhr = new XMLHttpRequest();

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    description: "Final response upload failed",
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function(e) {
            console.error("Request error", e);
            reject({
                description: "Final response upload errored",
                status: this.status,
                statusText: xhr.statusText
            });
        };

        xhr.open("POST", HOSTNAME + "applogin/");
        // xhr.setRequestHeader("Keep-Alive", "timeout=0,max=0")
        xhr.send(body);
    });

};


export const getProjectInfo = (projectName) => {
    return new Promise(function(resolve, reject) {

        const xhr = new XMLHttpRequest();

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    description: "Getting Project Info failed",
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function(e) {
            console.error("Request error", e);
            reject({
                description: "Getting Project Info errored",
                status: this.status,
                statusText: xhr.statusText
            });
        };

        xhr.open("GET", HOSTNAME + "projectinfo/?projectName=" + encodeURIComponent(projectName));
        xhr.send();
    });

};


export const logEvent = (event) => {
    fetch(HOSTNAME + "logevent/", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userId: currentSession["userId"],
            sessionId: currentSession["sessionId"],
            session: JSON.stringify(currentSession),
            event: event
        })
    }).then(r => {

    }).catch((r) => {
        console.log(r);
    });
};
