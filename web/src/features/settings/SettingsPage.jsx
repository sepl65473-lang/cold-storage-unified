import { useState } from "react";
import { PageHead } from "../../shared/components/PageHead.jsx";
import { SectionCard } from "../../shared/components/SectionCard.jsx";
import { Button } from "../../shared/components/Button.jsx";
import { AlertRulesTab } from "./AlertRulesTab.jsx";
import { cn } from "../../shared/utils/cn.js";
import { MONO } from "../../shared/utils/tokens.js";
import { IS_MOCK } from "../../shared/services/api.js";
import { ENV, saveEnvOverrides, clearEnvOverrides } from "../../config/env.js";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const GENERAL_KEY = "sepl_settings_general";
const THRESH_KEY  = "sepl_settings_thresholds";

const GENERAL_DEFAULTS = [
  ["Facility name",     "SEPL Cold Storage Admin"],
  ["Timezone",          "Asia/Kolkata (IST)"],
  ["Temperature unit",  "Celsius (C)"],
  ["Telemetry interval","15 seconds"],
  ["Data retention",    "24 months"],
];

const THRESH_DEFAULTS = [
  ["Frozen zone high",  "-18", "C"],
  ["Chilled zone high", "5",   "C"],
  ["Humidity band",     "75-92","%RH"],
  ["Door open max",     "6",   "min"],
  ["Battery low",       "20",  "%"],
];

function loadGeneral() {
  try { return JSON.parse(localStorage.getItem(GENERAL_KEY)) || {}; } catch { return {}; }
}
function loadThresholds() {
  try { return JSON.parse(localStorage.getItem(THRESH_KEY)) || {}; } catch { return {}; }
}

