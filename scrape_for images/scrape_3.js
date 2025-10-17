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
    fs.mkdirSync(downloadFolder, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2" });

  // Step 1: Get product page links
  //   const productLinks = await page.evaluate(() => {
  //     const anchors = document.querySelectorAll(".product-collection__image a");
  //     return Array.from(anchors)
  //       .map((a) => a.href)
  //       .filter((href) => href.includes("/products/"));
  //   });

  const productLinks = await page.evaluate(() => {
    const anchors = document.querySelectorAll(".product-collection__image a");
    const hrefs = Array.from(anchors)
      .map((a) => a.href)
      .filter((href) => href.includes("/products/"));

    // Remove duplicates by converting to a Set and back
    return Array.from(new Set(hrefs));
  });

  console.log(`Found ${productLinks.length} product links.`);

  let downloadedCount = 0;
  const noOfImagesToDownload = 10;

  for (
    let i = 0;
    i < productLinks.length && downloadedCount < noOfImagesToDownload;
    i++
  ) {
    const productPage = await browser.newPage();
    const productUrl = productLinks[i];

    try {
      await productPage.goto(productUrl, { waitUntil: "domcontentloaded" });

      // Wait for the high-res image to be loaded (update selector if needed)
      await productPage.waitForSelector("img.rimage__img[data-master]", {
        visible: true,
        timeout: 10000,
      });

      // Extract the final high-res image URL
      const highResImage = await productPage.evaluate(() => {
        const img = document.querySelector(
          "img.rimage__img--cover[data-master]"
        );
        if (!img) return null;

        const dataMaster = img.getAttribute("data-master");
        if (!dataMaster) return null;

        // Replace {width} with high-res value
        const fullUrl = dataMaster.replace("{width}", "720");

        return fullUrl.startsWith("//") ? "https:" + fullUrl : fullUrl;
      });

      if (highResImage) {
        const filename = `image_${downloadedCount + 1}.jpg`;
        console.log(`Downloading high-res image from ${highResImage}`);
        await downloadImage(highResImage, filename, downloadFolder);
        console.log(`Saved as ${filename}`);
        downloadedCount++;
      } else {
        console.warn(`No high-res image found at ${productUrl}`);
      }
    } catch (error) {
      console.warn(`Error processing ${productUrl}: ${error.message}`);
    }

    await productPage.close();
  }

  await browser.close();
  console.log(`Finished. Downloaded ${downloadedCount} high-res images.`);
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
  {
    url: "https://www.arabicattire.com/collections/women-moroccan-kaftan",
    downloadFolder: "./downloaded_images/women-moroccan-kaftan",
  },
  {
    url: "https://www.arabicattire.com/collections/women-dubai-kaftan",
    downloadFolder: "./downloaded_images/women-dubai-kaftan",
  },
  {
    url: "https://www.arabicattire.com/collections/women-wedding-takchita-kaftan",
    downloadFolder: "./downloaded_images/women-wedding-takchita-kaftan",
  },
  {
    url: "https://www.arabicattire.com/collections/women-farasha-kaftan",
    downloadFolder: "./downloaded_images/women-farasha-kaftan",
  },
  {
    url: "https://www.arabicattire.com/collections/women-fustan-dress",
    downloadFolder: "./downloaded_images/women-fustan-dress",
  },
  {
    url: "https://www.arabicattire.com/collections/women-front-open-kaftan",
    downloadFolder: "./downloaded_images/women-front-open-kaftan",
  },
  {
    url: "https://www.arabicattire.com/collections/modest-abaya",
    downloadFolder: "./downloaded_images/modest-abaya",
  },
  {
    url: "https://www.arabicattire.com/collections/printed-abaya",
    downloadFolder: "./downloaded_images/printed-abaya",
  },
  {
    url: "https://www.arabicattire.com/collections/flared-abaya",
    downloadFolder: "./downloaded_images/flared-abaya",
  },
  {
    url: "https://www.arabicattire.com/collections/hooded-abaya",
    downloadFolder: "./downloaded_images/hooded-abaya",
  },
  {
    url: "https://www.arabicattire.com/collections/front-open-abaya",
    downloadFolder: "./downloaded_images/front-open-abaya",
  },
  {
    url: "https://www.arabicattire.com/collections/maxi-dresses",
    downloadFolder: "./downloaded_images/maxi-dresses",
  },
  {
    url: "https://www.arabicattire.com/collections/jilbab",
    downloadFolder: "./downloaded_images/jilbab",
  },
  {
    url: "https://www.arabicattire.com/collections/outerwear",
    downloadFolder: "./downloaded_images/outerwear",
  },
  {
    url: "https://www.arabicattire.com/collections/bottomwear",
    downloadFolder: "./downloaded_images/bottomwear",
  },
  {
    url: "https://www.arabicattire.com/collections/islamic-burkini-swimwear",
    downloadFolder: "./downloaded_images/islamic-burkini-swimwear",
  },
  {
    url: "https://www.arabicattire.com/collections/women-jumpsuits",
    downloadFolder: "./downloaded_images/women-jumpsuits",
  },
  {
    url: "https://www.arabicattire.com/collections/women-anarkali-suits",
    downloadFolder: "./downloaded_images/women-anarkali-suits",
  },
  {
    url: "https://www.arabicattire.com/collections/pant-salwar-suits",
    downloadFolder: "./downloaded_images/pant-salwar-suits",
  },
  {
    url: "https://www.arabicattire.com/collections/palazzo-suits",
    downloadFolder: "./downloaded_images/palazzo-suits",
  },
  {
    url: "https://www.arabicattire.com/collections/lehenga-suits",
    downloadFolder: "./downloaded_images/lehenga-suits",
  },
  {
    url: "https://www.arabicattire.com/collections/patiyala-dresses",
    downloadFolder: "./downloaded_images/patiyala-dresses",
  },
  {
    url: "https://www.arabicattire.com/collections/sharara-suits",
    downloadFolder: "./downloaded_images/sharara-suits",
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

main();
