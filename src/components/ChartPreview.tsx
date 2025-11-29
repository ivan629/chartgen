import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Scatter } from 'react-chartjs-2';
import type { ChartConfig, DataRow } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TransformedData {
  labels: string[];
  values: number[];
}

function transformData(data: DataRow[], config: ChartConfig): TransformedData | null {
  if (!data || !config) return null;

  let processed = [...data];

  // Apply filter
  if (config.filter) {
    processed = processed.filter(item => {
      const value = item[config.filter!.field];
      return String(value).toLowerCase() === String(config.filter!.value).toLowerCase();
    });
  }

  // Group data if needed
  if (config.groupBy && config.xField) {
    const groups: Record<string, DataRow[]> = {};
    
    processed.forEach(item => {
      let key = String(item[config.xField] || '');
      
      if (config.groupBy === 'month' && key) {
        const date = new Date(key);
        if (!isNaN(date.getTime())) {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
      } else if (config.groupBy === 'year' && key) {
        const date = new Date(key);
        if (!isNaN(date.getTime())) {
          key = String(date.getFullYear());
        }
      } else if (config.groupBy === 'week' && key) {
        const date = new Date(key);
        if (!isNaN(date.getTime())) {
          const week = Math.ceil(date.getDate() / 7);
          key = `${date.getFullYear()}-W${week}`;
        }
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    const aggregated = Object.entries(groups).map(([key, items]) => {
      let value: number;
      const values = items.map(i => parseFloat(String(i[config.yField])) || 0);
      
      switch (config.aggregate) {
        case 'average':
          value = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          value = items.length;
          break;
        case 'max':
          value = Math.max(...values);
          break;
        case 'min':
          value = Math.min(...values);
          break;
        case 'sum':
        default:
          value = values.reduce((a, b) => a + b, 0);
      }

      return { label: key, value };
    });

    aggregated.sort((a, b) => a.label.localeCompare(b.label));

    return {
      labels: aggregated.map(d => d.label),
      values: aggregated.map(d => d.value),
    };
  }

  return {
    labels: processed.map(d => String(d[config.xField] || '')),
    values: processed.map(d => parseFloat(String(d[config.yField])) || 0),
  };
}

const chartColors = [
  '#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
];

interface ChartPreviewProps {
  data: DataRow[] | null;
  config: ChartConfig | null;
}

export default function ChartPreview({ data, config }: ChartPreviewProps) {
  const chartData = useMemo(() => {
    if (!data || !config) return null;
    return transformData(data, config);
  }, [data, config]);

  if (!config) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <div className="text-lg font-medium mb-2">No chart yet</div>
          <div className="text-sm">Describe what you want in the chat</div>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <div>Could not process data</div>
        </div>
      </div>
    );
  }

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: config.chartType === 'pie',
        position: 'bottom' as const,
        labels: {
          color: '#a1a1aa',
          padding: 20,
          font: { family: 'Geist, sans-serif' }
        }
      },
      title: {
        display: true,
        text: config.title || 'Chart',
        color: '#fafafa',
        font: { 
          size: 16, 
          weight: 500 as const,
          family: 'Geist, sans-serif'
        },
        padding: { bottom: 20 }
      },
      tooltip: {
        backgroundColor: '#1a1a1f',
        borderColor: '#2a2a30',
        borderWidth: 1,
        titleColor: '#fafafa',
        bodyColor: '#a1a1aa',
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Geist, sans-serif' },
        bodyFont: { family: 'Geist, sans-serif' }
      }
    },
    scales: config.chartType !== 'pie' ? {
      x: {
        grid: { color: '#2a2a30' },
        ticks: { 
          color: '#a1a1aa',
          font: { family: 'Geist, sans-serif' }
        }
      },
      y: {
        grid: { color: '#2a2a30' },
        ticks: { 
          color: '#a1a1aa',
          font: { family: 'Geist, sans-serif' }
        },
        beginAtZero: true
      }
    } : undefined
  };

  const dataset = {
    label: config.yField || 'Value',
    data: chartData.values,
    backgroundColor: config.chartType === 'pie' 
      ? chartColors.slice(0, chartData.labels.length)
      : config.color + '33',
    borderColor: config.chartType === 'pie'
      ? chartColors.slice(0, chartData.labels.length)
      : config.color,
    borderWidth: config.chartType === 'pie' ? 0 : 2,
    tension: 0.3,
    fill: config.chartType === 'line',
    pointBackgroundColor: config.color,
    pointBorderColor: config.color,
    pointRadius: 4,
    pointHoverRadius: 6,
  };

  const finalData = {
    labels: chartData.labels,
    datasets: [dataset]
  };

  const ChartComponent = {
    line: Line,
    bar: Bar,
    pie: Pie,
    scatter: Scatter
  }[config.chartType] || Line;

  return (
    <div className="h-full p-4">
      <ChartComponent data={finalData} options={baseOptions} />
    </div>
  );
}
