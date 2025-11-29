# ChartGen

A web tool to generate reusable TypeScript React chart components from JSON data.

## How It Works

1. **Upload JSON** - Drag & drop or paste your JSON data
2. **Describe Chart** - Tell the chat what kind of chart you want
3. **Preview & Download** - See the live preview and download the TypeScript component

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Features

- **TypeScript** - All generated components are fully typed
- **Auto-detect schema** - Automatically detects field types (date, number, string)
- **Natural language** - Describe charts in plain English
- **Live preview** - See your chart before downloading
- **Clean output** - Generated components are self-contained and ready to use

## Supported Charts

- Line charts
- Bar charts
- Pie charts
- Scatter plots

## Supported Transformations

- Filter by field value
- Group by day/week/month/year
- Aggregate: sum, average, count, min, max

## Generated Component Example

```tsx
import RevenueChart from './RevenueChart';

// Your data
const data = [
  { date: '2024-01-01', revenue: 1000 },
  { date: '2024-02-01', revenue: 1500 },
];

// Just pass data - component handles everything
<RevenueChart data={data} />
```

## Tech Stack

- React 18 + TypeScript
- Vite
- react-chartjs-2 / Chart.js
- Tailwind CSS

## Project Structure

```
src/
├── components/
│   ├── JsonUploader.tsx    # JSON upload & schema detection
│   ├── Chat.tsx            # Chat interface for describing charts
│   ├── ChartPreview.tsx    # Live chart preview
│   └── CodeGenerator.tsx   # Generate & download .tsx files
├── types/
│   └── index.ts            # TypeScript type definitions
├── App.tsx
├── main.tsx
└── index.css
```

## License

MIT
# chartgen
