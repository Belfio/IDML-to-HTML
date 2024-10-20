import fs from "fs";
import unzipper from "unzipper";
const path = require("path");
const IDMLlib = require("./lib/IDMLlib"); // Adjust the path as necessary

export function unzipFile(filePath) {
  // use unzipper to unzip the file

  const stream = fs.createReadStream(filePath);
  stream.pipe(unzipper.Extract({ path: "./unpacked" }));
}

unzipFile("./app/assets/idmlFile.idml");

export function convertUnpackedToJSON() {
  const unpackedDir = "./unpacked";
  let jsonData = {};

  fs.readdirSync(unpackedDir).forEach((file) => {
    const filePath = path.join(unpackedDir, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsedContent = IDMLlib.parse(fileContent);
    jsonData[file] = parsedContent;
  });

  fs.writeFileSync("./output.json", JSON.stringify(jsonData, null, 2));
}

convertUnpackedToJSON();
