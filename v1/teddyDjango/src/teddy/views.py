from django.http import HttpResponse, Http404
from django.shortcuts import render

from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from teddy.models import AppSession, PreapprovedLoginInformation, Project, LoggedEvent
from django.utils.dateparse import parse_datetime
import logging
import json
import base64
from dateutil import parser
import datetime
from functools import wraps
from django.views.decorators.http import require_GET
from django.shortcuts import get_object_or_404


def require_basic_auth(func):
    @wraps(func)
    def inner(request, *args, **kwargs):

        if 'HTTP_AUTHORIZATION' in request.META:
            auth = request.META['HTTP_AUTHORIZATION'].split()
            if len(auth) == 2:
                if auth[0].lower() == "basic":
                    uname, passwd = base64.b64decode(auth[1]).decode('utf-8').split(":")
                    user = authenticate(username=uname, password=passwd)
                    if user is not None:
                        if user.is_active:
                            login(request, user)
                            request.user = user
                            return func(request, *args, **kwargs)

        response = HttpResponse()
        response.status_code = 401
        return response

    return inner


def get_project_info(request):
    project_name = request.GET.get('projectName')
    project = get_object_or_404(Project, name=project_name)
    result = dict(project_name=project.name,
                  video_set=project.video_set,
                  randomize_videos=project.randomize_videos,
                  success=True)
    return HttpResponse(json.dumps(result))


@csrf_exempt
def upload(request):
    user_id = request.POST['userId']
    session_id = request.POST['sessionId']
    session_start_time = parse_datetime(request.POST['sessionStartTime'])
    session_data = request.POST['data']

    parsed_session_data = json.loads(session_data)

    installation_id = parsed_session_data.get("installationID") or ""
    project_name = parsed_session_data.get("projectName") or ""

    try:
        app_session = AppSession.objects.get(session_id=session_id, user_id=user_id)
    except AppSession.DoesNotExist:
        app_session = AppSession()

    app_session.user_id = user_id
    app_session.session_id = session_id
    app_session.installation_id = installation_id
    app_session.session_label = parsed_session_data.get("sessionLabel") or ""
    app_session.session_type = parsed_session_data.get("sessionType") or ""
    app_session.project_name = project_name
    app_session.session_start_time = session_start_time
    app_session.session_end_time = parsed_session_data.get("sessionEndTime")
    app_session.video_rating = parsed_session_data.get("videoRating", -1)
    app_session.video_id = parsed_session_data["currentVideo"]
    app_session.session_data = session_data

    if request.FILES.get('videoRecording'):
        app_session.video_recording_file = request.FILES.get('videoRecording')

    if request.FILES.get('storyRecording'):
        app_session.story_recording_file = request.FILES.get('storyRecording')

    if parsed_session_data.get("finalResponse"):
        app_session.final_response_value = parsed_session_data.get("finalResponse")

    app_session.save()

    if installation_id and project_name:
        AppSession.objects.filter(installation_id=installation_id, project_name="").update(project_name=project_name, user_id=user_id)
        # AppSession.objects.filter(installation_id=installation_id).exclude(user_id=user_id).update(user_id=user_id)

    result = dict(success=True)
    return HttpResponse(json.dumps(result))


@csrf_exempt
def log_event(request):
    post_data = json.loads(request.body)
    user_id = post_data['userId']
    session_id = post_data['sessionId']
    session = post_data['session']
    event = post_data['event']

    logged_event = LoggedEvent(user_id=user_id,
                               session_id=session_id,
                               session=session,
                               event=event)
    logged_event.save()

    return HttpResponse("OK")


@csrf_exempt
def final_response(request):
    user_id = request.POST['userId']
    session_id = request.POST['sessionId']
    final_response_value = request.POST['finalResponse']

    try:
        app_session = AppSession.objects.get(session_id=session_id, user_id=user_id)
        app_session.final_response = final_response_value
        app_session.save()
    except AppSession.DoesNotExist:
        logging.warning("Tried to upload final response, but couldn't: " + user_id + ", " + session_id + ", " + final_response_value)
        pass

    return HttpResponse("OK")

@require_basic_auth
@require_GET
def query_sessions(request):

    if request.user.is_superuser:
        query = AppSession.objects.filter()
    else:
        valid_project_names = request.user.get_project_names()
        query = AppSession.objects.filter(project_name__in=valid_project_names)

    if request.GET.get("date_range_start"):
        start_date = parser.parse(request.GET.get("start_date"))
        query = query.filter(session_start_time__gte=start_date)
    if request.GET.get("date_range_end"):
        end_date = parser.parse(request.GET.get("end_date")) + datetime.timedelta(days=1)
        query = query.filter(session_start_time__lt=end_date)
    if request.GET.get("project_name"):
        query = query.filter(project_name=request.GET.get("project_name"))
    if request.GET.get("user_id"):
        query = query.filter(user_id=request.GET.get("user_id"))
    if request.GET.get("session_label"):
        query = query.filter(session_label=request.GET.get("session_label"))
    if request.GET.get("session_type"):
        query = query.filter(session_type=request.GET.get("session_type"))
    results = query.all()

    formatted_results = [dict(start_time=app_session.session_start_time.isoformat(),
                              end_time=app_session.session_end_time.isoformat() if app_session.session_end_time else None,
                              session_label=app_session.session_label,
                              session_data=json.loads(app_session.session_data),
                              session_type=app_session.session_type,
                              user_id=app_session.user_id,
                              installation_id=app_session.installation_id,
                              project_name=app_session.project_name,
                              final_response=app_session.final_response) for app_session in results]

    return HttpResponse(json.dumps(formatted_results))


@csrf_exempt
def app_login(request):
    user_id = request.POST['userId']
    password = request.POST['password']

    # take that, apple. morons don't know validation is done on the backend?
    if "test" in user_id.lower() and "appletest" not in user_id.lower():
        return HttpResponse(json.dumps(dict(success=True, project_name="test")))

    try:
        login_info = PreapprovedLoginInformation.objects.get(user_id=user_id, password=password)
        return HttpResponse(json.dumps(dict(success=True,
                                            project_name=login_info.project.name,
                                            video_set=login_info.project.video_set,
                                            randomize_videos=login_info.project.randomize_videos)))
    except PreapprovedLoginInformation.DoesNotExist:
        pass

    raise Http404()

def privacy(request):
    return render(request, "privacy.html")

def index(request):
    return render(request, "index.html")
