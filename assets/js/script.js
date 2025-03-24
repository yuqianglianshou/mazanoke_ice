const progressContainer = document.querySelector(".progress-container");
const progressTrack = document.querySelector("#webWorkerProgressTrack");
const progressBar = document.querySelector("#webWorkerProgressBar");
const progressText = document.querySelector("#webWorkerProgressText");
const outputDownloadContainer = document.querySelector("#outputDownloadContainer");
const outputDownloadContent = document.querySelector("#outputDownloadContent");
const selectSubpageOutput = document.querySelector("#selectSubpageOutput");
const webWorkerAbort = document.getElementById("webWorkerAbort");
const dropZoneActions = document.getElementById("dropZoneActions");
const compressedImageCount = document.getElementById("compressedImageCount");
let compressMethod;
let isCompressing = false;
let inputFileSize;
let imageCount = 0;

/**
 * TODO:
 * - Prevent color transition on initial load and when switching theme. Use css multiplier during transition to cause duration to be 0?
 * - Handle PNG compression better when quality option is used.
 *  - E.g. convert to jpg first and compress, and convert back to png on output?
 * - Double check state of settings on page load, in case of browser back button.
 * - Save settings to local storage and restore.
 * - Store compressed images in local storage, and allow clear individual item and all.
 * - Add support for image upload queue.
 */

function resetCompressionState() {
  setTimeout(() => {
    document.body.classList.remove("compressing--is-active");
    dropZoneActions.classList.remove("hidden");
    webWorkerAbort.classList.add("hidden");
    progressContainer.classList.add("hidden");
    progressText.dataset.progress = 0;
    progressText.textContent = "Preparing 0%";
    progressBar.style.width = "0%";
    isCompressing = false;
  }, 1500);
}

function compressImage(event) {
  const file = event.target.files[0];
  setupPreview(file);

  const options = createCompressionOptions(onProgress, file);

  // Update to state: processing
  isCompressing = true;
  document.body.classList.add("compressing--is-active");
  dropZoneActions.classList.add("hidden");
  webWorkerAbort.classList.remove("hidden");
  progressContainer.classList.remove("hidden");
  progressText.textContent = "Preparing";

/*   convertImage(file)
    .then((convertedFile) => imageCompression(convertedFile, options))
    .then((output) => handleCompressionResult(file, output))
    .catch((error) => alert(error.message))
    .finally(() => {
      resetCompressionState();
    }); */

  imageCompression(file, options)
    .then((output) => handleCompressionResult(file, output))
    .catch((error) => alert(error.message))
    .finally(() => {
      resetCompressionState();
  });

  function onProgress(p) {
    console.log("Compressing: ", p, '%');
    progressText.dataset.progress = p;
    progressText.textContent =  'Compressing ' + p + "%";
    progressBar.style.width = p + "%";
    if (p === 100) {
      progressText.textContent = "Done";
    }
  }
}

function setupPreview(file) {
  document.getElementById("preview").src = URL.createObjectURL(file);
  inputFileSize = (file.size / 1024 / 1024).toFixed(2);
/*   imageCompression.getExifOrientation(file).then((o) =>
    console.log("ExifOrientation", o)
  ); */
  controller = typeof AbortController !== "undefined" && new AbortController();
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
  const initialQualityElement = document.querySelector("#initialQuality");
  const maxWidthOrHeightElement = document.querySelector("#maxWidthOrHeight");
  const formatSelectElement = document.querySelector('input[name="formatSelect"]:checked');
  const dimensionMethodElement = document.querySelector('input[name="dimensionMethod"]:checked');

  if (!compressMethodElement || !maxSizeMBElement || !initialQualityElement ||
      !maxWidthOrHeightElement || !formatSelectElement || !dimensionMethodElement) {
    console.error("One or more required elements are missing.");
    return;
  }

  compressMethod = compressMethodElement.value;
  maxSizeMB = parseFloat(maxSizeMBElement.value);
  initialQuality = Math.min(Math.max(parseFloat(initialQualityElement.value) / 100, 0), 1);
  maxWidthOrHeight = Math.max(parseFloat(maxWidthOrHeightElement.value), 1);

  console.log('Input image file size: ', (file.size / 1024 / 1024).toFixed(2), 'MB');

  const dimensionMethod = dimensionMethodElement.value;
  const { selectedFormat } = getFileType();
  const options = {
    maxSizeMB: maxSizeMB && compressMethod === "maxSizeMB" ? maxSizeMB : (file.size / 1024 / 1024).toFixed(2),
    initialQuality: initialQuality && compressMethod === "initialQuality" ? initialQuality : undefined,
    maxWidthOrHeight: dimensionMethod === "limit" ? parseFloat(maxWidthOrHeightElement.value) : undefined,
    useWebWorker: true,
    onProgress,
    preserveExif: false,
    fileType: selectedFormat !== 'nochange' && selectedFormat ? selectedFormat : undefined,
    libURL: "./browser-image-compression.js",
    alwaysKeepResolution: dimensionMethodElement === "limit" ? false : true
  };
  if (controller) {
    options.signal = controller.signal;
  }

  console.log("Settings:", options);
  return options;
}

function getFileType(file) {
  const selectedFormat = document.querySelector('input[name="formatSelect"]:checked').value;
  let imageExtension = '';

  if (selectedFormat && selectedFormat !== "nochange") {
    // If user has specified format to convert to, get file extension based this. 
    imageExtension = selectedFormat.replace("image/", "");
  }
  else if (file) {
    // Get file extension based on user uploaded file format.
    imageExtension = file.type.replace("image/", "");
  }

  if (imageExtension === "jpeg") {
    imageExtension = 'jpg';
  }

  return {
    imageExtension,
    selectedFormat
  };
}


