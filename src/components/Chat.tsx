import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { SchemaField, ChartConfig, Message, DataRow } from '../types';

interface ChatProps {
  schema: SchemaField[] | null;
  data: DataRow[] | null;  // eslint-disable-line @typescript-eslint/no-unused-vars
  onChartGenerated: (config: ChartConfig) => void;
  disabled: boolean;
}

export default function Chat({ schema, onChartGenerated, disabled }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  useEffect(() => {
    if (schema && schema.length > 0 && messages.length === 0) {
      const fieldList = schema.map(f => f.name).join(', ');
      setMessages([{
        role: 'assistant',
        content: `I can see your data has these fields: **${fieldList}**.\n\nDescribe the chart you want to create. For example:\n- "Line chart showing value over time"\n- "Bar chart comparing categories"\n- "Pie chart of status distribution"`
      }]);
    }
  }, [schema, messages.length]);

  const generateChartConfig = (userMessage: string): ChartConfig => {
    if (!schema) throw new Error('No schema available');
    
    const msg = userMessage.toLowerCase();
    
    // Detect chart type
    let chartType: ChartConfig['chartType'] = 'line';
    if (msg.includes('bar')) chartType = 'bar';
    if (msg.includes('pie') || msg.includes('donut')) chartType = 'pie';
    if (msg.includes('scatter') || msg.includes('point')) chartType = 'scatter';

    // Try to detect X and Y fields from message
    let xField: string | null = null;
    let yField: string | null = null;

    schema.forEach(f => {
      const name = f.name.toLowerCase();
      if (msg.includes(name)) {
        if (f.type === 'date' || f.type === 'string') {
          if (!xField) xField = f.name;
        }
        if (f.type === 'number' || f.type === 'number-string') {
          yField = f.name;
        }
      }
    });

    // Fallback: auto-detect based on types
    if (!xField) {
      const dateField = schema.find(f => f.type === 'date');
      const stringField = schema.find(f => f.type === 'string');
      xField = dateField?.name || stringField?.name || schema[0]?.name || '';
    }

    if (!yField) {
      const numberField = schema.find(f => f.type === 'number' || f.type === 'number-string');
      yField = numberField?.name || schema[1]?.name || '';
    }

    // Detect grouping
    let groupBy: ChartConfig['groupBy'] = null;
    if (msg.includes('by month')) groupBy = 'month';
    if (msg.includes('by week')) groupBy = 'week';
    if (msg.includes('by day')) groupBy = 'day';
    if (msg.includes('by year')) groupBy = 'year';

    // Detect filtering
    let filter: ChartConfig['filter'] = null;
    const filterMatch = msg.match(/(?:only|where|filter)\s+(\w+)\s*=\s*["']?(\w+)["']?/i);
    if (filterMatch) {
      filter = { field: filterMatch[1], value: filterMatch[2] };
    }

    // Detect aggregation
    let aggregate: ChartConfig['aggregate'] = 'sum';
    if (msg.includes('average') || msg.includes('avg') || msg.includes('mean')) aggregate = 'average';
    if (msg.includes('count')) aggregate = 'count';
    if (msg.includes('max')) aggregate = 'max';
    if (msg.includes('min')) aggregate = 'min';

    // Detect color
    let color = '#3b82f6';
    if (msg.includes('red')) color = '#ef4444';
    if (msg.includes('green')) color = '#22c55e';
    if (msg.includes('purple')) color = '#8b5cf6';
    if (msg.includes('orange')) color = '#f97316';
    if (msg.includes('pink')) color = '#ec4899';

    return {
      chartType,
      xField: xField || '',
      yField: yField || '',
      labelField: chartType === 'pie' ? xField : null,
      groupBy,
      filter,
      aggregate,
      color,
      title: `${yField || 'Value'} by ${xField || 'Category'}`,
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const config = generateChartConfig(userMessage);
      
      const response = `I'll create a **${config.chartType} chart** for you:\n\n` +
        `• X-axis: **${config.xField}**\n` +
        `• Y-axis: **${config.yField}**\n` +
        (config.groupBy ? `• Grouped by: **${config.groupBy}**\n` : '') +
        (config.filter ? `• Filtered: **${config.filter.field} = ${config.filter.value}**\n` : '') +
        `• Aggregation: **${config.aggregate}**\n\n` +
        `Check the preview on the right. Want any changes?`;

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      onChartGenerated(config);
    } catch {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble understanding that. Could you rephrase? Try something like "bar chart of sales by month".' 
      }]);
    }

    setIsLoading(false);
  };

  const formatMessage = (content: string): string => {
    return content
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[var(--text-secondary)] py-8">
            <div className="text-3xl mb-3">💬</div>
            <div>Upload data to start chatting</div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-[var(--accent)] text-white rounded-br-md'
                  : 'bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-bl-md'
              }`}
            >
              <div 
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] p-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={disabled ? "Upload data first..." : "Describe your chart..."}
            disabled={disabled || isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)]
                       text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
                       focus:outline-none focus:border-[var(--accent)] transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={disabled || isLoading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-[var(--accent)] text-white font-medium
                       hover:bg-[var(--accent-hover)] transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
