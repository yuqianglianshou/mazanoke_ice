const logDom = document.querySelector("#webWorkerLog");
const progressContainer = document.querySelector(".progress-container");
const progressTrack = document.querySelector("#webWorkerProgressTrack");
const progressBar = document.querySelector("#webWorkerProgressBar");
const progressText = document.querySelector("#webWorkerProgressText");
const outputDownloadContainer = document.querySelector("#outputDownloadContainer");
const outputDownloadContent = document.querySelector("#outputDownloadContent");
const webWorkerAbort = document.getElementById("webWorkerAbort");
const dropZoneActions = document.getElementById("dropZoneActions");
const compressedImageCount = document.getElementById("compressedImageCount");
let compressMethod;
let isCompressing = false;
let inputFileSize;
let imageCount = 0;

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
  }, 2000);
}

function compressImage(event) {
  const file = event.target.files[0];
  setupPreview(file);

  const options = createCompressionOptions(onProgress);

  // Update to state: processing
  isCompressing = true;
  document.body.classList.add("compressing--is-active");
  dropZoneActions.classList.add("hidden");
  webWorkerAbort.classList.remove("hidden");
  progressContainer.classList.remove("hidden");
  progressText.textContent = "Preparing";

  convertImage(file)
    .then((convertedFile) => imageCompression(convertedFile, options))
    .then((output) => handleCompressionResult(file, output))
    .catch((error) => alert(error.message))
    .finally(() => {
      resetCompressionState();
    });

  function onProgress(p) {
    console.log("onProgress", p);
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
/*   logDom.innerHTML = 
    "Source image size:" + (file.size / 1024 / 1024).toFixed(2) + "mb"; */
  imageCompression.getExifOrientation(file).then((o) =>
    console.log("ExifOrientation", o)
  );
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

function createCompressionOptions(onProgress) {
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

  const dimensionMethod = dimensionMethodElement.value;
  const options = {
    maxSizeMB: maxSizeMB && compressMethod === "maxSizeMB" ? maxSizeMB : undefined,
    initialQuality: initialQuality && compressMethod === "initialQuality" ? initialQuality : undefined,
    maxWidthOrHeight: dimensionMethod === "limit" ? parseFloat(maxWidthOrHeightElement.value) : undefined,
    useWebWorker: true,
    onProgress,
    preserveExif: false,
    libURL: "./browser-image-compression.js",
  };
  if (controller) {
    options.signal = controller.signal;
  }

  console.log("options:", options);
  return options;
}

function handleCompressionResult(file, output) {
  let imageExtension;
  const selectedFormat = document.querySelector('input[name="formatSelect"]:checked').value;
  console.log("selectedFormat:", selectedFormat);
  if (selectedFormat && selectedFormat !== "nochange") {
    imageExtension = selectedFormat.replace("image/", "");
  } else {
    imageExtension = file.type.replace("image/", "");
  }

  const outputFilename = updateFileExtension(file.name, imageExtension);

  const outputSizeText = document.createElement("div");
  outputSizeText.textContent =
  outputFilename + " (" + (output.size / 1024 / 1024).toFixed(2) + "MB)";

  const formatSpan = document.createElement("span");
  formatSpan.className = `file-format file-format--${imageExtension}`;
  formatSpan.textContent = imageExtension;
  outputSizeText.appendChild(formatSpan);

  const downloadLink = URL.createObjectURL(output);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = downloadLink;
  console.log("outputFilename:", outputFilename);
  downloadAnchor.download = outputFilename;
  downloadAnchor.textContent = "download image";

  const outputItem = document.createElement("div");
  outputItem.classList.add('image-output-item');
  outputItem.appendChild(outputSizeText);
  outputItem.appendChild(document.createTextNode(" "));
  outputItem.appendChild(downloadAnchor);

  outputDownloadContent.prepend(outputItem);

  imageCount++;
  outputDownloadContainer.dataset.count = imageCount;
  compressedImageCount.dataset.count = imageCount;
  compressedImageCount.textContent = '(' + imageCount + ')';


  selectSettingsSubpage('output');
  document.getElementById("previewAfterCompress").src = downloadLink;

  return uploadToServer(output);
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
  document.querySelector(`input[name="compressMethod"][value="${value}"]`).closest('.button-card-radio').classList.add('button-card-radio--is-selected');
  toggleFields();
}