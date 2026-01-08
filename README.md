# IDML Web Editor

> A comprehensive web-based IDML editor that looks like InDesign, allows full text/layout editing, and exports to IDML, PDF, and HTML+CSS with high fidelity.

## 🎯 Vision

Transform InDesign documents into editable, web-based content. Enable users to upload IDML files, edit them in the browser with an InDesign-like interface, and export to multiple formats without requiring Adobe InDesign.

## 📋 Current Status

### ✅ Completed

**Phase 1: Foundation & Architecture** ✅ **COMPLETED**
- [x] Install Fabric.js and Zustand dependencies
- [x] Create Fabric.js canvas wrapper (`/app/lib/canvas/fabricCanvas.ts`)
- [x] Set up Zustand state management (`/app/lib/state/editorStore.ts`)
- [x] Build InDesign-like 3-panel UI layout (`/app/routes/editor.$id.tsx`)
- [x] Parse all spreads (all 27+ spreads now loaded)
- [x] Multi-page navigation (keyboard + UI controls)
- [x] Integrate Fabric.js canvas into CanvasPanel
- [x] Add drag-drop file upload to upload page

### 📅 Upcoming Phases

- **Phase 2**: Text Editing (4-5 weeks) - PRIORITY
- **Phase 3**: Visual Fidelity (2-3 weeks)
- **Phase 4**: Image & Layout Editing (3 weeks)
- **Phase 5**: Advanced Features (3-4 weeks)
- **Phase 6**: IDML Reconstruction (4-5 weeks)
- **Phase 7**: Export Functionality (3-4 weeks)
- **Phase 8**: Polish & Testing (2-3 weeks)

**Total Timeline**: 25-32 weeks (6-8 months) with 1 developer

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Remix 2.13.1 (React framework)
- TypeScript 5.6.3
- TailwindCSS 3.4.4
- Fabric.js 5.3.0 (Canvas editing)
- Zustand 4.5.0 (State management)

**Backend:**
- Node.js ≥20.0.0
- xml2js (XML parsing)
- unzipper (IDML extraction)
- JSZip (IDML repacking)

**Infrastructure:**
- SST Ion 3.2.38 (Deployment)
- Vite 5.1.0 (Build tool)
- Playwright 1.57.0 (E2E testing)

### Project Structure

```
/app
├── routes/                 # Remix routes
│   ├── _index.tsx         # Upload page (drag-drop)
│   ├── editor.$id.tsx     # Main editor (WIP)
│   └── preview.$id.tsx    # Legacy preview
├── lib/                    # Business logic
│   ├── canvas/            # Fabric.js wrappers (WIP)
│   ├── state/             # Zustand store (WIP)
│   ├── textEditor/        # Text editing logic (TODO)
│   ├── colors/            # Color management (TODO)
│   ├── export/            # IDML/PDF/HTML export (TODO)
│   ├── processIdml.ts     # Main IDML processor
│   ├── spreadParser.ts    # Spread XML → HTML
│   └── storiesParser.ts   # Story XML → HTML
├── components/
│   └── editor/            # Editor UI components (WIP)
└── assets/
    └── example.idml       # Test file

/uploads/{uuid}/           # Uploaded files
├── example.idml           # Original upload
└── extracted/             # Unzipped IDML
    ├── Spreads/           # Layout XML files
    ├── Stories/           # Text content XML
    ├── Resources/         # Styles, Colors, Fonts
    ├── MasterSpreads/     # Page templates
    └── META-INF/          # Package metadata
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥20.0.0
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd indesign

# Install dependencies
npm install

# Run development server
npm run dev
# or with SST
npx sst dev
```

### Running Tests

```bash
# E2E tests
npm test
npx playwright test

# Type checking
npm run typecheck
```

---

## 📖 Implementation Plan

> **Note**: This is a living document. As we complete each phase, this section is updated with progress and learnings.

### Phase 1: Foundation & Architecture (3-4 weeks)

**Goal**: Canvas editor, InDesign-like UI, multi-page navigation

