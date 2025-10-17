import csv from "csvtojson";
import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://metavian:1ifpk91paqLW5EpC@cluster0.xy7uk.mongodb.net/stylewhizAi_db?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "stylewhizAi_db";
const collectionName = "apparels";

// Convert comma-separated string into array
function convertToPreferenceArray(str) {
  if (!str) return [];
  return str.split(",").map((v) => v.trim());
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

    const jsonArray = await csv().fromFile("./apparel_data.csv");

    const parsedData = jsonArray.map((item) => ({
      ApparelID: item["Apparel ID"],
      ApparelName: item["Apparel Name"],
      ImageAssets: item["Image Assets"],
      ImageURLs: item["Image URLs"],
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
      MatchingBodyType: convertToPreferenceArray(item["Matching Body Type"]),
      MatchingFaceType: convertToPreferenceArray(item["Matching Face Type"]),
      SkinToneMatching: convertToPreferenceArray(item["Skin tone Matching"]),
      UndertoneMatching: convertToPreferenceArray(item["Undertone Matching"]),
    }));

    const result = await collection.insertMany(parsedData);
    console.log(`${result.insertedCount} documents inserted.`);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

importCSV();
