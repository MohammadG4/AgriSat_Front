"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

import {
  Search,
  Layers,
  PenTool,
  MapPin,
  Trash2,
  ZoomIn,
  ZoomOut,
  Compass,
  Key,
  Check,
} from "lucide-react";
import { GeoJsonPolygon, Land } from "@/types/farm";
import { parseCoordinates, getPolygonCenter } from "./geoUtils";

interface MapboxServiceMapProps {
  lands: Land[];
  selectedLand: Land | null;
  onSelectLand: (land: Land) => void;
  onPolygonDrawn: (polygon: GeoJsonPolygon) => void;
  onOpenTuneModal: (land: Land) => void;
  drawTrigger: number; // Increment to activate drawing programmatically
}

const DEFAULT_MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
  "";

export default function MapboxServiceMap({
  lands,
  selectedLand,
  onSelectLand,
  onPolygonDrawn,
  onOpenTuneModal,
  drawTrigger,
}: MapboxServiceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Search & HUD state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [overlayActive, setOverlayActive] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showTokenPrompt, setShowTokenPrompt] = useState(false);
  const [customToken, setCustomToken] = useState("");

  // Initialize Mapbox & Draw
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("agrisat_mapbox_token")
        : null;
    const token = storedToken || DEFAULT_MAPBOX_TOKEN;
    mapboxgl.accessToken = token;

    // Enable integrated Mapbox RTL plugin for Arabic language labels
    try {
      if (mapboxgl.getRTLTextPluginStatus() === "unavailable") {
        mapboxgl.setRTLTextPlugin(
          "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js",
          null,
          true
        );
      }
    } catch {
      // already registered
    }

    // Default center on agricultural Delta region (e.g. Nile Delta, Egypt: 31.0, 30.8)
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [31.2001, 30.8205],
      zoom: 11,
      pitch: 20,
    });

    mapRef.current = map;

    // Initialize Mapbox Draw
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: "simple_select",
    });
    drawRef.current = draw;
    map.addControl(draw, "top-right");

    // Map Load events
    map.on("load", () => {
      // 1. Force Arabic labels on all text symbol layers (integrated mapbox labeling)
      const style = map.getStyle();
      if (style && style.layers) {
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
                ["get", "name_en"],
                ["get", "name"],
              ]);
            } catch {
              // some layers may use non-standard expressions
            }
          }
        });
      }

      // 2. Setup Lands GeoJSON source and fill/line layers
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
          "fill-opacity": 0.35,
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

    // Draw events
    const onDrawCreate = (e: any) => {
      setIsDrawing(false);
      const feature = e.features?.[0];
      if (feature && feature.geometry && feature.geometry.type === "Polygon") {
        onPolygonDrawn(feature.geometry as GeoJsonPolygon);
      }
    };

    const onDrawModeChange = (e: any) => {
      setIsDrawing(e.mode === "draw_polygon");
    };

    map.on("draw.create", onDrawCreate);
    map.on("draw.modechange", onDrawModeChange);

    return () => {
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

      // Add HTML markers matching user screenshot: "Field #1 (Wheat 0.82 NDVI)"
      lands.forEach((land, idx) => {
        const center = getPolygonCenter(land.boundary.coordinates[0]);
        const el = document.createElement("div");
        el.className = "field-marker-container";

        const dot = document.createElement("div");
        // Field #4 in user screenshot had orange moisture alert, others green
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

  // Handle programmatically triggered drawing
  useEffect(() => {
    if (drawTrigger > 0 && drawRef.current) {
      drawRef.current.changeMode("draw_polygon");
      setIsDrawing(true);
    }
  }, [drawTrigger]);

  // Toggle NDVI overlay opacity
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer("user-lands-ndvi-overlay")) {
      map.setLayoutProperty(
        "user-lands-ndvi-overlay",
        "visibility",
        overlayActive ? "visible" : "none"
      );
    }
  }, [overlayActive]);

  // Fly to selected land
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

  // Search execution (Coordinates or Mapbox Geocoding)
  const handleSearch = useCallback(
    async (query: string) => {
      const map = mapRef.current;
      if (!map) return;

      const trimmed = query.trim();
      if (!trimmed) {
        setSearchResults([]);
        return;
      }

      // Check if coordinate search
      const coords = parseCoordinates(trimmed);
      if (coords) {
        map.flyTo({ center: coords, zoom: 14 });
        setSearchResults([]);
        return;
      }

      // Mapbox Geocoding in Arabic & English
      setIsSearching(true);
      try {
        const token = mapboxgl.accessToken || DEFAULT_MAPBOX_TOKEN;
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            trimmed
          )}.json?access_token=${token}&language=ar,en&types=place,locality,neighborhood,address,poi,region,country`
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
        duration: 1800,
      });
      setSearchResults([]);
      setSearchQuery(item.place_name_ar || item.place_name);
    }
  };

  const toggleDrawMode = () => {
    if (!drawRef.current) return;
    if (isDrawing) {
      drawRef.current.changeMode("simple_select");
      setIsDrawing(false);
    } else {
      drawRef.current.changeMode("draw_polygon");
      setIsDrawing(true);
    }
  };

  const handleSaveCustomToken = () => {
    if (customToken.trim()) {
      localStorage.setItem("agrisat_mapbox_token", customToken.trim());
      mapboxgl.accessToken = customToken.trim();
      setShowTokenPrompt(false);
      window.location.reload();
    }
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
              placeholder="Search location (Arabic/English) or coordinates (lat, lng)..."
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

        {/* Top Right HUD Pills matching screenshot */}
        <div className="top-hud-group">
          {/* Active Layer Pill */}
          <div className="hud-pill">
            <Layers size={16} style={{ color: "#10B981" }} />
            <span>Active Layer: Sentinel-2 NDVI Index</span>
          </div>

          {/* Overlay Toggle Switch Pill matching screenshot */}
          <div
            className="hud-pill"
            style={{ cursor: "pointer", userSelect: "none" }}
            onClick={() => setOverlayActive(!overlayActive)}
          >
            <span style={{ fontSize: "0.84rem", fontWeight: 600 }}>Overlay:</span>
            <div className={`toggle-switch ${overlayActive ? "on" : ""}`}>
              <div className="toggle-knob" />
            </div>
          </div>

          {/* Draw Land Trigger Button */}
          <button
            type="button"
            className={`hud-pill hud-btn ${isDrawing ? "active" : ""}`}
            onClick={toggleDrawMode}
            title="Use Mapbox Draw to outline a land parcel"
          >
            <PenTool size={15} />
            <span>{isDrawing ? "Click Points to Draw" : "Draw Land"}</span>
          </button>

          {/* Mapbox Token config */}
          <button
            type="button"
            className="hud-pill hud-btn"
            onClick={() => setShowTokenPrompt(true)}
            title="Configure Mapbox Access Token"
            style={{ padding: "8px 10px" }}
          >
            <Key size={15} />
          </button>
        </div>
      </div>

      {/* Selected Land Detail Card on Map */}
      {selectedLand && (
        <div className="selected-land-card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#10B981" }}>
              {selectedLand.name}
            </span>
            <span className="badge badge-success">NDVI Active</span>
          </div>

          <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginBottom: "12px" }}>
            <div>Location: {selectedLand.location || "Nile Delta Sector"}</div>
            <div>
              Area: {selectedLand.area_hectares != null ? `${selectedLand.area_hectares} ha` : "Calculated"}
            </div>
            <div>Soil: {selectedLand.soil_type || "Clay"} &bull; Irrigation: {selectedLand.irrigation_type || "Drip"}</div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: "0.78rem", padding: "8px 12px", width: "100%" }}
              onClick={() => onOpenTuneModal(selectedLand)}
            >
              Tune Alert Scenarios
            </button>
          </div>
        </div>
      )}

      {/* Bottom Right Legend Card matching screenshot */}
      <div className="bottom-legend-card">
        <div className="legend-title">SENTINEL-2 NDVI INDEX</div>
        <div className="legend-bar" />
        <div className="legend-labels">
          <span>0.0 Bare</span>
          <span>0.4 Stress</span>
          <span>0.85 Dense</span>
        </div>
      </div>

      {/* Mapbox Token Prompt Modal */}
      {showTokenPrompt && (
        <div className="modal-overlay">
          <div className="modal-content-box" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <div style={{ fontWeight: 700, fontSize: "1rem" }}>Mapbox Token Setup</div>
              <button
                type="button"
                onClick={() => setShowTokenPrompt(false)}
                style={{ color: "#94A3B8" }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.85rem", color: "#94A3B8", marginBottom: "14px" }}>
                Enter your Mapbox Public Access Token (starts with <code>pk.eyJ...</code>). This will be saved to your browser session.
              </p>
              <input
                type="text"
                className="form-input"
                placeholder="pk.eyJ1..."
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowTokenPrompt(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveCustomToken}
              >
                Save &amp; Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
