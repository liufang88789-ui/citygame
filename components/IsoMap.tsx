
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MapControls, Environment, OrthographicCamera, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO, DepthOfField, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Grid, BuildingType, Season, Weather, TerrainType } from '../types';
import { GRID_SIZE, BUILDINGS } from '../constants';

const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number, h: number) => [x - WORLD_OFFSET, h * 0.5, y - WORLD_OFFSET] as [number, number, number];
const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

const getGroundColor = (season: Season, terrain: TerrainType, noise: number) => {
    if (terrain === TerrainType.Water) return '#1e40af';
    if (terrain === TerrainType.Mountain) {
        return season === Season.Winter ? '#cbd5e1' : '#475569';
    }
    switch (season) {
        case Season.Spring: return noise > 0.5 ? '#4ade80' : '#22c55e';
        case Season.Summer: return noise > 0.5 ? '#16a34a' : '#15803d';
        case Season.Autumn: return noise > 0.7 ? '#ea580c' : '#ca8a04';
        case Season.Winter: return '#f8fafc';
        default: return '#10b981';
    }
};

const WindowBlock = React.memo(({ position, scale, isNight }: { position: [number, number, number], scale: [number, number, number], isNight: boolean }) => (
  <mesh geometry={boxGeo} position={position} scale={scale}>
    <meshStandardMaterial 
      color={isNight ? "#ffcc00" : "#bfdbfe"} 
      emissive={isNight ? "#ff9900" : "#000000"} 
      emissiveIntensity={isNight ? 8 : 0} 
      roughness={0.1} 
      metalness={0.9} 
    />
  </mesh>
));

const ProceduralBuilding = React.memo(({ type, baseColor, x, y, isNight, h }: { type: BuildingType, baseColor: string, x: number, y: number, isNight: boolean, season: Season, h: number }) => {
  const hash = getHash(x, y);
  const color = useMemo(() => new THREE.Color(baseColor).offsetHSL(0, 0, hash * 0.1), [baseColor, hash]);
  const mainMat = useMemo(() => new THREE.MeshStandardMaterial({ 
    color, 
    flatShading: true, 
    roughness: 0.6,
    metalness: 0.2
  }), [color]);

  return (
    <group position={[0, h * 0.5 + 0.2, 0]}>
      {(() => {
        switch (type) {
          case BuildingType.Residential:
            return (
              <>
                <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} position={[0, 0.35, 0]} scale={[0.7, 0.7, 0.7]} />
                <WindowBlock position={[0.2, 0.45, 0.36]} scale={[0.15, 0.15, 0.02]} isNight={isNight} />
                <WindowBlock position={[-0.2, 0.45, 0.36]} scale={[0.15, 0.15, 0.02]} isNight={isNight} />
              </>
            );
          case BuildingType.Commercial:
            const height = 1.2 + hash * 2.5;
            return (
              <>
                <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} position={[0, height/2, 0]} scale={[0.75, height, 0.75]} />
                <WindowBlock position={[0, height - 0.3, 0.38]} scale={[0.5, 0.1, 0.02]} isNight={isNight} />
                <WindowBlock position={[0, height - 0.6, 0.38]} scale={[0.5, 0.1, 0.02]} isNight={isNight} />
                {isNight && (
                    <pointLight position={[0, height + 0.2, 0]} intensity={0.5} color="#60a5fa" distance={3} />
                )}
              </>
            );
          case BuildingType.Industrial:
            return (
                <group>
                    <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]} />
                    <mesh castShadow receiveShadow geometry={cylinderGeo} position={[0.2, 1, -0.2]} scale={[0.15, 1, 0.15]} material={new THREE.MeshStandardMaterial({ color: '#475569' })} />
                </group>
            );
          case BuildingType.Park:
            return (
              <group position={[0, 0.3, 0]}>
                <mesh castShadow receiveShadow geometry={sphereGeo} scale={0.4} material={new THREE.MeshStandardMaterial({ color: '#166534', roughness: 1 })} />
                <mesh castShadow receiveShadow geometry={cylinderGeo} position={[0, -0.3, 0]} scale={[0.1, 0.4, 0.1]} material={new THREE.MeshStandardMaterial({ color: '#78350f' })} />
              </group>
            );
          case BuildingType.PowerPlant:
            return (
              <group position={[0, 0.4, 0]}>
                <mesh castShadow receiveShadow material={mainMat} geometry={boxGeo} scale={[1, 0.8, 1]} />
                <mesh position={[0, 0.6, 0]} scale={[0.2, 0.4, 0.2]} geometry={cylinderGeo}>
                   <meshStandardMaterial color={isNight ? "#ff00ff" : "#334155"} emissive={isNight ? "#ff00ff" : "#000000"} emissiveIntensity={5} />
                </mesh>
              </group>
            );
          default: return null;
        }
      })()}
    </group>
  );
});

