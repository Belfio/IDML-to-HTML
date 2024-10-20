import JSZip from "jszip";
import fs from "fs";
import path from "path";
import unzipper from "unzipper";

import { XMLParser } from "fast-xml-parser";

const parseXML = new XMLParser();

/**
 * Parses an IDML file stream and converts it to JSON.
 * @param fileStream - The readable stream of the IDML file.
 * @returns A promise that resolves to the JSON representation of the IDML file.
 */
export async function parseIDMLToJSON(
  fileStream: ReadableStream<Uint8Array>
): Promise<any> {
  try {
    // Convert ReadableStream to ArrayBuffer
    const reader = fileStream.getReader();
    const chunks: Uint8Array[] = [];
    let done: boolean | undefined;
    do {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        chunks.push(result.value);
      }
    } while (!done);
    const fullBuffer = new Uint8Array(
      chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    );
    let offset = 0;
    for (const chunk of chunks) {
      fullBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Load the ZIP content
    const zip = await JSZip.loadAsync(fullBuffer);

    // Extract necessary XML files (e.g., Contents, Stories)
    const contentsXML = await zip.file("designmap.xml")?.async("string");
    if (!contentsXML) {
      throw new Error("designmap.xml not found in IDML package.");
    }

    const parsedContents = parseXML(contentsXML, {
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    // Extract and parse additional XML files as needed
    // For example, parse Stories
    const stories: any = {};
    const storyFiles = Object.keys(zip.files).filter(
      (filename) => filename.startsWith("Stories/") && filename.endsWith(".xml")
    );

    for (const storyFile of storyFiles) {
      const storyContent = await zip.file(storyFile)?.async("string");
      if (storyContent) {
        const parsedStory = parseXML(storyContent, {
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
        });
        stories[storyFile] = parsedStory;
      }
    }

    // Combine parsed data into a single JSON object
    const idmlJSON = {
      contents: parsedContents,
      stories: stories,
      // Add more extracted and parsed data as needed
    };

    return idmlJSON;
  } catch (error) {
    console.error("Error parsing IDML file:", error);
    throw new Error("Failed to parse IDML file.");
  }
}

export async function extractIDML(filePath: string): Promise<string> {
  const targetDir = path.join("/tmp", "idml_extracted");
  console.log("Extracting IDML to", targetDir);

  return targetDir;
  // Cleanup any existing extraction directory
  if (fs.existsSync(targetDir)) {
    await fs.promises.rm(targetDir, { recursive: true, force: true });
  }

  // Ensure the target directory exists
  await fs.promises.mkdir(targetDir, { recursive: true });

  // Unzip the IDML file to the target directory
  await fs
    .createReadStream(filePath)
    .pipe(unzipper.Extract({ path: targetDir }))
    .promise();

  console.log(`IDML extracted to ${targetDir}`);
  return targetDir;
}
