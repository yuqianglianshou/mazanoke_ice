<h1 align="center">

   MAZANOKE
   <br>
   A self-hosted local image compressor that runs in your browser.
</h1>

<center>
   <img src="https://raw.githubusercontent.com/civilblur/mazanoke/refs/heads/main/git-images/featured-desktop-solo-dark.jpg" alt="mazanoke screencapture" width="1000">
</center>

## About
MAZANOKE is a simple image compressor and converter that runs entirely in your browser. No external uploads, works offline as a web app, and powered by [Browser Image Compression](https://github.com/Donaldcwl/browser-image-compression).

## Table of Content
- [Features](#features)
- [Install](#install)
- [License](#license)

## Features

- 🚀 **Compress & Convert Images Instantly In Your Browser**
   - Adjust image quality (0-100%).
   - Set a target file size.
   - Set max dimensions, to never exceed a certain width/height.
   - Convert between JPG, PNG, and WebP.
- 🌍 Installable Web App
   - Use as a Progressive Web App (PWA).
   - Fully responsive for desktop, tablet, and mobile.
- 🔒 Privacy-Focused
   - Works offline.
   - All image processing happens locally.
   - No data is uploaded. Your files stay on your device.

## Install

Using [Docker Compose](https://docs.docker.com/compose/):
```
services:
  mazanoke:
    container_name: mazanoke
    image: ghcr.io/civilblur/mazanoke:latest
    ports:
      - "3474:80"
```

## License

MAZANOKE: [GNU General Public License v3.0](https://github.com/civilblur/mazanoke/blob/main/README.md)

Browser Image Compression: [MIT License](https://github.com/Donaldcwl/browser-image-compression/blob/master/LICENSE)

Geist, Geist Mono: [OFL License](https://github.com/vercel/geist-font/blob/main/LICENSE.txt)