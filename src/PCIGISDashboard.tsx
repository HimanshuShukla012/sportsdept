import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid,
  Building2,
  ClipboardList,
  ShieldCheck,
  Search as SearchIcon,
  Bot as DroneIcon,
  FileBarChart2,
  Bell,
  Users,
  History,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Plus,
  Minus,
  LocateFixed,
  RefreshCw,
  ClipboardCheck,
  GraduationCap,
  Plane,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  GeoJSON,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * PCI GIS ECOSYSTEM — Dummy Dashboard
 * -----------------------------------
 * Fully self-contained mock dashboard modeled on the reference screenshot.
 * All data below is hard-coded dummy data — no API calls, no auth, no backend.
 *
 * Requirements in the host project:
 *   npm install react-leaflet leaflet lucide-react
 *   Tailwind CSS configured (utility classes used throughout)
 *
 * Notes on this revision:
 *  - Default view is locked to India only (minZoom + maxBounds), you cannot
 *    zoom/pan out to see the rest of the world.
 *  - State/UT boundaries are drawn from a public India states GeoJSON
 *    (fetched at runtime — requires internet access in the browser running
 *    this app). If the fetch fails, the map still works, just without
 *    boundary lines.
 *  - At the India-level zoom, each state shows a circular cluster with an
 *    approximate institution count. Clicking a cluster flies into that
 *    state and swaps the cluster for individual institution pins. Zooming
 *    back out (or the "All India" button) returns to the cluster view.
 *  - The "Fullscreen" button opens the exact same map (state + filters)
 *    in a new browser tab, rendered edge-to-edge, and requests native
 *    fullscreen on load.
 *  - The Legend panel is collapsible (chevron in its header).
 */

// ---------------------------------------------------------------------------
// Dummy data
// ---------------------------------------------------------------------------

type PinStatus = "compliant" | "noncompliant" | "inspection" | "notsurveyed";

interface InstitutionPin {
  id: string;
  name: string;
  status: PinStatus;
  stateId: string;
  coords: [number, number];
}

interface StateCluster {
  id: string;
  name: string;
  count: number;
  coords: [number, number];
  zoom: number;
}

// Status breakdown — proportionally scaled to the real Grand Total of 6,172
// institutions (same rough split as the reference dashboard: ~60% compliant,
// ~17% non-compliant, ~10% under inspection, ~12% not surveyed).
const STATUS_META: Record<
  PinStatus,
  { label: string; color: string; count: number; pct: string }
> = {
  compliant: { label: "Compliant", color: "#16A34A", count: 3726, pct: "60.37%" },
  noncompliant: { label: "Non-Compliant", color: "#DC2626", count: 1039, pct: "16.83%" },
  inspection: { label: "Under Inspection", color: "#F59E0B", count: 637, pct: "10.32%" },
  notsurveyed: { label: "Not Surveyed", color: "#2563EB", count: 770, pct: "12.48%" },
};

// India view lock
const INDIA_CENTER: [number, number] = [22.9, 79.5];
const INDIA_DEFAULT_ZOOM = 5;
const INDIA_MIN_ZOOM = 5;
const INDIA_MAX_ZOOM = 12;
const INDIA_BOUNDS = L.latLngBounds(
  [6.0, 67.0], // south-west
  [37.8, 98.5] // north-east
);
// Zoom level at (or below) which we snap back to the all-India cluster view
const STATE_DRILLDOWN_ZOOM_THRESHOLD = 6.2;

const INDIA_STATES_GEOJSON_URL =
  "https://gist.githubusercontent.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112/raw/e388c4cae20aa53cb5090210a42ebb9b765c0a36/india_states.geojson";

