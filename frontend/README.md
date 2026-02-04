# Background Remover - Frontend

Next.js 14 frontend for the background removal application.

## Requirements

- Node.js 18+
- npm or yarn

## Setup

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
npm start
```

## Features

- Drag & drop image upload
- Multi-file batch upload
- Real-time processing status
- Before/after image preview
- Bulk ZIP download
- Responsive design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + Tailwind CSS
- **State**: Zustand
- **File Upload**: react-dropzone
- **ZIP Creation**: JSZip + file-saver

## Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main page
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Progress.tsx
│   │   └── Spinner.tsx
│   ├── upload/
│   │   ├── DropZone.tsx # Drag & drop area
│   │   └── FileList.tsx # Upload queue
│   ├── preview/
│   │   ├── ImagePreview.tsx  # Single image
│   │   └── ImageGrid.tsx     # Image gallery
│   └── download/
│       ├── DownloadButton.tsx
│       └── BulkDownload.tsx
├── hooks/
│   ├── useImageUpload.ts    # Upload logic
│   └── useJobStatus.ts      # Status polling
├── lib/
│   └── api.ts           # API client
└── store/
    └── imageStore.ts    # Zustand store
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Proxy

In development, API requests are proxied via `next.config.js` rewrites:

```js
'/api/:path*' → 'http://localhost:8000/api/:path*'
```
