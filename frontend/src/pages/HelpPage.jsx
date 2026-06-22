import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Toast from '../components/ui/Toast';
import { Plus, Trash2, Tag, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const HelpPage = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
  const [tickets, setTickets] = useState([]);
  const [toast, setToast] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'medium' });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/features/tickets', {
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      if (res.ok) setTickets(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (userInfo.token) fetchTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/features/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}` 
        },
        body: JSON.stringify(newTicket)
      });
      if (res.ok) {
        showToast('Ticket submitted successfully');
        setShowModal(false);
        setNewTicket({ subject: '', description: '', priority: 'medium' });
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
      showToast('Error submitting ticket');
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this ticket?')) return;
    try {
      await fetch(`http://localhost:5000/api/features/tickets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
      });
      fetchTickets();
    } catch (err) { console.error(err); }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'resolved': return <CheckCircle className="text-emerald-500 w-5 h-5" />;
      case 'in_progress': return <Clock className="text-amber-500 w-5 h-5" />;
      default: return <AlertCircle className="text-blue-500 w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'low': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <DashboardLayout>
      <Toast message={toast} />
      <div className="max-w-5xl mx-auto pt-6 flex flex-col gap-6">
        
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Help & Support Tickets</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your IT helpdesk tickets.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus size={18} /> New Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {tickets.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
              <p className="text-slate-500 italic">No support tickets found.</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div key={ticket.id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all gap-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getStatusIcon(ticket.status)}</div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">{ticket.subject}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col justify-end gap-2 shrink-0">
                  <button onClick={() => handleDelete(ticket.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-900/50 rounded-lg md:opacity-0 md:group-hover:opacity-100">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Tag className="text-blue-500" /> Create Ticket
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                <input 
                  type="text" required
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Cannot access budget reports"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea 
                  required rows="4"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Describe the issue in detail..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                <select 
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-colors">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default HelpPage;
