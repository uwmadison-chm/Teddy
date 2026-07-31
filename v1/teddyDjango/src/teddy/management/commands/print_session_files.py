from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from teddy.models import AppSession
import os
from virgil_crypto import VirgilCrypto
import base64
from virgil_crypto.keys.key_pair_type import KeyPairType
import zipfile
from multiprocessing import Pool
import time
import math
import multiprocessing as mp



class Command(BaseCommand):
    help = "Prints video filenames recording sessions"

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

        for session in sessions:
            if session.video_recording_file:
                print(f"./{session.video_recording_file}")
            if session.story_recording_file:
                print(f"./{session.story_recording_file}")



