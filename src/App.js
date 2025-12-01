import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Sprout, ClipboardList, Wallet, Factory, Plus, Save, Trash2, 
  ArrowLeft, CreditCard, AlertTriangle, FileText, CheckCircle, Printer, Calendar as CalendarIcon 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, setDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';

// --- Firebase Configuration ---
// වැදගත්: මෙතනට ඔබේ Firebase Project එකේ Config ටික පේස්ට් කරන්න.
// (Important: Paste your Firebase Config here)
const firebaseConfig = {
  apiKey: "AIzaSyAOA8FblPLzOWDEswPipXfzqIuvWY6ZUvA",
  authDomain: "tea-estate-app.firebaseapp.com",
  projectId: "tea-estate-app",
  storageBucket: "tea-estate-app.firebasestorage.app",
  messagingSenderId: "85406491956",
  appId: "1:85406491956:web:b551572166ded2266eb161"

  // apiKey: "AIzaSy...",
  // authDomain: "your-project.firebaseapp.com",
  // projectId: "your-project",
  // storageBucket: "your-project.appspot.com",
  // messagingSenderId: "...",
  // appId: "..."
};

// Config එක දාලා නැත්නම් Error එකක් පෙන්වීම සඳහා
if (!firebaseConfig.apiKey) {
  console.error("Please replace the firebaseConfig object with your actual keys in App.js!");
}

// Initialize Firebase only if config is present (to avoid crashes before config)
const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = 'my-tea-estate-v3'; 

// --- Helper Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('si-LK', { style: 'currency', currency: 'LKR' }).format(amount);
};

// --- Custom Confirmation Modal ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">නැත</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700">ඔව්, මකන්න</button>
        </div>
      </div>
    </div>
  );
};

