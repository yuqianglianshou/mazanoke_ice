# Project Structure

An outline of the project structure.

- [Directories and Files Outline](#directories-and-files-outline)
- [Basic App Flow](#basic-app-flow)

## Directories and files outline

| **File**                           | **Description**                                                                 |
|------------------------------------|---------------------------------------------------------------------------------|
| **Root**                           |                                                                                 |
| `index.html`                       | Main HTML file that loads the app.                                              |
| `service-worker.js`                | Service worker for offline and PWA support.                                     |
| `manifest.json`                    | Manifest for PWA configuration.                                                 |
|                                    |                                                                                 |
| **JavaScript (`assets/js`)**       | Core functionality of the app.                                                  |
| `compression.js`                   | Handles the image compression logic.                                            |
| `download.js`                      | Handles the download logic of the compressed images.                            |
| `events.js`                        | Event listeners and handlers.                                                   |
| `global.js`                        | Initializes global variables such as references to elements, form, states, etc. |
| `helpers.js`                       | Helper functions.                                                               |
| `ui.js`                            | User interface DOM manipulation.                                                |
| `utilities.js`                     | Utility functions for various tasks and smaller types of processing.            |
|                                    |                                                                                 |
| **Vendor Libraries (`assets/vendor`)** | Third-party libraries, essential to the app's functionality.                |
| `browser-image-compress.js`        | A library for browser-side image compression.                                   |
| `heic-to.js`                       | HEIC image decoder, allowing converting to other browser-friendly file types.   |
| `jszip.js`                         | Handles zipping of image files for download.                                    |
|                                    |                                                                                 |
| **Images (`assets/images`)**       | Static images for user interface and metatags.                                  |
|                                    |                                                                                 |
| **CSS (`assets/css`)**             | App styling.                                                                    |
| `fonts.css`                        | Font definitions.                                                               |
| `style.css`                        | Main styling of the user interface.                                             |
| `variables.css`                    | Global CSS variables for dynamic color, sizing, font, etc.                      |
|                                    |                                                                                 |
| **Fonts (`assets/fonts`)**         | Font files.                                                                     |

## Basic App Flow

To better understand the app’s flow and file interactions, the outline below describes the general image optimization process.

1. `index.html` launches the app.
1. The scripts are loaded in a specific order to initialize global variables, references, and dependencies that other scripts depend on.
    1. `vendor` scripts.
    1. `global.js`
    1. `utilities.js`
    1. `helpers.js`
    1. `ui.js`
    1. `compression.js`
    1. `download.js`
    1. `events.js`
1. `initApp()` in `events.js` binds events to interactive components in `index.html` and handles saving/restoring app settings.
1. When a user drops or selects an image, event handlers in `events.js` capture the input and trigger compression functions from `compression.js`.
1. Before compressing any images, `ui.js` parses and validates the selected options. To do so, many features from `utilities.js` are used to build the `options` object that are passed to the image compressor.
1. Input images go through `preProcessImage(file)` in `compression.js` to be decoded, ensuring compatibility with `browser-image-compression.js`, which serves as the main image compressor library in this app.
    - Image formats natively supported by browsers (JPG, PNG, WebP) typically don't need pre-processing and are passed through directly.
    - HEIC images are pre-processed, as they are not natively supported by major browsers.
    - AVIF is natively supported, but due to its already optimized nature, it is pre-processed to a lossy format to reduce the chance of the output file being larger than the original.
1. The state of the image processing, such as `isCompressing`, `compressQueue`, and more, are stored in `global.js`.
1. Once an image is processed, `handleCompressionResult(file, output)` in `helpers.js` outputs the compressed image on the user interface, where users can download individual images or all images as a zip, handled by `download.js`.