# Teddy V1 React Native

## React Native Setup

The following instructions are for MacOS only.

First, if you don't already have it, install [Homebrew](https://brew.sh/). Then run `brew update` to make sure it's updated.

Install some tools Node will need to build.

```
brew upgrade
brew cleanup
brew install node
brew install npm
brew install node
brew install watchman
brew install yarn
```

Now, make sure you have the git project cloned locally. `cd` into the main directory of the project (it'll be the directory of this file).

Install the javascript library dependencies. `yarn install`

Complete the sections "Getting Setup for iOS development" or "Getting Setup for Android development" depending on what you need.

Finally, if anything doesn't work, check out the [React Native installation instructions](https://reactnative.dev/docs/environment-setup). Most of those instructions were copied here, but if you get stuck, you can try to follow those instructions and be sure you're following the "Native CLI Quickstart". Do not do the Expo installation instructions! Once you get to the section titled "Creating a new application" you're set.

## Configuring the App

1. Put any video files you want to use in `src/videos`
2. Add the video descriptions using the format from `TEMPLATE_VIDEOS` in [src/data/DataStore.tsx](TeddyReactNative/src/data/DataStore.tsx)
3. Within the same [DataStore File](TeddyReactNative/src/data/DataStore.tsx) update the `HOSTNAME` variable, and customize your video lists anywhere with a `FIXME` note.
4. In [src/screens/CameraScreen.tsx](TeddyReactNative/src/screens/CameraScreen.tsx) update the `publicKeyRaw` variable. Fill it in with the "Public key .pem format" output from when you generated the encryption keys in the Django project.
5. Update the `applicationId` within [The Android gradle build file](TeddyReactNative/android/app/build.gradle)
6. Add `google_services.json` and `GoogleServices-Info.plist` files. [Google Services Setup Instructions Are Here](https://firebase.google.com/docs/android/setup)
7. Change your production keystore info in [gradle.properties](TeddyReactNative/android/gradle.properties) or directly in [build.gradle](TeddyReactNative/android/app/build.gradle)

## Getting Setup for iOS development

Install the correct version of Ruby that Cocoapods will run with. Make sure you're in the project directory!

```
brew install rbenv
rbenv install 2.7.6
rbenv local 2.7.6
echo "export PATH="$HOME/.rbenv/bin:$PATH" >>  ~/.zshrc
echo "eval \"$(rbenv init -)\"" >>  ~/.zshrc
exec $SHELL -l
```

Install the packager you'll need and your Cocoapods files.

```
gem install bundle
rbenv rehash
bundle install
bundle exec pod repo update
cd ios
bundle exec pod update hermes-engine --no-repo-update
bundle exec pod install
```

On your iPhone, make sure you have Developer Mode enabled. Settings -> Privacy & Security -> Developer Mode.

Open XCode. Go to File -> Open. Navigate to the base directory of this project, and then open the file `ios/TeddyReactNative.xcworkspace`. Note the extension! Do not open the .xcodeproj file, but the .xcworkspace file. XCode is lovely.

Click on the "TeddyReactNative" with the blue squarish icon in the left pane of XCode. In the new window that opens, select the "Signing and Capabilities" tab. The "Team" dropdown will show an error. Log in to the appropriate account to be able to build the project.

In the very middle top of the screen, click where it says "iPhone" and then in the dropdown that appears, select your phone. There will be an error about needing a provisioning profile. Click it.

## Getting Setup for Android development

TBD. You will need an Android development environment set up. It's unclear how to do this from scratch, since I already had one set up. Once you have Android SDKs installed, there are no extra steps like there are for iOS.

## Useful Commands

* Run the iOS development app on a connected iPhone: `npx react-native run-ios --device`
* Run the iOS development app on a connected Android phone (or an Emulator if one isn't connected): `npx react-native run-android`
* Build a production version of the app as an APK that can be installed on your phone or sent to others to install: `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/ && rm -rf android/app/src/main/res/drawable-* && rm -rf android/app/src/main/res/raw/*.mp4 && cd android && ./gradlew assembleRelease && cd .. && echo "Created APK at android/app/build/outputs/apk/release/app-release.apk"`
* Install the APK you created with the command above: `adb install android/app/build/outputs/apk/release/app-release.apk`
* Builds an app bundle of the production version of the app that you can upload to the app store: `cd android && ./gradlew bundleRelease && cd .. && echo \"Created bundle at android/app/build/outputs/bundle/release/app.aab\"`
* Install the app bundle you created above: `cd android/app/build/outputs/bundle/release && rm app-release.apks && bundletool build-apks --bundle=app-release.aab --output=app-release.apks --ks=[KEYSTORE FILEPATH] --ks-pass=[KEYSTORE PASSWORD]--ks-key-alias=[KEY ALIAS] --key-pass=[KEY PASSWORD] && bundletool install-apks --apks=app-release.apks && cd ../../../../../..`
* Test the deeplink functionality: `npx uri-scheme open affectteddy://testproject/testuser/testsession/https%3A%2F%2F[YOUR URL HERE]%2Fs%2Fsomething --android`
* Reset app permissions (useful for testing the permissions part of the app): `adb shell pm revoke edu.mit.media.affect.teddy android.permission.POST_NOTIFICATIONS && adb shell pm clear-permission-flags edu.mit.media.affect.teddy android.permission.POST_NOTIFICATIONS user-set && adb shell pm clear-permission-flags edu.mit.media.affect.teddy android.permission.POST_NOTIFICATIONS user-fixed`

* To build production versions of the iOS app, open the project in XCode (again, using the .xcworkspace file) and press the big "play" button in the upper left. To upload the app to the App Store, follow standard XCode archiving/uploading procedures.

# Licenses

MIT License

Copyright (c) [2026] [MIT Media Lab]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction privileges, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The Teddy character is used under [Creative Commons 4.0](https://creativecommons.org/licenses/by/4.0/) from [JcToon at Rive](https://rive.app/community/520-990-teddy-login-screen/).

