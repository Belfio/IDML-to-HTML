# Converting IDML to HTML

Converting an IDML (InDesign Markup Language) file into HTML involves interpreting the XML-based structure of the IDML file and translating it into corresponding HTML elements. This guide provides a comprehensive, step-by-step approach to achieve this conversion, optimized for AI comprehension and automated code generation.

## Steps to Convert IDML to HTML

### 1. Extract the IDML File

**Objective:** Access the internal XML structure of the IDML file.

**Instructions:**

1. **Convert IDML to ZIP:**

   - Change the file extension from `.idml` to `.zip`.
   - **Or**
   - Use a command-line tool to unzip the file:
     ```bash
     unzip myfile.idml -d myfile_unzipped
     ```

2. **Result:**
   - The contents will be extracted to the `unpacked` directory.
   - Accessible XML files and directories include:
     - `MasterSpreads/`
       - `MasterSpread_u18a.xml`
     - `META-INF/`
       - `container.xml`
       - `metadata.xml`
     - `Resources/`
       - `Fonts.xml`
       - `Graphic.xml`
       - `Preferences.xml`
       - `Styles.xml`
     - `Spreads/`
       - `Spread_u183.xml`
       - `Spread_uce.xml`
       - `...`
     - `Stories/`
       - `Story_ucf1.xml`
       - `Story_ucf1.xml`
       - `...`
     - `XML/`
       - `Tags.xml`
       - `BackingStory.xml`
     - `designmap.xml`
     - `mimetype`

### 2. Analyze the Key IDML Files

**Objective:** Understand the role of each XML file within the IDML package to map them effectively to HTML.

**Key Files and Their HTML Equivalents:**

- **Story.xml:**

  - **Content:** Text content of the document.
  - **HTML Mapping:** `<p>`, `<h1>`, `<div>`, etc.

- **Spread.xml:**

  - **Content:** Layout information including text frames and image frames with coordinates.
  - **HTML Mapping:** Overall structure using `<div>`, `<section>`, `<img>`, etc.

- **Resources (Styles.xml, Fonts.xml):**

  - **Content:** Styles and fonts used.
  - **HTML Mapping:** CSS styles.

- **designmap.xml:**
  - **Content:** Index or table of contents.
  - **HTML Mapping:** Helps in organizing the HTML structure.

### 3. Parse the XML Content

**Objective:** Extract relevant data from XML files and convert it to HTML using a programming language.

**Example in TypeScript:**

```typescript
import * as fs from "fs";
import * as xml2js from "xml2js";

const parser = new xml2js.Parser();

fs.readFile("unpacked/Stories/Story_ucf1.xml", (err, data) => {
  if (err) throw err;

  parser.parseString(data, (err, result) => {
    if (err) throw err;

    // Extract text from the story and wrap in HTML
    const storyContent = result.DocumentStory.Story[0].ParagraphStyleRange;
    storyContent.forEach((paragraph: any) => {
      const textContent = paragraph.Content[0];
      console.log(`<p>${textContent}</p>`);
    });
  });
});
```

**Instructions:**

- Iterate through content nodes in `Story_ucf1.xml`.
- Convert them into HTML paragraphs.
- Apply similar methods for spreads and styles.

### 4. Handle Text and Paragraphs (Story.xml)

**Objective:** Map text content to appropriate HTML tags.

**Instructions:**

1. **Structure in `Story.xml`:**

   - Organized into stories and paragraphs.

2. **HTML Mapping:**
   ```html
   <p class="paragraph-style">This is some text from a paragraph.</p>
   ```
3. **Styling:**
   - Map `<ParagraphStyleRange>` and `<CharacterStyleRange>` to CSS.

### 5. Handle Images and Frames (Spread.xml)

**Objective:** Map frames and images to HTML elements with proper positioning.

**Instructions:**

1. **Extract Image Information:**

   ```xml
   <Image>
       <ImageType>Raster</ImageType>
       <Link href="Images/image1.jpg"/>
   </Image>
   ```

