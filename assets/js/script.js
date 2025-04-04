const zip = new JSZip();
const progressContainer = document.querySelector(".progress-container");
const progressQueueCount = document.querySelector("#webWorkerProgressQueueCount");
const progressTrack = document.querySelector("#webWorkerProgressTrack");
const progressBar = document.querySelector("#webWorkerProgressBar");
const progressText = document.querySelector("#webWorkerProgressText");
const outputDownloadContainer = document.querySelector("#outputDownloadContainer");
const outputDownloadContent = document.querySelector("#outputDownloadContent");
const downloadAllImagesButton = document.querySelector("#downloadAllImagesButton");
const selectSubpageOutput = document.querySelector("#selectSubpageOutput");
const webWorkerAbort = document.getElementById("webWorkerAbort");
const dropZoneActions = document.getElementById("dropZoneActions");
const compressedImageCount = document.getElementById("compressedImageCount");
const thumbnailCompressionOptions = {
  initialQuality: 0.8,
  maxWidthOrHeight: 100,
  useWebWorker: true,
  preserveExif: false,
  fileType: 'image/jpeg',
  libURL: "./browser-image-compression.js",
  alwaysKeepResolution: true
};
let controller;
let compressQueue = [];
let compressQueueTotal = 0;
let compressProcessedCount = 0;
let compressMethod;
let isCompressing = false;
let isDownloadingAll = false;
let inputFileSize;
let imageCount = 0;
let fileProgressMap = {};


/**
 * TODO:
 * - Improve error handling
 * - Double check state of settings on page load, in case of browser back button.
 * - Save settings to local storage and restore.
 * - Store compressed images in local storage, and allow clear individual items and all items.
 */

function resetCompressionState(isAllProcessed, aborted) {
  const resetUI = () => {
    webWorkerAbort.classList.add("hidden");
    document.body.classList.remove("compressing--is-active");
    dropZoneActions.classList.remove("hidden");
    progressContainer.classList.add("hidden");
    progressText.dataset.progress = 0;
    progressBar.style.width = "0%";
  };

  const resetState = () => {
    compressProcessedCount = 0;
    compressQueueTotal = 0;
    progressQueueCount.textContent = "";
    compressQueue = [];
    isCompressing = false;
  };

  if (aborted) {
    resetUI();
    resetState();
    return;
  }

  if (isAllProcessed) {
    webWorkerAbort.classList.add("hidden");
    progressBar.style.width = "100%";
    
    setTimeout(() => {
      resetUI();
      isCompressing = false;
    }, 1000);
    return;
  }

  if (isCompressing && compressProcessedCount === 0) {
    progressText.dataset.progress = 0;
    progressText.textContent = "Preparing 0%";
    progressBar.style.width = "0%";
  }
}


function compressImage(event) {
  

  controller = new AbortController();
  compressQueue = Array.from(event.target.files);
  compressQueueTotal = compressQueue.length;
  compressProcessedCount = 0;
  fileProgressMap = {};

  isCompressing = true;
  document.body.classList.add("compressing--is-active");
  dropZoneActions.classList.add("hidden");
  webWorkerAbort.classList.remove("hidden");
  progressContainer.classList.remove("hidden");
  progressText.textContent = "Preparing";

  compressImageQueue();
}