**Key Components**:
- `/app/lib/canvas/fabricCanvas.ts` - Fabric.js wrapper (350 lines)
- `/app/lib/state/editorStore.ts` - Zustand store (200 lines)
- `/app/routes/editor.$id.tsx` - Editor route (400 lines)
- `/app/components/editor/EditorLayout.tsx` - 3-panel layout
- `/app/components/editor/ToolPanel.tsx` - Left toolbar
- `/app/components/editor/CanvasPanel.tsx` - Center canvas
- `/app/components/editor/PropertiesPanel.tsx` - Right panel
- `/app/components/editor/PagesPanel.tsx` - Pages thumbnails

**Technical Challenges**:
- ItemTransform matrix conversion (IDML → Fabric)
- Coordinate system (points → pixels: multiply by 0.75)
- GeometricBounds format `[y1 x1 y2 x2]` needs reordering

**Progress**:
- [x] Dependencies installed (fabric@5.3.0, zustand@4.5.0)
- [x] Canvas wrapper created (`/app/lib/canvas/fabricCanvas.ts`)
- [x] State management setup (`/app/lib/state/editorStore.ts`)
- [x] UI layout built (`/app/routes/editor.$id.tsx` with 3-panel InDesign-like design)
- [x] Multi-page navigation working (keyboard shortcuts + UI controls)
- [x] All spreads loaded (not just first one)
- [x] Canvas rendering with Fabric.js integration (`/app/components/editor/CanvasPanel.tsx`)

---

### Phase 2: Text Editing (4-5 weeks) **PRIORITY**

**Goal**: Full text editing with formatting and styles

**Key Features**:
- Editable text frames (Fabric IText)
- Character formatting (font, size, color, bold/italic)
- Paragraph formatting (alignment, spacing)
- Style manager (loads from Resources/Styles.xml)
- Auto-save to Story XML

**Critical Files**:
- `/app/lib/canvas/textFrame.ts` - Custom IText class
- `/app/lib/textEditor/storySerializer.ts` - Text → Story XML
- `/app/lib/styles/styleManager.ts` - Style management
- `/app/components/editor/TextPropertiesPanel.tsx` - Text UI

**Technical Challenges**:
- Character style ranges (nested XML → inline styles)
- Style inheritance (resolve `<BasedOn>` chains)
- Linked text frames (overflow handling)

**Progress**:
- [ ] Parse Story XML files into structured data
- [ ] Create custom TextFrame class extending Fabric IText
- [ ] Implement character formatting UI (font, size, color, bold/italic)
- [ ] Implement paragraph formatting UI (alignment, spacing, indents)
- [ ] Load and parse Resources/Styles.xml
- [ ] Build style manager with style inheritance resolution
- [ ] Create TextPropertiesPanel component
- [ ] Implement style application to text
- [ ] Build story serializer (edited text → Story XML)
- [ ] Add auto-save functionality for text edits
- [ ] Handle linked text frames (overflow between frames)
- [ ] Test text editing with multiple styles
- [ ] Update E2E tests for text editing

---

### Phase 3: Visual Fidelity (2-3 weeks)

**Goal**: Accurate rendering of colors, fonts, transforms

**Key Features**:
- Color rendering (CMYK → RGB conversion)
- Gradient fills
- Stroke patterns
- Font loading with fallbacks
- Transform matrices (rotation, scale, skew)

**Critical Files**:
- `/app/lib/colors/colorManager.ts` - Parse Graphic.xml
- `/app/lib/fonts/fontLoader.ts` - Load web fonts
- `/app/lib/canvas/transformHandler.ts` - Transform math

**Technical Challenges**:
- CMYK → RGB is approximate (not color-managed)
- Commercial fonts can't be redistributed
- Font substitution may cause reflow

**Progress**:
- [ ] Parse Resources/Graphic.xml for color definitions
- [ ] Implement CMYK → RGB conversion algorithm
- [ ] Build color manager with color lookup
- [ ] Implement gradient fill rendering
- [ ] Add stroke pattern support
- [ ] Create font loader with CDN integration (Google Fonts/Adobe Fonts)
- [ ] Build font substitution mapping system
- [ ] Implement transform matrix decomposition
- [ ] Apply colors to existing canvas elements
- [ ] Apply transforms to all element types
- [ ] Test with documents containing complex colors/transforms
- [ ] Document color accuracy limitations

---

### Phase 4: Image & Layout Editing (3 weeks)