2. **Convert to HTML:**

   ```html
   <img src="Images/image1.jpg" alt="Image description" />
   ```

3. **Handle Text Frames:**
   - Use `<div>` or `<section>` tags to represent content blocks.

### 6. Handle Styles (Styles.xml)

**Objective:** Translate XML styles to CSS for consistent styling in HTML.

**Instructions:**

1. **Extract Style Information:**

   ```xml
   <ParagraphStyle Self="Heading1" FontStyle="Bold" PointSize="24" Justification="Center"/>
   ```

2. **Convert to CSS:**

   ```css
   .heading1 {
     font-weight: bold;
     font-size: 24px;
     text-align: center;
   }
   ```

3. **Apply to HTML Elements:**
   ```html
   <h1 class="heading1">This is a Heading</h1>
   ```

### 7. Map Fonts and Colors

**Objective:** Ensure visual consistency by mapping fonts and colors from IDML to CSS.

**Instructions:**

1. **Extract Font Declarations:**

   ```xml
   <Font Family="Helvetica" Style="Regular" PlatformName="Helvetica-Regular"/>
   ```

2. **Convert to CSS:**

   ```css
   body {
     font-family: "Helvetica", sans-serif;
   }
   ```

3. **Handle Colors:**
   - Extract from `Resources/Graphics.xml`.
   - Map to CSS color properties.

### 8. Assemble the HTML Document

**Objective:** Combine all converted components into a cohesive HTML structure.

**Instructions:**

1. **Create HTML Structure:**
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>Converted IDML Document</title>
       <link rel="stylesheet" href="styles.css" />
     </head>
     <body>
       <h1 class="heading1">Document Title</h1>
       <p>This is a paragraph of text.</p>
       <img src="Images/image1.jpg" alt="Image description" />
     </body>
   </html>
   ```
2. **Embed CSS Styles:**
   - Link to external `styles.css` or include `<style>` tags within the `<head>`.

### 9. Automate the Process (Optional)

**Objective:** Streamline the conversion using scripting languages.

**Example Using Node.js with `xml2js`:**

```javascript
const fs = require("fs");
const xml2js = require("xml2js");

