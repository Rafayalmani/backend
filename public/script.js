/**
 * Video Downloader - Complete working solution
 * Handles video downloads with proper error handling and user feedback
 */

// Wait for the DOM to be fully loaded before running our code
document.addEventListener('DOMContentLoaded', function() {
    
    // Get references to HTML elements - Note: Using the correct IDs from your HTML
    const urlInput = document.getElementById('videoUrl'); // Changed from 'urlInput' to 'videoUrl'
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Create error message element if it doesn't exist
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.style.color = '#ff4444';
        errorDiv.style.marginTop = '10px';
        errorDiv.style.padding = '10px';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
        
        // Insert after the download button
        downloadBtn.parentNode.insertBefore(errorDiv, downloadBtn.nextSibling);
    }
    
    // Check if elements exist
    if (!urlInput) {
        console.error('URL input element not found! Check if element with id="videoUrl" exists');
        return;
    }
    
    if (!downloadBtn) {
        console.error('Download button element not found! Check if element with id="downloadBtn" exists');
        return;
    }
    
    // Add click event listener to download button
    downloadBtn.addEventListener('click', handleDownload);
    
    // Also allow Enter key in input field
    urlInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleDownload();
        }
    });
    
    /**
     * Main download function
     */
    async function handleDownload() {
        // Clear any previous error messages
        hideError();
        
        // Get the URL from input field and remove extra spaces
        const videoUrl = urlInput.value.trim();
        
        // Validate URL
        if (!videoUrl) {
            showError('Please enter a video URL');
            urlInput.focus();
            return;
        }
        
        // Basic URL validation
        if (!isValidUrl(videoUrl)) {
            showError('Please enter a valid URL (include http:// or https://)');
            urlInput.focus();
            return;
        }
        
        // Disable button and show downloading state
        const originalButtonText = downloadBtn.textContent;
        downloadBtn.disabled = true;
        downloadBtn.textContent = '⏳ Downloading...';
        
        try {
            console.log('Sending request to download:', videoUrl);
            
            // Send POST request to server
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    url: videoUrl  // Send URL in request body as JSON
                })
            });
            
            // Log response for debugging
            console.log('Response status:', response.status);
            
            // Check if request was successful
            if (!response.ok) {
                // Try to get error message from response
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // If response is not JSON, use status text
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            // Check content type to ensure we're getting a video
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('video') && !contentType.includes('octet-stream')) {
                console.warn('Unexpected content type:', contentType);
            }
            
            // Get the response as a blob (binary data)
            const blob = await response.blob();
            
            // Verify we have data
            if (blob.size === 0) {
                throw new Error('Downloaded file is empty');
            }
            
            // Create a URL for the blob
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = blobUrl;
            
            // Try to get filename from Content-Disposition header, fallback to default
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'video.mp4'; // Default filename
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            link.download = filename;
            
            // Append link to body, click it, and remove it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the blob URL
            window.URL.revokeObjectURL(blobUrl);
            
            // Show success message (optional)
            showSuccess('Download started!');
            
            // Clear input after successful download
            urlInput.value = '';
            
        } catch (error) {
            // Handle any errors that occurred during the process
            console.error('Download error details:', error);
            
            // Show user-friendly error message
            let userMessage = 'Failed to download video. ';
            
            if (error.message.includes('Failed to fetch')) {
                userMessage += 'Cannot connect to server. Please check if the server is running.';
            } else if (error.message.includes('404')) {
                userMessage += 'Download endpoint not found. Check server configuration.';
            } else {
                userMessage += error.message;
            }
            
            showError(userMessage);
            
        } finally {
            // Re-enable the download button and restore text
            downloadBtn.disabled = false;
            downloadBtn.textContent = originalButtonText;
        }
    }
    
    /**
     * Validate URL format
     * @param {string} urlString - URL to validate
     * @returns {boolean} - True if valid URL
     */
    function isValidUrl(urlString) {
        try {
            new URL(urlString);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Display error message to user
     * @param {string} message - The error message to display
     */
    function showError(message) {
        if (errorDiv) {
            errorDiv.textContent = '❌ ' + message;
            errorDiv.style.display = 'block';
            errorDiv.style.color = '#ff4444';
            errorDiv.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
            
            // Auto-hide after 5 seconds
            setTimeout(hideError, 5000);
        } else {
            // Fallback if error div doesn't exist
            alert('Error: ' + message);
        }
    }
    
    /**
     * Display success message to user
     * @param {string} message - The success message to display
     */
    function showSuccess(message) {
        if (errorDiv) {
            errorDiv.textContent = '✅ ' + message;
            errorDiv.style.color = '#00ff88';
            errorDiv.style.backgroundColor = 'rgba(0, 255, 136, 0.1)';
            errorDiv.style.display = 'block';
            
            // Auto-hide after 3 seconds
            setTimeout(hideError, 3000);
        }
    }
    
    /**
     * Hide error/success message
     */
    function hideError() {
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
    }
    
    // Log that script is loaded and ready
    console.log('Video downloader script loaded and ready!');
});