// Real state-wise institution counts (Grand Total: 6,172)
const STATE_CLUSTERS: StateCluster[] = [
  { id: "up", name: "Uttar Pradesh", count: 1986, coords: [26.85, 80.95], zoom: 7 },
  { id: "mh", name: "Maharashtra", count: 792, coords: [19.75, 75.71], zoom: 7 },
  { id: "rj", name: "Rajasthan", count: 443, coords: [27.02, 74.22], zoom: 7 },
  { id: "ka", name: "Karnataka", count: 380, coords: [15.32, 75.71], zoom: 7 },
  { id: "mp", name: "Madhya Pradesh", count: 378, coords: [22.97, 78.66], zoom: 7 },
  { id: "wb", name: "West Bengal", count: 281, coords: [22.99, 87.85], zoom: 7 },
  { id: "hr", name: "Haryana", count: 212, coords: [29.06, 76.09], zoom: 8 },
  { id: "tn", name: "Tamil Nadu", count: 172, coords: [11.13, 78.66], zoom: 7 },
  { id: "ap", name: "Andhra Pradesh", count: 168, coords: [15.91, 79.74], zoom: 7 },
  { id: "jh", name: "Jharkhand", count: 166, coords: [23.61, 85.28], zoom: 7 },
  { id: "tg", name: "Telangana", count: 149, coords: [18.11, 79.02], zoom: 7 },
  { id: "pb", name: "Punjab", count: 139, coords: [31.14, 75.34], zoom: 8 },
  { id: "gj", name: "Gujarat", count: 131, coords: [22.26, 71.19], zoom: 7 },
  { id: "uk", name: "Uttarakhand", count: 131, coords: [30.07, 79.02], zoom: 8 },
  { id: "ct", name: "Chhattisgarh", count: 122, coords: [21.28, 81.87], zoom: 7 },
  { id: "or", name: "Odisha", count: 121, coords: [20.95, 85.1], zoom: 7 },
  { id: "br", name: "Bihar", count: 109, coords: [25.1, 85.31], zoom: 7 },
  { id: "kl", name: "Kerala", count: 78, coords: [10.85, 76.27], zoom: 7 },
  { id: "hp", name: "Himachal Pradesh", count: 46, coords: [31.1, 77.17], zoom: 8 },
  { id: "jk", name: "Jammu & Kashmir", count: 43, coords: [33.78, 76.58], zoom: 8 },
  { id: "as", name: "Assam", count: 42, coords: [26.2, 92.94], zoom: 7 },
  { id: "sk", name: "Sikkim", count: 23, coords: [27.53, 88.51], zoom: 9 },
  { id: "mn", name: "Manipur", count: 12, coords: [24.66, 93.9], zoom: 8 },
  { id: "dl", name: "Delhi", count: 10, coords: [28.7, 77.1], zoom: 9 },
  { id: "tr", name: "Tripura", count: 8, coords: [23.94, 91.99], zoom: 9 },
  { id: "py", name: "Puducherry", count: 6, coords: [11.94, 79.81], zoom: 9 },
  { id: "ar", name: "Arunachal Pradesh", count: 5, coords: [28.22, 94.73], zoom: 8 },
  { id: "ml", name: "Meghalaya", count: 5, coords: [25.47, 91.37], zoom: 8 },
  { id: "mz", name: "Mizoram", count: 5, coords: [23.16, 92.94], zoom: 8 },
  { id: "ga", name: "Goa", count: 4, coords: [15.3, 74.12], zoom: 9 },
  { id: "ch", name: "Chandigarh", count: 3, coords: [30.73, 76.78], zoom: 10 },
  { id: "nl", name: "Nagaland", count: 1, coords: [26.16, 94.56], zoom: 9 },
  { id: "dnh", name: "Dadra & Nagar Haveli", count: 1, coords: [20.18, 73.02], zoom: 10 },
];

