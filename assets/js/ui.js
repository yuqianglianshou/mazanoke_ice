/**
 * TODO:
 * - Improve error handling
 * - Double check state of settings on page load, in case of browser back button.
 * - Save settings to local storage and restore.
 * - Allow clear individual items and all items.
 */

function toggleFields() {
  // Trigger to check through the current state and update the form fields accordingly.
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

function resetUI() {
  // Resets the UI primarily around the dropzone area.
  ui.actions.abort.classList.add("hidden");
  document.body.classList.remove("compressing--is-active");
  ui.actions.dropZone.classList.remove("hidden");
  ui.progress.container.classList.add("hidden");
  ui.progress.text.dataset.progress = 0;
  ui.progress.bar.style.width = "0%";
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

function selectCompressMethod(value) {
  // Form group: Optimization method.
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

function selectDimensionMethod(value) {
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

function selectFormat(value) {
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

