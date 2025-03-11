#!/bin/sh
# Lancer le serveur Django en arrière-plan
uvicorn hackatweetapi.asgi:application --reload --host 0.0.0.0 --port 8000
