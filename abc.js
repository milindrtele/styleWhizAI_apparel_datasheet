import csv from "csvtojson";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

const uri =
  "mongodb+srv://metavian:1ifpk91paqLW5EpC@cluster0.xy7uk.mongodb.net/stylewhizAi_db?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "stylewhizAi_db";
const collectionName = "apparels";

// Cloudinary base path
const cloudinaryBase =
  "https://res.cloudinary.com/dyrwl8j9r/image/upload/v1745604647/StyleWhizAi_apparel_dataset/";

// Local base directory where images are stored
const localImageBaseDir = "./StyleWhizAi_apparel_dataset";

// Convert comma-separated string into array
function convertToPreferenceArray(str) {
  if (!str) return [];
  return str.split(",").map((v) => v.trim());
}

// Generate Cloudinary image URLs for a given apparel ID folder
function getImageURLsForApparel(apparelId, index, item) {
  if (index + 1 <= 140) {
    const folderPath = path.join(localImageBaseDir, apparelId);
    try {
      const files = fs
        .readdirSync(folderPath)
        .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file)) // only image files
        .sort(); // optional: sort for consistency
      return files.map((file) => `${cloudinaryBase}${apparelId}/${file}`);
    } catch (err) {
      console.warn(`Warning: Could not find images for ${apparelId}`);
      return [];
    }
  } else if (index + 1 <= 292) {
    return [`${cloudinaryBase}arabic_apparels/img_${index + 1 - 140}.jpg`];
  } else {
    return [item["Image URLs"]];
  }
}

async function importCSV() {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const jsonArray = await csv().fromFile(
      "./SWAI_Apparel_List_v1.0 - Sheet1.csv"
      // "./new apparel datasheet with arabic apparels.csv"
    );

    console.log(jsonArray.length);

    const parsedData = jsonArray
      // .map((item, index) => ({ item, index }))
      // // .filter(({ index }) => index + 1 > 140)
      .map((item, index) => {
        const apparelId = item["Apparel ID"];
        return {
          ApparelID: apparelId,
          ApparelName: item["Apparel Name"],
          ImageAssets: item["Image Assets"],
          ImageURLs: getImageURLsForApparel(apparelId, index, item),
          Type: item["Type"],
          AgeRange: item["Age Range"],
          Size: item["Size"],
          ClothMaterial: item["Cloth Material"],
          PrizeRange: item["Prize Range"],
          WearType: item["Top Wear or bottom Wear"],
          Texture: convertToPreferenceArray(item["Texture"]),
          Gender: item["Gender"],
          Colour: convertToPreferenceArray(item["Colour"]),
          ClothSleeves: item["Cloth Sleeves"],
          Events: convertToPreferenceArray(item["Events"]),
          MatchingBodyType: convertToPreferenceArray(
            item["Matching Body Type"]
          ),
          MatchingFaceType: convertToPreferenceArray(
            item["Matching Face Type"]
          ),
          SkinToneMatching: convertToPreferenceArray(
            item["Skin tone Matching"]
          ),
          UndertoneMatching: convertToPreferenceArray(
            item["Undertone Matching"]
          ),
        };
      });

    // const parsedData = jsonArray.map((item, index) => {
    //   const apparelId = item["Apparel ID"];
    //   return {
    //     ApparelID: apparelId,
    //     ApparelName: item["Apparel Name"],
    //     ImageAssets: item["Image Assets"],
    //     ImageURLs: getImageURLsForApparel(apparelId, index),
    //     Type: item["Type"],
    //     AgeRange: item["Age Range"],
    //     Size: item["Size"],
    //     ClothMaterial: item["Cloth Material"],
    //     PrizeRange: item["Prize Range"],
    //     WearType: item["Top Wear or bottom Wear"],
    //     Texture: convertToPreferenceArray(item["Texture"]),
    //     Gender: item["Gender"],
    //     Colour: convertToPreferenceArray(item["Colour"]),
    //     ClothSleeves: item["Cloth Sleeves"],
    //     Events: convertToPreferenceArray(item["Events"]),
    //     MatchingBodyType: convertToPreferenceArray(item["Matching Body Type"]),
    //     MatchingFaceType: convertToPreferenceArray(item["Matching Face Type"]),
    //     SkinToneMatching: convertToPreferenceArray(item["Skin tone Matching"]),
    //     UndertoneMatching: convertToPreferenceArray(item["Undertone Matching"]),
    //   };
    // });

    const result = await collection.insertMany(parsedData);
    console.log(`${result.insertedCount} documents inserted.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

importCSV();
