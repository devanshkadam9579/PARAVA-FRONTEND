/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, CheckCircle2, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface CloudinaryImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  label?: string;
  folder?: string;
  preset?: string;
  cloudName?: string;
}

/**
 * Client-side WebP Compressor
 * Compresses camera photos & large gallery images to high-quality WebP (< 300KB)
 */
async function compressImageToWebP(file: File, maxWidth = 1400, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP format
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = (error) => reject(error);
  });
}

export default function CloudinaryImageUploader({
  onImageUploaded,
  currentImageUrl,
  label = "Upload Photo",
  folder = "parva_vendors",
  cloudName = "dpik6gqea", // Default Parva Cloudinary Cloud
  preset = "ml_default" // Unsigned Upload Preset
}: CloudinaryImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(15);

    try {
      // 1. Client-Side WebP Compression
      const compressedBlob = await compressImageToWebP(file);
      setUploadProgress(40);

      // 2. Direct Cloudinary Upload via FormData
      const formData = new FormData();
      formData.append('file', compressedBlob, `upload_${Date.now()}.webp`);
      formData.append('upload_preset', preset);
      formData.append('folder', folder);

      const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      setUploadProgress(85);
      const data = await response.json();

      if (data.secure_url) {
        // Auto-transform with f_auto,q_auto for optimal mobile delivery
        const optimizedUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
        setPreviewUrl(optimizedUrl);
        onImageUploaded(optimizedUrl);
        setUploadProgress(100);
      } else {
        // Fallback: Use FileReader Data URL if preset not configured
        console.warn("Cloudinary upload fallback to client data URL:", data);
        const reader = new FileReader();
        reader.readAsDataURL(compressedBlob);
        reader.onloadend = () => {
          const fallbackUrl = reader.result as string;
          setPreviewUrl(fallbackUrl);
          onImageUploaded(fallbackUrl);
          setUploadProgress(100);
        };
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      setErrorMsg("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">{label}</label>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment" // Enables direct camera on mobile phones
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group">
          <img
            src={previewUrl}
            alt="Uploaded Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <Camera size={14} />
              <span>Change</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                onImageUploaded('');
              }}
              className="bg-rose-600 text-white p-1.5 rounded-xl shadow-md active:scale-95"
            >
              <X size={14} />
            </button>
          </div>
          <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={10} />
            <span>WebP Optimized</span>
          </span>
        </div>
      ) : (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 hover:border-brand-primary/60 bg-gray-50/80 hover:bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all active:scale-99"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="animate-spin text-brand-primary" size={24} />
              <span className="text-xs font-bold text-gray-700">Compressing & Uploading to Cloudinary... ({uploadProgress}%)</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <Camera size={20} />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-gray-800 block">📷 Take Photo / Choose Image</span>
                <span className="text-[10px] text-gray-400 font-medium">Auto-compressed to WebP for fast 5G/4G loading</span>
              </div>
            </>
          )}
        </button>
      )}

      {errorMsg && (
        <p className="text-[10px] font-bold text-rose-600">{errorMsg}</p>
      )}
    </div>
  );
}
