"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  Search,
  Layers,
  MapPin,
  HelpCircle,
  Compass,
} from "lucide-react";
import { Land } from "@/types/farm";
import { parseCoordinates, getPolygonCenter, formatAreaKm2, EGYPT_BBOX } from "./geoUtils";

interface MapboxServiceMapProps {
  lands: Land[];
  selectedLand: Land | null;
  onSelectLand: (land: Land) => void;
  hasSatelliteData: boolean;
  overlayActive: boolean;
  onToggleOverlay: () => void;
}

const DEFAULT_MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ;

export default function MapboxServiceMap({
  lands,
  selectedLand,
  onSelectLand,
  hasSatelliteData,
  overlayActive,
  onToggleOverlay,
}: MapboxServiceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapBearing, setMapBearing] = useState(0);

  // Initialize Read-Only Visuals Mapbox
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agrisat_mapbox_token")
        : null;
    const token = storedToken || DEFAULT_MAPBOX_TOKEN;
    mapboxgl.accessToken = token;

    // Enable integrated Mapbox RTL plugin for Arabic language labels
    // IMPORTANT: lazy = false (eager load) ensures RTL glyphs are shaped
    // correctly from the very first render frame, preventing the flash-then-disappear behavior.
    try {
      if (mapboxgl.getRTLTextPluginStatus() === "unavailable") {
        mapboxgl.setRTLTextPlugin(
          "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js",
          null,
          false // eager load — NOT lazy
        );
      }
    } catch {
      // already registered
    }

    // Default center on agricultural Delta region (Egypt), flat horizontal top-down view (pitch: 0), strictly bounded to Egypt
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [31.2001, 30.0444],
      zoom: 8,
      pitch: 0,
      bearing: 0,
      maxBounds: EGYPT_BBOX,
    });

    mapRef.current = map;

    map.on("rotate", () => {
      setMapBearing(Math.round(map.getBearing()));
    });

    // ── Arabic label persistence ──────────────────────────────────
    // The satellite-streets-v12 style streams vector tiles asynchronously.
    // map.on("load") fires once, but later tile arrivals re-render symbol
    // layers using the original style (English).  We must re-apply the
    // Arabic override every time new vector data arrives or the style
    // finishes loading, with a debounce guard to avoid tight loops.
    let arabicLabelTimer: ReturnType<typeof setTimeout> | null = null;

    const setArabicLabels = () => {
      if (arabicLabelTimer) return;                // debounce guard
      arabicLabelTimer = setTimeout(() => {
        arabicLabelTimer = null;
        const style = map.getStyle();
        if (!style?.layers) return;
        style.layers.forEach((layer) => {
          if (
            layer.type === "symbol" &&
            layer.layout &&
            (layer.layout as any)["text-field"]
          ) {
            try {
              map.setLayoutProperty(layer.id, "text-field", [
                "coalesce",
                ["get", "name_ar"],
                ["get", "name"],
              ]);
            } catch {
              // ignore locked layers
            }
          }
        });
      }, 50);
    };

    // Bind to multiple lifecycle events so Arabic labels survive tile reloads
    map.on("style.load", setArabicLabels);
    map.on("sourcedata", setArabicLabels);
    map.once("idle", setArabicLabels);
    // ── End Arabic label persistence ──────────────────────────────

    // Map Load events
    map.on("load", () => {
      // Apply Arabic labels immediately on first load as well
      setArabicLabels();

      // Setup Lands GeoJSON source and fill/line layers (Read-only visuals)
      map.addSource("user-lands", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Base polygon fill
      map.addLayer({
        id: "user-lands-fill",
        type: "fill",
        source: "user-lands",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#059669",
            "#10B981",
          ],
          "fill-opacity": 0.45,
        },
      });

      // NDVI Simulated False-Color Overlay Layer
      map.addLayer({
        id: "user-lands-ndvi-overlay",
        type: "fill",
        source: "user-lands",
        paint: {
          "fill-color": "#22C55E",
          "fill-opacity": 0.38,
        },
      });

      // Glowing polygon outline
      map.addLayer({
        id: "user-lands-line",
        type: "line",
        source: "user-lands",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#34D399",
            "#10B981",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3.5,
            2,
          ],
        },
      });

      // Polygon click selection
      map.on("click", "user-lands-fill", (e) => {
        if (!e.features || !e.features[0]) return;
        const landId = e.features[0].properties?.id;
        const clicked = lands.find((l) => l.id === landId);
        if (clicked) {
          onSelectLand(clicked);
        }
      });

      map.on("mouseenter", "user-lands-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "user-lands-fill", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      if (arabicLabelTimer) clearTimeout(arabicLabelTimer);
      map.remove();
    };
  }, []);

  // Update Lands GeoJSON on Map and custom field markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const updateSourceAndMarkers = () => {
      const source = map.getSource("user-lands") as mapboxgl.GeoJSONSource;
      if (!source) return;

      const features = lands.map((land) => ({
        type: "Feature" as const,
        id: land.id,
        properties: {
          id: land.id,
          name: land.name,
          area_hectares: land.area_hectares,
          selected: selectedLand?.id === land.id,
        },
        geometry: land.boundary,
      }));

      source.setData({
        type: "FeatureCollection",
        features: features,
      });

      // Add HTML markers matching visual design
      lands.forEach((land, idx) => {
        const center = getPolygonCenter(land.boundary.coordinates[0]);
        const el = document.createElement("div");
        el.className = "field-marker-container";

        const dot = document.createElement("div");
        const isAlertField = idx === 3 || land.name.toLowerCase().includes("alert");
        dot.className = `marker-dot ${isAlertField ? "orange" : "green"}`;

        const label = document.createElement("span");
        label.innerText = isAlertField
          ? `${land.name} (Moisture Alert)`
          : `${land.name} (${(0.78 + (idx % 3) * 0.04).toFixed(2)} NDVI)`;

        el.appendChild(dot);
        el.appendChild(label);

        el.onclick = (e) => {
          e.stopPropagation();
          onSelectLand(land);
        };

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(center)
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    if (map.isStyleLoaded()) {
      updateSourceAndMarkers();
    } else {
      map.once("styledata", updateSourceAndMarkers);
    }
  }, [lands, selectedLand]);

  // Toggle NDVI overlay visibility based on state
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("user-lands-ndvi-overlay")) {
      map.setLayoutProperty(
        "user-lands-ndvi-overlay",
        "visibility",
        overlayActive && hasSatelliteData ? "visible" : "none"
      );
    }
  }, [overlayActive, hasSatelliteData]);

  // Fly to selected land and show its borders
  useEffect(() => {
    if (!selectedLand || !mapRef.current) return;
    const center = getPolygonCenter(selectedLand.boundary.coordinates[0]);
    mapRef.current.flyTo({
      center,
      zoom: 13.5,
      pitch: 25,
      duration: 1600,
    });
  }, [selectedLand]);

  // Search execution (Coordinates or Mapbox Geocoding in Arabic & English)
  const handleSearch = useCallback(
    async (query: string) => {
      const map = mapRef.current;
      if (!map) return;

      const trimmed = query.trim();
      if (!trimmed) {
        setSearchResults([]);
        return;
      }

      // 1. Coordinates search
      const coords = parseCoordinates(trimmed);
      if (coords) {
        map.flyTo({ center: coords, zoom: 14 });
        setSearchResults([]);
        return;
      }

      // 2. Mapbox Geocoding in Arabic & English
      setIsSearching(true);
      try {
        const token = mapboxgl.accessToken || DEFAULT_MAPBOX_TOKEN;
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            trimmed
          )}.json?access_token=${token}&country=eg&language=ar,en&types=place,locality,neighborhood,address,poi,region,country`
        );
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch (e) {
        console.error("Geocoding failed", e);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const selectSearchResult = (item: any) => {
    const map = mapRef.current;
    if (map && item.center) {
      map.flyTo({
        center: item.center,
        zoom: 13,
        pitch: 0,
        bearing: 0,
        duration: 1800,
      });
      setSearchResults([]);
      setSearchQuery(item.place_name_ar || item.place_name);
    }
  };

  const handleResetNorth = () => {
    mapRef.current?.easeTo({
      bearing: 0,
      pitch: 0,
      duration: 600,
    });
  };

  return (
    <div className="map-viewport">
      {/* Map Container */}
      <div ref={mapContainerRef} className="map-element" />

      {/* Top Floating Bar */}
      <div className="top-map-bar">
        {/* Search input supporting place names in Arabic & coordinates */}
        <div className="map-search-container">
          <div className="map-search-input-wrap">
            <Search size={18} style={{ color: "#64748B", flexShrink: 0 }} />
            <input
              type="text"
              className="map-search-input"
              placeholder="Search location in Egypt (Arabic/English) or coordinates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(searchQuery);
              }}
            />
          </div>

          {/* Search suggestions dropdown */}
          {searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="search-result-item"
                  onClick={() => selectSearchResult(item)}
                >
                  <MapPin
                    size={16}
                    style={{ color: "#10B981", marginTop: "2px", flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#F8FAFC" }}>
                      {item.text_ar || item.text}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                      {item.place_name_ar || item.place_name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Right Floating HUD Pills */}
        <div className="top-hud-group">
          {/* Compass / North Reset Button */}
          <button
            type="button"
            className="hud-pill"
            onClick={handleResetNorth}
            title="Reset to True North (0°)"
            style={{
              cursor: "pointer",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              color: "#F8FAFC",
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "6px 12px",
            }}
          >
            <Compass
              size={17}
              style={{
                color: "#10B981",
                transform: `rotate(${-mapBearing}deg)`,
                transition: "transform 0.2s ease-out",
              }}
            />
            <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>
              North {mapBearing !== 0 ? `(${mapBearing}°)` : ""}
            </span>
          </button>

          {/* Active Layer Pill */}
          <div className="hud-pill">
            <Layers size={16} style={{ color: "#10B981" }} />
            <span>Active Layer: Sentinel-2 NDVI Index</span>
          </div>

          {/* Overlay Toggle Switch Pill */}
          {/* If no satellite data: deactivate toggle and show hover tooltip stating "no data provided yet" */}
          <div
            className={`hud-pill ${!hasSatelliteData ? "disabled-pill" : ""}`}
            style={{ userSelect: "none" }}
            onClick={() => {
              if (hasSatelliteData) {
                onToggleOverlay();
              }
            }}
          >
            <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>Overlay:</span>
            <div
              className={`toggle-switch ${
                hasSatelliteData && overlayActive ? "on" : ""
              }`}
            >
              <div className="toggle-knob" />
            </div>

            {/* Hover Tooltip when no satellite data is available */}
            {!hasSatelliteData && (
              <div className="hud-tooltip">no data provided yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Right Legend Card */}
      <div className="bottom-legend-card">
        <div className="legend-title">SENTINEL-2 NDVI INDEX</div>
        <div className="legend-bar" />
        <div className="legend-labels">
          <span>0.0 Bare</span>
          <span>0.4 Stress</span>
          <span>0.85 Dense</span>
        </div>
      </div>
    </div>
  );
}
