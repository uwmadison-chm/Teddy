# TeddyDjango V1

## Overview

This is the backend for the TeddyReactNative project. It is a traditional Django app. For information about how to run and modify Django applications, please read the excellent [Django Tutorial](https://www.djangoproject.com/start/).

## Setup

Copy `src/passwords-template.py` to a new file, `src/passwords.py`. Fill out all fields appropriately.

By default, the project assumes you're running a MySQL database. If you choose not to, please update `src/project/settings.py` accordingly. Create and setup a database according to the values you put in `passwords.py`

If you wish to use a virtual environment, make one with the command `python3.9 -m venv env`, then `source env/bin/activate` to enter the environment.

From there, make sure you have all the Python libraries installed with `pip install virgil_crypto_lib-0.16.0-cp39-cp39-macosx_11_0_arm64.whl; pip install -r requirements.txt`

There are extra python libraries required to run the analysis scripts (see the [Custom Django Commands](#custom-django-commands) below). Run `pip install -r analysis-requirements.txt`

Next, set up your logging environment so it can create logs. By default you'll want to run the command: `sudo mkdir /var/log/django; sudo chmod 777 /var/log/django` (this can be modified in `src/project/settings.py`)

Install all the database tables: `python src/manage.py migrate`.

By default, the Teddy App encrypts all videos before sending them to the server. You'll want to create the encryption files. `python src/manage.py generate_keypairs`. Copy the output for the private key file in DEM format into a new file, `encryptionkeys/private_key.dem`.

**Note**: You will need the "Public Key PEM Format" in the React Native project so the app can encrypt the files. You'll want to keep that handy!

You'll want to create an admin superuser in the Django admin console for yourself with the command `python src/manage.py createsuperuser`.



Now you should be all set up to run locally! Just run `runserver` and access the site via http://localhost:8000/admin/

# Custom Django Commands

We've provided some utility functions. All of which can be run with `python src/manage.py [COMMAND_NAME]`

* `decrypt_file`: This command takes a file and decrypts it using the private key created in the setup instructions.
* `decrypt_sessions`: This command takes a user ID, a session ID, or a study ID. It then decrypts all files for all applicable sessions. This is the key command to use to access all the encrypted saved data.
* `extract_frames`: The face detection command below requires inputs from frames. This command lets you preprocess that information and save key frames from each video recording.
* `detect_face_data`: This command is useful for telling how many of your saved videos actually contain faces.
* `extract_speech`: A utility command that extracts the speech from video recordings and saves the transcript as text. Useful for telling how many of your videos actually contain speech.
* `generate_database_csv`: Used for exporting the entire database as a CSV
* `generate_keypairs`: See the Setup instructions above. This generates the data encryption/decryption keys the app will need.
* `print_session_file_existence`: Simply prints all video files to the command line. Useful if you want to pipe this into another command to do on each file.
* `verify_data_integrity`: To be used after `extract_frames`, `detect_face_data`, and `extract_speech`, this is a VERY useful script that will tell you overall how many videos contain faces and/or speech. It's great for monitoring your users at a high level.

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
