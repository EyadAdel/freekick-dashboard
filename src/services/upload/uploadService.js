import api from '../api.js';
import axios from 'axios';

import { toast } from 'react-toastify';

export const uploadService = {
    // Step 1: Get the Upload URL (AWS Path)
    getUploadUrl: async (file , uniqueName) => {
        try {

            // This calls your endpoint to get the AWS path/URL
            const response = await api.get('/get-aws-path/', {
                params: {
                    file_name: uniqueName,
                }
            });

            // Returns { url: "...", key: "...", ... }
            return {
                ...response.data,
                generatedName: uniqueName
            };
        } catch (error) {
            const message = error.response?.data?.message || "Failed to generate upload URL";
            toast.error(message);
            throw error;
        }
    },

    // Step 2: Upload Image to your backend endpoint with the File and URL
    uploadImage: async (file, uploadUrl) => {
        try {
            // For binary upload, send the file directly without FormData
            // Set the correct Content-Type for your image
            const response = await axios.put(uploadUrl, file, {
                headers: {
                    'Content-Type': file.type || 'image/jpeg', // Use file type or fallback
                    // Add any other required headers from your Postman setup
                    // 'X-Amz-SignedHeaders': '...',
                    // 'X-Amz-Signature': '...',
                },
                // Important: Transform the file data for binary upload
                transformRequest: (data) => data,
            });

            return response.data;
        } catch (error) {
            console.error("Backend Upload Error:", error);
            const message = error.response?.data?.message || "Failed to upload image";
            throw error;
        }
    },
    // Step 3: Combined Process (Called by the Component)
    processFullUpload: async (file, uniqueName) => {
        try {
            // 1. Get the pre-signed URL/Path
            const urlData = await uploadService.getUploadUrl(file, uniqueName);

            // 2. Send the File + that URL to your upload endpoint
            // We assume urlData.url contains the path you need
            const result = await uploadService.uploadImage(file, urlData.url);

            return result;
        } catch (error) {
            throw error;
        }
    }
};


