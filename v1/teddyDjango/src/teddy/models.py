from django.db import models
import string, random
from django.contrib.auth.models import AbstractUser
from django.utils.text import slugify

class JsonField(models.TextField):
    pass


def key_generator(size=10, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))


class BaseModel(models.Model):
    '''
    Base model from which all other models should inherit. It has a unique key and other nice fields
    '''
    id = models.AutoField(primary_key=True)
    key = models.CharField(max_length=10, unique=True, db_index=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)
    deleted_by_user = models.BooleanField(blank=True, default=False)

    def generate_key(self):
        if not self.key:
            for _ in range(10):
                key = key_generator(10)
                if not type(self).objects.filter(key=key).count():
                    self.key = key
                    break

    def save(self, *args, **kwargs):
        self.generate_key()
        super(BaseModel, self).save(*args, **kwargs)

    class Meta:
        abstract = True


class Project(BaseModel):
    name = models.CharField(max_length=128)
    description = models.CharField(max_length=1024)
    video_set = models.CharField(max_length=32, choices=(("babies", "Babies"), ("misc", "Miscellaneous"), ("all", "All")))
    randomize_videos = models.BooleanField(blank=True, default=False)

    def __str__(self):
        return self.name


class TeddyAdminUser(AbstractUser):
    projects = models.ManyToManyField(Project)

    def get_project_names(self):
        return [project.name.strip() for project in self.projects.all() if project.name.strip()]


def get_folder_name(s):
    return slugify(s) or "default"


def upload_video(instance, filename):
    return get_folder_name(instance.project_name) + "/" + get_folder_name(instance.user_id) + "/" +\
           instance.session_start_time.strftime("%Y%m%d-%H%M%S") + "_" + "video." + ".".join(filename.split(".")[-2:])


def upload_story(instance, filename):
    return get_folder_name(instance.project_name) + "/" + get_folder_name(instance.user_id) + "/" +\
           instance.session_start_time.strftime("%Y%m%d-%H%M%S") + "_" + "story." + ".".join(filename.split(".")[-2:])


class AppSession(BaseModel):
    user_id = models.CharField(max_length=128)
    session_id = models.CharField(max_length=128)
    installation_id = models.CharField(max_length=128, blank=True)
    project_name = models.CharField(max_length=128, blank=True)
    session_label = models.CharField(blank=True, max_length=128)
    session_type = models.CharField(blank=True, max_length=128)
    session_start_time = models.DateTimeField()
    session_end_time = models.DateTimeField(blank=True, null=True)
    session_data = JsonField()
    video_rating = models.IntegerField(default=0)
    video_id = models.CharField(max_length=128)
    final_response = models.CharField(max_length=32, blank=True)
    video_recording_file = models.FileField(null=True, upload_to=upload_video, blank=True)
    story_recording_file = models.FileField(null=True, upload_to=upload_story, blank=True)

    def __unicode__(self):
        return self.key

    def __repr__(self):
        return self.key


class LoggedEvent(BaseModel):
    user_id = models.CharField(max_length=128)
    session_id = models.CharField(max_length=128)
    session = models.TextField()
    event = models.CharField(max_length=128)


class PreapprovedLoginInformation(BaseModel):
    user_id = models.CharField(max_length=128)
    password = models.CharField(blank=True, max_length=128)  # This is on purpose not a password field. It's not meant to be secure. It exists only to placate our overloards at Apple.
    project = models.ForeignKey(Project, on_delete=models.CASCADE)

    def generate_password(self):
        if not self.password:
            self.password = key_generator(16, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits)

    def save(self, *args, **kwargs):
        self.generate_password()
        super(PreapprovedLoginInformation, self).save(*args, **kwargs)
