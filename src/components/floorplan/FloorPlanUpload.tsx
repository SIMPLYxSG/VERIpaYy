import { useCallback, useRef, useState } from "react";

interface FloorPlanUploadProps {
  onUpload: (file: File) => void;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"];

export function FloorPlanUpload({ onUpload }: FloorPlanUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please upload a PNG, JPG, WEBP, SVG, or PDF floor plan.");
        return;
      }
      setError(null);
      onUpload(file);
    },
    [onUpload]
  );

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFile(event.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
        isDragging ? "border-primary bg-sage/20" : "border-line bg-surface"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <p className="font-display text-lg text-ink">Drop your floor plan here</p>
      <p className="text-sm text-muted">or click to browse — PNG, JPG, WEBP, SVG, or PDF</p>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
