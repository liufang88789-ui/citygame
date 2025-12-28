
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { Grid, TileData, BuildingType, CityStats, Language, Season, Weather, TerrainType } from './types';
import { GRID_SIZE, BUILDINGS, TICK_RATE_MS, INITIAL_MONEY, ACHIEVEMENTS } from './constants';
import IsoMap from './components/IsoMap';
import UIOverlay from './components/UIOverlay';
import StartScreen from './components/StartScreen';
import { generateCityAnalysis } from './services/geminiService';

const createInitialGrid = (): Grid => {
  const grid: Grid = [];
  const getHeight = (x: number, y: number) => Math.max(-1, Math.round(Math.sin(x * 0.15) * Math.cos(y * 0.15) * 2.5));
  const riverX = Array.from({ length: GRID_SIZE }, (_, i) => Math.floor(GRID_SIZE / 2 + Math.sin(i * 0.25) * 6));

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      let height = getHeight(x, y);
      let terrain = TerrainType.Grass;
      if (x >= riverX[y] - 1 && x <= riverX[y] + 1) { terrain = TerrainType.Water; height = -1.8; }
      else if (height > 1) { terrain = TerrainType.Mountain; }
      row.push({ x, y, height, terrainType: terrain, buildingType: BuildingType.None, isConnected: false, hasPower: false, efficiency: 1 });
    }
    grid.push(row);
  }
  return grid;
};

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [grid, setGrid] = useState<Grid>(createInitialGrid);
  const [stats, setStats] = useState<CityStats>({ 
    money: INITIAL_MONEY, population: 0, jobs: 0, happiness: 80,
    powerGrid: { total: 0, used: 0 },
    finances: { revenue: 0, expense: 0 },
    day: 1, time: 8, season: Season.Spring, weather: Weather.Sunny,
    unlockedAchievements: []
  });
  const [selectedTool, setSelectedTool] = useState<BuildingType>(BuildingType.Road);
  const [aiAnalysis, setAiAnalysis] = useState("");
  
  const gridRef = useRef(grid);
  const statsRef = useRef(stats);
  useEffect(() => { gridRef.current = grid; statsRef.current = stats; }, [grid, stats]);

  // Deep Simulation Hook
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(() => {
      setGrid(prevGrid => {
        const nextGrid = prevGrid.map(row => row.map(tile => {
          if (tile.buildingType === BuildingType.None) return tile;
          
          // Check Connectivity
          let isConnected = tile.buildingType === BuildingType.Road;
          if (!isConnected) {
            const neighbors = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            isConnected = neighbors.some(([dx, dy]) => {
              const nx = tile.x + dx, ny = tile.y + dy;
              return prevGrid[ny]?.[nx]?.buildingType === BuildingType.Road;
            });
          }
          return { ...tile, isConnected };
        }));

        // Calculate Global Totals
        let totalPowerGen = 0, totalPowerReq = 0, totalLaborAvailable = 0, totalLaborReq = 0;
        let totalRevenue = 0, totalExpense = 0, totalPopCapacity = 0;

        nextGrid.flat().forEach(t => {
          if (t.buildingType === BuildingType.None) return;
          const config = BUILDINGS[t.buildingType];
          totalExpense += config.maintenance / 24;
          
          if (t.buildingType === BuildingType.PowerPlant) totalPowerGen += config.powerGen || 0;
          if (t.buildingType === BuildingType.Residential) totalLaborAvailable += (config.popCapacity * 0.6); // 60% are workers
          
          if (t.buildingType !== BuildingType.Road && t.buildingType !== BuildingType.PowerPlant) {
            totalPowerReq += config.powerReq || 0;
            totalLaborReq += config.laborRequired || 0;
          }
        });

        const powerEfficiency = totalPowerGen >= totalPowerReq ? 1 : (totalPowerGen / (totalPowerReq || 1));
        const laborEfficiency = totalLaborAvailable >= totalLaborReq ? 1 : (totalLaborAvailable / (totalLaborReq || 1));

        // Apply Efficiencies to Revenue & Population
        nextGrid.forEach(row => row.forEach(t => {
          if (t.buildingType === BuildingType.None) return;
          const config = BUILDINGS[t.buildingType];
          const localEfficiency = (t.isConnected ? 1 : 0) * powerEfficiency;
          
          if (config.incomePotential > 0) {
            totalRevenue += (config.incomePotential * localEfficiency * laborEfficiency) / 24;
          }
          if (config.popCapacity > 0) {
            totalPopCapacity += config.popCapacity * localEfficiency;
          }
        }));

        setStats(prev => {
          const nextTime = (prev.time + 0.5) % 24;
          const nextDay = nextTime < prev.time ? prev.day + 1 : prev.day;
          
          // Happiness logic
          const jobsUnfilled = Math.max(0, totalLaborReq - totalLaborAvailable);
          const happinessDelta = (powerEfficiency < 1 ? -5 : 1) + (jobsUnfilled > 100 ? -2 : 0);
          
          return {
            ...prev,
            money: prev.money + totalRevenue - totalExpense,
            population: Math.floor(totalPopCapacity),
            jobs: Math.floor(totalLaborReq),
            happiness: Math.max(0, Math.min(100, prev.happiness + happinessDelta / 24)),
            powerGrid: { total: totalPowerGen, used: totalPowerReq },
            finances: { revenue: totalRevenue * 24, expense: totalExpense * 24 },
            time: nextTime,
            day: nextDay
          };
        });

        return nextGrid;
      });
    }, TICK_RATE_MS);
    return () => clearInterval(interval);
  }, [gameStarted]);

  // AI Insights
  useEffect(() => {
    if (!gameStarted) return;
    const interval = setInterval(async () => {
      const insight = await generateCityAnalysis(statsRef.current, gridRef.current, language);
      setAiAnalysis(insight);
    }, 12000);
    return () => clearInterval(interval);
  }, [gameStarted, language]);

  const handleTileClick = (x: number, y: number) => {
    if (!gameStarted) return;
    const tile = grid[y][x];
    if (tile.terrainType === TerrainType.Water && selectedTool !== BuildingType.Road && selectedTool !== BuildingType.None) return;
    if (tile.terrainType === TerrainType.Mountain && selectedTool !== BuildingType.None) return;

    if (selectedTool === BuildingType.None) {
      setGrid(prev => prev.map((r, yi) => r.map((t, xi) => (xi === x && yi === y ? { ...t, buildingType: BuildingType.None } : t))));
      return;
    }

    const config = BUILDINGS[selectedTool];
    if (stats.money >= config.cost && tile.buildingType === BuildingType.None) {
      setStats(prev => ({ ...prev, money: prev.money - config.cost }));
      setGrid(prev => prev.map((r, yi) => r.map((t, xi) => (xi === x && yi === y ? { ...t, buildingType: selectedTool } : t))));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <IsoMap grid={grid} onTileClick={handleTileClick} hoveredTool={selectedTool} stats={stats} />
      
      {!gameStarted && <StartScreen onStart={(_, l) => { setLanguage(l); setGameStarted(true); }} />}
      
      {gameStarted && (
        <UIOverlay 
            stats={stats} 
            selectedTool={selectedTool} 
            onSelectTool={setSelectedTool} 
            lang={language} 
            onToggleLang={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
            aiAnalysis={aiAnalysis}
        />
      )}
    </div>
  );
}

export default App;
