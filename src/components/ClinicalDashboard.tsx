import React, { useState, useEffect } from 'react';
import { 
  Activity, Heart, AlertTriangle, FileText, CheckCircle2, 
  ArrowLeft, RotateCcw, ChevronRight, Layers, Sliders, 
  TrendingUp, TrendingDown, Stethoscope, ShieldCheck, Printer, BarChart3 
} from 'lucide-react';
import { 
  PredictionResponse, PatientFormData, ModelEvaluationsResponse, 
  LimeFeatureItem, AppSettings 
} from '../types/cardio';
import { ThreeHeartViewer } from './ThreeHeartViewer';

interface ClinicalDashboardProps {
  predictionData: PredictionResponse;
  patientFormData: PatientFormData;
  settings: AppSettings | null;
  onBackToForm: () => void;
  onOpenReport: () => void;
}

export const ClinicalDashboard: React.FC<ClinicalDashboardProps> = ({
  predictionData,
  patientFormData,
  settings,
  onBackToForm,
  onOpenReport,
}) => {
  const [modelEval, setModelEval] = useState<ModelEvaluationsResponse | null>(null);
  const [selectedTaskTab, setSelectedTaskTab] = useState<'CAD' | 'LAD' | 'LCX' | 'RCA'>('CAD');
  const [selectedVesselIn3D, setSelectedVesselIn3D] = useState<'LAD' | 'LCX' | 'RCA' | null>('LAD');

  // Load actual evaluation metrics from backend
  useEffect(() => {
    async function fetchEvaluations() {
      try {
        const res = await fetch('/api/models/evaluation');
        if (res.ok) {
          const data = await res.json();
          setModelEval(data);
        }
      } catch (err) {
        console.error('Failed to fetch model evaluations:', err);
      }
    }
    fetchEvaluations();
  }, []);

  const cadPred = predictionData.predictions.CAD;
  const ladPred = predictionData.predictions.LAD;
  const lcxPred = predictionData.predictions.LCX;
  const rcaPred = predictionData.predictions.RCA;

  const greenThresh = settings?.green_threshold ?? 0.40;
  const yellowThresh = settings?.yellow_threshold ?? 0.65;

  const activeLimeFeatures: LimeFeatureItem[] = predictionData.lime_explanations[selectedTaskTab] || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Subtle, low-opacity abstract heart and coronary X-ray background behind the words */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-[0.05] pointer-events-none mix-blend-multiply z-0"
        style={{ backgroundImage: `url('/images/heart_xray_angiogram.jpg')` }}
        aria-hidden="true"
      />

      {/* Top Action Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToForm}
            className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Return to Patient Form"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-teal-700">
                Clinical Decision Support
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                Verified
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Patient {predictionData.patient_id} Analysis
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={onOpenReport}
            className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold tracking-wide flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Final Report</span>
          </button>
        </div>
      </div>

      {/* 1. OVERALL CAD PREDICTION & VESSEL-SPECIFIC RESULTS */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* OVERALL CAD PREDICTION CARD */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Overall CAD Status
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {cadPred.model_family}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-2 leading-tight">
              {cadPred.predicted_class}
            </h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {cadPred.confidence_percent}%
              </span>
              <span className="text-xs text-slate-500">predicted risk</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Decision Threshold:</span>
              <span className="font-mono text-slate-900 font-semibold">50.0%</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Task:</span>
              <span className="text-slate-900 font-medium">Angiography Cath CAD</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
              <div 
                className="h-full bg-teal-600 transition-all duration-500"
                style={{ width: `${Math.min(cadPred.confidence_percent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* VESSEL-SPECIFIC RESULTS (LAD, LCX, RCA) */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* LAD Stenosis Prediction */}
          <div 
            onClick={() => { setSelectedVesselIn3D('LAD'); setSelectedTaskTab('LAD'); }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedVesselIn3D === 'LAD'
                ? 'bg-teal-50/50 border-teal-600 shadow-sm ring-1 ring-teal-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    ladPred.probability >= yellowThresh ? 'bg-rose-500' : ladPred.probability >= greenThresh ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  LAD Artery
                </span>
                <span className="text-[10px] text-slate-500 font-mono uppercase">
                  {ladPred.model_family}
                </span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5">Left Anterior Descending</span>
              
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {(ladPred.probability * 100).toFixed(1)}%
                </span>
                <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded border inline-block ${
                  ladPred.probability >= yellowThresh 
                    ? 'bg-rose-50 text-rose-800 border-rose-200' 
                    : ladPred.probability >= greenThresh
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {ladPred.predicted_class}
                </span>
              </div>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Reported finding:</span>
              <span className="text-slate-800 truncate max-w-[120px] font-medium" title={predictionData.reported_findings.lad_status}>
                {predictionData.reported_findings.lad_status}
              </span>
            </div>
          </div>

          {/* LCX Stenosis Prediction */}
          <div 
            onClick={() => { setSelectedVesselIn3D('LCX'); setSelectedTaskTab('LCX'); }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedVesselIn3D === 'LCX'
                ? 'bg-teal-50/50 border-teal-600 shadow-sm ring-1 ring-teal-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    lcxPred.probability >= yellowThresh ? 'bg-rose-500' : lcxPred.probability >= greenThresh ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  LCX Artery
                </span>
                <span className="text-[10px] text-slate-500 font-mono uppercase">
                  {lcxPred.model_family}
                </span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5">Left Circumflex</span>

              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {(lcxPred.probability * 100).toFixed(1)}%
                </span>
                <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded border inline-block ${
                  lcxPred.probability >= yellowThresh 
                    ? 'bg-rose-50 text-rose-800 border-rose-200' 
                    : lcxPred.probability >= greenThresh
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {lcxPred.predicted_class}
                </span>
              </div>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Reported finding:</span>
              <span className="text-slate-800 truncate max-w-[120px] font-medium" title={predictionData.reported_findings.lcx_status}>
                {predictionData.reported_findings.lcx_status}
              </span>
            </div>
          </div>

          {/* RCA Stenosis Prediction */}
          <div 
            onClick={() => { setSelectedVesselIn3D('RCA'); setSelectedTaskTab('RCA'); }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedVesselIn3D === 'RCA'
                ? 'bg-teal-50/50 border-teal-600 shadow-sm ring-1 ring-teal-600'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    rcaPred.probability >= yellowThresh ? 'bg-rose-500' : rcaPred.probability >= greenThresh ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  RCA Artery
                </span>
                <span className="text-[10px] text-slate-500 font-mono uppercase">
                  {rcaPred.model_family}
                </span>
              </div>
              <span className="text-xs text-slate-500 block mt-0.5">Right Coronary Artery</span>

              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                  {(rcaPred.probability * 100).toFixed(1)}%
                </span>
                <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded border inline-block ${
                  rcaPred.probability >= yellowThresh 
                    ? 'bg-rose-50 text-rose-800 border-rose-200' 
                    : rcaPred.probability >= greenThresh
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {rcaPred.predicted_class}
                </span>
              </div>
            </div>

            <div className="pt-2.5 mt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Reported finding:</span>
              <span className="text-slate-800 truncate max-w-[120px] font-medium" title={predictionData.reported_findings.rca_status}>
                {predictionData.reported_findings.rca_status}
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. PROMINENT INTERACTIVE 3D HEART VIEWER */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-600 fill-rose-600/20" />
              Interactive 3D Anatomical Heart Model
            </h2>
            <p className="text-xs text-slate-500">
              Dynamically highlighted with machine-learning predicted stenosis probabilities (LAD, LCX, RCA). Rotate, zoom, and select vessels.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline-block">
            Controls: Left Drag (Rotate) &bull; Scroll (Zoom) &bull; Right Drag (Pan)
          </span>
        </div>

        <ThreeHeartViewer
          predictionData={predictionData}
          greenThreshold={greenThresh}
          yellowThreshold={yellowThresh}
          selectedVessel={selectedVesselIn3D}
          onSelectVessel={(v) => {
            setSelectedVesselIn3D(v);
            if (v) setSelectedTaskTab(v);
          }}
        />
      </section>

      {/* 3. LIME EXPLAINABILITY & FEATURE ATTRIBUTION */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Explainable Machine Learning (LIME)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Local Tabular Explainer
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Feature Attributions for {selectedTaskTab} Prediction
            </h3>
            <p className="text-xs text-slate-500">
              Relative importance and contribution direction calculated by LIME on the patient's feature vector.
            </p>
          </div>

          {/* Task selector tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg self-start sm:self-auto">
            {(['CAD', 'LAD', 'LCX', 'RCA'] as const).map((task) => (
              <button
                key={task}
                type="button"
                onClick={() => {
                  setSelectedTaskTab(task);
                  if (task !== 'CAD') setSelectedVesselIn3D(task);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedTaskTab === task
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {task}
              </button>
            ))}
          </div>
        </div>

        {/* LIME Chart and List */}
        {activeLimeFeatures.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeLimeFeatures.map((feat, idx) => {
                const isRisk = feat.direction === 'Risk-Increasing';
                const maxWeight = Math.max(...activeLimeFeatures.map(f => Math.abs(f.weight)), 0.01);
                const barWidth = Math.min(Math.round((Math.abs(feat.weight) / maxWeight) * 100), 100);

                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate pr-2">
                        {feat.feature_condition}
                      </span>
                      <span className={`font-mono text-xs font-semibold flex-shrink-0 flex items-center gap-1 tabular-nums ${
                        isRisk ? 'text-rose-700' : 'text-emerald-700'
                      }`}>
                        {isRisk ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {feat.weight > 0 ? `+${feat.weight.toFixed(4)}` : feat.weight.toFixed(4)}
                      </span>
                    </div>

                    {/* Progress Bar Representation */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden flex items-center">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isRisk ? 'bg-rose-600' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Direction: <strong className={isRisk ? 'text-rose-700' : 'text-emerald-700'}>{feat.direction}</strong></span>
                      <span className="font-mono tabular-nums">Relative Impact: {(feat.importance_abs * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Legend: <strong className="text-rose-700">Red (+)</strong> increases predicted stenosis probability &bull; <strong className="text-emerald-700">Green (&minus;)</strong> protective/reduces predicted probability</span>
              <span className="text-[11px] text-slate-500">LIME Perturbation: 5,000 samples</span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 italic">
            No local LIME explanation features generated for this task.
          </div>
        )}
      </section>

      {/* 4. PATIENT MEASUREMENTS (Reported vs Predicted Separation) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              Patient Measurements &amp; Clinical Summary
            </h3>
            <p className="text-xs text-slate-500">
              Clear distinction between reported clinical measurements and machine-learning predictions.
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
            Form Record Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Demographics</span>
            <p className="text-slate-900 font-semibold text-sm">{patientFormData.age} yrs / {patientFormData.gender}</p>
            <p className="text-slate-500">Patient ID: {patientFormData.patient_id}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Blood Pressure &amp; Pulse</span>
            <p className="text-slate-900 font-semibold text-sm">
              {patientFormData.blood_pressure.systolic || '—'} / {patientFormData.blood_pressure.diastolic || '—'} mmHg
            </p>
            <p className="text-slate-500">
              Resting Pulse: {patientFormData.blood_pressure.resting_pulse || '—'} bpm
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Lipid Profile (mg/dL)</span>
            <p className="text-slate-900 font-semibold text-sm">
              LDL: {patientFormData.cholesterol.ldl || '—'} &bull; HDL: {patientFormData.cholesterol.hdl || '—'}
            </p>
            <p className="text-slate-500">
              Total: {patientFormData.cholesterol.total_cholesterol || '—'} &bull; TG: {patientFormData.cholesterol.triglycerides || '—'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Echo EF-TTE &amp; Wall Motion</span>
            <p className="text-slate-900 font-semibold text-sm">
              EF: {patientFormData.echocardiogram_report.ejection_fraction ? `${patientFormData.echocardiogram_report.ejection_fraction}%` : 'Not provided'}
            </p>
            <p className="text-slate-500">
              RWMA: {patientFormData.echocardiogram_report.rwma_present ? 'Present' : 'None'}
            </p>
          </div>
        </div>

        {/* Confirmed Findings Table */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Confirmed Clinical Findings (Fields 14&ndash;21)
            </h4>
            <span className="text-[11px] text-teal-800 font-medium">
              Reported Separately From ML Predictions
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Reported LAD Status</span>
              <strong className="text-slate-900">{predictionData.reported_findings.lad_status}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Reported LCX Status</span>
              <strong className="text-slate-900">{predictionData.reported_findings.lcx_status}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Reported RCA Status</span>
              <strong className="text-slate-900">{predictionData.reported_findings.rca_status}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Plaque Type</span>
              <strong className="text-slate-900">{predictionData.reported_findings.plaque_type}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Number of Vessels Affected</span>
              <strong className="text-slate-900">{predictionData.reported_findings.number_vessels_affected}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Maximum Stenosis %</span>
              <strong className="text-slate-900">{predictionData.reported_findings.max_stenosis_percentage}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">CAD Severity / CAD-RADS</span>
              <strong className="text-slate-900">{predictionData.reported_findings.cad_severity_cadradas}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Final Cardiologist Diagnosis</span>
              <strong className="text-slate-900">{predictionData.reported_findings.final_cardiologist_diagnosis}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MODEL EVALUATION METRICS TABLE */}
      {modelEval && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-700" />
                Actual Model Evaluations &amp; Cross-Validation Benchmarks
              </h3>
              <p className="text-xs text-slate-500">
                Evaluation metrics computed during 5-fold cross-validation on the Z-Alizadeh Sani clinical dataset.
              </p>
            </div>
            <span className="text-[11px] text-slate-500">
              Target leakage strictly prevented
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Task</th>
                  <th className="py-2 px-3">Model Family</th>
                  <th className="py-2 px-3">Accuracy</th>
                  <th className="py-2 px-3">Precision</th>
                  <th className="py-2 px-3">Recall</th>
                  <th className="py-2 px-3">F1-Score</th>
                  <th className="py-2 px-3">ROC-AUC</th>
                  <th className="py-2 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(['CAD', 'LAD', 'LCX', 'RCA'] as const).flatMap((task) => {
                  const taskEvals = modelEval.evaluations[task] || {};
                  const bestModelName = modelEval.best_models[task]?.best_model;
                  return Object.entries(taskEvals).map(([modelName, m]) => {
                    const isSelected = modelName === bestModelName;
                    return (
                      <tr key={`${task}-${modelName}`} className={isSelected ? 'bg-teal-50/40 font-semibold' : 'hover:bg-slate-50'}>
                        <td className="py-2 px-3 font-sans text-slate-900 font-medium">{task}</td>
                        <td className="py-2 px-3 font-sans text-slate-800">
                          {modelName}
                          {isSelected && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 font-sans">
                              Selected
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 tabular-nums">{(m.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 tabular-nums">{m.precision.toFixed(3)}</td>
                        <td className="py-2 px-3 tabular-nums">{(m.recall * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 tabular-nums text-slate-900">{m.f1_score.toFixed(3)}</td>
                        <td className="py-2 px-3 tabular-nums text-teal-800 font-semibold">{m.roc_auc.toFixed(3)}</td>
                        <td className="py-2 px-3 text-right font-sans">
                          {isSelected ? (
                            <span className="text-teal-800 font-semibold text-[11px] flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Best Validated
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Evaluated</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* EXACT REQUIRED CLINICAL SAFETY DISCLAIMER (Section 9) */}
      <section className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block text-amber-900 font-bold uppercase tracking-wider text-[11px]">
            Clinical Safety Disclaimer
          </strong>
          <p className="leading-relaxed text-amber-900/90">
            {predictionData.clinical_safety_disclaimer}
          </p>
        </div>
      </section>

      {/* Bottom Navigation */}
      <div className="flex justify-between items-center pt-2 pb-6">
        <button
          type="button"
          onClick={onBackToForm}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
        >
          &larr; Re-enter / Edit Patient Data
        </button>

        <button
          type="button"
          onClick={onOpenReport}
          className="px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold tracking-wide shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>View Final Medical Report</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
