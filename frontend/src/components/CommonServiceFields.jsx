import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFile,
  FaTimes,
  FaCloudUploadAlt,
  FaLink,
  FaTrashAlt,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import "../styles/CommonServiceFields.css";

const MAX_FILE_SIZE_MB = 50;
const MAX_TOTAL_SIZE_MB = 100;
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-rar-compressed",
];

const FileIcon = ({ file }) => {
  const iconProps = { size: 20 };

  if (file.type.includes("pdf"))
    return <FaFilePdf {...iconProps} color="#ff4d4d" />;
  if (file.type.includes("image"))
    return <FaFileImage {...iconProps} color="#4d94ff" />;
  if (file.type.includes("word") || file.type.includes("msword"))
    return <FaFileWord {...iconProps} color="#3366cc" />;
  if (file.type.includes("excel") || file.type.includes("spreadsheet"))
    return <FaFileExcel {...iconProps} color="#33cc33" />;
  if (file.type.includes("zip") || file.type.includes("rar"))
    return <FaFileArchive {...iconProps} color="#ff9900" />;
  return <FaFile {...iconProps} color="#666" />;
};

const FilePreview = ({ file, onRemove }) => {
  const fileSize = useMemo(() => {
    const sizeInMB = file.size / (1024 * 1024);
    return sizeInMB < 1
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${sizeInMB.toFixed(1)} MB`;
  }, [file]);

  return (
    <div className="file-preview">
      <div className="file-info">
        <FileIcon file={file} />
        <span className="file-name" title={file.name}>
          {file.name.length > 25
            ? `${file.name.substring(0, 25)}...`
            : file.name}
        </span>
        <span className="file-size">{fileSize}</span>
      </div>
      <button
        type="button"
        className="file-remove-button"
        onClick={onRemove}
        aria-label="Remove file"
      >
        <FaTimes size={14} />
      </button>
    </div>
  );
};

const CommonServiceFields = ({
  formData,
  handleInputChange,
  handleFileChange,
}) => {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);

  const uploadType = formData.uploadType || "device";

  const totalSizeMB = useMemo(() => {
    return selectedFiles.reduce(
      (sum, file) => sum + file.size / (1024 * 1024),
      0
    );
  }, [selectedFiles]);

  const onFileChange = (e) => {
    const files = Array.from(e.target.files);
    setError(null);

    // Validate files
    const validationErrors = [];
    const validFiles = files.filter((file) => {
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        validationErrors.push(`"${file.name}": Unsupported file type`);
        return false;
      }

      // Check individual file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        validationErrors.push(
          `"${file.name}": Exceeds ${MAX_FILE_SIZE_MB}MB limit`
        );
        return false;
      }

      return true;
    });

    // Check total size
    const newTotalSize =
      totalSizeMB +
      validFiles.reduce((sum, file) => sum + file.size / (1024 * 1024), 0);

    if (newTotalSize > MAX_TOTAL_SIZE_MB) {
      validationErrors.push(`Total size exceeds ${MAX_TOTAL_SIZE_MB}MB limit`);
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join("\n"));
      return;
    }

    const updatedFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(updatedFiles);
    updateFileInput(updatedFiles);
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== indexToRemove);
    setSelectedFiles(updatedFiles);
    updateFileInput(updatedFiles);
  };

  const updateFileInput = (files) => {
    handleFileChange(files); // directly pass array of files to parent
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    updateFileInput([]);
  };

  return (
    <>
      <div className="form-group">
        <label className="form-label">
          {t("service_form.entrance_diagnosis", "Entrance diagnosis")} *
        </label>
        <textarea
          name="entranceDiagnosis"
          value={formData.entranceDiagnosis || ""}
          onChange={handleInputChange}
          className="form-textarea"
          placeholder={t(
            "service_form.entrance_diagnosis_placeholder",
            "Enter diagnosis"
          )}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          {t("service_form.brief_history", "A brief history of the disease")} *
        </label>
        <textarea
          name="briefHistory"
          value={formData.briefHistory || ""}
          onChange={handleInputChange}
          className="form-textarea"
          placeholder={t(
            "service_form.brief_history_placeholder",
            "Provide a brief history of the disease"
          )}
          required
        />
      </div>

      <div className="upload-section">
        {/* Upload Type Toggle */}
        <div className="form-group">
          <label className="form-label">
            {t("service_form.upload_type", "Document Upload Method")}
          </label>
          <div className="upload-toggle-group">
            <button
              type="button"
              className={`upload-toggle ${
                uploadType === "device" ? "active" : ""
              }`}
              onClick={() =>
                handleInputChange({
                  target: { name: "uploadType", value: "device" },
                })
              }
            >
              <div className="toggle-icon">
                <FaCloudUploadAlt />
              </div>
              <span>{t("service_form.upload_device", "Upload Files")}</span>
            </button>
            <button
              type="button"
              className={`upload-toggle ${
                uploadType === "cloud" ? "active" : ""
              }`}
              onClick={() =>
                handleInputChange({
                  target: { name: "uploadType", value: "cloud" },
                })
              }
            >
              <div className="toggle-icon">
                <FaLink />
              </div>
              <span>{t("service_form.upload_cloud", "Cloud Link")}</span>
            </button>
          </div>
        </div>

        {/* File Upload Area */}
        {uploadType === "device" && (
          <div className="form-group">
            <label className="form-label">
              {t("service_form.documents_download", "Upload Medical Documents")}
            </label>

            <div className="upload-card">
              {/* Drag and Drop Zone */}
              <div
                className={`drop-zone ${
                  selectedFiles.length > 0 ? "has-files" : ""
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("drag-over");
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("drag-over");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("drag-over");
                  onFileChange({ target: { files: e.dataTransfer.files } });
                }}
              >
                <input
                  type="file"
                  id="documentsDownload"
                  name="documentsDownload"
                  onChange={onFileChange}
                  className="file-input"
                  multiple
                  accept={ALLOWED_FILE_TYPES.join(",")}
                />
                <div className="drop-content">
                  <div className="upload-icon"></div>
                  <div className="upload-text">
                    <h4>
                      {t(
                        "service_form.drag_and_drop",
                        "Drag & drop files here"
                      )}
                    </h4>
                    <p className="or-divider">or</p>
                    <label htmlFor="documentsDownload" className="browse-btn">
                      {t("service_form.browse_files", "Browse Files")}
                    </label>
                  </div>
                  <p className="file-restrictions">
                    {t(
                      "service_form.file_requirements",
                      `Supported formats: PDF, JPG, PNG, DOC, XLS, ZIP • Max ${MAX_FILE_SIZE_MB}MB per file • ${MAX_TOTAL_SIZE_MB}MB total`
                    )}
                  </p>
                </div>
              </div>

              {/* Error Messages */}
              {error && (
                <div className="upload-errors">
                  <div className="error-header">
                    <FaExclamationTriangle className="error-icon" />
                    <h5>Upload Issues</h5>
                  </div>
                  <div className="error-list">
                    {error.split("\n").map((line, i) => (
                      <p key={i} className="error-item">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* File Previews */}
              {selectedFiles.length > 0 && (
                <div className="file-previews">
                  <div className="preview-header">
                    <div className="file-stats">
                      <span className="file-count">
                        {selectedFiles.length}{" "}
                        {t("service_form.files_selected", "files")}
                      </span>
                      <div className="size-meter">
                        <div
                          className="meter-fill"
                          style={{
                            width: `${Math.min(
                              100,
                              (totalSizeMB / MAX_TOTAL_SIZE_MB) * 100
                            )}%`,
                          }}
                        ></div>
                        <span className="size-text">
                          {totalSizeMB.toFixed(1)}MB / {MAX_TOTAL_SIZE_MB}MB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="clear-all-btn"
                      onClick={clearAllFiles}
                    >
                      <FaTrashAlt size={14} />
                      {t("service_form.clear_all", "Clear All")}
                    </button>
                  </div>

                  <div className="file-list">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="file-item">
                        <div className="file-icon">
                          <FileIcon file={file} />
                        </div>
                        <div className="file-details">
                          <p className="file-name" title={file.name}>
                            {file.name.length > 24
                              ? `${file.name.substring(0, 22)}...`
                              : file.name}
                          </p>
                          <p className="file-size">
                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeFile(index)}
                          aria-label="Remove file"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cloud Link Input */}
        {uploadType === "cloud" && (
          <div className="form-group">
            <label className="form-label">
              {t("service_form.documents_stay", "Cloud Storage Link")}
            </label>
            <div className="cloud-input-group">
              <div className="input-icon">
                <FaLink />
              </div>
              <input
                type="url"
                name="cloudLink"
                value={formData.cloudLink || ""}
                onChange={handleInputChange}
                className="form-input"
                placeholder={t(
                  "service_form.documents_stay_placeholder",
                  "https://drive.google.com/..."
                )}
                pattern="https?://.+"
              />
            </div>
            <p className="cloud-hint">
              <FaInfoCircle className="hint-icon" />
              {t(
                "service_form.cloud_hint",
                "Supported: Google Drive, OneDrive, Dropbox, Yandex Disk"
              )}
            </p>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">
          {t("service_form.comment", "Additional Comments")}
        </label>
        <textarea
          name="comment"
          value={formData.comment || ""}
          onChange={handleInputChange}
          className="form-textarea"
          placeholder={t(
            "service_form.comment_placeholder",
            "Any other information we should know"
          )}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          {t("service_form.promo_code", "Promo Code (if any)")}
        </label>
        <input
          type="text"
          name="promoCode"
          value={formData.promoCode || ""}
          onChange={handleInputChange}
          className="form-input"
          placeholder={t(
            "service_form.promo_code_placeholder",
            "Enter discount code"
          )}
        />
      </div>
    </>
  );
};

export default CommonServiceFields;
