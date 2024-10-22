import unzipper from "unzipper";
import fs from "fs";
import path from "path";
const processIdml = async (idmlUrl: string) => {
  console.log("loaded");
  // size of the file
  const size = idmlUrl;
  console.log("size", size);
  // first task we need to unzip the idml
  // const buffer = fs.readFileSync(idmlUrl);

  const directory = await await unzipper.Open.file(idmlUrl);
  await directory.extract({ path: path.dirname(idmlUrl) + "/extracted" });

  console.log("unziped");
};

export default processIdml;
