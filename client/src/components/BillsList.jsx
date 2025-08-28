import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BillsList = ({ user, onBillSelect }) => {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState('created_at')

  useEffect(() => {
    fetchBills()
  }, [user?.id])

  const fetchBills = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession()

      // Fetch all bills for the user
      const response = await fetch(
        `${backendUrl}/api/bills?userId=${user.id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error(`Bills API error: ${response.status}`)
      }
      
      const billsData = await response.json()
      setBills(billsData.data || [])
    } catch (err) {
      console.error('Error fetching bills:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter bills based on search term
  const filteredBills = bills.filter(bill => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (bill.invoice_number && bill.invoice_number.toLowerCase().includes(searchLower)) ||
      (bill.seller_name && bill.seller_name.toLowerCase().includes(searchLower)) ||
      (bill.buyer_name && bill.buyer_name.toLowerCase().includes(searchLower)) ||
      (bill.total_amount && bill.total_amount.toString().includes(searchTerm))
    )
  })

  // Sort bills based on selected option
  const sortedBills = [...filteredBills].sort((a, b) => {
    if (sortOption === 'created_at') {
      return new Date(b.created_at) - new Date(a.created_at)
    } else if (sortOption === 'amount') {
      return parseFloat(b.total_amount || 0) - parseFloat(a.total_amount || 0)
    } else if (sortOption === 'date') {
      return new Date(b.invoice_date) - new Date(a.invoice_date)
    }
    return 0
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="ml-2 text-sm font-medium text-red-800">Error loading bills</h3>
        </div>
        <div className="mt-2 text-sm text-red-700">
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <button
            onClick={fetchBills}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-medium text-gray-900">All Bills</h3>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <select
              className="block w-full md:w-auto pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="created_at">Newest First</option>
              <option value="amount">Amount</option>
              <option value="date">Invoice Date</option>
            </select>
          </div>
        </div>
      </div>
      
      {sortedBills.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No bills match your search' : 'No bills found'}
          </p>
          <p className="text-gray-400 mt-2">
            {searchTerm ? 'Try a different search term' : 'Upload your first bill to get started!'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seller
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedBills.map((bill) => (
                <tr 
                  key={bill.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onBillSelect(bill)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {bill.invoice_number || `INV-${bill.id?.slice(-8)}`}
                    </div>
                    {bill.bill_items && bill.bill_items.length > 0 && (
                      <div className="text-sm text-gray-500">
                        {bill.bill_items.length} item{bill.bill_items.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 max-w-32 truncate" title={bill.seller_name}>
                      {bill.seller_name || 'Unknown Seller'}
                    </div>
                    {bill.seller_gstin && (
                      <div className="text-xs text-gray-500">GSTIN: {bill.seller_gstin.slice(-4)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <div className="text-sm text-gray-900 max-w-24 truncate" title={bill.buyer_name}>
                      {bill.buyer_name || 'N/A'}
                    </div>
                    {bill.buyer_gstin && (
                      <div className="text-xs text-gray-500">GSTIN: {bill.buyer_gstin.slice(-4)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bill.transaction_type === 'expense' 
                        ? 'bg-red-100 text-red-800' 
                        : bill.transaction_type === 'purchase'
                        ? 'bg-orange-100 text-orange-800'
                        : bill.transaction_type === 'income'
                        ? 'bg-green-100 text-green-800'
                        : bill.transaction_type === 'sales'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {bill.transaction_type || 'unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{bill.total_amount ? Number(bill.total_amount).toLocaleString() : '0.00'}
                    </div>
                    {bill.gst_amount && (
                      <div className="text-xs text-gray-500">
                        GST: ₹{Number(bill.gst_amount).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {bill.invoice_date ? new Date(bill.invoice_date).toLocaleDateString() : 
                     bill.created_at ? new Date(bill.created_at).toLocaleDateString() : 
                     'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default BillsList