/**
 * TODO:
 * - Improve error handling
 * - Save settings to local storage and restore.
 * - Allow clear individual items and all items.
 */

function resetUI() {
  // Resets the UI primarily around the dropzone area.
  ui.actions.abort.classList.add("hidden");
  document.body.classList.remove("compressing--is-active");
  ui.actions.dropZone.classList.remove("hidden");
  ui.progress.container.classList.add("hidden");
  ui.progress.text.dataset.progress = 0;
  ui.progress.bar.style.width = "0%";
}

function setCompressMethod(value) {
  // Form group: Optimization method.
  const compressMethod = value;

  document.querySelector(
    `input[name="compressMethod"][value="${compressMethod}"]`
  ).checked = true;

  document
    .querySelectorAll("#compressMethodGroup .button-card-radio")
    .forEach((el) => {
      el.classList.remove("button-card-radio--is-selected");
    });

  document
    .querySelector(
      `#compressMethodGroup input[name="compressMethod"][value="${compressMethod}"]`
    )
    .closest(".button-card-radio")
    .classList.add("button-card-radio--is-selected");

    if (compressMethod === "limitWeight") {
      ui.groups.limitWeight.classList.remove("hidden");
      ui.groups.quality.classList.add("hidden");
    }
    else {
      ui.groups.limitWeight.classList.add("hidden");
      ui.groups.quality.classList.remove("hidden");
    }
}

function setDimensionMethod(value) {
  // Form group: Dimensions method.
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

function setQuality(value) {
  // Form group: Quality.
  quality = Number(value);
  if (quality > 100) {
    quality = 100;
    setSlider(100, "qualitySlider");
  }
  if (quality < 0 || isNaN(quality) || quality === "") {
    quality = 0;
    setSlider(0, "qualitySlider");
  }
  else {
    quality = Math.round(quality);
    setSlider(quality, "qualitySlider");
  }

  ui.inputs.quality.value = quality;
}

function setLimitDimensions(value) {
  // Form group: Limit dimensions.
  maxDimension = Number(value);
  if (maxDimension > 30000) {
    maxDimension = 30000;
  }
  else if (maxDimension <= 0 || isNaN(maxDimension) || maxDimension === "") {
    maxDimension = 1;
  }
  else {
    maxDimension = Math.round(maxDimension);
  }

  ui.inputs.limitDimensions.value = maxDimension;
}

function setConvertMethod(value) {
  // Form group: Convert to format.
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

function setWeightUnit(value) {
  // Form group: Limit weight (unit)
  const previousUnit = state.limitWeightUnit.toUpperCase();
  if (previousUnit === value) return;

  Array.from(ui.inputs.limitWeightUnit.options).forEach(option => {
    option.selected = option.value === value;
  });

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
}

function setWeight(weight, unit) {
  // Form group: Limit weight
  const { value, message } = validateWeight(
    weight, unit
  );

  if (!value) {
  }
  else if (value && message) {
    ui.inputs.limitWeight.value = value;
    // TODO: Show message in UI
  }
  else if (value) {
    ui.inputs.limitWeight.value = value;
  }

  ui.inputs.limitWeight.value = value;
}

function selectSubpage(value) {
  // Switch between "Settings", "Images".
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

