<h1 align="center">
  <img src="git-images/mazanoke-app-icon.png" alt="mazanoke icon" width="180">

   MAZANOKE
</h1>

<h2 align="center"> A self-hosted local image compressor that runs in your browser.</h2>


<center>
   <img src="git-images/featured-desktop-solo-dark.jpg" alt="mazanoke screencapture" width="1000">
</center>

## About
MAZANOKE is a simple image compressor and converter that runs entirely in your browser. No external uploads, works offline as a web app, and is powered by [Browser Image Compression](https://github.com/Donaldcwl/browser-image-compression).

## Table of Content
- [Features](#features)
- [Install](#install)
- [Screenshots](#screenshots)
- [License](#license)

## Features

- 🚀 **Compress & Convert Images Instantly In Your Browser**
   - Adjust image quality (0-100%).
   - Set a target file size.
   - Set max dimensions, to never exceed a certain width/height.
   - Convert between JPG, PNG, and WebP.
- 🌍 **Installable Web App**
   - Use as a Progressive Web App (PWA).
   - Dark and light mode.
   - Fully responsive for desktop, tablet, and mobile.
- 🔒 **Privacy-Focused**
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

## Screenshots

<center>
   <img src="git-images/featured-image-mobile-group-dark-light.jpg" alt="mazanoke mobile devices" width="1000">
</center>

|    |   |
| :---: | :---: |
| Dark mode<br><img src="git-images/capture-desktop-dark.jpg" alt="mazanoke dark mode" width="50%"> | Light mode<br><img src="git-images/capture-desktop-light.jpg" alt="mazanoke light mode" width="50%">  |
| Settings<br><img src="git-images/capture-desktop-solo-settings-dark.jpg" alt="mazanoke settings" width="50%">  | Download compressed images<br><img src="git-images/capture-desktop-solo-output-dark.jpg" alt="mazanoke settings" width="50%">  |

## License

MAZANOKE: [GNU General Public License v3.0](https://github.com/civilblur/mazanoke/blob/main/README.md)

Browser Image Compression: [MIT License](https://github.com/Donaldcwl/browser-image-compression/blob/master/LICENSE)

Geist, Geist Mono: [OFL License](https://github.com/vercel/geist-font/blob/main/LICENSE.txt)