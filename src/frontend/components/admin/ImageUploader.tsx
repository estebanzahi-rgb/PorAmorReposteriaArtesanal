'use client';
import { useRef, useState } from 'react';

interface Props {
  onUpload: (url: string) => void;
}

export function ImageUploader({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const sigRes = await fetch('/api/admin/upload-image', { method: 'POST' });
      if (!sigRes.ok) throw new Error('No se pudo obtener la firma');
      const { signature, timestamp, api_key, folder, upload_url } = await sigRes.json();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', String(timestamp));
      formData.append('api_key', api_key);
      formData.append('folder', folder);

      const uploadRes = await fetch(upload_url, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Error al subir la imagen');
      const { secure_url } = await uploadRes.json();
      onUpload(secure_url);
    } catch (err) {
      setError((err as Error).message ?? 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            <p className="text-sm text-muted-foreground">Subiendo...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Arrastra una imagen aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WebP — máx. 10 MB</p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
