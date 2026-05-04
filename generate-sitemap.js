const axios = require("axios");
const fs = require("fs");

const TOKEN = process.env.WEBFLOW_API_TOKEN;
const SITE_ID = process.env.WEBFLOW_SITE_ID;
const BASE_URL = "https://www.spotdraft.com";

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "accept-version": "1.0.0",
};

async function getCollections() {
  const res = await axios.get(
    `https://api.webflow.com/sites/${SITE_ID}/collections`,
    { headers }
  );
  return res.data;
}

async function getItems(collectionId) {
  const res = await axios.get(
    `https://api.webflow.com/collections/${collectionId}/items`,
    { headers }
  );
  return res.data.items;
}

function toXmlDate(dateStr) {
  return new Date(dateStr).toISOString().split("T")[0];
}

function buildSitemap(urls) {
  const urlEntries = urls
    .map(
      ({ loc, lastmod }) => `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

async function main() {
  const collections = await getCollections();
  let allUrls = [];

  for (const col of collections) {
    const items = await getItems(col._id);
    for (const item of items) {
      if (item._archived || item._draft) continue;
      allUrls.push({
        loc: `${BASE_URL}/${col.slug}/${item.slug}`,
        lastmod: toXmlDate(item["updated-on"] || item["created-on"]),
      });
    }
  }

  const xml = buildSitemap(allUrls);
  fs.writeFileSync("sitemap.xml", xml);
  console.log(`✅ Sitemap generated with ${allUrls.length} URLs`);
}

main();
