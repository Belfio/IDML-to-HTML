# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based IDML (InDesign Markup Language) editor that allows publishers to automate magazine layout workflows. The system enables:
- Uploading IDML template files and extracting their components
- Parsing IDML XML structure into JSON for manipulation
- Previewing IDML content as HTML in the browser
- Editing text and image content within the IDML structure
- Exporting modified content back to valid IDML format

**Target Users**: InDesign operators in publishing companies
**Key Goal**: Automate manual content insertion into InDesign files, reducing time and ensuring consistency

## Technology Stack

- **Frontend**: Remix (React + TypeScript) with Vite
- **Styling**: Tailwind CSS
- **Backend**: AWS Serverless (deployed via SST Ion)
- **IDML Processing**:
  - `jszip` for extracting IDML packages (IDML files are ZIP archives)
  - `fast-xml-parser` and `xml2js` for parsing XML components
  - `unzipper` for stream-based extraction

## Common Development Commands

```bash
# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Start production server locally
npm start

# Process IDML file (development utility)
npm run p
```

## IDML Architecture Understanding

### IDML File Structure
IDML files are ZIP archives containing:
- **designmap.xml**: Main manifest describing the document structure
- **Spreads/**: XML files for each spread (pair of facing pages)
- **Stories/**: XML files containing text content (referenced by TextFrames)
- **MasterSpreads/**: Template spreads applied to pages
- **Resources/**: Fonts, styles, and other resources
- **META-INF/**: Package metadata

### Processing Pipeline

1. **Extraction** (`app/services/idmlParser.ts:extractIDML`)
   - Unzip IDML file to `/tmp/idml_extracted`
   - Each component becomes a separate XML file

2. **XML Parsing** (Multiple parsers exist):
   - `app/lib/spreadParser.ts`: Converts Spread XML → HTML preview
   - `app/lib/storiesParser.ts`: Converts Story XML (text content) → HTML
   - `app/lib/masterSpread.ts`: Parses master page templates
   - `app/services/idmlParser.ts`: Generic IDML → JSON converter

3. **HTML Generation**:
   - Spreads become `<div class="spread">` containers
   - Pages within spreads: `<div class="page">` with geometric bounds
   - Elements (TextFrame, Rectangle, GraphicLine, Group, Polygon) each have HTML generators
   - Transforms preserved via inline `style="transform: matrix(...)"` attributes

4. **Reconstruction** (TODO):
   - Modified HTML/JSON must be converted back to valid IDML XML
   - Re-zip all components into IDML package

## Key Files and Architecture

### Core IDML Processing (`app/lib/`)
- **processIdml.ts**: Main orchestrator for IDML processing workflow
- **spreadParser.ts**: Parses spread XML into HTML. Handles Page, Rectangle, TextFrame, GraphicLine, Group, Polygon elements
- **storiesParser.ts**: Extracts text content from Story files. Handles ParagraphStyleRange and CharacterStyleRange with CSS mapping
- **masterSpread.ts**: Class-based parser for master spreads with HTML/CSS generation
- **unzip.ts**: Utility for extracting IDML archives
- **interfaces/spreadInterfaces.ts**: TypeScript interfaces for IDML XML structure

### Service Layer (`app/services/`)
- **idmlParser.ts**: Provides `parseIDMLToJSON()` and `extractIDML()` functions for converting IDML streams to JSON

### Routes (`app/routes/`)
- **_index.tsx**: Landing page (still boilerplate Remix welcome)
- **upload.tsx**: File upload interface for IDML files

### Reference Material
- **IDML_Specification.txt**: Full Adobe IDML specification
- **idml-specification.pdf**: PDF version of spec
- **instructions.md**: Detailed project requirements and architecture documentation
- **unpacked/**: Example of extracted IDML structure (reference for testing)

## Important Implementation Notes

### IDML Transform Handling
IDML uses `ItemTransform` attributes with 6 values representing a 2D transformation matrix:
```
ItemTransform="a b c d tx ty"
```
Map to CSS: `transform: matrix(a, b, c, d, tx, ty)`

### Story References
- TextFrames reference stories via `ParentStory` attribute
- Story files are named `Story_<id>.xml` in the Stories folder
- When parsing spreads, story content must be loaded separately and inserted into TextFrame HTML

### Geometric Bounds
Format: `"top left bottom right"` in points
Convert to pixels: multiply by 0.75 (or use the POINTS_TO_PIXELS constant)
Calculate dimensions:
```typescript
width = (right - left) * 0.75
height = (bottom - top) * 0.75
```

### Multiple XML Parsers
The codebase uses both `xml2js` (callback-based) and `fast-xml-parser` (modern). Prefer `fast-xml-parser` for new code.

## Development Patterns

### Adding Support for New IDML Elements
1. Add TypeScript interface to `app/lib/interfaces/spreadInterfaces.ts`
2. Create generator function in `spreadParser.ts` (e.g., `generateRectangleHTML()`)
3. Add element parsing in `parseSpreadChildren()` or `parsePageChildren()`
4. Test with real IDML files in `unpacked/` directory

### Testing IDML Processing
Use the `npm run p` command which runs `ts-node ./app/lib/processIDML.ts` to test the processing pipeline on sample files.

## IDML Specification Reference

This project includes the full Adobe IDML specification:
- **IDML_Specification.txt**: Complete text version of the Adobe IDML specification (2012)
- **idml-specification.pdf**: PDF version

### Key IDML Concepts from Specification

**Object References** (Section: Object Reference Format):
- IDML uses unique IDs in `Self` attributes (e.g., `Self="uc4"`, `Self="Story_ud0a"`)
- Cross-file references use format: `filename#objectID` (e.g., `Spreads/Spread_ud1.xml#ud1`)
- Story references: `ParentStory="ud0a"` links to `Stories/Story_ud0a.xml`

**Measurement Units**:
- IDML uses points as the base unit
- Convert to pixels: multiply by 0.75 (or use POINTS_TO_PIXELS = 0.75)
- GeometricBounds format: `"top left bottom right"` (all in points)

**Transformation Matrices** (Section: Transformations):
- `ItemTransform` uses 6-value matrix: `"a b c d tx ty"`
- Represents: `[a c tx] [b d ty] [0 0 1]`
- Maps to CSS: `transform: matrix(a, b, c, d, tx, ty)`
- Identity transform: `"1 0 0 1 0 0"`

**Coordinate Systems** (Section: Coordinates, Transformation Matrices, and the IDML Element Hierarchy):
- Pasteboard coordinates: Global coordinate system
- Spread coordinates: Relative to spread
- Page coordinates: Relative to page within spread
- Transformations are cumulative through the element hierarchy

**Page Item Types** (Section: Page Items):
- **Spline Items**: Rectangle, Oval, Polygon, GraphicLine
- **TextFrame**: Container for text stories
- **Group**: Container for nested page items
- **Image**: Embedded or linked graphics
- **Media Items**: Movies, sounds (for interactive documents)

**Story Structure** (Section: Stories):
- Stories are text content containers stored in separate XML files
- Structure: Story → ParagraphStyleRange → CharacterStyleRange → Content
- TextFrames reference stories via `ParentStory` attribute
- Stories can be threaded across multiple TextFrames via `NextTextFrame`/`PreviousTextFrame`

## Deployment

The application is deployed to AWS using SST Ion:
- `sst.config.ts` defines infrastructure
- Uses `sst.aws.Remix` component for serverless Remix deployment
- Production stage uses `removal: "retain"` to prevent accidental deletion

To deploy:
```bash
# Development stage
npx sst deploy

# Production stage
npx sst deploy --stage production
```

## Known Limitations & TODO

- **IDML Reconstruction**: Currently only parsing IDML → HTML. Reverse flow (HTML/JSON → IDML) not yet implemented
- **Limited Element Support**: Only Rectangle, TextFrame, GraphicLine, Group, Polygon fully supported. Other page items (Oval, Button, etc.) need handlers
- **Style Mapping**: CSS generation is basic. InDesign styles (paragraph/character styles) not fully mapped
- **Image Handling**: Image links parsed but not tested with actual image files
- **Master Pages**: Master spread parsing exists but integration with pages incomplete
