import React, { useState } from 'react';
import axios from 'axios';

const ExcelUpload = ({ onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadStatus('');
            setError('');
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            setError('No file selected.');
            return;
        }

        setUploading(true);
        setUploadStatus('Uploading...');
        setError('');

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post('/api/upload-excel', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                setUploadStatus('File uploaded successfully!');
                
                if (onUploadSuccess) {
                    onUploadSuccess();
                }

            } else {
                setError('An error occurred during file import.');
            }
        } catch (err) {
            console.error(err);
            if (err.response) {
                setError(err.response.data.error || 'An unexpected error occurred.');
            } else if (err.request) {
                setError('No response received from server.');
            } else {
                setError('Error setting up the request.');
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} accept=".xlsx, .xls" />
            <button onClick={handleFileUpload} disabled={uploading || !selectedFile}>
                {uploading ? 'Uploading...' : 'Upload Excel File'}
            </button>
            {uploadStatus && <p style={{ color: 'green' }}>{uploadStatus}</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
};

export default ExcelUpload;