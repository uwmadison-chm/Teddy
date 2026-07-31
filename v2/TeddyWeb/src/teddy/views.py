import json
import datetime

import pytz
from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import transaction, IntegrityError

from teddy.models import VideoUpload, SessionData


@require_POST
@csrf_exempt
def save_session(request):
    post_data = json.loads(request.body)
    participant_id = post_data['participantId']
    session_data = post_data['sessionData']
    session_uuid = post_data['sessionUUID']
    upload_time = datetime.datetime.fromtimestamp(post_data['uploadTimestamp'] / 1000, tz=pytz.utc)

    def query_and_save_session():
        try:
            session_object = SessionData.objects.get(session_uuid=session_uuid)
        except SessionData.DoesNotExist:
            session_object = SessionData(session_uuid=session_uuid)

        if (not session_object.upload_time) or upload_time > session_object.upload_time:
            session_object.participant_id = participant_id
            session_object.study_id = session_data["studyID"]
            session_object.session_id = session_data["sessionID"]
            session_object.expiration_time = datetime.datetime.fromtimestamp(session_data['expirationTime'] / 1000, tz=pytz.utc) if session_data.get('expirationTime') else None
            session_object.start_time = datetime.datetime.fromtimestamp(session_data['startTimestamp'] / 1000, tz=pytz.utc)
            session_object.end_time = datetime.datetime.fromtimestamp(session_data['endTimestamp'] / 1000, tz=pytz.utc) if session_data.get('endTimestamp') else None
            session_object.session_uuid = session_data["sessionUUID"]
            session_object.is_completed = session_data["isCompleted"]
            session_object.recording_uuids = json.dumps(session_data["recordingUUIDs"])
            session_object.upload_time = upload_time
            session_object.session_data = json.dumps(session_data)

            session_object.save()

    # Sometimes the page might try to save the session in quick succession. This squashes race conditions
    try:
        with transaction.atomic():
            query_and_save_session()
    except IntegrityError:
        with transaction.atomic():
            query_and_save_session()

    return HttpResponse("OK")


@require_POST
@csrf_exempt
def upload_video(request):
    post_data = json.loads(request.POST["data"])
    participant_id = post_data['participantId']
    study_id = post_data['studyID']
    session_uuid = post_data['sessionUUID']
    video_id = post_data['videoID']
    video_uuid = post_data['videoUUID']
    upload_time = datetime.datetime.fromtimestamp(post_data['uploadTimestamp'] / 1000, tz=pytz.utc)

    try:
        video_upload = VideoUpload.objects.get(video_uuid=video_uuid)
    except VideoUpload.DoesNotExist:
        video_upload = VideoUpload(video_uuid=video_uuid)

    if settings.DEBUG:
        import time
        time.sleep(30)

    if (not video_upload.upload_time) or upload_time > video_upload.upload_time:
        video_upload.participant_id = participant_id
        video_upload.upload_time = upload_time
        video_upload.study_id = study_id
        video_upload.session_uuid = session_uuid
        video_upload.video_id = video_id
        video_upload.video_uuid = video_uuid
        video_upload.extra_data = post_data.get("extraData")
        video_upload.video_file = request.FILES["video"]

        video_upload.save()

    return HttpResponse("OK")
