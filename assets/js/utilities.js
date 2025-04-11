function isFileTypeSupported(fileType) {
  // Check for supported file types
  const supportedFileTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/avif",
    "image/gif",
    "image/svg+xml",
  ];

  return supportedFileTypes.includes(fileType);
}


function mimeToExtension(mimeType) {
  const fileExtensionMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/avif": "avif",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };

  return (
    fileExtensionMap[mimeType] || mimeType.replace("image/", "").split("+")[0]
  );
}


function defaultConversionMapping(mimeType) {
  const conversionMap = {
    // Image file types that cannot be compressed to its original file format
    // are converted to a relevant counterpart.
    "image/heic": "image/png",
    "image/avif": "image/png",
    "image/gif": "image/png",
    "image/svg+xml": "image/png",
  };

  return conversionMap[mimeType] || mimeType;
}


function getFileType(file) {
  let selectedFormat = document.querySelector('input[name="formatSelect"]:checked').value; // User-selected format to convert to, e.g. "image/jpeg".
  let inputFileExtension = ""; // User uploaded image's file extension, e.g. ".jpg".
  let outputFileExtension = ""; // The processed image's file extension, based on `defaultConversionMapping()`.

  if (selectedFormat && selectedFormat !== "default") {
    // The user selected format to convert to.
    const extension = mimeToExtension(selectedFormat);
    inputFileExtension = extension;
    outputFileExtension = extension;
  } else {
    // User has not selected a file format, use the input image's file type.
    selectedFormat = file.type;
    inputFileExtension = mimeToExtension(file.type);
    outputFileExtension = mimeToExtension(defaultConversionMapping(file.type));
  }

  return {
    inputFileExtension,
    outputFileExtension,
    selectedFormat,
  };
}


function updateFileExtension(originalName, fileExtension, selectedFormat) {
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const newExtension = selectedFormat
    ? mimeToExtension(fileExtension)
    : fileExtension;
  return `${baseName}.${newExtension}`;
}


function appendFileNameId(fileName = "image") {
  if (typeof fileName !== 'string') return null;

  const lastDotIndex = fileName.lastIndexOf('.');
  const fileExt = (lastDotIndex === -1 || lastDotIndex === 0) ? '' : fileName.slice(lastDotIndex).toLowerCase();
  const baseFileName = (lastDotIndex === -1) ? fileName : fileName.slice(0, lastDotIndex);

  const fileId = Math.random().toString(36).substring(2, 6).toUpperCase();
  return baseFileName + "-" + fileId + fileExt;
}


function renameBrowserDefaultFileName(fileName) {
  // Naive approach to check if an image was pasted from clipboard and received a default name by the browser,
  // e.g., `image.png`. This method is potentially browser and language-dependent, if naming conventions vary.
  // `HEIF Image.heic` concerns iOS devices, e.g. when drag-and-dropping a subject cut-out.
  const defaultNames = [/^image\.\w+$/i, /^heif image\.heic$/i];

  if (defaultNames.some(regex => regex.test(fileName))) {
    return { renamedFileName: appendFileNameId(fileName), isBrowserDefaultFileName: true };
  }
  return { renamedFileName: fileName, isBrowserDefaultFileName: false };
}


function validateWeight(value, unit = "mb") {
  value = Number(value);
  let [min, max] = [limitWeightMin, limitWeightMax];
  min = unit === "kb" ? min * 1000 : min; 
  max = unit === "kb" ? max * 1000 : max; 

  if (typeof value !== 'number' || isNaN(value) || !Number.isFinite(value)) {
    const message = "Invalid value, not a number.";
    return {value: null, message}
  }
  else if (value < min) {
    const message = `Minimum file size is ${limitWeightMin * 1000}KB or ${limitWeightMin}MB.`;
    return {value: min, message}
  }
  else if (value > max) {
    const message = `Max file size is ${limitWeightMax}MB.`;
    return {value: max, message}
  }

  return {value, message: null}
}


function debugBlobImageOutput(blob) {
  const blobURL = URL.createObjectURL(blob);
  const img = document.createElement("img");
  img.src = blobURL;
  img.style.maxWidth = "100%";
  img.style.display = "block";
  document.body.prepend(img);
}