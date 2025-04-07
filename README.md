<h1 align="center">
  <img src=".github/images/mazanoke-app-icon.png" alt="mazanoke icon" width="180">

   MAZANOKE
</h1>

<h2 align="center"> A self-hosted local image optimizer that runs in your browser.</h2>


<center>
   <img src=".github/images/featured-desktop-solo-dark.jpg" alt="mazanoke screencapture" width="1000">
</center>

## About
MAZANOKE is a simple image optimizer that runs entirely in your browser—no external uploads, works offline as a web app, and keeps your images private.

## Table of Content
- [Features](#features)
- [Install](#install)
- [Screenshots](#screenshots)
- [Attributions and Licenses](#attribution-and-license)

## Features

- 🚀 **Optimizes Images Instantly In Your Browser**
  - Adjust image quality (0-100%).
  - Set a target file size.
  - Set max dimensions, to not exceed a certain width/height.
  - Convert between JPG, PNG, and WebP.
    - Supports GIF, SVG → PNG.
- 🌍 **Installable Web App**
  - Use as a Progressive Web App (PWA).
  - Dark and light mode.
  - Fully responsive for desktop, tablet, and mobile.
- 🔒 **Privacy-Focused**
  - Works offline.
  - All image processing happens locally.
  - No data is uploaded to external servers. Your files stay on your device.

**Planned**
- [X] Upload multiple files at once. (Completed)
- [ ] Remember last-used settings.
- [ ] Support for more image file types.
- [ ] Image cropping.

## Install

### Docker

1. Using [Docker Compose](https://docs.docker.com/compose/):
```
services:
  mazanoke:
    container_name: mazanoke
    image: ghcr.io/civilblur/mazanoke:latest
    ports:
      - "3474:80"
```

### Local (Desktop)

1. Download the [latest source code release](https://github.com/civilblur/mazanoke/releases).
1. Open the `index.html` file to launch the app in your browser.

### Installing as Progressive Web App

1. Visit [MAZANOKE.com](https://mazanoke.com/) or host your own instance for even stronger privacy.
- 💻 On desktop:
  - **Chrome:** Within the address bar on the right, click the computer icon → "Install".
  - **Safari:** "Share" icon → "Add to Dock".
- 📱 On mobile:
  - **Firefox:** "More" menu → "Add App to Home Screen".
  - **Chrome:** "More" menu → "Add to Home Screen".
  - **Safari:** "Share" icon → "Add to Home Screen".

For more detailed instructions with screenshots, [click here](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing).

## Screenshots

<center>
   <img src=".github/images/featured-image-mobile-group-dark-light.jpg" alt="mazanoke mobile devices" width="1000">
</center>

|    |   |
| :---: | :---: |
| Dark mode<br><img src=".github/images/capture-desktop-dark.jpg" alt="mazanoke dark mode" width="50%"> | Light mode<br><img src=".github/images/capture-desktop-light.jpg" alt="mazanoke light mode" width="50%">  |
| Settings<br><img src=".github/images/capture-desktop-solo-settings-dark.jpg" alt="mazanoke settings" width="50%">  | Download optimized images<br><img src=".github/images/capture-desktop-solo-output-dark.jpg" alt="mazanoke settings" width="50%">  |

## Attribution and License

MAZANOKE: [GNU General Public License v3.0](https://github.com/civilblur/mazanoke/blob/main/README.md)

Dependencies:
- Browser Image Compression
- heic-to, libheif, libde265
- JSZip
- Geist, Geist Mono

[View all third-party licenses](./docs/ATTRIBUTIONS.md)