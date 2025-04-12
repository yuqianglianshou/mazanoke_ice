const ui = App.ui;
const config = App.config;
const state = App.state;
zip = new JSZip();

/**
 * TODO:
 * - Improve error handling
 * - Double check state of settings on page load, in case of browser back button.
 * - Save settings to local storage and restore.
 * - Allow clear individual items and all items.
 */

function resetUI() {
  ui.actions.abort.classList.add("hidden");
  document.body.classList.remove("compressing--is-active");
  ui.actions.dropZone.classList.remove("hidden");
  ui.progress.container.classList.add("hidden");
  ui.progress.text.dataset.progress = 0;
  ui.progress.bar.style.width = "0%";
}

function resetCompressionState(isAllProcessed, aborted) {
  const resetState = () => {
    state.compressProcessedCount = 0;
    state.compressQueueTotal = 0;
    ui.progress.queueCount.textContent = "";
    state.compressQueue = [];
    state.isCompressing = false;
  };

  if (aborted) {
    resetUI();
    resetState();
    return;
  }

  if (isAllProcessed) {
    ui.actions.abort.classList.add("hidden");
    ui.progress.bar.style.width = "100%";

    setTimeout(() => {
      resetUI();
      state.isCompressing = false;
    }, 1000);
    return;
  }

  if (state.isCompressing && state.compressProcessedCount === 0) {
    ui.progress.text.dataset.progress = 0;
    ui.progress.text.textContent = "Preparing 0%";
    ui.progress.bar.style.width = "0%";
  }
}

async function preProcessImage(file) {
  let preProcessedImage = null;
  let preProcessedNewFileType = null;

  if (file.type === "image/heic" || file.type === "image/heif") {
    preProcessedImage = await heicTo({
      blob: file,
      type: "image/jpeg",
      quality: 0.9,
    });

    preProcessedNewFileType = "image/jpeg";
  }

  if (file.type === "image/avif") {
    setTimeout(() => {
      ui.progress.text.innerHTML = `Please wait. AVIF files may take longer to prepare<span class="loading-dots">`;
    }, 5000);

    preProcessedImage = await imageCompression(file, {
      quality: 0.8,
      fileType: "image/jpeg",
      useWebWorker: true,
      preserveExif: false,
      libURL: "./browser-image-compression.js",
      alwaysKeepResolution: true,
    });

    preProcessedNewFileType = "image/jpeg";
  }

  return { preProcessedImage, preProcessedNewFileType };
}

function compressImage(event) {
  state.controller = new AbortController();
  state.compressQueue = Array.from(event.target.files);
  state.compressQueueTotal = state.compressQueue.length;
  state.compressProcessedCount = 0;
  state.fileProgressMap = {};

  state.isCompressing = true;
  document.body.classList.add("compressing--is-active");
  ui.actions.dropZone.classList.add("hidden");
  ui.actions.abort.classList.remove("hidden");
  ui.progress.container.classList.remove("hidden");
  ui.progress.text.innerHTML = `Preparing<span class="loading-dots">`;

  compressImageQueue();
}

