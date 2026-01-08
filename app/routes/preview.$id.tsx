import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { readFile, readdir } from "fs/promises";
import path from "path";
import { parseSpreadToHTML } from "~/lib/spreadParser";

interface LoaderData {
  uploadId: string;
  parsedHTML: string;
  fileName: string;
  error?: string;
}

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return json({ error: "No upload ID provided" }, { status: 400 });
  }

  try {
    const uploadDir = path.join(process.cwd(), "uploads", id);

    // Find the IDML file in the upload directory
    const files = await readdir(uploadDir);
    const idmlFile = files.find((f) => f.endsWith(".idml"));

    if (!idmlFile) {
      return json({ error: "IDML file not found" }, { status: 404 });
    }

    // Check if parsed-spread.html exists
    const parsedFilePath = path.join(process.cwd(), "parsed-spread.html");
    let parsedHTML = "";

    try {
      parsedHTML = await readFile(parsedFilePath, "utf-8");
    } catch (error) {
      parsedHTML = "<p>Parsing in progress or no content available...</p>";
    }

    return json<LoaderData>({
      uploadId: id,
      parsedHTML,
      fileName: idmlFile,
    });
  } catch (error) {
    console.error("Preview error:", error);
    return json(
      {
        error: error instanceof Error ? error.message : "Failed to load preview",
        uploadId: id,
        parsedHTML: "",
        fileName: "",
      },
      { status: 500 }
    );
  }
};

export default function Preview() {
  const data = useLoaderData<LoaderData>();

  if (data.error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-900 mb-2">Error</h1>
          <p className="text-red-700">{data.error}</p>
          <Link
            to="/"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IDML Preview</h1>
              <p className="text-sm text-gray-600">File: {data.fileName}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Upload New File
              </Link>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-4">Document Info</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-600">Upload ID</dt>
                  <dd className="font-mono text-xs text-gray-900 break-all">
                    {data.uploadId}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">File Name</dt>
                  <dd className="font-medium text-gray-900">{data.fileName}</dd>
                </div>
                <div>
                  <dt className="text-gray-600">Status</dt>
                  <dd className="text-green-600 font-medium">✓ Processed</dd>
                </div>
              </dl>

              <div className="mt-6 pt-4 border-t">
                <h3 className="font-semibold text-gray-900 mb-2">Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    View Raw Data
                  </button>
                  <button className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Download IDML
                  </button>
                  <button className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b">
                <h2 className="font-semibold text-gray-900">Spread Preview</h2>
                <p className="text-sm text-gray-600">
                  Rendered view of your IDML document
                </p>
              </div>

              {/* Preview Content */}
              <div className="p-6">
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[600px]">
                  {/* Render the parsed HTML */}
                  <div
                    className="idml-preview"
                    dangerouslySetInnerHTML={{ __html: data.parsedHTML }}
                  />
                </div>
              </div>

              {/* Preview Controls */}
              <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50">
                    Zoom In
                  </button>
                  <button className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50">
                    Zoom Out
                  </button>
                  <button className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50">
                    Fit to Width
                  </button>
                </div>
                <div className="text-sm text-gray-600">100%</div>
              </div>
            </div>

            {/* HTML Source View */}
            <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b">
                <h2 className="font-semibold text-gray-900">HTML Source</h2>
                <p className="text-sm text-gray-600">
                  Raw HTML generated from IDML parsing
                </p>
              </div>
              <div className="p-4">
                <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto">
                  <code>{data.parsedHTML}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles for IDML Preview */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .idml-preview {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .idml-preview .spread {
            border: 2px solid #e5e7eb;
            padding: 20px;
            background: white;
            margin: 20px 0;
          }
          .idml-preview .page {
            border: 1px solid #d1d5db;
            margin: 10px 0;
            padding: 10px;
            background: #fafafa;
          }
          .idml-preview .text-frame {
            border: 1px dashed #9ca3af;
            padding: 8px;
            margin: 5px 0;
            background: #f9fafb;
          }
          .idml-preview .rectangle {
            border: 1px solid #6b7280;
            padding: 5px;
            margin: 3px 0;
          }
          .idml-preview [data-column-count] {
            display: grid;
            gap: 10px;
          }
          .idml-preview [data-column-count="2"] {
            grid-template-columns: repeat(2, 1fr);
          }
          .idml-preview [data-column-count="3"] {
            grid-template-columns: repeat(3, 1fr);
          }
        `
      }} />
    </div>
  );
}
