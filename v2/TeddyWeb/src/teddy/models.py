import datetime

import pytz
from django.db import models
import string
import random
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
    key = models.CharField(max_length=64, unique=True, db_index=True, blank=True)
    date_created = models.DateTimeField(auto_now_add=True)
    date_updated = models.DateTimeField(auto_now=True)

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


class AdminUser(AbstractUser):

    class Meta(object):
        verbose_name = 'Admin User'


class SessionData(BaseModel):
    participant_id = models.CharField(max_length=128, blank=True)
    study_id = models.CharField(max_length=128, blank=True)
    session_id = models.CharField(max_length=128, blank=True)
    expiration_time = models.DateTimeField(null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    session_uuid = models.CharField(max_length=128, unique=True)
    is_completed = models.BooleanField(blank=True)
    recording_uuids = JsonField(default=[])
    upload_time = models.DateTimeField()
    session_data = JsonField(default={})

    def __unicode__(self):
        return self.key

    def __repr__(self):
        return self.key


def get_folder_name(s):
    return slugify(s) or "default"

def upload_video(instance, filename):
    return get_folder_name(instance.study_id) + "/" + get_folder_name(instance.participant_id) + "/" +\
           instance.upload_time.strftime("%Y%m%d-%H%M%S") + "." + filename.split(".")[-1]

class VideoUpload(BaseModel):
    participant_id = models.CharField(max_length=128, blank=True)
    upload_time = models.DateTimeField()
    study_id = models.CharField(max_length=128, blank=True)
    session_uuid = models.CharField(max_length=128)
    video_id = models.CharField(max_length=128)
    video_uuid = models.CharField(max_length=128, unique=True)
    extra_data = models.CharField(max_length=128, null=True, blank=True)
    video_file = models.FileField(upload_to=upload_video)

    @property
    def video_name(self):
        return self.video_file.name

    def __unicode__(self):
        return self.key

    def __repr__(self):
        return self.key
