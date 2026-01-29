import { useState, useCallback } from 'react';
import { Upload, FileJson } from 'lucide-react';

interface JsonUploaderProps {
  onJsonLoad: (data: unknown, fileName: string) => void;
}

export const JsonUploader = ({ onJsonLoad }: JsonUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        onJsonLoad(json, file.name);
      } catch {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }, [onJsonLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div
        className={`upload-zone cursor-pointer ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".json"
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-glow">
            {isDragging ? (
              <Upload className="w-10 h-10 text-primary" />
            ) : (
              <FileJson className="w-10 h-10 text-primary" />
            )}
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {isDragging ? 'Drop your JSON file' : 'Upload JSON File'}
            </h3>
            <p className="text-muted-foreground">
              Drag and drop or click to browse
            </p>
          </div>
          
          {error && (
            <p className="text-destructive text-sm font-medium">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