function handleCompressionResult(file, output) {

  const { imageExtension } = getFileType(file);
  const outputImageBlob = URL.createObjectURL(output);

  console.log('asd', file);


  // Thumbnail
  const outputItemThumbnail = document.createElement("img");
  outputItemThumbnail.src = outputImageBlob;
  outputItemThumbnail.classList.add('image-output__item-thumbnail');


  // outputImageBlob dimensions
  const thumbnail = new Image();
  thumbnail.src = outputImageBlob;


  // File name and dimensions
  const outputFileNameText = updateFileExtension(file.name, imageExtension);
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
  const outputFileSize = (output.size / 1024 / 1024).toFixed(2);
  const inputFileSize = (file.size / 1024 / 1024).toFixed(2);
  const filesizeSaved = (inputFileSize - outputFileSize).toFixed(2);
  const filesizeSavedPercentage = ((filesizeSaved / inputFileSize) * 100).toFixed(2);
  const filesizeSavedTrend = filesizeSaved < 0 ? '+' : (filesizeSaved > 0 ? '-' : '');
  const filesizeSavedClass = filesizeSaved <= 0 ? 'badge--error' : 'badge--success';
  const outputFileSizeText = document.createElement("span");
  outputFileSizeText.classList.add('image-output__item-filesize');
  outputFileSizeText.textContent = `${outputFileSize} MB`;


  // File saved badge
  const fileSizeSavedBadge = document.createElement("span");
  fileSizeSavedBadge.className = `image-output__item-filesize-saved badge ${filesizeSavedClass}`;
  fileSizeSavedBadge.innerHTML = `
    <span class="badge-text">${filesizeSavedTrend}${filesizeSavedPercentage}%</span>
  `;

    
  // File format badge
  const outputFormatBadge = document.createElement("span");

  outputFormatBadge.className = `image-output__item-fileformat badge file-format--${imageExtension}`;
  outputFormatBadge.textContent = imageExtension.toUpperCase() === 'WEBP' ? 'WebP' : imageExtension.toUpperCase();


  // Download button
  const outputDownload = document.createElement("a");
  outputDownload.className = 'image-output__item-download-button button-cta button-primary';
  outputDownload.href = outputImageBlob;
  outputDownload.download = outputFileNameText;
  outputDownload.innerHTML = `
    <svg height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.75 1V1.75V8.68934L10.7197 6.71967L11.25 6.18934L12.3107 7.25L11.7803 7.78033L8.70711 10.8536C8.31658 11.2441 7.68342 11.2441 7.29289 10.8536L4.21967 7.78033L3.68934 7.25L4.75 6.18934L5.28033 6.71967L7.25 8.68934V1.75V1H8.75ZM13.5 9.25V13.5H2.5V9.25V8.5H1V9.25V14C1 14.5523 1.44771 15 2 15H14C14.5523 15 15 14.5523 15 14V9.25V8.5H13.5V9.25Z" fill="currentColor"></path></svg>
    <span>Download</span>
  `;
  console.log("New image file: ", outputFileNameText);


  // Stats,consolidate: file size, saved, format.
  const outputStats = document.createElement("div");
  outputStats.classList.add('image-output__item-stats');
  outputStats.appendChild(outputFileSizeText);
  outputStats.appendChild(fileSizeSavedBadge);
  outputStats.appendChild(outputFormatBadge);



  // Output item container
  const outputItem = document.createElement("div");
  outputItem.classList.add('image-output__item');
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


  selectSettingsSubpage('output');
  document.getElementById("previewAfterCompress").src = outputImageBlob;

  //return uploadToServer(output);
}

function updateFileExtension(originalName, format) {
  // Derive .jpg, .png, or .webp from selected format
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  let extension = "jpg";
  if (format === "image/png" || format === "png") extension = "png";
  if (format === "image/webp" || format === "webp") extension = "webp";
  return baseName + "." + extension;
}

function convertImage(originalBlob, outputFormat, quality) {
  // Naive method of converting image; this does not preserve exif data.
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(originalBlob);
    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL(outputFormat, quality);
      fetch(dataURL)
        .then((res) => res.blob())
        .then((convertedBlob) => resolve(convertedBlob))
        .catch((err) => reject(err));
    };
    img.onerror = function (err) {
      reject(err);
    };
  });
}

function abort() {
  if (!controller) return;
  controller.abort(new Error("Image compression is aborted"));
  alert("aborted");
  resetCompressionState();
}

function uploadToServer(file) {
  // const formData = new FormData()
  // formData.append('image', file, file.name)
  // const url = 'http://localhost:3000/image-upload-api'
  // return fetch(url, {
  //   method: 'POST',
  //   body: formData
  // }).then(res => res.json())
  //   .then(body => console.log('got server response', body))
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
      compressImage(event, true);
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
  selectDimensionMethod(document.querySelector('input[name="dimensionMethod"]:checked').value); // Initialize field visibility based on the default selection
  selectFormat(document.querySelector('input[name="formatSelect"]:checked').value); // Initialize field visibility based on the default selection

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



function setTheme(themeName) {
  localStorage.setItem('theme', themeName);
  document.documentElement.className = themeName;
}

function toggleTheme() {
  if (localStorage.getItem('theme') === 'theme-dark') {
      setTheme('theme-light');
  }
  else {
      setTheme('theme-dark');
  }
}

(function () {
  if (localStorage.getItem('theme') === 'theme-light') {
      setTheme('theme-light');
      document.getElementById('themeSwitchThumb').checked = false;
  }
  else {
      setTheme('theme-dark');
    document.getElementById('themeSwitchThumb').checked = true;
  }
})();