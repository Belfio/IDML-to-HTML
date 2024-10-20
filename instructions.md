# InDesign IDML to Typescript

## 1. Project Overview

The goal of this software is to automate the work of publishers. The workflow includes:

- Converting an IDL InDesign layout template into the final magazine
- Transforming magazine articles into social media posts for platforms such as Ghost, Instagram, and Facebook
- Reviewing the copy and assessing the quality of the final output

### 1.1 Target Audience

InDesign operators working in publishing companies.

### 1.2 Key Benefits

- **Time Efficiency**: Automates the manual insertion of content into InDesign files and various social media platforms.
- **Consistency**: Ensures uniform formatting and quality across all published materials.
- **Scalability**: Facilitates the handling of larger volumes of content with minimal manual intervention.

## 2. System Architecture

Web based platform in React Typescript Remix.
Serveless backend on AWS, deployed via SST Ion.

## 3. App Specifications

1. **Read an IDML File**

   - Implement file upload functionality with validation checks for IDML format.
   - Handle large file uploads efficiently using streaming or chunking techniques.

2. **Decode an IDML File into Its Single Parts Following @IDMLlib Specifications**

   - Utilize @IDMLlib to parse IDML files.
   - Extract individual components (e.g., pages, master spreads, styles).
   - Handle errors and exceptions gracefully during the decoding process.

3. **Turn the IDML into JSON for Easy Manipulation**

   - Convert decoded IDML components into JSON structures.
   - Ensure JSON schemas are well-defined for consistent data manipulation.
   - Optimize JSON for performance and scalability.

4. **Preview the Result in HTML**

   - Develop a responsive HTML preview interface.
   - Implement real-time rendering of JSON data into HTML.
   - Ensure cross-browser compatibility and accessibility standards.

5. **Allow Modification of the Content of the IDML Such as the Texts and the Images**

   - Create interactive editing tools for text and image modifications.
   - Implement validation rules to maintain IDML integrity.
   - Provide user-friendly interfaces for seamless content editing.

6. **Save the IDML Back to Original Format**
   - Reconstruct IDML files from modified JSON data.
   - Ensure all modifications are accurately reflected in the final IDML.
   - Implement download and storage options for the updated IDML files.

### 3.1 Technology Stack

- **Front-End Framework**: Remix - React (with TypeScript)
- **Build Tool**: Vite.js
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui
- **Routing**: Folder/File-based routing using React Router
- **State Management**: React Context API or alternative as needed
- **Package Manager**: npm
- **Testing Framework**: Jest and React Testing Library
- **Linting and Formatting**: ESLint and Prettier
- **IDML Parsing Libraries**:
  - `jszip`
  - `fast-xml-parser`

### 3.2 Project Structure

idml-to-typescript/: Root directory of the project.
├── src/: Contains all the front-end source code.
│ ├── components/: Reusable React components.
│ ├── pages/: Page components corresponding to different routes.
│ ├── api/: API endpoints for backend interactions.
│ ├── services/: Services for handling business logic and integrations.
│ ├── styles/: Global and component-specific styles.
│ ├── utils/: Utility functions and helpers.
│ ├── App.tsx: Main application component.
│ └── main.tsx: Entry point of the React application.
├── backend/: Contains serverless backend functions and configurations.
│ ├── functions/: Individual serverless functions.
│ └── config/: Configuration files for backend services.
├── public/: Static assets accessible by the client.
│ └── assets/: Images, fonts, and other static files.
├── tests/: Testing suite for the application.
│ ├── components/: Tests for reusable React components.
│ ├── pages/: Tests for page components.
│ └── services/: Tests for services handling business logic.
├── scripts/: Automation and build scripts.
│ ├── build.sh: Script to build the project.
│ └── deploy.sh: Script to deploy the project.
├── package.json: Defines project dependencies, scripts, and metadata.
├── tsconfig.json: TypeScript compiler configuration.
├── .eslintrc.js: ESLint configuration for code linting.
├── .prettierrc: Prettier configuration for code formatting.
└── README.md: Documentation and overview of the project.

Example Project Structure:

## 5. Security Considerations

## 6. Future Developments

## 8. Current File Structure

## 9. Additional Requirements

## 4. Library Creation

### 4.1 Custom IDML Parser

...

## 7. Dependencies