**Goal**: Image upload, drag/resize, create elements, groups

**Key Features**:
- Image upload/replacement
- Drag and resize all objects
- Create new elements (TextFrame, Rectangle, Line)
- Group/ungroup operations

**Critical Files**:
- `/app/lib/images/imageUploader.ts` - Image handling
- `/app/lib/canvas/elementFactory.ts` - Create IDML elements
- `/app/lib/canvas/groupHandler.ts` - Group operations

**Technical Challenges**:
- IDML ID generation (format: `u` + hex, must be unique)
- Transform updates on drag/resize
- Parent-child transforms

**Progress**:
- [ ] Build image uploader component
- [ ] Create image upload API endpoint
- [ ] Implement image replacement in Rectangle frames
- [ ] Add drag handlers for all canvas objects
- [ ] Add resize handlers with transform updates
- [ ] Create element factory for new TextFrames
- [ ] Create element factory for new Rectangles
- [ ] Create element factory for new Lines
- [ ] Implement group/ungroup operations
- [ ] Add IDML ID generator with uniqueness checking
- [ ] Build shape creation toolbar
- [ ] Add snap-to-grid functionality
- [ ] Test drag/resize with complex nested groups
- [ ] Update E2E tests for image and layout editing

---

### Phase 5: Advanced Editing (3-4 weeks)

**Goal**: Layers, master pages, guides, precise measurements

**Key Features**:
- Layers panel (visibility, lock)
- Master pages (render + override)
- Guides and grids with snap
- Precise measurements (points/picas/inches/mm)

**Critical Files**:
- `/app/components/editor/LayersPanel.tsx`
- `/app/lib/masterPages/masterPageManager.ts`
- `/app/lib/canvas/guideRenderer.ts`
- `/app/lib/units/unitConverter.ts`

**Technical Challenges**:
- Master page override tracking
- MasterPageTransform stacking
- Sub-pixel precision

**Progress**:
- [ ] Create LayersPanel component
- [ ] Build layer manager for visibility/lock state
- [ ] Parse MasterSpreads directory
- [ ] Implement master page rendering
- [ ] Build master page override system
- [ ] Create margin guide renderer
- [ ] Create column guide renderer
- [ ] Create ruler guide renderer
- [ ] Implement snap-to-guides functionality
- [ ] Build unit converter (points/picas/inches/mm)
- [ ] Create measurement input panel (X/Y/W/H)
- [ ] Add smart guides (alignment hints)
- [ ] Test with documents using master pages
- [ ] Update E2E tests for advanced features

---

### Phase 6: IDML Reconstruction (4-5 weeks) **CRITICAL**

**Goal**: Convert canvas back to IDML XML for round-trip editing

**Key Features**:
- Fabric → IDML XML conversion
- Story XML generation
- Spread XML generation
- Style XML updates
- IDML repacking (ZIP)

**Critical Files**:
- `/app/lib/export/fabricToIdml.ts` - Main converter
- `/app/lib/export/spreadSerializer.ts` - Spread XML
- `/app/lib/export/idmlPacker.ts` - Repack ZIP

**Technical Challenges**:
- RGB → CMYK reverse (lossy)
- Preserve 50+ optional attributes
- Element order in XML
- ID integrity

**Validation**:
- Round-trip test: Upload → Edit → Export → Re-upload
- Open in InDesign verification

**Progress**:
- [ ] Build Fabric → IDML element converter
- [ ] Implement transform matrix composition (reverse of decomposition)
- [ ] Create spread serializer (Fabric → Spread XML)
- [ ] Enhance story serializer for full Story XML generation
- [ ] Build style serializer for Styles.xml updates
- [ ] Implement color serializer (RGB → CMYK conversion)
- [ ] Create IDML packer (repack to ZIP format)
- [ ] Preserve all IDML IDs and Self references
- [ ] Preserve all optional attributes in metadata
- [ ] Handle XML element ordering per IDML spec
- [ ] Create save/export API endpoint
- [ ] Build round-trip validation test
- [ ] Test exported IDML opens in InDesign
- [ ] Document known limitations and lossy conversions

---

### Phase 7: Export Functionality (3-4 weeks)

**Goal**: High-fidelity PDF, HTML+CSS, IDML download