// --- Worker Profile Component ---
const WorkerProfile = ({ worker, entries, advances, payments, earnings, onBack, addPayment, deletePayment, deleteAdvance, setWorkerEarnings, addAdvance }) => {
  const [viewMode, setViewMode] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payAmount, setPayAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [manualEarnings, setManualEarnings] = useState('');
  const [confirmData, setConfirmData] = useState({ isOpen: false, type: null, id: null });

  const currentEarnings = useMemo(() => {
    if (viewMode === 'daily') {
       const rec = earnings.find(e => e.workerId === worker.id && e.date === selectedDate);
       return rec ? rec.amount : 0;
    } else {
       const monthlyRecs = earnings.filter(e => {
         if (e.workerId !== worker.id) return false;
         if (e.date && e.date.startsWith(selectedMonth)) return true;
         if (e.month === selectedMonth) return true;
         return false;
       });
       return monthlyRecs.reduce((sum, r) => sum + r.amount, 0);
    }
  }, [earnings, worker.id, selectedDate, selectedMonth, viewMode]);

  useEffect(() => {
    setManualEarnings(currentEarnings > 0 ? currentEarnings.toString() : '');
  }, [currentEarnings]);

  const stats = useMemo(() => {
    let scopeEntries = [], scopeAdvances = [], scopePayments = [];
    if (viewMode === 'daily') {
        scopeEntries = entries.filter(e => e.workerId === worker.id && e.date === selectedDate);
        scopeAdvances = advances.filter(a => a.workerId === worker.id && a.date === selectedDate);
        scopePayments = payments.filter(p => p.workerId === worker.id && p.date === selectedDate);
    } else {
        scopeEntries = entries.filter(e => e.workerId === worker.id && e.date.startsWith(selectedMonth));
        scopeAdvances = advances.filter(a => a.workerId === worker.id && a.date.startsWith(selectedMonth));
        scopePayments = payments.filter(p => p.workerId === worker.id && p.date.startsWith(selectedMonth));
    }
    
    let totalKg = 0, daysWorked = 0;
    scopeEntries.forEach(e => { totalKg += parseFloat(e.value || 0); daysWorked += 1; });

    const grossPay = currentEarnings;
    const totalAdvances = scopeAdvances.reduce((sum, a) => sum + a.amount, 0);
    const totalPaid = scopePayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = grossPay - totalAdvances - totalPaid;

    return { totalKg, daysWorked, grossPay, totalAdvances, totalPaid, balanceDue, scopeAdvances, scopePayments };
  }, [worker, entries, advances, payments, selectedMonth, selectedDate, viewMode, currentEarnings]);

  const handleSetEarnings = (e) => {
    e.preventDefault();
    const amount = parseFloat(manualEarnings);
    if (isNaN(amount)) return;
    if (viewMode === 'daily') {
        setWorkerEarnings(worker.id, null, selectedDate, amount);
    } else {
        setWorkerEarnings(worker.id, selectedMonth, null, amount);
    }
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!payAmount) return;
    addPayment({
      workerId: worker.id, date: selectedDate, month: selectedDate.slice(0, 7),
      amount: parseFloat(payAmount), timestamp: serverTimestamp()
    });
    setPayAmount('');
  };

  const handleAddAdvance = (e) => {
    e.preventDefault();
    if (!advanceAmount) return;
    addAdvance({
      workerId: worker.id, date: selectedDate,
      amount: parseFloat(advanceAmount), timestamp: serverTimestamp()
    });
    setAdvanceAmount('');
  };

  const requestDelete = (type, id) => setConfirmData({ isOpen: true, type, id });
  const confirmDelete = () => {
    if (confirmData.type === 'payment') deletePayment(confirmData.id);
    else if (confirmData.type === 'advance') deleteAdvance(confirmData.id);
    setConfirmData({ isOpen: false, type: null, id: null });
  };

  return (
    <div className="p-4 space-y-4 bg-white min-h-full pb-20">
      <ConfirmModal isOpen={confirmData.isOpen} title="තහවුරු කරන්න" message="මෙම වාර්තාව මකා දැමීමට අවශ්‍යද?" onConfirm={confirmDelete} onCancel={() => setConfirmData({ isOpen: false, type: null, id: null })} />
      
      <div className="flex items-center gap-4 mb-2 border-b pb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100"><ArrowLeft size={24} className="text-gray-600" /></button>
        <div><h2 className="text-2xl font-bold text-gray-800">{worker.name}</h2><p className="text-sm text-gray-500">{worker.category}</p></div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
        <button onClick={() => setViewMode('daily')} className={`flex-1 py-2 text-sm font-bold rounded-md ${viewMode === 'daily' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>දවස (Day)</button>
        <button onClick={() => setViewMode('monthly')} className={`flex-1 py-2 text-sm font-bold rounded-md ${viewMode === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>මාසය (Month)</button>
      </div>

      <div className={`p-3 rounded-lg border flex justify-between items-center ${viewMode === 'daily' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <span className="text-gray-700 font-medium">{viewMode === 'daily' ? 'දිනය:' : 'මාසය:'}</span>
        {viewMode === 'daily' ? (
            <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedMonth(e.target.value.slice(0, 7)); }} className="p-2 border rounded-lg font-bold" />
        ) : (
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 border rounded-lg font-bold" />
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
        <div><p className="text-xs text-gray-500 font-bold uppercase">වැඩ (Work)</p><p className="text-lg font-bold text-gray-800">{stats.totalKg.toFixed(1)} Kg</p></div>
        {viewMode === 'monthly' && <div><p className="text-xs text-gray-500 font-bold uppercase">දින</p><p className="text-lg font-bold text-gray-800">{stats.daysWorked}</p></div>}
      </div>

      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
        <label className="text-xs text-yellow-700 font-bold uppercase block mb-2">{viewMode === 'daily' ? 'අද දවසේ පඩිය' : 'මුළු මාසික පඩිය'}</label>
        <form onSubmit={handleSetEarnings} className="flex gap-2">
            <input type="number" value={manualEarnings} onChange={(e) => setManualEarnings(e.target.value)} placeholder="මුදල (Rs)" className="flex-1 p-2 border border-yellow-300 rounded font-bold outline-none" />
            <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded font-medium"><Save size={18} /></button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-xs text-red-600 font-bold">අත්තිකාරම්</p><p className="text-xl font-bold text-red-700">-{formatCurrency(stats.totalAdvances)}</p></div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-green-600 font-bold">ගෙවූ මුදල්</p><p className="text-xl font-bold text-green-700">-{formatCurrency(stats.totalPaid)}</p></div>
      </div>

      <div className={`p-6 rounded-xl border-2 text-center ${stats.balanceDue <= 0 ? 'bg-green-100 border-green-300' : 'bg-white border-red-300'}`}>
        <p className="text-sm text-gray-600 font-bold mb-1">{stats.balanceDue <= 0 ? 'ගෙවා අවසන්' : 'හිඟ මුදල'}</p>
        {stats.balanceDue <= 0 ? <div className="flex items-center justify-center gap-2 text-green-700"><CheckCircle size={32} /><span className="text-2xl font-bold">PAID</span></div> : <p className="text-3xl font-extrabold text-red-600">{formatCurrency(stats.balanceDue)}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200">
            <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2"><Wallet className="text-red-500" size={18} /> අත්තිකාරම්</h3>
            <form onSubmit={handleAddAdvance} className="flex gap-2">
                <input type="number" placeholder="මුදල (Rs)" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="flex-1 p-2 border rounded outline-none" />
                <button type="submit" className="bg-red-500 text-white px-3 rounded font-bold text-sm">Add</button>
            </form>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
            <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2"><CreditCard className="text-green-600" size={18} /> ගෙවීම්</h3>
            <form onSubmit={handlePay} className="flex gap-2">
                <input type="number" placeholder="මුදල (Rs)" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="flex-1 p-2 border rounded outline-none" />
                <button type="submit" className="bg-green-600 text-white px-3 rounded font-bold text-sm">Pay</button>
            </form>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <div>
          <h4 className="font-bold text-gray-700 mb-2 text-sm">අත්තිකාරම් ඉතිහාසය</h4>
          <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            {stats.scopeAdvances.map(a => (
              <div key={a.id} className="flex justify-between p-3 border-b border-gray-200 last:border-0"><span className="text-sm text-gray-600">{a.date}</span><div className="flex items-center gap-3"><span className="font-bold text-red-600">{formatCurrency(a.amount)}</span><button onClick={() => requestDelete('advance', a.id)} className="text-red-300 hover:text-red-600"><Trash2 size={16} /></button></div></div>
            ))}
          </div>
        </div>
        <div>
           <h4 className="font-bold text-gray-700 mb-2 text-sm">ගෙවීම් ඉතිහාසය</h4>
           <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            {stats.scopePayments.map(p => (
              <div key={p.id} className="flex justify-between p-3 border-b border-gray-200 last:border-0"><span className="text-sm text-gray-600">{p.date}</span><div className="flex items-center gap-3"><span className="font-bold text-green-700">{formatCurrency(p.amount)}</span><button onClick={() => requestDelete('payment', p.id)} className="text-red-300 hover:text-red-600"><Trash2 size={16} /></button></div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Workers Tab ---
const WorkersTab = ({ workers, deleteWorker, addWorker, onSelectWorker }) => {
  const [newWorker, setNewWorker] = useState({ name: '', phone: '', category: 'Plucker' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleSubmit = (e) => { e.preventDefault(); if (!newWorker.name) return; addWorker({ ...newWorker, payType: 'Manual' }); setNewWorker({ name: '', phone: '', category: 'Plucker' }); setIsFormOpen(false); };
  const confirmDelete = () => { if (deleteId) { deleteWorker(deleteId); setDeleteId(null); } };

  return (
    <div className="p-4 space-y-4">
      <ConfirmModal isOpen={!!deleteId} title="සේවකයා ඉවත් කිරීම" message="ඔබට විශ්වාසද?" onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
      <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-green-800">සේවකයින්</h2><button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> අලුත්</button></div>
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md border border-green-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={newWorker.name} onChange={(e) => setNewWorker({...newWorker, name: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="නම" />
            <input type="text" value={newWorker.phone} onChange={(e) => setNewWorker({...newWorker, phone: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="දුරකථන" />
            <select value={newWorker.category} onChange={(e) => setNewWorker({...newWorker, category: e.target.value})} className="w-full p-2 border rounded-lg"><option value="Plucker">දළු නෙලන</option><option value="Weeder">වල් නෙලන</option><option value="Sundry">වෙනත්</option><option value="Cinnamon">කුරුඳු</option></select>
          </div>
          <div className="mt-4 flex justify-end"><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg">සේව්</button></div>
        </form>
      )}
      <div className="grid grid-cols-1 gap-3">
        {workers.map(worker => (
          <div key={worker.id} onClick={() => onSelectWorker(worker)} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500 flex justify-between items-center cursor-pointer hover:bg-green-50">
            <div><h3 className="font-bold text-gray-800 text-lg">{worker.name}</h3><p className="text-sm text-gray-500">{worker.category}</p></div>
            <button onClick={(e) => { e.stopPropagation(); setDeleteId(worker.id);