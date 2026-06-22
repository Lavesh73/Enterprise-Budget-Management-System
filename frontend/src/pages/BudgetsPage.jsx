import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { 
  IndianRupee, TrendingUp, AlertTriangle, Download, Search, 
  Plus, Edit, Trash2, X, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const BudgetsPage = () => {
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals
  const [selectedProject, setSelectedProject] = useState(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    project_id: '',
    expense_type: '',
    amount: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [budRes, projRes] = await Promise.all([
        fetch('http://localhost:5000/api/budgets', { headers: { 'Authorization': `Bearer ${userInfo.token}` } }),
        fetch('http://localhost:5000/api/projects', { headers: { 'Authorization': `Bearer ${userInfo.token}` } })
      ]);
      if (budRes.ok) setExpenses(await budRes.json());
      if (projRes.ok) setProjects(await projRes.json());
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Derived Data ---
  const totalSanctioned = useMemo(() => projects.reduce((sum, p) => sum + Number(p.sanctioned_amount || 0), 0), [projects]);
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), [expenses]);
  const remainingBudget = totalSanctioned - totalSpent;
  const utilizationPercent = totalSanctioned > 0 ? ((totalSpent / totalSanctioned) * 100).toFixed(1) : 0;
  
  const activeProjects = projects.filter(p => p.status !== 'completed').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  const projectStats = useMemo(() => {
    return projects.map(p => {
      const pExpenses = expenses.filter(e => e.project_id === p.id);
      const spent = pExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const remaining = Number(p.sanctioned_amount) - spent;
      const utilization = p.sanctioned_amount > 0 ? ((spent / p.sanctioned_amount) * 100) : 0;
      return { ...p, spent, remaining, utilization };
    });
  }, [projects, expenses]);

  // --- Chart Data ---
  const budgetVsExpenseData = projectStats.map(p => ({
    name: p.project_name?.substring(0, 15) + '...',
    Budget: Number(p.sanctioned_amount),
    Spent: p.spent
  })).slice(0, 10); // Top 10

  const deptAllocationData = useMemo(() => {
    const depts = {};
    projects.forEach(p => {
      const dept = p.group_name || 'Unassigned';
      depts[dept] = (depts[dept] || 0) + Number(p.sanctioned_amount);
    });
    return Object.entries(depts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const monthlyExpenseData = useMemo(() => {
    const months = {};
    expenses.forEach(e => {
      if (!e.created_at) return;
      const month = format(parseISO(e.created_at), 'MMM yyyy');
      months[month] = (months[month] || 0) + Number(e.amount);
    });
    // Sort chronologically in a real app, assuming expenses come sorted desc
    return Object.entries(months).reverse().map(([name, Spent]) => ({ name, Spent })).slice(-6);
  }, [expenses]);

  // --- Alerts ---
  const alerts = useMemo(() => {
    const newAlerts = [];
    if (utilizationPercent > 90) newAlerts.push({ type: 'critical', msg: `Overall budget utilization is critical at ${utilizationPercent}%!` });
    else if (utilizationPercent > 80) newAlerts.push({ type: 'warning', msg: `Overall budget utilization is high at ${utilizationPercent}%.` });
    
    projectStats.forEach(p => {
      if (p.utilization > 100) newAlerts.push({ type: 'critical', msg: `Project "${p.project_name}" has EXCEEDED its budget by ₹${Math.abs(p.remaining).toFixed(2)}.` });
      else if (p.utilization > 90) newAlerts.push({ type: 'warning', msg: `Project "${p.project_name}" budget utilization is at ${p.utilization.toFixed(1)}%.` });
    });
    return newAlerts;
  }, [projectStats, utilizationPercent]);

  // --- Filtering & Pagination ---
  const filteredProjects = projectStats.filter(p => {
    const matchSearch = p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.project_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter ? p.group_name === deptFilter : true;
    const matchStatus = statusFilter ? p.status === statusFilter : true;
    return matchSearch && matchDept && matchStatus;
  });

  const paginatedProjects = filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const filteredExpenses = expenses.filter(e => 
    e.expense_type?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
    e.project_name?.toLowerCase().includes(expenseSearch.toLowerCase())
  );

  // --- Handlers ---
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    const url = editingExpense ? `http://localhost:5000/api/budgets/${editingExpense.id}` : 'http://localhost:5000/api/budgets';
    const method = editingExpense ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userInfo.token}` },
      body: JSON.stringify({ 
        project_id: expenseForm.project_id, 
        expense_type: expenseForm.expense_type, 
        amount: parseFloat(expenseForm.amount) 
      })
    });
    
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
    setExpenseForm({ project_id: '', expense_type: '', amount: '' });
    fetchData();
  };

  const handleDeleteExpense = async (id) => {
    if(!window.confirm('Are you sure you want to delete this expense?')) return;
    await fetch(`http://localhost:5000/api/budgets/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${userInfo.token}` }
    });
    fetchData();
  };

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({ project_id: expense.project_id, expense_type: expense.expense_type, amount: expense.amount });
    setIsExpenseModalOpen(true);
  };

  // --- Exports ---
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProjects.map(p => ({
      'Project ID': p.project_number,
      'Project Name': p.project_name,
      'Department': p.group_name,
      'Sanctioned Amount': p.sanctioned_amount,
      'Amount Spent': p.spent,
      'Remaining': p.remaining,
      'Utilization %': p.utilization.toFixed(2),
      'Status': p.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Budgets");
    XLSX.writeFile(wb, "Budget_Report.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Project Budget Report", 14, 15);
    const tableData = filteredProjects.map(p => [
      p.project_number, p.project_name, p.group_name, 
      `₹${p.sanctioned_amount}`, `₹${p.spent}`, `₹${p.remaining}`, 
      `${p.utilization.toFixed(1)}%`
    ]);
    doc.autoTable({
      startY: 20,
      head: [['ID', 'Name', 'Dept', 'Budget', 'Spent', 'Remaining', 'Util %']],
      body: tableData,
    });
    doc.save("Budget_Report.pdf");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const departments = [...new Set(projects.map(p => p.group_name).filter(Boolean))];
  const statuses = [...new Set(projects.map(p => p.status).filter(Boolean))];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pt-6 pb-12 flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl">
              <IndianRupee className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Budget Management</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Enterprise financial overview and expenditure tracking.</p>
            </div>
          </div>
          <button onClick={() => { setEditingExpense(null); setExpenseForm({ project_id: '', expense_type: '', amount: '' }); setIsExpenseModalOpen(true); }} 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-emerald-600/20">
            <Plus className="w-5 h-5" /> Log Expense
          </button>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="flex flex-col gap-3">
            {alerts.map((alert, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${alert.type === 'critical' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${alert.type === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                <p className={`font-medium ${alert.type === 'critical' ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>{alert.msg}</p>
              </div>
            ))}
          </div>
        )}

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Sanctioned" value={`₹${totalSanctioned.toLocaleString()}`} icon={<IndianRupee/>} color="emerald" />
          <StatCard title="Total Spent" value={`₹${totalSpent.toLocaleString()}`} icon={<TrendingUp/>} color="blue" />
          <StatCard title="Remaining Budget" value={`₹${remainingBudget.toLocaleString()}`} icon={<Activity/>} color={remainingBudget < 0 ? 'red' : 'purple'} />
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Utilization & Projects</h3>
            <div className="flex items-end justify-between mt-2">
              <div>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{utilizationPercent}%</p>
                <p className="text-xs text-slate-500 mt-1">Overall Utilization</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{activeProjects} Active</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{completedProjects} Completed</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
              <div className={`h-full rounded-full ${utilizationPercent > 90 ? 'bg-red-500' : utilizationPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(utilizationPercent, 100)}%` }}></div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Budget vs Expenditure by Project</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsExpenseData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <RechartsTooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Spent" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Department Allocation</h2>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deptAllocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {deptAllocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Monthly Expenditure Trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyExpenseData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                  <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="Spent" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Projects Table */}
          <div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Project Budgets</h2>
              <div className="flex items-center gap-2">
                <button onClick={exportToExcel} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition" title="Export to Excel"><Download className="w-5 h-5" /></button>
                <button onClick={exportToPDF} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Export to PDF"><span className="font-bold text-xs">PDF</span></button>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none">
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none capitalize">
                <option value="">All Statuses</option>
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Project</th>
                    <th className="px-6 py-4 font-medium">Budget</th>
                    <th className="px-6 py-4 font-medium">Spent</th>
                    <th className="px-6 py-4 font-medium">Utilization</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {paginatedProjects.map(p => (
                    <tr key={p.id} onClick={() => setSelectedProject(p)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">{p.project_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{p.project_number} • {p.group_name || 'No Dept'}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">${Number(p.sanctioned_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">${p.spent.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${p.utilization > 90 ? 'bg-red-500' : p.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(p.utilization, 100)}%` }}></div>
                          </div>
                          <span className={`text-xs font-medium ${p.utilization > 90 ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'}`}>{p.utilization.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                          ${p.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                            p.status === 'active' || p.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {paginatedProjects.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No projects found matching criteria.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30 mt-auto">
                <span className="text-sm text-slate-500">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded bg-white border border-slate-200 disabled:opacity-50"><ChevronLeft className="w-5 h-5"/></button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded bg-white border border-slate-200 disabled:opacity-50"><ChevronRight className="w-5 h-5"/></button>
                </div>
              </div>
            )}
          </div>

          {/* Expenditure History */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-[600px] xl:h-auto">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Expenses</h2>
              <div className="mt-4 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search expenses..." value={expenseSearch} onChange={e => setExpenseSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none" />
              </div>
            </div>
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
              {filteredExpenses.map(e => (
                <div key={e.id} className="p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:shadow-md transition-shadow bg-slate-50/50 dark:bg-slate-800/50 group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-sm">{e.expense_type}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]" title={e.project_name}>{e.project_name || 'Unassigned'}</p>
                    </div>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">${Number(e.amount).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{e.created_at ? format(parseISO(e.created_at), 'dd MMM yyyy') : 'N/A'}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditExpense(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteExpense(e.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredExpenses.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No expenses found.</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedProject.project_name}</h2>
                <p className="text-slate-500 mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm">{selectedProject.project_number}</span> • 
                  <span>{selectedProject.group_name || 'No Department'}</span>
                </p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-8">
              <div className="col-span-2 md:col-span-1 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Project Info</h3>
                <div className="space-y-3">
                  <div><p className="text-xs text-slate-500">Status</p><p className="font-medium capitalize text-slate-800 dark:text-slate-200">{selectedProject.status}</p></div>
                  <div><p className="text-xs text-slate-500">Start Date</p><p className="font-medium text-slate-800 dark:text-slate-200">{selectedProject.start_date ? format(parseISO(selectedProject.start_date), 'PP') : 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500">Expected Completion</p><p className="font-medium text-slate-800 dark:text-slate-200">{selectedProject.probable_completion_date ? format(parseISO(selectedProject.probable_completion_date), 'PP') : 'N/A'}</p></div>
                  <div><p className="text-xs text-slate-500">Division Head</p><p className="font-medium text-slate-800 dark:text-slate-200">{selectedProject.division_head_name || 'N/A'}</p></div>
                </div>
              </div>
              
              <div className="col-span-2 md:col-span-1 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Financials</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-slate-500">Sanctioned</span><span className="font-bold text-slate-800 dark:text-white">${Number(selectedProject.sanctioned_amount).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-slate-500">Spent</span><span className="font-bold text-slate-800 dark:text-white">${selectedProject.spent.toLocaleString()}</span></div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between"><span className="text-sm font-medium text-slate-600 dark:text-slate-400">Remaining</span><span className={`font-bold ${selectedProject.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>${selectedProject.remaining.toLocaleString()}</span></div>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Utilization</span>
                    <span className="font-bold text-slate-800 dark:text-white">{selectedProject.utilization.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${selectedProject.utilization > 90 ? 'bg-red-500' : selectedProject.utilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(selectedProject.utilization, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button onClick={() => setSelectedProject(null)} className="px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Add/Edit Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleExpenseSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingExpense ? 'Edit Expense' : 'Log New Expense'}</h2>
              <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project</label>
                <select required value={expenseForm.project_id} onChange={e => setExpenseForm({...expenseForm, project_id: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select a project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expense Type / Description</label>
                <input required type="text" value={expenseForm.expense_type} onChange={e => setExpenseForm({...expenseForm, expense_type: e.target.value})} placeholder="e.g. Software License" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
                <input required type="number" step="0.01" min="0" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="0.00" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
              <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition shadow-sm">{editingExpense ? 'Save Changes' : 'Submit Expense'}</button>
            </div>
          </form>
        </div>
      )}

    </DashboardLayout>
  );
};

// Helper Component
const StatCard = ({ title, value, icon, color }) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-800',
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${colorMap[color]}`}>
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
    </div>
  );
};

export default BudgetsPage;