const WaterSystem = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y = -0.7 + Math.sin(state.clock.elapsedTime * 0.4) * 0.015;
        }
    });
    return (
        <mesh ref={meshRef} position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[GRID_SIZE + 20, GRID_SIZE + 20]} />
            <meshStandardMaterial color="#2563eb" transparent opacity={0.7} roughness={0} metalness={0.8} />
        </mesh>
    );
};

interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number) => void;
  hoveredTool: BuildingType;
  stats: any;
}

const IsoMap: React.FC<IsoMapProps> = ({ grid, onTileClick, hoveredTool, stats }) => {
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number} | null>(null);
  const isNight = stats.time < 6 || stats.time > 18;
  const skyColor = isNight ? "#020617" : (stats.weather === Weather.Rainy ? "#475569" : "#0c4a6e");

  return (
    <div className="absolute inset-0 touch-none" style={{ backgroundColor: skyColor }}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: false, stencil: false, depth: true }}>
        <OrthographicCamera makeDefault zoom={35} position={[100, 100, 100]} near={-500} far={2000} />
        <MapControls enableRotate={true} minZoom={10} maxZoom={150} target={[0,-1,0]} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={isNight ? 0.05 : 0.3} />
        <directionalLight 
            castShadow 
            position={[50, 100, 50]} 
            intensity={isNight ? 0.1 : 2.5} 
            shadow-mapSize={[2048, 2048]}
        >
            <orthographicCamera attach="shadow-camera" args={[-30, 30, 30, -30, 0.1, 300]} />
        </directionalLight>
        
        {isNight && (
            <spotLight position={[0, 40, 0]} intensity={20} distance={100} angle={0.5} penumbra={1} color="#1d4ed8" />
        )}

        <Environment preset={isNight ? "night" : "apartment"} />
        
        <ContactShadows 
            position={[0, -0.75, 0]} 
            opacity={0.4} 
            scale={GRID_SIZE * 1.5} 
            blur={2.5} 
            far={10} 
            color="#000000" 
        />
        
        <WaterSystem />
        
        <group>
          {grid.map((row, y) => row.map((tile, x) => {
              const [wx, wh, wz] = gridToWorld(x, y, tile.height);
              const noise = getHash(x, y);
              const isWater = tile.terrainType === TerrainType.Water;
              
              return (
                <React.Fragment key={`${x}-${y}`}>
                    <mesh 
                        position={[wx, wh - 0.5, wz]} 
                        receiveShadow 
                        castShadow 
                        onPointerEnter={(e) => { e.stopPropagation(); setHoveredTile({x, y}); }}
                        onPointerDown={(e) => { e.stopPropagation(); onTileClick(x, y); }}
                    >
                        <boxGeometry args={[1, 0.5 + (isWater ? 0 : tile.height * 0.5), 1]} />
                        <meshStandardMaterial 
                            color={tile.buildingType === BuildingType.Road ? "#111827" : getGroundColor(stats.season, tile.terrainType, noise)} 
                            roughness={0.9} 
                        />
                    </mesh>

                    {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && (
                        <ProceduralBuilding 
                            type={tile.buildingType} 
                            baseColor={BUILDINGS[tile.buildingType].color} 
                            x={x} y={y} 
                            isNight={isNight} 
                            season={stats.season}
                            h={tile.height}
                        />
                    )}
                </React.Fragment>
              );
          }))}
          
          {hoveredTile && (
            <mesh position={[grid[hoveredTile.y][hoveredTile.x].x - WORLD_OFFSET, grid[hoveredTile.y][hoveredTile.x].height * 0.5 - 0.24, grid[hoveredTile.y][hoveredTile.x].y - WORLD_OFFSET]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial color="white" transparent opacity={0.4} />
            </mesh>
          )}
        </group>

        {/* Post-Processing Pipeline */}
        <EffectComposer disableNormalPass multisampling={8}>
          <SSAO 
            intensity={20}
            radius={0.05}
            luminanceInfluence={0.5}
            color="#000000"
          />
          <Bloom 
            mipmapBlur 
            intensity={isNight ? 1.5 : 0.4} 
            luminanceThreshold={0.8} 
            radius={0.4} 
          />
          <DepthOfField 
            focusDistance={0.005} 
            focalLength={0.02} 
            bokehScale={4} 
          />
          <Vignette eskil={false} offset={0.1} darkness={0.8} />
          <Noise opacity={0.02} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default IsoMap;
