import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Sprout, ClipboardList, Wallet, Factory, Plus, Save, Trash2, 
  ArrowLeft, CreditCard, AlertTriangle, FileText, CheckCircle, Printer, Lock, LogIn, LogOut, ArrowDownLeft, ArrowUpRight, Home, History 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, setDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Firebase Configuration ---
// වැදගත්: මෙතනට ඔබේ Firebase Project එකේ Config ටික පේස්ට් කරන්න.
const firebaseConfig = { apiKey: "AIzaSyAOA8FblPLzOWDEswPipXfzqIuvWY6ZUvA",
  authDomain: "tea-estate-app.firebaseapp.com",
  projectId: "tea-estate-app",
  storageBucket: "tea-estate-app.firebasestorage.app",
  messagingSenderId: "85406491956",
  appId: "1:85406491956:web:b551572166ded2266eb161"

};

// Initialize Firebase
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = 'my-tea-estate-v7'; 

// --- Helper Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('si-LK', { style: 'currency', currency: 'LKR' }).format(amount);
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('si-LK', { dateStyle: 'medium', timeStyle: 'short' });
};

// --- Login Screen ---
const LoginScreen = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (pin === '12345') onLogin(); else { setError('PIN අංකය වැරදියි.'); setPin(''); } };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-600 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-6"><div className="bg-green-100 p-4 rounded-full"><Sprout size={48} className="text-green-600" /></div></div>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Estate Manager</h1>
        <p className="text-center text-gray-500 mb-8">Login via PIN</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={18} className="text-gray-400" /></div><input type="password" value={pin} onChange={(e) => setPin(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-center text-2xl tracking-widest" placeholder="•••••" maxLength={5} autoFocus /></div>
          {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
          <button type="submit" className="w-full py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 transition-colors">Login</button>
        </form>
        <div className="mt-6 text-center"><p className="text-xs text-gray-400">Secure System v7.0</p></div>
      </div>
    </div>
  );
};

// --- Confirm Modal ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full border border-gray-100">
        <div className="flex items-center gap-3 text-red-600 mb-3"><AlertTriangle size={24} /><h3 className="text-lg font-bold">{title}</h3></div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3"><button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors">නැත</button><button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">ඔව්, මකන්න</button></div>
      </div>
    </div>
  );
};

// --- Detailed Report Component ---
const DetailedReport = ({ worker, stats, month, onClose }) => {
  useEffect(() => { const timer = setTimeout(() => window.print(), 500); return () => clearTimeout(timer); }, []);
  return (
    <div className="fixed inset-0 bg-white z-[70] overflow-auto p-8 text-black">
      <div className="max-w-4xl mx-auto print:max-w-none">
        <div className="flex justify-between items-center mb-8 print:hidden"><h2 className="text-2xl font-bold">Report Preview</h2><button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded font-bold hover:bg-gray-300">Close</button></div>
        <div className="border-b-2 border-black pb-4 mb-6"><h1 className="text-3xl font-bold uppercase mb-2">Monthly Worker Statement</h1><div className="flex justify-between text-sm"><div><p><strong>Name:</strong> {worker.name}</p><p><strong>Category:</strong> {worker.category}</p><p><strong>NIC:</strong> {worker.nic || '-'}</p></div><div className="text-right"><p><strong>Month:</strong> {month}</p><p><strong>Generated:</strong> {new Date().toLocaleDateString()}</p></div></div></div>
        <div className="grid grid-cols-4 gap-4 mb-8 text-center"><div className="border border-gray-300 p-2 rounded"><p className="text-xs uppercase font-bold text-gray-500">Gross Pay</p><p className="text-lg font-bold">{formatCurrency(stats.grossPay)}</p></div><div className="border border-gray-300 p-2 rounded"><p className="text-xs uppercase font-bold text-gray-500">Net Advances</p><p className="text-lg font-bold text-red-600">-{formatCurrency(stats.netAdvances)}</p></div><div className="border border-gray-300 p-2 rounded"><p className="text-xs uppercase font-bold text-gray-500">Paid Amount</p><p className="text-lg font-bold text-green-600">-{formatCurrency(stats.totalPaid)}</p></div><div className="border-2 border-black p-2 rounded bg-gray-50"><p className="text-xs uppercase font-bold text-black">Balance Due</p><p className="text-lg font-bold">{formatCurrency(stats.balanceDue)}</p></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div><h3 className="font-bold border-b border-gray-400 mb-2 pb-1">Work History</h3><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th>Date</th><th className="text-right">Output (Kg)</th></tr></thead><tbody className="divide-y">{stats.scopeEntries.sort((a,b) => a.date.localeCompare(b.date)).map((e, i) => (<tr key={i}><td className="py-1">{e.date}</td><td className="text-right font-medium">{e.value}</td></tr>))}<tr className="border-t-2 border-gray-300 font-bold bg-gray-50"><td className="py-1">Total</td><td className="text-right">{stats.totalKg.toFixed(1)}</td></tr></tbody></table></div>
            <div className="space-y-6"><div><h3 className="font-bold border-b border-gray-400 mb-2 pb-1">Advance History</h3><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th>Date</th><th className="text-right">Amount</th></tr></thead><tbody className="divide-y">{stats.scopeAdvances.map((a, i) => (<tr key={i}><td className="py-1">{a.date}</td><td className="text-right text-red-600 font-medium">{formatCurrency(a.amount)}</td></tr>))}</tbody></table></div>{stats.scopeRepayments.length > 0 && (<div><h3 className="font-bold border-b border-gray-400 mb-2 pb-1">Repayments (Returned)</h3><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th>Date</th><th className="text-right">Amount</th></tr></thead><tbody className="divide-y">{stats.scopeRepayments.map((r, i) => (<tr key={i}><td className="py-1">{r.date}</td><td className="text-right text-green-600 font-medium">{formatCurrency(r.amount)}</td></tr>))}</tbody></table></div>)}<div><h3 className="font-bold border-b border-gray-400 mb-2 pb-1">Salary Payments</h3><table className="w-full text-sm"><thead><tr className="text-left text-gray-500"><th>Date</th><th className="text-right">Amount</th></tr></thead><tbody className="divide-y">{stats.scopePayments.map((p, i) => (<tr key={i}><td className="py-1">{p.date}</td><td className="text-right text-green-600 font-bold">{formatCurrency(p.amount)}</td></tr>))}</tbody></table></div></div>
        </div>
      </div>
    </div>
  );
};

