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

  let allProductLinks = new Set();
  const totalPagesToScrape = 10; // 👈 scrape first 5 pages

  for (let pageNum = 1; pageNum <= totalPagesToScrape; pageNum++) {
    const paginatedUrl = `${url}?page=${pageNum}`;
    console.log(`\n🔹 Scraping page ${pageNum}: ${paginatedUrl}`);

    try {
      await page.goto(paginatedUrl, { waitUntil: "networkidle2", timeout: 60000 });
      await page.waitForSelector(".product-collection__image a", { timeout: 10000 });

      const productLinks = await page.evaluate(() => {
        const anchors = document.querySelectorAll(".product-collection__image a");
        return Array.from(anchors)
          .map((a) => a.href)
          .filter((href) => href.includes("/products/"));
      });

      productLinks.forEach((link) => allProductLinks.add(link));
    } catch (err) {
      console.warn(`⚠️ Error on page ${pageNum}: ${err.message}`);
      continue;
    }
  }

  console.log(`\n✅ Found total ${allProductLinks.size} product links across ${totalPagesToScrape} pages.`);

  let downloadedCount = 0;
  const noOfImagesToDownload = 400; // you can limit total if needed

  for (const productUrl of allProductLinks) {
    if (downloadedCount >= noOfImagesToDownload) break;
    const productPage = await browser.newPage();

    try {
      await productPage.goto(productUrl, { waitUntil: "domcontentloaded" });
      await productPage.waitForSelector("img.rimage__img[data-master]", {
        visible: true,
        timeout: 10000,
      });

      const highResImage = await productPage.evaluate(() => {
        const img = document.querySelector("img.rimage__img--cover[data-master]");
        if (!img) return null;
        const dataMaster = img.getAttribute("data-master");
        if (!dataMaster) return null;
        const fullUrl = dataMaster.replace("{width}", "720");
        return fullUrl.startsWith("//") ? "https:" + fullUrl : fullUrl;
      });

      if (highResImage) {
        const filename = `image_${downloadedCount + 1}.jpg`;
        console.log(`📥 Downloading ${highResImage}`);
        await downloadImage(highResImage, filename, downloadFolder);
        console.log(`✅ Saved as ${filename}`);
        downloadedCount++;
      } else {
        console.warn(`❌ No high-res image found at ${productUrl}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error processing ${productUrl}: ${error.message}`);
    }

    await productPage.close();
  }

  await browser.close();
  console.log(`\n🎯 Finished. Downloaded ${downloadedCount} images from ${url}.`);
}


// async function scrapeImages(url, downloadFolder) {
//   if (!fs.existsSync(downloadFolder)) {
//     fs.mkdirSync(downloadFolder, { recursive: true });
//   }

//   const browser = await puppeteer.launch({ headless: "new" });
//   const page = await browser.newPage();

//   await page.goto(url, { waitUntil: "networkidle2" });

//   // Step 1: Get product page links
//   //   const productLinks = await page.evaluate(() => {
//   //     const anchors = document.querySelectorAll(".product-collection__image a");
//   //     return Array.from(anchors)
//   //       .map((a) => a.href)
//   //       .filter((href) => href.includes("/products/"));
//   //   });

//   const productLinks = await page.evaluate(() => {
//     const anchors = document.querySelectorAll(".product-collection__image a");
//     const hrefs = Array.from(anchors)
//       .map((a) => a.href)
//       .filter((href) => href.includes("/products/"));

//     // Remove duplicates by converting to a Set and back
//     return Array.from(new Set(hrefs));
//   });

//   console.log(`Found ${productLinks.length} product links.`);

//   let downloadedCount = 0;
//   const noOfImagesToDownload = 100;

//   for (
//     let i = 0;
//     i < productLinks.length && downloadedCount < noOfImagesToDownload;
//     i++
//   ) {
//     const productPage = await browser.newPage();
//     const productUrl = productLinks[i];

//     try {
//       await productPage.goto(productUrl, { waitUntil: "domcontentloaded" });

//       // Wait for the high-res image to be loaded (update selector if needed)
//       await productPage.waitForSelector("img.rimage__img[data-master]", {
//         visible: true,
//         timeout: 10000,
//       });

//       // Extract the final high-res image URL
//       const highResImage = await productPage.evaluate(() => {
//         const img = document.querySelector(
//           "img.rimage__img--cover[data-master]"
//         );
//         if (!img) return null;

