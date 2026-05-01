import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import apiClient from "../api/apiClient";
import { useToast } from "../context/ToastContext";

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    stats: {
      total: 0,
      pending: 0,
      interviewed: 0,
      accepted: 0,
      rejected: 0,
      offer: 0,
      successRate: 0
    },
    roleBreakdown: [],
    rejectionReasons: []
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const analyticsResponse = await apiClient.get("/analytics");
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      showToast(error.response?.data?.message || "Could not fetch analytics data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-h1 text-[40px] text-white mb-2">Analytics Insights</h1>
          <p className="font-body-md text-[16px] text-on-surface-variant">Deep dive into your application performance</p>
        </div>
        <button className="border border-white/10 text-white font-label-caps text-[12px] uppercase tracking-widest py-[16px] px-[24px] rounded-lg hover:bg-white/5 transition-all flex items-center gap-[8px]">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>download</span> 
          Export Report
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <span className="font-mono-data text-primary-container animate-pulse uppercase tracking-[0.2em]">Synchronizing...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Main Chart */}
          <div className="lg:col-span-8 bg-[#1A1A1A] border border-white/[0.06] rounded-2xl p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-h3 text-[24px] text-white">Role Breakdown</h3>
                <p className="text-on-surface-variant text-sm mt-1">Submission trends by category</p>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.roleBreakdown}>
                     <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff7300" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#ff7300" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#a88b7c', fontSize: 12, fontWeight: '500', fontFamily: 'Manrope'}}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#a88b7c', fontSize: 12}}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#261912', border: '1px solid #41312a', borderRadius: '8px' }}
                      itemStyle={{ color: '#ffb68f' }}
                      cursor={{fill: 'rgba(255,115,0,0.05)'}}
                    />
                    <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          {/* Funnel Pie Chart */}
          <div className="lg:col-span-4 bg-[#1A1A1A] border border-white/[0.06] rounded-2xl p-8 flex flex-col">
            <h3 className="font-h3 text-[24px] text-white mb-1">Application Funnel</h3>
            <p className="text-on-surface-variant text-sm mt-1 mb-8">Current pipeline status</p>
            
            <div className="relative w-48 h-48 mx-auto mb-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pending", value: analytics.stats.pending }, 
                      { name: "Interview", value: analytics.stats.interviewed }, 
                      { name: "Offer", value: analytics.stats.offer }
                    ]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#ff7300" />
                    <Cell fill="#22C55E" />
                    <Cell fill="#A855F7" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#261912', border: '1px solid #41312a', borderRadius: '8px' }}
                    itemStyle={{ color: '#ffb68f' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-h2 text-[32px] text-white">{analytics.stats.total}</span>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Total</span>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-container"></div>
                  <span className="text-sm font-medium text-white">Pending</span>
                </div>
                <span className="font-mono-data text-white">{analytics.stats.pending}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></div>
                  <span className="text-sm font-medium text-white">Interview</span>
                </div>
                <span className="font-mono-data text-white">{analytics.stats.interviewed}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A855F7]"></div>
                  <span className="text-sm font-medium text-white">Offer</span>
                </div>
                <span className="font-mono-data text-white">{analytics.stats.offer}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
