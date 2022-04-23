# live-video-processor

Live video processor is a web appllication built with Django, React, Websockets, and OpenCV Python that demonstrates simple real-time video processing. I built this application so that I could try applying some of my graduate work to real-time web video. This initial debug setup deletes the "red" color channel from a user webcam and shows it being processed both locally via javascript and remotely on the Django backend.

<div class="row" style="display: flex;">
  <div class="column" style="flex:100%;padding:5px;margin:auto;">
    <img src="Docs/Images/video_demo.gif" alt="Snow" style="width:100%">
  </div>
</div>

# Setting up the project

This project is currently debug only. To get the project running you will need node, python, pipenv, and docker all installed and on your path. If you have these pre-requisites met theb run the below script from the repo root.

	debug-with-containers.sh

This script will rebuild the react front-end, copy it to Django's static folder, startup a redis in-memory database for the video stream, and then finally start the Django server. Once everything is up and running simply navigate to

	localhost:8000

You should be prompted for access to your webcam, and then you will see the demo.