function compressImageQueue() {
  // Compress images one-by-one

  if (!compressQueue.length) {
    resetCompressionState(true);
    return;
  }

  const file = compressQueue[0];
  const i = compressProcessedCount;

  // Check for supported file types
  const supportedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!supportedFileTypes.includes(file.type)) {
    // TODO: Display error message in UI
    console.error(`Unsupported file type: ${file.type}. Skipping "${file.name}".`);
    progressText.innerHTML = `Unsupported file "<div class='progress-file-name'>${file.name}</div>"`;
    compressQueue.shift(); // Ignore unsupported file type
    compressImageQueue();
    return;
  }

  const options = createCompressionOptions((p) => onProgress(p, i, file.name), file);
  // TODO: Display error message in UI
  imageCompression(file, options)
    .then((output) => handleCompressionResult(file, output))
    .catch((error) => console.error(error.message))
    .finally(() => {
      compressProcessedCount++;
      compressQueue.shift();
      resetCompressionState(compressProcessedCount === compressQueueTotal);
      if (compressProcessedCount < compressQueueTotal) {
        compressImageQueue();
      }
    });

  function onProgress(p, index, fileName) {
    const overallProgress = calculateOverallProgress(fileProgressMap, compressQueueTotal);
    const fileNameShort = fileName.length > 15 ? fileName.slice(0, 12) + '...' : fileName;
    fileProgressMap[index] = p;

    progressQueueCount.textContent = `${compressProcessedCount + 1} / ${compressQueueTotal}`;
    progressText.dataset.progress = overallProgress;
    progressText.innerHTML = `Compressing "<div class='progress-file-name'>${fileName}</div>"`;
    progressBar.style.width = overallProgress + "%";
    console.log(`Compressing "${fileNameShort}" (${overallProgress}%)`);

    if (p === 100 && compressProcessedCount === compressQueueTotal - 1) {
      progressText.textContent = "Done!";
    }
  }
}

function calculateOverallProgress(progressMap, totalFiles) {
  const sum = Object.values(progressMap).reduce((acc, val) => acc + val, 0);
  return Math.round(sum / totalFiles);
}


function updateSlider(value, sliderId) {
  const slider = document.getElementById(sliderId);
  const fill = slider.querySelector('.slider-fill');
  const thumb = slider.querySelector('.slider-thumb');
  const percentage = value;
  fill.style.width = percentage + '%';
  thumb.style.left = Math.min(percentage, 100) + '%';
}


