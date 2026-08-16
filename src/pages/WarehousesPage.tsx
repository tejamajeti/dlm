import React, { useEffect, useState } from 'react';
import { Warehouse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { NumericInput } from '../components/NumericInput';
import api from '../services/api';
import {
  Building2,
  MapPin,
  Plus,
  Edit2,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  Locate,
} from 'lucide-react';

export const WarehousesPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [capacity, setCapacity] = useState('50000');
  const [occupancy, setOccupancy] = useState('0');
  const [lat, setLat] = useState('40.7128');
  const [lng, setLng] = useState('-74.0060');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = user?.role === 'Admin' || user?.role === 'Warehouse Manager';

  const fetchWarehouses = async () => {
    try {
      const res: any = await api.get('/protected/warehouses');
      if (res.success && res.data) {
        setWarehouses(res.data);
      }
    } catch (e) {
      console.error('Error fetching warehouses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const resetForm = () => {
    setCode('');
    setName('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setCapacity('50000');
    setOccupancy('0');
    setLat('40.7128');
    setLng('-74.0060');
    setEditingWarehouse(null);
    setShowAddModal(false);
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    if (!editingWarehouse) {
      const cleanCity = newCity.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
      if (cleanCity) {
        setCode(`WH-${cleanCity}-01`);
      }
    }
  };

  const handleAutoFillDeviceLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser hardware.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setLat(latitude);
        setLng(longitude);
        setIsLocating(false);
        toast.success(`🎯 Auto-filled device GPS coordinates: ${latitude}, ${longitude}`);
      },
      (error) => {
        setIsLocating(false);
        toast.error('Failed to acquire current device GPS location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setCode(wh.code);
    setName(wh.name);
    setAddress(wh.address);
    setCity(wh.city);
    setState(wh.state);
    setZipCode(wh.zip_code);
    setCapacity(String(wh.capacity));
    setOccupancy(String(wh.current_occupancy));
    setLat(String(wh.latitude || 40.7128));
    setLng(String(wh.longitude || -74.0060));
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res: any = await api.post('/protected/warehouses', {
        code,
        name,
        address,
        city,
        state,
        zip_code: zipCode,
        capacity: parseInt(capacity, 10),
        current_occupancy: parseInt(occupancy, 10),
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });

      if (res.success) {
        toast.success(`Fulfillment Hub "${name}" provisioned successfully.`);
        resetForm();
        fetchWarehouses();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create fulfillment hub');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarehouse) return;
    setIsSubmitting(true);
    try {
      const res: any = await api.put(`/protected/warehouses/${editingWarehouse.id}`, {
        code,
        name,
        address,
        city,
        state,
        zip_code: zipCode,
        capacity: parseInt(capacity, 10),
        current_occupancy: parseInt(occupancy, 10),
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      });

      if (res.success) {
        toast.success(`Fulfillment Hub "${name}" updated.`);
        resetForm();
        fetchWarehouses();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update fulfillment hub');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Fulfillment Hubs & Facilities</h2>
          <p className="text-xs text-slate-400 mt-1">Regional distribution centers, warehouse capacity & geographic placement</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center gap-2 glow-cyan"
          >
            <Plus className="w-4 h-4" />
            Add Facility Hub
          </button>
        )}
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="p-12 text-center text-cyan-400 font-semibold text-xs flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 animate-spin" /> Loading Fulfillment Hubs...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((wh) => {
            const occupancyRate = Math.min(100, Math.round((wh.current_occupancy / wh.capacity) * 100));
            return (
              <div
                key={wh.id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 hover:border-cyan-500/40 transition group relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {wh.code}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">{wh.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {canManage && (
                      <button
                        onClick={() => handleOpenEdit(wh)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                        title="Edit Facility Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span>
                    {wh.address}, {wh.city}, {wh.state} {wh.zip_code}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Capacity Usage</span>
                    <span className="font-bold text-white">
                      {wh.current_occupancy.toLocaleString()} / {wh.capacity.toLocaleString()} sqft ({occupancyRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        occupancyRate > 90
                          ? 'bg-rose-500'
                          : occupancyRate > 75
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                      }`}
                      style={{ width: `${occupancyRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                  <span className="font-mono text-[11px]">
                    GPS: {wh.latitude}, {wh.longitude}
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Hub
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: ADD / EDIT WAREHOUSE */}
      {(showAddModal || editingWarehouse) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {editingWarehouse ? `Modify Hub: ${editingWarehouse.name}` : 'Provision New Fulfillment Hub'}
                  </h3>
                  <p className="text-xs text-slate-400">Configure logistics facility metadata, storage capacity & coordinates</p>
                </div>
              </div>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingWarehouse ? handleUpdateWarehouse : handleCreateWarehouse} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Facility Code <span className="text-[10px] text-cyan-400 font-normal">(Auto-Generated)</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    placeholder="Auto-Generated (e.g. WH-MIA-01)"
                    disabled={true}
                    readOnly={true}
                    className="w-full border rounded-xl px-3 py-2 text-xs uppercase font-mono bg-slate-800/80 text-slate-400 border-slate-700/60 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Facility Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Metro Distribution Hub"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="100 Logistics Way"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    placeholder="New York"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="NY"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="10001"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumericInput
                  label="Total Capacity (sqft)"
                  value={capacity}
                  onChange={setCapacity}
                  min={0}
                  step={1000}
                  suffix="sqft"
                  required
                />
                <NumericInput
                  label="Occupancy Used (sqft)"
                  value={occupancy}
                  onChange={setOccupancy}
                  min={0}
                  step={500}
                  suffix="sqft"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumericInput
                  label="Latitude"
                  value={lat}
                  onChange={setLat}
                  allowNegative={true}
                  step={0.001}
                  required
                />
                <NumericInput
                  label="Longitude"
                  value={lng}
                  onChange={setLng}
                  allowNegative={true}
                  step={0.001}
                  required
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAutoFillDeviceLocation}
                  disabled={isLocating}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 transition flex items-center justify-center gap-2"
                  title="Auto-fill with your current device GPS coordinates"
                >
                  <Locate className={`w-4 h-4 text-cyan-400 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Acquiring GPS Lock...' : 'Auto-Fill Current Device GPS Coordinates'}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : editingWarehouse ? 'Update Facility Hub' : 'Provision Hub'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
