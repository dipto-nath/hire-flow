import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './index';
import { api } from '@/lib/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId?: string;
  onUploadComplete: () => void;
}

export function UploadModal({ isOpen, onClose, jobId: initialJobId, onUploadComplete }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || '');

  useEffect(() => {
    if (isOpen && !initialJobId) {
      api.jobs.list().then(res => setJobs(res.jobs || [])).catch(console.error);
    }
  }, [isOpen, initialJobId]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    const targetJobId = initialJobId || selectedJobId;
    if (!file || !targetJobId) {
      setError('Please select a job role first.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Create a placeholder candidate
      const candidateData = {
        jobId: targetJobId,
        name: file.name.split('.')[0] || 'Processing Resume...',
        email: 'pending@hireflow.ai',
      };
      const candidateRes = await api.candidates.create(candidateData);
      
      if (!candidateRes || !candidateRes.id) {
        throw new Error('Failed to initialize candidate record.');
      }

      // 2. Upload the document to trigger AI processing
      await api.upload.document(file, candidateRes.id, 'resume');

      // 3. Complete
      onUploadComplete();
      onClose();
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 24
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--border-default)'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Upload Candidate Resume
          </h2>
          <button 
            onClick={onClose}
            disabled={uploading}
            style={{
              background: 'transparent', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted)', padding: 4, display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-strong)'}`,
                borderRadius: 12,
                padding: '48px 24px',
                textAlign: 'center',
                backgroundColor: isDragging ? 'var(--bg-muted)' : 'var(--bg-base)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Upload size={32} color={isDragging ? 'var(--accent)' : 'var(--text-faint)'} style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
                Click or drag file to this area to upload
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Supports PDF or DOCX (Max 10MB)
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: 16, border: '1px solid var(--border-default)',
              borderRadius: 10, background: 'var(--bg-base)'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                background: 'var(--accent-light)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <FileText size={20} color="var(--accent)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={() => setFile(null)}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 4
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {!initialJobId && file && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6 }}>
                Select Target Job Role
              </label>
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                disabled={uploading}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--border-default)', background: 'var(--bg-surface)',
                  color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
                }}
              >
                <option value="" disabled>-- Select a Job --</option>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div style={{
              marginTop: 16, padding: 12, borderRadius: 8,
              background: 'var(--status-danger-bg)', color: 'var(--status-danger)',
              fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 size={16} style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                'Upload & Process'
              )}
            </Button>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
