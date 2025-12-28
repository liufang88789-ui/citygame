
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { BuildingType, CityStats, Language } from '../types';
import { BUILDINGS, UI_STRINGS, ACHIEVEMENTS } from '../constants';

interface UIOverlayProps {
  stats: CityStats;
  selectedTool: BuildingType;
  onSelectTool: (type: BuildingType) => void;
  lang: Language;
  onToggleLang: () => void;
  aiAnalysis: string;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ stats, selectedTool, onSelectTool, lang, onToggleLang, aiAnalysis }) => {
  const [showStats, setShowStats] = useState(false);
  const t = (key: string) => UI_STRINGS[key]?.[lang] || key;

  const isInDebt = stats.money < 0;
  const isPowerLow = stats.powerGrid.used > stats.powerGrid.total;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10 font-sans">
      
      {/* Top Bar: Financial HUD */}
      <div className="flex justify-between items-start pointer-events-auto w-full max-w-6xl mx-auto gap-4">
        <div className="bg-slate-900/95 border border-slate-700 p-4 rounded-3xl shadow-2xl flex gap-8 items-center backdrop-blur-xl transition-all">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t('treasury')}</span>
            <span className={`text-2xl font-black font-mono transition-colors ${isInDebt ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                ${Math.floor(stats.money).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col min-w-[70px]">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t('citizens')}</span>
            <span className="text-xl font-bold text-sky-400 font-mono">{Math.floor(stats.population).toLocaleString()}</span>
          </div>

          <div className="flex flex-col min-w-[70px]">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t('happiness')}</span>
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-amber-400">{Math.floor(stats.happiness)}%</span>
                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${stats.happiness}%` }}></div>
                </div>
            </div>
          </div>

          <div className="flex flex-col min-w-[90px]">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t('power')}</span>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-bold font-mono ${isPowerLow ? 'text-red-500' : 'text-fuchsia-400'}`}>
                    {Math.round(stats.powerGrid.used)}
                </span>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${isPowerLow ? 'bg-red-500 animate-pulse' : 'bg-fuchsia-500'}`} 
                         style={{ width: `${Math.min(100, (stats.powerGrid.used / (stats.powerGrid.total || 1)) * 100)}%` }}></div>
                </div>
            </div>
          </div>

          <button onClick={() => setShowStats(!showStats)} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center border border-slate-600 transition-transform active:scale-90">
             📊
          </button>
        </div>

        {/* Proactive AI Advisor */}
        <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-2xl max-w-[240px] border-2 border-indigo-400 relative animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="absolute -top-3 left-6 px-2 py-0.5 bg-indigo-400 text-[9px] font-black uppercase rounded-full shadow-sm">Gemini AI Advisor</div>
           <p className="text-[12px] font-semibold italic leading-snug">"{aiAnalysis || "Syncing city logs..."}"</p>
        </div>
      </div>

      {/* Financial Breakdown Modal */}
      {showStats && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50">
             <div className="bg-slate-900 border border-indigo-500 p-10 rounded-[40px] w-[400px] shadow-[0_0_50px_rgba(79,70,229,0.3)] relative">
                <button onClick={() => setShowStats(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">✕</button>
                <h2 className="text-3xl font-black text-white mb-8 tracking-tight">Municipal Audit</h2>
                
                <div className="space-y-6">
                    <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <span className="text-slate-400 uppercase text-xs font-bold">{t('revenue')}</span>
                        <span className="text-emerald-400 font-mono font-bold text-xl">+${Math.floor(stats.finances.revenue)}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-slate-800 pb-2">
                        <span className="text-slate-400 uppercase text-xs font-bold">{t('expense')}</span>
                        <span className="text-red-400 font-mono font-bold text-xl">-${Math.floor(stats.finances.expense)}</span>
                    </div>
                    <div className="flex justify-between items-end bg-slate-800/50 p-4 rounded-2xl">
                        <span className="text-white uppercase text-xs font-black">Net Daily</span>
                        <span className={`font-mono font-black text-2xl ${stats.finances.revenue > stats.finances.expense ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${Math.floor(stats.finances.revenue - stats.finances.expense)}
                        </span>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                    <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest">Achievements</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {ACHIEVEMENTS.map(ach => (
                            <div key={ach.id} className={`aspect-square rounded-xl flex items-center justify-center text-xl border ${stats.unlockedAchievements.includes(ach.id) ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-800 border-slate-700 opacity-20'}`}>
                                🏆
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>
      )}

      {/* Building Palette */}
      <div className="flex flex-col items-center pointer-events-auto gap-6 mb-2">
        <div className="bg-slate-900/90 p-4 rounded-[32px] border border-slate-700 shadow-2xl flex gap-4 items-center backdrop-blur-2xl">
            {Object.values(BuildingType).filter(v => v !== BuildingType.None).concat(BuildingType.None).map(type => (
                <button 
                    key={type}
                    onClick={() => onSelectTool(type)}
                    className={`group relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${selectedTool === type ? 'bg-indigo-600 scale-110 shadow-[0_0_20px_rgba(79,70,229,0.5)]' : 'hover:bg-slate-800 active:scale-95'}`}
                >
                    <div className="w-12 h-12 rounded-xl shadow-inner flex items-center justify-center border border-white/5 overflow-hidden" style={{ backgroundColor: BUILDINGS[type].color }}>
                        {type === BuildingType.None && <span className="text-white font-black text-2xl">×</span>}
                        {type === BuildingType.PowerPlant && <span className="text-white text-xl">⚡</span>}
                        {type === BuildingType.Road && <span className="text-white text-xl">≡</span>}
                    </div>
                    <span className="text-[9px] mt-2 font-black text-slate-400 group-hover:text-white uppercase tracking-tighter">{BUILDINGS[type].name[lang]}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-2xl z-50">
                        <p className="text-[10px] font-black text-white">{BUILDINGS[type].name[lang]}</p>
                        <p className="text-[9px] text-slate-400">${BUILDINGS[type].cost} Build | <span className="text-red-400">-${BUILDINGS[type].maintenance} Maint</span></p>
                    </div>
                </button>
            ))}
        </div>
        
        <div className="flex gap-6 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-950/80 px-8 py-2 rounded-full border border-slate-800 backdrop-blur-md">
            <span>{t(stats.season)}</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full self-center"></span>
            <span>{t(stats.weather)}</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full self-center"></span>
            <span className="font-mono">{Math.floor(stats.time)}:00</span>
            <span className="w-1 h-1 bg-slate-700 rounded-full self-center"></span>
            <span>Day {stats.day}</span>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
