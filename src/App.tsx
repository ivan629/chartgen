import { useState } from 'react';
import JsonUploader from './components/JsonUploader';
import Chat from './components/Chat';
import ChartPreview from './components/ChartPreview';
import CodeGenerator from './components/CodeGenerator';
import type { SchemaField, ChartConfig, DataRow } from './types';

export default function App() {
  const [data, setData] = useState<DataRow[] | null>(null);
  const [schema, setSchema] = useState<SchemaField[] | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);

  const handleDataLoaded = (loadedData: DataRow[], loadedSchema: SchemaField[]) => {
    setData(loadedData);
    setSchema(loadedSchema);
    setChartConfig(null);
  };

  const handleChartGenerated = (config: ChartConfig) => {
    setChartConfig(config);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-500 
                            flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">ChartGen</h1>
              <p className="text-xs text-[var(--text-secondary)]">JSON → TypeScript chart components</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2 py-1 rounded bg-[var(--accent)]/20 text-[var(--accent)] font-medium">
              TypeScript
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              How it works →
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Data & Chat */}
          <div className="flex flex-col gap-6 min-h-0">
            {/* Data Upload Section */}
            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] p-5 shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] text-sm font-medium">
                  1
                </div>
                <h2 className="font-medium">Upload Data</h2>
              </div>
              <JsonUploader onDataLoaded={handleDataLoaded} />
            </div>

            {/* Chat Section */}
            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 p-5 border-b border-[var(--border)] shrink-0">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] text-sm font-medium">
                  2
                </div>
                <h2 className="font-medium">Describe Your Chart</h2>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <Chat
                  schema={schema}
                  data={data}
                  onChartGenerated={handleChartGenerated}
                  disabled={!data}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Download */}
          <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 p-5 border-b border-[var(--border)] shrink-0">
              <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] text-sm font-medium">
                3
              </div>
              <h2 className="font-medium">Preview & Download</h2>
            </div>
            
            {/* Chart Preview */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChartPreview data={data} config={chartConfig} />
            </div>

            {/* Code Generator */}
            <CodeGenerator config={chartConfig} schema={schema} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <div>Built with react-chartjs-2 + TypeScript</div>
          <div>Generated components are MIT licensed</div>
        </div>
      </footer>
    </div>
  );
}
