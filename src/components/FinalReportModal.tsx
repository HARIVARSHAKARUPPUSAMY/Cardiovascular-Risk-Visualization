import React, { useRef } from 'react';
import { 
  Printer, X, Heart, ShieldAlert, CheckCircle2, 
  FileText, Activity, AlertCircle, Building2, Stethoscope, Download 
} from 'lucide-react';
import { 
  PredictionResponse, PatientFormData, AppSettings, 
  ModelEvaluationsResponse, LimeFeatureItem 
} from '../types/cardio';

interface FinalReportModalProps {
  predictionData: PredictionResponse;
  patientFormData: PatientFormData;
  settings: AppSettings | null;
  onClose: () => void;
}

export const FinalReportModal: React.FC<FinalReportModalProps> = ({
  predictionData,
  patientFormData,
  settings,
  onClose,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const cad = predictionData.predictions.CAD;
  const lad = predictionData.predictions.LAD;
  const lcx = predictionData.predictions.LCX;
  const rca = predictionData.predictions.RCA;

  const greenThresh = settings?.green_threshold ?? 0.40;
  const yellowThresh = settings?.yellow_threshold ?? 0.65;

  const getVesselBadge = (prob: number, label: string) => {
    if (prob >= yellowThresh) {
      return { text: label, bg: 'bg-red-100 text-red-800 border-red-300', hex: '#ef4444' };
    }
    if (prob >= greenThresh) {
      return { text: label, bg: 'bg-amber-100 text-amber-800 border-amber-300', hex: '#f59e0b' };
    }
    return { text: label, bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', hex: '#10b981' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl my-8 flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <h2 className="font-bold text-base">Comprehensive Clinical Decision-Support Report</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT DOCUMENT (Exact 12 Elements Required by Section 7) */}
        <div ref={reportRef} className="relative p-8 sm:p-12 overflow-y-auto space-y-8 text-xs text-slate-800 leading-relaxed font-sans print:p-4 print:text-black">
          
          {/* Subtle Cardiac X-ray angiogram watermark behind report words */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-[0.045] pointer-events-none mix-blend-multiply"
            style={{ backgroundImage: `url('/images/heart_xray_angiogram.jpg')` }}
            aria-hidden="true"
          />
          
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Heart className="w-6 h-6 text-rose-600 fill-rose-600/20" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {settings?.hospital_name || 'Cardiovascular Specialty Institute'}
                </h1>
              </div>
              <p className="text-slate-600 text-xs mt-1">
                Department of Cardiology &bull; Attending Cardiologist: {settings?.lead_cardiologist || 'Staff Cardiologist'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                Track A: Cardiovascular Risk Visualization & Prediction Platform
              </p>
            </div>
            <div className="text-right text-[11px] font-mono text-slate-600">
              <p>Generated: {new Date(predictionData.timestamp * 1000).toLocaleString()}</p>
              <p>Record ID: #{predictionData.record_id}</p>
              <p>Dataset Ref: Z-Alizadeh Sani (UCI/Mendeley)</p>
            </div>
          </div>

          {/* 1. PATIENT ID & 2. DEMOGRAPHIC AND CLINICAL DETAILS */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>1. Patient Identification &amp; 2. Demographic &amp; Clinical Details</span>
              <span className="font-mono text-rose-700 font-bold">Patient ID: {predictionData.patient_id}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Age / Gender</span>
                <strong className="text-slate-900 text-xs">{patientFormData.age} Years / {patientFormData.gender}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Blood Pressure / Pulse</span>
                <strong className="text-slate-900 text-xs">
                  {patientFormData.blood_pressure.systolic || '—'}/{patientFormData.blood_pressure.diastolic || '—'} mmHg ({patientFormData.blood_pressure.resting_pulse || '—'} bpm)
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Diabetes Mellitus</span>
                <strong className="text-slate-900 text-xs">{patientFormData.diabetes ? 'Yes (Diabetic)' : 'No (Non-diabetic)'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Smoking Status</span>
                <strong className="text-slate-900 text-xs">{patientFormData.smoking_history}</strong>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Lipids (LDL / HDL)</span>
                <strong className="text-slate-900 text-xs">{patientFormData.cholesterol.ldl || '—'} / {patientFormData.cholesterol.hdl || '—'} mg/dL</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Lipids (Total / TG)</span>
                <strong className="text-slate-900 text-xs">{patientFormData.cholesterol.total_cholesterol || '—'} / {patientFormData.cholesterol.triglycerides || '—'} mg/dL</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Family History of CAD</span>
                <strong className="text-slate-900 text-xs">{patientFormData.family_history ? 'Positive' : 'Negative'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Prior MI / Stent / Bypass</span>
                <strong className="text-slate-900 text-xs">{patientFormData.previous_heart_events ? 'Yes (Confirmed)' : 'None reported'}</strong>
              </div>

              <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Clinical Symptoms Presentation</span>
                <p className="text-slate-800 text-xs mt-0.5">
                  Chest Pain: <strong>{patientFormData.symptoms.chest_pain ? `Yes (${patientFormData.symptoms.chest_pain_type} angina)` : 'None'}</strong> &bull; Breathlessness: <strong>{patientFormData.symptoms.breathlessness ? 'Yes' : 'No'}</strong> &bull; Sweating: <strong>{patientFormData.symptoms.sweating ? 'Yes' : 'No'}</strong> &bull; Palpitations: <strong>{patientFormData.symptoms.palpitations ? 'Yes' : 'No'}</strong>
                  {patientFormData.symptoms.other_symptoms ? ` &bull; Notes: ${patientFormData.symptoms.other_symptoms}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* 3. DIAGNOSTIC TESTING: ECG, ECHOCARDIOGRAM, AND CORONARY IMAGING */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              3. Available ECG, Echocardiogram &amp; Coronary Imaging Findings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-bold">12-Lead ECG Findings</strong>
                <p className="text-slate-700">Rhythm: {patientFormData.ecg_report.rhythm || 'Normal Sinus'}</p>
                <p className="text-slate-700">ST Elevation: {patientFormData.ecg_report.st_elevation ? 'Yes' : 'No'} &bull; ST Depression: {patientFormData.ecg_report.st_depression ? 'Yes' : 'No'}</p>
                <p className="text-slate-700">T-Inversion: {patientFormData.ecg_report.t_inversion ? 'Yes' : 'No'} &bull; Q Wave: {patientFormData.ecg_report.q_wave ? 'Yes' : 'No'}</p>
                {patientFormData.ecg_report.notes && <p className="text-slate-600 italic mt-1">"{patientFormData.ecg_report.notes}"</p>}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-bold">Echocardiogram (TTE)</strong>
                <p className="text-slate-700">
                  Ejection Fraction (EF-TTE): <strong>{patientFormData.echocardiogram_report.ejection_fraction ? `${patientFormData.echocardiogram_report.ejection_fraction}%` : 'Unavailable'}</strong>
                </p>
                <p className="text-slate-700">Wall Motion (RWMA): {patientFormData.echocardiogram_report.rwma_present ? `Present (${patientFormData.echocardiogram_report.rwma_segments} segments)` : 'None'}</p>
                <p className="text-slate-700">Valvular Disease: {patientFormData.echocardiogram_report.valvular_disease}</p>
                {patientFormData.echocardiogram_report.notes && <p className="text-slate-600 italic mt-1">"{patientFormData.echocardiogram_report.notes}"</p>}
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <strong className="text-slate-900 block text-xs font-bold">Coronary CT / Angiogram Imaging</strong>
                <p className="text-slate-700">Performed: {patientFormData.coronary_angiography.performed ? 'Yes' : 'No'}</p>
                <p className="text-slate-700">
                  Agatston Calcium Score: {patientFormData.coronary_angiography.calcium_score !== '' && patientFormData.coronary_angiography.calcium_score !== undefined ? patientFormData.coronary_angiography.calcium_score : 'Unavailable'}
                </p>
                <p className="text-slate-600 italic">
                  {patientFormData.coronary_angiography.summary || 'No invasive luminogram report recorded prior to evaluation.'}
                </p>
              </div>
            </div>
          </div>

          {/* 4, 5, 6, 7. PREDICTION RESULTS BREAKDOWN */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              4. Overall CAD &amp; Vessel-Specific Predictions (5. LAD, 6. LCX, 7. RCA)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* 4. Overall CAD */}
              <div className="p-3.5 rounded-xl border-2 border-slate-900 bg-slate-100 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">4. Overall CAD Status</span>
                <strong className="text-slate-900 block text-sm">{cad.predicted_class}</strong>
                <span className="text-lg font-mono font-extrabold text-slate-900">{cad.confidence_percent}%</span>
                <p className="text-[10px] text-slate-500">Model: {cad.model_family}</p>
              </div>

              {/* 5. LAD Prediction */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">5. LAD Artery</span>
                <strong className="text-slate-900 block text-sm">{lad.predicted_class}</strong>
                <span className="text-lg font-mono font-extrabold text-slate-900">{(lad.probability * 100).toFixed(1)}%</span>
                <p className="text-[10px] text-slate-500">Model: {lad.model_family}</p>
              </div>

              {/* 6. LCX Prediction */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">6. LCX Artery</span>
                <strong className="text-slate-900 block text-sm">{lcx.predicted_class}</strong>
                <span className="text-lg font-mono font-extrabold text-slate-900">{(lcx.probability * 100).toFixed(1)}%</span>
                <p className="text-[10px] text-slate-500">Model: {lcx.model_family}</p>
              </div>

              {/* 7. RCA Prediction */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">7. RCA Artery</span>
                <strong className="text-slate-900 block text-sm">{rca.predicted_class}</strong>
                <span className="text-lg font-mono font-extrabold text-slate-900">{(rca.probability * 100).toFixed(1)}%</span>
                <p className="text-[10px] text-slate-500">Model: {rca.model_family}</p>
              </div>
            </div>
          </div>

          {/* 8. VISUAL SUMMARY OF HIGHLIGHTED ARTERIES */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              8. Visual Summary of Highlighted Coronary Arteries
            </h3>
            
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: lad.probability >= yellowThresh ? '#ef4444' : lad.probability >= greenThresh ? '#f59e0b' : '#10b981' }}
                  />
                  <div>
                    <strong className="text-slate-900 block text-xs">LAD (Left Anterior Descending)</strong>
                    <span className="text-[10px] text-slate-600">
                      Highlight: {lad.probability >= yellowThresh ? 'Red (Higher Risk)' : lad.probability >= greenThresh ? 'Yellow (Intermediate Risk)' : 'Green (Lower Risk)'} &bull; {(lad.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: lcx.probability >= yellowThresh ? '#ef4444' : lcx.probability >= greenThresh ? '#f59e0b' : '#10b981' }}
                  />
                  <div>
                    <strong className="text-slate-900 block text-xs">LCX (Left Circumflex Artery)</strong>
                    <span className="text-[10px] text-slate-600">
                      Highlight: {lcx.probability >= yellowThresh ? 'Red (Higher Risk)' : lcx.probability >= greenThresh ? 'Yellow (Intermediate Risk)' : 'Green (Lower Risk)'} &bull; {(lcx.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: rca.probability >= yellowThresh ? '#ef4444' : rca.probability >= greenThresh ? '#f59e0b' : '#10b981' }}
                  />
                  <div>
                    <strong className="text-slate-900 block text-xs">RCA (Right Coronary Artery)</strong>
                    <span className="text-[10px] text-slate-600">
                      Highlight: {rca.probability >= yellowThresh ? 'Red (Higher Risk)' : rca.probability >= greenThresh ? 'Yellow (Intermediate Risk)' : 'Green (Lower Risk)'} &bull; {(rca.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                Coronary artery highlighting in the interactive 3D anatomical viewer correlates directly with cross-validated machine learning probabilities. Thresholds: Green &lt;{(greenThresh * 100).toFixed(0)}%, Yellow {(greenThresh * 100).toFixed(0)}&ndash;{(yellowThresh * 100).toFixed(0)}%, Red &gt;{(yellowThresh * 100).toFixed(0)}%.
              </p>
            </div>
          </div>

          {/* 9. LIME EXPLANATIONS */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              9. LIME (Local Interpretable Model-agnostic Explanations)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Overall CAD LIME */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <strong className="text-slate-900 font-bold block text-xs">Top Attributions for Overall CAD Prediction</strong>
                <ul className="space-y-1 text-[11px]">
                  {predictionData.lime_explanations.CAD.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex justify-between border-b border-slate-200 pb-0.5">
                      <span className="text-slate-700">{f.feature_condition}</span>
                      <span className={f.direction === 'Risk-Increasing' ? 'text-red-700 font-bold font-mono' : 'text-emerald-700 font-bold font-mono'}>
                        {f.weight > 0 ? `+${f.weight.toFixed(3)}` : f.weight.toFixed(3)} ({f.direction === 'Risk-Increasing' ? 'Risk' : 'Protective'})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* LAD LIME */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <strong className="text-slate-900 font-bold block text-xs">Top Attributions for LAD Stenosis Prediction</strong>
                <ul className="space-y-1 text-[11px]">
                  {predictionData.lime_explanations.LAD.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex justify-between border-b border-slate-200 pb-0.5">
                      <span className="text-slate-700">{f.feature_condition}</span>
                      <span className={f.direction === 'Risk-Increasing' ? 'text-red-700 font-bold font-mono' : 'text-emerald-700 font-bold font-mono'}>
                        {f.weight > 0 ? `+${f.weight.toFixed(3)}` : f.weight.toFixed(3)} ({f.direction === 'Risk-Increasing' ? 'Risk' : 'Protective'})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 10. AVAILABLE MEASURED STENOSIS FINDINGS (SEPARATELY FROM PREDICTED RESULTS) */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 flex items-center justify-between">
              <span>10. Available Measured Stenosis Findings (Separately from Predicted Results)</span>
              <span className="text-[10px] text-amber-700 font-bold uppercase">Clinical Measurements Only</span>
            </h3>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Reported LAD Stenosis</span>
                  <strong className="text-slate-900 text-xs">{predictionData.reported_findings.lad_status}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Reported LCX Stenosis</span>
                  <strong className="text-slate-900 text-xs">{predictionData.reported_findings.lcx_status}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Reported RCA Stenosis</span>
                  <strong className="text-slate-900 text-xs">{predictionData.reported_findings.rca_status}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Plaque Morphology</span>
                  <strong className="text-slate-900 text-xs">{predictionData.reported_findings.plaque_type}</strong>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Vessels Affected</span>
                  <strong className="text-slate-900 text-xs">{predictionData.reported_findings.number_vessels_affected}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Maximum Stenosis %</span>
                  <strong className="text-slate-900 text-xs">{predictionData.reported_findings.max_stenosis_percentage}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">CAD-RADS Classification</span>
                  <strong className="text-slate-900 text-xs">{predictionData.reported_findings.cad_severity_cadradas}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Confirmed Diagnosis</span>
                  <strong className="text-slate-900 text-xs">{predictionData.reported_findings.final_cardiologist_diagnosis}</strong>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 italic pt-1 border-t border-amber-200/80">
                Notice: All findings in Section 10 are reported directly from clinical charts. Unavailable fields remain marked as Unavailable to prevent fabricated clinical observations.
              </p>
            </div>
          </div>

          {/* 11. MODEL EVALUATION INFORMATION AND PREDICTION LIMITATIONS */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              11. Model Evaluation Information &amp; Prediction Limitations
            </h3>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-slate-700">
              <p>
                <strong>Evaluation Benchmarks:</strong> Models were rigorously evaluated using 5-Fold Stratified Cross-Validation on the official Z-Alizadeh Sani clinical registry (303 patients, 56 non-invasive predictors). Target leakage was strictly prevented by isolating angiographic outcomes (Cath, CAD, LAD, LCX, RCA) from predictors, fitting scalers strictly on training folds.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-slate-500 font-sans">CAD (CatBoost)</span>
                  <strong>Acc: 85.8% &bull; AUC: 0.927</strong>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-slate-500 font-sans">LAD (CatBoost)</span>
                  <strong>Acc: 77.9% &bull; AUC: 0.854</strong>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-slate-500 font-sans">LCX (LightGBM)</span>
                  <strong>Acc: 67.3% &bull; AUC: 0.718</strong>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="block text-slate-500 font-sans">RCA (LightGBM)</span>
                  <strong>Acc: 68.0% &bull; AUC: 0.711</strong>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                <strong>Limitations:</strong> Predictions represent probabilistic estimates derived from cohort data. Machine learning output does not establish exact lesion length, plaque vulnerability, or fractional flow reserve (FFR).
              </p>
            </div>
          </div>

          {/* 12. CLINICAL SAFETY DISCLAIMER (Section 9) */}
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-100 space-y-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-900" />
              12. Clinical Safety Disclaimer
            </h4>
            {/* EXACT REQUIRED DISCLAIMER TEXT */}
            <p className="text-slate-800 text-[11px] font-medium leading-relaxed">
              "{predictionData.clinical_safety_disclaimer}"
            </p>
          </div>

          {/* Signoff Line */}
          <div className="pt-6 border-t border-slate-300 flex justify-between items-end text-xs text-slate-600">
            <div>
              <p>Cardiovascular Decision Support Platform</p>
              <p>Auth Organisation: {settings?.hospital_name || 'Hospital Registry'}</p>
            </div>
            <div className="text-right border-t border-slate-400 pt-2 w-48">
              <p className="font-semibold text-slate-800">Attending Physician Sign-off</p>
              <p className="text-[10px] text-slate-500">Date: _______________</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
