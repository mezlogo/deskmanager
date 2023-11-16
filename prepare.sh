#!/usr/bin/env bash
find . -maxdepth 2 -name package.json -exec bash -c 'cd "$(dirname {})"; npm install' \;
