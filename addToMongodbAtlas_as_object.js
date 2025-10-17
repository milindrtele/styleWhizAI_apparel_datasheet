// const csv = require("csvtojson");
// const { MongoClient } = require("mongodb");

import csv from "csvtojson";
import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://metavian:1ifpk91paqLW5EpC@cluster0.xy7uk.mongodb.net/stylewhizAi_db?retryWrites=true&w=majority&appName=Cluster0";
//"mongodb+srv://milindrtmetavian:pujJYVoyD5svnmKd@cluster0.h2hxdyw.mongodb.net/"; // Replace with your URI
const dbName = "stylewhizAi_db"; // Customize as needed
const collectionName = "apparels";

function convertToPreferenceObject(str) {
  const values = str.split(",").map((v) => v.trim());
  const obj = {};
  values.forEach((val, i) => {
    obj[`preference_${i}`] = val;
  });
  return obj;
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
      Texture: convertToPreferenceObject(item["Texture"]),
      Gender: item["Gender"],
      Colour: convertToPreferenceObject(item["Colour"]),
      ClothSleeves: item["Cloth Sleeves"],
      Events: convertToPreferenceObject(item["Events"]),
      MatchingBodyType: convertToPreferenceObject(item["Matching Body Type"]),
      MatchingFaceType: convertToPreferenceObject(item["Matching Face Type"]),
      SkinToneMatching: convertToPreferenceObject(item["Skin tone Matching"]),
      UndertoneMatching: convertToPreferenceObject(item["Undertone Matching"]),
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
