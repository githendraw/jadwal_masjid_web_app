'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MarkerIcon from 'leaflet/dist/images/marker-icon.png';
import MarkerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import MarkerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: MarkerIcon,
  iconRetinaUrl: MarkerIcon2x,
  shadowUrl: MarkerShadow,
});

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  fullscreen?: boolean;
  onCloseFullscreen?: () => void;
}

export default function MapPicker({ lat, lng, onChange, fullscreen, onCloseFullscreen }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const m = L.map(containerRef.current, { zoomControl: true }).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);

    const marker = L.marker([lat, lng], { draggable: true }).addTo(m);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChange(pos.lat, pos.lng);
    });

    m.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      m.setView(e.latlng, m.getZoom());
      onChange(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = m;
    markerRef.current = marker;

    const timer = setTimeout(() => {
      if (mapRef.current) m.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      marker.off();
      m.off();
      m.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const m = mapRef.current;
    const marker = markerRef.current!;
    marker.setLatLng([lat, lng]);
    m.setView([lat, lng], m.getZoom());
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {fullscreen && (
        <>
          <button
            onClick={onCloseFullscreen}
            className="absolute bottom-6 right-3 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-lg transition-colors"
            style={{ zIndex: 1000 }}
            title="Tutup fullscreen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>
          </button>
          <div className="absolute top-2 left-2 bg-slate-900/80 text-white px-3 py-2 rounded-lg text-sm font-medium" style={{ zIndex: 1000 }}>
            Klik atau geser pin untuk mengatur lokasi
          </div>
        </>
      )}
    </div>
  );
}