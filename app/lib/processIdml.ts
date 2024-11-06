import unzipper from "unzipper";
import path from "path";
import fs from "fs";
import { DOMParser } from "xmldom";
import parseSpreadXML, { parseSpreadToHTML } from "./spreadParser";

const processIdml = async (idmlUrl: string) => {
  console.log("loaded");
  // size of the file
  const size = idmlUrl;
  console.log("size", size);
  // first task we need to unzip the idml
  // const buffer = fs.readFileSync(idmlUrl);

  // const directory = await await unzipper.Open.file(idmlUrl);
  const idmlFilePath = path.join(process.cwd(), idmlUrl);

  const extractFolder = path.dirname(idmlUrl) + "/extracted";
  // await directory.extract({ path: extractFolder });

  // we need to go thou
  console.log("unziped");
  const folderList = fs.readdirSync(extractFolder);
  console.log(folderList);
  const spreadsFolder = extractFolder + "/Spreads";
  const spreadsFiles = fs.readdirSync(spreadsFolder);
  console.log(spreadsFiles);
  const spread1FileName = spreadsFiles[0];
  const parsedSpread1 = parseSpreadToHTML(
    spreadsFolder + "/" + spread1FileName
  );
  console.log(parsedSpread1);
  return;
  const parsedSpreads: {
    id: string | null;
    pages: { name: string | null; geometricBounds: string | null }[];
  }[] = [];
  const parsedHtml: string[] = [];
  const parsedCss: string[] = [];
  spreadsFiles.forEach((f: string) => {
    const content = fs.readFileSync(spreadsFolder + "/" + f, "utf-8");
    const parsed = parseSpread(content);
    parsedSpreads.push(parsed);
    // console.log(parsed.pages);
    parseSpreadXML(spreadsFolder + "/" + f)
      .then(({ html, css }) => {
        console.log("Generated HTML:\n", html);
        console.log("Generated CSS:\n", css);
        parsedHtml.push(html);
        parsedCss.push(css);
      })
      .catch((err) => console.error("Error parsing XML:", err));
  });
  // console.log(parsedSpreads);
  // list some files
};

export default processIdml;
