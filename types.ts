
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export enum BuildingType {
  None = 'None',
  Road = 'Road',
  Residential = 'Residential',
  Commercial = 'Commercial',
  Industrial = 'Industrial',
  Park = 'Park',
  PowerPlant = 'PowerPlant',
}

export enum TerrainType {
  Grass = 'Grass',
  Water = 'Water',
  Mountain = 'Mountain',
}

export enum Season { Spring = 'Spring', Summer = 'Summer', Autumn = 'Autumn', Winter = 'Winter' }
export enum Weather { Sunny = 'Sunny', Rainy = 'Rainy', Cloudy = 'Cloudy', Snowy = 'Snowy' }

export type Language = 'en' | 'zh';

export interface BuildingConfig {
  type: BuildingType;
  cost: number;
  maintenance: number;
  name: Record<Language, string>;
  description: Record<Language, string>;
  color: string;
  popCapacity: number; // Max people
  incomePotential: number; // Max tax
  jobsProvided?: number;
  laborRequired?: number;
  powerGen?: number;
  powerReq?: number;
}

export interface TileData {
  x: number;
  y: number;
  height: number;
  terrainType: TerrainType;
  buildingType: BuildingType;
  isConnected: boolean;
  hasPower: boolean;
  efficiency: number; // 0 to 1 based on labor/power/connectivity
}

export type Grid = TileData[][];

export interface Achievement {
  id: string;
  name: Record<Language, string>;
  description: Record<Language, string>;
  condition: (stats: CityStats, grid: Grid) => boolean;
}

export interface CityStats {
  money: number;
  population: number;
  jobs: number;
  happiness: number;
  powerGrid: { total: number; used: number };
  finances: { revenue: number; expense: number };
  day: number;
  time: number;
  season: Season;
  weather: Weather;
  unlockedAchievements: string[];
}

export interface BuildingSentiment { text: string; author: string; }
