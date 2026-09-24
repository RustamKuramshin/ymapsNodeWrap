#!/usr/bin/env bash

# Дополнительные аргументы передаются docker build как есть.
docker build --platform linux/amd64 -t nodedev/ymapsnode "$@" .
