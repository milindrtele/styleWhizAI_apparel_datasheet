import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import axios from "axios";

// URL to scrape
//const url = "https://www.arabicattire.com/collections/women-front-open-kaftan";

// Folder to save images
//const downloadFolder = "./downloaded_images/women-front-open-kaftan";

async function downloadImage(url, filename, downloadFolder) {
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

async function scrapeImages(url, downloadFolder) {
  if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
  }

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2" });

  // Extract image URLs
  const images = await page.evaluate(() => {
    const imgTags = document.querySelectorAll("img.rimage__img");

    return Array.from(imgTags)
      .map((img) => {
        const dataSrcset = img.getAttribute("srcset");
        const dataMaster = img.getAttribute("data-master");

        if (dataSrcset) {
          return dataSrcset.split(",")[0].split(" ")[0].startsWith("//")
            ? "https:" + dataSrcset.split(",")[0].split(" ")[0]
            : dataSrcset.split(",")[0].split(" ")[0];
        }

        return null;
      })
      .filter((src) => src);
  });

  console.log(`Found ${images.length} images.`);

  const noOfImagesToDownload = 10;
  let downloadedCount = 0;
  let currentIndex = 1;

  while (
    downloadedCount < noOfImagesToDownload &&
    currentIndex < images.length
  ) {
    const imageUrl = images[currentIndex];
    const filename = `image_${downloadedCount + 1}.jpg`;

    console.log(`Attempting to download ${imageUrl} as ${filename}...`);

    try {
      await downloadImage(imageUrl, filename, downloadFolder);
      console.log(`Downloaded image ${downloadedCount + 1}: ${imageUrl}`);
      downloadedCount++;
    } catch (error) {
      console.warn(`Failed to download image at ${imageUrl}: ${error.message}`);
      // skip, do not increment downloadedCount
    }

    currentIndex++;
  }

  await browser.close();

  console.log(
    `Download completed. Successfully downloaded ${downloadedCount} images.`
  );
}

const apparels = [
  {
    url: "https://www.arabicattire.com/collections/men-thobes",
    downloadFolder: "./downloaded_images/men-thobes",
  },
  {
    url: "https://www.arabicattire.com/collections/men-kurta",
    downloadFolder: "./downloaded_images/men-kurta",
  },
  {
    url: "https://www.arabicattire.com/collections/men-prayer-clothing",
    downloadFolder: "./downloaded_images/men-prayer-clothing",
  },
  {
    url: "https://www.arabicattire.com/collections/ethnic-jackets",
    downloadFolder: "./downloaded_images/ethnic-jackets",
  },
  {
    url: "https://www.arabicattire.com/collections/men-kurta/Trouser",
    downloadFolder: "./downloaded_images/men-kurta-Trouser",
  },
];

function main() {
  apparels.forEach((apparel) => {
    scrapeImages(apparel.url, apparel.downloadFolder);
  });
}

main();
