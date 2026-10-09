import React, { useState } from 'react';
import { 
  User, Building2, Sliders, Info, HelpCircle, X, Shield, 
  CheckCircle2, Activity, Heart, FileText, Database, Sparkles, AlertTriangle 
} from 'lucide-react';
import { OrgProfile, AppSettings } from '../types/cardio';

interface MenuModalsProps {
  activeModal: 'profile' | 'org_name' | 'settings' | 'about_us' | 'help' | null;
  onClose: () => void;
  orgProfile: OrgProfile | null;
  settings: AppSettings | null;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onLogout: () => void;
}

export const MenuModals: React.FC<MenuModalsProps> = ({
  activeModal,
  onClose,
  orgProfile,
  settings,
  onUpdateSettings,
  onLogout,
}) => {
  const [greenThresh, setGreenThresh] = useState(settings?.green_threshold ?? 0.40);
  const [yellowThresh, setYellowThresh] = useState(settings?.yellow_threshold ?? 0.65);
  const [hospitalName, setHospitalName] = useState(settings?.hospital_name ?? 'Cardiovascular Specialty Institute');
  const [leadCardio, setLeadCardio] = useState(settings?.lead_cardiologist ?? 'Dr. Zahra Sani, MD, FESC');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  if (!activeModal) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess(false);
    try {
      await onUpdateSettings({
        green_threshold: Number(greenThresh),
        yellow_threshold: Number(yellowThresh),
        hospital_name: hospitalName,
        lead_cardiologist: leadCardio,
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2500);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-teal-100 rounded-3xl shadow-2xl text-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Subtle, low-opacity coronary X-ray watermark behind modal text */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.04] pointer-events-none mix-blend-multiply"
          style={{ backgroundImage: `url('/images/heart_coronary_xray.jpg')` }}
          aria-hidden="true"
        />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-teal-100 bg-teal-50/70">
          <div className="flex items-center gap-3">
            {activeModal === 'profile' && (
              <div className="p-2 rounded-xl bg-teal-100 text-teal-800 border border-teal-200">
                <User className="w-5 h-5" />
              </div>
            )}
            {activeModal === 'org_name' && (
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Building2 className="w-5 h-5" />
              </div>
            )}
            {activeModal === 'settings' && (
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                <Sliders className="w-5 h-5" />
              </div>
            )}
            {activeModal === 'about_us' && (
              <div className="p-2 rounded-xl bg-cyan-100 text-cyan-800 border border-cyan-200">
                <Info className="w-5 h-5" />
              </div>
            )}
            {activeModal === 'help' && (
              <div className="p-2 rounded-xl bg-teal-100 text-teal-900 border border-teal-200">
                <HelpCircle className="w-5 h-5" />
              </div>
            )}

            <div>
              <h2 className="text-lg font-extrabold text-slate-900 capitalize">
                {activeModal === 'profile' && '1. Profile'}
                {activeModal === 'org_name' && '2. Organisation Name'}
                {activeModal === 'settings' && '3. Settings'}
                {activeModal === 'about_us' && '4. About Us'}
                {activeModal === 'help' && '5. Help & User Guide'}
              </h2>
              <span className="text-xs text-slate-500 font-medium">Cardiovascular Risk Visualization &amp; Prediction</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
          
          {/* 1. PROFILE */}
          {activeModal === 'profile' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-600 flex items-center justify-center font-extrabold text-white text-lg shadow-sm">
                    {orgProfile?.org_id?.slice(0, 2) || 'OR'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{orgProfile?.org_name || 'Hospital Organisation'}</h3>
                    <p className="text-xs text-slate-500 font-mono">ID: {orgProfile?.org_id || 'ORG-101'}</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Session
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold mb-1">Department</span>
                  <p className="text-slate-900 font-semibold">{orgProfile?.department || 'Department of Cardiology & Coronary Hemodynamics'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold mb-1">Administrative Contact</span>
                  <p className="text-slate-900 font-semibold">{orgProfile?.contact_email || 'cardio-admin@hospital.org'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold mb-1">Clinical Access Tier</span>
                  <p className="text-slate-900 font-semibold">Enterprise Decision Support (ML + 3D Heart Viewer)</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 uppercase tracking-wider block font-bold mb-1">Authentication Standard</span>
                  <p className="text-slate-900 font-semibold">Role-Based Organisation ID Session</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Log Out of Session
                </button>
              </div>
            </div>
          )}

          {/* 2. ORGANISATION NAME */}
          {activeModal === 'org_name' && (
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200">
                <span className="text-xs text-teal-800 uppercase tracking-wider font-extrabold block mb-1">
                  Authenticated Organisation
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {orgProfile?.org_name || 'Heart Health & Vascular Specialty Institute'}
                </h3>
                <p className="text-xs text-slate-600 mt-2">
                  Institutional ID: <span className="font-mono font-bold text-teal-900">{orgProfile?.org_id}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Organisation Scope &amp; Authorization</h4>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li>Authorized to submit 21-parameter clinical patient records.</li>
                  <li>Access to 4 validated ML model families (XGBoost, CatBoost, LightGBM, Neural Network).</li>
                  <li>Real-time LIME feature attribution and explainability.</li>
                  <li>Interactive 3D coronary artery visualization and structured clinical PDF/final report export.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 3. SETTINGS */}
          {activeModal === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700" />
                <p>
                  Thresholds customize the color legend on the 3D heart model and clinical dashboard. They are educational/decision-support parameters and do not represent medically validated diagnostic categories.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Configurable 3D Heart Probability Thresholds
                  </h4>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-700 font-bold">Green (Lower Risk Threshold): &le; {(greenThresh * 100).toFixed(0)}%</span>
                      <span className="text-slate-500 font-mono">{(greenThresh * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.50"
                      step="0.05"
                      value={greenThresh}
                      onChange={(e) => setGreenThresh(parseFloat(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-amber-800 font-bold">Yellow (Intermediate Risk Threshold): {(greenThresh * 100).toFixed(0)}% &ndash; {(yellowThresh * 100).toFixed(0)}%</span>
                      <span className="text-slate-500 font-mono">{(yellowThresh * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.50"
                      max="0.85"
                      step="0.05"
                      value={yellowThresh}
                      onChange={(e) => setYellowThresh(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="text-xs text-rose-700 font-bold pt-1">
                    Red (Higher Risk Threshold): &gt; {(yellowThresh * 100).toFixed(0)}% predicted probability
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Hospital Name on Reports</label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Attending Cardiologist Header</label>
                    <input
                      type="text"
                      value={leadCardio}
                      onChange={(e) => setLeadCardio(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {settingsSuccess && (
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Settings saved and applied to 3D Heart model and Report generators.</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          )}

          {/* 4. ABOUT US */}
          {activeModal === 'about_us' && (
            <div className="space-y-4 leading-relaxed">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-teal-600" />
                  Purpose of the Application
                </h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  This system is built specifically for <strong>Track A: Cardiovascular Risk Visualization &amp; Prediction</strong>.
                  Coronary Artery Disease (CAD) remains the leading cause of morbidity and mortality worldwide. Invasive coronary angiography (Cath) is the diagnostic reference standard, yet non-invasive risk assessment tools that provide vessel-specific anatomical localization and interpretability are critical for early intervention and clinical triage.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-1">Z-Alizadeh Sani Benchmark</strong>
                  <p className="text-slate-600">
                    Trained on verified clinical records from the Shaheed Rajaei Cardiovascular Medical and Research Center (UCI Machine Learning Repository / Mendeley Data), incorporating demographics, symptoms, ECG findings, echocardiography, and laboratory blood biomarkers.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-1">Four Distinct Prediction Tasks</strong>
                  <p className="text-slate-600">
                    Unlike standard black-box CAD classifiers, our pipeline predicts overall CAD status as well as specific stenosis risk in the <strong>LAD</strong>, <strong>LCX</strong>, and <strong>RCA</strong> coronary arteries.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-1">Strict Leakage Prevention</strong>
                  <p className="text-slate-600">
                    Invasive angiographic outcomes and vessel targets are isolated from training features. Preprocessing scalers are fitted solely within training folds of 5-fold cross validation.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-slate-900 block mb-1">3D Anatomical Heart Viewer</strong>
                  <p className="text-slate-600">
                    Rendered with real-time Three.js shaders, allowing clinicians to inspect coronary arteries, rotate, zoom, and correlate predicted probabilities with anatomical trajectories and LIME explanations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. HELP */}
          {activeModal === 'help' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <p className="text-slate-700">
                Detailed step-by-step instructions for operating every stage of the cardiovascular prediction workflow:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-teal-800 block mb-1 font-bold">1. Logging in / Signing Up</strong>
                  <p className="text-slate-600">
                    Enter your Organisation ID (e.g. <code>ORG-101</code>) and Password. Click <strong>Sign Up</strong> if registering a new institution, or <strong>Login</strong> to authenticate. After successful authentication, you will be taken to the Main Dashboard.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-teal-800 block mb-1 font-bold">2. Entering Patient Details</strong>
                  <p className="text-slate-600">
                    From the dashboard center, click the <strong>Patient Details</strong> card. Fill in the 21 structured clinical fields across demographics, clinical symptoms, risk factors, ECG findings, and optional imaging. You can also click "Sample" to load realistic clinical profiles.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-teal-800 block mb-1 font-bold">3. Submitting Clinical Data &amp; Running Predictions</strong>
                  <p className="text-slate-600">
                    Click the <strong>Predict Cardiovascular Risk</strong> button at the bottom of the form. The system securely evaluates the validated models (CatBoost, LightGBM, XGBoost, MLP Neural Network), and runs the LIME explainability engine.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-teal-800 block mb-1 font-bold">4. Interacting with the 3D Heart</strong>
                  <p className="text-slate-600">
                    Rotate the heart by dragging with your mouse or finger, zoom using scroll/pinch, and toggle anatomical labels or exploded/transparency mode. Click directly on any coronary artery (<strong>LAD</strong>, <strong>LCX</strong>, <strong>RCA</strong>) to inspect its predicted probability, best model family, and specific LIME explanations.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-teal-800 block mb-1 font-bold">5. Understanding Prediction Results &amp; Color Legend</strong>
                  <p className="text-slate-600">
                    Green indicates lower predicted probability (&lt;40%), Yellow indicates intermediate risk (40-65%), and Red indicates higher predicted probability (&gt;65%). Grey indicates prediction unavailable. These thresholds can be adjusted in Settings.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-teal-800 block mb-1 font-bold">6. Reading LIME Explanations</strong>
                  <p className="text-slate-600">
                    The Local Interpretable Model-agnostic Explanations (LIME) breakdown displays features driving the prediction. <strong>Red bars</strong> signify features driving risk upwards (e.g. ST Elevation, High TG), while <strong>Green bars</strong> signify protective or normal values.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <strong className="text-teal-800 block mb-1 font-bold">7. Generating the Final Report</strong>
                  <p className="text-slate-600">
                    Click <strong>Generate Final Report</strong> to view and export the complete 12-section medical documentation, combining patient demographics, ML predictions, LIME breakdowns, reported clinical findings, model validation statistics, and the safety disclaimer.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="relative z-10 px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>CardioRisk AI &bull; Clinical Decision Support</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
