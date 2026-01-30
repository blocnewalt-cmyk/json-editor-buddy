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
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-[#1a1a1a] border-b-2 border-[#333] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2d2d2d] border-2 border-[#444] flex items-center justify-center">
              <span className="font-pixel text-[8px] text-primary">BB</span>
            </div>
            <span className="font-pixel text-sm text-foreground tracking-wider">BETTER BEDROCK</span>
          </div>
          <nav className="flex items-center gap-8">
            <span className="font-pixel text-xs text-foreground hover:text-primary cursor-pointer transition-colors">Home</span>
            <span className="font-pixel text-xs text-foreground hover:text-primary cursor-pointer transition-colors">Downloads</span>
            <span className="font-pixel text-xs text-foreground hover:text-primary cursor-pointer transition-colors">Information</span>
            <span className="font-pixel text-xs text-foreground hover:text-primary cursor-pointer transition-colors">Login</span>
          </nav>
        </header>

        {/* Hero Section with Background */}
        <div 
          className="flex-1 flex flex-col items-center justify-center relative bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('/minecraft-forest-bg.jpg')`,
            backgroundColor: '#4a6a7a'
          }}
        >
          {/* Main Content */}
          <div className="text-center z-10 px-4">
            {/* Title with brackets */}
            <h1 className="font-pixel text-3xl md:text-5xl text-foreground mb-6 tracking-wide">
              <span className="text-primary">⌠</span>BETTER BEDROCK<span className="text-primary">⌡</span>
            </h1>
            
            {/* Subtitle */}
            <p className="font-pixel text-xs md:text-sm text-foreground/90 max-w-2xl mx-auto mb-2 leading-relaxed">
              Config Editor - Edit your global_variables.json
            </p>
            <p className="font-pixel text-[10px] md:text-xs text-foreground/70 max-w-xl mx-auto mb-10">
              with an easy-to-use visual interface
            </p>

            {/* Buttons */}
            <div 
              className="flex justify-center cursor-pointer"
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
              <button className={`font-pixel text-sm px-12 py-4 transition-all ${isDragging ? 'brightness-125' : ''}`}
                style={{
                  background: 'linear-gradient(180deg, #5a8f3e 0%, #3d6b29 100%)',
                  border: '3px solid',
                  borderColor: '#7ab356 #2d4f1a #2d4f1a #7ab356',
                  color: '#fff',
                  textShadow: '2px 2px 0 rgba(0,0,0,0.5)'
                }}
              >
                {isDragging ? 'Drop File Here' : 'Upload Config'}
              </button>
              <button className="font-pixel text-sm px-12 py-4 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, #a0a0a0 0%, #707070 100%)',
                  border: '3px solid',
                  borderColor: '#c0c0c0 #505050 #505050 #c0c0c0',
                  color: '#333',
                  textShadow: '1px 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                Drop JSON Here
              </button>
            </div>
          </div>

          {error && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 mc-card max-w-xl w-full mx-4">
              <p className="text-destructive font-retro text-lg text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="bg-[#1a1a1a]/95 py-8 text-center border-t-2 border-[#333]">
          <h2 className="font-pixel text-lg text-foreground mb-3">EDIT YOUR CONFIG</h2>
          <p className="font-pixel text-xs text-foreground/70 max-w-xl mx-auto px-4">
            Toggle mods on/off, adjust values, and export your updated configuration file
          </p>
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
