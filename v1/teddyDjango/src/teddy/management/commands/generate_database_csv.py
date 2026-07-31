from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from teddy.models import AppSession
import os
import csv


class Command(BaseCommand):
    help = "Converts the latest backup SQL dump to CSV files"

    def add_arguments(self, parser):
        parser.add_argument('--project', type=str, required=False)


    def handle(self, *args, **options):

        if not os.path.exists(settings.MEDIA_ROOT):
            print("Media Directory does not exist! Is the data drive plugged in?")
            return

        sessions = AppSession.objects
        if options.get("project"):
            sessions = sessions.filter(project_name=options.get("project"))
        sessions = sessions.order_by("project_name", "user_id").all()
        sessions_by_project = {}
        for session in sessions:
            if not sessions_by_project.get(session.project_name):
                sessions_by_project[session.project_name] = []
            sessions_by_project[session.project_name].append(session)

        for project_name, sessions in sessions_by_project.items():
            sessions.sort(key=lambda s: s.pk)
            if project_name:
                with open(os.path.join(settings.MEDIA_ROOT, "..", "decrypted_media", project_name, "sessions.csv"), "w") as csvfile:
                    writer = csv.writer(csvfile)
                    field_names = [field.name for field in AppSession._meta.fields]
                    # Write a first row with header information
                    writer.writerow(field_names)
                    # Write data rows
                    for session in sessions:
                        writer.writerow([getattr(session, field) for field in field_names])