function startSliderDrag(event, inputId) {
  const slider = event.currentTarget;
  const input = document.getElementById(inputId);

  const updateSliderPosition = (e) => {
    const rect = slider.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.min(Math.max((offsetX / rect.width) * 100, 0), 100);
    input.value = Math.round(Math.min(percentage, 100));
    updateSlider(percentage, slider.id);
  };

  const onMouseMove = (e) => {
    updateSliderPosition(e);
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  updateSliderPosition(event);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function createCompressionOptions(onProgress, file) {
  const compressMethodElement = document.querySelector('input[name="compressMethod"]:checked');
  const maxSizeMBElement = document.querySelector("#maxSizeMB");
  const maxSizeMB = parseFloat(maxSizeMBElement.value);
  const initialQualityElement = document.querySelector("#initialQuality");
  const maxWidthOrHeightElement = document.querySelector("#maxWidthOrHeight");
  const dimensionMethodElement = document.querySelector('input[name="dimensionMethod"]:checked');
  const dimensionMethod = dimensionMethodElement.value;
  const { selectedFormat } = getFileType(file);

  compressMethod = compressMethodElement.value;
  initialQuality = Math.min(Math.max(parseFloat(initialQualityElement.value) / 100, 0), 1);
  maxWidthOrHeight = Math.max(parseFloat(maxWidthOrHeightElement.value), 1);

  console.log('Input image file size: ', (file.size / 1024 / 1024).toFixed(3), 'MB');

  const options = {
    maxSizeMB: maxSizeMB && compressMethod === "maxSizeMB" ? maxSizeMB : (file.size / 1024 / 1024).toFixed(3),
    initialQuality: initialQuality && compressMethod === "initialQuality" ? initialQuality : undefined,
    maxWidthOrHeight: dimensionMethod === "limit" ? parseFloat(maxWidthOrHeightElement.value) : undefined,
    useWebWorker: true,
    onProgress,
    preserveExif: false,
    fileType: selectedFormat ? selectedFormat : undefined,
    libURL: "./browser-image-compression.js",
    alwaysKeepResolution: dimensionMethod === "limit" ? false : true
  };
  if (controller) {
    options.signal = controller.signal;
  }

  console.log("Settings:", options);
  return options;
}


function mimeToExtension(mimeType) {
  const fileExtensionMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
  };
  
  return fileExtensionMap[mimeType] || mimeType.replace('image/', '').split('+')[0];
}

function defaultConversionMapping(mimeType) {
  const conversionMap = {
      // Image file types that cannot be compressed to its original file format
      // are converted to a relevant counterpart.
      'image/gif': 'image/png',
      'image/svg+xml': 'image/png',
  };
  
  return conversionMap[mimeType] || mimeType;
}


function getFileType(file) {
  let selectedFormat = document.querySelector('input[name="formatSelect"]:checked').value; // User-selected format to convert to, e.g. "image/jpeg".
  let inputFileExtension = ''; // User uploaded image's file extension, e.g. ".jpg".
  let outputFileExtension = ''; // The processed image's file extension, based on `defaultConversionMapping()`.

  if (selectedFormat && selectedFormat !== "nochange") {
    // The user selected format to convert to. 
    const extension = mimeToExtension(selectedFormat);
    inputFileExtension = extension;
    outputFileExtension = extension;
  }
  else {
    // User has not selected a file format, use the input image's file type.
    selectedFormat = file.type;
    inputFileExtension = mimeToExtension(file.type);
    outputFileExtension = mimeToExtension(defaultConversionMapping(file.type));
  }

  return {
    inputFileExtension,
    outputFileExtension,
    selectedFormat
  };
}


function handleCompressionResult(file, output) {

  const { outputFileExtension, selectedFormat } = getFileType(file);
  const outputImageBlob = URL.createObjectURL(output);

  // Thumbnail
  const outputItemThumbnail = document.createElement("img");
  outputItemThumbnail.src = outputImageBlob;
  outputItemThumbnail.classList.add('image-output__item-thumbnail');
  outputItemThumbnail.setAttribute('loading', 'lazy');

  // outputImageBlob dimensions
  const thumbnail = new Image();
  thumbnail.src = outputImageBlob;

  // File name and dimensions
  const outputFileNameText = updateFileExtension(file.name, outputFileExtension, selectedFormat);
  const outputFileNameStart = outputFileNameText.length > 8 ? outputFileNameText.slice(0, -8) : "";
  const outputFileNameEnd = outputFileNameText.slice(-8);
  const outputText = document.createElement("div");
  outputText.classList.add('image-output__item-text');
  const outputFileName = document.createElement("div");
  outputFileName.classList.add('image-output__item-filename');
  outputFileName.innerHTML = `
    <span class="image-output__item-filename-start">${outputFileNameStart}</span>
    <span class="image-output__item-filename-end">${outputFileNameEnd}</span>
  `;
  outputText.appendChild(outputFileName);
  const outputFileDimensions = document.createElement("div");
  outputFileDimensions.classList.add('image-output__item-dimensions');
  thumbnail.onload = function() {
    outputFileDimensions.innerHTML = `
    <div class="image-output__item-dimensions">${thumbnail.width}x${thumbnail.height}</div>
  `;
    outputText.appendChild(outputFileDimensions);
  }

  // File size
  const inputFileSize = parseFloat((file.size / 1024 / 1024).toFixed(3));
  const outputFileSize = parseFloat((output.size / 1024 / 1024).toFixed(3));
  const fileSizeSaved = inputFileSize - outputFileSize;
  const fileSizeSavedPercentage = inputFileSize > 0 ? Math.abs(((fileSizeSaved / inputFileSize) * 100).toFixed(2)) : '0.000';
  const fileSizeSavedTrend = fileSizeSaved < 0 ? '+' : (fileSizeSaved > 0 ? '-' : '');
  const fileSizeSavedClass = fileSizeSaved <= 0 ? 'badge--error' : 'badge--success';
  const outputFileSizeText = document.createElement("span");
  outputFileSizeText.classList.add('image-output__item-filesize');
  outputFileSizeText.dataset.filesize = output.size;
  outputFileSizeText.textContent = `${outputFileSize} MB`;

  // File saved badge
  const fileSizeSavedBadge = document.createElement("span");
  fileSizeSavedBadge.className = `image-output__item-filesize-saved badge ${fileSizeSavedClass}`;
  fileSizeSavedBadge.innerHTML = `
    <span class="badge-text">${fileSizeSavedTrend}${fileSizeSavedPercentage}%</span>
  `;

  // File format badge
  const outputFormatBadge = document.createElement("span");
  outputFormatBadge.className = `image-output__item-fileformat badge file-format--${outputFileExtension}`;
  outputFormatBadge.textContent = outputFileExtension.toUpperCase();

  // Download button
  const outputDownload = document.createElement("a");
  outputDownload.className = 'image-output__item-download-button button-cta button-secondary';
  outputDownload.dataset.filesize = output.size;
  outputDownload.href = outputImageBlob;
  outputDownload.download = outputFileNameText;
  outputDownload.innerHTML = `
    <svg height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.75 1V1.75V8.68934L10.7197 6.71967L11.25 6.18934L12.3107 7.25L11.7803 7.78033L8.70711 10.8536C8.31658 11.2441 7.68342 11.2441 7.29289 10.8536L4.21967 7.78033L3.68934 7.25L4.75 6.18934L5.28033 6.71967L7.25 8.68934V1.75V1H8.75ZM13.5 9.25V13.5H2.5V9.25V8.5H1V9.25V14C1 14.5523 1.44771 15 2 15H14C14.5523 15 15 14.5523 15 14V9.25V8.5H13.5V9.25Z" fill="currentColor"></path></svg>
    <span class="xs:hidden">Download</span>
  `;
  console.log("New image file: ", outputFileNameText);

  // Stats, consolidate: file size, saved, format.
  const outputStats = document.createElement("div");
  outputStats.classList.add('image-output__item-stats');
  outputStats.appendChild(outputFileSizeText);
  outputStats.appendChild(fileSizeSavedBadge);
  outputStats.appendChild(outputFormatBadge);

  // Output item container
  const outputItem = document.createElement("div");
  outputItem.classList.add('image-output__item');
  outputItem.classList.add(`file-format--${outputFileExtension}`);
  outputItem.dataset.elevation = 3;
  outputItem.appendChild(outputItemThumbnail);
  outputItem.appendChild(outputText);
  outputItem.appendChild(outputStats);
  outputItem.appendChild(outputDownload);

  // Place item first in the output container
  outputDownloadContent.prepend(outputItem);

  imageCount++;
  outputDownloadContainer.dataset.count = imageCount;
  selectSubpageOutput.dataset.count = imageCount;
  compressedImageCount.dataset.count = imageCount;
  compressedImageCount.textContent = imageCount;

  if (compressProcessedCount === 0) {
    // Only auto-select Images subpage for the first processed image
    selectSettingsSubpage('output');
  }

  imageCompression(output, thumbnailCompressionOptions)
    .then(thumbnailBlob => {
      outputItemThumbnail.src = URL.createObjectURL(thumbnailBlob);
    });
}


function updateFileExtension(originalName, fileExtension, selectedFormat) {
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const newExtension = selectedFormat ? mimeToExtension(fileExtension) : fileExtension;
  return `${baseName}.${newExtension}`;
}


function abort(event) {
  event.stopPropagation();
  if (!controller) return;
  resetCompressionState(false, true);
  controller.abort(new Error("Image compression cancelled"));
  // TODO: Display abort message in UI
}


function selectDimensionMethod(value) {
  document.querySelector(`input[name="dimensionMethod"][value="${value}"]`).checked = true;
  document.querySelectorAll('#dimensionsMethodGroup .button-card-radio').forEach((el) => {
    el.classList.remove('button-card-radio--is-selected');
  });
  document.querySelector(`input[name="dimensionMethod"][value="${value}"]`).closest('.button-card-radio').classList.add('button-card-radio--is-selected');
  
  const resizeDimensionsField = document.getElementById('resizeDimensionsField');
  if (value === 'limit') {
    resizeDimensionsField.classList.remove('hidden');
  } else {
    resizeDimensionsField.classList.add('hidden');
  }

  return value;
}


function selectFormat(value) {
  document.querySelector(`input[name="formatSelect"][value="${value}"]`).checked = true;
  document.querySelectorAll('#formatMethodGroup .button-card-radio').forEach((el) => {
    el.classList.remove('button-card-radio--is-selected');
  });
  document.querySelector(`input[name="formatSelect"][value="${value}"]`).closest('.button-card-radio').classList.add('button-card-radio--is-selected');
}


function selectSettingsSubpage(value) {
  document.querySelector(`#selectSettingsSubpage input[name="settingsSubpage"][value="${value}"]`).checked = true;
  document.querySelectorAll('#selectSettingsSubpage .segmented-control').forEach((el) => {
    el.classList.remove('segmented-control--is-selected');
  });
  document.querySelector(`#selectSettingsSubpage input[name="settingsSubpage"][value="${value}"]`).closest('.segmented-control').classList.add('segmented-control--is-selected');
  document.body.className = document.body.className.replace(/\bsubpage--\S+/g, '');
  if (value === 'settings') {
    document.body.classList.add('subpage--settings');
  }
  else if (value === 'output') {
    document.body.classList.add('subpage--output');
  }
}


document.addEventListener("DOMContentLoaded", function () {
  const dropZone = document.getElementById("webWorkerDropZone");
  const fileInput = document.getElementById("webWorker");

  dropZone.addEventListener("click", function () {
    if (isCompressing) return;
    fileInput.click();
  });

  fileInput.addEventListener("change", function (event) {
    if (isCompressing) return;
    if (fileInput.files && fileInput.files.length > 0) {
      compressImage(event);
    }
  });

  dropZone.addEventListener("dragenter", function (e) {
    if (isCompressing) return;
    e.preventDefault();
    dropZone.classList.add("drop-zone--is-dragging");
  });

  dropZone.addEventListener("dragover", function (e) {
    if (isCompressing) return;
    e.preventDefault();
    dropZone.classList.add("drop-zone--is-dragging");
  });

  dropZone.addEventListener("dragleave", function (e) {
    if (isCompressing) return;
    e.preventDefault();
    dropZone.classList.remove("drop-zone--is-dragging");
  });

  dropZone.addEventListener("drop", function (e) {
    if (isCompressing) return;
    e.preventDefault();
    dropZone.classList.remove("drop-zone--is-dragging");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      compressImage({ target: fileInput }, true);
    }
  });

  document.querySelectorAll('input[name="compressMethod"]').forEach((radio) => {
    radio.addEventListener("change", toggleFields);
  });
  toggleFields(); // Initialize field visibility based on the default selection
  updateSlider(document.getElementById('initialQuality').value, 'initialQualitySlider');
  selectDimensionMethod(document.querySelector('input[name="dimensionMethod"]:checked').value);
  selectFormat(document.querySelector('input[name="formatSelect"]:checked').value);

  document.getElementById("backToTop").addEventListener("click", function() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
});

function toggleFields() {
  const compressMethod = document.querySelector('input[name="compressMethod"]:checked').value;
  const maxSizeMBField = document.querySelector("label[for='maxSizeMB']").closest(".form-group");
  const initialQualityField = document.querySelector("label[for='initialQuality']").closest(".form-group");

  if (compressMethod === "maxSizeMB") {
    maxSizeMBField.classList.remove("hidden");
    initialQualityField.classList.add("hidden");
  } else {
    maxSizeMBField.classList.add("hidden");
    initialQualityField.classList.remove("hidden");
  }
}


function selectCompressMethod(value) {
  document.querySelector(`input[name="compressMethod"][value="${value}"]`).checked = true;
  document.querySelectorAll('#compressMethodGroup .button-card-radio').forEach((el) => {
    el.classList.remove('button-card-radio--is-selected');
  });
  document.querySelector(`#compressMethodGroup input[name="compressMethod"][value="${value}"]`).closest('.button-card-radio').classList.add('button-card-radio--is-selected');
  toggleFields();
}


async function downloadAllImages() {
  const GB = 1024 * 1024 * 1024;  
  const chunkSize = 1 * GB; // Max zip file size before chunking into parts
  const chunkId = (Math.random().toString(36).substring(2, 6)).toUpperCase(); // Random temporary id to differenciate each download, avoids duplicate zip file names.
  const zipFileName = `mazanoke-images-${chunkId}`;

  try {
    if (isDownloadingAll) return;
    isDownloadingAll = true;
    downloadAllImagesButton.setAttribute('aria-busy', 'true');

    const compressedImages = document.querySelectorAll('a.image-output__item-download-button[href^="blob:"]');
    const blobs = await Promise.all(
      Array.from(compressedImages).map(async (link, index) => {
        try {
          const response = await fetch(link.href);
          if (!response.ok) throw new Error(`Failed to fetch image ${index + 1}`);
          return await response.blob();
        } catch (error) {
          console.error(`Error downloading image ${index + 1}:`, error);
          return null;
        }
      })
    );

    // Filter out failed downloads
    const validBlobs = blobs.filter(blob => blob !== null);
    
    if (validBlobs.length === 0) {
      throw new Error('No valid images to download');
    }

    let currentZip = new JSZip();
    let totalSize = 0;
    let zipIndex = 1;

    for (let i = 0; i < validBlobs.length; i++) {
      // Get the file size of the current image
      const fileSize = parseInt(compressedImages[i].dataset.filesize, 10);
      
      if (totalSize + fileSize > chunkSize) {
        // If adding the next image exceeds `chunkSize`, download the current ZIP and start a new zip file.
        const zipBlob = await currentZip.generateAsync({ type: "blob" });
        await triggerDownload(zipBlob, `${zipFileName}-${zipIndex.toString().padStart(3, '0')}.zip`);
        
        currentZip = new JSZip();
        totalSize = 0;
        zipIndex++;
      }

      currentZip.file(compressedImages[i].download, validBlobs[i]);
      totalSize += fileSize;
    }

    if (totalSize > 0) {
      const finalName = zipIndex === 1 
        ? `${zipFileName}.zip` 
        : `${zipFileName}-${zipIndex.toString().padStart(3, '0')}.zip`;
      const zipBlob = await currentZip.generateAsync({ type: "blob" });
      await triggerDownload(zipBlob, finalName);
    }

  } catch (error) {
    console.error('Download all images as zip failed:', error);
    // TODO: Display error message in UI
  } finally {
    downloadAllImagesButton.setAttribute('aria-busy', 'false');
    isDownloadingAll = false;
  }
}

function deleteAllImages() {
  outputDownloadContent.innerHTML = '';
  outputDownloadContainer.dataset.count = 0;
  selectSubpageOutput.dataset.count = 0;
  compressedImageCount.dataset.count = 0;
  compressedImageCount.textContent = 0;
}

async function triggerDownload(blob, filename) {
  return new Promise((resolve) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      resolve();
    }, 100);
  });
}



function setTheme(themeName) {
  localStorage.setItem('theme', themeName);

  if (themeName === 'theme-light') {
      document.documentElement.classList.remove('theme-dark');
  }
  else {
    document.documentElement.classList.remove('theme-light');
  }

  document.documentElement.classList.add(themeName);

  setTimeout(() => {
    document.documentElement.classList.remove('animate-0');
}, 300);
}


function toggleTheme() {
  document.documentElement.classList.add('animate-0');
  
  if (localStorage.getItem('theme') === 'theme-dark') {
      setTheme('theme-light');
  }
  else {
      setTheme('theme-dark');
  }
}


(function () {
  // Set theme onload
  if (localStorage.getItem('theme') === 'theme-light') {
      setTheme('theme-light');
      document.getElementById('themeSwitchThumb').checked = false;
  }
  else {
      setTheme('theme-dark');
    document.getElementById('themeSwitchThumb').checked = true;
  }
})();