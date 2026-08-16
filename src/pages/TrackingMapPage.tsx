import React, { useState } from 'react';
import api from '../services/api';
import { MapPin, Navigation, Send, Truck, Zap, Activity } from 'lucide-react';

export const TrackingMapPage: React.FC = () => {
  const [driverId, setDriverId] = useState('usr_driver_01');
  const [lat, setLat] = useState('40.73061');
  const [lng, setLng] = useState('-73.93524');
  const [speed, setSpeed] = useState('68.5');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([
    { id: '1', driver: 'John Wick (Fleet Driver)', lat: 40.73061, lng: -73.93524, speed: 68.5, time: new Date().toLocaleTimeString() },
    { id: '2', driver: 'Elena Rostova (Express Driver)', lat: 34.0537, lng: -118.2427, speed: 42.0, time: new Date().toLocaleTimeString() },
  ]);

  const handleSendTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransmitting(true);
    try {
      const res: any = await api.post('/protected/tracking/telemetry', {
        driver_id: driverId,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        speed_kmh: parseFloat(speed),
        heading: 180,
      });

      if (res.success) {
        setTelemetryLogs((prev) => [
          {
            id: String(Date.now()),
            driver: driverId === 'usr_driver_01' ? 'John Wick (Fleet Driver)' : 'Elena Rostova (Express Driver)',
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            speed: parseFloat(speed),
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit driver GPS telemetry');
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Driver Fleet Telemetry & Live Map</h2>
        <p className="text-xs text-slate-400 mt-1">Real-time GPS coordinate ingestion streaming over Kafka topic driver.location.updated</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Simulated Radar / Map View */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
          {/* Radar Overlay Graphics */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 opacity-80 pointer-events-none"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Live Radar Telemetry</span>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
              GPS SATELLITE LOCK: 12 SATS
            </span>
          </div>

          {/* Map Simulation Graphics */}
          <div className="relative z-10 my-8 flex flex-col items-center justify-center space-y-6">
            <div className="relative flex items-center justify-center w-64 h-64 rounded-full border border-cyan-500/20 bg-slate-900/40">
              <div className="absolute inset-4 rounded-full border border-cyan-500/30 animate-ping opacity-30"></div>
              <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
              <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>

              {/* Driver Pin 1 */}
              <div className="absolute top-16 left-20 flex flex-col items-center animate-bounce">
                <div className="p-2 rounded-full bg-cyan-500 text-white shadow-lg glow-cyan">
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono text-cyan-300 bg-slate-950/90 px-2 py-0.5 rounded border border-cyan-500/40 mt-1">
                  John Wick (68.5 km/h)
                </span>
              </div>

              {/* Driver Pin 2 */}
              <div className="absolute bottom-16 right-16 flex flex-col items-center">
                <div className="p-2 rounded-full bg-indigo-500 text-white shadow-lg glow-indigo">
                  <Navigation className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono text-indigo-300 bg-slate-950/90 px-2 py-0.5 rounded border border-indigo-500/40 mt-1">
                  Elena Rostova (42 km/h)
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
            <span>Region: North America Logistics Zone</span>
            <span>Update Frequency: 1,000 ms</span>
          </div>
        </div>

        {/* Telemetry Control Panel */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              Ingest GPS Location Event
            </h3>

            <form onSubmit={handleSendTelemetry} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Fleet Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="usr_driver_01">John Wick (Fleet Driver #01)</option>
                  <option value="usr_driver_02">Elena Rostova (Express Driver #02)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle Speed (km/h)</label>
                <input
                  type="number"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isTransmitting}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {isTransmitting ? 'Streaming GPS...' : 'Transmit Driver Coordinates'}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 mb-2">Telemetry Audit History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {telemetryLogs.map((log) => (
                <div key={log.id} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{log.driver}</span>
                  <span className="font-mono text-cyan-400">{log.speed} km/h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
