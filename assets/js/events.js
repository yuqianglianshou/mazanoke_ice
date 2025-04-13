initApp();

function initApp() {
  // Initialize the app
  initDropZone();
  initRadioButtonState();
  initInputValidation();
  initClipboardPaste();
  initBackToTop();
  setConfigForm();
  toggleFields();
}


function initDropZone() {
  const dropZone = ui.groups.dropZone;
  const fileInput = ui.inputs.file;
  const compressingGuard = (handler) => (e) => {
    // Prevent adding more to compression queue when isCompressing.
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
}

function initRadioButtonState() {
  document.querySelectorAll('input[name="compressMethod"]').forEach((radio) => {
    radio.addEventListener("change", toggleFields);
  });
}

function initInputValidation() {
  ui.inputs.quality.addEventListener("change", () => {
    setDimensionMethod(ui.inputs.quality.value);
  });
  
  ui.inputs.limitDimensions.addEventListener("change", (e) => {
    setLimitDimensions(ui.inputs.limitDimensions.value);
  });
  
  ui.inputs.limitWeight.addEventListener("change", (e) => {
    setWeight(ui.inputs.limitWeight.value, ui.inputs.limitWeightUnit.value);
  });
  
  ui.inputs.limitWeightUnit.addEventListener("change", (e) => {
    setWeightUnit(e.target.value);
  });
}

function initClipboardPaste() {
  document.addEventListener("paste", handlePasteImage);
}

function initBackToTop() {
  ui.actions.backToTop.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

function setConfigForm() {
  // Default values of form fields, or for restoring local storage values.
  setQuality(config.form.quality.value);
  setLimitDimensions(config.form.limitDimensions.value);
  setWeightUnit(config.form.limitWeightUnit.value);
  setWeight(config.form.limitWeight.value, config.form.limitWeightUnit.value);
  setCompressMethod(config.form.compressMethod.value);
  setDimensionMethod(config.form.dimensionMethod.value);
  setConvertMethod(config.form.convertMethod.value);
}

function storeConfigForm() {
  // Store form fields values to local storage.
  const configForm = {
    quality: ui.inputs.quality.value,
    limitDimensions: ui.inputs.limitDimensions.value,
    limitWeightUnit: ui.inputs.limitWeightUnit.value,
    limitWeight: ui.inputs.limitWeight.value,
    compressMethod: getCheckedValue(ui.inputs.compressMethod),
    dimensionMethod: getCheckedValue(ui.inputs.dimensionMethod),
    convertMethod: getCheckedValue(ui.inputs.formatSelect),
  };

  localStorage.setItem("configForm", JSON.stringify(configForm));
}

function setSlider(value, sliderId) {
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

  const setSliderPosition = (e) => {
    const rect = slider.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.min(Math.max((offsetX / rect.width) * 100, 0), 100);
    input.value = Math.round(Math.min(percentage, 100));
    setSlider(percentage, slider.id);
  };

  const onMouseMove = (e) => {
    setSliderPosition(e);
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  setSliderPosition(event);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

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

function abort(event) {
  // Cancel on-going compression.
  event.stopPropagation();
  if (!state.controller) return;
  resetCompressionState(false, true);
  state.controller.abort(new Error("Image compression cancelled"));
}

