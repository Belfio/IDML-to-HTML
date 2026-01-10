# IDML Web Editor - User Guide

> Your guide to editing InDesign documents in the browser

## Table of Contents

1. [Getting Started](#getting-started)
2. [Uploading Documents](#uploading-documents)
3. [Editor Interface](#editor-interface)
4. [Editing Text](#editing-text)
5. [Editing Layout](#editing-layout)
6. [Working with Images](#working-with-images)
7. [Managing Layers](#managing-layers)
8. [Navigation](#navigation)
9. [Exporting Documents](#exporting-documents)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Tips & Tricks](#tips--tricks)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What is IDML?

IDML (InDesign Markup Language) is Adobe InDesign's XML-based file format. It's a ZIP archive containing XML files that describe your document's layout, text, styles, and more.

### What Can You Do?

With the IDML Web Editor, you can:
- ✅ Upload IDML files from your computer
- ✅ Edit text content with formatting
- ✅ Move, resize, and rotate objects
- ✅ Create new text frames, rectangles, lines, and shapes
- ✅ Group and ungroup objects
- ✅ Navigate multi-page documents
- ✅ Export to IDML (for InDesign) or HTML+CSS (for web)

### What You Can't Do (Yet)

- ❌ Edit master pages
- ❌ Create/edit paragraph styles
- ❌ Work with linked text frames
- ❌ Export to PDF
- ❌ Add custom fonts

---

## Uploading Documents

### Method 1: Drag and Drop

1. Open the IDML Web Editor
2. Drag your `.idml` file from your file browser
3. Drop it onto the upload area
4. Wait for processing (usually 2-5 seconds)
5. You'll be redirected to the editor

### Method 2: Click to Upload

1. Click the **"Select IDML File"** button
2. Browse to your `.idml` file
3. Click **Open**
4. Wait for processing
5. You'll be redirected to the editor

### Supported Files

- **Format**: `.idml` files only
- **Max Size**: 50 MB
- **Created By**: InDesign CS5 or later

### What Happens During Upload?

1. File is validated (extension, size, structure)
2. ZIP archive is extracted
3. XML files are parsed (Spreads, Stories, Colors)
4. Document is rendered on canvas
5. You can start editing!

---

## Editor Interface

The editor uses an **InDesign-like 3-panel layout**:

```
┌─────────────────────────────────────────────────────────┐
│  Header: [Zoom] [Pages] [Export]                       │
├──────┬────────────────────────────────┬─────────────────┤
│      │                                │                 │
│ Tool │         Canvas Area            │   Properties    │
│Panel │    (Your document appears here)│     Panel       │
│      │                                │                 │
├──────┴────────────────────────────────┴─────────────────┤
│  Footer: Status, Zoom level, Spread number              │
└─────────────────────────────────────────────────────────┘
```

### Header

- **Zoom Controls**: `+` / `-` buttons to zoom in/out
- **Pages**: Dropdown to jump to different spreads
- **Export Button**: Download your edited document

### Left Panel: Tools

- **Select Tool** (V): Select and move objects
- **Text Tool** (T): Edit text
- **Rectangle Tool** (R): Create rectangles
- **Line Tool** (L): Create lines
- **Ellipse Tool** (E): Create ellipses

### Center Panel: Canvas

- Your document is rendered here
- Scroll to pan around the spread
- Click to select objects
- Drag to move objects
- Double-click text to edit

### Right Panel: Properties

- **Text Properties**: Font, size, color, alignment (when text selected)
- **Object Properties**: Position, size, rotation (when object selected)
- **Document Properties**: Spread info, dimensions

### Footer

- **Status**: "Saved" indicator, loading states
- **Zoom Level**: Current zoom percentage (e.g., "100%")
- **Spread Number**: Current spread (e.g., "Spread 1 of 27")

---

## Editing Text

### Selecting Text

1. Click the **Text Tool** (T) in the left panel
2. Click on a text frame
3. The text becomes editable (cursor appears)

### Typing

- Just start typing to replace selected text
- Use arrow keys to move cursor
- Use Delete/Backspace to remove characters

### Formatting Text

With text selected:

1. **Font Family**:
   - Open font dropdown in Properties panel
   - Select font (e.g., "Arial", "Georgia")

2. **Font Size**:
   - Click size dropdown
   - Select size (e.g., "12pt", "24pt")
   - Or type custom size

3. **Bold/Italic**:
   - Click **B** button for bold
   - Click **I** button for italic

4. **Text Color**:
   - Click color swatch
   - Select from document colors
   - Or enter hex code (e.g., "#FF0000")

5. **Alignment**:
   - Click align left, center, right, or justify buttons

### Auto-Save

- Text changes auto-save after 2 seconds of inactivity
- Look for "Saved" indicator in the footer
- Green checkmark means save succeeded
- Yellow "Saving..." means save in progress

---

## Editing Layout

### Selecting Objects

1. Click the **Select Tool** (V)
2. Click on any object (text frame, rectangle, line, etc.)
3. Blue handles appear around selected object

### Moving Objects

1. Select object
2. Click and drag to move
3. Release to drop
4. Changes auto-save after 2 seconds

### Resizing Objects

1. Select object
2. Drag corner handles to resize proportionally
3. Drag edge handles to resize in one direction
4. Hold Shift to maintain aspect ratio

### Rotating Objects

1. Select object
2. Drag circular handle above object
3. Or set rotation angle in Properties panel

### Creating New Objects

#### Text Frame
1. Click **Text Tool** (T)
2. Click where you want the frame
3. Type your text

#### Rectangle
1. Click **Rectangle Tool** (R)
2. Click on canvas
3. New rectangle appears at center

#### Line
1. Click **Line Tool** (L)
2. Click on canvas
3. Drag to set endpoints

#### Ellipse
1. Click **Ellipse Tool** (E)
2. Click on canvas
3. Drag to set size

### Grouping Objects

1. Select multiple objects:
   - Click first object
   - Hold Shift and click more objects
2. Press **Cmd+G** (Mac) or **Ctrl+G** (Windows)
3. Objects are now grouped

### Ungrouping Objects

1. Select grouped object
2. Press **Cmd+Shift+G** (Mac) or **Ctrl+Shift+G** (Windows)
3. Objects are now separate

### Deleting Objects

1. Select object(s)
2. Press **Delete** or **Backspace**
3. Object is removed from document

---

## Working with Images

### Uploading Images

**Note**: Image upload UI is in development. Current workaround:

1. Use API endpoint directly:
```bash
curl -X POST http://localhost:3000/api/upload-image \
  -F "uploadId=YOUR_UPLOAD_ID" \
  -F "objectId=YOUR_OBJECT_ID" \
  -F "spreadIndex=0" \
  -F "image=@/path/to/image.jpg"
```

2. Refresh editor to see updated image

### Supported Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)

### Max Size

- 10 MB per image

---

## Managing Layers

### Layers Panel

Located in the right panel (below Properties):

- **Layer List**: All layers in the current spread
- **Visibility Toggle**: Eye icon to show/hide layer
- **Lock Toggle**: Lock icon to prevent editing

### Showing/Hiding Layers

1. Find layer in Layers panel
2. Click **eye icon** to toggle visibility
3. Hidden layers are not rendered on canvas

### Locking Layers

1. Find layer in Layers panel
2. Click **lock icon** to toggle lock
3. Locked layers cannot be selected or edited

### Reordering Layers

1. Click and drag layer in Layers panel
2. Drop at new position
3. Layer order affects rendering (top layer renders last)

---

## Navigation

### Zooming

**Zoom In**: Click `+` button or press `Cmd+=` / `Ctrl+=`
**Zoom Out**: Click `-` button or press `Cmd+-` / `Ctrl+-`
**Fit to Window**: Press `Cmd+0` / `Ctrl+0`

### Panning

- Click and drag on canvas background
- Or use scrollbars

### Multi-Page Navigation

**Next Spread**:
- Press **Right Arrow** (when no object selected)
- Or use Pages dropdown

**Previous Spread**:
- Press **Left Arrow** (when no object selected)
- Or use Pages dropdown

**Jump to Spread**:
1. Click **Pages** dropdown in header
2. Select spread number (e.g., "Spread 5")
3. Canvas loads that spread

### Spread Count

Your document may have multiple spreads:
- Single-page: 1 spread per page
- Facing pages: 2 pages per spread (like an open book)

---

## Exporting Documents

### Export to IDML

**Purpose**: Re-open in Adobe InDesign with your edits preserved

**Steps**:
1. Click **Export** button in header
2. Select **"Export to IDML"**
3. Wait for processing (5-10 seconds)
4. Browser downloads `document_modified.idml`
5. Open file in InDesign

**What's Preserved**:
- ✅ Text edits (content and formatting)
- ✅ Object transforms (position, size, rotation)
- ✅ New objects you created
- ✅ Deleted objects (removed)
- ✅ Colors, strokes, fills
- ✅ All original styles and resources

**What's NOT Preserved**:
- ❌ Master page changes (not editable yet)
- ❌ Style definitions (can't edit styles yet)

### Export to HTML+CSS

**Purpose**: View document as a webpage

**Steps**:
1. Click **Export** button
2. Select **"Export to HTML"**
3. Wait for processing
4. Browser downloads `document_html.zip`
5. Extract ZIP file
6. Open `index.html` in browser

**What's Included**:
- `index.html` - Main HTML file
- `styles.css` - Stylesheet with layout
- `assets/` - Embedded images
- `README.txt` - Usage instructions

**Limitations**:
- Not responsive (fixed layout)
- Colors may differ (CMYK → RGB approximation)
- Fonts may differ (uses web-safe fonts)
- Single spread only (no multi-page)

### Export to PDF (Coming Soon)

PDF export is planned for a future version.

---

## Keyboard Shortcuts

### General

| Action | Mac | Windows |
|--------|-----|---------|
| Save | Cmd+S | Ctrl+S |
| Undo | Cmd+Z | Ctrl+Z |
| Redo | Cmd+Shift+Z | Ctrl+Shift+Z |

### Tools

| Tool | Shortcut |
|------|----------|
| Select Tool | V |
| Text Tool | T |
| Rectangle Tool | R |
| Line Tool | L |
| Ellipse Tool | E |

### Editing

| Action | Mac | Windows |
|--------|-----|---------|
| Group | Cmd+G | Ctrl+G |
| Ungroup | Cmd+Shift+G | Ctrl+Shift+G |
| Delete | Delete | Delete |
| Duplicate | Cmd+D | Ctrl+D |

### Navigation

| Action | Mac | Windows |
|--------|-----|---------|
| Zoom In | Cmd+= | Ctrl+= |
| Zoom Out | Cmd+- | Ctrl+- |
| Fit to Window | Cmd+0 | Ctrl+0 |
| Next Spread | → | → |
| Previous Spread | ← | ← |

### Text Editing

| Action | Mac | Windows |
|--------|-----|---------|
| Bold | Cmd+B | Ctrl+B |
| Italic | Cmd+I | Ctrl+I |
| Select All | Cmd+A | Ctrl+A |

---

## Tips & Tricks

### Performance

1. **Large Documents**: If editing is slow, try:
   - Reducing zoom level
   - Working on one spread at a time
   - Closing other browser tabs

2. **Auto-Save**: Wait for "Saved" indicator before closing browser

3. **Browser Choice**: Chrome and Edge have best performance

### Workflow

1. **Backup Originals**: Always keep original IDML file as backup

2. **Test Exports**: Export to IDML early and test in InDesign

3. **Small Changes**: Make incremental edits, test often

4. **Color Accuracy**: If color precision matters, verify in InDesign

### Collaboration

1. **Share Upload ID**: Team members can access same document with upload ID
2. **One Editor at a Time**: Multiple simultaneous editors will conflict (for now)
3. **Export Before Sharing**: Export to IDML and share the file

---

## Troubleshooting

### Upload Issues

**Problem**: "Invalid file type" error
- **Solution**: Ensure file has `.idml` extension

**Problem**: "File too large" error
- **Solution**: Reduce file size (remove large images, simplify)

**Problem**: Upload stuck at "Processing..."
- **Solution**:
  - Check internet connection
  - Refresh page and try again
  - Try smaller test file first

### Editing Issues

**Problem**: Can't select text
- **Solution**: Switch to Text Tool (T)

**Problem**: Can't move object
- **Solution**:
  - Switch to Select Tool (V)
  - Check if layer is locked

**Problem**: Changes not saving
- **Solution**:
  - Wait 2 seconds for auto-save
  - Check for "Saved" indicator
  - Check browser console for errors

**Problem**: Text looks different than InDesign
- **Solution**:
  - Fonts may be substituted (web fonts used)
  - Export to IDML and check in InDesign

### Export Issues

**Problem**: Export fails
- **Solution**:
  - Check browser console for errors
  - Try exporting again
  - Report issue with upload ID

**Problem**: Exported IDML won't open in InDesign
- **Solution**:
  - Ensure you have InDesign CS5 or later
  - Check if original IDML opens (to rule out corruption)
  - Report issue with example file

**Problem**: HTML export looks wrong
- **Solution**:
  - HTML export is approximate
  - Use IDML export for accurate results
  - Check known limitations above

### Browser Issues

**Problem**: Editor won't load
- **Solution**:
  - Use Chrome, Edge, Firefox, or Safari (latest versions)
  - Enable JavaScript
  - Clear browser cache
  - Disable browser extensions

**Problem**: Slow performance
- **Solution**:
  - Close other tabs
  - Use desktop browser (not mobile)
  - Reduce zoom level
  - Work on smaller documents

---

## Getting Help

### Resources

- **Documentation**: Check `/docs/` folder for technical docs
- **GitHub Issues**: Report bugs and feature requests
- **Email Support**: support@example.com

### Reporting Bugs

When reporting bugs, include:
1. Browser and version (e.g., "Chrome 120")
2. Operating system (e.g., "macOS 14")
3. Upload ID (if applicable)
4. Steps to reproduce
5. Screenshots or screen recording
6. Error messages from browser console

### Feature Requests

We're actively developing! Planned features:
- PDF export
- Real-time collaboration
- Master page editing
- Style management
- Font uploads
- Mobile support

---

## Glossary

**IDML**: InDesign Markup Language - Adobe's XML-based format

**Spread**: One or more facing pages (like an open book)

**Story**: Text content in one or more linked text frames

**Transform**: Position, size, rotation, and scale of an object

**GeometricBounds**: The rectangular boundary of an object

**ItemTransform**: The 6-value matrix encoding object transforms

**Fabric.js**: JavaScript library for interactive canvas

**Canvas**: HTML5 drawing surface for rendering documents

---

**User Guide Version**: 1.0
**Last Updated**: January 10, 2026

---

Happy editing! 🎨
