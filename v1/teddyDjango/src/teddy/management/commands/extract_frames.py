from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from teddy.models import AppSession
import os
import cv2
import shlex, subprocess, json
from pymediainfo import MediaInfo
from multiprocessing import Pool
import time
import math
import multiprocessing as mp
mp.set_start_method('fork')

SECONDS_PER_FRAME = 10

class PickleableSession(object):
    def __init__(self, session):
        self.video_recording = session.video_recording_file.path if session.video_recording_file else None
        self.story_recording = session.story_recording_file.path if session.story_recording_file else None
        self.key = session.key
        self.project_name = session.project_name
        self.user_id = session.user_id


def get_tagged_rotation(file_path_with_file_name):
    """
    Function to get the rotation of the input video file.
    Adapted from gist.github.com/oldo/dc7ee7f28851922cca09/revisions using the ffprobe comamand by Lord Neckbeard from
    stackoverflow.com/questions/5287603/how-to-extract-orientation-information-from-videos?noredirect=1&lq=1

    Returns a rotation None, 90, 180 or 270
    """
    cmd = "ffprobe -loglevel error -select_streams v:0 -show_entries side_data=rotation -of default=nw=1:nk=1"
    args = shlex.split(cmd)
    args.append(file_path_with_file_name)
    # run the ffprobe process, decode stdout into utf-8 & convert to JSON
    ffprobe_output = subprocess.check_output(args).decode('utf-8')
    if len(ffprobe_output) > 0:  # Output of cmdis None if it should be 0
        ffprobe_output = json.loads(ffprobe_output)
        rotation = ffprobe_output

    else:
        rotation = 0

    return rotation


def check_video_rotation(video_path):
    media_info = MediaInfo.parse(video_path)
    rotation = 0
    for track in media_info.tracks:
        if track.track_type == "Video":
            rotation = int(float(track.rotation))
            continue

    rotation -= get_tagged_rotation(video_path)
    rotate_code = None
    if rotation == 90:
        rotate_code = cv2.ROTATE_90_CLOCKWISE
    elif rotation == 180:
        rotate_code = cv2.ROTATE_180
    elif rotation == 270:
        rotate_code = cv2.ROTATE_90_COUNTERCLOCKWISE

    return rotate_code


def export_video_frames(encrypted_video_path, session):
    if not os.path.exists(encrypted_video_path):
        return 0

    video_path = encrypted_video_path.replace("/teddy_media/", '/decrypted_media/').replace(".enc", "")

    output_path = os.path.join(video_path.replace('.mov', '').replace('.mp4', ''), 'images')
    if os.path.exists(output_path):
        return 0
    os.makedirs(output_path)

    print("Extracting frames for session", session.key, "by user", session.project_name + "/" + session.user_id)

    rotate_code = check_video_rotation(video_path)

    frame = 0
    vidcap = cv2.VideoCapture(video_path)
    frame_count = vidcap.get(cv2.CAP_PROP_FRAME_COUNT)
    fps = vidcap.get(cv2.CAP_PROP_FPS)
    duration = frame_count / fps

    success, image = vidcap.read()
    success = True
    while success and frame * SECONDS_PER_FRAME <= duration:
        if rotate_code:
            image = cv2.rotate(image, rotate_code)

        cv2.imwrite(os.path.join(output_path, f"{frame:04d}.png"), image)
        frame = frame + 1
        vidcap.set(cv2.CAP_PROP_POS_MSEC, (frame * 1000 * SECONDS_PER_FRAME))
        success, image = vidcap.read()
    return 1

def export_session_frames(session):
    result = 0
    if session.video_recording:
        result += export_video_frames(session.video_recording, session)
    if session.story_recording:
        result += export_video_frames(session.story_recording, session)

    return result



class Command(BaseCommand):
    help = "Extracts frames from each video"

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

        print(f"Extracting frames from sessions")
        start_time = time.time()
        with Pool(50) as p:
            result = p.map(export_session_frames, sessions)
        total_files = sum(result)
        end_time = time.time()
        print(f"Frame extraction from {total_files} files completed in {math.floor(end_time - start_time)} seconds")

