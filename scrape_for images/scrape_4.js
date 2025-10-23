import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";
import axios from "axios";

puppeteer.use(StealthPlugin());

async function downloadImage(url, filename, downloadFolder) {
  const filePath = path.resolve(downloadFolder, filename);
  const writer = fs.createWriteStream(filePath);

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    },
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function scrapeImages(url, downloadFolder) {
  if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "accept-language": "en-US,en;q=0.9",
  });

  const totalPagesToScrape = 10;
  const allImageUrls = new Set();

  for (let pageNum = 1; pageNum <= totalPagesToScrape; pageNum++) {
    const paginatedUrl = `${url}?page=${pageNum}`;
    console.log(`\n🔹 Scraping page ${pageNum}: ${paginatedUrl}`);

    let success = false;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries && !success; attempt++) {
      try {
        await page.goto(paginatedUrl, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        // Scroll to load all lazy-loaded images
        await autoScroll(page);

        // Extract image URLs from <img> tags
        const imageUrls = await page.evaluate(() => {
          const imgs = document.querySelectorAll("img.img-responsive");
          return Array.from(imgs)
            .map(img => img.src)
            .filter(Boolean);
        });

        imageUrls.forEach(url => allImageUrls.add(url));
        console.log(`✅ Found ${imageUrls.length} images on page ${pageNum}`);

        success = true;
      } catch (err) {
        console.warn(
          `⚠️ Attempt ${attempt} failed for ${paginatedUrl}: ${err.message}`
        );
        if (attempt < maxRetries) {
          console.log("⏳ Retrying...");
        } else {
          console.warn(`❌ Skipping page ${pageNum} after retries.`);
        }
      }
    }
  }

  console.log(`\n✅ Total unique images found: ${allImageUrls.size}`);

  let downloadedCount = 0;
  const noOfImagesToDownload = 500;

  for (const imgUrl of allImageUrls) {
    if (downloadedCount >= noOfImagesToDownload) break;
    try {
      const filename = `image_${downloadedCount + 1}.jpg`;
      console.log(`📥 Downloading ${imgUrl}`);
      await downloadImage(imgUrl, filename, downloadFolder);
      console.log(`✅ Saved as ${filename}`);
      downloadedCount++;
    } catch (error) {
      console.warn(`⚠️ Error downloading ${imgUrl}: ${error.message}`);
    }
  }

  await browser.close();
  console.log(`\n🎯 Finished. Downloaded ${downloadedCount} images from ${url}.`);
}

// Helper function to auto-scroll the page to bottom
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}


// Example usage
const apparels = [
  {
    url: "https://www.myntra.com/men-topwear",
    downloadFolder: "./new_downloaded/downloaded_images/men-topwear",
  },
  {
    url: "https://www.myntra.com/men-bottomwear",
    downloadFolder: "./new_downloaded/downloaded_images/men-bottomwear",
  },
  {
    url: "https://www.myntra.com/womens-western-wear",
    downloadFolder: "./new_downloaded/downloaded_images/womens-western-wear",
  },
  {
    url: "https://www.myntra.com/fusion-wear",
    downloadFolder: "./new_downloaded/downloaded_images/fusion-wear",
  },
];

async function main() {
  for (const apparel of apparels) {
    try {
      await scrapeImages(apparel.url, apparel.downloadFolder);
    } catch (err) {
      console.error(`Failed to scrape ${apparel.url}: ${err.message}`);
    }
  }
}

main();
