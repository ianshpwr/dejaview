# Dejaview 🔍

An AI-powered Chrome extension that makes your browser history searchable with natural language. Find pages you've visited using semantic search - describe what you're looking for, and Dejaview will find it.

## Features

- **Semantic Search**: Search your browsing history using natural language queries
- **Full-Page Content Indexing**: Automatically extracts and indexes the main content of pages you visit
- **Local Embeddings**: Uses TensorFlow.js with Universal Sentence Encoder for privacy-preserving local embeddings
- **Smart Filtering**: Automatically excludes login pages, error pages, and other non-content pages
- **Domain Grouping**: Search results are intelligently grouped by domain
- **Keyboard Shortcuts**: Quick access with `Ctrl+Shift+Y` (Windows/Linux) or `Cmd+Shift+Y` (Mac)

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Content Script │────▶│ Background Worker│────▶│   IndexedDB     │
│  (Readability)  │     │  (Embeddings)    │     │  (Storage)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  Popup UI    │
                        │  (Search)    │
                        └──────────────┘
```

## Installation

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dejaview.git
   cd dejaview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development Commands

```bash
npm run dev      # Watch mode for development
npm run build    # Production build
npm run preview  # Preview production build
```

## How It Works

1. **Content Extraction**: When you visit a page, the content script uses [Readability.js](https://github.com/mozilla/readability) to extract the main content, filtering out navigation, ads, and boilerplate.

2. **Smart Filtering**: Pages are filtered to exclude:
   - Login/authentication pages
   - Error pages (404, 500, etc.)
   - Chrome internal pages
   - Pages with insufficient content

3. **Embedding Generation**: The extracted text is converted to a 512-dimensional vector embedding using the Universal Sentence Encoder running locally in the browser.

4. **Storage**: Page metadata and embeddings are stored in IndexedDB with automatic cleanup of entries older than 30 days.

5. **Search**: When you search, your query is embedded and compared against stored page embeddings using cosine similarity, returning the most semantically relevant results.

## Tech Stack

### Frontend (Next.js Web App)
- **Framework**: Next.js with React 18
- **Language**: JavaScript (ES6+) with JSX
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives (Dialog, Scroll Area, Slot)
- **Styling**: Tailwind CSS 4 with tailwind-merge & clsx for class utilities
- **Icons**: Lucide React

### Backend (Python)
- **Framework**: FastAPI with Uvicorn ASGI server
- **Vector Search**: FAISS (Facebook AI Similarity Search)
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2 model)
- **ML Runtime**: PyTorch (torch)
- **Scientific Computing**: NumPy

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Package Managers**: npm (frontend), pip (backend)

## Project Structure

```
dejaview/
├── frontend/
│   ├── app/
│   │   ├── layout.js         # Root layout
│   │   ├── page.js           # Home page
│   │   └── components/       # UI components
│   ├── public/               # Static assets
│   ├── package.json          # Frontend dependencies
│   └── tsconfig.json         # TypeScript config (for IDE support)
├── backend/
│   └── faiss/
│       ├── main.py           # FastAPI server entry
│       ├── searchfaiss.py    # FAISS search logic
│       ├── requirements.txt  # Python dependencies
│       └── Dockerfile        # Backend container config
├── docker-compose.yml        # Multi-container orchestration
└── README.md
```

## Privacy

Dejaview is designed with privacy in mind:

- **100% Local Processing**: All embeddings are generated locally using TensorFlow.js
- **No External Servers**: Your browsing data never leaves your browser
- **Local Storage Only**: All data is stored in your browser's IndexedDB
- **Automatic Cleanup**: Old entries are automatically removed after 30 days

## Permissions

- `history`: Read browser history metadata
- `storage`: Store extension settings
- `tabs`: Access current tab information
- `scripting`: Inject content scripts for page extraction

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