async function compressImageQueue() {
  if (!state.compressQueue.length) {
    resetCompressionState(true);
    return;
  }

  const file = state.compressQueue[0];
  const i = state.compressProcessedCount;

  if (!isFileTypeSupported(file.type)) {
    console.error(`Unsupported file type: ${file.type}. Skipping "${file.name}".`);
    ui.progress.text.innerHTML = `Unsupported file "<div class='progress-file-name'>${file.name}</div>"`;
    state.compressQueue.shift();
    await compressImageQueue();
    return;
  }

  const options = await createCompressionOptions((p) => onProgress(p, i, file.name), file);
  const { preProcessedImage, preProcessedNewFileType } = await preProcessImage(file);

  if (preProcessedImage) {
    options.fileType = preProcessedNewFileType;
  }

  imageCompression(preProcessedImage || file, options)
    .then((output) => handleCompressionResult(file, output))
    .catch((error) => console.error(error.message))
    .finally(() => {
      state.compressProcessedCount++;
      state.compressQueue.shift();
      resetCompressionState(state.compressProcessedCount === state.compressQueueTotal);
      if (state.compressProcessedCount < state.compressQueueTotal) {
        compressImageQueue();
      }
    });

  function onProgress(p, index, fileName) {
    const overallProgress = calculateOverallProgress(
      state.fileProgressMap,
      state.compressQueueTotal
    );
    const fileNameShort =
      fileName.length > 15 ? fileName.slice(0, 12) + "..." : fileName;
    state.fileProgressMap[index] = p;

    ui.progress.queueCount.textContent = `${
      state.compressProcessedCount + 1
    } / ${state.compressQueueTotal}`;
    ui.progress.text.dataset.progress = overallProgress;
    ui.progress.text.innerHTML = `Optimizing "<div class='progress-file-name'>${fileName}</div>"`;
    ui.progress.bar.style.width = overallProgress + "%";
    console.log(`Optimizing "${fileNameShort}" (${overallProgress}%)`);

    if (p === 100 && state.compressProcessedCount === state.compressQueueTotal - 1) {
      ui.progress.text.innerHTML = `
        <div class="badge badge--success pt-2xs pb-2xs bg:surface">
          <div class="badge-text flex items-center gap-3xs">
            <svg height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM11.5303 6.53033L12.0607 6L11 4.93934L10.4697 5.46967L6.5 9.43934L5.53033 8.46967L5 7.93934L3.93934 9L4.46967 9.53033L5.96967 11.0303C6.26256 11.3232 6.73744 11.3232 7.03033 11.0303L11.5303 6.53033Z" fill="currentColor"></path></svg>
            <span>Done!</span>
          </div>
        <div>
      `;
    }
  }
}

function calculateOverallProgress(progressMap, totalFiles) {
  const sum = Object.values(progressMap).reduce((acc, val) => acc + val, 0);
  return Math.round(sum / totalFiles);
}

