export type FieldType = 'number' | 'number-string' | 'string' | 'date' | 'boolean' | 'object' | 'array' | 'null' | 'mixed' | 'unknown';

export interface SchemaField {
  name: string;
  type: FieldType;
  types: FieldType[];
  coverage: number;
  samples: string[];
}

export interface ChartConfig {
  chartType: 'line' | 'bar' | 'pie' | 'scatter';
  xField: string;
  yField: string;
  labelField?: string | null;
  groupBy?: 'day' | 'week' | 'month' | 'year' | null;
  filter?: {
    field: string;
    value: string;
  } | null;
  aggregate: 'sum' | 'average' | 'count' | 'max' | 'min';
  color: string;
  title: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export type DataRow = Record<string, unknown>;
