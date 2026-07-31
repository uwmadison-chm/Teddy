from django.contrib import admin
import json
from .models import JsonField, TeddyAdminUser, AppSession, PreapprovedLoginInformation, Project, LoggedEvent
from django.contrib.admin.widgets import AdminTextareaWidget
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm


class SerializedFieldWidget(AdminTextareaWidget):

    def render(self, name, value, attrs=None, renderer=None):
        return super(SerializedFieldWidget, self).render(name, json.dumps(json.loads(value), indent=4) if value else None, attrs, renderer)


def register(model):
    def inner(admin_class):
        admin.site.register(model, admin_class)
        return admin_class

    return inner


@register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "video_set", "randomize_videos")
    exclude = ("deleted_by_user",)
    readonly_fields = ('key',)
    search_fields = ('name',)
    actions_on_top = True


class TeddyUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = TeddyAdminUser


@register(TeddyAdminUser)
class TeddyUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ("project_names",)
    form = TeddyUserChangeForm

    def project_names(self, model):
        return ", ".join([project.name for project in model.projects.all()])

    fieldsets = UserAdmin.fieldsets + (
            ("Teddy", {'fields': ('projects',)}),
    )


@register(AppSession)
class AppSessionAdmin(admin.ModelAdmin):
    list_display = ('key', 'project_name', 'user_id', 'session_label', 'session_type', 'session_start_time', 'session_end_time', 'video_id', 'video_rating', 'final_response', 'has_video_recording', 'has_story_recording')
    exclude = ("deleted_by_user",)
    readonly_fields = ('key',)
    search_fields = ('user_id', 'session_id', 'session_start_time', 'project_name')
    actions_on_top = True

    formfield_overrides = {
        JsonField: {'widget': SerializedFieldWidget},
    }

    def has_video_recording(self, model):
        return bool(model.video_recording_file.name)
    has_video_recording.boolean = True

    def has_story_recording(self, model):
        return bool(model.story_recording_file.name)
    has_story_recording.boolean = True


@register(PreapprovedLoginInformation)
class PreapprovedLoginInformationAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'password', 'project')
    exclude = ("deleted_by_user",)
    readonly_fields = ('key',)
    search_fields = ('project',)


@register(LoggedEvent)
class LoggedEventAdmin(admin.ModelAdmin):
    search_fields = ('user_id',)
    readonly_fields = ('key',)
    list_display = ('user_id', 'session_id', 'date_created', 'event')
