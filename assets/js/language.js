const LanguageManager = {
  translations: {
    en: {
      dropOrPaste: "Drop or paste images",
      dropDescription: "jpg png webp heic avif gif svg",
      browse: "Browse",
      settings: "Settings",
      images: "Images",
      settingsTitle: "Settings",
      settingsDescription: "Images are processed locally on your device, ensuring privacy.",
      optimizationMethod: "Optimization method",
      qualityMethodLabel: "Set image quality",
      qualityMethodDescription: "Higher values retain more detail, while lower values result in smaller file sizes.",
      limitWeightMethodLabel: "Limit file size",
      limitWeightMethodDescription: "Compress the image to a target file size.",
      quality: "Quality",
      targetFileSize: "Target file size",
      dimensions: "Dimensions",
      keepOriginalDimensionsLabel: "Keep original dimensions",
      keepOriginalDimensionsDescription: "Do not alter the width and height of the image.",
      limitDimensionsLabel: "Limit dimensions",
      limitDimensionsDescription: "Limit the width and height of the image.",
      maxDimension: "Max dimension",
      convertTo: "Convert to",
      defaultFormatLabel: "Default",
      defaultFormatDescription1: "• JPG, PNG, WebP → Unchanged.",
      defaultFormatDescription2: "• HEIC, AVIF, GIF, SVG → PNG.",
      jpgFormatLabel: "JPG",
      jpgFormatDescription: "Convert any image to JPG.",
      pngFormatLabel: "PNG",
      pngFormatDescription: "Convert any image to PNG.",
      webpFormatLabel: "WebP",
      webpFormatDescription: "Convert any image to WebP.",
      outputImagesTitle: "Images",
      outputImagesDescription: "Optimized images ready for review and download.",
      deleteAll: "Delete all",
      downloadAll: "Download all",
      noImageOptimizedTitle: "No image optimized yet",
      noImageOptimizedDescription: "Upload images above to optimize them. Once compressed, they'll appear here.",
      installAppTitle: "Install MAZANOKE",
      installAppFeature1: "An app shortcut is added to your device.",
      installAppFeature2: "Use even without an internet connection.",
      installAppFeature3: "Whether on the web or app, your images are always processed privately on-device.",
      cancel: "Cancel",
      install: "Install",
      updateAvailableTitle: "Update available",
      updateAvailableMessage: "Refresh the page to update.",
      ignore: "Ignore",
      refresh: "Refresh",
      createdBy: "created by civilblur"
    },
    zh: {
      dropOrPaste: "拖放或粘贴图片",
      dropDescription: "支持 jpg png webp heic avif gif svg",
      browse: "浏览",
      settings: "设置",
      images: "图片",
      settingsTitle: "设置",
      settingsDescription: "图片在您的设备上本地处理，确保隐私。",
      optimizationMethod: "优化方法",
      qualityMethodLabel: "设置图片质量",
      qualityMethodDescription: "较高的值保留更多细节，较低的值生成更小的文件。",
      limitWeightMethodLabel: "限制文件大小",
      limitWeightMethodDescription: "将图片压缩到目标文件大小。",
      quality: "质量",
      targetFileSize: "目标文件大小",
      dimensions: "尺寸",
      keepOriginalDimensionsLabel: "保持原始尺寸",
      keepOriginalDimensionsDescription: "不改变图片的宽度和高度。",
      limitDimensionsLabel: "限制尺寸",
      limitDimensionsDescription: "限制图片的宽度和高度。",
      maxDimension: "最大尺寸",
      convertTo: "转换为",
      defaultFormatLabel: "默认",
      defaultFormatDescription1: "• JPG, PNG, WebP → 不变。",
      defaultFormatDescription2: "• HEIC, AVIF, GIF, SVG → PNG。",
      jpgFormatLabel: "JPG",
      jpgFormatDescription: "将任何图片转换为 JPG。",
      pngFormatLabel: "PNG",
      pngFormatDescription: "将任何图片转换为 PNG。",
      webpFormatLabel: "WebP",
      webpFormatDescription: "将任何图片转换为 WebP。",
      outputImagesTitle: "图片",
      outputImagesDescription: "优化后的图片可供查看和下载。",
      deleteAll: "删除全部",
      downloadAll: "下载全部",
      noImageOptimizedTitle: "尚未优化图片",
      noImageOptimizedDescription: "在上方上传图片进行优化。压缩后将显示在此处。",
      installAppTitle: "安装 MAZANOKE",
      installAppFeature1: "应用程序快捷方式已添加到您的设备。",
      installAppFeature2: "即使没有互联网连接也可以使用。",
      installAppFeature3: "无论在网页还是应用程序中，您的图片始终在设备上私密处理。",
      cancel: "取消",
      install: "安装",
      updateAvailableTitle: "可用更新",
      updateAvailableMessage: "刷新页面以更新。",
      ignore: "忽略",
      refresh: "刷新",
      createdBy: "由 civilblur 创建"
    }
  },

  init() {
    this.elements = document.querySelectorAll('[data-i18n]');
    this.langToggleBtn = document.getElementById('languageSwitchButton');
    this.currentLangText = document.getElementById('currentLangText');
    
    // 初始化语言
    const savedLang = localStorage.getItem('language') || 'zh';
    this.updateLanguage(savedLang);
    
    // 绑定事件
    this.langToggleBtn.addEventListener('click', () => this.toggleLanguage());
  },

  updateLanguage(lang) {
    this.elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (this.translations[lang] && this.translations[lang][key]) {
        if (key === 'dropDescription') {
          const fileTypes = this.translations[lang][key].split(' ');
          element.innerHTML = fileTypes.map(type => `<span>${type}</span>`).join('');
        } else {
          element.textContent = this.translations[lang][key];
        }
      }
    });
    this.currentLangText.textContent = lang === 'en' ? '中文' : 'EN';
    localStorage.setItem('language', lang);
  },

  toggleLanguage() {
    const currentLang = localStorage.getItem('language') || 'zh';
    const newLang = currentLang === 'en' ? 'zh' : 'en';
    this.updateLanguage(newLang);
  }
};

// 初始化语言管理器
document.addEventListener('DOMContentLoaded', () => {
  LanguageManager.init();
}); 