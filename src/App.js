import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Sprout, ClipboardList, Wallet, Factory, Plus, Save, Trash2, 
  ArrowLeft, CreditCard, AlertTriangle, FileText, CheckCircle, Printer, Lock, LogIn, LogOut 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp, setDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Firebase Configuration ---
// වැදගත්: මෙතනට ඔබේ Firebase Project එකේ Config ටික පේස්ට් කරන්න.
const firebaseConfig = {
  apiKey: "AIzaSyAOA8FblPLzOWDEswPipXfzqIuvWY6ZUvA",
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
const appId = 'my-tea-estate-v4'; 

// --- Helper Functions ---
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('si-LK', { style: 'currency', currency: 'LKR' }).format(amount);
};

// --- Login Screen Component ---
const LoginScreen = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // ආරක්ෂිත PIN අංකය (Default: 12345)
    if (pin === '12345') {
      onLogin();
    } else {
      setError('PIN අංකය වැරදියි. නැවත උත්සාහ කරන්න.');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-600 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <Sprout size={48} className="text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Estate Manager</h1>
        <p className="text-center text-gray-500 mb-8">පද්ධතියට ඇතුළු වීමට PIN අංකය භාවිතා කරන්න.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PIN අංකය</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-center text-2xl tracking-widest"
                placeholder="•••••"
                maxLength={5}
                autoFocus
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
          </div>
          
          <button 
            type="submit" 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            ඇතුළු වන්න (Login)
          </button>
        </form>
        <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">Secure System v4.0</p>
        </div>
      </div>
    </div>
  );
};

