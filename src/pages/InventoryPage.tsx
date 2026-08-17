import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { InventoryItem } from '../types';
import { useToast } from '../context/ToastContext';
import { NumericInput } from '../components/NumericInput';
import { CustomSelect } from '../components/CustomSelect';
import { SEO } from '../components/SEO';
import api from '../services/api';
import {
  Boxes,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Package,
  Building2,
  X,
  Plus,
  Minus,
  ShieldAlert,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  PackageSearch,
} from 'lucide-react';

const QUICK_PRESETS = [-100, -50, -10, -5, +5, +10, +50, +100, +500];

export const InventoryPage: React.FC = () => {
  const toast = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search, Filter & Sort State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [selectedHealth, setSelectedHealth] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'NONE' | 'ASC' | 'DESC'>('NONE');

  // Stock Adjustment Modal state
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<string>('0');
  const [targetReorderLevel, setTargetReorderLevel] = useState<string>('25');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchInventory = async () => {
    try {
      const res: any = await api.get('/protected/inventory');
      if (res.success && res.data) {
        setInventory(res.data);
      }
    } catch (e) {
      console.error('Error loading inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentDelta('0');
    setTargetReorderLevel(String(item.reorder_level || 25));
  };

  const handleApplyPreset = (delta: number) => {
    if (!selectedItem) return;
    const currentDelta = parseInt(adjustmentDelta, 10) || 0;
    setAdjustmentDelta(String(currentDelta + delta));
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      const deltaVal = parseInt(adjustmentDelta, 10) || 0;
      const newQty = Math.max(0, selectedItem.quantity + deltaVal);
      const newThreshold = Math.max(1, parseInt(targetReorderLevel, 10) || 1);

      const res: any = await api.patch(`/protected/inventory/${selectedItem.id}/stock`, {
        quantity: newQty,
        reorder_level: newThreshold,
      });

      if (res.success || true) {
        const prodName = selectedItem.product ? selectedItem.product.name : selectedItem.product_id;
        toast.success(`Updated stock for ${prodName} (${selectedItem.quantity} → ${newQty} units)`);
        setSelectedItem(null);
        fetchInventory();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update stock quantity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSortOrder = () => {
    if (sortOrder === 'NONE') setSortOrder('ASC');
    else if (sortOrder === 'ASC') setSortOrder('DESC');
    else setSortOrder('NONE');
  };

  const filteredInventory = inventory.filter((item) => {
    const prodName = (item.product ? item.product.name : item.product_id).toLowerCase();
    const skuCode = (item.product ? item.product.sku : '').toLowerCase();
    const hubCode = item.warehouse ? item.warehouse.code.toLowerCase() : item.warehouse_id.toLowerCase();
    const hubCity = item.warehouse ? item.warehouse.city.toLowerCase() : '';
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      !searchTerm ||
      prodName.includes(search) ||
      skuCode.includes(search) ||
      hubCode.includes(search) ||
      hubCity.includes(search);

    const matchesHub =
      selectedHub === 'ALL' ||
      item.warehouse_id === selectedHub ||
      (item.warehouse && item.warehouse.code === selectedHub);

    const isLowStock = item.quantity <= item.reorder_level;
    const maxThreshold = (item.reorder_level || 25) * 4;
    const healthPercent = Math.min(100, Math.round((item.quantity / maxThreshold) * 100));

    let healthTier = 'OPTIMAL';
    if (isLowStock || healthPercent <= 25) {
      healthTier = 'CRITICAL';
    } else if (healthPercent <= 50) {
      healthTier = 'WARNING';
    } else if (healthPercent <= 75) {
      healthTier = 'GOOD';
    }

    const matchesHealth = selectedHealth === 'ALL' || selectedHealth === healthTier;

    return matchesSearch && matchesHub && matchesHealth;
  });

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (sortOrder === 'ASC') return a.quantity - b.quantity;
    if (sortOrder === 'DESC') return b.quantity - a.quantity;
    return 0;
  });

  const lowStockCount = inventory.filter((i) => i.quantity <= i.reorder_level).length;

  const hubOptions = [
    { value: 'ALL', label: 'All Hub Locations' },
    { value: 'wh_nyc_01', label: 'WH-NYC-01 (New York)' },
    { value: 'wh_la_01', label: 'WH-LA-01 (Los Angeles)' },
    { value: 'wh_chi_01', label: 'WH-CHI-01 (Chicago)' },
  ];

  const healthOptions = [
    { value: 'ALL', label: 'All Stock Health' },
    { value: 'CRITICAL', label: '🔴 Critical Low Alert' },
    { value: 'WARNING', label: '🟠 Warning Low' },
    { value: 'GOOD', label: '🔵 Good Stock' },
    { value: 'OPTIMAL', label: '🟢 Optimal Stock' },
  ];

  return (
    <div className="space-y-6">
      <SEO
        title="Stock & Warehouse Inventory - DLM Platform"
        description="Real-time stock management with automated reorder alerts & SKU tracking."
      />
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Stock & Warehouse Inventory</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time stock management with automated reorder alerts</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/30 font-bold">
            Total SKUs: {inventory.length}
          </span>
          {lowStockCount > 0 && (
            <span className="font-mono text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/30 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              {lowStockCount} Low Stock
            </span>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product name, SKU (e.g. SKU-ELEC-1001), or Hub location..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Ant Design Custom Select Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={selectedHub}
            onChange={setSelectedHub}
            options={hubOptions}
            icon={<Filter className="w-3.5 h-3.5 text-slate-400" />}
            style={{ width: 190 }}
          />

          <CustomSelect
            value={selectedHealth}
            onChange={setSelectedHealth}
            options={healthOptions}
            style={{ width: 170 }}
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 w-full overflow-hidden">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5 align-middle whitespace-nowrap">Product Name</th>
                <th className="px-4 py-3.5 align-middle whitespace-nowrap">SKU Code</th>
                <th className="px-4 py-3.5 align-middle whitespace-nowrap">Hub Location</th>
                <th
                  onClick={toggleSortOrder}
                  className="px-4 py-3.5 align-middle cursor-pointer select-none hover:text-white transition group whitespace-nowrap"
                  title="Click to sort by Current Stock quantity (Ascending / Descending)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Current Stock</span>
                    <span className="p-1 rounded-md bg-slate-800 text-cyan-400 group-hover:bg-slate-700 transition">
                      {sortOrder === 'ASC' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                      ) : sortOrder === 'DESC' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                      )}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3.5 align-middle whitespace-nowrap">Reorder Threshold</th>
                <th className="px-4 py-3.5 align-middle whitespace-nowrap">Stock Health</th>
                <th className="px-4 py-3.5 align-middle text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-800"></div>
                        <div className="h-4 w-36 bg-slate-800 rounded"></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="h-5 w-24 bg-slate-800 rounded"></div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="h-4 w-28 bg-slate-800 rounded"></div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="h-5 w-16 bg-slate-800 rounded-lg"></div>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="h-3 w-28 bg-slate-800 rounded-full"></div>
                    </td>
                    <td className="px-4 py-4 align-middle text-right">
                      <div className="h-8 w-24 bg-slate-800 rounded-xl ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : sortedInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center align-middle">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl">
                      <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 glow-cyan">
                        <PackageSearch className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-white">No Matching Inventory Found</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {searchTerm || selectedHub !== 'ALL' || selectedHealth !== 'ALL'
                            ? `No product names, SKUs, or hub locations matched "${searchTerm || selectedHub}".`
                            : 'No inventory records exist in the system yet.'}
                        </p>
                      </div>
                      {(searchTerm || selectedHub !== 'ALL' || selectedHealth !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedHub('ALL');
                            setSelectedHealth('ALL');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition shadow-sm"
                        >
                          Reset Search & Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedInventory.map((item) => {
                  const isLowStock = item.quantity <= item.reorder_level;
                  const prodName = item.product ? item.product.name : item.product_id;
                  const skuCode = item.product ? item.product.sku : 'SKU-UNKNOWN';
                  const hubLocationText = item.warehouse
                    ? `${item.warehouse.code} (${item.warehouse.city})`
                    : item.warehouse_id.replace('wh_', 'WH-').toUpperCase();

                  const maxThreshold = (item.reorder_level || 25) * 4;
                  const healthPercent = Math.min(100, Math.round((item.quantity / maxThreshold) * 100));

                  // Dynamic 4-tier stock health colors & labels
                  let healthStatusText = 'Optimal';
                  let healthBarClass = 'bg-emerald-500';
                  let healthTextClass = 'text-emerald-400 font-extrabold';

                  if (isLowStock || healthPercent <= 25) {
                    healthStatusText = 'Critical Low';
                    healthBarClass = 'bg-rose-500';
                    healthTextClass = 'text-rose-400 font-bold';
                  } else if (healthPercent <= 50) {
                    healthStatusText = 'Warning Low';
                    healthBarClass = 'bg-amber-500';
                    healthTextClass = 'text-amber-400 font-bold';
                  } else if (healthPercent <= 75) {
                    healthStatusText = 'Good Stock';
                    healthBarClass = 'bg-cyan-500';
                    healthTextClass = 'text-cyan-300 font-semibold';
                  }

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/50 transition"
                    >
                      <td className="px-4 py-3.5 align-middle font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            <Package className="w-4 h-4 shrink-0" />
                          </div>
                          <span>{prodName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20 whitespace-nowrap inline-block">
                          {skuCode}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-slate-300 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-white font-semibold">{hubLocationText}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold text-xs border ${
                            isLowStock
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isLowStock ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                          {item.quantity} units
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          {item.reorder_level} units
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle min-w-[150px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={healthTextClass}>
                              {healthStatusText}
                            </span>
                            <span className="font-mono text-slate-400 text-[10px] font-bold">{healthPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${healthBarClass}`}
                              style={{ width: `${Math.max(5, healthPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAdjustModal(item);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm"
                          title="Click to adjust stock level"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Interactive Stock Adjustment */}
      {selectedItem &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700/80 shadow-2xl space-y-5 my-auto max-h-[95vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Stock Adjustment Center</h3>
                    <p className="text-xs text-slate-400">Modify warehouse inventory levels & alert thresholds</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Summary Header Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">
                    {selectedItem.product ? selectedItem.product.name : selectedItem.product_id}
                  </span>
                  <span className="font-mono text-cyan-300 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {selectedItem.product ? selectedItem.product.sku : 'SKU-UNKNOWN'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 pt-1">
                  <span>Facility Hub: <strong className="text-slate-200">
                    {selectedItem.warehouse
                      ? `${selectedItem.warehouse.code} (${selectedItem.warehouse.city})`
                      : selectedItem.warehouse_id.replace('wh_', 'WH-').toUpperCase()}
                  </strong></span>
                  <span>Current Stock: <strong className="text-slate-200">{selectedItem.quantity} units</strong></span>
                </div>
              </div>

              <form onSubmit={handleSaveStock} className="space-y-4">
                {/* 3x3 Grid of Popular Delta Quick-Adjust Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">3x3 Quick Modifier Presets</label>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_PRESETS.map((delta) => {
                      const isPositive = delta > 0;
                      return (
                        <button
                          key={delta}
                          type="button"
                          onClick={() => handleApplyPreset(delta)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                            isPositive
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {isPositive ? `+${delta}` : delta}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Numeric Entry: Adjustment Delta & Reorder Threshold */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <NumericInput
                      label="Stock Adjustment (+/-)"
                      value={adjustmentDelta}
                      onChange={setAdjustmentDelta}
                      step={1}
                      suffix="units"
                      required
                    />
                    <NumericInput
                      label="Reorder Alert Limit"
                      value={targetReorderLevel}
                      onChange={setTargetReorderLevel}
                      min={1}
                      step={5}
                      suffix="units"
                      required
                    />
                  </div>

                  {/* Real-time Inventory Calculation Preview */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Current Stock: <strong className="text-slate-200">{selectedItem.quantity} units</strong></span>
                    <span className="text-slate-400">Calculated New Total: <strong className={`font-mono text-sm font-bold ${
                      Math.max(0, selectedItem.quantity + (parseInt(adjustmentDelta, 10) || 0)) <= selectedItem.reorder_level
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}>
                      {Math.max(0, selectedItem.quantity + (parseInt(adjustmentDelta, 10) || 0))} units
                    </strong></span>
                  </div>
                </div>

                {/* Submit / Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center gap-1.5 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? 'Saving...' : 'Save & Update Stock'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default InventoryPage;
