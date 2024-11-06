import unzipper from "unzipper";
import path from "path";
import fs from "fs";
import { DOMParser } from "xmldom";
import parseSpreadXML from "./spreadParser";

const processIdml = async (idmlUrl: string) => {
  console.log("loaded");
  // size of the file
  const size = idmlUrl;
  console.log("size", size);
  // first task we need to unzip the idml
  // const buffer = fs.readFileSync(idmlUrl);

  // const directory = await await unzipper.Open.file(idmlUrl);
  const extractFolder = path.dirname(idmlUrl) + "/extracted";
  // await directory.extract({ path: extractFolder });

  // we need to go thou
  console.log("unziped");
  const folderList = fs.readdirSync(extractFolder);
  console.log(folderList);
  const spreadsFolder = extractFolder + "/Spreads";
  const spreadsFiles = fs.readdirSync(spreadsFolder);
  console.log(spreadsFiles);
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

function parseSpread(file: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(file, "text/xml");
  const spreadElement = doc.getElementsByTagName("Spread")[0];
  const pages = spreadElement.getElementsByTagName("Page");
  const spreadPages = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    spreadPages.push({
      name: page.getAttribute("Name"),
      geometricBounds: page.getAttribute("GeometricBounds"),
    });
  }

  return {
    id: spreadElement.getAttribute("Self"),
    pages: spreadPages,
  };
}
