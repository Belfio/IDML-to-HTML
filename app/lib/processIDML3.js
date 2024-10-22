import fs from "fs";
import path from "path";
import analyzeAndParse from "./parser";

async function processIDML(unpackedDir) {
  try {
    // Check if the unpacked directory exists
    if (!fs.existsSync(unpackedDir)) {
      throw new Error(`Directory ${unpackedDir} does not exist.`);
    }

    // Analyze the unpacked directory
    const result = await analyzeAndParse(unpackedDir);
    return result;
    // Output the result
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error processing IDML:", error);
  }
}

// Entry point
// const unpackedDir = path.join(__dirname, "../unpacked"); // Adjust the path as necessary
const parsed = processIDML("/Users/alfredo/NonBackedUp/Code/indesign/unpacked");
parsed
  .then((data) => {
    const outputFilePath = path.join("./", "../output/parsedData.json");
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2));
    console.log(`Parsed data saved to ${outputFilePath}`);
  })
  .catch((error) => {
    console.error("Error saving parsed data:", error);
  });
