const fs = require('fs');
const path = require('path');

const websiteUrl = 'https://jainautocars.in';
const publicDir = path.join(__dirname, 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

// Define the public routes to include in the sitemap
const routes = [
  '/',
  '/used-cars-in-mysore', // Assuming this was the original route for browse
  '/contact',
];

// Start building the sitemap XML string
let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// Add static routes
routes.forEach(route => {
  sitemapContent += `  <url>\n    <loc>${websiteUrl}${route}</loc>\n  </url>\n`;
});

// Close the urlset tag
sitemapContent += `</urlset>`;

// Ensure the public directory exists
if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir);
}

// Write the sitemap content to the sitemap.xml file
fs.writeFileSync(sitemapPath, sitemapContent.trim());

console.log(`Sitemap generated at ${sitemapPath}`);
