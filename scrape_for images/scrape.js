import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

// URL to scrape
const url =
  "https://en-ae.6thstreet.com/women/clothing/arabic-clothing/abayas.html?q=Women+Clothing+Arabian+Clothing+Abayas&p=0&hFR%5Bcategories.level0%5D%5B0%5D=Women+%2F%2F%2F+Clothing+%2F%2F%2F+Arabian+Clothing+%2F%2F%2F+Abayas&nR%5Bvisibility_catalog%5D%5B=%5D%5B0%5D%3D1&dFR%5Bin_stock%5D%5B0%5D=1&dFR%5Bgender%5D%5B0%5D=Women&idx=enterprise_magento_english_products";

// Folder to save images
const downloadFolder = "./downloaded_images";

// Create folder if not exists
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder);
}

async function downloadImage(url, filename) {
  const filePath = path.resolve(downloadFolder, filename);
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function scrapeImages() {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const images = [];

    // You need to inspect site carefully, looks like 6thstreet uses:
    $("img.Image-Image").each((i, elem) => {
      const src = $(elem).attr("src");
      if (src) {
        console.log(`Found image: ${src}`);
        images.push(src);
      }
    });

    console.log(`Found ${images.length} images.`);

    // Download images
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      const filename = `image_${i + 1}.jpg`; // You can improve this with the actual file name

      console.log(`Downloading ${imageUrl} as ${filename}...`);
      await downloadImage(imageUrl, filename);
    }

    console.log("Download completed.");
  } catch (error) {
    console.error("Error scraping:", error);
  }
}

scrapeImages();
