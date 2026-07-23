# Google Forms API Emulator

A lightweight, read-only REST API emulator for Google Forms. It allows you to serve form definitions authored in Markdown files as if they were coming from the official Google Forms API.

## How it works

The emulator uses the filesystem to manage your forms.

- **Form IDs**: The `formId` is simply the filename of your `.md` file (e.g., `feedback-form.md` becomes `formId: "feedback-form"`).
- **Persistence**: When responses are submitted, they are automatically saved as JSON files in the `/responses/:formId/` directory.

## Features

- **Markdown-to-API**: Effortlessly convert human-readable Markdown files into structured JSON compliant with the [Google Forms REST API](https://developers.google.com/workspace/forms/api/reference/rest).
- **Standards Compliant**: Uses official types from `@googleapis/forms` to ensure high compatibility with client libraries.
- **Lightweight**: Built on Bun for high-performance, fast-starting server capabilities.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   bun install
   ```

### Running the Server

Start the emulator in development mode (with hot-reloading):
```bash
bun run dev
```

The server will be available at `http://localhost:3000`.

CLI usage and data root

By default the emulator serves Markdown files from the current working directory. To specify a different Markdown data root the server accepts:

- CLI flag: `--data-root <path>` or `-d <path>`
- Environment variable: `MARKDOWN_ROOT`

Priority: CLI flag > MARKDOWN_ROOT > current working directory

Port selection

You can select the port the server listens on using:

- CLI flag: `--port <port>` or `-p <port>`
- Environment variable: `PORT`

Priority for port: CLI flag > PORT env var > default (3000)

Examples:

```bash
# Serve markdowns from ./markdowns on port 4000
bun index.ts --data-root ./markdowns --port 4000

# Short flags
bun index.ts -d ./markdowns -p 4000

# Using environment variables
MARKDOWN_ROOT=/path/to/my-md PORT=4000 bun index.ts

# From a host project using the installed package
bun ./node_modules/gapi-emulator/index.ts --data-root ./vendor/forms --port 4000
```

The server validates the provided path at startup and will exit with an error if the path does not exist or is not a directory. If you need a quick help message, run:

```bash
bun index.ts --help
```
## API Endpoints

### List all forms
`GET /v1/forms`
Returns a list of all available forms (converted from `.md` files in the root directory).

### Get a specific form
`GET /v1/forms/:formId`
Returns the JSON representation of the form defined in `:formId.md`.

## Form Definition (Markdown)

Create a new form by adding a new `.md` file to the root directory.

### Question Types Syntax Reference

You can define various Google Forms question types using standard Markdown syntax elements:

#### 1. Page Break (Section)
Use a Level 1 Heading to split the form into pages/sections.
```markdown
# Section Title
Optional description text explaining this section.
```

#### 2. Section Navigation (Go-To Sections)
You can set up conditional logic to route respondents to specific sections depending on their answer in a multiple-choice selection. Use the `->` operator followed by the exact name of the destination section heading:
```markdown
## Do you want to customize your arrival date?*
- Yes -> Arrival Details
- No -> Consent
```

#### 3. Question Title & Required Status
Use a Level 2 Heading for question titles. Appending an asterisk `*` marks the question as required.
```markdown
## Question Title*
```

#### 3. Short Text & Paragraph Questions
Use `...` to specify a short-text field, or `... ...` to represent a paragraph / long-form text question.
```markdown
## What is your name?*
...

## Write your detailed feedback:
... ...
```

#### 4. Multiple Choice & Dropdowns
Use lists to define choice questions. Ordered lists automatically map to Dropdown menus, while standard unordered lists map to Radio button questions.
```markdown
## Select your package:
- Basic
- Premium
- Enterprise

## Pick a time slot:
1. Morning
2. Afternoon
3. Evening
```

#### 5. Checkboxes
Use task list elements to define a Checkbox (multiple select) question. Appending a colon `:` to an option identifies it as an "Other:" option.
```markdown
## What are your hobbies?
- [ ] Sports
- [ ] Music
- [ ] Other:
```

#### 6. Linear Scale
Define a linear numeric scale range followed by low and high bounds labels inside parentheses.
```markdown
## Rate your experience:
1-5 (Terrible - Excellent)
```

#### 7. Images
Include images using normal Markdown image links, which automatically attach to the active question.
```markdown
## Look at this graph and answer:
![Chart](https://example.com/chart.png)
```

## Syncing from Google Forms

You can import existing Google Forms directly from your Google Workspace account.

### Setup
1. Create a Google Cloud Project and enable the **Google Forms API**.
2. Create a Service Account and download the JSON key file.
3. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to the path of your key file:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account.json"
   ```
4. Share your Google Form with the Service Account email address as a viewer.

### Usage
Run the sync script by providing your Google Form ID:
```bash
bun run sync.ts <FORM_ID>
```
This will create a new `<FORM_ID>.md` file in the project root, which is immediately available through the emulator.
