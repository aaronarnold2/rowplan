import React, { useState } from 'react';
import { Plus, Trash2, Calendar, BarChart3, FileDown, Loader2, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingPeriod, Intensity, GeneratedWorkout } from './types';

const INTENSITIES: Intensity[] = ['UT2', 'UT1', 'AT', 'TR', 'AN'];
const INTENSITY_COLORS: Record<Intensity, string> = {
  UT2: 'bg-emerald-500',
  UT1: 'bg-blue-500',
  AT: 'bg-amber-500',
  TR: 'bg-orange-500',
  AN: 'bg-rose-500',
};

export default function App() {
  const [periods, setPeriods] = useState<TrainingPeriod[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedCount, setLastGeneratedCount] = useState<number | null>(null);

  const addPeriod = () => {
    const newPeriod: TrainingPeriod = {
      id: crypto.randomUUID(),
      name: `Period ${periods.length + 1}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      distribution: { UT2: 70, UT1: 20, AT: 10, TR: 0, AN: 0 },
    };
    setPeriods([...periods, newPeriod]);
  };

  const removePeriod = (id: string) => {
    setPeriods(periods.filter(p => p.id !== id));
  };

  const updatePeriod = (id: string, updates: Partial<TrainingPeriod>) => {
    setPeriods(periods.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const updateDistribution = (periodId: string, intensity: Intensity, value: number) => {
    setPeriods(periods.map(p => {
      if (p.id !== periodId) return p;
      const newDist = { ...p.distribution, [intensity]: value };
      return { ...p, distribution: newDist };
    }));
  };

  const downloadCSV = (workouts: GeneratedWorkout[]) => {
    const headers = ['Date', 'Intensity', 'Workout Description', 'Duration (min)'];
    const rows = workouts.map(w => [
      w.date,
      w.intensity,
      `"${w.description.replace(/"/g, '""')}"`,
      w.durationMinutes
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `rowing_plan_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSV = async () => {
    setIsGenerating(true);
    setLastGeneratedCount(null);
    try {
      const res = await fetch('/api/generate-workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periods }),
      });
      const data = await res.json();
      if (data.workouts) {
        downloadCSV(data.workouts);
        setLastGeneratedCount(data.workouts.length);
      }
    } catch (e) {
      console.error('Generation failed', e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase italic font-serif">RowPlan</h1>
          <p className="text-xs opacity-50 font-mono uppercase tracking-widest">Training Periodization Tool v1.0</p>
        </div>
        <div className="flex items-center gap-2 text-[#141414] font-mono text-xs uppercase font-bold opacity-40">
          <Info size={16} />
          CSV Export Mode
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Intro */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-4">
            <h2 className="text-4xl font-serif italic leading-tight">
              Design your season. <br />
              <span className="opacity-50">Download your schedule.</span>
            </h2>
            <p className="max-w-md text-sm opacity-70">
              Define training blocks, set intensity distributions, and generate a CSV workout schedule for your rowing season.
            </p>
          </div>
          <div className="flex justify-end gap-4">
            <button 
              onClick={addPeriod}
              className="flex items-center gap-2 px-6 py-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-all rounded-sm font-mono text-sm uppercase tracking-wider"
            >
              <Plus size={18} />
              Add Block
            </button>
            <button 
              disabled={periods.length === 0 || isGenerating}
              onClick={generateCSV}
              className="flex items-center gap-2 px-6 py-3 bg-[#141414] text-[#E4E3E0] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all rounded-sm font-mono text-sm uppercase tracking-wider shadow-lg"
            >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
              {isGenerating ? 'Generating...' : 'Download CSV'}
            </button>
          </div>
        </section>

        {/* Success Message */}
        <AnimatePresence>
          {lastGeneratedCount !== null && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-emerald-100 border border-emerald-500 text-emerald-900 rounded-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600" />
                <span className="font-mono text-sm">{lastGeneratedCount} workouts generated and downloaded!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Periods Grid */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {periods.map((period, idx) => (
              <motion.div
                key={period.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group bg-white border border-[#141414] overflow-hidden flex flex-col md:flex-row"
              >
                {/* Left Rail: Metadata */}
                <div className="p-6 border-b md:border-b-0 md:border-r border-[#141414] bg-neutral-50 w-full md:w-72 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] opacity-40 uppercase tracking-widest">Block 0{idx + 1}</span>
                    <button 
                      onClick={() => removePeriod(period.id)}
                      className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={period.name}
                    onChange={(e) => updatePeriod(period.id, { name: e.target.value })}
                    className="w-full bg-transparent text-xl font-serif italic border-b border-transparent focus:border-[#141414] outline-none py-1"
                  />
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center gap-2 text-xs font-mono opacity-60">
                      <Calendar size={14} />
                      <span>Dates</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="date"
                        value={period.startDate}
                        onChange={(e) => updatePeriod(period.id, { startDate: e.target.value })}
                        className="text-[10px] font-mono border border-[#141414]/20 p-1 rounded-sm focus:border-[#141414] outline-none"
                      />
                      <input 
                        type="date"
                        value={period.endDate}
                        onChange={(e) => updatePeriod(period.id, { endDate: e.target.value })}
                        className="text-[10px] font-mono border border-[#141414]/20 p-1 rounded-sm focus:border-[#141414] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Distribution */}
                <div className="flex-1 p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono opacity-60 uppercase tracking-widest">
                      <BarChart3 size={14} />
                      <span>Intensity Distribution (%)</span>
                    </div>
                    <div className={`text-xs font-mono font-bold ${Object.values(period.distribution).reduce((a: number, b: number) => a + b, 0) === 100 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      Total: {Object.values(period.distribution).reduce((a: number, b: number) => a + b, 0)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {INTENSITIES.map((intensity) => (
                      <div key={intensity} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-tighter flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${INTENSITY_COLORS[intensity]}`} />
                            {intensity}
                          </label>
                          <span className="text-[10px] font-mono opacity-50">{period.distribution[intensity]}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={period.distribution[intensity]}
                          onChange={(e) => updateDistribution(period.id, intensity, parseInt(e.target.value))}
                          className="w-full accent-[#141414] h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Visual Bar */}
                  <div className="h-4 w-full bg-neutral-100 rounded-full overflow-hidden flex border border-[#141414]/5">
                    {INTENSITIES.map((intensity) => {
                      const val = period.distribution[intensity];
                      if (val === 0) return null;
                      return (
                        <div 
                          key={intensity}
                          style={{ width: `${val}%` }}
                          className={`${INTENSITY_COLORS[intensity]} h-full transition-all duration-500`}
                          title={`${intensity}: ${val}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {periods.length === 0 && (
            <div className="border-2 border-dashed border-[#141414]/20 rounded-sm p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-[#141414]/30">
                <Calendar size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif italic text-xl">No training blocks yet</h3>
                <p className="text-xs opacity-50 font-mono">Click "Add Block" to start planning your season.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto p-6 border-t border-[#141414]/10 mt-12 flex flex-col md:flex-row justify-between gap-4 text-[10px] font-mono opacity-40 uppercase tracking-widest">
        <div>© 2026 RowPlan Systems</div>
        <div className="flex gap-4">
          <span>UT2: 60-70% HRmax</span>
          <span>UT1: 70-80% HRmax</span>
          <span>AT: 80-85% HRmax</span>
          <span>TR: 85-95% HRmax</span>
          <span>AN: 95%+ HRmax</span>
        </div>
      </footer>
    </div>
  );
}
