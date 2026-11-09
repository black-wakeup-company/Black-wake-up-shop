import React, { useRef, useState } from 'react';
import { processLocalImageFile } from '../../utils/imageUtils';
import { Upload, Trash2, Image as ImageIcon, Camera, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  currentImage?: string;
  onImageSelected: (base64Url: string) => void;
  onImageRemoved: () => void;
  label?: string;
  shape?: 'square' | 'banner' | 'logo';
  maxDimension?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageSelected,
  onImageRemoved,
  label = 'Photo / Image',
  shape = 'square',
  maxDimension = 640
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const optimizedDataUrl = await processLocalImageFile(file, maxDimension);
      onImageSelected(optimizedDataUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de charger cette image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">
        {label}
      </label>

      {/* Hidden file input supporting mobile gallery and camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {currentImage ? (
        /* Preview with Replace / Remove controls */
        <div className="relative group rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center p-2">
          <div
            className={`relative overflow-hidden rounded-lg bg-white border border-slate-200 ${
              shape === 'logo'
                ? 'w-24 h-24 object-contain'
                : 'w-full aspect-4/3 max-h-48'
            }`}
          >
            <img
              src={currentImage}
              alt="Aperçu"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action overlay / buttons */}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Remplacer</span>
            </button>
            <button
              type="button"
              onClick={onImageRemoved}
              className="px-3 py-1.5 text-xs font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>
          </div>

          {/* Mobile persistent button strip */}
          <div className="sm:hidden absolute bottom-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white/95 text-slate-800 rounded-md shadow-xs border border-slate-200"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={onImageRemoved}
              className="px-2 py-1 text-[11px] font-semibold bg-rose-50 text-rose-700 rounded-md shadow-xs border border-rose-200"
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        /* Empty Dropzone / Tap to browse device */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            dragActive
              ? 'border-slate-900 bg-slate-100'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-50'
          }`}
        >
          {isProcessing ? (
            <div className="py-3 flex flex-col items-center gap-2 text-slate-600">
              <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
              <span className="text-xs">Optimisation de l'image...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Choisir une photo depuis mon appareil
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Galerie photo mobile, appareil photo ou explorateur de fichiers PC
                </p>
              </div>
              <span className="inline-block mt-1 px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-medium shadow-2xs">
                Parcourir les fichiers
              </span>
            </>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
      )}
    </div>
  );
};
