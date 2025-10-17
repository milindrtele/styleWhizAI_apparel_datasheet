import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: "AIzaSyD9Be9zyRd8c1YG9WwiP6iqVLQLCxdSV5s", // replace with your real key
});

// Input and Output CSV paths
const inputCsvFile = "input.csv";
const outputCsvFile = "output_test.csv";

// Set up CSV writer
const csvWriter = createObjectCsvWriter({
  path: outputCsvFile,
  header: [{ id: "response", title: "Response" }],
  append: true, // allow writing row-by-row
});

// Delay function for rate limiting
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Gemini API call
async function geminiAPI(rowString) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-04-17",
    contents: {
      role: "user",
      parts: [
        {
          text: `${rowString} in the above csv row I have apparel data and its matching body type, skin tone, undertone. Can you make the matching body type, face type, skintone, and undertone more specific — maybe 2–3 body types, 2–3 face types, 2 skintones, and 1 undertone? Let your response be only the refined CSV row.Make sure that multiple entries in the same value are placed inside double quote marks`,
        },
      ],
    },
  });

  return response.text;
}

// Process one row and immediately write the output
async function processRowAndWrite(row) {
  try {
    const rowString = Object.values(row).join(",");

    const response = await geminiAPI(rowString);

    await csvWriter.writeRecords([{ response: response }]);

    console.log("Row processed and saved.");
  } catch (error) {
    console.error("Error processing row:", error.message);
    await csvWriter.writeRecords([{ response: "Error" }]);
  }
}

// Main CSV processing function
async function processCsv() {
  const rows = [];

  fs.createReadStream(inputCsvFile)
    .pipe(csv())
    .on("data", (row) => {
      rows.push(row);
    })
    .on("end", async () => {
      console.log("CSV file successfully read.");

      for (const row of rows) {
        await processRowAndWrite(row);
        await delay(7000); // 7 seconds delay between requests (approx 9 requests/minute)
      }

      console.log("All rows processed!");
    });
}

// Start processing
processCsv();
