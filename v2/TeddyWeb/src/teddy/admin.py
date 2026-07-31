import json

from django.contrib import admin
from django.contrib.admin.widgets import AdminTextareaWidget
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm

from teddy.models import AdminUser, SessionData, JsonField, VideoUpload, upload_video


class SerializedFieldWidget(AdminTextareaWidget):

    def render(self, name, value, attrs=None, renderer=None):
        return super(SerializedFieldWidget, self).render(name, json.dumps(json.loads(value), indent=4) if value else None, attrs, renderer)


def register(model):
    def inner(admin_class):
        admin.site.register(model, admin_class)
        return admin_class

    return inner

class AdminUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = AdminUser


@register(AdminUser)
class AdminUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display
    form = AdminUserChangeForm


@register(SessionData)
class SessionDataAdmin(admin.ModelAdmin):
    list_display = ('key', 'is_completed', 'participant_id', 'study_id', 'session_id', 'session_uuid', 'start_time', 'recording_uuids')
    readonly_fields = ('key',)
    search_fields = ('session_id', 'participant_id', 'session_uuid', 'recording_uuids')
    actions_on_top = True

    formfield_overrides = {
        JsonField: {'widget': SerializedFieldWidget},
    }


@register(VideoUpload)
class VideoUploadAdmin(admin.ModelAdmin):
    list_display = ('key', 'participant_id', 'video_id', 'session_uuid', 'upload_time', 'video_uuid', 'video_name')
    readonly_fields = ('key', 'video_name')
    exclude = ('video_file',)
    search_fields = ('video_id', 'participant_id', 'session_uuid', 'video_uuid')
    actions_on_top = True

    def video_name(self, instance):
        return instance.video_name

    formfield_overrides = {
        JsonField: {'widget': SerializedFieldWidget},
    }