//         const dataMaster = img.getAttribute("data-master");
//         if (!dataMaster) return null;

//         // Replace {width} with high-res value
//         const fullUrl = dataMaster.replace("{width}", "720");

//         return fullUrl.startsWith("//") ? "https:" + fullUrl : fullUrl;
//       });

//       if (highResImage) {
//         const filename = `image_${downloadedCount + 1}.jpg`;
//         console.log(`Downloading high-res image from ${highResImage}`);
//         await downloadImage(highResImage, filename, downloadFolder);
//         console.log(`Saved as ${filename}`);
//         downloadedCount++;
//       } else {
//         console.warn(`No high-res image found at ${productUrl}`);
//       }
//     } catch (error) {
//       console.warn(`Error processing ${productUrl}: ${error.message}`);
//     }

//     await productPage.close();
//   }

//   await browser.close();
//   console.log(`Finished. Downloaded ${downloadedCount} high-res images.`);
// }

const apparels = [
  // {
  //   url: "https://www.arabicattire.com/collections/men-thobes",
  //   downloadFolder: "./new_downloaded/downloaded_images/men-thobes",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/men-kurta",
  //   downloadFolder: "./new_downloaded/downloaded_images/men-kurta",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/men-prayer-clothing",
  //   downloadFolder: "./new_downloaded/downloaded_images/men-prayer-clothing",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/ethnic-jackets",
  //   downloadFolder: "./new_downloaded/downloaded_images/ethnic-jackets",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/men-kurta/Trouser",
  //   downloadFolder: "./new_downloaded/downloaded_images/men-kurta-Trouser",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/women-moroccan-kaftan",
  //   downloadFolder: "./new_downloaded/downloaded_images/women-moroccan-kaftan",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/women-dubai-kaftan",
  //   downloadFolder: "./new_downloaded/downloaded_images/women-dubai-kaftan",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/women-wedding-takchita-kaftan",
  //   downloadFolder: "./new_downloaded/downloaded_images/women-wedding-takchita-kaftan",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/women-farasha-kaftan",
  //   downloadFolder: "./new_downloaded/downloaded_images/women-farasha-kaftan",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/women-fustan-dress",
  //   downloadFolder: "./new_downloaded/downloaded_images/women-fustan-dress",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/women-front-open-kaftan",
  //   downloadFolder: "./new_downloaded/downloaded_images/women-front-open-kaftan",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/modest-abaya",
  //   downloadFolder: "./new_downloaded/downloaded_images/modest-abaya",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/printed-abaya",
  //   downloadFolder: "./new_downloaded/downloaded_images/printed-abaya",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/flared-abaya",
  //   downloadFolder: "./new_downloaded/downloaded_images/flared-abaya",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/hooded-abaya",
  //   downloadFolder: "./new_downloaded/downloaded_images/hooded-abaya",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/front-open-abaya",
  //   downloadFolder: "./new_downloaded/downloaded_images/front-open-abaya",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/maxi-dresses",
  //   downloadFolder: "./new_downloaded/downloaded_images/maxi-dresses",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/jilbab",
  //   downloadFolder: "./new_downloaded/downloaded_images/jilbab",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/outerwear",
  //   downloadFolder: "./new_downloaded/downloaded_images/outerwear",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/bottomwear",
  //   downloadFolder: "./new_downloaded/downloaded_images/bottomwear",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/islamic-burkini-swimwear",
  //   downloadFolder: "./new_downloaded/downloaded_images/islamic-burkini-swimwear",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/women-jumpsuits",
  //   downloadFolder: "./new_downloaded/downloaded_images/women-jumpsuits",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/women-anarkali-suits",
  //   downloadFolder: "./new_downloaded/downloaded_images/women-anarkali-suits",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/pant-salwar-suits",
  //   downloadFolder: "./new_downloaded/downloaded_images/pant-salwar-suits",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/palazzo-suits",
  //   downloadFolder: "./new_downloaded/downloaded_images/palazzo-suits",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/lehenga-suits",
  //   downloadFolder: "./new_downloaded/downloaded_images/lehenga-suits",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/patiyala-dresses",
  //   downloadFolder: "./new_downloaded/downloaded_images/patiyala-dresses",
  // },
  // {
  //   url: "https://www.arabicattire.com/collections/sharara-suits",
  //   downloadFolder: "./new_downloaded/downloaded_images/sharara-suits",
  // },
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

// main();
