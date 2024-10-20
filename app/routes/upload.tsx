import { ActionFunction, json } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { parseIDMLToJSON } from "~/services/idmlParser";
import { extractIDML } from "~/services/idmlParser";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

// Action to handle the file upload
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("idmlFile");

  if (!file || typeof file === "string") {
    return json({ error: "No file uploaded" }, { status: 400 });
  }

  if (
    file.type !== "application/vnd.adobe.idml+zip" &&
    !file.name.endsWith(".idml")
  ) {
    return json(
      { error: "Invalid file type. Please upload an IDML file." },
      { status: 400 }
    );
  }

  try {
    const fileStream: ReadableStream<Uint8Array> = file.stream();

    const tempFilePath = path.join("/tmp", "uploads", "exemple.idml");

    // Save the uploaded file temporarily
    const writeStream = fs.createWriteStream(tempFilePath);
    const nodeReadable = Readable.from(
      fileStream as any
    ) as NodeJS.ReadableStream;

    nodeReadable
      .pipe(writeStream)
      .on("finish", () => {
        console.log("File saved");
      })
      .on("error", (error) => {
        console.error("Error saving file", error);
      });

    // Extract the IDML file
    console.log("Extracting IDML file", tempFilePath);
    const targetDir = await extractIDML(tempFilePath);

    // Optionally, delete the temporary file after extraction
    console.log("Deleting temporary file", tempFilePath);

    await fs.promises.unlink(tempFilePath);

    console.log("Parsing IDML file", targetDir);
    const idmlJSON = await parseIDMLToJSON(fileStream);

    // TODO: Handle the JSON data as needed (e.g., save to database, further processing)

    return json({ success: true, data: idmlJSON });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};

// Component for the upload form
export default function Upload() {
  const actionData = useActionData();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload IDML File</h1>
      <form method="post" encType="multipart/form-data" className="space-y-4">
        <input
          type="file"
          name="idmlFile"
          accept=".idml"
          required
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-violet-50 file:text-violet-700
                     hover:file:bg-violet-100"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Upload
        </button>
      </form>
      {actionData?.error && (
        <p className="text-red-500 mt-2">{actionData.error}</p>
      )}
      {actionData?.success && (
        <p className="text-green-500 mt-2">File uploaded successfully!</p>
      )}
    </div>
  );
}
