import React, { useState, useEffect } from 'react'
import UploadBill from './UploadBill'
import { supabase } from '../lib/supabase'

const Dashboard = ({ user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [bills, setBills] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const handleLogout = async () => {
    setShowUserMenu(false)
    try {
      await onLogout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        console.log('No user ID available')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('Fetching bills for user:', user.id)

        // Use the backend URL from environment variables or default to localhost:4000
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
        
        // Get user session for authentication
        const { data: { session } } = await supabase.auth.getSession();

        // Fetch bills
        const billsResponse = await fetch(
          `${backendUrl}/api/bills?userId=${user.id}&limit=5`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            }
          }
        )
        
        if (!billsResponse.ok) {
          throw new Error(`Bills API error: ${billsResponse.status}`)
        }
        
        const billsData = await billsResponse.json()
        console.log('Fetched bills:', billsData)
        setBills(billsData.data || [])

        // Fetch stats (use longer period to capture all data)
        const statsResponse = await fetch(
          `${backendUrl}/api/bills/stats/${user.id}?period=365`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            }
          }
        )
        
        if (!statsResponse.ok) {
          throw new Error(`Stats API error: ${statsResponse.status}`)
        }
        
        const statsData = await statsResponse.json()
        console.log('Fetched stats:', statsData)
        setStats(statsData)

      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  // Calculate summary stats from fetched data
  const summaryStats = [
    {
      label: 'Total Bills',
      value: stats?.total_bills || 0,
      icon: '📄',
      color: 'text-blue-600'
    },
    {
      label: 'Total Amount',
      value: stats?.total_amount ? `₹${Number(stats.total_amount).toLocaleString()}` : '₹0',
      icon: '💰',
      color: 'text-green-600'
    },
    {
      label: 'This Month',
      value: stats?.total_bills || 0, // For now, show total bills as monthly
      icon: '📅',
      color: 'text-purple-600'
    },
    {
      label: 'Total GST',
      value: stats?.total_gst ? `₹${Number(stats.total_gst).toLocaleString()}` : '₹0',
      icon: '🧾',
      color: 'text-orange-600'
    }
  ]

  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-lg font-medium">Error loading dashboard</p>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-primary">ProfitPilot</h1>
              <p className="text-sm text-gray-600">From Bills to Balance Sheet</p>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {getUserInitial()}
                  </div>
                  <span className="hidden md:block">{user?.email}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
          <p className="mt-1 text-gray-600">Here's what's happening with your bills today.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {summaryStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* GST Reclaim Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">💸</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">GST Reclaimable</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stats?.reclaimable_gst ? Number(stats.reclaimable_gst).toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Bill Section */}
        <div className="mb-8">
          <UploadBill user={user} />
        </div>

        {/* Recent Bills */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Bills</h3>
          </div>
          <div className="overflow-hidden">
            {bills.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <p className="text-gray-500 text-lg">No bills uploaded yet</p>
                <p className="text-gray-400 mt-2">Upload your first bill to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Details
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seller
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Buyer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {bill.invoice_number || `INV-${bill.id?.slice(-8)}`}
                          </div>
                          {bill.bill_items && bill.bill_items.length > 0 && (
                            <div className="text-sm text-gray-500">
                              {bill.bill_items.length} item{bill.bill_items.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-32 truncate" title={bill.seller_name}>
                            {bill.seller_name || 'Unknown Seller'}
                          </div>
                          {bill.seller_gstin && (
                            <div className="text-xs text-gray-500">GSTIN: {bill.seller_gstin.slice(-4)}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-900 max-w-24 truncate" title={bill.buyer_name}>
                            {bill.buyer_name || 'N/A'}
                          </div>
                          {bill.buyer_gstin && (
                            <div className="text-xs text-gray-500">GSTIN: {bill.buyer_gstin.slice(-4)}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
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
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{bill.total_amount ? Number(bill.total_amount).toLocaleString() : '0.00'}
                          </div>
                          {bill.gst_amount && (
                            <div className="text-xs text-gray-500">
                              GST: ₹{Number(bill.gst_amount).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
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
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 ProfitPilot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Dashboard