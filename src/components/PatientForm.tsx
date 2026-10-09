import React, { useState } from 'react';
import { 
  User, Activity, Heart, Stethoscope, FileUp, FileText, AlertCircle, 
  Check, ArrowRight, ShieldAlert, CheckCircle2, ChevronDown 
} from 'lucide-react';
import { PatientFormData, PredictionResponse } from '../types/cardio';

interface PatientFormProps {
  onSubmitPrediction: (data: PatientFormData) => Promise<void>;
  loading: boolean;
  onCancel: () => void;
}

const initialFormData: PatientFormData = {
  // 1. Patient ID
  patient_id: '',
  // 2. Age
  age: '',
  // 3. Gender
  gender: '',
  // 4. Symptoms
  symptoms: {
    chest_pain: false,
    chest_pain_type: 'typical',
    breathlessness: false,
    sweating: false,
    palpitations: false,
    dizziness: false,
    fatigue: false,
    other_symptoms: '',
  },
  // 5. Diabetes
  diabetes: false,
  // 6. Blood Pressure / Hypertension
  hypertension: false,
  blood_pressure: {
    systolic: '',
    diastolic: '',
    resting_pulse: '',
  },
  // 7. Cholesterol
  cholesterol: {
    ldl: '',
    hdl: '',
    total_cholesterol: '',
    triglycerides: '',
  },
  // 8. Smoking History
  smoking_history: 'Never',
  // 9. Family History of Heart Disease
  family_history: false,
  // 10. Previous Heart Attack / Angioplasty / Stent / Bypass
  previous_heart_events: false,
  previous_heart_details: '',
  // 11. ECG Report
  ecg_report: {
    normal: true,
    st_elevation: false,
    st_depression: false,
    t_inversion: false,
    q_wave: false,
    lvh: false,
    poor_r_progression: false,
    rhythm: 'Normal Sinus Rhythm',
    notes: '',
  },
  // 12. Echocardiogram Report
  echocardiogram_report: {
    ejection_fraction: '',
    rwma_present: false,
    rwma_segments: 0,
    valvular_disease: 'N',
    notes: '',
  },
  // 13. CT Coronary Angiography / Coronary Angiogram
  coronary_angiography: {
    performed: false,
    summary: '',
    calcium_score: '',
  },
  // 14. LAD Status (blockage/stenosis percentage) - optional
  lad_status: '',
  // 15. LCX Status (blockage/stenosis percentage) - optional
  lcx_status: '',
  // 16. RCA Status (blockage/stenosis percentage) - optional
  rca_status: '',
  // 17. Plaque Type (calcified / non-calcified / mixed)
  plaque_type: '',
  // 18. Number of Vessels Affected (1 / 2 / 3)
  number_vessels_affected: '',
  // 19. Maximum Stenosis Percentage
  max_stenosis_percentage: '',
  // 20. CAD Severity / CAD-RADS, if available
  cad_severity_cadradas: '',
  // 21. Final Cardiologist Diagnosis
  final_cardiologist_diagnosis: '',
  notes: '',
};

