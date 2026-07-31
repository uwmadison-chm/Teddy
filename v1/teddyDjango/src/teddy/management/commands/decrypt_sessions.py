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
mp.set_start_method('fork')

crypto = VirgilCrypto()

class PickleableSession(object):
    def __init__(self, session, private_key):
        self.private_key = private_key
        self.video_recording = session.video_recording_file.path if session.video_recording_file else None
        self.story_recording = session.story_recording_file.path if session.story_recording_file else None
        self.key = session.key
        self.project_name = session.project_name
        self.user_id = session.user_id


def decrypt_file(path, session, private_key):
    if not os.path.exists(path):
        return 0

    decrypted_path = path.replace("/teddy_media/", '/decrypted_media/').replace(".enc", "")
    if os.path.exists(decrypted_path):
        return 0
    # print("Decrypting file to path:", decrypted_path)
    os.makedirs(os.path.dirname(decrypted_path), exist_ok=True)

    print("Decrypting session", session.key, "by user", session.project_name + "/" + session.user_id)
    with open(path, 'rb') as infile:
        with open(decrypted_path+".zip", "wb") as outfile:
            outfile.write(crypto.decrypt(infile.read(), private_key))

    try:
        with zipfile.ZipFile(decrypted_path+".zip", "r") as f:
            zipinfos = f.infolist()
            zipinfos[0].filename = os.path.basename(decrypted_path)
            f.extract(zipinfos[0], os.path.dirname(decrypted_path))
            # print("zip file contents", f.namelist())
            os.remove(decrypted_path + ".zip")
    except zipfile.BadZipFile:
        os.rename(decrypted_path+".zip", decrypted_path)

    print("Decrypted video file to", decrypted_path)

    return 1

def decrypt_session(session):
    private_key = crypto.import_private_key(base64.b64decode(session.private_key)).private_key
    result = 0
    if session.video_recording:
        result += decrypt_file(session.video_recording, session, private_key)
    if session.story_recording:
        result += decrypt_file(session.story_recording, session, private_key)
    return result


class Command(BaseCommand):
    help = "Decrypts videos for a user's recording session"

    def add_arguments(self, parser):
        parser.add_argument('--key', type=str, required=False)
        parser.add_argument('--user', type=str, required=False)
        parser.add_argument('--project', type=str, required=False)


    def handle(self, *args, **options):

        if not os.path.exists(settings.MEDIA_ROOT):
            print("Media Directory does not exist! Is the data drive plugged in?")
            return

        with open(os.path.join(settings.BASE_DIR, "..", "encryptionkeys", "private_key.dem")) as keyfile:
            private_key = keyfile.read()

        sessions = AppSession.objects
        if options.get("key"):
            sessions = sessions.filter(key=options.get("key"))
        if options.get("user"):
            sessions = sessions.filter(user_id=options.get("user"))
        if options.get("project"):
            sessions = sessions.filter(project_name=options.get("project"))
        sessions = sessions.all()

        sessions = [PickleableSession(session, private_key) for session in sessions]

        print(f"Decrypting sessions")
        start_time = time.time()
        with Pool(50) as p:
            result = p.map(decrypt_session, sessions)
        total_files = sum(result)
        end_time = time.time()
        print(f"Decrypting {total_files} files completed in {math.floor(end_time - start_time)} seconds")


