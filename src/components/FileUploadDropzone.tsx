import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { validatePdfFile, MAX_FILE_SIZE } from '@/lib/validations';
import { cn } from '@/lib/utils';

interface FileUploadDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
}

export function FileUploadDropzone({ file, onFileSelect, error, disabled }: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    const validation = validatePdfFile(selectedFile);
    if (!validation.valid) {
      setValidationError(validation.error || "Invalid file");
      onFileSelect(null);
      return;
    }
    setValidationError(null);
    onFileSelect(selectedFile);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [disabled, handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  const handleRemoveFile = useCallback(() => {
    onFileSelect(null);
    setValidationError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const displayError = validationError || error;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleInputChange}
        className="sr-only"
        id="resume-upload"
        disabled={disabled}
      />
      
      {!file ? (
        <label
          htmlFor="resume-upload"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center w-full min-h-[180px] px-6 py-8 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer",
            isDragging 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            displayError && "border-destructive/50 bg-destructive/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "p-4 rounded-full mb-4 transition-colors",
            isDragging ? "bg-primary/10" : "bg-muted"
          )}>
            <Upload className={cn(
              "w-8 h-8 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <p className="text-base font-medium text-foreground mb-1">
            {isDragging ? "Drop your resume here" : "Upload your resume"}
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            PDF only • Max {MAX_FILE_SIZE / 1024 / 1024}MB
          </p>
        </label>
      ) : (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} • PDF
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={disabled}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-2 text-destructive text-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}
