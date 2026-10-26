import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function FileUploader({ onFileSelect, acceptedTypes = '.pdf,.txt,.md,.docx', maxSizeMb = 25 }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    setError(null);
    if (!file) return false;

    // Check size
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File exceeds maximum size of ${maxSizeMb}MB.`);
      return false;
    }

    // Check extension
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowed = acceptedTypes.split(',').map((t) => t.trim().toLowerCase());
    if (!allowed.includes(ext)) {
      setError(`Unsupported file type. Please upload ${acceptedTypes}`);
      return false;
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect?.(file);
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect?.(file);
      }
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileSelect?.(null);
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-[#22D3EE] bg-[#22D3EE]/5 shadow-lg shadow-[#22D3EE]/10'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-white/10 hover:border-[#7959F5]/50 bg-[#151C30]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes}
          onChange={handleChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#11182A] border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-[#9CA8C5]">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="p-1.5 rounded-lg text-[#9CA8C5] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7959F5]/20 to-[#22D3EE]/20 flex items-center justify-center text-[#22D3EE] mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              Drag & drop document here, or <span className="text-[#22D3EE] underline">browse</span>
            </p>
            <p className="text-xs text-[#9CA8C5] mt-1">
              Supports PDF, TXT, MD, DOCX up to {maxSizeMb}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
