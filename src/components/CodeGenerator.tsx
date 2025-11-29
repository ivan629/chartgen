import { useState } from 'react';
import type { ChartConfig, SchemaField } from '../types';

function generateComponentCode(config: ChartConfig): string {
  const componentName = config.title
    ? config.title.replace(/[^a-zA-Z0-9]/g, '').replace(/^\d+/, '') + 'Chart'
    : 'GeneratedChart';

  const chartImport: Record<string, string> = {
    line: 'Line',
    bar: 'Bar',
    pie: 'Pie',
    scatter: 'Scatter'
  };

  const chartElements: Record<string, string> = {
    line: 'LineElement, PointElement',
    bar: 'BarElement',
    pie: 'ArcElement',
    scatter: 'PointElement'
  };

  const chartImportName = chartImport[config.chartType] || 'Line';
  const chartElementsName = chartElements[config.chartType] || 'LineElement, PointElement';

  const filterCode = config.filter 
    ? `\n  // Filter data\n  const filtered = data.filter(d => String(d.${config.filter.field}).toLowerCase() === '${config.filter.value.toLowerCase()}');`
    : '\n  const filtered = data;';

  let groupCode = '';
  if (config.groupBy) {
    let keyExtraction: string;
    switch (config.groupBy) {
      case 'month':
        keyExtraction = `const date = new Date(d.${config.xField} as string);\n        return \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}\`;`;
        break;
      case 'year':
        keyExtraction = `const date = new Date(d.${config.xField} as string);\n        return String(date.getFullYear());`;
        break;
      case 'week':
        keyExtraction = `const date = new Date(d.${config.xField} as string);\n        const week = Math.ceil(date.getDate() / 7);\n        return \`\${date.getFullYear()}-W\${week}\`;`;
        break;
      default:
        keyExtraction = `return String(d.${config.xField});`;
    }

    let aggregation: string;
    switch (config.aggregate) {
      case 'average':
        aggregation = 'values.reduce((a, b) => a + b, 0) / values.length';
        break;
      case 'count':
        aggregation = 'items.length';
        break;
      case 'max':
        aggregation = 'Math.max(...values)';
        break;
      case 'min':
        aggregation = 'Math.min(...values)';
        break;
      default:
        aggregation = 'values.reduce((a, b) => a + b, 0)';
    }

    groupCode = `

  // Group data by ${config.groupBy}
  const groups: Record<string, DataRow[]> = {};
  filtered.forEach(d => {
    const key = (() => {
      ${keyExtraction}
    })();
    if (!groups[key]) groups[key] = [];
    groups[key].push(d);
  });

  // Aggregate: ${config.aggregate}
  const aggregated = Object.entries(groups)
    .map(([key, items]) => {
      const values = items.map(i => parseFloat(String(i.${config.yField})) || 0);
      return { label: key, value: ${aggregation} };
    })
    .sort((a, b) => a.label.localeCompare(b.label));

  const labels = aggregated.map(d => d.label);
  const values = aggregated.map(d => d.value);`;
  } else {
    groupCode = `

  // Extract data
  const labels = filtered.map(d => String(d.${config.xField}));
  const values = filtered.map(d => parseFloat(String(d.${config.yField})) || 0);`;
  }

  const pieColors = config.chartType === 'pie' 
    ? `\n\nconst colors = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444'];`
    : '';

  const datasetConfig = config.chartType === 'pie'
    ? `{
      data: values,
      backgroundColor: colors.slice(0, labels.length),
      borderWidth: 0,
    }`
    : `{
      label: '${config.yField || 'Value'}',
      data: values,
      backgroundColor: '${config.color}33',
      borderColor: '${config.color}',
      borderWidth: 2,
      tension: 0.3,
      fill: ${config.chartType === 'line'},
      pointRadius: 4,
    }`;

  const scalesConfig = config.chartType === 'pie'
    ? ''
    : `,
    scales: {
      x: { grid: { color: '#e5e5e5' } },
      y: { grid: { color: '#e5e5e5' }, beginAtZero: true }
    }`;

  return `import React from 'react';
import { ${chartImportName} } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ${chartElementsName},
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  ${chartElementsName},
  Title,
  Tooltip,
  Legend,
  Filler
);

type DataRow = Record<string, unknown>;${pieColors}

interface ${componentName}Props {
  data: DataRow[];
}

/**
 * ${componentName}
 * 
 * Generated chart component
 * Chart type: ${config.chartType}
 * X-axis: ${config.xField}
 * Y-axis: ${config.yField}
 ${config.groupBy ? `* Grouped by: ${config.groupBy}` : ''}
 ${config.aggregate ? `* Aggregation: ${config.aggregate}` : ''}
 ${config.filter ? `* Filter: ${config.filter.field} = ${config.filter.value}` : ''}
 */
export default function ${componentName}({ data }: ${componentName}Props): React.ReactElement {
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }
${filterCode}${groupCode}

  const chartData = {
    labels,
    datasets: [${datasetConfig}]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: ${config.chartType === 'pie'}, position: 'bottom' as const },
      title: {
        display: true,
        text: '${config.title || componentName}',
        font: { size: 16, weight: 500 as const }
      }
    }${scalesConfig}
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <${chartImportName} data={chartData} options={options} />
    </div>
  );
}
`;
}

