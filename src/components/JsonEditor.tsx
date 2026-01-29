import { useState } from 'react';
import { ChevronDown, ChevronRight, Hash, Type, ToggleLeft, List, Braces, CircleSlash, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface JsonEditorProps {
  data: unknown;
  onChange: (data: unknown) => void;
  keyName?: string;
  depth?: number;
  isRoot?: boolean;
  onDelete?: () => void;
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export const JsonEditor = ({ data, onChange, keyName, depth = 0, isRoot = false, onDelete }: JsonEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(depth < 3);
  const [newKey, setNewKey] = useState('');

  const getTypeLabel = (value: unknown): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getDefaultValue = (type: string): JsonValue => {
    switch (type) {
      case 'string': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'null': return null;
      case 'array': return [];
      case 'object': return {};
      default: return '';
    }
  };

  const addToArray = (arr: unknown[], type: string) => {
    onChange([...arr, getDefaultValue(type)]);
  };

  const addToObject = (obj: Record<string, unknown>, key: string, type: string) => {
    if (!key.trim()) return;
    onChange({ ...obj, [key]: getDefaultValue(type) });
    setNewKey('');
  };

  const renderValue = () => {
    // Handle null
    if (data === null) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground italic font-mono text-sm px-2 py-1 bg-muted/50 rounded">null</span>
        </div>
      );
    }

    // Handle undefined (shouldn't happen in valid JSON but just in case)
    if (data === undefined) {
      return (
        <span className="text-muted-foreground italic font-mono text-sm">undefined</span>
      );
    }

    // Handle boolean
    if (typeof data === 'boolean') {
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={data}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <span className={`font-mono text-sm font-medium ${data ? 'json-boolean-true' : 'json-boolean-false'}`}>
            {data.toString()}
          </span>
        </div>
      );
    }

    // Handle number
    if (typeof data === 'number') {
      return (
        <Input
          type="number"
          value={data}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? 0 : parseFloat(val));
          }}
          className="w-40 h-8 font-mono text-sm bg-input border-border json-number"
        />
      );
    }

    // Handle string
    if (typeof data === 'string') {
      return (
        <Input
          type="text"
          value={data}
          onChange={(e) => onChange(e.target.value)}
          placeholder="(empty string)"
          className="flex-1 max-w-md h-8 font-mono text-sm bg-input border-border"
        />
      );
    }

    // Handle array
    if (Array.isArray(data)) {
      return (
        <div className="w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="json-array-badge px-2 py-0.5 rounded text-xs font-medium">
                Array [{data.length}]
              </span>
            </button>
          </div>
          
          {isExpanded && (
            <div className="mt-2 ml-4 pl-4 border-l-2 border-border/50 space-y-2">
              {data.length === 0 ? (
                <div className="text-muted-foreground text-sm italic py-2">Empty array</div>
              ) : (
                data.map((item, index) => (
                  <div key={index} className="editor-card p-3 animate-fade-in">
                    <JsonEditor
                      data={item}
                      onChange={(newValue) => {
                        const newArray = [...data];
                        newArray[index] = newValue;
                        onChange(newArray);
                      }}
                      keyName={`[${index}]`}
                      depth={depth + 1}
                      onDelete={() => {
                        const newArray = data.filter((_, i) => i !== index);
                        onChange(newArray);
                      }}
                    />
                  </div>
                ))
              )}
              
              {/* Add new item buttons */}
              <div className="flex flex-wrap gap-1 pt-2">
                <span className="text-xs text-muted-foreground mr-2 self-center">Add:</span>
                {['string', 'number', 'boolean', 'object', 'array', 'null'].map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() => addToArray(data, type)}
                    className="h-6 px-2 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Handle object
    if (typeof data === 'object') {
      const entries = Object.entries(data as Record<string, unknown>);
      
      return (
        <div className="w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="json-object-badge px-2 py-0.5 rounded text-xs font-medium">
                Object {`{${entries.length}}`}
              </span>
            </button>
          </div>
          
          {isExpanded && (
            <div className="mt-2 ml-4 pl-4 border-l-2 border-border/50 space-y-2">
              {entries.length === 0 ? (
                <div className="text-muted-foreground text-sm italic py-2">Empty object</div>
              ) : (
                entries.map(([key, value]) => (
                  <div key={key} className="editor-card p-3 animate-fade-in">
                    <JsonEditor
                      data={value}
                      onChange={(newValue) => {
                        onChange({ ...(data as object), [key]: newValue });
                      }}
                      keyName={key}
                      depth={depth + 1}
                      onDelete={() => {
                        const newObj = { ...(data as Record<string, unknown>) };
                        delete newObj[key];
                        onChange(newObj);
                      }}
                    />
                  </div>
                ))
              )}
              
              {/* Add new key */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="New key name..."
                  className="w-32 h-7 text-xs font-mono bg-input"
                />
                {['string', 'number', 'boolean', 'object', 'array', 'null'].map((type) => (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() => addToObject(data as Record<string, unknown>, newKey, type)}
                    disabled={!newKey.trim()}
                    className="h-6 px-2 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <span className="text-destructive text-sm">Unknown type</span>;
  };

  const getTypeIcon = () => {
    if (data === null) return <CircleSlash className="w-3.5 h-3.5 text-muted-foreground" />;
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
        <div className="flex items-center gap-2 min-w-[140px] shrink-0">
          {getTypeIcon()}
          <span className="json-key text-sm font-medium truncate">{keyName}</span>
          {onDelete && !isRoot && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}
      {!keyName && isRoot && (
        <div className="flex items-center gap-2 mb-2 text-muted-foreground">
          {getTypeIcon()}
          <span className="text-sm">Root ({getTypeLabel(data)})</span>
        </div>
      )}
      {renderValue()}
    </div>
  );
};
