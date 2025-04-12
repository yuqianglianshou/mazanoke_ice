window.App = window.App || {};

App.ui = {
  dialogs: {
    installPWA: document.getElementById("installPWADialog"),
    updateToast: document.getElementById("updateToast"),
    updateToastRefreshButton: document.getElementById("updateToastRefreshButton"),
  },
  inputs: {
    quality: document.getElementById("quality"),
    limitDimensions: document.getElementById("limitDimensions"),
    limitWeight: document.getElementById("limitWeight"),
    weightUnit: document.getElementById("limitWeightUnit"),
    limitWeightUnit: document.getElementById("limitWeightUnit"),
    compressMethod: document.querySelectorAll('[name="compressMethod"]'),
    dimensionMethod: document.querySelectorAll('[name="dimensionMethod"]'),
    formatSelect: document.querySelectorAll('[name="formatSelect"]'),
    file: document.getElementById("webWorker"),
    settingsSubpage: document.querySelectorAll('[name="settingsSubpage"]'),
  },
  labels: {
    limitWeightSuffix: document.querySelector('label[for="limitWeight"][data-suffix]'),
  },
  progress: {
    container: document.querySelector(".progress-container"),
    queueCount: document.getElementById("webWorkerProgressQueueCount"),
    track: document.getElementById("webWorkerProgressTrack"),
    bar: document.getElementById("webWorkerProgressBar"),
    text: document.getElementById("webWorkerProgressText"),
  },
  output: {
    container: document.getElementById("outputDownloadContainer"),
    content: document.getElementById("outputDownloadContent"),
    downloadAllBtn: document.getElementById("downloadAllImagesButton"),
    subpageOutput: document.getElementById("subpageOutput"),
    imageCount: document.getElementById("compressedImageCount"),
  },
  actions: {
    abort: document.getElementById("webWorkerAbort"),
    dropZone: document.getElementById("dropZoneActions"),
    backToTop: document.getElementById("backToTop"),
    downloadAll: document.getElementById("downloadAllImagesButton"),
  },
  groups: {
    formatMethod: document.getElementById("formatMethodGroup"),
    settingsSubpage: document.getElementById("selectSettingsSubpage"),
    dropZone: document.getElementById("webWorkerDropZone"),
    maxWeight: document.querySelector("label[for='maxWeight']").closest(".form-group"),
    quality: document.querySelector("label[for='quality']").closest(".form-group"),
    compressMethod: document.getElementById("compressMethodGroup"),
  },
};

App.config = {
  thumbnailOptions: {
    initialQuality: 0.8,
    maxWidthOrHeight: 70,
    useWebWorker: true,
    preserveExif: false,
    fileType: "image/png",
    libURL: "./browser-image-compression.js",
    alwaysKeepResolution: true,
  },
  weightLimit: {
    min: 0.01,
    max: 100,
  },
};


App.state = {
  controller: null,
  compressQueue: [],
  compressQueueTotal: 0,
  compressProcessedCount: 0,
  compressMethod: null,
  isCompressing: false,
  isDownloadingAll: false,
  inputFileSize: null,
  imageCount: 0,
  fileProgressMap: {},
  limitWeightUnit: "MB",
};

const ui = App.ui;
const config = App.config;
const state = App.state;
zip = new JSZip();