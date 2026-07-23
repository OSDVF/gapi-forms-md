# Google Forms API Emulator

A lightweight, read-only REST API emulator for Google Forms. It allows you to serve form definitions authored in Markdown files as if they were coming from the official Google Forms API.

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

## API Endpoints

### List all forms
`GET /v1/forms`
Returns a list of all available forms (converted from `.md` files in the root directory).

### Get a specific form
`GET /v1/forms/:formId`
Returns the JSON representation of the form defined in `:formId.md`.

## Form Definition (Markdown)

Create a new form by adding a new `.md` file to the root directory.

### Example Syntax

```markdown
# Form Title
Form description.

## Question Title*
- [ ] Checkbox Option
- [ ] Another Option
...
```

- `# ` : Form Title/Page Break.
- `## ` : Question Title (add `*` for required).
- `- [ ] ` : Checkbox.
- `- ` : Radio button.
- `...` : Text question.
- `![Alt](URL)` : Image item.

## License

MIT