export function SettingsPage() {
  const [tab, setTab]         = useState("general");
  const [saved, setSaved]     = useState(false);
  const [formKey, setFormKey] = useState(0);
  const tabs = [["general", "General"], ["alerts", "Alert Rules"], ["thresholds", "Thresholds"], ["integrations", "Integrations"], ["security", "Security"]];

  // General tab state
  const [general, setGeneral] = useState(() => loadGeneral());
  const onGeneralChange = (label, value) => setGeneral((g) => ({ ...g, [label]: value }));
  const onGeneralSave = () => {
    localStorage.setItem(GENERAL_KEY, JSON.stringify(general));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };
  const onGeneralCancel = () => { setGeneral(loadGeneral()); setFormKey((k) => k + 1); setSaved(false); };

  // Thresholds tab state
  const [thresholds, setThresholds] = useState(() => loadThresholds());
  const [thSaved, setThSaved] = useState(false);
  const onThreshChange = (label, value) => setThresholds((t) => ({ ...t, [label]: value }));
  const onThreshSave = () => {
    localStorage.setItem(THRESH_KEY, JSON.stringify(thresholds));
    setThSaved(true); setTimeout(() => setThSaved(false), 2500);
  };
  const onThreshReset = () => { localStorage.removeItem(THRESH_KEY); setThresholds({}); setFormKey((k) => k + 1); };

  // Integrations tab state
  const [apiUrl,     setApiUrl]     = useState(ENV.API_BASE_URL);
  const [wsUrl,      setWsUrl]      = useState(ENV.WS_URL);
  const [intSaved,   setIntSaved]   = useState(false);
  const [needReload, setNeedReload] = useState(false);

  const saveIntegrations = () => {
    saveEnvOverrides({ API_BASE_URL: apiUrl.trim(), WS_URL: wsUrl.trim() });
    setIntSaved(true); setNeedReload(true);
    setTimeout(() => setIntSaved(false), 3000);
  };
  const resetIntegrations = () => {
    clearEnvOverrides();
    setApiUrl(import.meta.env.VITE_API_BASE_URL || "/api");
    setWsUrl(import.meta.env.VITE_WS_URL || "");
    setNeedReload(true);
  };

  return (
    <div className="space-y-4">
      <PageHead title="Settings" sub="Facility & platform configuration" />
      {IS_MOCK && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Running in <b>MOCK</b> mode (VITE_USE_MOCK=true). Set it to false and point VITE_API_BASE_URL / VITE_WS_URL to your backend to go live.
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Settings saved.
        </div>
      )}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full shrink-0 md:w-48">
          <div className="rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={cn("block w-full rounded-md px-3 py-2 text-left text-sm", tab === id ? "bg-blue-50 font-medium text-blue-700" : "text-slate-600 hover:bg-slate-50")}>{label}</button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <SectionCard title={tabs.find((t) => t[0] === tab)[1]}>
            {tab === "alerts" ? (
              <AlertRulesTab />

            ) : tab === "thresholds" ? (
              <div className="space-y-3" key={formKey}>
                {thSaved && (
                  <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Thresholds saved.
                  </div>
                )}
                {THRESH_DEFAULTS.map(([l, def, u]) => (
                  <div key={l} className="flex items-center justify-between border-b border-slate-50 py-2">
                    <span className="text-sm text-slate-600">{l}</span>
                    <div className="flex items-center gap-2">
                      <input
                        value={thresholds[l] !== undefined ? thresholds[l] : def}
                        onChange={(e) => onThreshChange(l, e.target.value)}
                        className="w-24 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-right text-sm"
                        style={{ fontFamily: MONO }}
                      />
                      <span className="w-12 text-xs text-slate-400">{u}</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-2">
                  <Button variant="primary" onClick={onThreshSave}>Save thresholds</Button>
                  <Button onClick={onThreshReset}>Reset to defaults</Button>
                </div>
              </div>

            ) : tab === "integrations" ? (
              <div className="space-y-4 text-sm">
                {intSaved && (
                  <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> Connection settings saved.
                  </div>
                )}
                {needReload && (
                  <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Reload the page for URL changes to take effect.</span>
                    <button onClick={() => window.location.reload()} className="font-semibold underline hover:no-underline">Reload now</button>
                  </div>
                )}
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">API Base URL</span>
                  <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    style={{ fontFamily: MONO }} placeholder="https://api.sepl.in" />
                  <p className="mt-0.5 text-[11px] text-slate-400">All REST API calls go to this base URL.</p>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">WebSocket URL</span>
                  <input value={wsUrl} onChange={(e) => setWsUrl(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    style={{ fontFamily: MONO }} placeholder="wss://ws.sepl.in" />
                  <p className="mt-0.5 text-[11px] text-slate-400">Real-time telemetry WebSocket endpoint.</p>
                </label>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Mode:</span>
                    <span className={cn("rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", IS_MOCK ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")} style={{ fontFamily: MONO }}>
                      {IS_MOCK ? "MOCK" : "LIVE"}
                    </span>
                    <span className="text-[11px] text-slate-400">(set via VITE_USE_MOCK — requires rebuild to change)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button variant="primary" onClick={saveIntegrations}>Save connection settings</Button>
                  <Button onClick={resetIntegrations}>Reset to defaults</Button>
                </div>
              </div>

            ) : tab === "security" ? (
              <div className="space-y-4 text-sm text-slate-600">
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed">
                  <p className="font-semibold text-slate-700">Session & Token</p>
                  <ul className="mt-2 space-y-1 text-slate-500">
                    <li>• JWT stored in localStorage — cleared on logout or 401 response</li>
                    <li>• Permissions enforced client-side; backend must validate all requests</li>
                    <li>• Password reset via email OTP (contact your backend provider)</li>
                  </ul>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed">
                  <p className="font-semibold text-slate-700">Access Control</p>
                  <ul className="mt-2 space-y-1 text-slate-500">
                    <li>• Role-based permissions: Owner, Facility Manager, Operator, Dispatch, Warehouse Manager</li>
                    <li>• All routes gated by RequirePerm — unauthorized users see access-denied screen</li>
                    <li>• Backend RBAC should mirror frontend permission names</li>
                  </ul>
                </div>
                <p className="text-[11px] text-slate-400">To change passwords or manage 2FA, use your backend admin panel.</p>
              </div>

            ) : (
              // General tab
              <div className="space-y-4" key={formKey}>
                {GENERAL_DEFAULTS.map(([l, def]) => (
                  <label key={l} className="block">
                    <span className="text-xs font-medium text-slate-600">{l}</span>
                    <input
                      value={general[l] !== undefined ? general[l] : def}
                      onChange={(e) => onGeneralChange(l, e.target.value)}
                      className="mt-1 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ))}
                <div className="flex items-center gap-3 pt-1">
                  <Button variant="primary" onClick={onGeneralSave}>Save changes</Button>
                  <Button onClick={onGeneralCancel}>Cancel</Button>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