// Load and parse the Story.xml file
fs.readFile("Story.xml", (err, data) => {
  xml2js.parseString(data, (err, result) => {
    if (err) throw err;

    // Process text content and generate HTML
    const storyContent = result.DocumentStory.Story[0].ParagraphStyleRange;
    storyContent.forEach((paragraph) => {
      console.log(`<p>${paragraph.Content}</p>`);
    });
  });
});
```

## Summary

Converting IDML to HTML involves the following key steps:

1. **Extraction:** Unzip the IDML file to access XML components.
2. **Analysis:** Understand the role of each XML file within the IDML package.
3. **Parsing:** Extract and convert XML content to HTML using a programming language.
4. **Mapping:** Translate text, images, frames, styles, fonts, and colors to corresponding HTML and CSS elements.
5. **Assembly:** Combine all components into a structured HTML document.
6. **Automation:** Optionally, use scripting to automate the conversion process.

By following this guide and utilizing appropriate tools, you can successfully convert structured IDML files into well-organized HTML documents, ensuring consistency and maintaining the integrity of the original design.

## IDML specification

### IDML `<Spread>` Attributes to HTML/CSS

| **IDML Attribute**          | **HTML/CSS Equivalent**                  | **Explanation**                                                                               |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Spread Self**             | `id` attribute on a `<div>`              | The unique identifier for the spread; could serve as the `id` of a container `<div>` in HTML. |
| **FlattenerOverride**       | N/A                                      | Applies only to IDML; can be ignored in HTML/CSS.                                             |
| **AllowPageShuffle**        | N/A                                      | No direct HTML equivalent; affects InDesign behavior only.                                    |
| **ItemTransform**           | CSS `transform`                          | Apply `rotate`, `scale`, or `translate` based on the matrix values.                           |
| **ShowMasterItems**         | N/A                                      | Not applicable to HTML; use separate elements for reusable components like headers, footers.  |
| **PageCount**               | `<div class="page">` elements            | Use multiple `<div class="page">` elements to represent pages within the spread.              |
| **BindingLocation**         | `float: left` or `float: right` on pages | Defines the binding side; adjust alignment using `float` or `flex` layouts in CSS.            |
| **PageTransitionType**      | CSS animations or JS libraries           | Use CSS animations or JavaScript libraries (like jQuery) for page transitions.                |
| **PageTransitionDirection** | CSS `transform` for slide direction      | Control transition direction with `transform: translateX()` or similar properties.            |
| **PageTransitionDuration**  | CSS `animation-duration`                 | Set duration in CSS using `animation-duration: <time>s;`.                                     |

### IDML `<Spread>` Child Elements to HTML/CSS

| **IDML Child Element**     | **HTML/CSS Equivalent**           | **Explanation**                                                                                 |
| -------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Properties**             | `data-*` attributes or JSON       | Store metadata using `data-*` attributes or within a JSON object for JavaScript access.         |
| **Page**                   | `<div class="page">`              | Each page can be a `<div>` with `class="page"`, using CSS to set size and positioning.          |
| **GeometricBounds**        | CSS `width`, `height`, `position` | Use `width` and `height` for size; set `position` for exact placement on the spread.            |
| **Rectangle/Oval/Polygon** | `<div>`, CSS `border-radius`      | Use `<div>` for shapes; apply `border-radius` for ovals/circles and CSS clip-path for polygons. |
| **GraphicLine**            | `<hr>` or `<div class="line">`    | A simple `<hr>` or styled `<div>` with a small `height` can represent lines.                    |
| **TextFrame**              | `<div class="text-frame">`        | Use `<div>` to contain text; style with `padding`, `border`, and `background`.                  |
| **Group**                  | `<div class="group">`             | Wrap related items in a `<div class="group">` to keep them together.                            |
| **Button**                 | `<button>`                        | Use the `<button>` element and style it as necessary. Add JS for interactive behavior.          |
| **AnimationSetting**       | CSS `animation` or JS animations  | Use CSS animations for simpler effects; complex ones may need JavaScript.                       |
| **MultiStateObject**       | JS with `display` or `visibility` | Use JavaScript to toggle visibility or transform properties for multi-state effects.            |

### IDML `designmap.xml` Child Elements to HTML/CSS

| **`designmap.xml` Element**    | **HTML/CSS Equivalent**            | **Explanation**                                                                              |
| ------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| **`Document`**                 | `<div id="document">`              | Acts as the root container for the document; use `<div>` as the main wrapper.                |
| **`Spread` (reference)**       | `<div class="spread">`             | Each spread in the document can be represented as a `<div>` with appropriate classes or IDs. |
| **`Page` (reference)**         | `<div class="page">`               | Use nested `<div>` elements for each page within a spread.                                   |
| **`MasterSpread` (reference)** | `<div class="master-spread">`      | Wraps templates or layout guides for pages; `<div>` with styling for template use.           |
| **`Style` references**         | CSS classes or inline styles       | Define equivalent CSS styles for the document’s character, paragraph, and object styles.     |
| **`Resources` (e.g., fonts)**  | `<link>` or `@font-face` in CSS    | Use the `<link>` tag for web fonts or `@font-face` for custom font imports.                  |
| **`Metadata`**                 | `<meta>` tags or `<script>` (JSON) | Use `<meta>` for basic metadata and `<script>` tags containing JSON for complex data.        |

### IDML `metadata.xml` Child Elements to HTML/CSS

| **`metadata.xml` Element** | **HTML/CSS Equivalent**                   | **Explanation**                                                                           |
| -------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| **`dc:title`**             | `<title>`                                 | Represents the document title, which can be used within the `<title>` tag in HTML.        |
| **`dc:creator`**           | `<meta name="author" content="...">`      | Maps to a `<meta>` tag with `name="author"` for defining the document creator/author.     |
| **`dc:description`**       | `<meta name="description" content="...">` | Used for a brief document description; maps to a `<meta>` tag with `name="description"`.  |
| **`dc:subject`**           | `<meta name="keywords" content="...">`    | Can translate to a `<meta>` tag with `name="keywords"` for SEO purposes.                  |
| **`dc:publisher`**         | `<meta name="publisher" content="...">`   | Indicates the document publisher; maps to a `<meta>` tag with `name="publisher"`.         |
| **`dc:date`**              | `<time datetime="...">`                   | Represents the publication or modification date; can use the `<time>` tag in HTML.        |
| **`dc:language`**          | `<html lang="...">`                       | Specifies the document language, mapping to the `lang` attribute in the `<html>` element. |

### IDML `masterspreads.xml` Child Elements to HTML/CSS

| **`masterspreads` Element/Attribute** | **HTML/CSS Equivalent**                | **Explanation**                                                                                  |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **`MasterSpread`**                    | `<div class="master-spread" id="...">` | Represents a container for a master layout; attributes like `id` can be translated to HTML IDs.  |
| **`Self` (attribute)**                | `id` attribute                         | Use as `id` in the `<div>` to uniquely identify the master spread.                               |
| **`Page`**                            | `<div class="page master-page">`       | A `<div>` for each master page with relevant classes.                                            |
| **`Name` (attribute)**                | `data-name` attribute                  | Store page name using a `data-*` attribute for easy reference in JavaScript/CSS.                 |
| **`GeometricBounds`**                 | CSS `width`, `height`, `position`      | Define size and position using these CSS properties.                                             |
| **`ItemTransform`**                   | CSS `transform`                        | Apply transformation properties like `rotate`, `scale`, and `translate`.                         |
| **`Rectangle/Oval/Polygon`**          | `<div>` with CSS properties            | Represent as styled `<div>` elements; attributes like `FillColor` can map to `background-color`. |
| **`FillColor` (attribute)**           | CSS `background-color`                 | Use as a `background-color` in CSS to define the fill color of a shape.                          |
| **`StrokeColor` (attribute)**         | CSS `border-color`                     | Map to `border-color` for outlining shapes.                                                      |
| **`StrokeWeight` (attribute)**        | CSS `border-width`                     | Translate to `border-width` in CSS.                                                              |
| **`GraphicLine`**                     | `<hr>` or styled `<div>`               | Simple lines can be represented using `<hr>` or narrow `<div>` elements with CSS styling.        |
| **`TextFrame`**                       | `<div class="text-frame">`             | Use styled `<div>` for text containers.                                                          |
| **`Content` (attribute)**             | Inner HTML or `data-*` attribute       | Use as inner content of a `<div>` or store in a `data-*` attribute for text content reference.   |
| **`Button`**                          | `<button>`                             | Convert to `<button>` elements, with classes and `data-*` attributes for interactions.           |
| **`Name` (attribute)**                | `name` or `data-name` attribute        | Map to `name` for JavaScript use or `data-name` for custom purposes.                             |
| **`MultiStateObject`**                | JS toggled `<div>` visibility          | Implement multi-state behavior using JavaScript and controlled CSS for state switching.          |
| **`State` (attribute)**               | `data-state` attribute                 | Use `data-state` to represent the current state of an element.                                   |
| **`AnimationSetting`**                | CSS `animation` or JS                  | Apply CSS `animation` or JavaScript for animation effects.                                       |
| **`Duration` (attribute)**            | CSS `animation-duration`               | Set `animation-duration` for CSS animations.                                                     |
| **`Properties`**                      | `data-*` attributes                    | Use `data-*` attributes for custom metadata or properties.                                       |

### IDML `resources/` Child Elements to HTML/CSS

| **`resources` Element/Attribute**                                | **HTML/CSS Equivalent**                    | **Explanation**                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------- |
| **`Fonts`**                                                      | `<link>` or `@font-face` in CSS            | Use the `<link>` tag for web fonts or define custom fonts using `@font-face` in CSS.    |
| **`Font`**                                                       | `font-family`, `font-style` properties     | Map `Family` to `font-family` and `Style` to `font-style`.                              |
| **Attributes of `Font`**                                         |                                            |                                                                                         |
| `Family`                                                         | `font-family`                              | Specifies the font family; maps directly to `font-family` in CSS.                       |
| `Style`                                                          | `font-style`                               | Represents the font style (e.g., italic, normal).                                       |
| `Weight`                                                         | `font-weight`                              | Translate to CSS `font-weight`.                                                         |
| **`Graphic`**                                                    | `<svg>` or `<img>`                         | Vector content represented using SVGs or image tags.                                    |
| **`Color`**                                                      | CSS color properties                       | Directly map to `color` or `background-color`.                                          |
| **Attributes of `Color`**                                        |                                            |                                                                                         |
| `Space`                                                          | N/A                                        | Not directly applicable; use the correct color space representation in CSS (e.g., RGB). |
| `Value`                                                          | Hex code or `rgba()`                       | Translate to `#RRGGBB` or `rgba()` in CSS.                                              |
| **`Swatch`**                                                     | CSS classes or variables                   | Reusable color classes or CSS custom properties.                                        |
| **Attributes of `Swatch`**                                       |                                            |                                                                                         |
| `Name`                                                           | CSS class name                             | Use as the class name or a custom property identifier in CSS.                           |
| **`Gradient`**                                                   | CSS `background: linear-gradient()`        | Map to linear or radial gradients in CSS.                                               |
| **Attributes of `Gradient`**                                     |                                            |                                                                                         |
| `Type`                                                           | `linear-gradient()` or `radial-gradient()` | Type of gradient in CSS.                                                                |
| **`GradientStop`**                                               | Stops in `linear-gradient()`               | Represents color stops in a gradient.                                                   |
| **Attributes of `GradientStop`**                                 |                                            |                                                                                         |
| `Offset`                                                         | Position in `linear-gradient()`            | Use as a percentage for the gradient stop in CSS.                                       |
| `Color`                                                          | Hex code or `rgba()`                       | Represents the color of the stop; use as a color value in CSS.                          |
| **`Styles`**                                                     | CSS classes                                | Paragraph, character, or object styles translated to CSS classes.                       |
| **`ParagraphStyle`**                                             | CSS classes for text                       | Define text alignment, line spacing, etc.                                               |
| **Attributes of `ParagraphStyle`**                               |                                            |                                                                                         |
| `Alignment`                                                      | `text-align`                               | Aligns text; maps to `text-align` in CSS.                                               |
| `Indent`                                                         | `text-indent`                              | Sets the indentation of the first line in a paragraph.                                  |
| **`CharacterStyle`**                                             | Inline CSS or classes                      | Character-specific styles applied through CSS classes.                                  |
| **Attributes of `CharacterStyle`**                               |                                            |                                                                                         |
| `FontSize`                                                       | `font-size`                                | Maps directly to CSS `font-size`.                                                       |
| `FontWeight`                                                     | `font-weight`                              | Maps directly to CSS `font-weight`.                                                     |
| **`ObjectStyle`**                                                | CSS classes for objects                    | Use CSS classes for object styling such as borders and backgrounds.                     |
| **Attributes of `ObjectStyle`**                                  |                                            |                                                                                         |
| `FillColor`                                                      | `background-color`                         | Use as a `background-color` in CSS.                                                     |
| `StrokeColor`                                                    | `border-color`                             | Translate to `border-color` in CSS.                                                     |
| `StrokeWeight`                                                   | `border-width`                             | Map to `border-width`.                                                                  |
| **`TransparencySetting`**                                        | CSS `opacity`                              | Map to `opacity` in CSS for transparency.                                               |
| **Attributes of `TransparencySetting`**                          | `BlendMode`                                | CSS `mix-blend-mode`                                                                    |
| **`Preferences`**                                                | CSS defaults or global variables           | Apply as CSS defaults or global custom properties for consistency.                      |
| **Attributes of `Units` (e.g., `PointSize`, `HorizontalScale`)** | `font-size`, `transform: scale()`          | Convert to `font-size` and `transform` for scaling in CSS.                              |