function generateReadme(config: ChartConfig): string {
  const componentName = config.title
    ? config.title.replace(/[^a-zA-Z0-9]/g, '').replace(/^\d+/, '') + 'Chart'
    : 'GeneratedChart';

  return `# ${componentName}

Generated TypeScript chart component using react-chartjs-2.

## Installation

\`\`\`bash
npm install react-chartjs-2 chart.js
\`\`\`

## Usage

\`\`\`tsx
import ${componentName} from './${componentName}';

// Your data should be an array of objects
const myData = [
  { ${config.xField}: '2024-01', ${config.yField}: 100 },
  { ${config.xField}: '2024-02', ${config.yField}: 150 },
  // ...
];

function App() {
  return <${componentName} data={myData} />;
}
\`\`\`

## Expected Data Format

| Field | Type | Description |
|-------|------|-------------|
| ${config.xField} | ${config.groupBy ? 'date/string' : 'string'} | X-axis values |
| ${config.yField} | number | Y-axis values |
${config.filter ? `| ${config.filter.field} | string | Filter field (filtered to "${config.filter.value}") |` : ''}

## Configuration

- **Chart Type:** ${config.chartType}
- **Aggregation:** ${config.aggregate || 'none'}
${config.groupBy ? `- **Grouping:** by ${config.groupBy}` : ''}
${config.filter ? `- **Filter:** ${config.filter.field} = "${config.filter.value}"` : ''}

## Customization

Edit the component file to customize:
- Colors: Change \`backgroundColor\` and \`borderColor\`
- Title: Modify the \`title\` in options
- Scales: Adjust grid and tick settings

## TypeScript

This component is fully typed. The \`DataRow\` type accepts any object with string keys.
For stricter typing, you can replace \`DataRow\` with your own interface.
`;
}

interface CodeGeneratorProps {
  config: ChartConfig | null;
  schema: SchemaField[] | null;
}

export default function CodeGenerator({ config }: CodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  if (!config) return null;

  const code = generateComponentCode(config);
  const readme = generateReadme(config);
  
  const componentName = config.title
    ? config.title.replace(/[^a-zA-Z0-9]/g, '').replace(/^\d+/, '') + 'Chart'
    : 'GeneratedChart';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Download component file
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${componentName}.tsx`;
    a.click();
    URL.revokeObjectURL(url);

    // Download README
    setTimeout(() => {
      const readmeBlob = new Blob([readme], { type: 'text/markdown' });
      const readmeUrl = URL.createObjectURL(readmeBlob);
      const readmeA = document.createElement('a');
      readmeA.href = readmeUrl;
      readmeA.download = 'README.md';
      readmeA.click();
      URL.revokeObjectURL(readmeUrl);
    }, 100);
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--success)]/20 flex items-center justify-center">
            <span className="text-[var(--success)]">✓</span>
          </div>
          <div>
            <div className="font-medium text-sm">{componentName}.tsx</div>
            <div className="text-xs text-[var(--text-secondary)]">TypeScript • Ready to download</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] 
                       text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                       hover:border-[var(--text-secondary)] transition-colors"
          >
            {showCode ? 'Hide' : 'View'} Code
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] 
                       text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                       hover:border-[var(--text-secondary)] transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--accent)] text-white
                       hover:bg-[var(--accent-hover)] transition-colors font-medium"
          >
            Download
          </button>
        </div>
      </div>

      {showCode && (
        <div className="border-t border-[var(--border)] max-h-80 overflow-auto">
          <pre className="p-4 text-xs leading-relaxed text-[var(--text-secondary)] font-mono">
            {code}
          </pre>
        </div>
      )}
    </div>
  );
}
