import { useState, useCallback } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import type { SchemaField, FieldType, DataRow } from '../types';

function inferType(value: unknown): FieldType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    if (!isNaN(Number(value)) && value.trim() !== '') return 'number-string';
    return 'string';
  }
  if (typeof value === 'object') return 'object';
  return 'unknown';
}

interface AnalysisResult {
  schema?: SchemaField[];
  rowCount?: number;
  error?: string;
}

function analyzeSchema(data: unknown[]): AnalysisResult {
  if (!Array.isArray(data) || data.length === 0) {
    return { error: 'Data must be a non-empty array of objects' };
  }

  const fields: Record<string, { types: Set<FieldType>; count: number }> = {};
  const sampleValues: Record<string, Set<string>> = {};

  data.forEach((item) => {
    if (typeof item !== 'object' || item === null) return;
    
    Object.entries(item as Record<string, unknown>).forEach(([key, value]) => {
      const type = inferType(value);
      
      if (!fields[key]) {
        fields[key] = { types: new Set(), count: 0 };
        sampleValues[key] = new Set();
      }
      
      fields[key].types.add(type);
      fields[key].count++;
      
      if (sampleValues[key].size < 5 && value !== null && value !== undefined) {
        sampleValues[key].add(String(value).slice(0, 50));
      }
    });
  });

  const schema: SchemaField[] = Object.entries(fields).map(([name, info]) => ({
    name,
    type: info.types.size === 1 ? [...info.types][0] : 'mixed',
    types: [...info.types],
    coverage: Math.round((info.count / data.length) * 100),
    samples: [...sampleValues[name]],
  }));

  return { schema, rowCount: data.length };
}

const typeColors: Record<FieldType, string> = {
  number: 'text-blue-400',
  'number-string': 'text-blue-300',
  string: 'text-green-400',
  date: 'text-purple-400',
  boolean: 'text-yellow-400',
  object: 'text-orange-400',
  array: 'text-pink-400',
  null: 'text-gray-500',
  mixed: 'text-red-400',
  unknown: 'text-gray-400',
};

const typeIcons: Record<FieldType, string> = {
  number: '#',
  'number-string': '#',
  string: 'Aa',
  date: '📅',
  boolean: '◐',
  object: '{}',
  array: '[]',
  null: '∅',
  mixed: '?',
  unknown: '?',
};

interface JsonUploaderProps {
  onDataLoaded: (data: DataRow[], schema: SchemaField[]) => void;
}

export default function JsonUploader({ onDataLoaded }: JsonUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<SchemaField[] | null>(null);
  const [rowCount, setRowCount] = useState(0);

  const processJson = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text);
      const data: DataRow[] = Array.isArray(parsed) ? parsed : [parsed];
      const result = analyzeSchema(data);
      
      if (result.error || !result.schema) {
        setError(result.error || 'Failed to analyze schema');
        return;
      }

      setSchema(result.schema);
      setRowCount(result.rowCount || 0);
      setError(null);
      onDataLoaded(data, result.schema);
    } catch (e) {
      setError('Invalid JSON: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => processJson(e.target?.result as string);
      reader.readAsText(file);
    }
  }, [processJson]);

  const handlePaste = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.trim()) {
      processJson(text);
    }
  }, [processJson]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => processJson(e.target?.result as string);
      reader.readAsText(file);
    }
  }, [processJson]);

  const handleReset = () => {
    setSchema(null);
    setError(null);
    setRowCount(0);
  };

  if (schema) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[var(--success)]"></div>
            <span className="text-[var(--text-secondary)] text-sm">
              {rowCount} rows loaded
            </span>
          </div>
          <button
            onClick={handleReset}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Change data
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Detected Fields
          </div>
          {schema.map((field, i) => (
            <div
              key={field.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className={`text-sm font-mono w-6 ${typeColors[field.type]}`}>
                {typeIcons[field.type]}
              </span>
              <span className="font-medium flex-1">{field.name}</span>
              <span className={`text-sm ${typeColors[field.type]}`}>
                {field.type}
              </span>
            </div>
          ))}
        </div>

        {schema.length > 0 && schema[0].samples.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)]">
            <div className="text-xs text-[var(--text-secondary)] mb-2">Sample values from "{schema[0].name}"</div>
            <div className="text-sm font-mono text-[var(--text-secondary)]">
              {schema[0].samples.slice(0, 3).join(', ')}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-[var(--accent)] bg-[var(--accent)]/10' 
            : 'border-[var(--border)] hover:border-[var(--text-secondary)]'
          }
        `}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-4xl mb-3">📁</div>
        <div className="text-[var(--text-primary)] font-medium mb-1">
          Drop JSON file here
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          or click to browse
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-[var(--border)]"></div>
        <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">or paste</span>
        <div className="flex-1 h-px bg-[var(--border)]"></div>
      </div>

      <textarea
        placeholder='[{"date": "2024-01-01", "value": 100}, ...]'
        onChange={handlePaste}
        className="w-full h-32 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] 
                   text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
                   focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
      />

      {error && (
        <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/30 text-[var(--error)] text-sm animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
