
import api from '../api.js';
import axios from 'axios';
import { toast } from 'react-toastify';

export const uploadService = {
    /**
     * Step 1: Get the pre-signed upload URL from backend
     */
    getUploadUrl: async (file, uniqueName) => {
        try {
            console.log('🌐 Fetching pre-signed URL for:', uniqueName);
            console.log('📄 File type:', file.type);

            // Call backend to get pre-signed URL
            const response = await api.get('/get-aws-path/', {
                params: {
                    file_name: uniqueName,
                    content_type: file.type || 'application/octet-stream'
                }
            });

            console.log('🔗 Received response:', response.data);

            // Extract the URL
            const uploadUrl = response.data.url ||
                response.data.upload_url ||
                response.data.presigned_url ||
                response.data.aws_url ||
                (typeof response.data === 'string' ? response.data : null);

            if (!uploadUrl) {
                throw new Error('No upload URL received from server');
            }

            return {
                url: uploadUrl,
                key: response.data.key || uniqueName,
                contentType: file.type || 'application/octet-stream',
                generatedName: uniqueName
            };
        } catch (error) {
            console.error('❌ Error fetching pre-signed URL:', error);
            const message = error.response?.data?.message || "Failed to generate upload URL";
            toast.error(message);
            throw error;
        }
    },

    /**
     * Step 2: Upload file to R2 using PUT with BINARY body
     * This sends the raw file data directly in the request body
     */
    uploadToS3: async (file, uploadUrl, contentType, onProgress = null) => {
        try {
            console.log('☁️ Uploading BINARY data to R2...');
            console.log('📁 File:', file.name, 'Size:', file.size, 'bytes');
            console.log('📄 Content-Type:', contentType);
            console.log('🔗 URL:', uploadUrl.substring(0, 100) + '...');

            // PUT request with file as binary body
            // axios automatically sends the File object as binary data
            const response = await axios.put(
                uploadUrl,  // Pre-signed URL
                file,       // Raw file object - sent as BINARY in request body
                {
                    headers: {
                        'Content-Type': contentType,  // Must match pre-signed URL
                    },
                    onUploadProgress: (progressEvent) => {
                        const { loaded, total } = progressEvent;
                        const percentCompleted = Math.round((loaded * 100) / total);

                        console.log(`📈 Upload progress: ${percentCompleted}% (${loaded}/${total} bytes)`);

                        if (onProgress) {
                            onProgress(loaded, total, percentCompleted);
                        }
                    },
                }
            );

            console.log('✅ Upload completed with status:', response.status);
            return response;

        } catch (error) {
            console.error('❌ Error uploading to R2:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
                code: error.code
            });

            // Provide helpful error messages
            let message = "Failed to upload file";

            if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
                message = "CORS error: R2 bucket needs CORS configuration for http://localhost:5173";
            } else if (error.response?.status === 403) {
                message = "Access denied: Pre-signed URL expired or Content-Type mismatch";
            } else if (error.response?.status === 400) {
                message = "Bad request: Content-Type doesn't match pre-signed URL";
            } else if (error.response?.status === 405) {
                message = "Method not allowed: Endpoint expects PUT method";
            }

            toast.error(message);
            throw error;
        }
    },

    /**
     * Step 3: Complete upload process (get URL + upload binary)
     */
    processFullUpload: async (file, uniqueName, onProgress = null) => {
        try {
            console.log('📤 Starting full upload process...');
            console.log('📁 Original file:', file.name);
            console.log('📝 Unique name:', uniqueName);

            // 1. Get the pre-signed URL
            const urlData = await uploadService.getUploadUrl(file, uniqueName);

            // 2. Upload file as BINARY using PUT
            await uploadService.uploadToS3(file, urlData.url, urlData.contentType, onProgress);

            // 3. Construct the final public URL (remove query params)
            const publicUrl = urlData.url.split('?')[0];

            console.log('✅ Upload complete! Public URL:', publicUrl);

            return {
                url: publicUrl,
                key: urlData.key,
                filename: uniqueName
            };
        } catch (error) {
            console.error('❌ Full upload process failed:', error);
            throw error;
        }
    },

    /**
     * Upload multiple files sequentially
     */
    uploadMultipleFiles: async (files, folderPrefix = '', onProgressPerFile = null) => {
        if (!files || !files.length) {
            throw new Error("No files provided");
        }

        console.log(`📤 Uploading ${files.length} files...`);
        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`📸 Uploading file ${i + 1}/${files.length}: ${file.name}`);

            // Generate unique name for each file
            const timestamp = Date.now();
            const cleanName = file.name
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9._-]/g, '');

            const uniqueName = folderPrefix
                ? `${folderPrefix}_${timestamp}_${cleanName}`
                : `${timestamp}_${cleanName}`;

            // Upload the file
            const result = await uploadService.processFullUpload(file, uniqueName);
            results.push(result);

            // Notify progress
            if (onProgressPerFile) {
                onProgressPerFile(i + 1, files.length);
            }
        }

        console.log('✅ All files uploaded:', results);
        return results;
    }
};

