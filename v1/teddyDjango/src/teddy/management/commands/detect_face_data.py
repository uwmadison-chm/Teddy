from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from teddy.models import AppSession
import os
import sys
import shutil
import cv2
import shlex, subprocess, json
from deepface import DeepFace
from pymediainfo import MediaInfo
from multiprocessing import Pool
import time
import math
from progress.bar import Bar
import multiprocessing as mp
mp.set_start_method('fork')

class PickleableSession(object):
    def __init__(self, session):
        self.video_recording = session.video_recording_file.path if session.video_recording_file else None
        self.story_recording = session.story_recording_file.path if session.story_recording_file else None
        self.key = session.key
        self.project_name = session.project_name
        self.user_id = session.user_id

class HiddenPrints:
    def __enter__(self):
        self._original_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout.close()
        sys.stdout = self._original_stdout


def get_input_files(files, encrypted_video_path):
    if not os.path.exists(encrypted_video_path):
        return 0

    video_path = encrypted_video_path.replace("/teddy_media/", '/decrypted_media/').replace(".enc", "")

    # creating a folder for the individual frames
    input_path = os.path.join(video_path.replace('.mov', '').replace('.mp4', ''), 'images')
    output_path = os.path.join(input_path, "faces.json")
    if (not os.path.exists(input_path)) or os.path.exists(output_path):
        return 0

    input_paths = []
    for filename in os.listdir(input_path):
        key = filename.replace(".png", "")
        filename = os.path.join(input_path, filename)
        input_paths.append(filename)

    files[output_path] = input_paths

    return 1

def get_session_files(files, session):
    result = 0
    if session.video_recording:
        result += get_input_files(files, session.video_recording)
    if session.story_recording:
        result += get_input_files(files, session.story_recording)

    return result

def test(input_file):
    results = DeepFace.analyze(input_file, actions=['emotion'], enforce_detection=False, silent=True)


class Command(BaseCommand):
    help = "Detects and saves face data from frame images and saves it to a json file"

    def add_arguments(self, parser):
        parser.add_argument('--key', type=str, required=False)
        parser.add_argument('--user', type=str, required=False)
        parser.add_argument('--project', type=str, required=False)



    def handle(self, *args, **options):

        if not os.path.exists(settings.MEDIA_ROOT):
            print("Media Directory does not exist! Is the data drive plugged in?")
            return

        sessions = AppSession.objects
        if options.get("key"):
            sessions = sessions.filter(key=options.get("key"))
        if options.get("user"):
            sessions = sessions.filter(user_id=options.get("user"))
        if options.get("project"):
            sessions = sessions.filter(project_name=options.get("project"))
        sessions = sessions.all()

        sessions = [PickleableSession(session) for session in sessions]

        print(f"Loading face files for sessions")
        start_time = time.time()
        files = dict()
        total_files = sum([get_session_files(files, session) for session in sessions])
        print(f"Detecting faces for sessions")
        raw_input_files = [f for l in files.values() for f in l]
        input_files = []

        with Bar('Processing', max=len(raw_input_files)) as bar:
            for input_file in raw_input_files:
                try:
                    result = DeepFace.detectFace(input_file, target_size=(300,600))
                    input_files.append(input_file)
                except:
                    pass
                bar.next()
        print(f"Faces found for {len(input_files)} out of {len(raw_input_files)} images")
        print(f"Extracting emotion information")

        with HiddenPrints():
            results = DeepFace.analyze(input_files, actions=['emotion'])
        results_by_file = dict()
        for key, result in results.items():
            index = int(key.replace("instance_", "")) - 1
            input_file = input_files[index]
            results_by_file[input_file] = result

        for output_file, input_files in files.items():
            with open(output_file, "w") as f:
                results = [results_by_file.get(f) for f in input_files]
                json.dump(results, f)

        end_time = time.time()
        print(f"Detecting faces for {total_files} files completed in {math.floor(end_time - start_time)} seconds")
