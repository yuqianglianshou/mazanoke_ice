require('dotenv').config();

const fs = require('fs');
const path = require('path');

const filePath = path.join('/usr/share/nginx/html', 'index.html');

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found at ${filePath}`);
  return;
}

let content = fs.readFileSync(filePath, 'utf8');

if (process.env.ENVIRONMENT === 'production') {
  const metatags = `
  <meta name="robots" content="index, follow">
  <meta name="author" content="MAZANOKE">

  <meta property="og:title" content="MAZANOKE - Online image optimizer that runs directly in your browser, locally and privately">
  <meta property="og:description" content="Optimize images and compress them directly in your browser without uploading to external servers. Your images are processed locally and stay private.">
  <meta property="og:url" content="https://www.mazanoke.com">
  <meta property="og:image" content="https://mazanoke.com/assets/images/og-image.jpg">
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="MAZANOKE - Online image optimizer that runs directly in your browser, locally and privately">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="MAZANOKE - Online Image Optimizer for Local and Private Compression">
  <meta name="twitter:description" content="Optimize images and compress them directly in your browser without uploading to external servers. Your images are processed locally and stay private.">
  <meta name="twitter:image" content="https://mazanoke.com/assets/images/og-image.jpg">

  <link rel="canonical" href="https://www.mazanoke.com">
  
  <meta name="keywords" content="online image optimizer, online image compressor, image optimization, local image processing, offline image optimizer, private image optimizer, private image compressor">  
  `;
  content = content.replace('<meta name="robots" content="noindex, nofollow">', metatags);
}

fs.writeFileSync(filePath, content, 'utf8');
