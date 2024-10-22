const { DOMParser } = require("xmldom");
const fs = require("fs");

function parseIDML(files) {
  const parser = new DOMParser();
  const result = {
    document: {},
    stories: [],
    spreads: [],
  };

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    const doc = parser.parseFromString(content, "text/xml");

    if (file.includes("designmap.xml")) {
      result.document = parseDesignMap(doc);
    } else if (file.includes("Story_")) {
      result.stories.push(parseStory(doc));
    } else if (file.includes("Spread_")) {
      result.spreads.push(parseSpread(doc));
    }
  });

  return result;
}

function parseDesignMap(doc) {
  const documentElement = doc.documentElement;
  return {
    name: documentElement.getAttribute("Name"),
    pageCount: documentElement.getElementsByTagName("idPkg:Spread").length,
  };
}

function parseStory(doc) {
  const storyElement = doc.getElementsByTagName("Story")[0];
  const paragraphs = storyElement.getElementsByTagName("ParagraphStyleRange");
  const content = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const style = paragraph.getAttribute("AppliedParagraphStyle");
    const text = paragraph.textContent.trim();

    content.push({
      type: "paragraph",
      style: style,
      text: text,
    });
  }

  return {
    id: storyElement.getAttribute("Self"),
    content: content,
  };
}

function parseSpread(doc) {
  const spreadElement = doc.getElementsByTagName("Spread")[0];
  const pages = spreadElement.getElementsByTagName("Page");
  const spreadPages = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    spreadPages.push({
      name: page.getAttribute("Name"),
      geometricBounds: page.getAttribute("GeometricBounds"),
    });
  }

  return {
    id: spreadElement.getAttribute("Self"),
    pages: spreadPages,
  };
}

function generateHTML(parsedData) {
  let html = '<div class="idml-document">';
  html += `<h1>${parsedData.document.name}</h1>`;

  parsedData.stories.forEach((story) => {
    html += `<div class="story" id="${story.id}">`;
    story.content.forEach((paragraph) => {
      html += `<p class="${paragraph.style.replace("ParagraphStyle/", "")}">${
        paragraph.text
      }</p>`;
    });
    html += "</div>";
  });

  html += "</div>";
  return html;
}

// Usage
const files = ["designmap.xml", "Story_ucf1.xml", "Spread_u183.xml"];
const parsedData = parseIDML(files);
const htmlOutput = generateHTML(parsedData);

console.log(JSON.stringify(parsedData, null, 2));
console.log(htmlOutput);
