import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface Vehicle {
  id: string;
  plateNumber: string;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  fuelLevel: number;
  temperature?: number;
  distance?: number;
  driverId?: string;
  lastUpdate: string;
  ecoScore?: number;
  alerts?: string[];
}

interface FleetStats {
  total: number;
  active: number;
  idle: number;
  offline: number;
  maintenance: number;
  avgFuelEfficiency: number;
  totalDistance: number;
  avgEcoScore: number;
}

export function FleetTracker() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'idle' | 'alert'>('all');
  const [mapRef, setMapRef] = useState<any>(null);

  // Fetch vehicles with real-time updates
  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles-realtime'],
    queryFn: async () => {
      const res = await fetch('/api/vehicles?includeGPS=true&includeMetrics=true');
      return res.json();
    },
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Calculate fleet statistics
  const stats: FleetStats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    idle: vehicles.filter(v => v.status === 'idle').length,
    offline: vehicles.filter(v => v.status === 'offline').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    avgFuelEfficiency: vehicles.length > 0
      ? vehicles.reduce((sum, v) => sum + (v.fuelLevel || 0), 0) / vehicles.length
      : 0,
    totalDistance: vehicles.reduce((sum, v) => sum + (v.distance || 0), 0),
    avgEcoScore: vehicles.length > 0
      ? vehicles.reduce((sum, v) => sum + (v.ecoScore || 0), 0) / vehicles.length
      : 0,
  };

  // Filter vehicles based on status
  const filteredVehicles = vehicles.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'active') return v.status === 'active';
    if (filter === 'idle') return v.status === 'idle';
    if (filter === 'alert') return v.alerts && v.alerts.length > 0;
    return true;
  });

  // Initialize map (Leaflet)
  useEffect(() => {
    if (typeof window !== 'undefined' && !mapRef) {
      const L = require('leaflet');
      const map = L.map('map').setView([31.6295, -8.0047], 6); // Morocco center
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      setMapRef(map);
    }
  }, []);

  // Update vehicle markers on map
  useEffect(() => {
    if (!mapRef || !vehicles.length) return;

    // Clear existing markers
    mapRef.eachLayer((layer: any) => {
      if (layer.remove && !layer._isBaseLayer) {
        layer.remove();
      }
    });

    // Add vehicle markers
    vehicles.forEach(vehicle => {
      const L = require('leaflet');
      const color =
        vehicle.status === 'active' ? '#22c55e' :
        vehicle.status === 'idle' ? '#f59e0b' :
        vehicle.status === 'offline' ? '#ef4444' :
        '#8b5cf6';

      const marker = L.circleMarker([vehicle.latitude, vehicle.longitude], {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })
        .bindPopup(`
          <strong>${vehicle.plateNumber}</strong><br/>
          Status: ${vehicle.status}<br/>
          Speed: ${vehicle.speed} km/h<br/>
          Fuel: ${vehicle.fuelLevel}%
        `)
        .addTo(mapRef);

      marker.on('click', () => setSelectedVehicle(vehicle));
    });
  }, [mapRef, vehicles]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      idle: '#f59e0b',
      offline: '#ef4444',
      maintenance: '#8b5cf6',
    };
    return colors[status] || '#64748b';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'En route',
      idle: 'En attente',
      offline: 'Hors ligne',
      maintenance: 'Maintenance',
    };
    return labels[status] || status;
  };

  return (
    <div className="fleet-tracker">
      <div className="tracker-header">
        <h1>Suivi de Parc Temps Réel</h1>
        <p>Surveillance de {stats.total} camions • {stats.active} actifs</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Camions Actifs</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {stats.active}/{stats.total}
          </div>
          <div className="stat-subtext">En mouvement</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">En Attente</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {stats.idle}
          </div>
          <div className="stat-subtext">Immobilisés</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Hors Ligne</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>
            {stats.offline}
          </div>
          <div className="stat-subtext">GPS inactif</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Score Éco</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>
            {stats.avgEcoScore.toFixed(0)}
          </div>
          <div className="stat-subtext">/ 100</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Distance Total</div>
          <div className="stat-value" style={{ color: '#8b5cf6' }}>
            {(stats.totalDistance / 1000).toFixed(1)}k
          </div>
          <div className="stat-subtext">km</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Carburant Moyen</div>
          <div className="stat-value" style={{ color: '#06b6d4' }}>
            {stats.avgFuelEfficiency.toFixed(1)}%
          </div>
          <div className="stat-subtext">Niveau réservoir</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tous ({stats.total})
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          En Route ({stats.active})
        </button>
        <button
          className={`filter-btn ${filter === 'idle' ? 'active' : ''}`}
          onClick={() => setFilter('idle')}
        >
          En Attente ({stats.idle})
        </button>
        <button
          className={`filter-btn ${filter === 'alert' ? 'active' : ''}`}
          onClick={() => setFilter('alert')}
        >
          Alertes (?)
        </button>
      </div>

      <div className="tracker-content">
        {/* Map */}
        <div className="map-container">
          <div id="map" className="map"></div>
          {isLoading && <div className="loading">Chargement des véhicules...</div>}
        </div>

        {/* Vehicle List Sidebar */}
        <div className="vehicle-sidebar">
          <h3>Véhicules ({filteredVehicles.length})</h3>
          <div className="vehicle-list">
            {filteredVehicles.slice(0, 20).map(vehicle => (
              <div
                key={vehicle.id}
                className={`vehicle-item ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div
                  className="status-dot"
                  style={{ backgroundColor: getStatusColor(vehicle.status) }}
                ></div>
                <div className="vehicle-info">
                  <div className="vehicle-plate">{vehicle.plateNumber}</div>
                  <div className="vehicle-status">
                    {getStatusLabel(vehicle.status)}
                  </div>
                  <div className="vehicle-metrics">
                    <span>⚡ {vehicle.speed} km/h</span>
                    <span>⛽ {vehicle.fuelLevel}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicle Details Panel */}
      {selectedVehicle && (
        <div className="vehicle-details">
          <div className="details-header">
            <h2>{selectedVehicle.plateNumber}</h2>
            <button onClick={() => setSelectedVehicle(null)}>✕</button>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <span>Statut</span>
              <span style={{ color: getStatusColor(selectedVehicle.status) }}>
                {getStatusLabel(selectedVehicle.status)}
              </span>
            </div>
            <div className="detail-item">
              <span>Vitesse</span>
              <span>{selectedVehicle.speed} km/h</span>
            </div>
            <div className="detail-item">
              <span>Carburant</span>
              <span>{selectedVehicle.fuelLevel}%</span>
            </div>
            <div className="detail-item">
              <span>Température Moteur</span>
              <span>{selectedVehicle.temperature}°C</span>
            </div>
            <div className="detail-item">
              <span>Score Éco</span>
              <span>{selectedVehicle.ecoScore}/100</span>
            </div>
            <div className="detail-item">
              <span>Distance Parcourue</span>
              <span>{selectedVehicle.distance} km</span>
            </div>
            <div className="detail-item">
              <span>Position</span>
              <span>{selectedVehicle.latitude.toFixed(4)}, {selectedVehicle.longitude.toFixed(4)}</span>
            </div>
            <div className="detail-item">
              <span>Dernière Mise à Jour</span>
              <span>{new Date(selectedVehicle.lastUpdate).toLocaleTimeString('fr-FR')}</span>
            </div>
          </div>

          {selectedVehicle.alerts && selectedVehicle.alerts.length > 0 && (
            <div className="alerts-section">
              <h3>Alertes</h3>
              {selectedVehicle.alerts.map((alert, idx) => (
                <div key={idx} className="alert-item">
                  ⚠️ {alert}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .fleet-tracker {
          padding: 20px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .tracker-header {
          margin-bottom: 30px;
        }

        .tracker-header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .tracker-header p {
          color: #64748b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .stat-subtext {
          font-size: 12px;
          color: #94a3b8;
        }

        .filter-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: #1e40af;
          color: white;
          border-color: #1e40af;
        }

        .filter-btn:hover {
          border-color: #1e40af;
        }

        .tracker-content {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 20px;
          margin-bottom: 30px;
        }

        @media (max-width: 1024px) {
          .tracker-content {
            grid-template-columns: 1fr;
          }
        }

        .map-container {
          position: relative;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .map {
          width: 100%;
          height: 600px;
          border-radius: 8px;
        }

        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .vehicle-sidebar {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          overflow-y: auto;
          max-height: 600px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .vehicle-sidebar h3 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #1e293b;
        }

        .vehicle-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .vehicle-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          cursor: pointer;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }

        .vehicle-item:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .vehicle-item.selected {
          background: #dbeafe;
          border-color: #1e40af;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .vehicle-info {
          flex: 1;
          min-width: 0;
        }

        .vehicle-plate {
          font-weight: 600;
          font-size: 13px;
          color: #1e293b;
        }

        .vehicle-status {
          font-size: 12px;
          color: #64748b;
        }

        .vehicle-metrics {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
          display: flex;
          gap: 8px;
        }

        .vehicle-details {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
        }

        .details-header h2 {
          font-size: 18px;
          font-weight: 700;
        }

        .details-header button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #64748b;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .details-grid {
            grid-template-columns: 1fr;
          }
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-item span:first-child {
          color: #64748b;
          font-size: 13px;
        }

        .detail-item span:last-child {
          font-weight: 600;
          color: #1e293b;
        }

        .alerts-section {
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
        }

        .alerts-section h3 {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #ea580c;
        }

        .alert-item {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 4px;
          font-size: 13px;
          color: #92400e;
        }
      `}</style>
    </div>
  );
}
