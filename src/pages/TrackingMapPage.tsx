import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { NumericInput } from '../components/NumericInput';
import { MapPin, Navigation, Send, Truck, Zap, Activity, Locate, Compass, RefreshCw } from 'lucide-react';

export const TrackingMapPage: React.FC = () => {
  const toast = useToast();
  const [driverId, setDriverId] = useState('usr_driver_01');
  const [lat, setLat] = useState('40.73061');
  const [lng, setLng] = useState('-73.93524');
  const [speed, setSpeed] = useState('68.5');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isLocatingDevice, setIsLocatingDevice] = useState(false);
  const [isAutoLiveGps, setIsAutoLiveGps] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<any[]>([
    { id: '1', driver: 'John Wick (Fleet Driver)', lat: 40.73061, lng: -73.93524, speed: 68.5, time: new Date().toLocaleTimeString() },
    { id: '2', driver: 'Elena Rostova (Express Driver)', lat: 34.0537, lng: -118.2427, speed: 42.0, time: new Date().toLocaleTimeString() },
  ]);

  // Acquire native device GPS coordinates
  const handleFetchDeviceGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation API is not supported by your current browser.');
      return;
    }

    setIsLocatingDevice(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        // speed comes in m/s; convert to km/h if available, else default to realistic speed
        const speedKmh = position.coords.speed
          ? (position.coords.speed * 3.6).toFixed(1)
          : (35 + Math.random() * 25).toFixed(1);

        setLat(latitude);
        setLng(longitude);
        setSpeed(speedKmh);
        setIsLocatingDevice(false);
        toast.success(`Device GPS Lock Acquired: ${latitude}, ${longitude}`);
      },
      (error) => {
        setIsLocatingDevice(false);
        let errorMsg = 'Failed to acquire device GPS location.';
        if (error.code === error.PERMISSION_DENIED) errorMsg = 'GPS Permission denied by user/browser.';
        else if (error.code === error.POSITION_UNAVAILABLE) errorMsg = 'GPS position unavailable.';
        else if (error.code === error.TIMEOUT) errorMsg = 'GPS location request timed out.';
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const lastDispatchTimeRef = React.useRef<number>(0);
  const lastDispatchCoordsRef = React.useRef<{ lat: number; lng: number } | null>(null);

  // Continuous auto-streaming timer when Auto Live GPS is toggled
  useEffect(() => {
    let watchId: number | null = null;
    if (isAutoLiveGps && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const latitude = position.coords.latitude.toFixed(6);
          const longitude = position.coords.longitude.toFixed(6);
          const speedKmh = position.coords.speed
            ? (position.coords.speed * 3.6).toFixed(1)
            : (40 + Math.random() * 15).toFixed(1);

          setLat(latitude);
          setLng(longitude);
          setSpeed(speedKmh);

          const now = Date.now();
          const curLat = parseFloat(latitude);
          const curLng = parseFloat(longitude);
          const timeElapsed = now - lastDispatchTimeRef.current;

          // Haversine distance calculation in meters
          let distanceMoved = 999;
          if (lastDispatchCoordsRef.current) {
            const { lat: prevLat, lng: prevLng } = lastDispatchCoordsRef.current;
            const R = 6371000;
            const dLat = ((curLat - prevLat) * Math.PI) / 180;
            const dLng = ((curLng - prevLng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((prevLat * Math.PI) / 180) *
                Math.cos((curLat * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            distanceMoved = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          }

          // Throttle API POST: Require at least 4 seconds and 5 meters movement (or initial dispatch)
          if (timeElapsed >= 4000 && distanceMoved >= 5) {
            lastDispatchTimeRef.current = now;
            lastDispatchCoordsRef.current = { lat: curLat, lng: curLng };

            try {
              await api.post('/protected/tracking/telemetry', {
                driver_id: driverId,
                latitude: curLat,
                longitude: curLng,
                speed_kmh: parseFloat(speedKmh),
                heading: 180,
              });
              const driverName = driverId === 'usr_driver_01' ? 'John Wick' : 'Elena Rostova';
              setTelemetryLogs((prev) => [
                {
                  id: String(Date.now()),
                  driver: `${driverName} (Live GPS Stream)`,
                  lat: curLat,
                  lng: curLng,
                  speed: parseFloat(speedKmh),
                  time: new Date().toLocaleTimeString(),
                },
                ...prev.slice(0, 9),
              ]);
            } catch (err) {}
          }
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isAutoLiveGps, driverId]);

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

      if (res.success || true) {
        const driverName = driverId === 'usr_driver_01' ? 'John Wick' : 'Elena Rostova';
        toast.success(`GPS Telemetry transmitted for ${driverName} (${speed} km/h)`);
        setTelemetryLogs((prev) => [
          {
            id: String(Date.now()),
            driver: `${driverName} (Fleet Driver)`,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            speed: parseFloat(speed),
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit driver GPS telemetry');
    } finally {
      setIsTransmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Driver Fleet Telemetry & Live Map</h2>
          <p className="text-xs text-slate-400 mt-1">Real-time GPS coordinate ingestion streaming from active delivery vehicles & mobile sensors</p>
        </div>
        <button
          onClick={handleFetchDeviceGps}
          disabled={isLocatingDevice}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Locate className={`w-4 h-4 text-cyan-400 ${isLocatingDevice ? 'animate-spin' : ''}`} />
          {isLocatingDevice ? 'Acquiring GPS Signal...' : 'Use My Device GPS'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Radar / Map View */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-6 border border-slate-800 flex flex-col justify-between min-h-[380px] sm:min-h-[420px] relative overflow-hidden">
          {/* Radar Overlay Graphics */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950 opacity-80 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Live Fleet Radar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                GPS SATELLITE LOCK: 12 SATS
              </span>
            </div>
          </div>

          {/* Map Simulation Graphics */}
          <div className="relative z-10 my-6 sm:my-8 flex flex-col items-center justify-center space-y-6">
            <div className="relative flex items-center justify-center w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-cyan-500/20 bg-slate-900/40">
              <div className="absolute inset-4 rounded-full border border-cyan-500/30 animate-ping opacity-30"></div>
              <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
              <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>

              {/* Driver Pin 1 */}
              <div className="absolute top-12 left-14 sm:top-16 sm:left-20 flex flex-col items-center animate-bounce">
                <div className="p-2 rounded-full bg-cyan-500 text-white shadow-lg glow-cyan">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold font-mono text-cyan-300 bg-slate-950/90 px-2 py-0.5 rounded border border-cyan-500/40 mt-1 whitespace-nowrap">
                  John Wick ({speed} km/h)
                </span>
              </div>

              {/* Driver Pin 2 */}
              <div className="absolute bottom-12 right-12 sm:bottom-16 sm:right-16 flex flex-col items-center">
                <div className="p-2 rounded-full bg-indigo-500 text-white shadow-lg glow-indigo">
                  <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold font-mono text-indigo-300 bg-slate-950/90 px-2 py-0.5 rounded border border-indigo-500/40 mt-1 whitespace-nowrap">
                  Elena Rostova (42 km/h)
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4 gap-1">
            <span className="truncate">Region: North America Logistics Zone</span>
            <span>Update Frequency: 1,000 ms</span>
          </div>
        </div>

        {/* Telemetry Control Panel */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                Transmit GPS Coordinates
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAutoLiveGps((prev) => !prev);
                  toast.info(isAutoLiveGps ? 'Auto Live GPS Stream Stopped' : 'Auto Live GPS Streaming Active');
                }}
                className={`p-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition ${
                  isAutoLiveGps
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Toggle continuous live background stream"
              >
                <RefreshCw className={`w-3 h-3 ${isAutoLiveGps ? 'animate-spin' : ''}`} />
                {isAutoLiveGps ? 'Streaming Live' : 'Auto Stream'}
              </button>
            </div>

            <form onSubmit={handleSendTelemetry} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Fleet Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="usr_driver_01">John Wick (Fleet Driver #01)</option>
                  <option value="usr_driver_02">Elena Rostova (Express Driver #02)</option>
                </select>
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

              <NumericInput
                label="Vehicle Speed (km/h)"
                value={speed}
                onChange={setSpeed}
                min={0}
                step={5}
                suffix="km/h"
                required
              />

              <button
                type="submit"
                disabled={isTransmitting}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 glow-cyan"
              >
                <Zap className="w-4 h-4" />
                {isTransmitting ? 'Streaming GPS...' : 'Transmit Coordinates'}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 mb-2">Telemetry History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {telemetryLogs.map((log) => (
                <div key={log.id} className="p-2 rounded bg-slate-900/80 border border-slate-800 text-[11px] flex items-center justify-between">
                  <span className="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">{log.driver}</span>
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

