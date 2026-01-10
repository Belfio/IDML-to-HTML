import { useState } from 'react';
import { fabric } from 'fabric';
import { canvasToHTML } from '~/lib/export/htmlGenerator';

/**
 * ExportMenu: Dropdown menu for exporting documents
 *
 * Key Features:
 * - Export to IDML (modified document)
 * - Export to HTML+CSS (web format)
 * - Export to PDF (coming soon)
 * - Download status feedback
 */

interface ExportMenuProps {
  uploadId: string;
  canvasInstance: fabric.Canvas | null;
  fileName?: string;
}

export function ExportMenu({ uploadId, canvasInstance, fileName = 'document' }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportIDML = async () => {
    setExporting('idml');
    try {
      // Download IDML
      const response = await fetch(`/api/export-idml/${uploadId}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace('.idml', '') + '_modified.idml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('IDML export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportHTML = async () => {
    if (!canvasInstance) {
      alert('Canvas not ready');
      return;
    }

    setExporting('html');
    try {
      // Generate HTML/CSS
      const { html, css } = canvasToHTML(canvasInstance, {
        title: fileName.replace('.idml', ''),
      });

      // Create blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.replace('.idml', '') + '.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Also download CSS
      const cssBlob = new Blob([css], { type: 'text/css' });
      const cssUrl = window.URL.createObjectURL(cssBlob);
      const cssA = document.createElement('a');
      cssA.href = cssUrl;
      cssA.download = fileName.replace('.idml', '') + '.css';
      document.body.appendChild(cssA);
      cssA.click();
      document.body.removeChild(cssA);
      window.URL.revokeObjectURL(cssUrl);

      setIsOpen(false);
    } catch (error) {
      console.error('HTML export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = () => {
    alert('PDF export coming soon!');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-700">
            <div className="py-1">
              {/* IDML Export */}
              <button
                onClick={handleExportIDML}
                disabled={exporting === 'idml'}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-medium">Export to IDML</div>
                  <div className="text-xs text-gray-400">Open in InDesign</div>
                </div>
                {exporting === 'idml' && (
                  <div className="ml-auto">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                )}
              </button>

              {/* HTML Export */}
              <button
                onClick={handleExportHTML}
                disabled={exporting === 'html' || !canvasInstance}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <div>
                  <div className="font-medium">Export to HTML</div>
                  <div className="text-xs text-gray-400">Web format</div>
                </div>
                {exporting === 'html' && (
                  <div className="ml-auto">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                )}
              </button>

              {/* PDF Export */}
              <button
                onClick={handleExportPDF}
                disabled={exporting === 'pdf'}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="font-medium">Export to PDF</div>
                  <div className="text-xs text-gray-400">Coming soon</div>
                </div>
              </button>
            </div>

            {/* Info */}
            <div className="border-t border-gray-700 px-4 py-3">
              <p className="text-xs text-gray-400">
                All exports preserve your edits and modifications.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