function updateSlider(value, sliderId) {
  const slider = document.getElementById(sliderId);
  const fill = slider.querySelector(".slider-fill");
  const thumb = slider.querySelector(".slider-thumb");
  let percentage = value;
  if (value < 0 || isNaN(value) || value === "") {
    percentage = 0;
  } else if (value > 100) {
    percentage = 100;
  }
  fill.style.width = percentage + "%";
  thumb.style.left = Math.min(percentage, 100) + "%";
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
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  updateSliderPosition(event);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

async function createCompressionOptions(onProgress, file) {
  const compressMethod = getCheckedValue(ui.inputs.compressMethod);
  const dimensionMethod = getCheckedValue(ui.inputs.dimensionMethod);
  console.log(dimensionMethod)
  const maxWeight = parseFloat(ui.inputs.limitWeight.value);
  const { selectedFormat } = getFileType(file);

  quality = Math.min(Math.max(parseFloat(ui.inputs.quality.value) / 100, 0), 1);

  console.log("Input image file size: ", (file.size / 1024 / 1024).toFixed(3), "MB");

  let maxWeightMB = ui.inputs.weightUnit.value.toUpperCase() === "KB" ? 
    ui.inputs.limitWeight.value / 1024 : 
    ui.inputs.limitWeight.value;

  let limitDimensionsValue = dimensionMethod === "limit" ? 
    await getAdjustedDimensions(file, ui.inputs.limitDimensions.value) : 
    undefined;

  const options = {
    maxSizeMB: maxWeight && compressMethod === "maxWeight" ? maxWeightMB : (file.size / 1024 / 1024).toFixed(3),
    initialQuality: quality && compressMethod === "quality" ? quality : undefined,
    maxWidthOrHeight: limitDimensionsValue,
    useWebWorker: true,
    onProgress,
    preserveExif: false,
    fileType: selectedFormat || undefined,
    libURL: "./browser-image-compression.js",
    alwaysKeepResolution: true,
  };
  if (state.controller) {
    options.signal = state.controller.signal;
  }

  console.log("Settings:", options);
  return options;
}

function handleCompressionResult(file, output) {
  const { outputFileExtension, selectedFormat } = getFileType(file);
  const outputImageBlob = URL.createObjectURL(output);

  const outputItemThumbnail = document.createElement("img");
  outputItemThumbnail.src = outputImageBlob;
  outputItemThumbnail.classList.add("image-output__item-thumbnail");
  outputItemThumbnail.setAttribute("loading", "lazy");

  const { renamedFileName, isBrowserDefaultFileName } = renameBrowserDefaultFileName(file.name);
  const outputFileNameText = updateFileExtension(
    isBrowserDefaultFileName ? renamedFileName : file.name,
    outputFileExtension,
    selectedFormat
  );
  const outputFileNameStart = outputFileNameText.length > 8 ? outputFileNameText.slice(0, -8) : "";
  const outputFileNameEnd = outputFileNameText.slice(-8);
  const outputText = document.createElement("div");
  outputText.classList.add("image-output__item-text");
  const outputFileName = document.createElement("div");
  outputFileName.classList.add("image-output__item-filename");
  outputFileName.innerHTML = `
    <span class="image-output__item-filename-start">${outputFileNameStart}</span>
    <span class="image-output__item-filename-end">${outputFileNameEnd}</span>
  `;
  outputText.appendChild(outputFileName);
  const outputFileDimensions = document.createElement("div");
  outputFileDimensions.classList.add("image-output__item-dimensions");
  getImageDimensions(outputImageBlob, thumbnail => {
    outputFileDimensions.innerHTML = `
    <div class="image-output__item-dimensions">${thumbnail.width}x${thumbnail.height}</div>
  `;
    outputText.appendChild(outputFileDimensions);
  }); 

  const inputFileSize = parseFloat((file.size / 1024 / 1024).toFixed(3));
  const outputFileSize = parseFloat((output.size / 1024 / 1024).toFixed(3));
  const fileSizeSaved = inputFileSize - outputFileSize;
  const fileSizeSavedPercentage =
    inputFileSize > 0
      ? Math.abs(((fileSizeSaved / inputFileSize) * 100).toFixed(2))
      : "0.000";
  const fileSizeSavedTrend =
    fileSizeSaved < 0 ? "+" : fileSizeSaved > 0 ? "-" : "";
  const fileSizeSavedClass =
    fileSizeSaved <= 0 ? "badge--error" : "badge--success";
  const outputFileSizeText = document.createElement("span");
  outputFileSizeText.classList.add("image-output__item-filesize");
  outputFileSizeText.dataset.filesize = output.size;
  outputFileSizeText.textContent = `${outputFileSize} MB`;

  const fileSizeSavedBadge = document.createElement("span");
  fileSizeSavedBadge.className = `image-output__item-filesize-saved badge ${fileSizeSavedClass}`;
  fileSizeSavedBadge.innerHTML = `
    <span class="badge-text">${fileSizeSavedTrend}${fileSizeSavedPercentage}%</span>
  `;

  const outputFormatBadge = document.createElement("span");
  outputFormatBadge.className = `image-output__item-fileformat badge file-format--${outputFileExtension}`;
  outputFormatBadge.textContent = outputFileExtension.toUpperCase();

  const outputDownload = document.createElement("a");
  outputDownload.className =
    "image-output__item-download-button button-cta button-secondary";
  outputDownload.dataset.filesize = output.size;
  outputDownload.href = outputImageBlob;
  outputDownload.download = outputFileNameText;
  outputDownload.innerHTML = `
    <svg height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" style="color: currentcolor;"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.75 1V1.75V8.68934L10.7197 6.71967L11.25 6.18934L12.3107 7.25L11.7803 7.78033L8.70711 10.8536C8.31658 11.2441 7.68342 11.2441 7.29289 10.8536L4.21967 7.78033L3.68934 7.25L4.75 6.18934L5.28033 6.71967L7.25 8.68934V1.75V1H8.75ZM13.5 9.25V13.5H2.5V9.25V8.5H1V9.25V14C1 14.5523 1.44771 15 2 15H14C14.5523 15 15 14.5523 15 14V9.25V8.5H13.5V9.25Z" fill="currentColor"></path></svg>
    <span class="xs:hidden">Download</span>
  `;
  console.log("New image file: ", outputFileNameText);

  const outputStats = document.createElement("div");
  outputStats.classList.add("image-output__item-stats");
  outputStats.appendChild(outputFileSizeText);
  outputStats.appendChild(fileSizeSavedBadge);
  outputStats.appendChild(outputFormatBadge);

  const outputItem = document.createElement("div");
  outputItem.classList.add("image-output__item");
  outputItem.classList.add(`file-format--${outputFileExtension}`);
  outputItem.dataset.elevation = 3;
  outputItem.appendChild(outputItemThumbnail);
  outputItem.appendChild(outputText);
  outputItem.appendChild(outputStats);
  outputItem.appendChild(outputDownload);

  ui.output.content.prepend(outputItem);

  state.imageCount++;
  ui.output.container.dataset.count = state.imageCount;
  ui.output.subpageOutput.dataset.count = state.imageCount;
  ui.output.imageCount.dataset.count = state.imageCount;
  ui.output.imageCount.textContent = state.imageCount;

  if (state.compressProcessedCount === 0) {
    selectSettingsSubpage("output");
  }

  imageCompression(output, config.thumbnailOptions).then(
    (thumbnailBlob) => {
      outputItemThumbnail.src = URL.createObjectURL(thumbnailBlob);
    }
  );
}

function abort(event) {
  event.stopPropagation();
  if (!state.controller) return;
  resetCompressionState(false, true);
  state.controller.abort(new Error("Image compression cancelled"));
}

function selectDimensionMethod(value) {
  document.querySelector(
    `input[name="dimensionMethod"][value="${value}"]`
  ).checked = true;
  document
    .querySelectorAll("#dimensionsMethodGroup .button-card-radio")
    .forEach((el) => {
      el.classList.remove("button-card-radio--is-selected");
    });
  document
    .querySelector(`input[name="dimensionMethod"][value="${value}"]`)
    .closest(".button-card-radio")
    .classList.add("button-card-radio--is-selected");

  const resizeDimensionsField = document.getElementById(
    "resizeDimensionsField"
  );
  if (value === "limit") {
    resizeDimensionsField.classList.remove("hidden");
  } else {
    resizeDimensionsField.classList.add("hidden");
  }

  return value;
}

function selectFormat(value) {
  ui.inputs.formatSelect.forEach(input => {
    input.checked = input.value === value;
  });
  
  ui.groups.formatMethod.querySelectorAll(".button-card-radio").forEach(el => {
    el.classList.remove("button-card-radio--is-selected");
  });
  
  const selectedInput = Array.from(ui.inputs.formatSelect).find(input => input.value === value);
  if (selectedInput) {
    selectedInput.closest(".button-card-radio").classList.add("button-card-radio--is-selected");
  }
}

function selectSettingsSubpage(value) {
  ui.inputs.settingsSubpage.forEach(input => {
    input.checked = input.value === value;
  });
  
  ui.groups.settingsSubpage.querySelectorAll(".segmented-control").forEach(el => {
    el.classList.remove("segmented-control--is-selected");
  });
  
  const selectedInput = Array.from(ui.inputs.settingsSubpage).find(input => input.value === value);
  if (selectedInput) {
    selectedInput.closest(".segmented-control").classList.add("segmented-control--is-selected");
  }
  
  document.body.className = document.body.className.replace(/\bsubpage--\S+/g, "");
  document.body.classList.add(`subpage--${value}`);
}

function getCheckedValue(nodeList) {
  return [...nodeList].find((el) => el.checked)?.value || null;
}

function toggleFields() {
  const compressMethod = getCheckedValue(ui.inputs.compressMethod);
  
  if (compressMethod === "maxWeight") {
    ui.groups.maxWeight.classList.remove("hidden");
    ui.groups.quality.classList.add("hidden");
  }
  else {
    ui.groups.maxWeight.classList.add("hidden");
    ui.groups.quality.classList.remove("hidden");
  }
}

function selectCompressMethod(value) {
  ui.inputs.compressMethod.forEach(input => {
    input.checked = input.value === value;
  });
  
  ui.groups.compressMethod.querySelectorAll(".button-card-radio").forEach(el => {
    el.classList.remove("button-card-radio--is-selected");
  });
  
  const selectedInput = Array.from(ui.inputs.compressMethod).find(input => input.value === value);
  if (selectedInput) {
    selectedInput.closest(".button-card-radio").classList.add("button-card-radio--is-selected");
  }
  
  toggleFields();
}

document.addEventListener("DOMContentLoaded", (e) => {
  const dropZone = ui.groups.dropZone;
  const fileInput = ui.inputs.file;

  const compressingGuard = (handler) => (e) => {
    if (state.isCompressing) return;
    handler(e);
  };

  dropZone.addEventListener("click", compressingGuard(() => fileInput.click()));

  fileInput.addEventListener("change", compressingGuard((e) => {
    if (fileInput.files?.length) compressImage(e);
  }));

  const toggleDragging = (add) => dropZone.classList.toggle("drop-zone--is-dragging", add);

  dropZone.addEventListener("dragenter", compressingGuard((e) => {
    e.preventDefault();
    toggleDragging(true);
  }));

  dropZone.addEventListener("dragover", compressingGuard((e) => {
    e.preventDefault();
    toggleDragging(true);
  }));

  dropZone.addEventListener("dragleave", compressingGuard((e) => {
    e.preventDefault();
    toggleDragging(false);
  }));

  dropZone.addEventListener("drop", compressingGuard((e) => {
    e.preventDefault();
    toggleDragging(false);
    if (e.dataTransfer.files?.length) {
      fileInput.files = e.dataTransfer.files;
      compressImage({ target: fileInput }, true);
    }
  }));

  document.addEventListener("paste", handlePasteImage);

  ui.inputs.quality.addEventListener("change", () => {
    if (ui.inputs.quality.value > 100) {
      ui.inputs.quality.value = 100;
      updateSlider(100, "qualitySlider");
    }
    if (
      ui.inputs.quality.value < 0 ||
      isNaN(ui.inputs.quality.value) ||
      ui.inputs.quality.value === ""
    ) {
      ui.inputs.quality.value = 0;
      updateSlider(0, "qualitySlider");
    }
    else {
      ui.inputs.quality.value = Math.round(ui.inputs.quality.value);
      updateSlider(ui.inputs.quality.value, "qualitySlider");
    }
  });

  ui.inputs.limitDimensions.addEventListener("change", (e) => {
    if (ui.inputs.limitDimensions.value > 30000) {
      ui.inputs.limitDimensions.value = 30000;
    }
    else if (
      ui.inputs.limitDimensions.value <= 0 ||
      isNaN(ui.inputs.limitDimensions.value) ||
      ui.inputs.limitDimensions.value === ""
    ) {
      ui.inputs.limitDimensions.value = 1;
    }
    else {
      ui.inputs.limitDimensions.value = Math.round(ui.inputs.limitDimensions.value);
    }
  });

  ui.inputs.limitWeight.addEventListener("change", (e) => {
    const { value, message } = validateWeight(
      ui.inputs.limitWeight.value,
      ui.inputs.limitWeightUnit.value
    );

    if (!value) {
    }
    else if (value && message) {
      ui.inputs.limitWeight.value = value;
    }
    else if (value) {
      ui.inputs.limitWeight.value = value;
    }
  });

  ui.inputs.limitWeightUnit.addEventListener("change", (e) => {
    const previousUnit = state.limitWeightUnit.toUpperCase();

    if (previousUnit === "KB") {
      const kbToMb = Number(ui.inputs.limitWeight.value / 1000);
      if (kbToMb < ui.inputs.limitWeight.value) {
        ui.inputs.limitWeight.value = kbToMb;
      }
    }
    else if (previousUnit === "MB") {
      const mbToKb = Number(ui.inputs.limitWeight.value * 1000);
      if (mbToKb > ui.inputs.limitWeight.value) {
        ui.inputs.limitWeight.value = Number(ui.inputs.limitWeight.value * 1000);
      }
    }

    state.limitWeightUnit = ui.inputs.limitWeightUnit.value.toUpperCase();
    ui.labels.limitWeightSuffix.textContent = ui.inputs.limitWeightUnit.value.toUpperCase();
    ui.labels.limitWeightSuffix.dataset.suffix = ui.inputs.limitWeightUnit.value.toUpperCase();
  });

  document.querySelectorAll('input[name="compressMethod"]').forEach((radio) => {
    radio.addEventListener("change", toggleFields);
  });

  toggleFields();

  updateSlider(ui.inputs.quality.value, "qualitySlider");

  selectDimensionMethod(
    document.querySelector('input[name="dimensionMethod"]:checked').value
  );

  selectFormat(
    document.querySelector('input[name="formatSelect"]:checked').value
  );

  ui.actions.backToTop.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

});

function handlePasteImage(e) {
  if (!e.clipboardData || state.isCompressing) return;

  const items = e.clipboardData.items;
  const files = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.kind === "file" && item.type.startsWith("image/")) {
      files.push(item.getAsFile());
    }
  }

  if (files.length) {
    compressImage({ target: { files } });
  }
}