**Key Features**:
- PDF generation (jsPDF or Puppeteer)
- HTML+CSS export
- Export menu UI

**Critical Files**:
- `/app/lib/export/pdfGenerator.ts` - PDF export
- `/app/lib/export/htmlGenerator.ts` - HTML export
- `/app/components/editor/ExportMenu.tsx` - UI

**Technical Challenges**:
- Font embedding (licensing)
- CMYK colors in RGB PDF
- HTML positioning precision

**Progress**:
- [ ] Research PDF generation options (jsPDF vs Puppeteer)
- [ ] Implement PDF generator with basic layout
- [ ] Add font embedding to PDF (with licensing considerations)
- [ ] Handle color conversion for PDF (CMYK → RGB)
- [ ] Build HTML generator with semantic markup
- [ ] Build CSS generator with absolute positioning
- [ ] Package HTML/CSS/images/fonts into ZIP
- [ ] Create export menu UI component
- [ ] Add IDML download endpoint (from Phase 6)
- [ ] Add PDF download endpoint
- [ ] Add HTML ZIP download endpoint
- [ ] Test all export formats with complex documents
- [ ] Document export quality and limitations

---

### Phase 8: Polish & Testing (2-3 weeks)

**Goal**: Performance, error handling, test coverage, docs

**Key Features**:
- Canvas optimization (60fps)
- Lazy loading spreads
- Error handling
- 80%+ test coverage
- Documentation

**Critical Files**:
- `/app/lib/performance/canvasOptimizer.ts`
- `/tests/editor.spec.ts` - E2E tests
- `/tests/round-trip.spec.ts` - Critical test
- `/docs/` - Full documentation

**Performance Targets**:
- Initial load: < 2 seconds
- Spread navigation: < 500ms
- Text editing: < 16ms lag (60fps)

**Progress**:
- [ ] Profile canvas rendering performance
- [ ] Implement canvas optimizer (object pooling, dirty regions)
- [ ] Add lazy loading for spreads (cache only 3 at a time)
- [ ] Optimize Fabric.js rendering settings
- [ ] Build centralized error handler
- [ ] Add error boundaries to React components
- [ ] Implement user-friendly error messages
- [ ] Create editor workflow E2E tests
- [ ] Create text editing E2E tests
- [ ] Create image upload E2E tests
- [ ] Create export functionality E2E tests
- [ ] Build comprehensive round-trip test suite
- [ ] Achieve 80%+ code coverage with unit tests
- [ ] Write architecture documentation
- [ ] Write API documentation
- [ ] Write user guide documentation
- [ ] Performance optimization based on profiling
- [ ] Final QA and bug fixes

---

## 🔧 Development Workflow

### Branching Strategy
- `main` - Production-ready code
- Feature branches for each phase/component

### Commit Protocol
✅ **Commit after each completed task**
- Keep commits atomic and focused
- Use descriptive commit messages
- Format: `feat: component name - brief description`

### README Updates
🔄 **Update README.md rigorously**
- Update progress checkboxes when tasks complete
- Document learnings and challenges
- Keep "Current Status" section accurate

### Testing
- Write E2E tests as features are implemented
- Maintain >80% test coverage
- Run tests before committing: `npm test`

---

## 📚 Key Resources

- [IDML Specification (2012)](./IDML_Specification.txt) - Adobe's official spec
- [CLAUDE.md](./CLAUDE.md) - AI assistant guidance
- [Plan File](~/.claude/plans/majestic-kindling-pebble.md) - Detailed implementation plan
- [Fabric.js Docs](http://fabricjs.com/docs/) - Canvas library
- [Zustand Docs](https://docs.pmnd.rs/zustand) - State management

---

## 🐛 Known Issues

- Only first spread renders (27 spreads available, need multi-page nav)
- Visual rendering basic (debug borders only, no colors/fonts)
- No editing capabilities yet (view-only)
- Export buttons are placeholders

---

## 📝 License

[Add license information]

---

## 🤝 Contributing

This is an active development project. See the plan file for detailed implementation roadmap.

---

**Last Updated**: January 8, 2026
**Current Phase**: Phase 2 - Text Editing (PRIORITY)
**Next Milestone**: Parse Story XML files and create editable text frames
