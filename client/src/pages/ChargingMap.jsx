import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApi } from '../api';
import { inr } from '../lib/format';
import '../styles/ChargingMap.css';

const CONNECTORS = ['CCS2', 'Type 2', 'CHAdeMO', 'Bharat AC001'];
const INDIA_CENTER = [22.5, 79];

// Great-circle distance in km
function distanceKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const boltIcon = L.divIcon({
  className: 'station-pin',
  html: '<span class="pin-body"><i>⚡</i></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
});

function popupNode(s) {
  const el = document.createElement('div');
  el.className = 'station-popup';
  const add = (tag, text, cls) => {
    const n = document.createElement(tag);
    n.textContent = text;
    if (cls) n.className = cls;
    el.appendChild(n);
    return n;
  };
  add('strong', s.name);
  add('div', `${s.operator} · ${s.area}, ${s.city}`, 'muted');
  s.connectors.forEach((c) => add('div', `${c.type}: ${c.powerKW} kW × ${c.count}`));
  add('div', `${inr(s.pricePerKWh)}/kWh · ${s.open24x7 ? 'Open 24/7' : 'Check hours'}`);
  const link = document.createElement('a');
  link.href = `https://www.openstreetmap.org/?mlat=${s.lat}&mlon=${s.lng}#map=16/${s.lat}/${s.lng}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open in OpenStreetMap';
  el.appendChild(link);
  return el;
}

export default function ChargingMap() {
  const [selected, setSelected] = useState([]); // connector filter (empty = all)
  const { data, loading, error, reload } = useApi('/api/stations', { connector: selected.join(',') });
  const [me, setMe] = useState(null); // { lat, lng }
  const [geoMsg, setGeoMsg] = useState('');
  const [locating, setLocating] = useState(false);

  const mapEl = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const markers = useRef({});
  const meMarker = useRef(null);

  const stations = useMemo(() => {
    const list = (data?.stations || []).map((s) => ({ ...s, dist: me ? distanceKm(me, s) : null }));
    return me ? list.sort((a, b) => a.dist - b.dist) : list;
  }, [data, me]);

  // Create the map once
  useEffect(() => {
    const m = L.map(mapEl.current, { scrollWheelZoom: false }).setView(INDIA_CENTER, 5);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  // Draw markers when the station list changes
  useEffect(() => {
    if (!map.current || !data) return;
    layer.current.clearLayers();
    markers.current = {};
    stations.forEach((s) => {
      const mk = L.marker([s.lat, s.lng], { icon: boltIcon, title: s.name, alt: s.name }).bindPopup(() => popupNode(s));
      mk.addTo(layer.current);
      markers.current[s.id] = mk;
    });
    if (!me && stations.length) {
      map.current.fitBounds(L.latLngBounds(stations.map((s) => [s.lat, s.lng])), { padding: [30, 30], maxZoom: 11 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Show the user and zoom to them plus the nearest stations
  useEffect(() => {
    if (!map.current || !me) return;
    if (meMarker.current) meMarker.current.remove();
    meMarker.current = L.circleMarker([me.lat, me.lng], {
      radius: 9, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1,
    }).addTo(map.current).bindTooltip('You are here');
    const near = stations.slice(0, 3).map((s) => [s.lat, s.lng]);
    map.current.fitBounds(L.latLngBounds([[me.lat, me.lng], ...near]), { padding: [40, 40], maxZoom: 13 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const toggle = (c) => setSelected((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const locate = () => {
    setGeoMsg('');
    if (!('geolocation' in navigator)) return setGeoMsg('Your browser does not support location.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setGeoMsg(
          err.code === 1
            ? 'Location permission was denied. Allow it in your browser, or pick a station from the list.'
            : 'Could not get your location. Try again or pick a station from the list.'
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const focusStation = (s) => {
    const mk = markers.current[s.id];
    if (!mk || !map.current) return;
    map.current.flyTo([s.lat, s.lng], 14, { duration: 0.8 });
    mk.openPopup();
    mapEl.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <main className="page map-page">
      <header className="calc-head">
        <h1>EV charging stations</h1>
        <p className="muted">Find chargers by connector type and plan your stops. Station data is a sample for demonstration.</p>
      </header>

      <div className="map-toolbar">
        <div className="chips" role="group" aria-label="Connector type">
          {CONNECTORS.map((c) => (
            <button key={c} type="button" className={`chip toggle ${selected.includes(c) ? 'on' : ''}`}
              aria-pressed={selected.includes(c)} onClick={() => toggle(c)}>
              {c}
            </button>
          ))}
          {selected.length > 0 && (
            <button type="button" className="link-btn" onClick={() => setSelected([])}>Clear</button>
          )}
        </div>
        <button type="button" className="btn btn-outline" onClick={locate} disabled={locating}>
          {locating ? 'Locating…' : '📍 Use my location'}
        </button>
      </div>

      {geoMsg && <p role="alert" className="msg error">{geoMsg}</p>}
      {error && (
        <div className="state-box" role="alert">
          <p className="muted">{error.message}</p>
          <button type="button" className="btn" onClick={reload}>Try again</button>
        </div>
      )}

      <div className="map-layout">
        <div ref={mapEl} className="map-canvas" role="region" aria-label="Map of EV charging stations" />

        <section className="station-list" aria-label="Charging stations" aria-busy={loading}>
          <p className="results-count" aria-live="polite">
            {data ? `${stations.length} station${stations.length === 1 ? '' : 's'}${me ? ', nearest first' : ''}` : 'Loading stations…'}
          </p>
          {data && stations.length === 0 && (
            <div className="state-box">
              <p className="muted">No stations match the selected connectors.</p>
              <button type="button" className="btn" onClick={() => setSelected([])}>Show all stations</button>
            </div>
          )}
          <ul>
            {stations.map((s) => (
              <li key={s.id} className="station-card">
                <div className="station-top">
                  <h3>{s.name}</h3>
                  {s.dist != null && <span className="tag">{s.dist < 10 ? s.dist.toFixed(1) : Math.round(s.dist)} km</span>}
                </div>
                <p className="muted small">{s.operator} · {s.area}, {s.city} · {inr(s.pricePerKWh)}/kWh</p>
                <ul className="conn-list">
                  {s.connectors.map((c) => (
                    <li key={c.type} className="feature">{c.type} · {c.powerKW} kW × {c.count}</li>
                  ))}
                </ul>
                <button type="button" className="link-btn" onClick={() => focusStation(s)}>Show on map</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
