import { useState, useCallback } from 'react';
import { Upload, FileJson, Download, RotateCcw, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
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

  const renderValue = (key: string, value: unknown) => {
    if (typeof value === 'boolean') {
      return (
        <button
          onClick={() => updateValue(key, !value)}
          className={`discord-toggle flex-shrink-0 ${value ? 'active' : ''}`}
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
          className="discord-input w-20 text-center flex-shrink-0"
        />
      );
    }

    if (typeof value === 'string') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => updateValue(key, e.target.value)}
          className="discord-input w-32 sm:w-40 flex-shrink-0"
        />
      );
    }

    if (Array.isArray(value)) {
      return (
        <span className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded flex-shrink-0">
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

  // Upload screen
  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <FileJson className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-sm sm:text-base truncate">BB Config Editor</span>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="max-w-lg w-full">
            {/* Icon */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-primary rounded-2xl flex items-center justify-center">
              <FileJson className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground" />
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center mb-2">
              Better Bedrock Config
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 sm:mb-8 px-2">
              Upload your global_variables.json to get started
            </p>

            {/* Upload Zone */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-6 sm:p-10 transition-all cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/10' 
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
              
              <Upload className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 sm:mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              
              <p className="font-medium text-foreground text-center text-sm sm:text-base mb-1">
                {isDragging ? 'Drop your file here' : 'Click to upload'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                or drag and drop your JSON file
              </p>
            </div>

            {error && (
              <div className="mt-4 p-3 sm:p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <p className="text-destructive text-xs sm:text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const allKeys = Array.from(sections.values()).flat();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
              <FileJson className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground text-xs sm:text-sm truncate">BB Config</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{fileName}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Search - hidden on very small screens */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="discord-input pl-9 pr-8 w-40 lg:w-56"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button onClick={handleNewFile} className="discord-btn-outline text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
              New
            </button>
            <button onClick={handleReset} className="discord-btn-secondary p-1.5 sm:p-2">
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button onClick={handleExport} className="discord-btn flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Export</span>
            </button>
          </div>
        </div>
        
        {/* Mobile search bar */}
        <div className="sm:hidden px-3 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="discord-input pl-9 pr-8 w-full"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="space-y-2 sm:space-y-3">
          {Array.from(sections.entries()).map(([sectionName, keys]) => {
            const filteredKeys = filterSettings(keys);
            if (filteredKeys.length === 0) return null;
            
            const isExpanded = expandedSections.has(sectionName);
            
            return (
              <div key={sectionName} className="discord-card animate-fade-in p-3 sm:p-4">
                <button
                  onClick={() => toggleSection(sectionName)}
                  className="w-full flex items-center gap-2 text-left group"
                >
                  <div className="w-5 h-5 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  <span className="flex-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {sectionName}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                    {filteredKeys.length}
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="mt-2 sm:mt-3 space-y-0.5 sm:space-y-1">
                    {filteredKeys.map((key) => {
                      const value = data[key];
                      if (value === undefined) return null;
                      
                      const isChild = isChildSetting(key, allKeys);
                      
                      return (
                        <div key={key} className="discord-setting-row py-2 sm:py-4 px-2 sm:px-3">
                          <span className={`text-xs sm:text-sm truncate min-w-0 mr-2 ${isChild ? 'text-muted-foreground pl-2 sm:pl-4' : 'text-foreground'}`}>
                            {formatKeyName(key)}
                          </span>
                          {renderValue(key, value)}
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
