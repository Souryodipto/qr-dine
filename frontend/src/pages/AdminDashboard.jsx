import { useState, useEffect } from 'react';
import { adminApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, ShoppingBag, DollarSign, Users, RefreshCw, LogOut,
  Key, ToggleLeft, ToggleRight, Search, ChevronDown, ChevronUp,
  TrendingUp, CheckCircle, XCircle, Calendar, BarChart3,
  Globe, Phone, Mail, Menu, X, AlertCircle, Package, Plus,
  Banknote, Trash2, CreditCard, Activity, Zap, ArrowUpRight, Filter
} from 'lucide-react';

// ─── Stat Card ───
function StatCard({ icon: Icon, label, value, sub, gradient, textColor = 'text-white' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden p-5 border border-white/10 ${gradient}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-white/20" />
      </div>
      <p className={`text-2xl sm:text-3xl font-black tracking-tight ${textColor}`}>{value}</p>
      <p className="text-[10px] font-bold tracking-widest uppercase text-white/50 mt-1">{label}</p>
      {sub && <p className="text-[9px] text-white/30 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

// ─── Restaurant Card ───
function RestaurantCard({ r, onToggle, onReset, loading, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-[#111] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
    >
      {/* Main row */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {r.logo ? (
            <img src={r.logo} alt={r.name} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-white font-black text-base">{r.name?.charAt(0)}</span>
            </div>
          )}
          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#111] ${r.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-white text-sm truncate">{r.name}</h3>
          </div>
          <p className="text-[10px] text-white/40 truncate">{r.email}</p>
          <p className="text-[9px] text-white/25 mt-0.5">/{r.slug} {r.city ? `· ${r.city}` : ''}</p>
        </div>

        {/* Metrics */}
        <div className="hidden md:flex items-center gap-5 flex-shrink-0">
          <div className="text-center">
            <p className="text-sm font-black text-white">{r.totalOrders || 0}</p>
            <p className="text-[8px] text-white/30 uppercase tracking-widest">Orders</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-sm font-black text-green-400">₹{((r.totalRevenue || 0) / 1000).toFixed(1)}k</p>
            <p className="text-[8px] text-white/30 uppercase tracking-widest">Revenue</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <span className={`text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full ${r.isActive ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'}`}>
            {r.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <ChevronDown className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 bg-white/[0.02]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total Orders', value: r.totalOrders || 0, color: 'text-blue-400' },
                  { label: 'Revenue', value: `₹${(r.totalRevenue || 0).toLocaleString()}`, color: 'text-green-400' },
                  { label: 'City', value: r.city || '—', color: 'text-white' },
                  { label: 'Phone', value: r.phone || '—', color: 'text-white' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/8 rounded-lg p-3">
                    <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">{item.label}</p>
                    <p className={`${item.color} font-bold text-sm`}>{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(r._id); }}
                  disabled={!!loading[r._id]}
                  className={`flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg border transition disabled:opacity-40 ${
                    r.isActive
                      ? 'border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500'
                      : 'border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white hover:border-green-500'
                  }`}
                >
                  {loading[r._id] === 'toggle' ? (
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : r.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {r.isActive ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); onReset(r._id); }}
                  disabled={!!loading[r._id]}
                  className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg border border-white/15 text-white/50 hover:bg-white hover:text-black hover:border-white transition disabled:opacity-40"
                >
                  {loading[r._id] === 'password' ? (
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : <Key className="w-3.5 h-3.5" />}
                  Reset Password
                </button>

                <a
                  href={`/menu/${r.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg border border-white/15 text-white/50 hover:bg-white hover:text-black hover:border-white transition"
                >
                  <Globe className="w-3.5 h-3.5" /> View Menu
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───
export default function AdminDashboard() {
  const [restaurants, setRestaurants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('restaurants');
  const [payouts, setPayouts] = useState([]);
  const [earningsOverview, setEarningsOverview] = useState([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ restaurantId: '', amount: '', method: 'Bank', type: 'Payout', status: 'Pending', notes: '', referenceId: '' });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [adminData, restaurantData, payoutsData, earningsData] = await Promise.all([
        adminApi.getDashboard().catch(() => null),
        adminApi.getRestaurants(),
        adminApi.getPayouts().catch(() => []),
        adminApi.getEarningsOverview().catch(() => [])
      ]);
      setStats(adminData);
      setRestaurants(restaurantData.restaurants || []);
      setPayouts(payoutsData || []);
      setEarningsOverview(earningsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleToggle = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'toggle' }));
    try {
      const result = await adminApi.toggleRestaurant(id);
      setRestaurants(prev => prev.map(r => r._id === id ? { ...r, isActive: result.isActive } : r));
    } catch (err) { alert(err.message); }
    finally { setActionLoading(prev => ({ ...prev, [id]: null })); }
  };

  const handleResetPassword = async (id) => {
    if (!confirm('Reset this restaurant\'s owner password?')) return;
    setActionLoading(prev => ({ ...prev, [id]: 'password' }));
    try {
      const result = await adminApi.resetPassword(id);
      alert(`New temporary password: ${result.newPassword}\n\nShare this securely.`);
    } catch (err) { alert(err.message); }
    finally { setActionLoading(prev => ({ ...prev, [id]: null })); }
  };

  const handleCreatePayout = async (e) => {
    e.preventDefault();
    setActionLoading(prev => ({ ...prev, payoutCreate: true }));
    try {
      const p = await adminApi.createPayout({ ...payoutForm, amount: parseFloat(payoutForm.amount) });
      setPayouts(prev => [p, ...prev]);
      setShowPayoutModal(false);
      setPayoutForm({ restaurantId: '', amount: '', method: 'Bank', type: 'Payout', status: 'Pending', notes: '', referenceId: '' });
    } catch (err) { alert(err.message); }
    finally { setActionLoading(prev => ({ ...prev, payoutCreate: false })); }
  };

  const handleUpdatePayoutStatus = async (id, status) => {
    try {
      const p = await adminApi.updatePayout(id, { status });
      setPayouts(prev => prev.map(x => x._id === id ? p : x));
    } catch (err) { alert(err.message); }
  };

  const handleDeletePayout = async (id) => {
    if (!confirm('Delete this payout record?')) return;
    try {
      await adminApi.deletePayout(id);
      setPayouts(prev => prev.filter(x => x._id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleQuickSend = async (restaurantId, amount, day) => {
    if (!confirm(`Send ₹${amount.toLocaleString()} to this restaurant for ${day}'s earnings?`)) return;
    setActionLoading(prev => ({ ...prev, [`qs_${restaurantId}_${day}`]: true }));
    try {
      const p = await adminApi.quickSendPayout({ restaurantId, amount, day });
      setPayouts(prev => [p, ...prev]);
      // Refresh earnings overview
      const updated = await adminApi.getEarningsOverview().catch(() => earningsOverview);
      setEarningsOverview(updated || []);
    } catch (err) { alert(err.message); }
    finally { setActionLoading(prev => ({ ...prev, [`qs_${restaurantId}_${day}`]: false })); }
  };

  const handleLogout = async () => { await logout(); navigate('/admin-login'); };

  const filtered = restaurants.filter(r => {
    const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
                        r.email?.toLowerCase().includes(search.toLowerCase()) ||
                        r.slug?.toLowerCase().includes(search.toLowerCase());
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? r.isActive : !r.isActive);
    return matchSearch && matchActive;
  });

  const activeCount = restaurants.filter(r => r.isActive).length;
  const inactiveCount = restaurants.length - activeCount;
  const totalPayoutAmount = payouts.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const pendingPayoutAmount = payouts.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="w-12 h-12 border-2 border-white/10 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-bold tracking-widest uppercase text-white/30">Loading Platform...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-white/10">
              <span className="text-black font-black text-xs">QD</span>
            </div>
            <div>
              <span className="font-black text-white text-sm tracking-tight">Platform Admin</span>
              <p className="text-[9px] text-white/30 tracking-widest uppercase hidden sm:block">Super Console</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="hidden md:flex bg-white/5 border border-white/10 p-1 rounded-xl gap-1">
            {[
              { id: 'restaurants', icon: Store, label: 'Restaurants' },
              { id: 'payouts', icon: Banknote, label: 'Payouts' },
              { id: 'earnings', icon: Activity, label: 'Earnings' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase transition rounded-lg ${
                  activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-white/50 hover:text-white'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
            </div>
            <button onClick={loadData} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg border border-white/15 text-white/50 hover:bg-white hover:text-black hover:border-white transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 text-sm rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ─── HERO STATS ─── */}
        <div>
          <div className="mb-4">
            <h1 className="text-2xl font-black text-white tracking-tight">Platform Overview</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Real-time network monitoring</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={Store} label="Total Restaurants" value={restaurants.length}
              sub={`${activeCount} active · ${inactiveCount} inactive`}
              gradient="bg-gradient-to-br from-[#1a1a2e] to-[#111]"
            />
            <StatCard
              icon={Activity} label="Active Tenants" value={activeCount}
              gradient="bg-gradient-to-br from-green-900/40 to-[#111]" textColor="text-green-400"
            />
            <StatCard
              icon={ShoppingBag} label="Today's Orders" value={stats?.orderStats?.today ?? '—'}
              gradient="bg-gradient-to-br from-blue-900/40 to-[#111]" textColor="text-blue-400"
            />
            <StatCard
              icon={Zap} label="Active Subscriptions" value={stats?.activeSubscriptions ?? '—'}
              gradient="bg-gradient-to-br from-purple-900/40 to-[#111]" textColor="text-purple-400"
            />
          </div>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        {activeTab === 'restaurants' && (
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">All Restaurants</h2>
                <p className="text-[10px] text-white/30 mt-0.5">{filtered.length} of {restaurants.length} shown</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="w-full sm:w-52 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-white/25 outline-none focus:border-white/30 transition"
                  />
                </div>
                <div className="flex gap-1">
                  {['all', 'active', 'inactive'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilterActive(f)}
                      className={`text-[9px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg border transition ${
                        filterActive === f ? 'bg-white text-black border-white' : 'border-white/15 text-white/40 hover:border-white/30'
                      }`}
                    >
                      {f === 'all' ? `All (${restaurants.length})` : f === 'active' ? `Active (${activeCount})` : `Off (${inactiveCount})`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <div className="border border-white/10 rounded-xl text-center py-20 bg-white/[0.02]">
                <Store className="w-12 h-12 mx-auto mb-4 text-white/15" />
                <p className="font-bold text-white/30 text-sm">
                  {search || filterActive !== 'all' ? 'No restaurants match your filter' : 'No restaurants registered yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((r, i) => (
                  <RestaurantCard key={r._id} r={r} index={i} onToggle={handleToggle} onReset={handleResetPassword} loading={actionLoading} />
                ))}
              </div>
            )}

            {/* Footer summary */}
            <div className="border-t border-white/8 pt-4 flex flex-wrap gap-6 text-[9px] font-bold tracking-widest uppercase text-white/20">
              <span>{restaurants.length} Restaurants</span>
              <span>{activeCount} Active</span>
              <span>{inactiveCount} Inactive</span>
              {stats?.orderStats?.total && <span>{stats.orderStats.total} Total Orders</span>}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">Daily Earnings Overview</h2>
                <p className="text-[10px] text-white/30 mt-0.5">Today &amp; yesterday revenue per restaurant — send payouts instantly</p>
              </div>
              <button onClick={loadData} className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-3 py-2 rounded-lg border border-white/15 text-white/40 hover:bg-white hover:text-black hover:border-white transition">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {earningsOverview.length === 0 ? (
                <div className="bg-[#111] border border-white/10 rounded-xl py-16 text-center">
                  <Activity className="w-8 h-8 mx-auto mb-3 text-white/20" />
                  <p className="text-white/30 text-sm font-bold">No active restaurants</p>
                </div>
              ) : earningsOverview.map(r => (
                <div key={r._id} className="bg-[#111] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                  <div className="flex flex-col md:flex-row">
                    {/* Restaurant info */}
                    <div className="flex items-center gap-3 p-4 md:w-56 md:border-r border-white/10 flex-shrink-0">
                      {r.logo ? (
                        <img src={r.logo} className="w-10 h-10 rounded-lg object-cover border border-white/10 flex-shrink-0" alt={r.name} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-black text-xs">{r.name?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{r.name}</p>
                        <p className="text-[9px] text-white/30 mt-0.5">Active Restaurant</p>
                      </div>
                    </div>

                    {/* Today */}
                    <div className="flex-1 p-4 border-r border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Today</p>
                          <p className="text-[9px] text-white/25">{r.today.orders} orders</p>
                        </div>
                        {r.today.payout ? (
                          <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            r.today.payout.status === 'Paid'
                              ? 'bg-green-500/15 text-green-400 border-green-500/25'
                              : 'bg-orange-500/15 text-orange-400 border-orange-500/25'
                          }`}>{r.today.payout.status}</span>
                        ) : r.today.amount > 0 ? (
                          <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Not Sent</span>
                        ) : null}
                      </div>
                      <p className="text-xl font-black text-white">₹{r.today.amount.toLocaleString()}</p>
                      {r.today.amount > 0 && !r.today.payout && (
                        <button
                          onClick={() => handleQuickSend(r._id, r.today.amount, 'today')}
                          disabled={!!actionLoading[`qs_${r._id}_today`]}
                          className="mt-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-400 transition disabled:opacity-50"
                        >
                          {actionLoading[`qs_${r._id}_today`] ? (
                            <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          ) : <Zap className="w-3 h-3" />}
                          Send Now
                        </button>
                      )}
                    </div>

                    {/* Yesterday */}
                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Yesterday</p>
                          <p className="text-[9px] text-white/25">{r.yesterday.orders} orders</p>
                        </div>
                        {r.yesterday.payout ? (
                          <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                            r.yesterday.payout.status === 'Paid'
                              ? 'bg-green-500/15 text-green-400 border-green-500/25'
                              : 'bg-orange-500/15 text-orange-400 border-orange-500/25'
                          }`}>{r.yesterday.payout.status}</span>
                        ) : r.yesterday.amount > 0 ? (
                          <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Not Sent</span>
                        ) : null}
                      </div>
                      <p className="text-xl font-black text-white/70">₹{r.yesterday.amount.toLocaleString()}</p>
                      {r.yesterday.amount > 0 && !r.yesterday.payout && (
                        <button
                          onClick={() => handleQuickSend(r._id, r.yesterday.amount, 'yesterday')}
                          disabled={!!actionLoading[`qs_${r._id}_yesterday`]}
                          className="mt-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition disabled:opacity-50"
                        >
                          {actionLoading[`qs_${r._id}_yesterday`] ? (
                            <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          ) : <Zap className="w-3 h-3" />}
                          Send Overdue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="space-y-6">

            {/* Payouts Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-white">Financial Payouts</h2>
                <p className="text-[10px] text-white/30 mt-0.5">{payouts.length} recorded transfers globally</p>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="flex items-center gap-2 bg-white text-black px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-100 transition shadow-lg shadow-white/10"
              >
                <Plus className="w-3.5 h-3.5" /> Log Payout
              </button>
            </div>

            {/* Payout Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#111] border border-white/10 rounded-xl p-4">
                <p className="text-[9px] font-bold tracking-widest uppercase text-white/40 mb-1">Total Disbursed</p>
                <p className="text-xl font-black text-green-400">₹{totalPayoutAmount.toLocaleString()}</p>
              </div>
              <div className="bg-[#111] border border-white/10 rounded-xl p-4">
                <p className="text-[9px] font-bold tracking-widest uppercase text-white/40 mb-1">Pending Amount</p>
                <p className="text-xl font-black text-orange-400">₹{pendingPayoutAmount.toLocaleString()}</p>
              </div>
              <div className="bg-[#111] border border-white/10 rounded-xl p-4">
                <p className="text-[9px] font-bold tracking-widest uppercase text-white/40 mb-1">Total Entries</p>
                <p className="text-xl font-black text-white">{payouts.length}</p>
              </div>
            </div>

            {/* Payouts Table */}
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="text-[9px] font-bold tracking-widest uppercase text-white/30 border-b border-white/8 bg-white/[0.02]">
                    <tr>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Restaurant</th>
                      <th className="px-5 py-3.5">Amount</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Method</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payouts.map((p) => (
                      <tr key={p._id} className="hover:bg-white/[0.025] transition group">
                        <td className="px-5 py-3.5 text-white/40 font-mono text-[10px]">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-black text-[9px]">{(p.restaurantId?.name || '?').charAt(0)}</span>
                            </div>
                            <span className="font-bold text-white text-[11px]">{p.restaurantId?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-black text-sm">₹{p.amount.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-white/50 text-[10px]">{p.type}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            p.status === 'Paid'
                              ? 'bg-green-500/15 text-green-400 border-green-500/25'
                              : 'bg-orange-500/15 text-orange-400 border-orange-500/25'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-[9px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                            {p.method}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                            {p.status === 'Pending' && (
                              <button
                                onClick={() => handleUpdatePayoutStatus(p._id, 'Paid')}
                                className="text-[9px] font-bold uppercase tracking-widest text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-2 py-1 rounded transition"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePayout(p._id)}
                              className="p-1.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {payouts.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-5 py-16 text-center text-white/25 text-xs font-bold uppercase tracking-widest">
                          <Banknote className="w-8 h-8 mx-auto mb-3 opacity-30" />
                          No payouts recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ─── CREATE PAYOUT MODAL ─── */}
      <AnimatePresence>
        {showPayoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPayoutModal(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-[#111] border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Log New Payout</h3>
                  <p className="text-[10px] text-white/30 mt-0.5 tracking-widest uppercase">Record a financial transfer</p>
                </div>
                <button onClick={() => setShowPayoutModal(false)} className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePayout} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold tracking-widest uppercase text-white/40">Restaurant</label>
                  <select required value={payoutForm.restaurantId} onChange={e => setPayoutForm({...payoutForm, restaurantId: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-xs px-3 py-2.5 outline-none focus:border-white/30 transition"
                  >
                    <option value="">Select Restaurant</option>
                    {restaurants.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold tracking-widest uppercase text-white/40">Amount (₹)</label>
                    <input required type="number" min="1" value={payoutForm.amount} onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-xs px-3 py-2.5 outline-none focus:border-white/30 transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold tracking-widest uppercase text-white/40">Status</label>
                    <select value={payoutForm.status} onChange={e => setPayoutForm({...payoutForm, status: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-xs px-3 py-2.5 outline-none focus:border-white/30 transition"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold tracking-widest uppercase text-white/40">Type</label>
                    <select value={payoutForm.type} onChange={e => setPayoutForm({...payoutForm, type: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-xs px-3 py-2.5 outline-none focus:border-white/30 transition"
                    >
                      <option value="Payout">Payout</option>
                      <option value="Salary">Salary</option>
                      <option value="Bonus">Bonus</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold tracking-widest uppercase text-white/40">Method</label>
                    <select value={payoutForm.method} onChange={e => setPayoutForm({...payoutForm, method: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-xs px-3 py-2.5 outline-none focus:border-white/30 transition"
                    >
                      <option value="Bank">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold tracking-widest uppercase text-white/40">Reference ID (optional)</label>
                  <input type="text" value={payoutForm.referenceId} onChange={e => setPayoutForm({...payoutForm, referenceId: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-xs px-3 py-2.5 outline-none focus:border-white/30 transition"
                    placeholder="e.g. UTR12345..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold tracking-widest uppercase text-white/40">Notes (optional)</label>
                  <textarea value={payoutForm.notes} onChange={e => setPayoutForm({...payoutForm, notes: e.target.value})} rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg text-white text-xs px-3 py-2.5 outline-none focus:border-white/30 transition resize-none"
                    placeholder="Internal memo..."
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowPayoutModal(false)} className="text-[10px] uppercase font-bold text-white/30 hover:text-white transition px-4 py-2 rounded-lg hover:bg-white/5">
                    Cancel
                  </button>
                  <button type="submit" disabled={actionLoading.payoutCreate}
                    className="bg-white text-black px-6 py-2 text-[10px] font-black tracking-widest uppercase rounded-lg hover:bg-gray-100 transition disabled:opacity-50 shadow-lg"
                  >
                    {actionLoading.payoutCreate ? 'Saving...' : 'Log Payout'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
