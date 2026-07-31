"""teddy URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from teddy import views

urlpatterns = [
    path('projectinfo/', views.get_project_info),
    path('logevent/', views.log_event),
    path('upload/', views.upload),
    path('finalresponse/', views.final_response),
    path('querysessions/', views.query_sessions),
    path('applogin/', views.app_login),
    path('privacy/', views.privacy, name='privacy'),
    path('', views.index, name='index')
]


if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
