import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import { documentService } from "../services/services";

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentService.getAll();
      setDocuments(response.data.documents);
    } catch (err) {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const allowedTypes = ["application/pdf", "text/plain"];

    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF and TXT files are allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      await documentService.upload(file, "other");
      setSuccess("Document uploaded successfully");
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await documentService.delete(id);
      setDocuments(documents.filter((doc) => doc.id !== id));
      setSuccess("Document deleted");
    } catch (err) {
      setError("Failed to delete document");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-secondary-800">My Documents</h1>
        <p className="text-secondary-600">
          Add your bank statements, salary slips, or investment reports -
          FinGinie will use them to give you better personalized advice
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} />
            <span className="text-sm">{success}</span>
          </div>
          <button onClick={() => setSuccess("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Upload area */}
      <div
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? "border-primary-500 bg-primary-50"
            : "border-secondary-300 hover:border-secondary-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 size={40} className="text-primary-500 animate-spin" />
          ) : (
            <Upload size={40} className="text-secondary-400" />
          )}
          <div>
            <p className="text-secondary-700 font-medium">
              {uploading
                ? "Uploading your document..."
                : "Drop your file here or click to browse"}
            </p>
            <p className="text-sm text-secondary-500 mt-1">
              Supports PDF and TXT files (max 10MB)
            </p>
          </div>
          {!uploading && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
            >
              Choose File
            </button>
          )}
        </div>
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-xl border border-secondary-200">
        <div className="px-4 py-3 border-b border-secondary-200">
          <h2 className="font-semibold text-secondary-800">Your Documents</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2
              size={24}
              className="animate-spin text-secondary-400 mx-auto"
            />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-secondary-500">
            <FileText size={40} className="mx-auto mb-2 text-secondary-300" />
            <p className="font-medium">No documents yet</p>
            <p className="text-sm mt-1">
              Upload your first document to get personalized financial advice
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-secondary-200">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-secondary-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-secondary-100 rounded-lg">
                    <FileText size={20} className="text-secondary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-secondary-800 truncate">
                      {doc.filename}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-secondary-500">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>-</span>
                      <span>{formatDate(doc.createdAt)}</span>
                      {doc.isProcessed ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={14} />
                          Processed
                        </span>
                      ) : doc.processingError ? (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle size={14} />
                          Error
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Loader2 size={14} className="animate-spin" />
                          Processing
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DocumentsPage;
