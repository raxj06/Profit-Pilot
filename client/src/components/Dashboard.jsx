  import React, { useState, useEffect } from 'react'
import UploadBill from './UploadBill'
import BillsList from './BillsList'
import BillDetails from './BillDetails'
import { supabase } from '../lib/supabase'

const Dashboard = ({ user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [bills, setBills] = useState([])
  const [stats, setStats] = useState({
    total_bills: 0,
    total_amount: 0,
    total_gst: 0,
    sales_amount: 0,
    purchase_amount: 0,
    reclaimable_gst: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard') // 'dashboard', 'bills', 'billDetails'
  const [selectedBill, setSelectedBill] = useState(null)

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

        // Use the backend URL from environment variables or default to empty string
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        
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
      value: stats.total_bills,
      icon: '📄',
      color: 'text-gray-800'
    },
    {
      label: 'Total Amount',
      value: `₹${Number(stats.total_amount).toLocaleString()}`,
      icon: '💰',
      color: 'text-gray-800'
    },
    {
      label: 'Purchase Amount',
      value: `₹${Number(stats.purchase_amount).toLocaleString()}`,
      icon: '🛍️',
      color: 'text-red-600'
    },
    {
      label: 'Sales Amount',
      value: `₹${Number(stats.sales_amount).toLocaleString()}`,
      icon: '📈',
      color: 'text-blue-600'
    },
    {
      label: 'This Month',
      value: new Date().toLocaleDateString('default', { month: 'short', year: 'numeric' }),
      icon: '📅',
      color: 'text-gray-800'
    },
    {
      label: 'Sales GST',
      value: `₹${Number(stats.sales_gst).toLocaleString()}`,
      icon: '📊',
      color: 'text-blue-600'
    }
  ]

  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleViewBills = () => {
    setCurrentView('bills')
  }

  const handleBillSelect = (bill) => {
    setSelectedBill(bill)
    setCurrentView('billDetails')
  }

  const handleBackToBills = () => {
    setCurrentView('bills')
    setSelectedBill(null)
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedBill(null)
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">ProfitPilot</h1>
          </div>
          <button 
            onClick={toggleSidebar}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-4 py-6">
          <nav>
            <button 
              onClick={handleBackToDashboard}
              className={`flex items-center px-4 py-2 w-full text-left rounded-lg ${
                currentView === 'dashboard' ? 'text-gray-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
            <button 
              onClick={handleViewBills}
              className={`flex items-center px-4 py-2 mt-2 w-full text-left rounded-lg ${
                currentView === 'bills' || currentView === 'billDetails' ? 'text-gray-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Bills
            </button>
            <a href="#" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Reports
            </a>
            <a href="#" className="flex items-center px-4 py-2 mt-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </nav>
          
          <div className="absolute bottom-0 w-full px-4 py-6 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar}
                className="mr-4 text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-primary">
                  {currentView === 'dashboard' && 'Dashboard'}
                  {currentView === 'bills' && 'Bills'}
                  {currentView === 'billDetails' && 'Bill Details'}
                </h1>
                <p className="text-xs text-gray-600">From Bills to Balance Sheet</p>
              </div>
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
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentView === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back!</h2>
                <p className="mt-1 text-gray-600">Here's what's happening with your bills today.</p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
                {summaryStats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-4 md:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-xl md:text-2xl">{stat.icon}</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-xs md:text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className={`text-lg md:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Total GST Card */}
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-xl md:text-2xl">🧾</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-xs md:text-sm font-medium text-gray-600">Total GST</p>
                      <p className="text-lg md:text-2xl font-bold text-purple-600">
                        ₹{stats?.total_gst ? Number(stats.total_gst).toLocaleString() : '0'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* GST Reclaim Card */}
                <div className="bg-white rounded-lg shadow p-4 md:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-xl md:text-2xl">💸</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-xs md:text-sm font-medium text-gray-600">GST Reclaimable</p>
                      <p className="text-lg md:text-2xl font-bold text-green-600">
                        ₹{stats?.reclaimable_gst ? Number(stats.reclaimable_gst).toLocaleString() : '0'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Bill Section */}
              <div className="mb-6 md:mb-8">
                <UploadBill user={user} />
              </div>

              {/* Recent Bills */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Recent Bills</h3>
                    <button 
                      onClick={handleViewBills}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                </div>
                <div className="overflow-hidden">
                  {bills.length === 0 ? (
                    <div className="px-4 md:px-6 py-12 text-center">
                      <div className="text-gray-400 text-4xl md:text-6xl mb-4">📄</div>
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
                            <tr 
                              key={bill.id} 
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleBillSelect(bill)}
                            >
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
            </>
          )}

          {currentView === 'bills' && (
            <BillsList user={user} onBillSelect={handleBillSelect} />
          )}

          {currentView === 'billDetails' && (
            <BillDetails bill={selectedBill} onBack={handleBackToBills} user={user} />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-6 md:mt-12">
          <div className="py-4 md:py-6 px-4 md:px-6">
            <p className="text-center text-xs md:text-sm text-gray-500">
              © 2025 ProfitPilot. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Dashboard