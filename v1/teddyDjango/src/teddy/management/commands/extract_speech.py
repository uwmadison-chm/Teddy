from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from teddy.models import AppSession
import os
import sys
import speech_recognition as sr
from multiprocessing import Pool
import time
import math
import multiprocessing
multiprocessing.set_start_method('fork')
import subprocess


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


def export_audio_and_transcript(encrypted_video_path, session):
    if not os.path.exists(encrypted_video_path):
        return 0

    video_path = encrypted_video_path.replace("/teddy_media/", '/decrypted_media/').replace(".enc", "")

    output_path = os.path.join(video_path.replace('.mov', '').replace('.mp4', ''), 'text')
    if os.path.exists(output_path):
        return 0
    os.makedirs(output_path, exist_ok=True)

    print("Extracting audio for session", session.key, "by user", session.project_name + "/" + session.user_id)

    audio_path = os.path.join(output_path, "..", "audio.wav")
    command = f"ffmpeg -i \"{video_path}\" -y \"{audio_path}\""
    subprocess.call(command, shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.STDOUT)

    # initialize the recognizer
    r = sr.Recognizer()

    print("Detecting speech for session", session.key, "by user", session.project_name + "/" + session.user_id)
    # open the file
    with sr.AudioFile(audio_path) as source:
        # listen for the data (load audio to memory)
        audio_data = r.record(source)
        # recognize (convert from speech to text)
        try:
            text = r.recognize_google(audio_data, language="en-US")
            with open(os.path.join(output_path, "transcript.txt"), "w") as f:
                f.write(text)
        except:
            print(f"No speech found for session {session.key}!")

    return 1

def export_session_audio_and_transcript(session):
    result = 0
    if session.video_recording:
        result += export_audio_and_transcript(session.video_recording, session)
    if session.story_recording:
        result += export_audio_and_transcript(session.story_recording, session)

    return result

class Command(BaseCommand):
    help = "Extracts speech as text file from each video"

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

        print(f"Extracting audio and speech from sessions")
        start_time = time.time()
        with Pool(50) as p:
            result = p.map(export_session_audio_and_transcript, sessions)
        total_files = sum(result)
        end_time = time.time()
        print(f"Audio and speech extraction from {total_files} files completed in {math.floor(end_time - start_time)} seconds")