function toggleFields() {
  const method = getCheckedValue(ui.inputs.compressMethod);
  const maxWeightField = document.querySelector(
    "label[for='maxWeight']"
  ).closest(".form-group");
  const qualityField = document.querySelector(
    "label[for='quality']"
  ).closest(".form-group");

  if (method === "maxWeight") {
    maxWeightField.classList.remove("hidden");
    qualityField.classList.add("hidden");
  } else {
    maxWeightField.classList.add("hidden");
    qualityField.classList.remove("hidden");
  }
}

function selectCompressMethod(value) {
  document.querySelector(
    `input[name="compressMethod"][value="${value}"]`
  ).checked = true;
  document
    .querySelectorAll("#compressMethodGroup .button-card-radio")
    .forEach((el) => {
      el.classList.remove("button-card-radio--is-selected");
    });
  document
    .querySelector(
      `#compressMethodGroup input[name="compressMethod"][value="${value}"]`
    )
    .closest(".button-card-radio")
    .classList.add("button-card-radio--is-selected");
  toggleFields();
}

async function downloadAllImages() {
  const GB = 1024 * 1024 * 1024;
  const chunkSize = 1 * GB;
  const zipFileName = appendFileNameId("mazanoke-images");

  try {
    if (state.isDownloadingAll) return;
    state.isDownloadingAll = true;
    ui.actions.downloadAll.setAttribute("aria-busy", "true");

    const compressedImages = document.querySelectorAll(
      'a.image-output__item-download-button[href^="blob:"]'
    );
    const blobs = await Promise.all(
      Array.from(compressedImages).map(async (link, index) => {
        try {
          const response = await fetch(link.href);
          if (!response.ok)
            throw new Error(`Failed to fetch image ${index + 1}`);
          return await response.blob();
        } catch (error) {
          console.error(`Error downloading image ${index + 1}:`, error);
          return null;
        }
      })
    );

    const validBlobs = blobs.filter((blob) => blob !== null);

    if (validBlobs.length === 0) {
      throw new Error("No valid images to download");
    }

    let currentZip = zip;
    let totalSize = 0;
    let zipIndex = 1;

    for (let i = 0; i < validBlobs.length; i++) {
      const fileSize = parseInt(compressedImages[i].dataset.filesize, 10);

      if (totalSize + fileSize > chunkSize) {
        const zipBlob = await currentZip.generateAsync({ type: "blob" });
        await triggerDownload(
          zipBlob,
          `${zipFileName}-${zipIndex.toString().padStart(3, "0")}.zip`
        );

        currentZip = new JSZip();
        totalSize = 0;
        zipIndex++;
      }

      currentZip.file(compressedImages[i].download, validBlobs[i]);
      totalSize += fileSize;
    }

    if (totalSize > 0) {
      const finalName =
        zipIndex === 1
          ? `${zipFileName}.zip`
          : `${zipFileName}-${zipIndex.toString().padStart(3, "0")}.zip`;
      const zipBlob = await currentZip.generateAsync({ type: "blob" });
      await triggerDownload(zipBlob, finalName);
    }
  }
  catch (error) {
    console.error("Download all images as zip failed:", error);
  }
  finally {
    ui.actions.downloadAll.setAttribute("aria-busy", "false");
    state.isDownloadingAll = false;
  }
}

function deleteAllImages() {
  ui.output.content.innerHTML = "";
  ui.output.container.dataset.count = 0;
  ui.output.subpageOutput.dataset.count = 0;
  ui.output.imageCount.dataset.count = 0;
  ui.output.imageCount.textContent = 0;
  state.imageCount = 0;
}

async function triggerDownload(blob, filename) {
  return new Promise((resolve) => {
    const link = document.createElement("a");
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
