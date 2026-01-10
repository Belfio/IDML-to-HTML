# IDML Web Editor - API Documentation

> Last Updated: January 10, 2026

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Upload API](#upload-api)
4. [Save API](#save-api)
5. [Export API](#export-api)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Overview

The IDML Web Editor API is a RESTful HTTP API built with Remix. All endpoints return JSON responses unless otherwise specified.

**Base URL**: `http://localhost:3000` (development)

### Response Format

Successful responses follow this structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Authentication

**Current Version**: No authentication required

**Future**: Will implement JWT-based authentication for multi-user support.

---

## Upload API

### Upload IDML File

Upload an IDML file for editing.

**Endpoint**: `POST /upload`

**Request**:
- Content-Type: `multipart/form-data`
- Body:
  - `file`: IDML file (binary)

**Response**:
```json
{
  "uploadId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fileName": "example.idml",
  "spreadsCount": 27,
  "storiesCount": 15
}
```

**Example (curl)**:
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@/path/to/document.idml"
```

**Example (JavaScript)**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
console.log('Upload ID:', data.uploadId);
```

**Validations**:
- File extension must be `.idml`
- File size must be ≤ 50MB
- IDML structure must be valid (mimetype, Spreads/, Stories/)

**Storage**:
- Original: `/uploads/{uploadId}/original.idml`
- Extracted: `/uploads/{uploadId}/extracted/`

---

## Save API

### Save Story (Text Edits)

Save text changes back to Story XML file.

**Endpoint**: `POST /api/save-story`

**Request**:
- Content-Type: `application/json`
- Body:
```json
{
  "uploadId": "a1b2c3d4-...",
  "storyId": "u123",
  "storyData": {
    "ParagraphStyleRange": [{
      "$": { "AppliedParagraphStyle": "ParagraphStyle/$ID/NormalParagraphStyle" },
      "CharacterStyleRange": [{
        "$": {
          "FontStyle": "Regular",
          "PointSize": "12",
          "FillColor": "Color/u123"
        },
        "Content": ["Updated text content"]
      }]
    }]
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Story saved successfully",
  "storyId": "u123"
}
```

**Example (JavaScript)**:
```javascript
const response = await fetch('/api/save-story', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uploadId: 'a1b2c3d4-...',
    storyId: 'u123',
    storyData: updatedStoryData,
  }),
});
```

**Side Effects**:
- Updates `/uploads/{uploadId}/extracted/Stories/Story_{storyId}.xml`
- Preserves all original XML attributes
- Maintains XML formatting

**Auto-Save**: Frontend debounces calls by 2 seconds during typing.

---

### Save Transform (Layout Edits)

Save object transform changes (drag, resize, rotate) back to Spread XML.

**Endpoint**: `POST /api/save-transform`

**Request**:
- Content-Type: `application/json`
- Body:
```json
{
  "uploadId": "a1b2c3d4-...",
  "spreadIndex": 0,
  "objectId": "u456",
  "objectType": "Rectangle",
  "transform": "1.0 0.0 0.0 1.0 100.0 200.0"
}
```

**Parameters**:
- `uploadId`: UUID of the upload
- `spreadIndex`: Zero-based spread index
- `objectId`: IDML `Self` attribute of object
- `objectType`: `"TextFrame"`, `"Rectangle"`, `"Polygon"`, `"Line"`, `"Oval"`
- `transform`: 6-value matrix string `"a b c d tx ty"`

**Response**:
```json
{
  "success": true,
  "message": "Transform saved successfully",
  "objectId": "u456"
}
```

**Transform Matrix Format**:

IDML uses a 6-value affine transformation matrix:
```
[a b c d tx ty]

Represents: | a  c  tx |
           | b  d  ty |
           | 0  0  1  |

Where:
- a, b: Rotation and horizontal scale
- c, d: Rotation and vertical scale
- tx, ty: Translation (position)
```

**Example Transforms**:
- Identity: `"1 0 0 1 0 0"`
- Translate 100pt right, 50pt down: `"1 0 0 1 100 50"`
- Rotate 45°: `"0.707 0.707 -0.707 0.707 0 0"`
- Scale 2x: `"2 0 0 2 0 0"`

**Side Effects**:
- Updates `ItemTransform` attribute in Spread XML
- Preserves all other object attributes

**Auto-Save**: Frontend debounces calls by 2 seconds after drag/resize ends.

---

### Save Image Upload

Upload and replace image in a Rectangle frame.

**Endpoint**: `POST /api/upload-image`

**Request**:
- Content-Type: `multipart/form-data`
- Body:
  - `uploadId`: UUID string
  - `objectId`: IDML object ID (e.g., "u456")
  - `spreadIndex`: Spread index (e.g., "0")
  - `image`: Image file (binary)

**Response**:
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "imagePath": "/uploads/{uploadId}/images/{objectId}.jpg"
}
```

**Validations**:
- Image format: JPEG, PNG, GIF
- Max size: 10MB
- Object must be a Rectangle

**Storage**:
- Saved to: `/uploads/{uploadId}/images/{objectId}.{ext}`
- Referenced in Spread XML via `Image` href

---

## Export API

### Export to IDML

Export edited document back to IDML format.

**Endpoint**: `GET /api/export-idml/:uploadId`

**Parameters**:
- `uploadId`: UUID of the upload

**Response**:
- Content-Type: `application/octet-stream` or `application/zip`
- Content-Disposition: `attachment; filename="document_{uploadId}_modified.idml"`
- Body: Binary IDML (ZIP) file

**Example (JavaScript)**:
```javascript
const response = await fetch(`/api/export-idml/${uploadId}`);
const blob = await response.blob();

// Trigger download
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `document_modified.idml`;
a.click();
window.URL.revokeObjectURL(url);
```

**Example (curl)**:
```bash
curl -O -J http://localhost:3000/api/export-idml/a1b2c3d4-...
```

**Export Process**:
1. Read all modified Spread/Story XML files
2. Build IDML structure:
   - mimetype (uncompressed, must be first!)
   - META-INF/container.xml
   - All Spreads/, Stories/, Resources/ files
3. ZIP with DEFLATE compression (level 9)
4. Return as downloadable file

**ZIP Structure**:
```
document.idml
├─ mimetype                    (uncompressed)
├─ META-INF/
│  └─ container.xml
├─ Spreads/
│  ├─ Spread_u123.xml         (modified)
│  └─ ...
├─ Stories/
│  ├─ Story_u456.xml          (modified)
│  └─ ...
├─ Resources/
│  ├─ Graphic.xml
│  └─ Styles.xml
└─ designmap.xml
```

**Validation**:
- Re-import into editor should work
- Opening in InDesign should work (manual verification)

---

### Export to HTML+CSS

Export document as static HTML+CSS for web viewing.

**Endpoint**: `GET /api/export-html/:uploadId`

**Query Parameters**:
- `html`: (required) URL-encoded HTML content
- `css`: (required) URL-encoded CSS content

**Response**:
- Content-Type: `application/zip`
- Content-Disposition: `attachment; filename="document_{uploadId}_html.zip"`
- Body: ZIP file containing HTML, CSS, and README

**Example (JavaScript)**:
```javascript
// Generate HTML/CSS from canvas
const { html, css } = canvasToHTML(canvasInstance);

// Export
const url = new URL(`/api/export-html/${uploadId}`, window.location.origin);
url.searchParams.set('html', html);
url.searchParams.set('css', css);

window.location.href = url.toString();
```

**ZIP Structure**:
```
document_html.zip
├─ index.html
├─ styles.css
├─ assets/
│  └─ (images, if any)
└─ README.txt
```

**HTML Structure**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>IDML Document</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="spread" style="width: 800px; height: 600px; position: relative;">
    <div class="textframe" style="position: absolute; left: 50px; top: 100px;">
      <p>Text content here</p>
    </div>
    <div class="rectangle" style="position: absolute; left: 200px; top: 300px; width: 100px; height: 50px; background: rgb(255, 0, 0);"></div>
  </div>
</body>
</html>
```

**Limitations**:
- Absolute positioning (not responsive)
- No linked text frames (single frame only)
- CMYK colors approximated to RGB
- Fonts may differ (web-safe fallbacks)

---

## Error Handling

### Error Response Format

All errors return:
- HTTP status code (400, 404, 500, etc.)
- JSON body:

```json
{
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_FILE_TYPE` | 400 | File is not .idml |
| `FILE_TOO_LARGE` | 400 | File exceeds 50MB |
| `UPLOAD_NOT_FOUND` | 404 | Upload ID not found |
| `SPREAD_NOT_FOUND` | 404 | Spread index out of range |
| `STORY_NOT_FOUND` | 404 | Story ID not found |
| `INVALID_IDML` | 400 | IDML structure invalid |
| `XML_PARSE_ERROR` | 500 | XML parsing failed |
| `ZIP_ERROR` | 500 | ZIP creation/extraction failed |
| `FILE_SYSTEM_ERROR` | 500 | File read/write failed |

### Example Error Response

```json
{
  "error": "Upload not found",
  "code": "UPLOAD_NOT_FOUND",
  "details": {
    "uploadId": "invalid-uuid",
    "path": "/uploads/invalid-uuid/extracted/"
  }
}
```

### Client-Side Error Handling

```javascript
try {
  const response = await fetch('/api/save-story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Request failed');
  }

  const result = await response.json();
  console.log('Success:', result);
} catch (error) {
  console.error('Error saving story:', error.message);
  alert('Failed to save changes. Please try again.');
}
```

---

## Rate Limiting

**Current Version**: No rate limiting

**Future**: Will implement rate limiting to prevent abuse:
- 100 requests per minute per IP
- 10 uploads per hour per IP
- Exponential backoff on repeated failures

---

## WebSocket API (Future)

### Real-Time Collaboration (Planned)

**Endpoint**: `ws://localhost:3000/ws/editor/:uploadId`

**Events**:
- `object:modified` - Object changed by another user
- `text:changed` - Text edited by another user
- `cursor:moved` - User cursor position
- `user:joined` - User joined session
- `user:left` - User left session

**Payload**:
```json
{
  "type": "object:modified",
  "userId": "user-123",
  "objectId": "u456",
  "transform": "1 0 0 1 100 200",
  "timestamp": 1609459200000
}
```

**Authentication**: JWT token in WebSocket handshake

---

## Best Practices

### API Usage

1. **Always validate responses**: Check `response.ok` before parsing JSON
2. **Handle errors gracefully**: Display user-friendly messages
3. **Debounce auto-saves**: Avoid excessive API calls during typing/dragging
4. **Use proper content types**: `application/json` for JSON, `multipart/form-data` for files
5. **Clean up resources**: Revoke object URLs after downloads

### Performance

1. **Batch operations**: Save multiple changes in single request when possible
2. **Cache responses**: Store uploaded document metadata locally
3. **Compress requests**: Use gzip compression for large payloads
4. **Optimize images**: Resize/compress before uploading

### Security

1. **Validate inputs**: Don't trust client-side validation alone
2. **Sanitize XML**: Escape special characters before saving to XML
3. **Use HTTPS**: Always use HTTPS in production
4. **Secure uploads**: Validate file types and sizes on server

---

## Changelog

### v1.0.0 (2026-01-10)
- Initial API release
- Upload, save, and export endpoints
- IDML and HTML export support

### Planned Features
- PDF export endpoint
- WebSocket collaboration API
- Batch save endpoint
- Version history API
- Cloud storage integration

---

## Support

For API issues or questions:
- GitHub Issues: [https://github.com/your-repo/issues](https://github.com/your-repo/issues)
- Email: support@example.com

---

**API Version**: 1.0.0
**Last Updated**: January 10, 2026
