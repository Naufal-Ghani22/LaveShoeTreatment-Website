import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, ShoppingBag, Users, DollarSign, Settings, LogOut, CheckCircle, Clock, 
  Trash2, Send, CreditCard, ChevronRight, Image, Info, User, HelpCircle, Award, 
  MapPin, Phone, Building, ArrowUpRight, ArrowDownRight, ArrowUpLeft, RefreshCw, BarChart2, ShieldCheck
} from 'lucide-react';
import api from './api';

const formatPhotoUrl = (url) => {
  if (!url) return '';
  let formatted = url;
  
  // 1. Resolve local mock IP addresses to the production domain dynamically
  if (formatted.includes('127.0.0.1:8000') || formatted.includes('localhost:8000')) {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const baseDomain = apiBase.replace(/\/api$/, ''); // Remove /api suffix
    if (baseDomain) {
      formatted = formatted.replace(/http:\/\/(127\.0\.0\.1|localhost):8000/, baseDomain);
    }
  }
  
  // 2. Convert HEIC/HEIF to JPG for browser compatibility (dynamic conversion on Cloudinary)
  if (formatted.toLowerCase().endsWith('.heic') || formatted.toLowerCase().endsWith('.heif')) {
    formatted = formatted.replace(/\.(heic|heif)$/i, '.jpg');
  }
  
  return formatted;
};

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lavest_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('lavest_token'));
  
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'orders', 'customers', 'finance', 'services'
  const [trackingInvoice, setTrackingInvoice] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  
  // Auth Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Global State
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [financialData, setFinancialData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cashflows, setCashflows] = useState([]);
  const [assets, setAssets] = useState([]);

  // Modal / Form state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // QC Photos Modal state
  const [showQcUploadModal, setShowQcUploadModal] = useState(false);
  const [qcOrderId, setQcOrderId] = useState(null);
  const [qcFiles, setQcFiles] = useState([]);

  // Lightbox & Detail states
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);

  // Manual Income Modal state
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeCategory, setIncomeCategory] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [incomeDesc, setIncomeDesc] = useState('');

  // New Order Form state
  const [newOrderCustomer, setNewOrderCustomer] = useState('');
  const [newOrderPickup, setNewOrderPickup] = useState('Drop-off');
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [newOrderItems, setNewOrderItems] = useState([
    { service_id: '', shoe_brand: '', shoe_type: '', shoe_color: '', qty: 1 }
  ]);
  const [newOrderDiscount, setNewOrderDiscount] = useState(0);

  // New Customer Form state (Nested in Order Modal or standalone)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustGender, setNewCustGender] = useState('L');

  // New Expense Form state
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseDesc, setExpenseDesc] = useState('');

  // New Asset Form state
  const [assetName, setAssetName] = useState('');
  const [assetPrice, setAssetPrice] = useState('');
  const [assetDate, setAssetDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetMonths, setAssetMonths] = useState(12);
  const [assetResidual, setAssetResidual] = useState(0);

  // Payment Form state
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentRef, setPaymentRef] = useState('');

  // General Loading State
  const [loading, setLoading] = useState(false);

  // Trigger search on mount if URL has order number
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invoice = params.get('invoice');
    if (invoice) {
      setTrackingInvoice(invoice);
      handleTrackOrder(invoice);
    }
  }, []);

  // Fetch data if authenticated
  useEffect(() => {
    if (token) {
      fetchServices();
      fetchCustomers();
      fetchOrders();
      fetchFinancePerformance();
      fetchFinanceCategories();
    }
  }, [token, activeTab]);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data || res.data);
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.data || res.data);
    } catch (err) { console.error(err); }
  };

  const fetchFinanceCategories = async () => {
    try {
      const res = await api.get('/finance/categories');
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchFinancePerformance = async () => {
    try {
      const res = await api.get('/finance/performance');
      setFinancialData(res.data);
      if (res.data.assets) setAssets(res.data.assets);
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.post('/login', { username, password });
      localStorage.setItem('lavest_token', res.data.access_token);
      localStorage.setItem('lavest_user', JSON.stringify(res.data.user));
      setToken(res.data.access_token);
      setUser(res.data.user);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Username atau password salah.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('lavest_token');
      localStorage.removeItem('lavest_user');
      setToken(null);
      setUser(null);
    }
  };

  const handleTrackOrder = async (inv) => {
    const term = inv || trackingInvoice;
    if (!term) return;
    setLoading(true);
    setTrackingError('');
    setTrackedOrder(null);
    try {
      const res = await api.get(`/orders/track?order_number=${term}`);
      setTrackedOrder(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setTrackingError('Invoice order tidak ditemukan. Silakan periksa kembali nomor invoice Anda.');
      } else {
        setTrackingError('Terjadi kesalahan saat melacak pesanan. Pastikan server backend Anda aktif.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', {
        full_name: newCustName,
        phone: newCustPhone,
        email: newCustEmail || null,
        gender: newCustGender,
      });
      fetchCustomers();
      setNewOrderCustomer(res.data.customer.id);
      setShowNewCustomerForm(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustEmail('');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mendaftarkan pelanggan baru.');
    }
  };

  const handleAddOrderItem = () => {
    setNewOrderItems([...newOrderItems, { service_id: '', shoe_brand: '', shoe_type: '', shoe_color: '', qty: 1 }]);
  };

  const handleRemoveOrderItem = (index) => {
    if (newOrderItems.length > 1) {
      setNewOrderItems(newOrderItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...newOrderItems];
    updated[index][field] = value;
    setNewOrderItems(updated);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!newOrderCustomer) return alert('Silakan pilih pelanggan.');

    try {
      const formData = new FormData();
      formData.append('customer_id', newOrderCustomer);
      formData.append('branch_id', 1);
      formData.append('pickup_method', newOrderPickup);
      formData.append('discount', newOrderDiscount);
      formData.append('notes', newOrderNotes);

      newOrderItems.forEach((item, idx) => {
        formData.append(`items[${idx}][service_id]`, item.service_id);
        formData.append(`items[${idx}][shoe_brand]`, item.shoe_brand);
        formData.append(`items[${idx}][shoe_type]`, item.shoe_type);
        if (item.shoe_color) formData.append(`items[${idx}][shoe_color]`, item.shoe_color);
        formData.append(`items[${idx}][qty]`, item.qty);

        // Append multiple files
        if (item.files) {
          Array.from(item.files).forEach((file) => {
            formData.append(`items[${idx}][photos_before][]`, file);
          });
        }
      });

      await api.post('/orders', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });
      fetchOrders();
      setShowOrderModal(false);
      // Reset form
      setNewOrderCustomer('');
      setNewOrderPickup('Drop-off');
      setNewOrderNotes('');
      setNewOrderItems([{ service_id: '', shoe_brand: '', shoe_type: '', shoe_color: '', qty: 1 }]);
      setNewOrderDiscount(0);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        const errorMsgs = Object.values(err.response.data.errors).flat().join('\n');
        alert('Gagal membuat pesanan:\n' + errorMsgs);
      } else {
        alert(err.response?.data?.message || err.message || 'Gagal membuat pesanan baru.');
      }
    }
  };

  const handleOpenPayment = (order) => {
    setSelectedOrder(order);
    setPaymentAmount(order.total_price);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/orders/${selectedOrder.id}/pay`, {
        payment_method: paymentMethod,
        paid_amount: paymentAmount,
        reference_number: paymentRef,
      });
      fetchOrders();
      fetchFinancePerformance();
      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPaymentRef('');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses pembayaran.');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, files = null) => {
    try {
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append('status', newStatus);
        files.forEach((file) => {
          formData.append('items[0][photos_after][]', file);
        });
        await api.post(`/orders/${orderId}/status`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        });
      } else {
        await api.post(`/orders/${orderId}/status`, { status: newStatus });
      }
      fetchOrders();
      fetchFinancePerformance();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        const errorMsgs = Object.values(err.response.data.errors).flat().join('\n');
        alert('Gagal memperbarui status:\n' + errorMsgs);
      } else {
        alert(err.response?.data?.message || err.message || 'Gagal memperbarui status order.');
      }
    }
  };

  const handleQcUploadSubmit = async (e) => {
    e.preventDefault();
    if (!qcFiles || qcFiles.length === 0) return alert('Silakan unggah minimal 1 foto.');
    try {
      await handleUpdateStatus(qcOrderId, 'Ready', qcFiles);
      setShowQcUploadModal(false);
      setQcOrderId(null);
      setQcFiles([]);
    } catch (err) {
      alert('Gagal mengunggah foto QC.');
    }
  };

  const handleSendWa = async (orderId, type) => {
    try {
      const res = await api.get(`/orders/${orderId}/wa-link?type=${type}`);
      window.open(res.data.wa_link, '_blank');
    } catch (err) {
      alert('Gagal menghasilkan link WhatsApp reminder.');
    }
  };

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/expenses', {
        financial_category_id: expenseCategory,
        branch_id: 1,
        amount: expenseAmount,
        expense_date: expenseDate,
        description: expenseDesc,
      });
      fetchFinancePerformance();
      setShowExpenseModal(false);
      setExpenseCategory('');
      setExpenseAmount('');
      setExpenseDesc('');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mencatat pengeluaran.');
    }
  };

  const handleRecordIncome = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/incomes', {
        financial_category_id: incomeCategory,
        branch_id: 1,
        amount: incomeAmount,
        income_date: incomeDate,
        description: incomeDesc,
      });
      fetchFinancePerformance();
      setShowIncomeModal(false);
      setIncomeCategory('');
      setIncomeAmount('');
      setIncomeDesc('');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mencatat pemasukan.');
    }
  };

  const handleRecordAsset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/finance/assets', {
        branch_id: 1,
        asset_name: assetName,
        purchase_price: assetPrice,
        purchase_date: assetDate,
        useful_months: assetMonths,
        residual_value: assetResidual,
      });
      fetchFinancePerformance();
      setShowAssetModal(false);
      setAssetName('');
      setAssetPrice('');
      setAssetResidual(0);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mencatat aset inventaris.');
    }
  };

  const handlePrintInvoice = (order) => {
    const isPaid = order.payment_transaction?.payment_status === 'Paid';
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    
    const itemsHtml = order.items.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px;">
          <div style="font-weight: bold; color: #1e293b;">${item.shoe_brand} - ${item.shoe_type}</div>
          <div style="font-size: 10px; color: #64748b;">Warna: ${item.shoe_color || '-'}</div>
        </td>
        <td style="padding: 12px 8px; color: #0066cc; font-weight: 600;">${item.service?.service_name || 'Cuci'}</td>
        <td style="padding: 12px 8px; text-align: center;">${item.qty}</td>
        <td style="padding: 12px 8px; text-align: right;">Rp ${Number(item.price).toLocaleString('id-ID')}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: bold;">Rp ${Number(item.subtotal).toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const stampHtml = isPaid ? `
      <div style="
        position: absolute;
        bottom: 50px;
        right: 50px;
        border: 4px double #10b981;
        color: #10b981;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        text-align: center;
        padding: 10px 20px;
        border-radius: 8px;
        transform: rotate(-12deg);
        text-transform: uppercase;
        background-color: rgba(16, 185, 129, 0.05);
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.05);
      ">
        <div style="font-size: 10px; letter-spacing: 1.5px; font-weight: bold;">LAVE SNEAKERS</div>
        <div style="font-size: 18px; font-weight: 900; margin: 3px 0; letter-spacing: 2px;">L U N A S</div>
        <div style="font-size: 8px; border-top: 1px dashed #10b981; padding-top: 3px; margin-top: 3px; font-weight: bold;">SAH • NO REVISION</div>
      </div>
    ` : `
      <div style="
        position: absolute;
        bottom: 50px;
        right: 50px;
        border: 4px double #ef4444;
        color: #ef4444;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        text-align: center;
        padding: 10px 20px;
        border-radius: 8px;
        transform: rotate(-12deg);
        text-transform: uppercase;
        background-color: rgba(239, 68, 68, 0.05);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.05);
      ">
        <div style="font-size: 10px; letter-spacing: 1.5px; font-weight: bold;">LAVE SNEAKERS</div>
        <div style="font-size: 18px; font-weight: 900; margin: 3px 0; letter-spacing: 1.5px;">UNPAID</div>
        <div style="font-size: 8px; border-top: 1px dashed #ef4444; padding-top: 3px; margin-top: 3px; font-weight: bold;">BELUM BAYAR</div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Nota Invoice ${order.order_number}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #334155; margin: 40px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f8fafc; padding: 12px 8px; text-align: left; font-weight: bold; color: #475569; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; }
            ol { margin: 4px 0 0 0; padding-left: 15px; }
          </style>
        </head>
        <body>
          <div style="position: relative; min-h-screen; padding-bottom: 120px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; margin-bottom: 30px;">
              <div>
                <h1 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">LAVE SHOE TREATMENT</h1>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500;">Premium Sneakers Care & Treatment</p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">Jl. Jenderal Sudirman No. 123 | WA: 081234567890</p>
              </div>
              <div style="text-align: right;">
                <h2 style="margin: 0; color: #64748b; font-size: 16px; font-weight: 700;">INVOICE</h2>
                <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: bold; color: #0f172a;">${order.order_number}</p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #94a3b8;">Tanggal: ${new Date(order.order_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; font-size: 11px;">
              <div>
                <div style="font-weight: bold; color: #94a3b8; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; margin-bottom: 6px;">Pelanggan:</div>
                <div style="font-weight: 800; color: #0f172a; font-size: 13px;">${order.customer?.full_name}</div>
                <div style="color: #475569; margin-top: 4px;">WhatsApp: ${order.customer?.phone}</div>
                <div style="color: #64748b; margin-top: 2px;">Email: ${order.customer?.email || '-'}</div>
              </div>
              <div>
                <div style="font-weight: bold; color: #94a3b8; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; margin-bottom: 6px;">Detail Order:</div>
                <div><strong style="color: #475569;">Metode Pengambilan:</strong> ${order.pickup_method}</div>
                <div style="margin-top: 4px;"><strong style="color: #475569;">Status Pengerjaan:</strong> ${order.status}</div>
                <div style="margin-top: 4px;"><strong style="color: #475569;">Metode Pembayaran:</strong> ${order.payment_transaction?.payment_method || '-'}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item Sepatu</th>
                  <th>Layanan</th>
                  <th style="text-align: center;">Jumlah</th>
                  <th style="text-align: right;">Harga Satuan</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-top: 30px; font-size: 11px;">
              <div style="width: 250px; border-top: 2px solid #cbd5e1; padding-top: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #64748b;">
                  <span>Subtotal:</span>
                  <span>Rp ${Number(order.subtotal).toLocaleString('id-ID')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #ef4444;">
                  <span>Diskon:</span>
                  <span>- Rp ${Number(order.discount).toLocaleString('id-ID')}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px;">
                  <span>Total Bayar:</span>
                  <span>Rp ${Number(order.total_price).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div style="margin-top: 50px; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px;">
              <strong style="color: #64748b;">Syarat & Ketentuan Layanan:</strong>
              <ol>
                <li>Pengambilan barang wajib menunjukkan nota invoice digital ini.</li>
                <li>Kerusakan/luntur yang disebabkan oleh cacat pabrik atau usia sepatu bukan tanggung jawab Lave.</li>
                <li>Klaim komplain hanya berlaku maksimal 24 jam setelah barang diserahkan ke customer.</li>
              </ol>
            </div>

            ${stampHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
  };


  // Helper stats for Dashboard
  const activeOrdersCount = orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length;
  const readyToPickCount = orders.filter(o => o.status === 'Ready').length;
  const completedTodayCount = orders.filter(o => o.status === 'Completed').length; // simple filter

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased">
      
      {/* 1. PUBLIC TRACKING PAGE (If not logged in, or explicitly on tracking) */}
      {!token ? (
        <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gradient-to-br from-brand-dark via-slate-900 to-slate-950 text-white">
          <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            
            {/* Soft Cyan Ambient Light */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-cyan/20 rounded-full blur-3xl"></div>
            
            {/* Header / Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-slate-900/40 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-950/40 mb-3 border border-white/10 overflow-hidden p-2.5">
                <img src="/favicon.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-brand-cyan bg-clip-text text-transparent">LAVE SHOE TREATMENT</h1>
              <p className="text-xs text-slate-300 font-medium mt-1">Digital Customer & Order Tracking</p>
            </div>

            {/* Tracking Search Input */}
            {!trackedOrder ? (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-center">Lacak Sepatu Anda</h2>
                <p className="text-xs text-center text-slate-300">Masukkan nomor invoice atau kode transaksi yang tertera pada struk cucian Anda.</p>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Contoh: LAV/20260708/0001" 
                    value={trackingInvoice}
                    onChange={(e) => setTrackingInvoice(e.target.value)}
                    className="w-full bg-slate-850/50 border border-white/10 text-white text-sm font-medium py-3.5 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cyan focus:border-transparent transition-all uppercase placeholder-slate-400"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                </div>

                <button 
                  onClick={() => handleTrackOrder()}
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-cyan text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-cyan/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Lacak Sekarang <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>

                {trackingError && (
                  <p className="text-xs text-red-400 text-center font-medium bg-red-950/40 py-2.5 px-4 rounded-lg border border-red-500/20">{trackingError}</p>
                )}

                <div className="border-t border-white/10 pt-4 flex flex-col items-center">
                  <p className="text-xs text-slate-400">Ingin masuk ke panel admin?</p>
                  <a href="/login" onClick={(e) => { e.preventDefault(); setTrackingError(''); setTrackedOrder(null); setToken('login-mode'); }} className="text-xs text-brand-cyan hover:underline mt-1 font-semibold">Login Admin / Staff</a>
                </div>
              </div>
            ) : (
              /* Detailed Track Result */
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] text-brand-cyan font-bold tracking-wider uppercase bg-brand-cyan/15 px-2 py-0.5 rounded">Invoice</span>
                    <h3 className="text-md font-bold mt-1 text-white">{trackedOrder.order_number}</h3>
                  </div>
                  <button 
                    onClick={() => setTrackedOrder(null)}
                    className="text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    Kembali
                  </button>
                </div>

                {/* Status Timeline */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-4">Timeline Pengerjaan</h4>
                  <div className="relative pl-6 space-y-4">
                    {/* Verticle Timeline Line */}
                    <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-700"></div>

                    {[
                      { key: 'Pending', label: 'Order Diterima' },
                      { key: 'Washing', label: 'Sedang Dicuci' },
                      { key: 'Drying', label: 'Proses Pengeringan' },
                      { key: 'Finishing', label: 'Finishing & Pewarnaan' },
                      { key: 'Ready', label: 'Quality Control Lolos - Siap Diambil' },
                      { key: 'Completed', label: 'Sepatu Selesai Diambil' }
                    ].map((step, idx) => {
                      const statusIndex = ['Pending', 'Received', 'Washing', 'Drying', 'Finishing', 'Ready', 'Completed'].indexOf(trackedOrder.status);
                      const stepIndex = ['Pending', 'Washing', 'Drying', 'Finishing', 'Ready', 'Completed'].indexOf(step.key);
                      const isDone = stepIndex <= statusIndex && trackedOrder.status !== 'Cancelled';
                      const isCurrent = stepIndex === statusIndex;

                      return (
                        <div key={step.key} className="relative flex items-start">
                          <div className={`absolute -left-[21px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 ${
                            isDone ? 'bg-brand-cyan border-brand-cyan' : 'bg-slate-900 border-slate-700'
                          } transition-all`}>
                            {isDone && <CheckCircle className="w-3 h-3 text-slate-950 font-bold" />}
                          </div>
                          <div className="ml-2">
                            <p className={`text-xs font-semibold ${isDone ? 'text-white' : 'text-slate-500'} ${isCurrent ? 'text-brand-cyan font-bold scale-102 transition-all' : ''}`}>
                              {step.label} {isCurrent && '(Tahap Sekarang)'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Item & Details */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Nama Pelanggan</span>
                    <span className="font-semibold text-white">{trackedOrder.customer?.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Total Cucian</span>
                    <span className="font-semibold text-white">{trackedOrder.items?.length} Pasang Sepatu</span>
                  </div>
                  <div className="border-t border-white/10 pt-2.5">
                    {trackedOrder.items?.map((item, idx) => (
                      <div key={idx} className="space-y-3 border-b border-white/10 pb-3 last:border-0 last:pb-0 mt-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-semibold">{item.shoe_brand} ({item.shoe_type})</span>
                          <span className="text-brand-cyan font-medium">{item.service?.service_name}</span>
                        </div>
                        
                        {/* Before/After Gallery */}
                        {item.photos && item.photos.length > 0 && (
                          <div className="grid grid-cols-2 gap-4 mt-2 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 mb-1.5 tracking-wider">FOTO SEBELUM (BEFORE)</p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {item.photos.filter(p => p.photo_type === 'Before').map((ph, pIdx) => (
                                  <button key={pIdx} onClick={() => setPreviewImage(ph.photo_url)} className="focus:outline-none text-left">
                                    <img src={formatPhotoUrl(ph.photo_url)} className="w-full h-14 object-cover rounded-lg border border-white/10 hover:opacity-85 transition-all" alt="Before" />
                                  </button>
                                ))}
                                {item.photos.filter(p => p.photo_type === 'Before').length === 0 && (
                                  <p className="text-[8px] text-slate-500 italic">Tidak ada foto</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-400 mb-1.5 tracking-wider">FOTO SESUDAH (AFTER)</p>
                              <div className="grid grid-cols-2 gap-1.5">
                                {item.photos.filter(p => p.photo_type === 'After').map((ph, pIdx) => (
                                  <button key={pIdx} onClick={() => setPreviewImage(ph.photo_url)} className="focus:outline-none text-left">
                                    <img src={formatPhotoUrl(ph.photo_url)} className="w-full h-14 object-cover rounded-lg border border-white/10 hover:opacity-85 transition-all" alt="After" />
                                  </button>
                                ))}
                                {item.photos.filter(p => p.photo_type === 'After').length === 0 && (
                                  <p className="text-[8px] text-slate-500 italic">Sedang dalam pengerjaan...</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Loyalty stamps notice */}
                {trackedOrder.customer?.loyalty_account && (
                  <div className="bg-gradient-to-r from-brand-primary/20 to-brand-cyan/20 border border-brand-cyan/20 rounded-2xl p-4 flex items-center gap-3">
                    <Award className="w-10 h-10 text-brand-cyan shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-white">Loyalty Stamp Anda</h5>
                      <p className="text-[10px] text-slate-300 mt-0.5">Saat ini Anda memiliki <strong className="text-white text-xs">{trackedOrder.customer.loyalty_account.current_stamp}</strong> stamp digital. Kumpulkan 10 stamp untuk 1x cuci gratis!</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : token === 'login-mode' ? (
        /* LOGIN PANEL */
        <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-900 text-white">
          <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-3xl shadow-xl relative">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-slate-800/40 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-950/40 mb-3 border border-slate-700 overflow-hidden p-2">
                <img src="/favicon.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <h2 className="text-xl font-bold">LAVE BMS SECURE LOGIN</h2>
              <p className="text-xs text-slate-400 mt-1">Sistem Manajemen Bisnis Lave Shoe Treatment</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 text-sm py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cyan text-white"
                  placeholder="Masukkan username Anda"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700 text-sm py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cyan text-white"
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/20 py-2.5 px-4 rounded-lg font-medium">{loginError}</p>
              )}

              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-cyan text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loginLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Masuk Ke Dashboard'}
              </button>
            </form>

            <div className="border-t border-slate-700/50 mt-6 pt-4 text-center">
              <a href="/" onClick={(e) => { e.preventDefault(); setToken(null); }} className="text-xs text-slate-400 hover:text-white transition-all">← Kembali ke Halaman Pelacakan Customer</a>
            </div>
          </div>
        </div>
      ) : (
        /* 2. ADMIN DASHBOARD WORKSPACE */
        <div className="flex-1 flex overflow-hidden">
          
          {/* SIDEBAR PANEL */}
          <aside className="w-64 bg-slate-950 text-white flex flex-col border-r border-slate-900 shrink-0">
            {/* Brand Title */}
            <div className="p-6 border-b border-slate-900 flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-800/60 rounded-lg flex items-center justify-center shrink-0 overflow-hidden p-1 border border-slate-700">
                <img src="/favicon.png" className="w-full h-full object-contain" alt="Logo" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wide">LAVE STREAT</h2>
                <span className="text-[10px] text-slate-400 font-medium">BMS Portal v1.0</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex-1 p-4 space-y-1.5">
              {[
                { id: 'dashboard', label: 'Overview Dashboard', icon: BarChart2 },
                { id: 'orders', label: 'Operasional Pemesanan', icon: ShoppingBag },
                { id: 'customers', label: 'Manajemen Customer', icon: Users },
                { id: 'finance', label: 'Cashflow & Keuangan', icon: DollarSign },
                { id: 'services', label: 'Katalog Layanan', icon: Settings },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive 
                        ? 'bg-gradient-to-r from-brand-primary to-brand-cyan text-white shadow-md shadow-brand-primary/20' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-4.5 h-4.5 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* User Session Footer */}
            <div className="p-4 border-t border-slate-900 bg-slate-950/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                  <User className="w-4 h-4 text-slate-300" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-bold text-white truncate">{user.username}</h4>
                  <span className="text-[10px] text-brand-cyan font-semibold block capitalize">{user.role}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full py-2 bg-slate-900 hover:bg-red-950/30 text-slate-400 hover:text-red-400 rounded-lg text-[10px] font-bold border border-slate-800 hover:border-red-900/30 transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar Sistem
              </button>
            </div>
          </aside>

          {/* MAIN PAGE AREA */}
          <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
            
            {/* Page Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
              <div>
                <h1 className="text-lg font-bold text-slate-900 capitalize">{activeTab} Modul</h1>
                <p className="text-xs text-slate-500">Overview statistics and management metrics.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowOrderModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-cyan hover:shadow-md text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow shadow-brand-primary/10"
                >
                  <Plus className="w-4 h-4" /> Order Baru
                </button>
              </div>
            </header>

            {/* Dynamic View Loader */}
            <div className="p-8 flex-1 space-y-6">
              
              {/* TAB 1: OVERVIEW DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* KPI Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Antrean Cuci</span>
                        <h2 className="text-2xl font-black mt-1 text-slate-900">{activeOrdersCount}</h2>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Sepatu diproses</span>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 text-brand-primary rounded-xl flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Siap Diambil</span>
                        <h2 className="text-2xl font-black mt-1 text-slate-900">{readyToPickCount}</h2>
                        <span className="text-[10px] text-brand-cyan font-bold block mt-0.5">Menunggu customer</span>
                      </div>
                      <div className="w-12 h-12 bg-cyan-50 text-brand-cyan rounded-xl flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pendapatan Bulan Ini</span>
                        <h2 className="text-2xl font-black mt-1 text-slate-900">
                          Rp {(financialData?.summary?.total_revenue ?? 0).toLocaleString('id-ID')}
                        </h2>
                        <span className="text-[10px] text-emerald-500 font-bold block mt-0.5">Dari transaksi lunas</span>
                      </div>
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Kas Operasional</span>
                        <h2 className="text-2xl font-black mt-1 text-slate-900">
                          Rp {(financialData?.summary?.current_balance ?? 0).toLocaleString('id-ID')}
                        </h2>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">Saldo real kas saat ini</span>
                      </div>
                      <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-xl flex items-center justify-center shrink-0">
                        <Building className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* SVG Chart & Target Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Custom SVG Line Chart */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Grafik Pemasukan Lave Shoe Treatment</h3>
                          <p className="text-[10px] text-slate-500">Visualisasi arus kas masuk dari jasa cuci</p>
                        </div>
                      </div>
                           {/* Dynamic SVG Chart representing real monthly performance trend */}
                      <div className="h-48 w-full flex items-end">
                        {(() => {
                          const trend = financialData?.trend || [];
                          const maxVal = Math.max(...trend.map(t => Math.max(t.income, t.expense)), 50000);
                          
                          const incomePoints = trend.map((t, idx) => {
                            const x = idx * 100;
                            const y = 140 - (t.income / maxVal) * 120;
                            return `${x},${y}`;
                          });

                          const expensePoints = trend.map((t, idx) => {
                            const x = idx * 100;
                            const y = 140 - (t.expense / maxVal) * 120;
                            return `${x},${y}`;
                          });

                          const incomePath = incomePoints.length > 0 ? `M ${incomePoints.join(' L ')}` : '';
                          const expensePath = expensePoints.length > 0 ? `M ${expensePoints.join(' L ')}` : '';
                          const incomeArea = incomePoints.length > 0 ? `M 0,150 L ${incomePoints.join(' L ')} L 500,150 Z` : '';
                          const expenseArea = expensePoints.length > 0 ? `M 0,150 L ${expensePoints.join(' L ')} L 500,150 Z` : '';

                          return (
                            <svg className="w-full h-full" viewBox="0 0 500 150">
                              <defs>
                                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#0066cc" stopOpacity="0.25"/>
                                  <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.0"/>
                                </linearGradient>
                                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#e11d48" stopOpacity="0.2"/>
                                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0"/>
                                </linearGradient>
                              </defs>
                              <line x1="0" y1="37" x2="500" y2="37" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="0" y1="75" x2="500" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="0" y1="112" x2="500" y2="112" stroke="#f1f5f9" strokeWidth="1" />
                              
                              {incomePath && (
                                <>
                                  <path d={incomeArea} fill="url(#incomeGradient)" />
                                  <path d={incomePath} fill="none" stroke="#0066cc" strokeWidth="3" strokeLinecap="round" />
                                </>
                              )}
                              {expensePath && (
                                <>
                                  <path d={expenseArea} fill="url(#expenseGradient)" />
                                  <path d={expensePath} fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3,3" />
                                </>
                              )}
                              {trend.map((t, idx) => {
                                const x = idx * 100;
                                const yInc = 140 - (t.income / maxVal) * 120;
                                const yExp = 140 - (t.expense / maxVal) * 120;
                                return (
                                  <g key={idx}>
                                    <circle cx={x} cy={yInc} r="4.5" fill="#00e5ff" stroke="#0066cc" strokeWidth="2" />
                                    <circle cx={x} cy={yExp} r="3.5" fill="#fda4af" stroke="#e11d48" strokeWidth="1.5" />
                                  </g>
                                );
                              })}
                            </svg>
                          );
                        })()}
                      </div>
                      
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-3.5 uppercase tracking-wider px-2">
                        {(financialData?.trend || []).map((t, idx) => {
                          const date = new Date(t.month + '-02');
                          const monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
                          return <span key={idx}>{monthLabel}</span>;
                        })}
                        {(financialData?.trend || []).length === 0 && (
                          <>
                            <span>Bulan 1</span>
                            <span>Bulan 2</span>
                            <span>Bulan 3</span>
                            <span>Bulan 4</span>
                            <span>Bulan 5</span>
                            <span>Bulan 6</span>
                          </>
                        )}
                      </div>                  </div>

                    {/* Target Achievement Widget */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Target Pemasukan Bulanan</h3>
                        <p className="text-[10px] text-slate-500">Mencapai target omzet bisnis Lave</p>
                      </div>

                      <div className="py-4">
                        <div className="flex justify-between items-end text-xs font-semibold mb-2">
                          <span className="text-slate-400">Pencapaian</span>
                          <span className="text-slate-900">72%</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand-primary to-brand-cyan rounded-full" style={{ width: '72%' }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500 mt-2">
                          <span>Target: Rp 8.000.000</span>
                          <span>Sisa: Rp 2.200.000</span>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 flex items-start gap-2">
                        <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                        <p className="text-[9px] text-slate-600 leading-relaxed">Pemasukan Anda meningkat sebesar 12% dibandingkan bulan kemarin. Pastikan follow-up pelanggan laundry yang belum mengambil sepatu mereka!</p>
                      </div>
                    </div>
                  </div>

                  {/* Operational Timeline Queue */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Daftar Antrean Cucian Aktif</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                            <th className="pb-3 font-semibold">Nota Invoice</th>
                            <th className="pb-3 font-semibold">Pelanggan</th>
                            <th className="pb-3 font-semibold">Brand / Model</th>
                            <th className="pb-3 font-semibold">Layanan</th>
                            <th className="pb-3 font-semibold">Tahap Status</th>
                            <th className="pb-3 font-semibold">Aksi Cepat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).slice(0, 5).map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="py-4 font-bold text-slate-900">{order.order_number}</td>
                              <td className="py-4 font-medium text-slate-700">{order.customer?.full_name}</td>
                              <td className="py-4 text-slate-500">
                                {order.items?.[0]?.shoe_brand} <span className="text-[10px] opacity-75">({order.items?.[0]?.shoe_type})</span>
                              </td>
                              <td className="py-4 font-semibold text-brand-primary">
                                {order.items?.[0]?.service?.service_name}
                              </td>
                              <td className="py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  order.status === 'Ready' ? 'bg-cyan-15 text-brand-cyan' :
                                  order.status === 'Washing' ? 'bg-blue-50 text-blue-600' :
                                  'bg-amber-50 text-amber-600'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="py-4">
                                <div className="flex gap-2">
                                  {order.status === 'Pending' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'Washing')} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded hover:bg-blue-100 transition-all">Cuci</button>
                                  )}
                                  {order.status === 'Washing' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'Drying')} className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded hover:bg-amber-100 transition-all">Keringkan</button>
                                  )}
                                  {order.status === 'Drying' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'Finishing')} className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded hover:bg-purple-100 transition-all">Finishing</button>
                                  )}
                                  {order.status === 'Finishing' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'Ready')} className="px-2 py-1 bg-cyan-15 text-brand-cyan text-[10px] font-bold rounded hover:bg-cyan-50 transition-all">QC Siap</button>
                                  )}
                                  {order.status === 'Ready' && (
                                    <button onClick={() => handleUpdateStatus(order.id, 'Completed')} className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded hover:bg-emerald-100 transition-all">Diambil</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {orders.filter(o => !['Completed', 'Cancelled'].includes(o.status)).length === 0 && (
                            <tr>
                              <td colSpan="6" className="text-center py-6 text-slate-400 font-medium">Tidak ada cucian aktif saat ini. Klik 'Order Baru' untuk memulai!</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OPERASIONAL PEMESANAN */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Search Bar & Stats */}
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="Cari order berdasarkan invoice atau nama customer..." 
                        className="w-full bg-white border border-slate-200 text-xs py-3.5 pl-11 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                      <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {/* Main Orders Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                        <tr>
                          <th className="p-4 font-semibold">No. Invoice</th>
                          <th className="p-4 font-semibold">Pelanggan</th>
                          <th className="p-4 font-semibold">Tgl Masuk</th>
                          <th className="p-4 font-semibold">Status Pengerjaan</th>
                          <th className="p-4 font-semibold">Harga</th>
                          <th className="p-4 font-semibold">Pembayaran</th>
                          <th className="p-4 font-semibold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.map((order) => {
                          const isPaid = order.payment_transaction?.payment_status === 'Paid';
                          return (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="p-4 font-bold text-slate-900">{order.order_number}</td>
                              <td className="p-4">
                                <p className="font-semibold text-slate-700">{order.customer?.full_name}</p>
                                <span className="text-[10px] text-slate-400 font-medium">{order.customer?.phone}</span>
                              </td>
                              <td className="p-4 text-slate-500">{new Date(order.order_date).toLocaleDateString('id-ID')}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                  order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                                  'bg-amber-50 text-amber-600'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-slate-900">Rp {Number(order.total_price).toLocaleString('id-ID')}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'
                                }`}>
                                  {isPaid ? 'Lunas' : 'Belum Bayar'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => { setSelectedOrderForDetail(order); setShowOrderDetailModal(true); }}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all"
                                  >
                                    Detail
                                  </button>
                                  {!isPaid && (
                                    <button 
                                      onClick={() => handleOpenPayment(order)}
                                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" /> Bayar
                                    </button>
                                  )}
                                  
                                  {/* Status Flow Actions */}
                                  <select 
                                    value={order.status}
                                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                    className="bg-slate-100 border border-slate-200 text-[10px] font-bold rounded-lg px-2 py-1.5 focus:outline-none"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Washing">Washing</option>
                                    <option value="Drying">Drying</option>
                                    <option value="Finishing">Finishing</option>
                                    <option value="Ready">QC / Ready</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>

                                                              {/* QC Upload Action */}
                                   {!['Completed', 'Cancelled'].includes(order.status) && (
                                     <button 
                                       onClick={() => { setQcOrderId(order.id); setQcFiles([]); setShowQcUploadModal(true); }}
                                       className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand-primary text-[10px] font-bold rounded-lg transition-all"
                                       title="Upload Foto QC & Tandai Ready"
                                     >
                                       + QC Photos
                                     </button>
                                   )}

                                   {/* WA Send Buttons */}
                                   <button 
                                     onClick={() => handleSendWa(order.id, 'completed')}
                                     title="Kirim WA Selesai"
                                     className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                                   >
                                     <Send className="w-3.5 h-3.5" />
                                   </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: MANAJEMEN CUSTOMER */}
              {activeTab === 'customers' && (
                <div className="space-y-6">
                  {/* Customers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {customers.map((cust) => (
                      <div key={cust.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
                              {cust.customer_code}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 mt-1.5">{cust.full_name}</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">{cust.phone}</p>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400">Total Order</span>
                            <span className="text-md font-extrabold text-slate-900 mt-0.5">{cust.total_orders}x</span>
                          </div>
                        </div>

                        {/* Stamp digital display */}
                        {cust.loyalty_account && (
                          <div className="bg-gradient-to-r from-brand-primary to-brand-cyan p-4 rounded-xl text-white space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold tracking-wide flex items-center gap-1.5">
                                <Award className="w-4.5 h-4.5" /> Stamp Loyalty
                              </span>
                              <span className="font-black text-sm">{cust.loyalty_account.current_stamp} / 10</span>
                            </div>
                            
                            {/* Visual stamp circle representation */}
                            <div className="flex gap-1.5 justify-center py-1">
                              {Array.from({ length: 10 }).map((_, idx) => {
                                const active = idx < cust.loyalty_account.current_stamp;
                                return (
                                  <div 
                                    key={idx} 
                                    className={`w-4 h-4 rounded-full border border-white/30 flex items-center justify-center text-[7px] font-bold ${
                                      active ? 'bg-white text-brand-primary shadow-sm' : 'bg-white/10 text-white/50'
                                    }`}
                                  >
                                    ✓
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-3">
                          <span className="text-slate-400">Total Transaksi</span>
                          <span className="font-extrabold text-slate-900">Rp {Number(cust.total_spent).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: CASHFLOW & KEUANGAN */}
              {activeTab === 'finance' && (
                <div className="space-y-6">
                  {/* Financial Analysis KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Analisis BEP (Break-Even Point)</span>
                        <h2 className="text-xl font-black mt-1 text-slate-900">
                          {financialData?.bep_analysis?.bep_target_orders ?? 0} Pasang Sepatu
                        </h2>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          Target threshold: Rp {(financialData?.bep_analysis?.bep_revenue_threshold ?? 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-[10px] bg-slate-100 p-2.5 rounded-lg text-slate-600">
                        BEP dihitung berdasarkan biaya fixed cost bulanan dibagi margin jasa rata-rata.
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Lifetime Value (LTV)</span>
                        <h2 className="text-xl font-black mt-1 text-slate-900">
                          Rp {(financialData?.kpis?.customer_lifetime_value ?? 0).toLocaleString('id-ID')}
                        </h2>
                        <span className="text-[10px] text-brand-cyan font-bold block mt-0.5">
                          AOV: Rp {(financialData?.kpis?.average_order_value ?? 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="text-[10px] bg-slate-100 p-2.5 rounded-lg text-slate-600">
                        Rata-rata kontribusi nominal transaksi pelanggan sepanjang hidup pemesanan mereka.
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Depresiasi & Penyusutan Aset</span>
                        <h2 className="text-xl font-black mt-1 text-slate-900">
                          Rp {(financialData?.summary?.monthly_depreciation_expense ?? 0).toLocaleString('id-ID')} /bln
                        </h2>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          Dari total {assets.length} aset terdaftar
                        </span>
                      </div>
                      <div className="text-[10px] bg-slate-100 p-2.5 rounded-lg text-slate-600">
                        Estimasi penyusutan nilai mesin cuci steam, vacuum, meja, dll.
                      </div>
                    </div>
                  </div>

                  {/* Financial Controls */}
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setShowIncomeModal(true)}
                      className="px-4 py-2.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                    >
                      <ArrowUpLeft className="w-4.5 h-4.5" /> Catat Pemasukan
                    </button>
                    <button 
                      onClick={() => setShowExpenseModal(true)}
                      className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-100 transition-all flex items-center gap-1.5"
                    >
                      <ArrowDownRight className="w-4.5 h-4.5" /> Catat Pengeluaran
                    </button>
                    <button 
                      onClick={() => setShowAssetModal(true)}
                      className="px-4 py-2.5 bg-blue-50 border border-blue-200 text-brand-primary text-xs font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4.5 h-4.5" /> Tambah Aset Bisnis
                    </button>
                  </div>

                  {/* Assets Inventory Depreciation List */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">Inventaris & Penyusutan Aset</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                              <th className="pb-3 font-semibold">Nama Aset</th>
                              <th className="pb-3 font-semibold">Tgl Pembelian</th>
                              <th className="pb-3 font-semibold">Harga Beli</th>
                              <th className="pb-3 font-semibold">Masa Manfaat</th>
                              <th className="pb-3 font-semibold">Penyusutan Bulanan</th>
                              <th className="pb-3 font-semibold">Akumulasi Depresiasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {assets.map((asset) => (
                              <tr key={asset.id}>
                                <td className="py-3.5 font-bold text-slate-900">{asset.asset_name}</td>
                                <td className="py-3.5 text-slate-500">{new Date(asset.purchase_date).toLocaleDateString('id-ID')}</td>
                                <td className="py-3.5 font-semibold text-slate-700">Rp {Number(asset.purchase_price).toLocaleString('id-ID')}</td>
                                <td className="py-3.5 text-slate-500">{asset.useful_months} Bulan</td>
                                <td className="py-3.5 font-semibold text-rose-600">Rp {Number(asset.monthly_depreciation).toLocaleString('id-ID')}</td>
                                <td className="py-3.5 font-bold text-slate-900">Rp {Number(asset.accumulated_depreciation).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                            {assets.length === 0 && (
                              <tr>
                                <td colSpan="6" className="text-center py-6 text-slate-400 font-medium">Belum ada aset bisnis yang didaftarkan.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Monthly Cashflow Data (didata perbulan) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-900 mb-4">Ringkasan Cashflow Per Bulan</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                              <th className="pb-3 font-semibold">Bulan Buku</th>
                              <th className="pb-3 font-semibold text-emerald-600">Total Pemasukan</th>
                              <th className="pb-3 font-semibold text-rose-600">Total Pengeluaran</th>
                              <th className="pb-3 font-semibold text-slate-900">Arus Kas Bersih (Net)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(financialData?.trend || []).map((t, idx) => {
                              const date = new Date(t.month + '-02');
                              const monthLabel = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                              const net = t.income - t.expense;
                              return (
                                <tr key={idx}>
                                  <td className="py-3.5 font-bold text-slate-900">{monthLabel}</td>
                                  <td className="py-3.5 font-semibold text-emerald-600">Rp {Number(t.income).toLocaleString('id-ID')}</td>
                                  <td className="py-3.5 font-semibold text-rose-600">Rp {Number(t.expense).toLocaleString('id-ID')}</td>
                                  <td className={`py-3.5 font-bold ${net >= 0 ? 'text-brand-primary' : 'text-rose-600'}`}>
                                    Rp {Number(net).toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              );
                            })}
                            {(financialData?.trend || []).length === 0 && (
                              <tr>
                                <td colSpan="4" className="text-center py-6 text-slate-400 font-medium">Belum ada riwayat transaksi bulanan.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                </div>
              )}

              {/* TAB 5: LAYANAN CATALOG */}
              {activeTab === 'services' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {services.map((serv) => (
                    <div key={serv.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-bold text-slate-900">{serv.service_name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          serv.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {serv.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 leading-relaxed min-h-[48px]">{serv.description}</p>
                      
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-medium">Estimasi Durasi</span>
                        <span className="text-xs font-bold text-slate-700">{serv.estimated_days} Hari</span>
                      </div>

                      <div className="flex justify-between items-center pt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">Harga Jasa</span>
                        <span className="text-sm font-black text-brand-primary">Rp {Number(serv.price).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </main>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL MODUL WINDOWS */}
      
      {/* 1. ORDER BARU MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Buat Nota Order Baru</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-900 font-medium text-xs">Tutup</button>
            </header>

            <form onSubmit={handleCreateOrder} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Customer Selector */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Pilih Pelanggan</label>
                  <button 
                    type="button" 
                    onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                    className="text-[10px] font-bold text-brand-primary hover:underline"
                  >
                    {showNewCustomerForm ? '← Batal' : '+ Daftar Customer Baru'}
                  </button>
                </div>

                {!showNewCustomerForm ? (
                  <select 
                    value={newOrderCustomer}
                    onChange={(e) => setNewOrderCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    required
                  >
                    <option value="">-- Pilih Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>
                    ))}
                  </select>
                ) : (
                  /* Nested Register Customer Form */
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700">Daftarkan Pelanggan Baru</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Nama Lengkap" 
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="bg-white border border-slate-250 text-xs rounded-lg p-2.5"
                      />
                      <input 
                        type="text" 
                        placeholder="No. WhatsApp (08...)" 
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="bg-white border border-slate-250 text-xs rounded-lg p-2.5"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleCreateCustomer}
                      className="px-4 py-2 bg-brand-primary text-white text-[10px] font-bold rounded-lg"
                    >
                      Simpan & Pilih Customer
                    </button>
                  </div>
                )}
              </div>

              {/* Order Items Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Item Sepatu & Layanan</label>
                  <button 
                    type="button" 
                    onClick={handleAddOrderItem}
                    className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-0.5"
                  >
                    + Tambah Sepatu
                  </button>
                </div>

                {newOrderItems.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative">
                    {newOrderItems.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveOrderItem(idx)}
                        className="absolute right-3 top-3 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Brand Sepatu</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Nike" 
                          value={item.shoe_brand}
                          onChange={(e) => handleItemChange(idx, 'shoe_brand', e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Model / Tipe</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Air Force 1" 
                          value={item.shoe_type}
                          onChange={(e) => handleItemChange(idx, 'shoe_type', e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Pilih Layanan</label>
                        <select 
                          value={item.service_id}
                          onChange={(e) => handleItemChange(idx, 'service_id', e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5"
                          required
                        >
                          <option value="">-- Pilih Jasa --</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>{s.service_name} (Rp {Number(s.price).toLocaleString('id-ID')})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold mb-1">Warna Sepatu</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Putih" 
                          value={item.shoe_color}
                          onChange={(e) => handleItemChange(idx, 'shoe_color', e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5"
                        />
                      </div>
                    </div>

                    {/* Multi File Input for Before Photos */}
                    <div className="mt-2">
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">Foto Before (Maksimal 4 Foto)</label>
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files).slice(0, 4);
                          handleItemChange(idx, 'files', files);
                        }}
                        className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-brand-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Metode Pengambilan</label>
                  <select 
                    value={newOrderPickup}
                    onChange={(e) => setNewOrderPickup(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="Drop-off">Pelanggan Antar Sendiri</option>
                    <option value="Delivery">Kirim Kurir</option>
                    <option value="Pickup-Delivery">Antar Jemput Lave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Diskon Tambahan (Voucher / Promo)</label>
                  <input 
                    type="number" 
                    placeholder="Rp 0" 
                    value={newOrderDiscount}
                    onChange={(e) => setNewOrderDiscount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Catatan Pesanan</label>
                <textarea 
                  rows="2" 
                  value={newOrderNotes}
                  onChange={(e) => setNewOrderNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Catatan pengerjaan khusus, dll..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-cyan text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Buat Nota & Simpan Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. CATAT PENGELUARAN MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <header className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Catat Pengeluaran Baru</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-900 font-medium text-xs">Tutup</button>
            </header>

            <form onSubmit={handleRecordExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Pengeluaran</label>
                <select 
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.filter(c => c.category_type === 'Expense').map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nominal (Rupiah)</label>
                <input 
                  type="number" 
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Rp 0" 
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Pengeluaran</label>
                <input 
                  type="date" 
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi / Detail</label>
                <textarea 
                  rows="2" 
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Misal: Beli sabun cuci sneaker 5 liter, dll..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-rose-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-rose-600/20 transition-all"
              >
                Simpan Transaksi Pengeluaran
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. ASSET BARU MODAL */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <header className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Catat Pembelian Aset</h3>
              <button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-slate-900 font-medium text-xs">Tutup</button>
            </header>

            <form onSubmit={handleRecordAsset} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Barang Aset</label>
                <input 
                  type="text" 
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="Contoh: Mesin Steam Laundry, Vacuum Cleaner" 
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Harga Beli</label>
                  <input 
                    type="number" 
                    value={assetPrice}
                    onChange={(e) => setAssetPrice(e.target.value)}
                    placeholder="Rp 0" 
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Masa Manfaat (Bln)</label>
                  <input 
                    type="number" 
                    value={assetMonths}
                    onChange={(e) => setAssetMonths(e.target.value)}
                    placeholder="Misal: 24" 
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nilai Sisa (Residual)</label>
                  <input 
                    type="number" 
                    value={assetResidual}
                    onChange={(e) => setAssetResidual(e.target.value)}
                    placeholder="Rp 0" 
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Beli</label>
                  <input 
                    type="date" 
                    value={assetDate}
                    onChange={(e) => setAssetDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Simpan Aset & Setting Depresiasi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. PAYMENT RECORD MODAL */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <header className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900">Catat Pembayaran Order</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-900 font-medium text-xs">Tutup</button>
            </header>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nomor Struk</span>
                  <span className="font-bold text-slate-950">{selectedOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Customer</span>
                  <span className="font-bold text-slate-950">{selectedOrder.customer?.full_name}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm">
                  <span className="text-slate-900">Total Tagihan</span>
                  <span className="text-brand-primary">Rp {Number(selectedOrder.total_price).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Metode Pembayaran</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                >
                  <option value="Cash">Uang Tunai (Cash)</option>
                  <option value="QRIS">QRIS Statis Lave</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="E-Wallet">E-Wallet (Gopay/OVO/Dana)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nominal Bayar (Rupiah)</label>
                <input 
                  type="number" 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor Referensi / Bukti Transfer (Opsional)</label>
                <input 
                  type="text" 
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Misal: Ref #893247" 
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-600/20 transition-all"
              >
                Konfirmasi Pelunasan & Cetak
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. CATAT PEMASUKAN MODAL */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <header className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900 font-sans">Catat Pemasukan Baru</h3>
              <button onClick={() => setShowIncomeModal(false)} className="text-slate-400 hover:text-slate-900 font-medium text-xs">Tutup</button>
            </header>

            <form onSubmit={handleRecordIncome} className="p-6 space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kategori Pemasukan</label>
                <select 
                  value={incomeCategory}
                  onChange={(e) => setIncomeCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.filter(c => c.category_type === 'Income').map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nominal (Rupiah)</label>
                <input 
                  type="number" 
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  placeholder="Rp 0" 
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Transaksi</label>
                <input 
                  type="date" 
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi / Detail</label>
                <textarea 
                  rows="2" 
                  value={incomeDesc}
                  onChange={(e) => setIncomeDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-3.5 focus:outline-none"
                  placeholder="Misal: Penjualan produk shoe cleaner botol 250ml, dll..."
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-600/20 transition-all"
              >
                Simpan Transaksi Pemasukan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. DETIL ORDER & INVOICE MODAL */}
      {showOrderDetailModal && selectedOrderForDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900 font-sans">Detail Rincian Nota Order</h3>
              <button onClick={() => setShowOrderDetailModal(false)} className="text-slate-400 hover:text-slate-900 font-medium text-xs">Tutup</button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans">
              
              {/* Order Info Summary */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div className="space-y-1.5">
                  <p className="text-slate-400">NOMOR INVOICE</p>
                  <p className="font-bold text-slate-900 text-sm">{selectedOrderForDetail.order_number}</p>
                  <p className="text-slate-400 mt-2">NAMA CUSTOMER</p>
                  <p className="font-semibold text-slate-700">{selectedOrderForDetail.customer?.full_name}</p>
                  <p className="text-slate-400">NO. WHATSAPP</p>
                  <p className="text-slate-600">{selectedOrderForDetail.customer?.phone}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-slate-400">STATUS PENGERJAAN</p>
                  <p className="font-bold text-slate-900">{selectedOrderForDetail.status}</p>
                  <p className="text-slate-400 mt-2">METODE PENGAMBILAN</p>
                  <p className="font-semibold text-slate-700">{selectedOrderForDetail.pickup_method}</p>
                  <p className="text-slate-400">STATUS PEMBAYARAN</p>
                  <p className={`font-bold ${selectedOrderForDetail.payment_transaction?.payment_status === 'Paid' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {selectedOrderForDetail.payment_transaction?.payment_status === 'Paid' ? 'LUNAS (SAH - NO REVISION)' : 'BELUM BAYAR'}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Sepatu & Layanan</h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                  {selectedOrderForDetail.items?.map((item, idx) => (
                    <div key={idx} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{item.shoe_brand} - {item.shoe_type}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Warna: {item.shoe_color || '-'} | Qty: {item.qty} pasang</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-brand-primary text-[10px] font-bold uppercase">{item.service?.service_name}</span>
                          <p className="font-bold text-slate-700 text-xs mt-1">Rp {Number(item.subtotal).toLocaleString('id-ID')}</p>
                        </div>
                      </div>

                      {/* Before/After Gallery with lightbox click */}
                      {item.photos && item.photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Before</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {item.photos.filter(p => p.photo_type === 'Before').map((ph, pIdx) => (
                                <button key={pIdx} type="button" onClick={() => setPreviewImage(ph.photo_url)} className="focus:outline-none">
                                  <img src={formatPhotoUrl(ph.photo_url)} className="w-10 h-10 object-cover rounded border border-slate-200 hover:opacity-80" alt="Before" />
                                </button>
                              ))}
                              {item.photos.filter(p => p.photo_type === 'Before').length === 0 && (
                                <span className="text-[9px] text-slate-400 italic">Tidak ada foto sebelum</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 mb-1 tracking-wider uppercase">After</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {item.photos.filter(p => p.photo_type === 'After').map((ph, pIdx) => (
                                <button key={pIdx} type="button" onClick={() => setPreviewImage(ph.photo_url)} className="focus:outline-none">
                                  <img src={formatPhotoUrl(ph.photo_url)} className="w-10 h-10 object-cover rounded border border-slate-200 hover:opacity-80" alt="After" />
                                </button>
                              ))}
                              {item.photos.filter(p => p.photo_type === 'After').length === 0 && (
                                <span className="text-[9px] text-slate-400 italic">Belum ada foto sesudah</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation details */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div className="text-slate-500 space-y-1">
                  <p>Subtotal: Rp {Number(selectedOrderForDetail.subtotal).toLocaleString('id-ID')}</p>
                  <p className="text-rose-500">Diskon: - Rp {Number(selectedOrderForDetail.discount).toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Pembayaran</p>
                  <p className="text-lg font-black text-brand-primary">Rp {Number(selectedOrderForDetail.total_price).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>

            <footer className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => handlePrintInvoice(selectedOrderForDetail)}
                className="px-4 py-2.5 bg-brand-primary hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow"
              >
                Cetak Nota / PDF
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Preview overlay */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={formatPhotoUrl(previewImage)} className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/10" alt="Preview" />
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white font-bold hover:text-slate-300 text-xs bg-slate-900/60 px-3 py-1.5 rounded-full border border-white/10">Tutup Preview</button>
          </div>
        </div>
      )}

      {/* 5. QC PHOTO UPLOAD MODAL */}
      {showQcUploadModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden">
            <header className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-slate-900 font-sans">Upload Foto QC & Set Ready</h3>
              <button onClick={() => setShowQcUploadModal(false)} className="text-slate-400 hover:text-slate-900 font-medium text-xs">Tutup</button>
            </header>

            <form onSubmit={handleQcUploadSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-600 leading-relaxed font-sans">Pilih hingga 4 foto kondisi sepatu setelah dibersihkan (After) untuk QC. Status akan otomatis berubah menjadi <strong>Ready (Siap Diambil)</strong> setelah upload berhasil.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Foto Kondisi Sesudah (Maksimal 4 Foto)</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files).slice(0, 4);
                    setQcFiles(files);
                  }}
                  className="w-full bg-slate-50 border border-slate-250 text-xs rounded-xl p-3.5 focus:outline-none"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-cyan text-white text-xs font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Kirim Foto QC & Ubah ke Ready
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
