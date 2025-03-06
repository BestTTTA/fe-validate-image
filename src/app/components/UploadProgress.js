export default function UploadProgress({ uploadResults }) {
    if (!uploadResults) return null;
  
    return (
      <div className="space-y-4">
        {/* Status Message */}
        {uploadResults.message && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700">{uploadResults.message}</p>
          </div>
        )}
  
        <div className="bg-white rounded-lg shadow">
          {/* Summary Header */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">
              Upload Summary ({uploadResults.total_processed} files)
            </h3>
          </div>
  
          {/* Successful Uploads */}
          {uploadResults.successful_uploads?.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-3">
                Successful Uploads ({uploadResults.successful_uploads.length})
              </h4>
              <div className="space-y-3">
                {uploadResults.successful_uploads.map((upload, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-green-50 border border-green-100 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-700">
                          {upload.filename}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Status: {upload.status}
                        </p>
                        <p className="text-xs text-green-500 mt-1">
                          Path: {upload.minio_path}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600">
                          Task ID: {upload.task_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
  
          {/* Failed Uploads */}
          {uploadResults.failed_uploads?.length > 0 && (
            <div className="p-4 border-t">
              <h4 className="text-sm font-medium text-gray-500 mb-3">
                Failed Uploads ({uploadResults.failed_uploads.length})
              </h4>
              <div className="space-y-3">
                {uploadResults.failed_uploads.map((upload, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-red-50 border border-red-100 rounded-lg"
                  >
                    <p className="font-medium text-red-700">
                      {upload.filename}
                    </p>
                    {upload.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {upload.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }