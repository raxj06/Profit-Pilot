  import React, { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const UploadBill = () => {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState(null)
  const [billType, setBillType] = useState('purchase') // New state for bill type
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0])
    }
  }

  // Handle file input change
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  // Validate and set selected file
  const handleFileSelection = (selectedFile) => {
    // Clear previous states
    setError('')
    setSuccess('')

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf'
    ]
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image (JPEG, PNG, GIF, WebP) or PDF file')
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
  }

  // Get file preview URL
  const getFilePreview = () => {
    if (!file) return null
    
    if (file.type === 'application/pdf') {
      return null // No preview for PDF
    }
    
    return URL.createObjectURL(file)
  }

  // Upload file to Supabase Storage and trigger backend processing
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // Step 1: Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error('Failed to get user information: ' + userError.message)
      }
      
      if (!user) {
        throw new Error('Please log in to upload bills')
      }

      console.log('📤 Starting upload for user:', user.id)

      // Step 2: Get user session token for backend authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('Please log in to upload bills')
      }

      // Step 3: Prepare form data for backend upload
      console.log(' Sending file to backend for processing...')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('billType', billType) // Add bill type to form data

      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/bills/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Backend error: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Backend response:', result)

      // Step 4: Show success and display the processed data
      setUploading(false)
      setProcessing(false)
      
      if (result.data) {
        // Create a summary of the processed bill
        const billData = result.data;
        const itemSummary = billData.items && Array.isArray(billData.items) 
          ? `${billData.items.length} item${billData.items.length !== 1 ? 's' : ''}`
          : 'Bill processed';
          
        setSuccess(`✅ Upload successful! Processed "${file.name}" - ${itemSummary}, Total: ₹${billData.totalAmount || 0}`);
      } else {
        setSuccess(`✅ Upload successful! Processing "${file.name}" completed.`);
      }
      
      // Clear form
      setFile(null)
      setBillType('purchase') // Reset to default
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Refresh the dashboard after a delay to show the new bill
      // Wait for 2 minutes to allow for processing
      setTimeout(() => {
        window.location.reload();
      }, 120000); // 2 minutes

    } catch (err) {
      console.error('❌ Upload error:', err)
      setUploading(false)
      setError(err.message || 'Failed to upload bill. Please try again.')
    }
  }

  // Clear selected file
  const clearFile = () => {
    setFile(null)
    setError('')
    setSuccess('')
    setBillType('purchase') // Reset to default
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Trigger file input click
  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Upload Bill</h3>
      
      {/* Bill Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bill Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBillType('purchase')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              billType === 'purchase'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Purchase Bill
          </button>
          <button
            type="button"
            onClick={() => setBillType('sales')}
            className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              billType === 'sales'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sales Bill
          </button>
        </div>
      </div>
      
      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center">
            <div className="text-green-600 mr-3">
              {processing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* File Preview */}
      {file && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {/* File Thumbnail */}
              <div className="flex-shrink-0">
                {getFilePreview() ? (
                  <img
                    src={getFilePreview()}
                    alt="Bill preview"
                    className="w-16 h-16 object-cover rounded border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-red-100 rounded border flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1].toUpperCase()}
                </p>
              </div>
            </div>

            {/* Remove File Button */}
            <button
              onClick={clearFile}
              disabled={uploading}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-blue-50'
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {/* Upload Icon */}
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          {uploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          ) : (
            <svg stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Upload Text */}
        <div>
          {uploading ? (
            <div>
              <p className="text-lg text-primary font-medium">Uploading...</p>
              <p className="text-sm text-gray-500">Please wait while we upload your bill</p>
            </div>
          ) : file ? (
            <div>
              <p className="text-lg text-gray-700 font-medium">File Ready to Upload</p>
              <p className="text-sm text-gray-500">Click "Process Bill" to continue</p>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-700 font-medium">Drop your bill here, or click to browse</p>
              <p className="text-sm text-gray-500">Supports: JPEG, PNG, GIF, WebP, PDF (max 10MB)</p>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,image/*,application/pdf"
          onChange={handleFileInput}
          disabled={uploading}
        />
      </div>

      {/* Upload Button */}
      {file && !uploading && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleUpload}
            disabled={uploading || processing}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {processing ? 'Processing...' : `Process ${billType === 'purchase' ? 'Purchase' : 'Sales'} Bill`}
          </button>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <p className="mb-1"><strong>How it works:</strong></p>
        <p>1. Upload your bill (image or PDF)</p>
        <p>2. Our AI extracts vendor, date, amount, and GST information</p>
        <p>3. Data is automatically categorized and added to your dashboard</p>
        <p>4. Processing usually takes 30-60 seconds</p>
      </div>
    </div>
  )
}

export default UploadBill
