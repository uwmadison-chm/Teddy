from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from teddy.models import AppSession
import os
import sys
import json
from tabulate import tabulate

TEST_IDS = ["10000", "10001", "10264", "10265", "10267"]


class Command(BaseCommand):
    help = "Outputs what data we could or couldn't get for each session's videos"

    def add_arguments(self, parser):
        parser.add_argument('--key', type=str, required=False)
        parser.add_argument('--user', type=str, required=False)
        parser.add_argument('--project', type=str, required=False)


    @staticmethod
    def verify_data(encrypted_video_path):
        video_path = encrypted_video_path.replace("/teddy_media/", '/decrypted_media/').replace(".enc", "")

        face_data_path = os.path.join(video_path.replace('.mov', '').replace('.mp4', ''), 'images', "faces.json")

        transcript_path = os.path.join(video_path.replace('.mov', '').replace('.mp4', ''), 'text', 'transcript.txt')

        faces = 0
        if os.path.exists(face_data_path):
            with open(face_data_path, "r") as f:
                face_data = json.load(f)
                if face_data:
                    faces = sum([value is not None for value in face_data]) / len(face_data)

        word_count = 0
        if os.path.exists(transcript_path):
            with open(transcript_path, "r") as f:
                words = f.read().split()
                word_count = len(words)

        return {"Face Percentage": faces, "Transcript Words": word_count}


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
        sessions = sessions.order_by("project_name", "user_id").exclude(user_id__in=TEST_IDS).all()

        results = []
        for session in sessions:
            if session.video_recording_file:
                row = Command.verify_data(session.video_recording_file.path)
                row["Type"] = "video"
                row["Project"] = session.project_name
                row["User"] = session.user_id
                row["Transcript Words"] = ""
                results.append(row)
            if session.story_recording_file:
                row = Command.verify_data(session.story_recording_file.path)
                row["Type"] = "story"
                row["Project"] = session.project_name
                row["User"] = session.user_id
                results.append(row)

        # headers = ["Project", "User", "Type", "Face Percentage", "Transcript Words"]
        # print(tabulate([[result[header] for header in headers] for result in results], headers=headers))

        story_videos = [x for x in results if x["Type"] == "story" and len(x["User"]) > 4]
        video_videos = [x for x in results if x["Type"] == "video" and len(x["User"]) > 4]
        print("Total story videos:", len(story_videos))
        print("Percent of story videos with mostly visible faces:", len([x for x in story_videos if x["Face Percentage"] >= .5]) / len(story_videos))
        print("Percent of story videos with >25 words:", len([x for x in story_videos if x["Transcript Words"] > 25]) / len(story_videos))
        print()

        print("Total video videos:", len(video_videos))
        print("Percent of video videos with mostly visible faces:", len([x for x in video_videos if x["Face Percentage"] >= .5]) / len(video_videos))