export const PatientForm: React.FC<PatientFormProps> = ({
  onSubmitPrediction,
  loading,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<string>('all');

  // Pre-fill realistic sample patient profiles from Z-Alizadeh Sani clinical registry
  const loadSamplePatient = (type: 'cad_stenosis' | 'normal_lowrisk') => {
    if (type === 'cad_stenosis') {
      setFormData({
        patient_id: `PT-SANI-${Math.floor(1000 + Math.random() * 9000)}`,
        age: 62,
        gender: 'Male',
        symptoms: {
          chest_pain: true,
          chest_pain_type: 'typical',
          breathlessness: true,
          sweating: true,
          palpitations: true,
          dizziness: false,
          fatigue: true,
          other_symptoms: 'Exertional retrosternal tightness radiating to left jaw',
        },
        diabetes: true,
        hypertension: true,
        blood_pressure: {
          systolic: 145,
          diastolic: 92,
          resting_pulse: 78,
        },
        cholesterol: {
          ldl: 168,
          hdl: 36,
          total_cholesterol: 245,
          triglycerides: 210,
        },
        smoking_history: 'Current Smoker',
        family_history: true,
        previous_heart_events: true,
        previous_heart_details: 'Prior myocardial infarction 3 years ago; prior PCI to RCA',
        ecg_report: {
          normal: false,
          st_elevation: false,
          st_depression: true,
          t_inversion: true,
          q_wave: true,
          lvh: true,
          poor_r_progression: false,
          rhythm: 'Sinus rhythm with ST depression in V4-V6',
          notes: 'ST segment depression >1mm lateral leads, T wave inversion anterolateral',
          file_name: 'ecg_record_lead12.pdf',
        },
        echocardiogram_report: {
          ejection_fraction: 42,
          rwma_present: true,
          rwma_segments: 2,
          valvular_disease: 'mild',
          notes: 'Hypokinesia of the mid to apical anterior septum and apex. EF ~42%',
          file_name: 'echo_transthoracic.dcm',
        },
        coronary_angiography: {
          performed: true,
          summary: 'Selective coronary angiogram demonstrated severe multivessel disease',
          calcium_score: 480,
          file_name: 'ct_angiography_summary.pdf',
        },
        // Optional confirmed clinical findings
        lad_status: '75% proximal stenosis',
        lcx_status: '50% mid stenosis',
        rca_status: '90% distal stenosis with prior patent stent',
        plaque_type: 'mixed',
        number_vessels_affected: 3,
        max_stenosis_percentage: 90,
        cad_severity_cadradas: 'CAD-RADS 4B',
        final_cardiologist_diagnosis: 'Severe 3-Vessel CAD with ischemic cardiomyopathy',
        notes: 'Recommended for Heart Team evaluation for CABG vs complex PCI',
      });
    } else {
      setFormData({
        patient_id: `PT-NORM-${Math.floor(1000 + Math.random() * 9000)}`,
        age: 44,
        gender: 'Female',
        symptoms: {
          chest_pain: false,
          chest_pain_type: 'none',
          breathlessness: false,
          sweating: false,
          palpitations: false,
          dizziness: false,
          fatigue: false,
          other_symptoms: 'Mild musculoskeletal chest wall discomfort only',
        },
        diabetes: false,
        hypertension: false,
        blood_pressure: {
          systolic: 118,
          diastolic: 76,
          resting_pulse: 68,
        },
        cholesterol: {
          ldl: 95,
          hdl: 58,
          total_cholesterol: 172,
          triglycerides: 110,
        },
        smoking_history: 'Never',
        family_history: false,
        previous_heart_events: false,
        previous_heart_details: '',
        ecg_report: {
          normal: true,
          st_elevation: false,
          st_depression: false,
          t_inversion: false,
          q_wave: false,
          lvh: false,
          poor_r_progression: false,
          rhythm: 'Normal Sinus Rhythm, 68 bpm',
          notes: 'Normal 12-lead ECG, normal axis and intervals',
          file_name: 'routine_ecg.pdf',
        },
        echocardiogram_report: {
          ejection_fraction: 65,
          rwma_present: false,
          rwma_segments: 0,
          valvular_disease: 'N',
          notes: 'Normal LV systolic function, EF 65%, no wall motion abnormalities',
          file_name: 'echo_normal.pdf',
        },
        coronary_angiography: {
          performed: false,
          summary: 'Invasive angiogram not indicated based on clinical criteria',
          calcium_score: 0,
        },
        lad_status: '',
        lcx_status: '',
        rca_status: '',
        plaque_type: '',
        number_vessels_affected: '',
        max_stenosis_percentage: '',
        cad_severity_cadradas: 'CAD-RADS 0',
        final_cardiologist_diagnosis: 'Non-cardiac chest discomfort, low cardiovascular risk profile',
        notes: 'Advised lifestyle wellness and periodic primary care screening',
      });
    }
    setValidationErrors([]);
  };

  const handleFileUpload = (field: 'ecg' | 'echo' | 'ct', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (field === 'ecg') {
      setFormData(prev => ({
        ...prev,
        ecg_report: { ...prev.ecg_report, file_name: file.name },
      }));
    } else if (field === 'echo') {
      setFormData(prev => ({
        ...prev,
        echocardiogram_report: { ...prev.echocardiogram_report, file_name: file.name },
      }));
    } else if (field === 'ct') {
      setFormData(prev => ({
        ...prev,
        coronary_angiography: { ...prev.coronary_angiography, file_name: file.name, performed: true },
      }));
    }
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // Field 1: Patient ID
    if (!formData.patient_id.trim()) {
      errors.push('Field 1: Patient ID is required.');
    }
    // Field 2: Age
    if (!formData.age || Number(formData.age) < 18 || Number(formData.age) > 110) {
      errors.push('Field 2: Valid Age is required (18 - 110 years).');
    }
    // Field 3: Gender
    if (!formData.gender) {
      errors.push('Field 3: Gender is required.');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    await onSubmitPrediction(formData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Quick-Fill Helpers with Clean Clinical Styling */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-sm text-white overflow-hidden">
        {/* Soft radiographic overlay behind banner text */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.07] pointer-events-none mix-blend-screen"
          style={{ backgroundImage: `url('/images/cardiac_angiography_tree.jpg')` }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-2">
              <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
              <span>Clinical Intake Form</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Patient Details Form
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Enter all 21 patient parameters organized across demographics, clinical symptoms, cholesterol panel, ECG &amp; echocardiogram metrics, and optional confirmed imaging findings.
            </p>
          </div>

          {/* Quick-fill sample clinical records */}
          <div className="flex flex-col sm:flex-row gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => loadSamplePatient('cad_stenosis')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-300 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Sample: High-Risk CAD Profile</span>
            </button>
            <button
              type="button"
              onClick={() => loadSamplePatient('normal_lowrisk')}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Sample: Low-Risk Normal Profile</span>
            </button>
          </div>
        </div>

        {/* Validation Errors alert */}
        {validationErrors.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs space-y-1.5">
            <div className="font-semibold flex items-center gap-2 text-rose-300">
              <AlertCircle className="w-4 h-4" />
              <span>Please resolve the following required fields:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Complete Form with all 21 Fields */}
      <form onSubmit={validateAndSubmit} className="space-y-6">
        
        {/* SECTION 1: Demographics (Fields 1, 2, 3) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Patient Identification &amp; Demographics</h3>
              <p className="text-xs text-slate-500">Fields 1 to 3: Core identification and demographic features</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* 1. Patient ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                1. Patient ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                placeholder="e.g. PT-2026-8841"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                required
              />
            </div>

            {/* 2. Age */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                2. Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="18"
                max="115"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value ? parseInt(e.target.value, 10) : '' })}
                placeholder="e.g. 58"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                required
              />
            </div>

            {/* 3. Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                3. Gender <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                <label className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  formData.gender === 'Male'
                    ? 'bg-teal-50 border-teal-600 text-teal-900'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === 'Male'}
                    onChange={() => setFormData({ ...formData, gender: 'Male' })}
                    className="sr-only"
                  />
                  <span>Male</span>
                </label>
                <label className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  formData.gender === 'Female'
                    ? 'bg-teal-50 border-teal-600 text-teal-900'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                }`}>
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === 'Female'}
                    onChange={() => setFormData({ ...formData, gender: 'Female' })}
                    className="sr-only"
                  />
                  <span>Female</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Symptoms & Clinical Presentation (Field 4) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Clinical Symptoms &amp; Anginal Characteristics</h3>
              <p className="text-xs text-slate-500">Field 4: Symptoms — chest pain, breathlessness, sweating, and other symptoms</p>
            </div>
          </div>

          {/* 4. Symptoms */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              <label className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                formData.symptoms.chest_pain
                  ? 'bg-teal-50 border-teal-600 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.symptoms.chest_pain}
                  onChange={(e) => setFormData({
                    ...formData,
                    symptoms: { ...formData.symptoms, chest_pain: e.target.checked }
                  })}
                  className="rounded text-teal-700 focus:ring-teal-600"
                />
                <span>Chest Pain</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                formData.symptoms.breathlessness
                  ? 'bg-teal-50 border-teal-600 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.symptoms.breathlessness}
                  onChange={(e) => setFormData({
                    ...formData,
                    symptoms: { ...formData.symptoms, breathlessness: e.target.checked }
                  })}
                  className="rounded text-teal-700 focus:ring-teal-600"
                />
                <span>Breathlessness</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                formData.symptoms.sweating
                  ? 'bg-teal-50 border-teal-600 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.symptoms.sweating}
                  onChange={(e) => setFormData({
                    ...formData,
                    symptoms: { ...formData.symptoms, sweating: e.target.checked }
                  })}
                  className="rounded text-teal-700 focus:ring-teal-600"
                />
                <span>Sweating</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                formData.symptoms.palpitations
                  ? 'bg-teal-50 border-teal-600 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.symptoms.palpitations}
                  onChange={(e) => setFormData({
                    ...formData,
                    symptoms: { ...formData.symptoms, palpitations: e.target.checked }
                  })}
                  className="rounded text-teal-700 focus:ring-teal-600"
                />
                <span>Palpitations</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                formData.symptoms.dizziness
                  ? 'bg-teal-50 border-teal-600 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.symptoms.dizziness}
                  onChange={(e) => setFormData({
                    ...formData,
                    symptoms: { ...formData.symptoms, dizziness: e.target.checked }
                  })}
                  className="rounded text-teal-700 focus:ring-teal-600"
                />
                <span>Dizziness</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                formData.symptoms.fatigue
                  ? 'bg-teal-50 border-teal-600 text-teal-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.symptoms.fatigue}
                  onChange={(e) => setFormData({
                    ...formData,
                    symptoms: { ...formData.symptoms, fatigue: e.target.checked }
                  })}
                  className="rounded text-teal-700 focus:ring-teal-600"
                />
                <span>Severe Fatigue</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chest Pain Classification
                </label>
                <select
                  value={formData.symptoms.chest_pain_type}
                  onChange={(e: any) => setFormData({
                    ...formData,
                    symptoms: { ...formData.symptoms, chest_pain_type: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                >
                  <option value="typical">Typical Angina (Retrosternal, provoked by exertion, relieved by rest/nitrates)</option>
                  <option value="atypical">Atypical Angina (2 of 3 typical characteristics)</option>
                  <option value="nonanginal">Non-anginal Chest Pain</option>
                  <option value="none">No Angina / Asymptomatic</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Other Clinical Symptoms &amp; Radiation Details
                </label>
                <input
                  type="text"
                  value={formData.symptoms.other_symptoms}
                  onChange={(e) => setFormData({
                    ...formData,
                    symptoms: { ...formData.symptoms, other_symptoms: e.target.value }
                  })}
                  placeholder="e.g. Radiation to left arm, nausea, orthopnea"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Cardiovascular Risk Factors (Fields 5, 6, 7, 8, 9, 10) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Risk Factors, Vitals &amp; Biomarkers</h3>
              <p className="text-xs text-slate-500">Fields 5 to 10: Chronic diseases, blood pressure, lipid profile, smoking and family history</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 5. Diabetes */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                5. Diabetes Mellitus
              </label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="diabetes"
                    checked={formData.diabetes}
                    onChange={() => setFormData({ ...formData, diabetes: true })}
                    className="text-teal-700 focus:ring-teal-600"
                  />
                  <span>Yes (Diabetic)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="diabetes"
                    checked={!formData.diabetes}
                    onChange={() => setFormData({ ...formData, diabetes: false })}
                    className="text-teal-700 focus:ring-teal-600"
                  />
                  <span>No (Non-diabetic)</span>
                </label>
              </div>
            </div>

            {/* 6. Blood Pressure / Hypertension */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  6. Blood Pressure / Hypertension
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hypertension}
                    onChange={(e) => setFormData({ ...formData, hypertension: e.target.checked })}
                    className="rounded text-teal-700 focus:ring-teal-600"
                  />
                  <span>Hypertension Diagnosed (Yes/No)</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Systolic BP (mmHg)</span>
                  <input
                    type="number"
                    value={formData.blood_pressure.systolic}
                    onChange={(e) => setFormData({
                      ...formData,
                      blood_pressure: { ...formData.blood_pressure, systolic: e.target.value ? parseFloat(e.target.value) : '' }
                    })}
                    placeholder="e.g. 135"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Diastolic BP (mmHg)</span>
                  <input
                    type="number"
                    value={formData.blood_pressure.diastolic}
                    onChange={(e) => setFormData({
                      ...formData,
                      blood_pressure: { ...formData.blood_pressure, diastolic: e.target.value ? parseFloat(e.target.value) : '' }
                    })}
                    placeholder="e.g. 85"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Resting Pulse (bpm)</span>
                  <input
                    type="number"
                    value={formData.blood_pressure.resting_pulse}
                    onChange={(e) => setFormData({
                      ...formData,
                      blood_pressure: { ...formData.blood_pressure, resting_pulse: e.target.value ? parseFloat(e.target.value) : '' }
                    })}
                    placeholder="e.g. 74"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* 7. Cholesterol Panel */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700">
                7. Lipid Profile &amp; Cholesterol Panel (mg/dL)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">LDL Cholesterol</span>
                  <input
                    type="number"
                    value={formData.cholesterol.ldl}
                    onChange={(e) => setFormData({
                      ...formData,
                      cholesterol: { ...formData.cholesterol, ldl: e.target.value ? parseFloat(e.target.value) : '' }
                    })}
                    placeholder="e.g. 145"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">HDL Cholesterol</span>
                  <input
                    type="number"
                    value={formData.cholesterol.hdl}
                    onChange={(e) => setFormData({
                      ...formData,
                      cholesterol: { ...formData.cholesterol, hdl: e.target.value ? parseFloat(e.target.value) : '' }
                    })}
                    placeholder="e.g. 42"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Total Cholesterol</span>
                  <input
                    type="number"
                    value={formData.cholesterol.total_cholesterol}
                    onChange={(e) => setFormData({
                      ...formData,
                      cholesterol: { ...formData.cholesterol, total_cholesterol: e.target.value ? parseFloat(e.target.value) : '' }
                    })}
                    placeholder="e.g. 215"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Triglycerides (TG)</span>
                  <input
                    type="number"
                    value={formData.cholesterol.triglycerides}
                    onChange={(e) => setFormData({
                      ...formData,
                      cholesterol: { ...formData.cholesterol, triglycerides: e.target.value ? parseFloat(e.target.value) : '' }
                    })}
                    placeholder="e.g. 180"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* 8. Smoking History */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                8. Smoking History
              </label>
              <select
                value={formData.smoking_history}
                onChange={(e: any) => setFormData({ ...formData, smoking_history: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="Never">Never Smoked</option>
                <option value="Current Smoker">Current Active Smoker</option>
                <option value="Ex-Smoker">Ex-Smoker (Cessation &gt; 1 yr)</option>
              </select>
            </div>

            {/* 9. Family History */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                9. Family History of Heart Disease
              </label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="family_history"
                    checked={formData.family_history}
                    onChange={() => setFormData({ ...formData, family_history: true })}
                    className="text-teal-700 focus:ring-teal-600"
                  />
                  <span>Yes (Positive FH)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="family_history"
                    checked={!formData.family_history}
                    onChange={() => setFormData({ ...formData, family_history: false })}
                    className="text-teal-700 focus:ring-teal-600"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* 10. Previous Heart Attack / Angioplasty / Stent / Bypass */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                10. Previous Events / PCI / CABG
              </label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="prev_events"
                    checked={formData.previous_heart_events}
                    onChange={() => setFormData({ ...formData, previous_heart_events: true })}
                    className="text-teal-700 focus:ring-teal-600"
                  />
                  <span>Yes (History)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="prev_events"
                    checked={!formData.previous_heart_events}
                    onChange={() => setFormData({ ...formData, previous_heart_events: false })}
                    className="text-teal-700 focus:ring-teal-600"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Diagnostic Reports & Uploads (Fields 11, 12, 13) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Diagnostic Testing &amp; Report Uploads</h3>
              <p className="text-xs text-slate-500">Fields 11 to 13: 12-lead ECG, Echocardiogram, and CT Coronary Angiogram reports</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 11. ECG Report */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  11. ECG Report
                </label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer">
                    <FileUp className="w-3.5 h-3.5 text-teal-600" />
                    <span>{formData.ecg_report.file_name ? formData.ecg_report.file_name : 'Upload ECG Report (.pdf, .dcm)'}</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.dcm"
                      onChange={(e) => handleFileUpload('ecg', e)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ecg_report.st_elevation}
                    onChange={(e) => setFormData({
                      ...formData,
                      ecg_report: { ...formData.ecg_report, st_elevation: e.target.checked }
                    })}
                    className="rounded text-teal-700 focus:ring-teal-600"
                  />
                  <span>ST Elevation</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ecg_report.st_depression}
                    onChange={(e) => setFormData({
                      ...formData,
                      ecg_report: { ...formData.ecg_report, st_depression: e.target.checked }
                    })}
                    className="rounded text-teal-700 focus:ring-teal-600"
                  />
                  <span>ST Depression</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ecg_report.t_inversion}
                    onChange={(e) => setFormData({
                      ...formData,
                      ecg_report: { ...formData.ecg_report, t_inversion: e.target.checked }
                    })}
                    className="rounded text-teal-700 focus:ring-teal-600"
                  />
                  <span>T-Wave Inversion</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ecg_report.q_wave}
                    onChange={(e) => setFormData({
                      ...formData,
                      ecg_report: { ...formData.ecg_report, q_wave: e.target.checked }
                    })}
                    className="rounded text-teal-700 focus:ring-teal-600"
                  />
                  <span>Pathological Q</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ecg_report.lvh}
                    onChange={(e) => setFormData({
                      ...formData,
                      ecg_report: { ...formData.ecg_report, lvh: e.target.checked }
                    })}
                    className="rounded text-teal-700 focus:ring-teal-600"
                  />
                  <span>LVH on ECG</span>
                </label>
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ecg_report.poor_r_progression}
                    onChange={(e) => setFormData({
                      ...formData,
                      ecg_report: { ...formData.ecg_report, poor_r_progression: e.target.checked }
                    })}
                    className="rounded text-teal-700 focus:ring-teal-600"
                  />
                  <span>Poor R Progression</span>
                </label>
              </div>

              <input
                type="text"
                value={formData.ecg_report.notes}
                onChange={(e) => setFormData({
                  ...formData,
                  ecg_report: { ...formData.ecg_report, notes: e.target.value }
                })}
                placeholder="ECG Interpretation notes (e.g. T-wave inversion in leads V1-V4, normal PR interval)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
              />
            </div>

            {/* 12. Echocardiogram Report */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  12. Echocardiogram Report
                </label>
                <label className="px-3 py-1 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer">
                  <FileUp className="w-3.5 h-3.5 text-teal-600" />
                  <span>{formData.echocardiogram_report.file_name ? formData.echocardiogram_report.file_name : 'Upload Echo Report (.pdf, .dcm)'}</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.dcm"
                    onChange={(e) => handleFileUpload('echo', e)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Ejection Fraction (EF-TTE %)</span>
                  <input
                    type="number"
                    min="15"
                    max="80"
                    value={formData.echocardiogram_report.ejection_fraction}
                    onChange={(e) => setFormData({
                      ...formData,
                      echocardiogram_report: {
                        ...formData.echocardiogram_report,
                        ejection_fraction: e.target.value ? parseFloat(e.target.value) : ''
                      }
                    })}
                    placeholder="e.g. 55"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">RWMA (Wall Motion Abnormality)</span>
                  <div className="flex items-center gap-3 pt-2 text-xs">
                    <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.echocardiogram_report.rwma_present}
                        onChange={(e) => setFormData({
                          ...formData,
                          echocardiogram_report: { ...formData.echocardiogram_report, rwma_present: e.target.checked }
                        })}
                        className="rounded text-teal-700 focus:ring-teal-600"
                      />
                      <span>Present</span>
                    </label>
                    {formData.echocardiogram_report.rwma_present && (
                      <input
                        type="number"
                        min="1"
                        max="16"
                        value={formData.echocardiogram_report.rwma_segments}
                        onChange={(e) => setFormData({
                          ...formData,
                          echocardiogram_report: {
                            ...formData.echocardiogram_report,
                            rwma_segments: parseInt(e.target.value || '1', 10)
                          }
                        })}
                        placeholder="No. segments"
                        className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Valvular Heart Disease (VHD)</span>
                  <select
                    value={formData.echocardiogram_report.valvular_disease}
                    onChange={(e: any) => setFormData({
                      ...formData,
                      echocardiogram_report: { ...formData.echocardiogram_report, valvular_disease: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                  >
                    <option value="N">None / Normal</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 13. CT Coronary Angiography / Coronary Angiogram */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  13. CT Coronary Angiography / Coronary Angiogram
                </label>
                <label className="px-3 py-1 bg-white border border-slate-300 hover:border-slate-400 rounded-lg text-xs text-slate-700 flex items-center gap-1.5 cursor-pointer">
                  <FileUp className="w-3.5 h-3.5 text-teal-600" />
                  <span>{formData.coronary_angiography.file_name ? formData.coronary_angiography.file_name : 'Upload Imaging (.pdf, .dcm)'}</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.dcm"
                    onChange={(e) => handleFileUpload('ct', e)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={formData.coronary_angiography.summary}
                    onChange={(e) => setFormData({
                      ...formData,
                      coronary_angiography: { ...formData.coronary_angiography, summary: e.target.value, performed: true }
                    })}
                    placeholder="Angiography summary (e.g. Non-invasive CT coronary calcium scan and contrast luminography)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={formData.coronary_angiography.calcium_score ?? ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      coronary_angiography: {
                        ...formData.coronary_angiography,
                        calcium_score: e.target.value ? parseFloat(e.target.value) : ''
                      }
                    })}
                    placeholder="Agatston Calcium Score"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Confirmed Clinical Findings (Fields 14 to 21 - Optional / Distinguishable from ML predictions) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                05
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Confirmed Clinical Findings (Optional)</h3>
                <p className="text-xs text-slate-500">Fields 14 to 21: Invasive/catheter findings when available; kept strictly separate from ML predictions</p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Optional &bull; Leave blank if unmeasured
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 14. LAD Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                14. LAD Status (Blockage/Stenosis %)
              </label>
              <input
                type="text"
                value={formData.lad_status ?? ''}
                onChange={(e) => setFormData({ ...formData, lad_status: e.target.value })}
                placeholder="e.g. 70% mid-vessel stenosis or Normal"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* 15. LCX Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                15. LCX Status (Blockage/Stenosis %)
              </label>
              <input
                type="text"
                value={formData.lcx_status ?? ''}
                onChange={(e) => setFormData({ ...formData, lcx_status: e.target.value })}
                placeholder="e.g. 40% proximal lesion or Normal"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* 16. RCA Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                16. RCA Status (Blockage/Stenosis %)
              </label>
              <input
                type="text"
                value={formData.rca_status ?? ''}
                onChange={(e) => setFormData({ ...formData, rca_status: e.target.value })}
                placeholder="e.g. 90% proximal stenosis or Normal"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* 17. Plaque Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                17. Plaque Type
              </label>
              <select
                value={formData.plaque_type ?? ''}
                onChange={(e: any) => setFormData({ ...formData, plaque_type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Unavailable / Not Determined</option>
                <option value="calcified">Calcified</option>
                <option value="non-calcified">Non-calcified (Soft/Fibrous)</option>
                <option value="mixed">Mixed Plaque</option>
              </select>
            </div>

            {/* 18. Number of Vessels Affected */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                18. Number of Vessels Affected
              </label>
              <select
                value={formData.number_vessels_affected ?? ''}
                onChange={(e: any) => setFormData({
                  ...formData,
                  number_vessels_affected: e.target.value ? parseInt(e.target.value, 10) : ''
                })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Unavailable</option>
                <option value="1">1 Vessel (Single Vessel Disease)</option>
                <option value="2">2 Vessels (Bivessel Disease)</option>
                <option value="3">3 Vessels (Trivessel Disease)</option>
              </select>
            </div>

            {/* 19. Maximum Stenosis Percentage */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                19. Maximum Stenosis Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.max_stenosis_percentage ?? ''}
                onChange={(e) => setFormData({
                  ...formData,
                  max_stenosis_percentage: e.target.value ? parseFloat(e.target.value) : ''
                })}
                placeholder="e.g. 85"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* 20. CAD Severity / CAD-RADS */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                20. CAD Severity / CAD-RADS
              </label>
              <select
                value={formData.cad_severity_cadradas ?? ''}
                onChange={(e) => setFormData({ ...formData, cad_severity_cadradas: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">Unavailable</option>
                <option value="CAD-RADS 0">CAD-RADS 0: Documented Absence of CAD (0%)</option>
                <option value="CAD-RADS 1">CAD-RADS 1: Minimal Stenosis (1-24%)</option>
                <option value="CAD-RADS 2">CAD-RADS 2: Mild Stenosis (25-49%)</option>
                <option value="CAD-RADS 3">CAD-RADS 3: Moderate Stenosis (50-69%)</option>
                <option value="CAD-RADS 4A">CAD-RADS 4A: Severe Stenosis (70-99% single or 2 vessels)</option>
                <option value="CAD-RADS 4B">CAD-RADS 4B: Severe Stenosis (3 vessels &ge;70% or Left Main &ge;50%)</option>
                <option value="CAD-RADS 5">CAD-RADS 5: Total Coronary Occlusion (100%)</option>
              </select>
            </div>

            {/* 21. Final Cardiologist Diagnosis */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                21. Final Cardiologist Diagnosis
              </label>
              <input
                type="text"
                value={formData.final_cardiologist_diagnosis ?? ''}
                onChange={(e) => setFormData({ ...formData, final_cardiologist_diagnosis: e.target.value })}
                placeholder="e.g. Verified CAD with LAD and RCA severe involvement; ischemic symptoms"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Form Actions & EXACT REQUIRED BUTTON: "Predict Cardiovascular Risk" */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancel &amp; Return to Dashboard
          </button>

          {/* EXACT REQUIRED BUTTON: Predict Cardiovascular Risk */}
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-7 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-semibold tracking-wide shadow-sm hover:shadow active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                <span>Executing ML Pipeline &amp; LIME Analysis...</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 fill-white/20 text-white" />
                {/* EXACT REQUIRED TEXT */}
                <span>Predict Cardiovascular Risk</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
