import { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Video, X, FileVideo } from 'lucide-react';
import { fileUrl } from '../../services/api';

/**
 * Reusable upload dropzone — supports click-to-pick AND drag-and-drop.
 *
 * Props:
 *   accept         — MIME pattern, default 'image/*'
 *   multiple       — allow multiple files (default false)
 *   value          — current File / File[] selection (controlled)
 *   onChange       — (file | files[]) => void
 *   existingUrl    — string URL (single) of already-saved media to preview
 *   existingUrls   — array of URLs (multiple)
 *   placeholder    — main label text
 *   subLabel       — secondary text
 *   className      — extra classes for outer wrapper
 *   onClearExisting — optional callback when user clicks "X" on existing item
 */
export default function Dropzone({
  accept = 'image/*',
  multiple = false,
  value,
  onChange,
  existingUrl,
  existingUrls = [],
  placeholder,
  subLabel,
  className = '',
  onClearExisting,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const isVideoMode = accept.includes('video');

  const handleFiles = (fileList) => {
    if (!fileList?.length) return;
    if (multiple) {
      onChange?.(Array.from(fileList));
    } else {
      onChange?.(fileList[0]);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer?.files);
  };

  const selectedFiles = multiple
    ? Array.isArray(value) ? value : []
    : value ? [value] : [];

  const hasSelection = selectedFiles.length > 0;
  const hasExisting = existingUrl || existingUrls.length > 0;

  const Icon = isVideoMode ? FileVideo : UploadCloud;

  const removeOne = (idx) => {
    if (multiple) {
      const next = selectedFiles.filter((_, i) => i !== idx);
      onChange?.(next);
    } else {
      onChange?.(null);
    }
  };

  return (
    <div className={className}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition flex flex-col items-center justify-center text-center min-h-[140px] ${
          dragOver
            ? 'border-brand bg-brand/5 ring-4 ring-brand/20 scale-[1.01]'
            : 'border-slate-300 hover:border-brand hover:bg-surface-alt/50'
        }`}
        role="button"
        tabIndex={0}
      >
        <Icon
          size={dragOver ? 36 : 30}
          className={`mb-2 transition ${dragOver ? 'text-brand' : 'text-ink-muted'}`}
        />
        <div className={`text-sm font-medium ${dragOver ? 'text-brand' : 'text-ink'}`}>
          {dragOver
            ? 'Drop to upload'
            : (hasSelection
                ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                : (placeholder || (multiple ? 'Drag & drop files, or click to browse' : 'Drag & drop a file, or click to browse')))}
        </div>
        {(subLabel || !hasSelection) && (
          <p className="text-xs text-ink-muted mt-1">
            {subLabel || (isVideoMode ? 'Videos: MP4, WebM, MOV (max 50MB)' : 'Images: JPG, PNG, WebP, GIF, SVG')}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Selected file previews */}
      {hasSelection && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
          {selectedFiles.map((f, i) => {
            const url = URL.createObjectURL(f);
            const isVideo = f.type?.startsWith('video/');
            return (
              <div key={i} className="relative group rounded-lg overflow-hidden border bg-slate-100 aspect-[4/3]">
                {isVideo ? (
                  <video src={url} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={url} className="w-full h-full object-cover" alt={f.name} />
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeOne(i); }}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 truncate">
                  {f.name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Existing already-uploaded preview (single) */}
      {!hasSelection && existingUrl && !multiple && (
        <div className="mt-3 relative inline-block group">
          <img src={fileUrl(existingUrl)} className="w-32 h-24 rounded-lg border object-cover" alt="" />
          {onClearExisting && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClearExisting(); }}
              className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
              title="Remove"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Existing multiple */}
      {!hasSelection && existingUrls.length > 0 && multiple && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
          {existingUrls.map((u, i) => (
            <div key={i} className="rounded-lg overflow-hidden border bg-slate-100 aspect-[4/3]">
              <img src={fileUrl(u)} className="w-full h-full object-cover" alt="" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