// --- Dashboard Component ---
const DashboardTab = ({ entries, factoryRecords, deletedLogs }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showHistory, setShowHistory] = useState(false);

  const dailyPlucked = useMemo(() => entries.filter(e => e.date === date).reduce((sum, e) => sum + (e.value || 0), 0), [entries, date]);
  const monthlyPlucked = useMemo(() => entries.filter(e => e.date.startsWith(month)).reduce((sum, e) => sum + (e.value || 0), 0), [entries, month]);
  const dailyFactory = useMemo(() => factoryRecords.filter(f => f.date === date).reduce((sum, f) => sum + (f.weight || 0), 0), [factoryRecords, date]);
  const monthlyFactory = useMemo(() => factoryRecords.filter(f => f.date.startsWith(month)).reduce((sum, f) => sum + (f.weight || 0), 0), [factoryRecords, month]);

  if (showHistory) {
      return (
          <div className="p-4 space-y-4 animate-fade-in pb-20">
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><History className="text-gray-600"/> ඉවත් කළ දත්ත (History)</h2>
                  <button onClick={() => setShowHistory(false)} className="bg-gray-200 px-4 py-2 rounded text-sm font-bold hover:bg-gray-300">Back</button>
              </div>
              <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-700"><tr><th className="p-3">දිනය/වේලාව</th><th className="p-3">වර්ගය</th><th className="p-3">විස්තර</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                          {deletedLogs.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-gray-400 italic">ඉවත් කළ දත්ත කිසිවක් නොමැත.</td></tr>}
                          {deletedLogs.sort((a,b) => (b.deletedAt?.seconds || 0) - (a.deletedAt?.seconds || 0)).map(log => (
                              <tr key={log.id} className="hover:bg-red-50">
                                  <td className="p-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(log.dateStr)}</td>
                                  <td className="p-3 font-bold text-red-600 text-xs uppercase">{log.type}</td>
                                  <td className="p-3 text-gray-700 text-xs">
                                      {log.data.name && <span className="block font-bold">{log.data.name}</span>}
                                      {log.data.amount && <span className="block">{formatCurrency(log.data.amount)}</span>}
                                      {log.data.value && <span className="block">{log.data.value} Kg</span>}
                                      {log.data.weight && <span className="block">{log.data.weight} Kg (Book: {log.data.bookNo})</span>}
                                      <span className="text-gray-400 text-[10px]">Orig Date: {log.data.date}</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-20">
       <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">දිනය (Day)</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-2 py-1 font-bold text-gray-700 text-sm focus:ring-2 focus:ring-green-500 outline-none" /></div>
            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">මාසය (Month)</label><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full border rounded-lg px-2 py-1 font-bold text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-2xl border border-green-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Sprout size={64} className="text-green-800" /></div>
                <h3 className="text-green-800 font-bold flex items-center gap-2 mb-4 relative z-10"><Sprout size={20}/> නෙලූ දළු (Plucked)</h3>
                <div className="flex justify-between items-end relative z-10">
                    <div><p className="text-[10px] text-green-600 uppercase font-bold tracking-wider">අද දින (Daily)</p><p className="text-3xl font-extrabold text-green-900">{dailyPlucked.toFixed(1)} <span className="text-sm font-medium">Kg</span></p></div>
                    <div className="text-right"><p className="text-[10px] text-green-600 uppercase font-bold tracking-wider">මාසික (Monthly)</p><p className="text-xl font-bold text-green-800">{monthlyPlucked.toFixed(1)} <span className="text-sm font-medium">Kg</span></p></div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border border-orange-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Factory size={64} className="text-orange-800" /></div>
                <h3 className="text-orange-800 font-bold flex items-center gap-2 mb-4 relative z-10"><Factory size={20}/> ෆැක්ටරි යැවූ (Factory)</h3>
                <div className="flex justify-between items-end relative z-10">
                    <div><p className="text-[10px] text-orange-600 uppercase font-bold tracking-wider">අද දින (Daily)</p><p className="text-3xl font-extrabold text-orange-900">{dailyFactory.toFixed(1)} <span className="text-sm font-medium">Kg</span></p></div>
                    <div className="text-right"><p className="text-[10px] text-orange-600 uppercase font-bold tracking-wider">මාසික (Monthly)</p><p className="text-xl font-bold text-orange-800">{monthlyFactory.toFixed(1)} <span className="text-sm font-medium">Kg</span></p></div>
                </div>
            </div>
       </div>
       <button onClick={() => setShowHistory(true)} className="w-full bg-gray-800 text-white p-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-gray-900 transition transform active:scale-95">
            <History size={20} /> ඉවත් කළ දත්ත බලන්න (View Deleted History)
       </button>
    </div>
  );
};

// --- Worker Profile ---
const WorkerProfile = ({ worker, entries, advances, repayments, payments, earnings, onBack, addPayment, deletePayment, deleteAdvance, setWorkerEarnings, addAdvance, addRepayment, deleteRepayment }) => {
  const [viewMode, setViewMode] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showReport, setShowReport] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [manualEarnings, setManualEarnings] = useState('');
  const [confirmData, setConfirmData] = useState({ isOpen: false, type: null, id: null });

  const currentEarnings = useMemo(() => {
    if (viewMode === 'daily') return (earnings.find(e => e.workerId === worker.id && e.date === selectedDate) || {}).amount || 0;
    return earnings.filter(e => e.workerId === worker.id && (e.date?.startsWith(selectedMonth) || e.month === selectedMonth)).reduce((sum, r) => sum + r.amount, 0);
  }, [earnings, worker.id, selectedDate, selectedMonth, viewMode]);

  useEffect(() => { setManualEarnings(currentEarnings > 0 ? currentEarnings.toString() : ''); }, [currentEarnings]);

  const stats = useMemo(() => {
    const isMatch = (d) => viewMode === 'daily' ? d === selectedDate : d.startsWith(selectedMonth);
    const sEntries = entries.filter(e => e.workerId === worker.id && isMatch(e.date));
    const sAdvances = advances.filter(a => a.workerId === worker.id && isMatch(a.date));
    const sRepayments = repayments.filter(r => r.workerId === worker.id && isMatch(r.date));
    const sPayments = payments.filter(p => p.workerId === worker.id && p.date && isMatch(p.date));
    
    let totalKg = 0; sEntries.forEach(e => totalKg += parseFloat(e.value || 0));
    const netAdvances = sAdvances.reduce((sum, a) => sum + a.amount, 0) - sRepayments.reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = sPayments.reduce((sum, p) => sum + p.amount, 0);
    return { totalKg, grossPay: currentEarnings, totalAdvancesReturned: sRepayments.reduce((sum, r) => sum + r.amount, 0), netAdvances, totalPaid, balanceDue: currentEarnings - netAdvances - totalPaid, scopeAdvances: sAdvances, scopeRepayments: sRepayments, scopePayments: sPayments, scopeEntries: sEntries };
  }, [worker, entries, advances, repayments, payments, selectedMonth, selectedDate, viewMode, currentEarnings]);

  const handleSetEarnings = (e) => { e.preventDefault(); const val = parseFloat(manualEarnings); if(isNaN(val)) return; if(viewMode === 'daily') setWorkerEarnings(worker.id, null, selectedDate, val); else setWorkerEarnings(worker.id, selectedMonth, null, val); };
  const handlePay = (e) => { e.preventDefault(); if(!payAmount) return; addPayment({ workerId: worker.id, date: selectedDate, month: selectedDate.slice(0, 7), amount: parseFloat(payAmount), timestamp: serverTimestamp() }); setPayAmount(''); };
  const handleAddAdvance = (e) => { e.preventDefault(); if(!advanceAmount) return; addAdvance({ workerId: worker.id, date: selectedDate, amount: parseFloat(advanceAmount), timestamp: serverTimestamp() }); setAdvanceAmount(''); };
  const handleAddRepayment = (e) => { e.preventDefault(); if(!repayAmount) return; addRepayment({ workerId: worker.id, date: selectedDate, amount: parseFloat(repayAmount), timestamp: serverTimestamp() }); setRepayAmount(''); };
  const requestDelete = (type, id) => setConfirmData({ isOpen: true, type, id });
  const confirmDelete = () => {
    if (confirmData.type === 'payment') deletePayment(confirmData.id);
    else if (confirmData.type === 'advance') deleteAdvance(confirmData.id);
    else if (confirmData.type === 'repayment') deleteRepayment(confirmData.id);
    setConfirmData({ isOpen: false, type: null, id: null });
  };

  if (showReport) return <DetailedReport worker={worker} stats={stats} month={selectedMonth} onClose={() => setShowReport(false)} />;

  return (
    <div className="p-4 space-y-4 bg-white min-h-full pb-20 animate-fade-in">
      <ConfirmModal isOpen={confirmData.isOpen} title="තහවුරු කරන්න" message="ඔබට මෙම දත්තය මැකීමට අවශ්‍ය බව විශ්වාසද?" onConfirm={confirmDelete} onCancel={() => setConfirmData({ isOpen: false, type: null, id: null })} />
      <div className="flex items-center justify-between mb-2 border-b pb-4"><div className="flex items-center gap-4"><button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition"><ArrowLeft size={24} className="text-gray-600" /></button><div><h2 className="text-2xl font-bold text-gray-800">{worker.name}</h2><p className="text-sm text-gray-500">{worker.category}</p></div></div><button onClick={() => setShowReport(true)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-md"><Printer size={20} /></button></div>
      
      {/* Worker Details View */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm text-gray-600">
          <p><strong>දුරකථන:</strong> {worker.phone || '-'}</p>
          <p><strong>ලිපිනය:</strong> {worker.address || '-'}</p>
          <p><strong>NIC:</strong> {worker.nic || '-'}</p>
          <p><strong>උපන් දිනය:</strong> {worker.dob || '-'}</p>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg mb-4"><button onClick={() => setViewMode('daily')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'daily' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>දවස (Day)</button><button onClick={() => setViewMode('monthly')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>මාසය (Month)</button></div>
      <div className={`p-3 rounded-lg border flex justify-between items-center transition-colors ${viewMode === 'daily' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}><span className="text-gray-700 font-medium">{viewMode === 'daily' ? 'දිනය:' : 'මාසය:'}</span>{viewMode === 'daily' ? <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedMonth(e.target.value.slice(0, 7)); }} className="p-2 border rounded-lg font-bold bg-white" /> : <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 border rounded-lg font-bold bg-white" />}</div>
      
      <div className="grid grid-cols-2 gap-3"><div className="bg-blue-50 p-3 rounded-xl border border-blue-100"><p className="text-xs text-blue-600 font-bold uppercase">වැඩ (Work)</p><p className="text-lg font-bold text-gray-800">{stats.totalKg.toFixed(1)} <span className="text-sm text-gray-500">Kg</span></p></div><div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200"><p className="text-xs text-yellow-700 font-bold uppercase">මුළු පඩිය (Gross)</p><form onSubmit={handleSetEarnings} className="flex gap-1 mt-1"><input type="number" value={manualEarnings} onChange={(e) => setManualEarnings(e.target.value)} className="w-full p-1 text-sm border border-yellow-300 rounded font-bold bg-white outline-none" placeholder="0.00" /><button type="submit" className="bg-yellow-500 text-white px-2 rounded"><Save size={14} /></button></form></div></div>
      <div className="grid grid-cols-2 gap-3"><div className="bg-red-50 p-3 rounded-xl border border-red-100"><p className="text-xs text-red-600 font-bold uppercase">අත්තිකාරම් (Net)</p><div className="flex items-baseline gap-1"><p className="text-xl font-bold text-red-700">-{formatCurrency(stats.netAdvances)}</p></div>{stats.totalAdvancesReturned > 0 && <p className="text-[10px] text-green-600 mt-1">පියවූ: +{formatCurrency(stats.totalAdvancesReturned)}</p>}</div><div className="bg-green-50 p-3 rounded-xl border border-green-100"><p className="text-xs text-green-600 font-bold uppercase">ගෙවූ මුදල්</p><p className="text-xl font-bold text-green-700">-{formatCurrency(stats.totalPaid)}</p></div></div>
      <div className={`p-6 rounded-xl border-2 text-center transition-colors ${stats.balanceDue <= 0 ? 'bg-green-100 border-green-300' : 'bg-white border-red-300'}`}><p className="text-sm text-gray-600 font-bold mb-1">{stats.balanceDue <= 0 ? 'ගෙවා අවසන්' : 'හිඟ මුදල'}</p>{stats.balanceDue <= 0 ? <div className="flex items-center justify-center gap-2 text-green-700"><CheckCircle size={32} /><span className="text-2xl font-bold">PAID</span></div> : <p className="text-3xl font-extrabold text-red-600">{formatCurrency(stats.balanceDue)}</p>}</div>
      <div className="space-y-4"><div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"><h3 className="font-bold text-gray-700 mb-2 text-sm flex items-center gap-2"><Wallet size={16} /> අත්තිකාරම් කළමනාකරණය</h3><div className="grid grid-cols-2 gap-3"><form onSubmit={handleAddAdvance}><label className="text-[10px] text-gray-500 uppercase font-bold">ගන්නා (Take)</label><div className="flex gap-1 mt-1"><input type="number" placeholder="Rs" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="w-full p-2 border border-red-200 rounded text-sm outline-none" /><button type="submit" className="bg-red-500 text-white px-3 rounded"><ArrowDownLeft size={16}/></button></div></form><form onSubmit={handleAddRepayment}><label className="text-[10px] text-gray-500 uppercase font-bold">පියවන (Return)</label><div className="flex gap-1 mt-1"><input type="number" placeholder="Rs" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} className="w-full p-2 border border-green-200 rounded text-sm outline-none" /><button type="submit" className="bg-green-500 text-white px-3 rounded"><ArrowUpRight size={16}/></button></div></form></div></div><div className="bg-white p-4 rounded-xl shadow-sm border border-green-200"><h3 className="font-bold text-green-800 mb-2 text-sm flex items-center gap-2"><CreditCard size={16} /> පඩි ගෙවීම (Salary Payment)</h3><form onSubmit={handlePay} className="flex gap-2"><input type="number" placeholder="මුදල (Rs)" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="flex-1 p-2 border rounded outline-none" /><button type="submit" className="bg-green-700 text-white px-4 rounded font-bold text-sm hover:bg-green-800">Pay</button></form></div></div>
      <div className="space-y-4 mt-2">
        {stats.scopeAdvances.length > 0 && (<div className="bg-gray-50 rounded-lg p-3 border border-gray-200"><h4 className="text-xs font-bold text-gray-500 uppercase mb-2">ගත්ත අත්තිකාරම්</h4>{stats.scopeAdvances.map(a => (<div key={a.id} className="flex justify-between text-sm py-1 border-b border-gray-200 last:border-0"><span>{a.date}</span><div className="flex items-center gap-2"><span className="text-red-600 font-bold">{formatCurrency(a.amount)}</span><button onClick={() => requestDelete('advance', a.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></div></div>))}</div>)}
        {stats.scopeRepayments.length > 0 && (<div className="bg-green-50 rounded-lg p-3 border border-green-100"><h4 className="text-xs font-bold text-green-700 uppercase mb-2">ආපසු ගෙවීම් (Returns)</h4>{stats.scopeRepayments.map(r => (<div key={r.id} className="flex justify-between text-sm py-1 border-b border-green-200 last:border-0"><span>{r.date}</span><div className="flex items-center gap-2"><span className="text-green-700 font-bold">{formatCurrency(r.amount)}</span><button onClick={() => requestDelete('repayment', r.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></div></div>))}</div>)}
      </div>
    </div>
  );
};

// --- Workers Tab ---
const WorkersTab = ({ workers, deleteWorker, addWorker, onSelectWorker }) => {
  const [newWorker, setNewWorker] = useState({ name: '', phone: '', address: '', nic: '', dob: '', category: 'Plucker' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const handleSubmit = (e) => { e.preventDefault(); if (!newWorker.name) return; addWorker({ ...newWorker, payType: 'Manual' }); setNewWorker({ name: '', phone: '', address: '', nic: '', dob: '', category: 'Plucker' }); setIsFormOpen(false); };
  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <ConfirmModal isOpen={!!deleteId} title="සේවකයා ඉවත් කිරීම" message="ඔබට මෙම සේවකයා ඉවත් කිරීමට අවශ්‍ය බව විශ්වාසද?" onConfirm={() => { deleteWorker(deleteId); setDeleteId(null); }} onCancel={() => setDeleteId(null)} />
      <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-green-800">සේවකයින්</h2><button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"><Plus size={18} /> අලුත්</button></div>
      {isFormOpen && (<form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md border border-green-100 mb-6 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={newWorker.name} onChange={(e) => setNewWorker({...newWorker, name: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="නම (Name)" />
            <input type="text" value={newWorker.phone} onChange={(e) => setNewWorker({...newWorker, phone: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="දුරකථන (Phone)" />
            <input type="text" value={newWorker.address} onChange={(e) => setNewWorker({...newWorker, address: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="ලිපිනය (Address)" />
            <input type="text" value={newWorker.nic} onChange={(e) => setNewWorker({...newWorker, nic: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="NIC (ජා.හැ.අ.)" />
            <input type="date" value={newWorker.dob} onChange={(e) => setNewWorker({...newWorker, dob: e.target.value})} className="w-full p-2 border rounded-lg" title="උපන් දිනය" />
            <select value={newWorker.category} onChange={(e) => setNewWorker({...newWorker, category: e.target.value})} className="w-full p-2 border rounded-lg"><option value="Plucker">දළු නෙලන</option><option value="Weeder">වල් නෙලන</option><option value="Sundry">වෙනත්</option><option value="Cinnamon">කුරුඳු</option></select>
          </div>
          <div className="mt-4 flex justify-end"><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">සේව්</button></div>
      </form>)}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{workers.map(worker => (<div key={worker.id} onClick={() => onSelectWorker(worker)} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500 flex justify-between items-center cursor-pointer hover:bg-green-50 transition"><div><h3 className="font-bold text-gray-800 text-lg">{worker.name}</h3><p className="text-sm text-gray-500">{worker.category}</p></div><button onClick={(e) => { e.stopPropagation(); setDeleteId(worker.id); }} className="text-red-400 p-2 hover:bg-red-50 rounded-full transition"><Trash2 size={18} /></button></div>))}</div>
    </div>
  );
};

// --- Daily Log Tab ---
const DailyLogTab = ({ workers, entries, addEntry, date, setDate, onDelete }) => {
  const [inputs, setInputs] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, data }
  const dailyTotalKg = useMemo(() => entries.filter(e => e.date === date).reduce((sum, e) => sum + parseFloat(e.value || 0), 0), [entries, date]);
  const handleSave = (worker) => { const val = inputs[worker.id]; if (!val) return; addEntry({ workerId: worker.id, workerName: worker.name, date: date, type: 'kg', value: parseFloat(val) }); setInputs(prev => ({...prev, [worker.id]: ''})); };
  const getExistingEntry = (workerId) => entries.find(e => e.workerId === workerId && e.date === date);

  return (
    <div className="p-4 space-y-4 animate-fade-in pb-20">
      <ConfirmModal isOpen={!!deleteConfirm} title="දත්ත ඉවත් කිරීම" message="මෙම වාර්තාව මකා දැමීමට අවශ්‍යද?" onConfirm={() => { onDelete('work_entries', deleteConfirm.id, deleteConfirm.data); setDeleteConfirm(null); }} onCancel={() => setDeleteConfirm(null)} />
      <div className="bg-green-700 text-white p-4 rounded-xl shadow-lg mb-4 flex justify-between items-end"><div><p className="text-green-100 text-sm">අද එකතුව (Kg)</p><h1 className="text-4xl font-bold">{dailyTotalKg.toFixed(2)}</h1></div><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-green-800 text-white border border-green-600 rounded p-1" /></div>
      <div className="space-y-3">{workers.map(worker => {
          const existing = getExistingEntry(worker.id);
          return (<div key={worker.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between"><div className="flex-1"><p className="font-semibold text-gray-800">{worker.name}</p><span className="text-xs text-gray-500 bg-gray-100 px-2 rounded">{worker.category}</span></div><div className="flex items-center gap-2">{existing ? <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold border border-green-200"><span>{existing.value} Kg</span><button onClick={() => setDeleteConfirm({ id: existing.id, data: existing })} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></div> : <div className="flex gap-2"><input type="number" placeholder="Kg" className="w-20 p-2 border rounded-lg text-right" value={inputs[worker.id] || ''} onChange={(e) => setInputs(prev => ({...prev, [worker.id]: e.target.value}))} /><button onClick={() => handleSave(worker)} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition"><Save size={18} /></button></div>}</div></div>);
      })}</div>
    </div>
  );
};

// --- Factory Tab ---
const FactoryTab = ({ factoryRecords, addFactoryRecord, deleteFactoryRecord, bookNumbers, addBookNumber, deleteBookNumber }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookNo, setBookNo] = useState('');
  const [weight, setWeight] = useState('');
  const [newBookName, setNewBookName] = useState('');
  const [showBookManager, setShowBookManager] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'record'|'book', id, data }

  useEffect(() => { if (bookNumbers.length > 0 && !bookNo) setBookNo(bookNumbers[0].name); }, [bookNumbers]);
  const handleSave = (e) => { e.preventDefault(); if (!weight || !bookNo) return; addFactoryRecord({ date, bookNo, weight: parseFloat(weight) }); setWeight(''); };
  const handleAddBook = (e) => { e.preventDefault(); if(!newBookName) return; addBookNumber({ name: newBookName }); setNewBookName(''); };
  const summary = useMemo(() => { const sums = {}; factoryRecords.forEach(r => { sums[r.bookNo] = (sums[r.bookNo] || 0) + r.weight; }); return sums; }, [factoryRecords]);

  const confirmDelete = () => {
      if (deleteConfirm.type === 'record') deleteFactoryRecord(deleteConfirm.id, deleteConfirm.data);
      else deleteBookNumber(deleteConfirm.id);
      setDeleteConfirm(null);
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-20">
      <ConfirmModal isOpen={!!deleteConfirm} title="දත්ත ඉවත් කිරීම" message="මෙම දත්තය මකා දැමීමට අවශ්‍යද?" onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(null)} />
      <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Factory className="text-orange-500" /> ෆැක්ටරි</h2><button onClick={() => setShowBookManager(!showBookManager)} className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition">පොත් සැකසුම්</button></div>
      {showBookManager && (<div className="bg-gray-100 p-3 rounded-lg border border-gray-300 animate-slide-down"><form onSubmit={handleAddBook} className="flex gap-2 mb-3"><input type="text" placeholder="පොත් නම (උදා: Book A)" value={newBookName} onChange={e => setNewBookName(e.target.value)} className="flex-1 p-2 border rounded text-sm" /><button type="submit" className="bg-orange-500 text-white px-3 rounded text-sm">Add</button></form><div className="flex flex-wrap gap-2">{bookNumbers.map(book => (<span key={book.id} className="bg-white border border-gray-300 px-2 py-1 rounded text-xs flex items-center gap-2">{book.name}<button onClick={() => setDeleteConfirm({ type: 'book', id: book.id })} className="text-red-400">x</button></span>))}</div></div>)}
      <div className="bg-white p-4 rounded-xl shadow-md border-t-4 border-orange-500"><form onSubmit={handleSave} className="space-y-3"><div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-gray-500">දිනය</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded" /></div><div><label className="text-xs text-gray-500">පොත</label>{bookNumbers.length > 0 ? <select value={bookNo} onChange={e => setBookNo(e.target.value)} className="w-full p-2 border rounded">{bookNumbers.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}</select> : <div className="text-red-500 text-xs">පොත් අංකයක් සාදන්න.</div>}</div></div><div><label className="text-xs text-gray-500">බර (Kg)</label><input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2 border rounded" /></div><button type="submit" disabled={bookNumbers.length === 0} className="w-full bg-orange-500 text-white py-2 rounded font-semibold hover:bg-orange-600 transition">ඇතුලත් කරන්න</button></form></div>
      <div><h3 className="font-bold text-gray-700 mb-2">මුළු එකතුව (Total)</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Object.entries(summary).map(([book, total]) => (<div key={book} className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-center"><div className="text-xs text-orange-600 font-bold uppercase">{book}</div><div className="text-xl font-bold text-gray-800">{total.toFixed(1)}</div></div>))}</div></div>
      <div className="bg-white rounded-lg shadow overflow-hidden"><table className="min-w-full text-sm text-left"><thead className="bg-gray-100"><tr><th className="p-3">දිනය</th><th className="p-3">පොත</th><th className="p-3 text-right">Kg</th><th className="p-3"></th></tr></thead><tbody>{factoryRecords.sort((a,b)=>b.date.localeCompare(a.date)).map(rec => (<tr key={rec.id} className="border-t"><td className="p-3">{rec.date}</td><td className="p-3 font-medium">{rec.bookNo}</td><td className="p-3 text-right">{rec.weight}</td><td className="p-3"><button onClick={()=>setDeleteConfirm({ type: 'record', id: rec.id, data: rec })} className="text-red-400"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
    </div>
  );
};

// --- Payroll Tab ---
const PayrollTab = ({ workers, entries, advances, repayments, earnings, payments, onSelectWorker }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const payrollData = useMemo(() => {
    return workers.map(worker => {
      const workerEntries = entries.filter(e => e.workerId === worker.id && e.date.startsWith(selectedMonth));
      const workerAdvances = advances.filter(a => a.workerId === worker.id && a.date.startsWith(selectedMonth));
      const workerRepayments = repayments.filter(r => r.workerId === worker.id && r.date.startsWith(selectedMonth));
      const workerPayments = payments.filter(p => p.workerId === worker.id && p.date.startsWith(selectedMonth));
      
      const workerMonthlyEarningsRecs = earnings.filter(e => { if (e.workerId !== worker.id) return false; if (e.date && e.date.startsWith(selectedMonth)) return true; if (e.month === selectedMonth) return true; return false; });
      const grossPay = workerMonthlyEarningsRecs.reduce((sum, r) => sum + r.amount, 0);
      
      let totalKg = 0; workerEntries.forEach(e => totalKg += parseFloat(e.value || 0));
      
      const totalAdvancesTaken = workerAdvances.reduce((sum, a) => sum + a.amount, 0);
      const totalAdvancesReturned = workerRepayments.reduce((sum, r) => sum + r.amount, 0);
      const netAdvances = totalAdvancesTaken - totalAdvancesReturned;
      
      const totalPaid = workerPayments.reduce((sum, p) => sum + p.amount, 0);
      return { ...worker, totalKg, grossPay, netAdvances, totalPaid, balanceDue: grossPay - netAdvances - totalPaid };
    });
  }, [workers, entries, advances, repayments, payments, selectedMonth, earnings]);

  return (
    <div className="p-4 space-y-6 print:p-0 animate-fade-in pb-20">
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center print:hidden">
          <div><label className="text-xs text-gray-500 block">වාර්තා මාසය</label><input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 border rounded font-bold" /></div>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 hover:bg-blue-700 transition"><Printer size={18} /> Report</button>
      </div>
      <div className="overflow-x-auto print:overflow-visible">
        <div className="hidden print:block text-center mb-4"><h1 className="text-2xl font-bold">Estate Report: {selectedMonth}</h1></div>
        <div className="bg-white rounded-lg shadow overflow-hidden print:shadow-none print:border">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-800 text-white print:bg-gray-200 print:text-black"><tr><th className="p-3">නම</th><th className="p-3 text-right">Kg</th><th className="p-3 text-right">පඩිය</th><th className="p-3 text-right">අත්ති.(Net)</th><th className="p-3 text-right">ගෙවූ</th><th className="p-3 text-right font-bold">හිඟ</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{payrollData.map(data => (
                <tr key={data.id} className="hover:bg-purple-50 cursor-pointer transition" onClick={() => onSelectWorker(data)}>
                  <td className="p-3 font-medium">{data.name}</td><td className="p-3 text-right text-gray-600">{data.totalKg.toFixed(1)}</td><td className="p-3 text-right">{data.grossPay > 0 ? formatCurrency(data.grossPay) : '-'}</td><td className="p-3 text-right text-red-500">{data.netAdvances !== 0 ? `-${formatCurrency(data.netAdvances)}` : '-'}</td><td className="p-3 text-right text-green-600">{data.totalPaid > 0 ? `-${data.totalPaid}` : '-'}</td><td className={`p-3 text-right font-bold ${data.balanceDue <= 0 ? 'text-green-600' : 'text-red-600'}`}>{data.balanceDue <= 0 ? 'PAID' : data.balanceDue.toLocaleString()}</td>
                </tr>))}</tbody>
          </table>
        </div>
      </div>
      <style>{`@media print { @page { size: A4; margin: 20mm; } body * { visibility: hidden; } .print\\:block, .print\\:block * { visibility: visible; } .overflow-x-auto { overflow: visible !important; } .pb-safe { display: none !important; } header { display: none !important; } }`}</style>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [factoryRecords, setFactoryRecords] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [repayments, setRepayments] = useState([]); 
  const [payments, setPayments] = useState([]);
  const [bookNumbers, setBookNumbers] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [deletedLogs, setDeletedLogs] = useState([]); 
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { const loggedIn = localStorage.getItem('estate_login'); if (loggedIn === 'true') setIsAuthenticated(true); }, []);
  useEffect(() => { if (app && isAuthenticated) { signInAnonymously(auth).catch(e => console.error(e)); const unsub = onAuthStateChanged(auth, setUser); return unsub; } }, [isAuthenticated]);
  useEffect(() => { const script = document.createElement('script'); script.src = "https://cdn.tailwindcss.com"; script.async = true; document.head.appendChild(script); if (!document.querySelector('meta[name="viewport"]')) { const meta = document.createElement('meta'); meta.name = "viewport"; meta.content = "width=device-width, initial-scale=1.0"; document.getElementsByTagName('head')[0].appendChild(meta); } }, []);

  useEffect(() => { if (!user) return; 
    const uW = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'workers')), s => setWorkers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uE = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'work_entries')), s => setEntries(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uF = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'factory_records')), s => setFactoryRecords(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uA = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'advances')), s => setAdvances(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uR = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'repayments')), s => setRepayments(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uP = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'payments')), s => setPayments(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uB = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'book_numbers')), s => setBookNumbers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uEr = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'earnings')), s => setEarnings(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uDl = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'deleted_logs')), s => setDeletedLogs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { uW(); uE(); uF(); uA(); uR(); uP(); uB(); uEr(); uDl(); };
  }, [user]);

  const addDocTo = (col, d) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', col), d);
  const deleteWithLog = async (col, id, data) => {
    if (!data) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'deleted_logs'), { originalCollection: col, type: col === 'workers' ? 'Worker' : col === 'work_entries' ? 'Work Entry' : col === 'advances' ? 'Advance' : col === 'payments' ? 'Payment' : 'Record', data: data, deletedAt: serverTimestamp(), dateStr: new Date().toISOString() });
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
    } catch (e) { console.error("Error deleting", e); }
  };

  const setWorkerEarnings = async (workerId, month, date, amount) => {
    let id = date ? `${workerId}_${date}` : `${workerId}_${month}`;
    let data = { workerId, amount, timestamp: serverTimestamp() };
    if (date) data.date = date; else data.month = month;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'earnings', id), data);
  };

  const handleLogin = () => { setIsAuthenticated(true); localStorage.setItem('estate_login', 'true'); };
  const handleLogout = () => { setIsAuthenticated(false); setUser(null); localStorage.removeItem('estate_login'); };

  if (!firebaseConfig.apiKey) return <div className="flex flex-col items-center justify-center h-screen p-4 text-center"><h2 className="text-xl font-bold text-red-600 mb-2">Setup Required</h2><p>Please copy your Firebase Config.</p></div>;
  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;
  if (!user) return <div className="flex items-center justify-center h-screen text-green-600 animate-pulse font-bold">Loading System...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-green-800 text-white p-4 sticky top-0 z-50 shadow-md print:hidden"><div className="flex justify-between items-center max-w-4xl mx-auto"><div className="flex items-center gap-2"><Sprout size={28} /><h1 className="text-xl font-bold">Estate Manager</h1></div><button onClick={handleLogout} className="text-xs bg-green-900 px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1 transition"><LogOut size={12}/> Logout</button></div></header>
      <main className="flex-1 max-w-4xl mx-auto w-full mb-20 overflow-y-auto print:mb-0">
        {selectedWorker ? 
          <WorkerProfile 
            worker={selectedWorker} entries={entries} advances={advances} repayments={repayments} payments={payments} earnings={earnings} 
            onBack={() => setSelectedWorker(null)} 
            addPayment={(d) => addDocTo('payments', d)} 
            addAdvance={(d) => addDocTo('advances', d)} 
            addRepayment={(d) => addDocTo('repayments', d)} 
            deletePayment={(id) => { const item = payments.find(p => p.id === id); deleteWithLog('payments', id, item); }} 
            deleteAdvance={(id) => { const item = advances.find(a => a.id === id); deleteWithLog('advances', id, item); }} 
            deleteRepayment={(id) => { const item = repayments.find(r => r.id === id); deleteWithLog('repayments', id, item); }} 
            setWorkerEarnings={setWorkerEarnings} 
          /> : 
        (<>
            {activeTab === 'home' && <DashboardTab entries={entries} factoryRecords={factoryRecords} deletedLogs={deletedLogs} />}
            {activeTab === 'daily' && <DailyLogTab workers={workers} entries={entries} addEntry={(d) => addDocTo('work_entries', d)} date={currentDate} setDate={setCurrentDate} onDelete={(col, id, data) => deleteWithLog(col, id, data)} />}
            {activeTab === 'workers' && <WorkersTab workers={workers} deleteWorker={(id) => { const item = workers.find(w => w.id === id); deleteWithLog('workers', id, item); }} addWorker={(d) => addDocTo('workers', d)} onSelectWorker={setSelectedWorker} />}
            {activeTab === 'factory' && <FactoryTab factoryRecords={factoryRecords} addFactoryRecord={(d) => addDocTo('factory_records', d)} deleteFactoryRecord={(id, data) => deleteWithLog('factory_records', id, data)} bookNumbers={bookNumbers} addBookNumber={(d) => addDocTo('book_numbers', d)} deleteBookNumber={(id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'book_numbers', id))} />}
            {activeTab === 'payroll' && <PayrollTab workers={workers} entries={entries} advances={advances} repayments={repayments} earnings={earnings} payments={payments} onSelectWorker={setSelectedWorker} />}
        </>)}
      </main>
      {!selectedWorker && <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe print:hidden"><div className="flex justify-around items-center h-16 max-w-4xl mx-auto">
        <NavBtn active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={24} />} label="Home" />
        <NavBtn active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<ClipboardList size={24} />} label="Work" />
        <NavBtn active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} icon={<Wallet size={24} />} label="Pay" />
        <NavBtn active={activeTab === 'factory'} onClick={() => setActiveTab('factory')} icon={<Factory size={24} />} label="Factory" />
        <NavBtn active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} icon={<Users size={24} />} label="Team" />
      </div></nav>}
    </div>
  );
}
const NavBtn = ({ active, onClick, icon, label }) => (<button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>{icon}<span className="text-[10px] font-medium mt-1">{label}</span></button>);
