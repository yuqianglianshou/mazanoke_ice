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
        ui.inputs.limitWeight.step = 0.1;
      }
    }
    else if (previousUnit === "MB") {
      const mbToKb = Number(ui.inputs.limitWeight.value * 1000);
      if (mbToKb > ui.inputs.limitWeight.value) {
        ui.inputs.limitWeight.min = 0; 
        ui.inputs.limitWeight.step = 50;
        ui.inputs.limitWeight.value = mbToKb;
      }
    }

    state.limitWeightUnit = ui.inputs.limitWeightUnit.value.toUpperCase();
    ui.labels.limitWeightSuffix.textContent = ui.inputs.limitWeightUnit.value.toUpperCase();
    ui.labels.limitWeightSuffix.dataset.suffix = ui.inputs.limitWeightUnit.value.toUpperCase();
  });

  document.querySelectorAll('input[name="compressMethod"]').forEach((radio) => {
    radio.addEventListener("change", toggleFields);
  });

  updateSlider(ui.inputs.quality.value, "qualitySlider");


  toggleFields();

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

function abort(event) {
  event.stopPropagation();
  if (!state.controller) return;
  resetCompressionState(false, true);
  state.controller.abort(new Error("Image compression cancelled"));
}
