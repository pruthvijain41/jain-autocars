import React, { useState } from 'react';

// REMOVED: The problematic import for 'cloudinary-core' as it's no longer needed.
// import { Cloudinary } from 'cloudinary-core';

// Your cloud name from your original code. We will use this directly.
const CLOUDINARY_CLOUD_NAME = 'dulmd0yzs';
// Your upload preset from your original code.
const CLOUDINARY_UPLOAD_PRESET = 'car_images_upload';


const ImageUpload = ({ onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

  const handleUpload = async () => {
    console.log('handleUpload called. Selected files:', selectedFiles);
    if (selectedFiles.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    setUploading(true);

    const uploadedUrls = [];
    const uploadPromises = selectedFiles.map(file => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      // UPDATED: Replaced the old cl.config().cloud_name with our constant.
      // This removes the need for the 'cloudinary-core' library entirely for this component.
      const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

      console.log('Cloudinary Cloud Name:', CLOUDINARY_CLOUD_NAME);
      console.log('Cloudinary Upload URL:', url);
      return fetch(url, {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(data => {
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        } else {
          console.error('Cloudinary upload failed:', data);
          // Handle upload errors more gracefully if needed
        }
      })
      .catch(error => {
        console.error('Error uploading to Cloudinary:', error);
      });
    });

    try {
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      setUploading(false);
      setSelectedFiles([]); // Clear selected files after upload

      // Notify the parent component of the new URLs
      if (onUploadSuccess) {
        onUploadSuccess(uploadedUrls);
      }
      alert('Images uploaded successfully!');
    } catch (error) {
      setUploading(false);
      alert('Error uploading images. Please try again.');
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        // Basic styling to make it look a little better
        style={{
          display: 'block',
          marginBottom: '10px',
        }}
      />
      {selectedFiles.length > 0 && (
        <div >
          <button onClick={() => { console.log('Upload button clicked!'); handleUpload(); }} disabled={uploading}>
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Image(s)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;