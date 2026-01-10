import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useSubmit } from "@remix-run/react";
import { useState, useRef, DragEvent } from "react";
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

    const redirectUrl = `/editor/${uploadId}`;
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
  const submit = useSubmit();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  console.log('[UPLOAD] Page rendered, actionData:', actionData);

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    console.log('[UPLOAD] File dropped');

    const files = e.dataTransfer.files;
    console.log('[UPLOAD] Files in drop:', files.length);

    if (files && files.length > 0) {
      const file = files[0];
      console.log('[UPLOAD] Processing file:', file.name, file.size, 'bytes');

      // Validate file type
      if (!file.name.endsWith('.idml')) {
        console.error('[UPLOAD] Invalid file type:', file.name);
        alert('Please upload a valid IDML file');
        return;
      }

      // Validate file size (50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        console.error('[UPLOAD] File too large:', file.size);
        alert('File too large. Maximum size is 50MB.');
        return;
      }

      console.log('[UPLOAD] File validation passed');

      // Update file input and submit
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        setSelectedFileName(file.name);

        // Create FormData and submit
        const formData = new FormData();
        formData.append('idmlFile', file);
        console.log('[UPLOAD] Submitting via drag-drop...');
        submit(formData, { method: 'post', encType: 'multipart/form-data' });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('[UPLOAD] File input changed:', file?.name, file?.size);
    if (file) {
      setSelectedFileName(file.name);
      console.log('[UPLOAD] File selected:', file.name);
    }
  };

  const handleDropZoneClick = () => {
    console.log('[UPLOAD] Drop zone clicked, opening file picker');
    fileInputRef.current?.click();
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log('[UPLOAD] Form submit button clicked');
    const formData = new FormData(e.currentTarget);
    const file = formData.get('idmlFile') as File;
    console.log('[UPLOAD] Form file:', file?.name, file?.size);

    if (!file || file.size === 0) {
      console.error('[UPLOAD] No file selected in form!');
      e.preventDefault();
      alert('Please select an IDML file first');
      return;
    }

    console.log('[UPLOAD] Form submission proceeding...');
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Upload IDML File</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <Form method="post" encType="multipart/form-data" className="space-y-4" onSubmit={handleFormSubmit}>
          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleDropZoneClick}
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-200
              ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
              }
            `}
          >
            <div className="flex flex-col items-center space-y-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isDragging ? 'bg-blue-100' : 'bg-gray-200'
                }`}
              >
                <svg
                  className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-500'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragging ? 'Drop your IDML file here' : 'Drag and drop your IDML file here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              </div>

              {selectedFileName && (
                <div className="mt-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                  <p className="text-sm text-green-700 font-medium">{selectedFileName}</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="idmlFile"
              type="file"
              name="idmlFile"
              accept=".idml"
              required
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <p className="text-sm text-gray-500 text-center">
            Maximum file size: 50MB. Only .idml files are accepted.
          </p>

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
          <li>You'll be redirected to the editor</li>
          <li>You can view and edit the content</li>
        </ul>
      </div>
    </div>
  );
}
