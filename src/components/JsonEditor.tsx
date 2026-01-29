import { useState } from 'react';
import { ChevronDown, ChevronRight, Hash, Type, ToggleLeft, List, Braces } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

interface JsonEditorProps {
  data: unknown;
  onChange: (data: unknown) => void;
  keyName?: string;
  depth?: number;
}

export const JsonEditor = ({ data, onChange, keyName, depth = 0 }: JsonEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const renderValue = () => {
    if (data === null) {
      return (
        <span className="text-muted-foreground italic font-mono text-sm">null</span>
      );
    }

    if (typeof data === 'boolean') {
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={data}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <span className={`font-mono text-sm ${data ? 'json-boolean-true' : 'json-boolean-false'}`}>
            {data.toString()}
          </span>
        </div>
      );
    }

    if (typeof data === 'number') {
      return (
        <Input
          type="number"
          value={data}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-32 h-8 font-mono text-sm bg-input border-border json-number"
        />
      );
    }

    if (typeof data === 'string') {
      return (
        <Input
          type="text"
          value={data}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-8 font-mono text-sm bg-input border-border"
        />
      );
    }

    if (Array.isArray(data)) {
      return (
        <div className="w-full">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="json-array-badge px-2 py-0.5 rounded text-xs font-medium">
              Array [{data.length}]
            </span>
          </button>
          
          {isExpanded && (
            <div className="mt-2 ml-4 pl-4 border-l border-border/50 space-y-2">
              {data.map((item, index) => (
                <div key={index} className="editor-card p-3">
                  <JsonEditor
                    data={item}
                    onChange={(newValue) => {
                      const newArray = [...data];
                      newArray[index] = newValue;
                      onChange(newArray);
                    }}
                    keyName={`[${index}]`}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data as Record<string, unknown>);
      
      return (
        <div className="w-full">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="json-object-badge px-2 py-0.5 rounded text-xs font-medium">
              Object {`{${entries.length}}`}
            </span>
          </button>
          
          {isExpanded && (
            <div className="mt-2 ml-4 pl-4 border-l border-border/50 space-y-2">
              {entries.map(([key, value]) => (
                <div key={key} className="editor-card p-3">
                  <JsonEditor
                    data={value}
                    onChange={(newValue) => {
                      onChange({ ...data as object, [key]: newValue });
                    }}
                    keyName={key}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const getTypeIcon = () => {
    if (data === null) return null;
    if (typeof data === 'boolean') return <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />;
    if (typeof data === 'number') return <Hash className="w-3.5 h-3.5 text-muted-foreground" />;
    if (typeof data === 'string') return <Type className="w-3.5 h-3.5 text-muted-foreground" />;
    if (Array.isArray(data)) return <List className="w-3.5 h-3.5 text-muted-foreground" />;
    if (typeof data === 'object') return <Braces className="w-3.5 h-3.5 text-muted-foreground" />;
    return null;
  };

  const isPrimitive = typeof data !== 'object' || data === null;

  return (
    <div className={`flex ${isPrimitive ? 'items-center' : 'flex-col'} gap-2`}>
      {keyName && (
        <div className="flex items-center gap-2 min-w-[120px]">
          {getTypeIcon()}
          <span className="json-key text-sm font-medium">{keyName}</span>
        </div>
      )}
      {renderValue()}
    </div>
  );
};