### IDML `stories/` Child Elements to HTML/CSS

| **`stories` Element/Attribute**         | **HTML/CSS Equivalent**                         | **Explanation**                                                                           |
| --------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **`Story`**                             | `<div class="story">`                           | Represents a block of content or story, translated to a `<div>` with a class for styling. |
| **Attributes of `Story`**               | `id`, `data-*` attributes                       | Use `id` for unique identification and `data-*` for metadata storage.                     |
| **`ParagraphStyleRange`**               | `<p>` or `<div>` with CSS class                 | Translates to a `<p>` for paragraphs or a styled `<div>`.                                 |
| **Attributes of `ParagraphStyleRange`** | `class`, `style` attributes                     | Use classes for paragraph-specific styles (e.g., `text-align`, `line-height`).            |
| **`CharacterStyleRange`**               | `<span>` or styled inline elements              | Use `<span>` for character-specific styling within paragraphs.                            |
| **Attributes of `CharacterStyleRange`** | `class`, `style` attributes                     | Map to CSS classes or inline styles for text attributes like `font-weight`, `font-size`.  |
| **`Content`**                           | Text within HTML elements                       | The text content directly mapped inside `<p>` or `<div>`.                                 |
| **`AppliedFont`**                       | CSS `font-family`                               | Maps to the `font-family` property in CSS.                                                |
| **`PointSize`**                         | CSS `font-size`                                 | Translates to `font-size` in CSS.                                                         |
| **`Leading`**                           | CSS `line-height`                               | Sets line spacing, mapped to `line-height`.                                               |
| **`FillColor`**                         | CSS `color`                                     | Maps to the text color property in CSS.                                                   |
| **`Justification`**                     | CSS `text-align`                                | Aligns text; maps directly to `text-align`.                                               |
| **`Tracking`**                          | CSS `letter-spacing`                            | Adjusts space between characters, mapped to `letter-spacing`.                             |
| **`KerningMethod`**                     | CSS `letter-spacing` or JS adjustment           | Use `letter-spacing` for simple kerning or JavaScript for more precise control.           |
| **`BaselineShift`**                     | CSS `vertical-align`                            | Controls the vertical position of text; maps to `vertical-align`.                         |
| **`Capitalization`**                    | CSS `text-transform`                            | Handles capitalization (e.g., uppercase, lowercase); maps to `text-transform`.            |
| **`Underline`**                         | CSS `text-decoration`                           | Map to `text-decoration: underline;`.                                                     |
| **`Strikethrough`**                     | CSS `text-decoration`                           | Use `text-decoration: line-through;`.                                                     |
| **`TabStop`**                           | CSS `tab-size` or custom JS                     | Map tab positions to `tab-size` or use custom JavaScript for specific tab placements.     |
| **`Hyphenation`**                       | CSS `hyphens`                                   | Controls hyphenation in text, mapped to `hyphens`.                                        |
| **`InsertionPoint`**                    | Placeholder or caret element                    | Represent with a `<span>` styled as a caret or placeholder.                               |
| **`Note`**                              | `<aside>` or `<span class="note">`              | Use `<aside>` or a `<span>` for in-text notes.                                            |
| **Attributes of `Note`**                | `data-*`, `id`                                  | Use `data-*` for metadata and `id` for note references.                                   |
| **`Table`**                             | `<table>`                                       | Direct mapping to an HTML `<table>` element.                                              |
| **Attributes of `Table`**               | `class`, `border`, `cellspacing`, `cellpadding` | Use standard HTML table attributes for layout and styling.                                |
| **`Cell`**                              | `<td>` or `<th>`                                | Direct mapping to table cells in HTML.                                                    |
| **Attributes of `Cell`**                | `rowspan`, `colspan`, `style`                   | Map to standard HTML cell attributes.                                                     |
| **`HyperlinkTextSource`**               | `<a href="...">`                                | Maps to an anchor tag for hyperlinks.                                                     |
| **Attributes of `HyperlinkTextSource`** | `href`, `target`                                | Use `href` for the link URL and `target` for how the link opens.                          |