// --- Custom Confirmation Modal ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full border border-gray-100">
        <div className="flex items-center gap-3 text-red-600 mb-3">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors">නැත</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">ඔව්, මකන්න</button>
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
    <div className="p-4 space-y-4 bg-white min-h-full pb-20 animate-fade-in">
      <ConfirmModal isOpen={confirmData.isOpen} title="තහවුරු කරන්න" message="මෙම වාර්තාව මකා දැමීමට අවශ්‍යද?" onConfirm={confirmDelete} onCancel={() => setConfirmData({ isOpen: false, type: null, id: null })} />
      
      <div className="flex items-center gap-4 mb-2 border-b pb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition"><ArrowLeft size={24} className="text-gray-600" /></button>
        <div><h2 className="text-2xl font-bold text-gray-800">{worker.name}</h2><p className="text-sm text-gray-500">{worker.category}</p></div>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
        <button onClick={() => setViewMode('daily')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'daily' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>දවස (Day)</button>
        <button onClick={() => setViewMode('monthly')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${viewMode === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}>මාසය (Month)</button>
      </div>

      <div className={`p-3 rounded-lg border flex justify-between items-center transition-colors ${viewMode === 'daily' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <span className="text-gray-700 font-medium">{viewMode === 'daily' ? 'දිනය:' : 'මාසය:'}</span>
        {viewMode === 'daily' ? (
            <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSelectedMonth(e.target.value.slice(0, 7)); }} className="p-2 border rounded-lg font-bold bg-white" />
        ) : (
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 border rounded-lg font-bold bg-white" />
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex justify-between items-center">
        <div><p className="text-xs text-gray-500 font-bold uppercase">වැඩ (Work)</p><p className="text-lg font-bold text-gray-800">{stats.totalKg.toFixed(1)} Kg</p></div>
        {viewMode === 'monthly' && <div><p className="text-xs text-gray-500 font-bold uppercase">දින</p><p className="text-lg font-bold text-gray-800">{stats.daysWorked}</p></div>}
      </div>

      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
        <label className="text-xs text-yellow-700 font-bold uppercase block mb-2">{viewMode === 'daily' ? 'අද දවසේ පඩිය' : 'මුළු මාසික පඩිය'}</label>
        <form onSubmit={handleSetEarnings} className="flex gap-2">
            <input type="number" value={manualEarnings} onChange={(e) => setManualEarnings(e.target.value)} placeholder="මුදල (Rs)" className="flex-1 p-2 border border-yellow-300 rounded font-bold outline-none bg-white" />
            <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded font-medium hover:bg-yellow-600 transition"><Save size={18} /></button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-xs text-red-600 font-bold">අත්තිකාරම්</p><p className="text-xl font-bold text-red-700">-{formatCurrency(stats.totalAdvances)}</p></div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-green-600 font-bold">ගෙවූ මුදල්</p><p className="text-xl font-bold text-green-700">-{formatCurrency(stats.totalPaid)}</p></div>
      </div>

      <div className={`p-6 rounded-xl border-2 text-center transition-colors ${stats.balanceDue <= 0 ? 'bg-green-100 border-green-300' : 'bg-white border-red-300'}`}>
        <p className="text-sm text-gray-600 font-bold mb-1">{stats.balanceDue <= 0 ? 'ගෙවා අවසන්' : 'හිඟ මුදල'}</p>
        {stats.balanceDue <= 0 ? <div className="flex items-center justify-center gap-2 text-green-700"><CheckCircle size={32} /><span className="text-2xl font-bold">PAID</span></div> : <p className="text-3xl font-extrabold text-red-600">{formatCurrency(stats.balanceDue)}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-200">
            <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2"><Wallet className="text-red-500" size={18} /> අත්තිකාරම්</h3>
            <form onSubmit={handleAddAdvance} className="flex gap-2">
                <input type="number" placeholder="මුදල (Rs)" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} className="flex-1 p-2 border rounded outline-none" />
                <button type="submit" className="bg-red-500 text-white px-3 rounded font-bold text-sm hover:bg-red-600 transition">Add</button>
            </form>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-200">
            <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2"><CreditCard className="text-green-600" size={18} /> ගෙවීම්</h3>
            <form onSubmit={handlePay} className="flex gap-2">
                <input type="number" placeholder="මුදල (Rs)" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="flex-1 p-2 border rounded outline-none" />
                <button type="submit" className="bg-green-600 text-white px-3 rounded font-bold text-sm hover:bg-green-700 transition">Pay</button>
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
    <div className="p-4 space-y-4 animate-fade-in">
      <ConfirmModal isOpen={!!deleteId} title="සේවකයා ඉවත් කිරීම" message="ඔබට විශ්වාසද?" onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
      <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold text-green-800">සේවකයින්</h2><button onClick={() => setIsFormOpen(!isFormOpen)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"><Plus size={18} /> අලුත්</button></div>
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl shadow-md border border-green-100 mb-6 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={newWorker.name} onChange={(e) => setNewWorker({...newWorker, name: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="නම" />
            <input type="text" value={newWorker.phone} onChange={(e) => setNewWorker({...newWorker, phone: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="දුරකථන" />
            <select value={newWorker.category} onChange={(e) => setNewWorker({...newWorker, category: e.target.value})} className="w-full p-2 border rounded-lg"><option value="Plucker">දළු නෙලන</option><option value="Weeder">වල් නෙලන</option><option value="Sundry">වෙනත්</option><option value="Cinnamon">කුරුඳු</option></select>
          </div>
          <div className="mt-4 flex justify-end"><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">සේව්</button></div>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {workers.map(worker => (
          <div key={worker.id} onClick={() => onSelectWorker(worker)} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500 flex justify-between items-center cursor-pointer hover:bg-green-50 transition">
            <div><h3 className="font-bold text-gray-800 text-lg">{worker.name}</h3><p className="text-sm text-gray-500">{worker.category}</p></div>
            <button onClick={(e) => { e.stopPropagation(); setDeleteId(worker.id); }} className="text-red-400 p-2 hover:bg-red-50 rounded-full transition"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Daily Log Tab ---
const DailyLogTab = ({ workers, entries, addEntry, date, setDate }) => {
  const [inputs, setInputs] = useState({});
  const dailyTotalKg = useMemo(() => entries.filter(e => e.date === date).reduce((sum, e) => sum + parseFloat(e.value || 0), 0), [entries, date]);
  const handleSave = (worker) => { const val = inputs[worker.id]; if (!val) return; addEntry({ workerId: worker.id, workerName: worker.name, date: date, type: 'kg', value: parseFloat(val), timestamp: serverTimestamp() }); setInputs(prev => ({...prev, [worker.id]: ''})); };
  const getExistingEntry = (workerId) => entries.find(e => e.workerId === workerId && e.date === date);

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="bg-green-700 text-white p-4 rounded-xl shadow-lg mb-4 flex justify-between items-end">
        <div><p className="text-green-100 text-sm">අද එකතුව (Kg)</p><h1 className="text-4xl font-bold">{dailyTotalKg.toFixed(2)}</h1></div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-green-800 text-white border border-green-600 rounded p-1" />
      </div>
      <div className="space-y-3">
        {workers.map(worker => {
          const existing = getExistingEntry(worker.id);
          return (
            <div key={worker.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex-1"><p className="font-semibold text-gray-800">{worker.name}</p><span className="text-xs text-gray-500 bg-gray-100 px-2 rounded">{worker.category}</span></div>
              <div className="flex items-center gap-2">
                {existing ? <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg font-bold border border-green-200">{existing.value} Kg ✅</div> : 
                <div className="flex gap-2"><input type="number" placeholder="Kg" className="w-20 p-2 border rounded-lg text-right" value={inputs[worker.id] || ''} onChange={(e) => setInputs(prev => ({...prev, [worker.id]: e.target.value}))} /><button onClick={() => handleSave(worker)} className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition"><Save size={18} /></button></div>}
              </div>
            </div>
          );
        })}
      </div>
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

  useEffect(() => { if (bookNumbers.length > 0 && !bookNo) setBookNo(bookNumbers[0].name); }, [bookNumbers]);
  const handleSave = (e) => { e.preventDefault(); if (!weight || !bookNo) return; addFactoryRecord({ date, bookNo, weight: parseFloat(weight) }); setWeight(''); };
  const handleAddBook = (e) => { e.preventDefault(); if(!newBookName) return; addBookNumber(newBookName); setNewBookName(''); };
  const summary = useMemo(() => { const sums = {}; factoryRecords.forEach(r => { sums[r.bookNo] = (sums[r.bookNo] || 0) + r.weight; }); return sums; }, [factoryRecords]);

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Factory className="text-orange-500" /> ෆැක්ටරි</h2><button onClick={() => setShowBookManager(!showBookManager)} className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition">පොත් සැකසුම්</button></div>
      {showBookManager && (
         <div className="bg-gray-100 p-3 rounded-lg border border-gray-300 animate-slide-down"><form onSubmit={handleAddBook} className="flex gap-2 mb-3"><input type="text" placeholder="පොත් නම (උදා: Book A)" value={newBookName} onChange={e => setNewBookName(e.target.value)} className="flex-1 p-2 border rounded text-sm" /><button type="submit" className="bg-orange-500 text-white px-3 rounded text-sm">Add</button></form><div className="flex flex-wrap gap-2">{bookNumbers.map(book => (<span key={book.id} className="bg-white border border-gray-300 px-2 py-1 rounded text-xs flex items-center gap-2">{book.name}<button onClick={() => deleteBookNumber(book.id)} className="text-red-400">x</button></span>))}</div></div>
      )}
      <div className="bg-white p-4 rounded-xl shadow-md border-t-4 border-orange-500">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">දිනය</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded" /></div>
            <div><label className="text-xs text-gray-500">පොත</label>{bookNumbers.length > 0 ? <select value={bookNo} onChange={e => setBookNo(e.target.value)} className="w-full p-2 border rounded">{bookNumbers.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}</select> : <div className="text-red-500 text-xs">පොත් අංකයක් සාදන්න.</div>}</div>
          </div>
          <div><label className="text-xs text-gray-500">බර (Kg)</label><input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2 border rounded" /></div>
          <button type="submit" disabled={bookNumbers.length === 0} className="w-full bg-orange-500 text-white py-2 rounded font-semibold hover:bg-orange-600 transition">ඇතුලත් කරන්න</button>
        </form>
      </div>
      <div><h3 className="font-bold text-gray-700 mb-2">මුළු එකතුව (Total)</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Object.entries(summary).map(([book, total]) => (<div key={book} className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-center"><div className="text-xs text-orange-600 font-bold uppercase">{book}</div><div className="text-xl font-bold text-gray-800">{total.toFixed(1)}</div></div>))}</div></div>
    </div>
  );
};

// --- Payroll Tab ---
const PayrollTab = ({ workers, entries, advances, earnings, payments, onSelectWorker }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const payrollData = useMemo(() => {
    return workers.map(worker => {
      const workerEntries = entries.filter(e => e.workerId === worker.id && e.date.startsWith(selectedMonth));
      const workerAdvances = advances.filter(a => a.workerId === worker.id && a.date.startsWith(selectedMonth));
      const workerPayments = payments.filter(p => p.workerId === worker.id && p.date.startsWith(selectedMonth));
      const workerMonthlyEarningsRecs = earnings.filter(e => { if (e.workerId !== worker.id) return false; if (e.date && e.date.startsWith(selectedMonth)) return true; if (e.month === selectedMonth) return true; return false; });
      const grossPay = workerMonthlyEarningsRecs.reduce((sum, r) => sum + r.amount, 0);
      let totalKg = 0; workerEntries.forEach(e => totalKg += parseFloat(e.value || 0));
      const totalAdvances = workerAdvances.reduce((sum, a) => sum + a.amount, 0);
      const totalPaid = workerPayments.reduce((sum, p) => sum + p.amount, 0);
      return { ...worker, totalKg, grossPay, totalAdvances, totalPaid, balanceDue: grossPay - totalAdvances - totalPaid };
    });
  }, [workers, entries, advances, payments, selectedMonth, earnings]);

  return (
    <div className="p-4 space-y-6 print:p-0 animate-fade-in">
      <div className="bg-white p-4 rounded-xl shadow flex justify-between items-center print:hidden">
          <div><label className="text-xs text-gray-500 block">වාර්තා මාසය</label><input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 border rounded font-bold" /></div>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 hover:bg-blue-700 transition"><Printer size={18} /> Report</button>
      </div>
      <div className="overflow-x-auto print:overflow-visible">
        <div className="hidden print:block text-center mb-4"><h1 className="text-2xl font-bold">Estate Report: {selectedMonth}</h1></div>
        <div className="bg-white rounded-lg shadow overflow-hidden print:shadow-none print:border">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-800 text-white print:bg-gray-200 print:text-black"><tr><th className="p-3">නම</th><th className="p-3 text-right">Kg</th><th className="p-3 text-right">පඩිය</th><th className="p-3 text-right">අත්ති.</th><th className="p-3 text-right">ගෙවූ</th><th className="p-3 text-right font-bold">හිඟ</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{payrollData.map(data => (
                <tr key={data.id} className="hover:bg-purple-50 cursor-pointer transition" onClick={() => onSelectWorker(data)}>
                  <td className="p-3 font-medium">{data.name}</td><td className="p-3 text-right text-gray-600">{data.totalKg.toFixed(1)}</td><td className="p-3 text-right">{data.grossPay > 0 ? formatCurrency(data.grossPay) : '-'}</td><td className="p-3 text-right text-red-500">{data.totalAdvances > 0 ? `-${data.totalAdvances}` : '-'}</td><td className="p-3 text-right text-green-600">{data.totalPaid > 0 ? `-${data.totalPaid}` : '-'}</td><td className={`p-3 text-right font-bold ${data.balanceDue <= 0 ? 'text-green-600' : 'text-red-600'}`}>{data.balanceDue <= 0 ? 'PAID' : data.balanceDue.toLocaleString()}</td>
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
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [factoryRecords, setFactoryRecords] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [payments, setPayments] = useState([]);
  const [bookNumbers, setBookNumbers] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  // Check Login Status on Mount
  useEffect(() => {
    const loggedIn = localStorage.getItem('estate_login');
    if (loggedIn === 'true') {
        setIsAuthenticated(true);
    }
  }, []);

  // Init Firebase Only if config is there and user is logged in
  useEffect(() => {
    if (app && isAuthenticated) {
        signInAnonymously(auth).catch(e => console.error(e));
        const unsub = onAuthStateChanged(auth, setUser);
        return unsub;
    }
  }, [isAuthenticated]);

  // Inject Tailwind CSS
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.tailwindcss.com";
    script.async = true;
    document.head.appendChild(script);
    
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1.0";
      document.getElementsByTagName('head')[0].appendChild(meta);
    }
  }, []);

  useEffect(() => { if (!user) return; 
    const uW = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'workers')), s => setWorkers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uE = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'work_entries')), s => setEntries(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uF = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'factory_records')), s => setFactoryRecords(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uA = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'advances')), s => setAdvances(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uP = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'payments')), s => setPayments(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uB = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'book_numbers')), s => setBookNumbers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const uEr = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'earnings')), s => setEarnings(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { uW(); uE(); uF(); uA(); uP(); uB(); uEr(); };
  }, [user]);

  const addWorker = (d) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'workers'), d);
  const deleteWorker = (id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'workers', id));
  const addEntry = (d) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'work_entries'), d);
  const addFactoryRecord = (d) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'factory_records'), d);
  const deleteFactoryRecord = (id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'factory_records', id));
  const addAdvance = (d) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'advances'), d);
  const deleteAdvance = (id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'advances', id));
  const addPayment = (d) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'payments'), d);
  const deletePayment = (id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payments', id));
  const addBookNumber = (name) => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'book_numbers'), { name });
  const deleteBookNumber = (id) => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'book_numbers', id));
  const setWorkerEarnings = async (workerId, month, date, amount) => {
    let id = date ? `${workerId}_${date}` : `${workerId}_${month}`;
    let data = { workerId, amount, timestamp: serverTimestamp() };
    if (date) data.date = date; else data.month = month;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'earnings', id), data);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('estate_login', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('estate_login');
  };

  if (!firebaseConfig.apiKey) return <div className="flex flex-col items-center justify-center h-screen p-4 text-center"><h2 className="text-xl font-bold text-red-600 mb-2">Setup Required</h2><p>Please copy your Firebase Config into the <code>firebaseConfig</code> object in the code.</p></div>;
  
  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;
  
  if (!user) return <div className="flex items-center justify-center h-screen text-green-600 animate-pulse font-bold">Loading System...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-green-800 text-white p-4 sticky top-0 z-50 shadow-md print:hidden">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-2"><Sprout size={28} /><h1 className="text-xl font-bold">Estate Manager</h1></div>
          <button onClick={handleLogout} className="text-xs bg-green-900 px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1 transition"><LogOut size={12}/> Logout</button>
        </div>
      </header>
      <main className="flex-1 max-w-4xl mx-auto w-full mb-20 overflow-y-auto print:mb-0">
        {selectedWorker ? <WorkerProfile worker={selectedWorker} entries={entries} advances={advances} payments={payments} earnings={earnings} onBack={() => setSelectedWorker(null)} addPayment={addPayment} addAdvance={addAdvance} deletePayment={deletePayment} deleteAdvance={deleteAdvance} setWorkerEarnings={setWorkerEarnings} /> : 
        (<>
            {activeTab === 'daily' && <DailyLogTab workers={workers} entries={entries} addEntry={addEntry} date={currentDate} setDate={setCurrentDate} />}
            {activeTab === 'workers' && <WorkersTab workers={workers} deleteWorker={deleteWorker} addWorker={addWorker} onSelectWorker={setSelectedWorker} />}
            {activeTab === 'factory' && <FactoryTab factoryRecords={factoryRecords} addFactoryRecord={addFactoryRecord} deleteFactoryRecord={deleteFactoryRecord} bookNumbers={bookNumbers} addBookNumber={addBookNumber} deleteBookNumber={deleteBookNumber} />}
            {activeTab === 'payroll' && <PayrollTab workers={workers} entries={entries} advances={advances} earnings={earnings} payments={payments} onSelectWorker={setSelectedWorker} />}
        </>)}
      </main>
      {!selectedWorker && <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe print:hidden"><div className="flex justify-around items-center h-16 max-w-4xl mx-auto"><NavBtn active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} icon={<ClipboardList size={24} />} label="Work Log" /><NavBtn active={activeTab === 'payroll'} onClick={() => setActiveTab('payroll')} icon={<Wallet size={24} />} label="Payroll" /><NavBtn active={activeTab === 'factory'} onClick={() => setActiveTab('factory')} icon={<Factory size={24} />} label="Factory" /><NavBtn active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} icon={<Users size={24} />} label="Workers" /></div></nav>}
    </div>
  );
}
const NavBtn = ({ active, onClick, icon, label }) => (<button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>{icon}<span className="text-[10px] font-medium mt-1">{label}</span></button>);
