import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BillDetails = ({ bill: initialBill, onBack, user }) => {
  const [bill, setBill] = useState(initialBill);
  const [loading, setLoading] = useState(!initialBill);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // If we don't have the full bill details, fetch them
    if (initialBill && !initialBill.bill_items) {
      fetchBillDetails();
    }
  }, [initialBill]);

  const fetchBillDetails = async () => {
    if (!user?.id || !initialBill?.id) return;

    try {
      setLoading(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();

      // Fetch detailed bill information
      const response = await fetch(
        `${backendUrl}/api/bills/${initialBill.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Bill API error: ${response.status}`);
      }
      
      const billData = await response.json();
      setBill(billData.data);
    } catch (err) {
      console.error('Error fetching bill details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!bill?.id || !user?.id) {
      alert('Missing bill or user information');
      return;
    }
    
    try {
      setDownloading(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      
      // Get user session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw new Error('Authentication error: ' + sessionError.message);
      }
      
      if (!session) {
        console.error('No session found');
        throw new Error('No active session. Please log in again.');
      }
      
      console.log('Using access token:', session.access_token ? 'YES' : 'NO');
      
      // Fetch the file from the secure download endpoint
      const response = await fetch(
        `${backendUrl}/api/bills/${bill.id}/download`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );
      
      console.log('Download response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download error response:', errorText);
        
        let errorMessage = `Download failed with status ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Not JSON, use the text as is
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      // Get the filename from the response headers or create a default one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = bill.invoice_number ? `bill-${bill.invoice_number}` : `bill-${bill.id}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Get the content type
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a temporary link and trigger download
      const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Successfully downloaded file: ${filename}`);
    } catch (err) {
      console.error('Error downloading bill:', err);
      alert(`Failed to download bill: ${err.message}. Please try again.`);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="ml-2 text-sm font-medium text-red-800">Error loading bill details</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchBillDetails}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No bill selected</p>
        </div>
      </div>
    )
  }

  // Format currency
  const formatCurrency = (amount) => {
    return amount ? `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Calculate subtotal as Total amount - GST
  const calculateSubtotal = () => {
    const totalAmount = parseFloat(bill.total_amount) || 0;
    const gstAmount = parseFloat(bill.gst_amount) || 0;
    return totalAmount - gstAmount;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header with back button */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="flex items-center text-blue-700 hover:text-blue-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Bills
          </button>
          <h3 className="ml-4 text-lg font-medium text-gray-900">Bill Details</h3>
        </div>
      </div>

      <div className="p-6">
        {/* Bill Header Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Invoice Information</h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-700">Invoice Number</p>
                <p className="font-medium text-gray-900">{bill.invoice_number || `INV-${bill.id?.slice(-8)}`}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Invoice Date</p>
                <p className="font-medium text-gray-900">{formatDate(bill.invoice_date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-700">Transaction Type</p>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  bill.transaction_type === 'expense' 
                    ? 'bg-red-200 text-red-900' 
                    : bill.transaction_type === 'purchase'
                    ? 'bg-orange-200 text-orange-900'
                    : bill.transaction_type === 'income'
                    ? 'bg-green-200 text-green-900'
                    : bill.transaction_type === 'sales'
                    ? 'bg-blue-200 text-blue-900'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  {bill.transaction_type || 'Unknown'}
                </span>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download Bill
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Amount Summary</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">GST Amount</span>
                <span className="font-medium text-gray-900">{formatCurrency(bill.gst_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Other Charges</span>
                <span className="font-medium text-gray-900">{formatCurrency(bill.other_charges)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="text-gray-900 font-medium">Total Amount</span>
                <span className="text-gray-900 font-bold text-lg">{formatCurrency(bill.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Information */}
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Seller Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-700">Name</p>
              <p className="font-medium text-gray-900">{bill.seller_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">GSTIN</p>
              <p className="font-medium text-gray-900">{bill.seller_gstin || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Address</p>
              <p className="font-medium text-gray-900">{bill.seller_address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">State</p>
              <p className="font-medium text-gray-900">{bill.seller_state || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Buyer Information */}
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Buyer Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-100 p-4 rounded-lg">
            <div>
              <p className="text-sm text-gray-700">Name</p>
              <p className="font-medium text-gray-900">{bill.buyer_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">GSTIN</p>
              <p className="font-medium text-gray-900">{bill.buyer_gstin || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Address</p>
              <p className="font-medium text-gray-900">{bill.buyer_address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">State</p>
              <p className="font-medium text-gray-900">{bill.buyer_state || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Bill Items */}
        <div className="mb-8">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Items</h4>
          {bill.bill_items && bill.bill_items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">GST Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bill.bill_items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.description || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {item.gst_rate || 'N/A'}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-700">No items found for this bill</p>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-700">Category</p>
              <p className="font-medium text-gray-900">{bill.category || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Payment Method</p>
              <p className="font-medium text-gray-900">{bill.payment_method || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Notes</p>
              <p className="font-medium text-gray-900">{bill.notes || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">Created At</p>
              <p className="font-medium text-gray-900">{formatDate(bill.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BillDetails