const SCATTER_PINS: InstitutionPin[] = [
  { id: "p1", name: "Apex Pharmacy Institute", status: "compliant", stateId: "up", coords: [26.85, 80.95] },
  { id: "p2", name: "Ganga Pharma College", status: "noncompliant", stateId: "up", coords: [25.45, 81.85] },
  { id: "p2b", name: "Awadh Institute of Pharmacy", status: "compliant", stateId: "up", coords: [26.77, 80.9] },
  { id: "p2c", name: "Yamuna Pharma College", status: "inspection", stateId: "up", coords: [27.9, 78.05] },
  { id: "p3", name: "Delhi School of Pharmacy", status: "inspection", stateId: "dl", coords: [28.61, 77.21] },
  { id: "p3b", name: "Capital College of Pharmacy", status: "compliant", stateId: "dl", coords: [28.7, 77.1] },
  { id: "p4", name: "Punjab Pharma Academy", status: "compliant", stateId: "pb", coords: [31.14, 75.34] },
  { id: "p5", name: "Himalayan Pharma Institute", status: "noncompliant", stateId: "hp", coords: [31.1, 77.17] },
  { id: "p6", name: "Rajputana College of Pharmacy", status: "compliant", stateId: "rj", coords: [26.92, 75.78] },
  { id: "p6b", name: "Marwar Pharma Institute", status: "inspection", stateId: "rj", coords: [26.28, 73.02] },
  { id: "p7", name: "Saurashtra Pharma College", status: "inspection", stateId: "gj", coords: [22.3, 70.8] },
  { id: "p7b", name: "Ahmedabad Institute of Pharmacy", status: "compliant", stateId: "gj", coords: [23.03, 72.58] },
  { id: "p8", name: "Deccan Institute of Pharmacy", status: "compliant", stateId: "mh", coords: [18.52, 73.85] },
  { id: "p9", name: "Konkan Pharma College", status: "compliant", stateId: "mh", coords: [16.7, 73.3] },
  { id: "p9b", name: "Vidarbha School of Pharmacy", status: "noncompliant", stateId: "mh", coords: [21.15, 79.09] },
  { id: "p10", name: "Malwa Pharmacy Institute", status: "noncompliant", stateId: "mp", coords: [23.26, 77.41] },
  { id: "p11", name: "Bundelkhand Pharma College", status: "inspection", stateId: "mp", coords: [24.6, 78.6] },
  { id: "p12", name: "Kalinga Institute of Pharmacy", status: "noncompliant", stateId: "or", coords: [20.3, 85.8] },
  { id: "p13", name: "Andhra Pharma College", status: "compliant", stateId: "ap", coords: [16.5, 80.6] },
  { id: "p14", name: "Telangana School of Pharmacy", status: "notsurveyed", stateId: "tg", coords: [17.9, 79.5] },
  { id: "p15", name: "Malabar Pharma Institute", status: "compliant", stateId: "kl", coords: [11.25, 75.78] },
  { id: "p15b", name: "Kochi College of Pharmacy", status: "compliant", stateId: "kl", coords: [9.93, 76.26] },
  { id: "p16", name: "Kaveri College of Pharmacy", status: "compliant", stateId: "tn", coords: [10.79, 78.7] },
  { id: "p16b", name: "Chennai Institute of Pharmacy", status: "compliant", stateId: "tn", coords: [13.08, 80.27] },
  { id: "p16c", name: "Madurai Pharma College", status: "inspection", stateId: "tn", coords: [9.93, 78.12] },
  { id: "p17", name: "Bengal Pharma Academy", status: "compliant", stateId: "wb", coords: [23.5, 88.3] },
  { id: "p17b", name: "Kolkata School of Pharmacy", status: "compliant", stateId: "wb", coords: [22.57, 88.36] },
  { id: "p18", name: "Assam Institute of Pharmacy", status: "notsurveyed", stateId: "as", coords: [26.2, 92.9] },
  { id: "p19", name: "Manipur Pharma College", status: "notsurveyed", stateId: "mn", coords: [24.66, 93.9] },
  { id: "p20", name: "Bihar School of Pharmacy", status: "noncompliant", stateId: "br", coords: [25.6, 85.1] },
  { id: "p20b", name: "Patna Institute of Pharmacy", status: "compliant", stateId: "br", coords: [25.61, 85.14] },
  { id: "p21", name: "Jharkhand Pharma Institute", status: "compliant", stateId: "jh", coords: [23.6, 85.3] },
  { id: "p22", name: "Chhattisgarh College of Pharmacy", status: "inspection", stateId: "ct", coords: [21.2, 81.6] },
  { id: "p23", name: "Meghalaya Pharma College", status: "compliant", stateId: "ml", coords: [25.5, 91.3] },
  { id: "p24", name: "Haryana Institute of Pharmacy", status: "compliant", stateId: "hr", coords: [29.06, 76.09] },
  { id: "p25", name: "Bengaluru College of Pharmacy", status: "compliant", stateId: "ka", coords: [12.97, 77.59] },
  { id: "p25b", name: "Hubli Pharma Institute", status: "inspection", stateId: "ka", coords: [15.36, 75.12] },
  { id: "p26", name: "Doon Institute of Pharmacy", status: "compliant", stateId: "uk", coords: [30.32, 78.03] },
  { id: "p27", name: "Kashmir Valley Pharma College", status: "inspection", stateId: "jk", coords: [34.08, 74.8] },
  { id: "p28", name: "Gangtok School of Pharmacy", status: "compliant", stateId: "sk", coords: [27.33, 88.61] },
  { id: "p29", name: "Agartala Pharma Institute", status: "compliant", stateId: "tr", coords: [23.83, 91.28] },
  { id: "p30", name: "Puducherry College of Pharmacy", status: "compliant", stateId: "py", coords: [11.91, 79.81] },
  { id: "p31", name: "Itanagar Pharma Institute", status: "notsurveyed", stateId: "ar", coords: [27.09, 93.62] },
  { id: "p32", name: "Aizawl School of Pharmacy", status: "notsurveyed", stateId: "mz", coords: [23.73, 92.72] },
  { id: "p33", name: "Panaji Institute of Pharmacy", status: "compliant", stateId: "ga", coords: [15.49, 73.83] },
  { id: "p34", name: "Chandigarh College of Pharmacy", status: "compliant", stateId: "ch", coords: [30.75, 76.78] },
  { id: "p35", name: "Kohima Pharma Institute", status: "notsurveyed", stateId: "nl", coords: [25.67, 94.11] },
  { id: "p36", name: "Silvassa Institute of Pharmacy", status: "notsurveyed", stateId: "dnh", coords: [20.27, 73.01] },
];

