import React from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import { getAdminSystemStatus } from '../../api/adminApi';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorState from '../../components/common/ErrorState';
import {
  Activity,
  Server,
  Database,
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  HardDrive,
  Layers,
  ShieldCheck
} from 'lucide-react';

export default function AdminSystemPage() {
  const {
    data: systemStatus,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['adminSystemStatus'],
    queryFn: getAdminSystemStatus,
    refetchInterval: 10000,
  });

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const memUsed = systemStatus?.jvmMemoryUsedMb || 0;
  const memMax = systemStatus?.jvmMemoryMaxMb || 1;
  const memPercent = Math.min(100, Math.round((memUsed / memMax) * 100));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="text-amber-400" size={26} />
              <h1 className="text-2xl font-bold text-white tracking-tight">System Telemetry & Health</h1>
            </div>
            <p className="text-sm text-slate-400">
              Real-time JVM metrics, cluster database health, and infrastructure diagnostics
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin text-amber-400' : ''} />
            <span>Poll Health</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 bg-slate-800/40 rounded-xl border border-slate-700">
            <LoadingSkeleton />
          </div>
        ) : error ? (
          <div className="p-6 bg-slate-800/40 rounded-xl border border-slate-700">
            <ErrorState
              message={error.message || 'Failed to connect to system health diagnostic controller'}
              onRetry={refetch}
            />
          </div>
        ) : (
          <>
            {/* Core Health Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Backend Service Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="text-blue-400" size={20} />
                    <h3 className="text-sm font-bold text-white">Backend Gateway</h3>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    UP
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Protocol:</span>
                    <span className="font-mono text-slate-200">Spring Boot 3.2.3 REST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Port:</span>
                    <span className="font-mono text-slate-200">8082</span>
                  </div>
                </div>
              </div>

              {/* MongoDB Cluster Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="text-emerald-400" size={20} />
                    <h3 className="text-sm font-bold text-white">MongoDB Data Store</h3>
                  </div>
                  {systemStatus?.mongodbConnected ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 size={12} />
                      ONLINE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <XCircle size={12} />
                      DISCONNECTED
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Host:</span>
                    <span className="font-mono text-slate-200">{systemStatus?.mongodbHost || 'Active Cluster'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-slate-200">{systemStatus?.mongodbConnected ? 'Connected (Primary)' : 'Connection Failed'}</span>
                  </div>
                </div>
              </div>

              {/* Redis Cache Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="text-rose-400" size={20} />
                    <h3 className="text-sm font-bold text-white">Redis Cache & Pub/Sub</h3>
                  </div>
                  {systemStatus?.redisConnected ? (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 size={12} />
                      PONG
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      <XCircle size={12} />
                      UNAVAILABLE
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Host:</span>
                    <span className="font-mono text-slate-200">{systemStatus?.redisHost || 'Active Instance'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Role:</span>
                    <span className="text-slate-200">Token Quoting & Geospatial TTL</span>
                  </div>
                </div>
              </div>

              {/* JVM Memory Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="text-purple-400" size={20} />
                    <h3 className="text-sm font-bold text-white">JVM Memory Pool</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {memUsed} MB / {memMax} MB
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mb-2 border border-slate-700">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      memPercent > 85 ? 'bg-rose-500' : memPercent > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${memPercent}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Allocation: {memPercent}%</span>
                  <span>Max Available: {memMax} MB</span>
                </div>
              </div>

              {/* Thread Metrics Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="text-amber-400" size={20} />
                    <h3 className="text-sm font-bold text-white">Active Thread Pool</h3>
                  </div>
                  <span className="text-lg font-bold text-amber-300 font-mono">
                    {systemStatus?.jvmThreadCount ?? 0}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Worker threads currently serving incoming REST and WebSocket clients across all dispatch routines.
                </p>
              </div>

              {/* Process Uptime Card */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="text-cyan-400" size={20} />
                    <h3 className="text-sm font-bold text-white">Application Uptime</h3>
                  </div>
                  <span className="text-sm font-bold text-cyan-300 font-mono">
                    {formatUptime(systemStatus?.jvmUptimeSeconds)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Elapsed process duration without restart or unhandled fatal thread terminations.
                </p>
              </div>
            </div>

            {/* Architecture Matrix */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span>Runtime Configuration & Environment</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Security Architecture:</span>
                  <span className="font-semibold text-slate-200">Spring Security 6 (Stateless JWT + RBAC)</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">WebSocket Transport:</span>
                  <span className="font-semibold text-slate-200">STOMP over SockJS (/ws)</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Geospatial Indexing:</span>
                  <span className="font-semibold text-slate-200">H3 Spatial Indexing + MongoDB 2dsphere</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Pricing Verification:</span>
                  <span className="font-semibold text-slate-200">HMAC-SHA256 Signed Quote Tokens</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
