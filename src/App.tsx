import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { DollarSign, ShoppingCart, TrendingUp, Package, CreditCard } from 'lucide-react';
import { ordersData, Order } from './data';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c'];

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'asc' | 'desc' } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('All');

  const uniqueProducts = useMemo(() => ['All', ...Array.from(new Set(ordersData.map(o => o.product)))], []);
  const uniquePaymentMethods = useMemo(() => ['All', ...Array.from(new Set(ordersData.map(o => o.paymentMethod)))], []);

  const globalFilteredData = useMemo(() => {
    return ordersData.filter(order => {
      const productMatch = selectedProduct === 'All' || order.product === selectedProduct;
      const paymentMatch = selectedPaymentMethod === 'All' || order.paymentMethod === selectedPaymentMethod;
      return productMatch && paymentMatch;
    });
  }, [selectedProduct, selectedPaymentMethod]);

  // Calculate KPIs
  const totalRevenue = useMemo(() => globalFilteredData.reduce((sum, order) => sum + order.price, 0), [globalFilteredData]);
  const totalOrders = globalFilteredData.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Prepare data for Line Chart (Revenue over time)
  const revenueByDate = useMemo(() => {
    const grouped = globalFilteredData.reduce((acc, order) => {
      acc[order.date] = (acc[order.date] || 0) + order.price;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, revenue]) => ({
        date: format(parseISO(date), 'MMM dd'),
        revenue
      }));
  }, [globalFilteredData]);

  // Prepare data for Bar Chart (Revenue by Product)
  const revenueByProduct = useMemo(() => {
    const grouped = globalFilteredData.reduce((acc, order) => {
      acc[order.product] = (acc[order.product] || 0) + order.price;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1]) // Sort by revenue descending
      .map(([name, value]) => ({ name, value }));
  }, [globalFilteredData]);

  // Prepare data for Pie Chart (Orders by Payment Method)
  const ordersByPaymentMethod = useMemo(() => {
    const grouped = globalFilteredData.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }));
  }, [globalFilteredData]);

  // Handle sorting
  const handleSort = (key: keyof Order) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort data for table
  const filteredAndSortedData = useMemo(() => {
    let sortableItems = [...globalFilteredData];
    
    if (searchTerm) {
      sortableItems = sortableItems.filter(item => 
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableItems;
  }, [searchTerm, sortConfig]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sales Dashboard</h1>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Data from Aug 15 - Oct 7, 2025
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Product:</label>
            <select 
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Payment Method:</label>
            <select 
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            >
              {uniquePaymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-800">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-purple-100 p-4 rounded-xl text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Average Order Value</p>
              <p className="text-2xl font-bold text-slate-800">${averageOrderValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Charts Section 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              Revenue Over Time
            </h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDate} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-slate-400" />
              Payment Methods
            </h2>
            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByPaymentMethod}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ordersByPaymentMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [value, 'Orders']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Section 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" />
            Revenue by Product
          </h2>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByProduct} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 12 }}
                  width={150}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Orders</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('orderNumber')}>
                    Order Number {sortConfig?.key === 'orderNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('product')}>
                    Product {sortConfig?.key === 'product' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('date')}>
                    Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('paymentMethod')}>
                    Payment Method {sortConfig?.key === 'paymentMethod' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('price')}>
                    Price {sortConfig?.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedData.map((order, index) => (
                  <tr key={`${order.orderNumber}-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{order.orderNumber}</td>
                    <td className="px-6 py-4">{order.product}</td>
                    <td className="px-6 py-4">{format(parseISO(order.date), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${order.paymentMethod === 'Credit Card' ? 'bg-blue-100 text-blue-800' : 
                          order.paymentMethod === 'Debit Card' ? 'bg-indigo-100 text-indigo-800' : 
                          order.paymentMethod === 'eWallet' ? 'bg-purple-100 text-purple-800' : 
                          'bg-emerald-100 text-emerald-800'}`}>
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">${order.price.toFixed(2)}</td>
                  </tr>
                ))}
                {filteredAndSortedData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No orders found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