const DISTRICTS = ["All Districts", "Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Prayagraj"];
const INSTITUTION_TYPES = ["All Institution Types", "D.Pharm College", "B.Pharm College", "M.Pharm College", "PharmD College"];
const AFFILIATION_STATUS = ["All Status", "Affiliated", "Provisionally Affiliated", "De-affiliated"];

const RECENT_ALERTS = [
  { id: 1, text: "14 institutions flagged non-compliant after Q3 inspection sync", time: "2h ago", tone: "red" },
  { id: 2, text: "Drone survey completed for Lucknow district (212 sites)", time: "5h ago", tone: "blue" },
  { id: 3, text: "89 institutions pending re-survey before 30 Sep deadline", time: "1d ago", tone: "amber" },
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function formatIN(n: number) {
  return n.toLocaleString("en-IN");
}

function pinDivIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
        width:16px;height:16px;border-radius:50% 50% 50% 0;
        background:${color};border:2px solid white;
        box-shadow:0 1px 3px rgba(0,0,0,0.4);
        transform:rotate(-45deg);
      "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
    popupAnchor: [0, -16],
  });
}

function clusterDivIcon(count: number) {
  const size = count > 400 ? 56 : count > 150 ? 46 : count > 50 ? 38 : 32;
  const fontSize = size > 48 ? 15 : size > 36 ? 13 : 12;
  return L.divIcon({
    className: "",
    html: `<div style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:#2563EB;color:white;display:flex;align-items:center;
        justify-content:center;font-weight:700;font-size:${fontSize}px;
        border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);
        cursor:pointer;
      ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Bridges imperative map controls (zoom/recenter) out to the toolbar buttons
function MapControlsBridge({
  onReady,
}: {
  onReady: (api: {
    zoomIn: () => void;
    zoomOut: () => void;
    recenter: () => void;
    flyToState: (c: StateCluster) => void;
  }) => void;
}) {
  const map = useMap();
  const ranRef = useRef(false);
  if (!ranRef.current) {
    ranRef.current = true;
    onReady({
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      recenter: () => map.flyTo(INDIA_CENTER, INDIA_DEFAULT_ZOOM, { duration: 0.6 }),
      flyToState: (c) => map.flyTo(c.coords, c.zoom, { duration: 0.7 }),
    });
  }
  return null;
}

// Watches zoom level so we can auto-collapse back to the India cluster view
function ZoomWatcher({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom()),
  });
  return null;
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "institutions", label: "Institutions", icon: Building2 },
  { key: "surveys", label: "Surveys", icon: ClipboardList },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
  { key: "inspections", label: "Inspections", icon: SearchIcon },
  { key: "drone", label: "Drone Mapping", icon: DroneIcon },
  { key: "reports", label: "Reports", icon: FileBarChart2 },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "users", label: "Users & Roles", icon: Users },
  { key: "audit", label: "Audit Trail", icon: History },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "help", label: "Help & Support", icon: HelpCircle },
];

function Sidebar({
  active,
  onSelect,
  collapsed,
  onToggleCollapse,
}: {
  active: string;
  onSelect: (key: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <aside
      className={`h-full bg-[#0B1F4D] text-white flex flex-col shrink-0 transition-all duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <ShieldCheck size={20} />
        </div>
        {!collapsed && (
          <div className="leading-tight overflow-hidden">
            <p className="font-bold text-sm tracking-wide truncate">PCI GIS ECOSYSTEM</p>
            <p className="text-[11px] text-blue-200 truncate">Pharmacy Council of India</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white font-semibold shadow"
                  : "text-blue-100 hover:bg-white/10"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onToggleCollapse}
        className="flex items-center gap-2 px-4 py-3 text-blue-200 hover:text-white text-xs border-t border-white/10"
      >
        <ChevronLeft
          size={16}
          className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
        />
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Top navbar
// ---------------------------------------------------------------------------

function TopBar({
  selectedState,
  setSelectedState,
  selectedDistrict,
  setSelectedDistrict,
  selectedType,
  setSelectedType,
  selectedAffiliation,
  setSelectedAffiliation,
  search,
  setSearch,
}: {
  selectedState: string;
  setSelectedState: (v: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (v: string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedAffiliation: string;
  setSelectedAffiliation: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
}) {
  const states = STATE_CLUSTERS.map((c) => c.name);

  const Dropdown = ({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: string;
    options: string[];
    onChange: (v: string) => void;
  }) => (
    <div className="min-w-[150px]">
      <label className="block text-[11px] text-gray-400 leading-none mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-transparent text-sm font-semibold text-gray-800 pr-5 focus:outline-none cursor-pointer"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-0 top-1 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center gap-3 px-6 py-3 flex-wrap">
        <div className="border border-gray-200 rounded-lg px-3 py-1.5">
          <Dropdown label="State" value={selectedState} options={states} onChange={setSelectedState} />
        </div>
        <ArrowRight size={16} className="text-gray-300 shrink-0" />
        <div className="border border-gray-200 rounded-lg px-3 py-1.5">
          <Dropdown label="District" value={selectedDistrict} options={DISTRICTS} onChange={setSelectedDistrict} />
        </div>
        <ArrowRight size={16} className="text-gray-300 shrink-0" />
        <div className="border border-gray-200 rounded-lg px-3 py-1.5">
          <Dropdown label="Institution Type" value={selectedType} options={INSTITUTION_TYPES} onChange={setSelectedType} />
        </div>
        <ArrowRight size={16} className="text-gray-300 shrink-0" />
        <div className="border border-gray-200 rounded-lg px-3 py-1.5">
          <Dropdown
            label="Affiliation Status"
            value={selectedAffiliation}
            options={AFFILIATION_STATUS}
            onChange={setSelectedAffiliation}
          />
        </div>

        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Institution / Code / Location"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pl-2 shrink-0">
          <button className="relative w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
            <Bell size={17} className="text-gray-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              5
            </span>
          </button>
          <button className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
              SO
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">State Officer</p>
              <p className="text-[11px] text-gray-400">Uttar Pradesh</p>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  tone: { text: string; bg: string };
  trend?: "up" | "down";
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-1 min-w-[170px]">
      <div className="flex items-start justify-between">
        <p className={`text-sm font-semibold ${tone.text}`}>{label}</p>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tone.bg}`}>
          <Icon size={18} className={tone.text} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-800 mt-2">{value}</p>
      {sub && (
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          {sub}
          {trend === "up" && <ArrowUpRight size={12} className="text-green-500" />}
          {trend === "down" && <ArrowDownRight size={12} className="text-red-500" />}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Map legend (collapsible)
// ---------------------------------------------------------------------------

function MapLegend({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="absolute top-4 left-4 z-[500] bg-white rounded-xl shadow-lg border border-gray-200 w-56 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 border-b border-gray-100"
      >
        <span className="text-sm font-bold text-gray-800">Legend</span>
        <ChevronLeft size={16} className={`text-gray-400 transition-transform ${collapsed ? "rotate-180" : "-rotate-90"}`} />
      </button>
      {!collapsed && (
        <div className="px-4 py-3 space-y-2.5">
          {(Object.keys(STATUS_META) as PinStatus[]).map((key) => {
            const meta = STATUS_META[key];
            return (
              <div key={key} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow"
                  style={{ backgroundColor: meta.color }}
                />
                <div className="leading-tight">
                  <p className="font-semibold text-gray-700">{meta.label}</p>
                  <p className="text-gray-400">
                    {formatIN(meta.count)} ({meta.pct})
                  </p>
                </div>
              </div>
            );
          })}

          <div className="pt-2 mt-2 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">Cluster (Institutions)</p>
            <div className="space-y-1.5">
              {[
                { r: 6, label: "1 – 50" },
                { r: 8, label: "51 – 200" },
                { r: 10, label: "201 – 500" },
                { r: 12, label: "500+" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-xs text-gray-500">
                  <span
                    className="rounded-full bg-blue-600/70 shrink-0"
                    style={{ width: c.r * 2, height: c.r * 2 }}
                  />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Map panel
// ---------------------------------------------------------------------------

function GISMapPanel({ fullscreenPage = false }: { fullscreenPage?: boolean }) {
  const [satellite, setSatellite] = useState(false);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [activeStateId, setActiveStateId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(INDIA_DEFAULT_ZOOM);
  const [statesGeoJson, setStatesGeoJson] = useState<any>(null);
  const controlsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    recenter: () => void;
    flyToState: (c: StateCluster) => void;
  } | null>(null);

  const tileUrl = satellite
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  // Fetch India state/UT boundaries once
  useEffect(() => {
    const controller = new AbortController();
    fetch(INDIA_STATES_GEOJSON_URL, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setStatesGeoJson(data))
      .catch(() => {
        // Silently ignore — map still functions without boundary overlay
      });
    return () => controller.abort();
  }, []);

  const clusterIcons = useMemo(
    () => Object.fromEntries(STATE_CLUSTERS.map((c) => [c.id, clusterDivIcon(c.count)])),
    []
  );
  const pinIcons = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(STATUS_META) as PinStatus[]).map((s) => [s, pinDivIcon(STATUS_META[s].color)])
      ),
    []
  );

  // Show clusters when zoomed out to (roughly) the India view; show
  // individual institute pins once drilled into a state.
  const showClusters = !activeStateId && zoom <= STATE_DRILLDOWN_ZOOM_THRESHOLD + 0.8;
  const activeState = STATE_CLUSTERS.find((c) => c.id === activeStateId) || null;
  const visiblePins = activeStateId
    ? SCATTER_PINS.filter((p) => p.stateId === activeStateId)
    : [];

  const handleClusterClick = (cluster: StateCluster) => {
    setActiveStateId(cluster.id);
    controlsRef.current?.flyToState(cluster);
  };

  const handleBackToIndia = () => {
    setActiveStateId(null);
    controlsRef.current?.recenter();
  };

  const geoJsonStyle = () => ({
    color: "#64748B",
    weight: 1.1,
    fillColor: "#93C5FD",
    fillOpacity: 0.04,
    opacity: 0.7,
  });

  const handleFullscreen = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("mapFullscreen", "1");
    const win = window.open(url.toString(), "_blank", "noopener,noreferrer");
    // Best-effort: ask the new tab to go native fullscreen once it loads.
    // Browsers may block this without a direct user gesture in that tab,
    // in which case the tab still opens maximized edge-to-edge.
    if (win) {
      win.addEventListener?.("load", () => {
        win.document?.documentElement?.requestFullscreen?.().catch(() => {});
      });
    }
  };

  return (
    <div
      className={`relative overflow-hidden border border-gray-200 shadow-sm ${
        fullscreenPage ? "w-screen h-screen rounded-none" : "flex-1 rounded-xl min-h-[420px]"
      }`}
    >
      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_DEFAULT_ZOOM}
        minZoom={INDIA_MIN_ZOOM}
        maxZoom={INDIA_MAX_ZOOM}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom
        zoomControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <MapControlsBridge onReady={(api) => (controlsRef.current = api)} />
        <ZoomWatcher
          onZoomChange={(z) => {
            setZoom(z);
            if (z <= STATE_DRILLDOWN_ZOOM_THRESHOLD) setActiveStateId(null);
          }}
        />
        <TileLayer url={tileUrl} attribution="&copy; OpenStreetMap contributors" />

        {statesGeoJson && (
          <GeoJSON data={statesGeoJson} style={geoJsonStyle} interactive={false} />
        )}

        {showClusters &&
          STATE_CLUSTERS.map((c) => (
            <Marker
              key={c.id}
              position={c.coords}
              icon={clusterIcons[c.id]}
              eventHandlers={{ click: () => handleClusterClick(c) }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-gray-500">{c.count} institutions</p>
                  <p className="text-blue-600 text-xs mt-1">Click marker to zoom in</p>
                </div>
              </Popup>
            </Marker>
          ))}

        {visiblePins.map((p) => (
          <Marker key={p.id} position={p.coords} icon={pinIcons[p.status]}>
            <Popup>
              <div className="text-sm space-y-1">
                <p className="font-bold text-gray-800">{p.name}</p>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: STATUS_META[p.status].color }}
                >
                  {STATUS_META[p.status].label}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <MapLegend collapsed={legendCollapsed} onToggle={() => setLegendCollapsed((v) => !v)} />

      {/* Active state banner + back button */}
      {activeState && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white rounded-lg shadow-lg border border-gray-200 flex items-center gap-3 px-4 py-2">
          <button
            onClick={handleBackToIndia}
            className="flex items-center gap-1 text-blue-600 text-sm font-semibold hover:text-blue-700"
          >
            <ArrowLeft size={15} /> All India
          </button>
          <span className="w-px h-4 bg-gray-200" />
          <span className="text-sm font-semibold text-gray-700">{activeState.name}</span>
          <span className="text-xs text-gray-400">{activeState.count} institutions</span>
        </div>
      )}

      {/* Map / Satellite toggle */}
      <div className="absolute top-4 right-4 z-[500] bg-white rounded-lg shadow-lg border border-gray-200 flex overflow-hidden text-sm font-semibold">
        <button
          onClick={() => setSatellite(false)}
          className={`px-4 py-2 ${!satellite ? "bg-blue-600 text-white" : "text-gray-600"}`}
        >
          Map
        </button>
        <button
          onClick={() => setSatellite(true)}
          className={`px-4 py-2 ${satellite ? "bg-blue-600 text-white" : "text-gray-600"}`}
        >
          Satellite
        </button>
      </div>

      {!fullscreenPage && (
        <button
          onClick={handleFullscreen}
          title="Open fullscreen in a new tab"
          className="absolute top-4 right-[168px] z-[500] w-9 h-9 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <Maximize2 size={16} />
        </button>
      )}

      {fullscreenPage && (
        <button
          onClick={() => window.close()}
          title="Close"
          className="absolute top-4 right-[168px] z-[500] w-9 h-9 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
        >
          <X size={16} />
        </button>
      )}

      {/* Zoom / recenter controls */}
      <div className="absolute bottom-16 right-4 z-[500] flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => controlsRef.current?.recenter()}
          title="Reset to India view"
          className="w-10 h-10 flex items-center justify-center text-gray-600 border-b border-gray-100"
        >
          <LocateFixed size={16} />
        </button>
        <button
          onClick={() => controlsRef.current?.zoomIn()}
          className="w-10 h-10 flex items-center justify-center text-gray-600 border-b border-gray-100"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => controlsRef.current?.zoomOut()}
          className="w-10 h-10 flex items-center justify-center text-gray-600"
        >
          <Minus size={16} />
        </button>
      </div>

      {/* Bottom status strip */}
      <div className="absolute bottom-0 left-0 right-0 z-[500] bg-white/95 backdrop-blur border-t border-gray-200 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-8 flex-wrap text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw size={15} className="text-blue-600" />
            <div className="leading-tight">
              <p className="text-[11px] text-gray-400">Last Data Sync</p>
              <p className="font-semibold text-gray-700">25 May 2025, 10:30 AM</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <ClipboardCheck size={15} className="text-blue-600" />
            <div className="leading-tight">
              <p className="text-[11px] text-gray-400">Total Surveys</p>
              <p className="font-semibold text-gray-700">5,834</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <GraduationCap size={15} className="text-blue-600" />
            <div className="leading-tight">
              <p className="text-[11px] text-gray-400">Inspections Completed</p>
              <p className="font-semibold text-gray-700">4,972</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Plane size={15} className="text-blue-600" />
            <div className="leading-tight">
              <p className="text-[11px] text-gray-400">Drone Missions</p>
              <p className="font-semibold text-gray-700">318</p>
            </div>
          </div>
        </div>
        {!fullscreenPage && (
          <button className="flex items-center gap-1.5 border border-blue-600 text-blue-600 font-semibold text-sm rounded-lg px-4 py-2 hover:bg-blue-50">
            View All Reports <ArrowRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root dashboard
// ---------------------------------------------------------------------------

export default function PCIGISDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const [selectedState, setSelectedState] = useState("Uttar Pradesh");
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS[0]);
  const [selectedType, setSelectedType] = useState(INSTITUTION_TYPES[0]);
  const [selectedAffiliation, setSelectedAffiliation] = useState(AFFILIATION_STATUS[0]);
  const [search, setSearch] = useState("");

  const totalInstitutions = 6172; // Grand Total from state-wise dataset

  // Standalone fullscreen tab: when the URL carries ?mapFullscreen=1 we
  // render *only* the map, edge-to-edge, with no sidebar/topbar/stat cards —
  // this is what handleFullscreen() opens in the new tab.
  const isFullscreenRoute =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("mapFullscreen") === "1";

  if (isFullscreenRoute) {
    return (
      <div className="w-screen h-screen bg-gray-900">
        <GISMapPanel fullscreenPage />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-gray-50 text-gray-800 overflow-hidden">
      <Sidebar
        active={activeNav}
        onSelect={setActiveNav}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          selectedState={selectedState}
          setSelectedState={setSelectedState}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedAffiliation={selectedAffiliation}
          setSelectedAffiliation={setSelectedAffiliation}
          search={search}
          setSearch={setSearch}
        />

        <main className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Stat cards row */}
          <div className="flex flex-wrap gap-4">
            <StatCard
              label="Total Institutions"
              value={formatIN(totalInstitutions)}
              sub="100% of Total"
              icon={Building2}
              tone={{ text: "text-gray-700", bg: "bg-gray-100" }}
            />
            <StatCard
              label="Compliant"
              value={formatIN(STATUS_META.compliant.count)}
              sub={STATUS_META.compliant.pct}
              trend="up"
              icon={ShieldCheck}
              tone={{ text: "text-green-600", bg: "bg-green-50" }}
            />
            <StatCard
              label="Non-Compliant"
              value={formatIN(STATUS_META.noncompliant.count)}
              sub={STATUS_META.noncompliant.pct}
              trend="up"
              icon={ShieldCheck}
              tone={{ text: "text-red-600", bg: "bg-red-50" }}
            />
            <StatCard
              label="Under Inspection"
              value={formatIN(STATUS_META.inspection.count)}
              sub={STATUS_META.inspection.pct}
              icon={SearchIcon}
              tone={{ text: "text-amber-600", bg: "bg-amber-50" }}
            />
            <StatCard
              label="Not Surveyed"
              value={formatIN(STATUS_META.notsurveyed.count)}
              sub={STATUS_META.notsurveyed.pct}
              icon={ClipboardList}
              tone={{ text: "text-blue-600", bg: "bg-blue-50" }}
            />
          </div>

          {/* Map */}
          <GISMapPanel />

          {/* Optional secondary row: recent alerts, kept subtle so map stays the hero */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">Recent Alerts</h3>
              <button className="text-xs font-semibold text-blue-600">View all</button>
            </div>
            <div className="space-y-2">
              {RECENT_ALERTS.map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        a.tone === "red" ? "bg-red-500" : a.tone === "amber" ? "bg-amber-500" : "bg-blue-500"
                      }`}
                    />
                    <span className="text-gray-700">{a.text}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-3">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}