import { useState, useCallback } from 'react';
import { Download, RotateCcw, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonUploader } from './JsonUploader';
import { JsonEditor } from './JsonEditor';

export const JsonVisualizer = () => {
  const [jsonData, setJsonData] = useState<unknown>(null);
  const [fileName, setFileName] = useState<string>('');
  const [originalData, setOriginalData] = useState<unknown>(null);

  const handleJsonLoad = useCallback((data: unknown, name: string) => {
    setJsonData(data);
    setOriginalData(data);
    setFileName(name);
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace('.json', '_edited.json');
    a.click();
    URL.revokeObjectURL(url);
  }, [jsonData, fileName]);

  const handleReset = useCallback(() => {
    setJsonData(originalData);
  }, [originalData]);

  const handleNewFile = useCallback(() => {
    setJsonData(null);
    setFileName('');
    setOriginalData(null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileJson className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">JSON Visualizer</h1>
              {fileName && (
                <p className="text-sm text-muted-foreground font-mono">{fileName}</p>
              )}
            </div>
          </div>
          
          {jsonData && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewFile}
                className="gap-2"
              >
                <FileJson className="w-4 h-4" />
                New File
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleExport}
                className="gap-2 glow-button"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!jsonData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <JsonUploader onJsonLoad={handleJsonLoad} />
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
              {[
                { icon: '🔄', title: 'Toggle Switches', desc: 'Easily toggle boolean values' },
                { icon: '🔢', title: 'Number Inputs', desc: 'Edit numbers with precision' },
                { icon: '📤', title: 'Export Ready', desc: 'Download your edited JSON' },
              ].map((feature) => (
                <div key={feature.title} className="editor-card p-4 text-center">
                  <span className="text-2xl mb-2 block">{feature.icon}</span>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="editor-card p-6">
              <JsonEditor
                data={jsonData}
                onChange={setJsonData}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
