import React, { useRef } from 'react';
import { Camera, UploadCloud } from 'lucide-react';

const ProfileImageUploader = ({
  title,
  subtitle,
  imageUrl,
  fallback,
  shape = 'rounded-2xl',
  onFileSelected,
  uploading,
}) => {
  const inputRef = useRef(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white text-3xl font-black text-blue-700 shadow-sm ${shape}`}>
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            fallback
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold uppercase tracking-wide text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-wait disabled:bg-slate-400"
          >
            {uploading ? <UploadCloud size={18} className="animate-pulse" /> : <Camera size={18} />}
            {uploading ? 'Subiendo...' : 'Subir imagen'}
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
          event.target.value = '';
        }}
      />
    </div>
  );
};

export default ProfileImageUploader;
