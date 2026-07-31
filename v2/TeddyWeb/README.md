# Teddy 2.0 Web Version

## Overview

This is the redesigned and improved WebTeddy project. It is a traditional Django app, with a React frontend framework. For information about how to run and modify Django applications, please read the excellent [Django Tutorial](https://www.djangoproject.com/start/).

## Django Setup

By default, the project assumes you're running a MySQL database. If you choose not to, please update `src/project/settings.py` accordingly. Create and setup a database according to the values you put in `passwords.py`

Next, make sure you have a happy virtual environment set up. 

    virtualenv --python=python3.13 env
    source env/bin/activate

From there, make sure you have all the Python libraries installed 

    python -m ensurepip --upgrade
    pip3 install --upgrade pip
    pip3 install -r requirements.txt

Now you'll need to make sure you have all the passwords you need. 

    cp src/passwords_template.py passwords.py 

Fill in all the fields in passwords.py with whatever you want.

Now, create the logging directory. Django will need this to run properly.

    sudo mkdir /var/log/django
    sudo chmod 777 /var/log/django

Install all our database tables and migrations.

    python src/manage.py makemigrations
    python src/manage.py migrate

Django should all be set up! One last step to be able to access your dev instance's admin console: Create an admin superuser for yourself.

    python src/manage.py createsuperuser

You don't have to fill out the email, and make the username and password whatever you want. It's all stored locally in your DB.

Now you should be all set up to run locally! Start the dev server:

    python src/manage.py runserver 0.0.0.0:8000

While the dev server is running, you can access the admin console at http://localhost:8000/admin/

## React Setup

You will want to set up the React frontend development server as well. See the [React README](TeddyReact/README.md) for more information.

## Configuration

You'll want to add some reels to the app so you can show videos to the users.

Add video files in [static/reels/](static/reels/).

Update `TeddyReels` in [ReelsScreen.tsx](TeddyReact/src/routes/ReelsScreen.tsx) to list all your reels (sorry this is manual).

# Licenses

MIT License

Copyright (c) [2026] [MIT Media Lab]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction privileges, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The Teddy character is used under [Creative Commons 4.0](https://creativecommons.org/licenses/by/4.0/) from [JcToon at Rive](https://rive.app/community/520-990-teddy-login-screen/).
