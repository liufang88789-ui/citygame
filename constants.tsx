
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BuildingConfig, BuildingType, Language, Achievement, CityStats, Grid } from './types';

export const GRID_SIZE = 45;
export const TICK_RATE_MS = 1500;
export const INITIAL_MONEY = 8000;

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  [BuildingType.None]: {
    type: BuildingType.None, cost: 0, maintenance: 0,
    name: { en: 'Bulldoze', zh: '推土机' },
    description: { en: 'Clear land', zh: '清理土地' },
    color: '#ef4444', popCapacity: 0, incomePotential: 0,
  },
  [BuildingType.Road]: {
    type: BuildingType.Road, cost: 15, maintenance: 1,
    name: { en: 'Road', zh: '道路' },
    description: { en: 'Vital infrastructure.', zh: '核心基础设施。' },
    color: '#334155', popCapacity: 0, incomePotential: 0,
  },
  [BuildingType.Residential]: {
    type: BuildingType.Residential, cost: 250, maintenance: 5,
    name: { en: 'Residential', zh: '住宅' },
    description: { en: 'Housing for 100.', zh: '可容纳100人。' },
    color: '#10b981', popCapacity: 100, incomePotential: 10, powerReq: 15,
  },
  [BuildingType.Commercial]: {
    type: BuildingType.Commercial, cost: 600, maintenance: 40,
    name: { en: 'Commercial', zh: '商业' },
    description: { en: 'Retail & Services.', zh: '零售与服务业。' },
    color: '#3b82f6', popCapacity: 0, incomePotential: 120, laborRequired: 40, powerReq: 50,
  },
  [BuildingType.Industrial]: {
    type: BuildingType.Industrial, cost: 1200, maintenance: 100,
    name: { en: 'Industrial', zh: '工业' },
    description: { en: 'Heavy manufacturing.', zh: '重工业制造。' },
    color: '#f59e0b', popCapacity: 0, incomePotential: 450, laborRequired: 150, powerReq: 200,
  },
  [BuildingType.Park]: {
    type: BuildingType.Park, cost: 400, maintenance: 60,
    name: { en: 'Park', zh: '公园' },
    description: { en: 'Increases happiness.', zh: '提升城市幸福度。' },
    color: '#a855f7', popCapacity: 0, incomePotential: 0, powerReq: 5,
  },
  [BuildingType.PowerPlant]: {
    type: BuildingType.PowerPlant, cost: 3000, maintenance: 450,
    name: { en: 'Power Plant', zh: '电厂' },
    description: { en: 'Powers the city.', zh: '为城市提供电力。' },
    color: '#ec4899', popCapacity: 0, incomePotential: 0, powerGen: 1500,
  },
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'metropolis_start',
    name: { en: 'City Founder', zh: '城市奠基人' },
    description: { en: 'Reach 1,000 residents.', zh: '人口达到1,000人。' },
    condition: (s) => s.population >= 1000,
  },
  {
    id: 'eco_warrior',
    name: { en: 'Eco-Utopia', zh: '生态乌托邦' },
    description: { en: 'Happiness above 95%.', zh: '幸福度超过95%。' },
    condition: (s) => s.happiness >= 95 && s.population > 500,
  },
  {
    id: 'industrial_giant',
    name: { en: 'Workshop of the World', zh: '世界工厂' },
    description: { en: 'Generate $5,000 revenue.', zh: '单日收入达到$5,000。' },
    condition: (s) => s.finances.revenue >= 5000,
  }
];

export const UI_STRINGS: Record<string, Record<Language, string>> = {
  treasury: { en: 'Funds', zh: '资金' },
  citizens: { en: 'Pop', zh: '人口' },
  happiness: { en: 'Joy', zh: '幸福' },
  power: { en: 'Energy', zh: '电力' },
  revenue: { en: 'Revenue', zh: '收入' },
  expense: { en: 'Cost', zh: '支出' },
  maintenance_warn: { en: 'High Maintenance!', zh: '维护费过高！' },
  blackout_warn: { en: 'Power Crisis!', zh: '电力危机！' },
  road_warn: { en: 'No Road Access!', zh: '缺少道路连接！' },
  unemployed_warn: { en: 'Job Shortage!', zh: '就业岗位短缺！' },
};
