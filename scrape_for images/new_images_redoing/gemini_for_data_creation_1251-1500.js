import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

// CONFIG
const API_KEY = "AIzaSyCR9G3nxrWGU_TtnOS9pmXRrOihRHNQ3rM"; //key_6
const IMAGE_FOLDER = "./1251-1500"; // 📂 Folder containing images
const OUTPUT_FILE = "./csv/1251-1500.csv";
const WAIT_TIME_MS = 1000;

const ai = new GoogleGenAI({
  apiKey: API_KEY,
});
//const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  throw new Error("Unsupported image format: " + ext);
}

async function processImage(filePath) {
  const imageData = fs.readFileSync(filePath);
  const mimeType = getMimeType(filePath);
  const fileName = path.basename(filePath);

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: [
          {
            text: 'from the image give me following data, Apparel ID	 apparel name	Image assets 	Image URLs	age range 	size 	Cloth material 	Prize Range 	Top wear/bottom wear/ 	texture	Gender	Colour 	Cloth sleeves	Events	matching body type in that order (can have multiple entries)	matching face type in that order (can have multiple entries)	Skin tone Matching in that order	Undertone Matching in that order these are the fields of the datasheet that I am creating, help me create similar data. allowed data is matching body type: hourglass, pear, apple, inverted triangle, rectangle matching face type: oval, round, square, heart, diamond, rectangular Skin tone Matching: ebony, dark, tan, olive, fair, light Undertone Matching: warm, neutral, cool Return the data in CSV format without explanation or title row. example cvs is APRL_002,Mens Kurta,traditional,Adults,L,Cotton Blend,Mid-Range,Top wear,"Smooth fabric, Embroidery",Male,Black,Full sleeves,"casual, party, wedding, formal, seasonal","rectangle, inverted triangle, apple","oval, round, square","dark, olive",neutral',
          },
          {
            inlineData: {
              mimeType: `image/jpeg`,
              data: imageData.toString("base64"),
            },
          },
        ],
      },
    });

    const candidate = result.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (!part?.text) {
      throw new Error("❌ No response text found in model output.");
    }

    const csvText = part.text.trim();

    console.log(`✅ Processed: ${fileName}`);
    return `${fileName},${csvText}`; // prepend filename to CSV row
  } catch (error) {
    console.error(`❌ Error on ${fileName}:`, error.message);
    return `${fileName},ERROR: ${error.message}`;
  }
}

async function run() {
  const MAX_RETRIES = 3;

  let files = fs
    .readdirSync(IMAGE_FOLDER)
    .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));

  // 🔠 Ensure order
  files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // Create output file if needed
  if (!fs.existsSync(OUTPUT_FILE)) {
    fs.writeFileSync(OUTPUT_FILE, "filename,data\n");
  }

  for (const file of files) {
    const filePath = path.join(IMAGE_FOLDER, file);
    let success = false;
    let attempt = 0;
    let resultCsvRow = "";

    while (!success && attempt < MAX_RETRIES) {
      attempt++;
      resultCsvRow = await processImage(filePath);

      // Check if it failed
      if (resultCsvRow.includes("ERROR:")) {
        console.warn(`🔁 Retry ${attempt} for ${file}`);
        await wait(WAIT_TIME_MS);
      } else {
        success = true;
      }
    }

    fs.appendFileSync(OUTPUT_FILE, resultCsvRow + "\n");

    // Wait after a successful request too
    await wait(WAIT_TIME_MS);
  }

  console.log("\n📁 All done. Check:", OUTPUT_FILE);
}

run();
