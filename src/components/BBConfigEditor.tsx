import { useState, useCallback } from 'react';
import { Upload, FileJson, Download, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { parseJsonWithComments, serializeWithComments, formatKeyName, isChildSetting } from '@/lib/jsonParser';

interface ConfigData {
  [key: string]: unknown;
}

export const BBConfigEditor = () => {
  const [data, setData] = useState<ConfigData | null>(null);
  const [sections, setSections] = useState<Map<string, string[]>>(new Map());
  const [originalData, setOriginalData] = useState<ConfigData | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { data: parsed, sections: parsedSections } = parseJsonWithComments(text);
        setData(parsed as ConfigData);
        setOriginalData(JSON.parse(JSON.stringify(parsed)));
        setSections(parsedSections);
        setFileName(file.name);
        // Expand all sections by default
        setExpandedSections(new Set(parsedSections.keys()));
      } catch (err) {
        setError((err as Error).message);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleExport = useCallback(() => {
    if (!data) return;
    
    const output = serializeWithComments(data, sections);
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, sections, fileName]);

  const handleReset = useCallback(() => {
    if (originalData) {
      setData(JSON.parse(JSON.stringify(originalData)));
    }
  }, [originalData]);

  const handleNewFile = useCallback(() => {
    setData(null);
    setSections(new Map());
    setOriginalData(null);
    setFileName('');
    setError(null);
  }, []);

  const updateValue = useCallback((key: string, value: unknown) => {
    setData(prev => prev ? { ...prev, [key]: value } : null);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const renderValue = (key: string, value: unknown, isChild: boolean) => {
    if (typeof value === 'boolean') {
      return (
        <button
          onClick={() => updateValue(key, !value)}
          className={`mc-toggle ${value ? 'active' : ''}`}
          aria-label={value ? 'Enabled' : 'Disabled'}
        />
      );
    }

    if (typeof value === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => updateValue(key, parseFloat(e.target.value) || 0)}
          className="mc-input w-24 text-center"
        />
      );
    }

    if (typeof value === 'string') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => updateValue(key, e.target.value)}
          className="mc-input w-48"
        />
      );
    }

    if (Array.isArray(value)) {
      return (
        <span className="text-muted-foreground text-sm">
          Array [{value.length}]
        </span>
      );
    }

    return null;
  };

  const filterSettings = (keys: string[]): string[] => {
    if (!searchQuery) return keys;
    const query = searchQuery.toLowerCase();
    return keys.filter(key => formatKeyName(key).toLowerCase().includes(query));
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
              <span className="font-bold text-primary text-lg">BB</span>
            </div>
            <span className="font-medium text-foreground text-lg">Config Editor</span>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <FileJson className="w-10 h-10 text-primary" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Better Bedrock Config
            </h1>
            <p className="text-muted-foreground mb-8">
              Upload your global_variables.json to get started
            </p>

            {/* Upload Zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-card/50'
              }`}
              onClick={() => document.getElementById('file-input')?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
            >
              <input
                id="file-input"
                type="file"
                accept=".json"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              
              <Upload className={`w-8 h-8 mx-auto mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              
              <p className="font-medium text-foreground mb-1">
                {isDragging ? 'Drop your file here' : 'Click to upload'}
              </p>
              <p className="text-sm text-muted-foreground">
                or drag and drop your JSON file
              </p>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { icon: '⚡', label: 'Toggle' },
                { icon: '🔧', label: 'Edit' },
                { icon: '💾', label: 'Export' },
              ].map((f) => (
                <div key={f.label} className="text-center p-3 rounded-lg bg-card/50 border border-border/50">
                  <span className="text-xl block mb-1">{f.icon}</span>
                  <span className="text-xs text-muted-foreground">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allKeys = Array.from(sections.values()).flat();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 mc-panel">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="font-pixel text-xs md:text-sm text-primary text-shadow-mc">
              ⌠BETTER BEDROCK⌡
            </h1>
            <span className="font-retro text-lg text-muted-foreground">
              {fileName}
            </span>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mc-input w-48 text-base"
            />
            <button onClick={handleNewFile} className="mc-button text-xs px-4 py-2">
              NEW
            </button>
            <button onClick={handleReset} className="mc-button text-xs px-4 py-2">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={handleExport} className="mc-button-primary text-xs px-4 py-2">
              <Download className="w-4 h-4 inline mr-2" />
              EXPORT
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {Array.from(sections.entries()).map(([sectionName, keys]) => {
            const filteredKeys = filterSettings(keys);
            if (filteredKeys.length === 0) return null;
            
            const isExpanded = expandedSections.has(sectionName);
            
            return (
              <div key={sectionName} className="mc-card animate-fade-in">
                <button
                  onClick={() => toggleSection(sectionName)}
                  className="w-full flex items-center gap-3 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-primary" />
                  )}
                  <span className="section-header flex-1 m-0">
                    {sectionName}
                  </span>
                  <span className="font-retro text-sm text-muted-foreground">
                    {filteredKeys.length} settings
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="mt-4">
                    {filteredKeys.map((key) => {
                      const value = data[key];
                      if (value === undefined) return null;
                      
                      const isChild = isChildSetting(key, allKeys);
                      
                      return (
                        <div key={key} className="setting-row">
                          <span className={isChild ? 'setting-sublabel' : 'setting-label'}>
                            {formatKeyName(key)}
                          </span>
                          {renderValue(key, value, isChild)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
