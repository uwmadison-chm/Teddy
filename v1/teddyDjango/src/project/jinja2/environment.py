from django.contrib.staticfiles.storage import staticfiles_storage
from django.urls import reverse
from jinja2 import Environment
from markupsafe import Markup
from jinja2_pluralize import pluralize_dj
import json
from django.conf import settings
from widget_tweaks.templatetags import widget_tweaks
from jinja2.ext import Extension
from jinja2.nodes import ContextReference, CallBlock
from django.conf import settings


class CacheBreakExtension(Extension):
    """
    This will give us a {% cache_break %} tag.
    """

    tags = set(['cachebreak'])

    def _render_tag(self, context, caller):
        return Markup("?q=" + settings.STARTUP_TIMESTAMP)

    def parse(self, parser):
        ctx_ref = ContextReference()
        lineno = next(parser.stream).lineno
        node = self.call_method('_render_tag', [ctx_ref], lineno=lineno)
        return CallBlock(node, [], [], [], lineno=lineno)


def environment(**options):
    env = Environment(**options)
    env.filters.update({
        'pluralize': pluralize_dj,
        'json': json.dumps,
        'add_class': widget_tweaks.add_class,
        'set_attr': widget_tweaks.set_attr,

    })
    env.globals.update({
        'static': staticfiles_storage.url,
        'url': reverse,
        'list': list,
    })
    env.add_extension(CacheBreakExtension)
    return env
