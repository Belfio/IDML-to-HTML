import unzip from "./unzip";
import path from "path";
import fs from "fs";
import { parseSpreadToHTML } from "./spreadParser";

const processIdml = async (idmlUrl: string) => {
  console.log("loaded");
  // first task we need to unzip the idml
  const extractFolder = path.dirname(idmlUrl) + "/extracted";
  // await unzip(idmlUrl, extractFolder);

  // check files
  const folderList = fs.readdirSync(extractFolder);
  console.log(folderList);
  const spreadsFolder = extractFolder + "/Spreads";
  const spreadsFiles = fs.readdirSync(spreadsFolder);
  console.log(spreadsFiles);
  const spread1FileName = spreadsFiles[0];

  const spreadFile = await fs.promises.readFile(
    spreadsFolder + "/" + spread1FileName
  );

  const parsedSpread1 = await parseSpreadToHTML(spreadFile);
  console.log("parsed", parsedSpread1);
  await fs.promises.writeFile("parsed-spread.html", parsedSpread1);

  console.log("done");
};

export default processIdml;
