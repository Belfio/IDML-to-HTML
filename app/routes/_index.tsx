import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import processIdml from "~/lib/processIdml";
import path from "path";

console.log(">>> _index.tsx MODULE LOADED <<<");

export const meta: MetaFunction = () => {
  return [
    { title: "IDML Editor - Upload" },
    { name: "description", content: "Upload and edit IDML files" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("=== INDEX LOADER CALLED ===");
  return json({ message: "Ready to upload" });
}

export async function action({ request }: ActionFunctionArgs) {
  console.log("=== INDEX ACTION CALLED ===");
  console.log("Request method:", request.method);
  console.log("Request URL:", request.url);

  const formData = await request.formData();
  console.log("FormData received");

  const file = formData.get("idmlFile");
  console.log("File from formData:", file ? "File object received" : "No file");

  if (!file || typeof file === "string") {
    console.log("ERROR: No file uploaded");
    return json({ error: "No file uploaded" }, { status: 400 });
  }

  console.log("File details:", {
    name: file.name,
    size: file.size,
    type: file.type
  });

  // Validate file type
  if (!file.name.endsWith(".idml")) {
    console.log("ERROR: Invalid file type");
    return json(
      { error: "Invalid file type. Please upload an IDML file." },
      { status: 400 }
    );
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    console.log("ERROR: File too large");
    return json(
      { error: `File too large. Maximum size is 50MB.` },
      { status: 400 }
    );
  }

  try {
    const uploadId = randomUUID();
    console.log("Generated upload ID:", uploadId);

    const uploadDir = path.join(process.cwd(), "uploads", uploadId);
    console.log("Upload directory:", uploadDir);

    await mkdir(uploadDir, { recursive: true });
    console.log("Upload directory created");

    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = path.join(uploadDir, fileName);
    console.log("File will be saved to:", filePath);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);
    console.log(`✓ File saved: ${filePath} (${buffer.length} bytes)`);

    console.log("Starting IDML processing...");
    await processIdml(filePath);
    console.log("✓ IDML processing complete");

    const redirectUrl = `/preview/${uploadId}`;
    console.log("Redirecting to:", redirectUrl);
    console.log("=== INDEX ACTION COMPLETE ===");
    return redirect(redirectUrl);
  } catch (error) {
    console.error("=== UPLOAD ERROR ===");
    console.error("Error details:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

interface ActionData {
  error?: string;
  success?: boolean;
}

export default function Index() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Upload IDML File</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <Form method="post" encType="multipart/form-data" className="space-y-4">
          <div>
            <label htmlFor="idmlFile" className="block text-sm font-medium text-gray-700 mb-2">
              Select IDML File
            </label>
            <input
              id="idmlFile"
              type="file"
              name="idmlFile"
              accept=".idml"
              required
              className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-violet-50 file:text-violet-700
                         hover:file:bg-violet-100
                         cursor-pointer"
            />
            <p className="mt-2 text-sm text-gray-500">
              Maximum file size: 50MB. Only .idml files are accepted.
            </p>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload and Process
          </button>
        </Form>

        {actionData?.error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{actionData.error}</p>
          </div>
        )}

        {actionData?.success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">Success!</p>
            <p className="text-green-600 text-sm">File uploaded and processed successfully.</p>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">What happens next?</h2>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Your IDML file will be uploaded to the server</li>
          <li>The file will be extracted and parsed</li>
          <li>You'll be redirected to a preview page</li>
          <li>You can view and edit the content</li>
        </ul>
      </div>
    </div>
  );
}
