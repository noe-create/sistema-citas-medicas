
export interface LabTest {
  id: string;
  name: string;
}

export interface LabTestCategory {
  category: string;
  tests: LabTest[];
}

export const LAB_TESTS: LabTestCategory[] = [
  {
    category: 'Hematología',
    tests: [
      { id: 'hematologia_completa', name: 'Hematología Completa' },
      { id: 'hemoglobina', name: 'Hemoglobina y Hematocrito' },
      { id: 'recuento_plaquetas', name: 'Recuento de Plaquetas' },
      { id: 'reticulocitos', name: 'Reticulocitos' },
      { id: 'vsg', name: 'VSG (Velocidad de Sedimentación Globular)' },
      { id: 'grupo_sanguineo_rh', name: 'Grupo Sanguíneo y Factor Rh' },
      { id: 'coombs_directo', name: 'Prueba de Coombs Directa' },
      { id: 'coombs_indirecto', name: 'Prueba de Coombs Indirecta' },
    ],
  },
  {
    category: 'Química Sanguínea',
    tests: [
      { id: 'glicemia_ayunas', name: 'Glicemia en Ayunas' },
      { id: 'glicemia_postprandial', name: 'Glicemia Post-Prandial' },
      { id: 'curva_tolerancia_glucosa', name: 'Curva de Tolerancia a la Glucosa' },
      { id: 'hemoglobina_glicosilada', name: 'Hemoglobina Glicosilada (HbA1c)' },
      { id: 'urea', name: 'Urea' },
      { id: 'creatinina', name: 'Creatinina' },
      { id: 'acido_urico', name: 'Ácido Úrico' },
      { id: 'colesterol_total', name: 'Colesterol Total' },
      { id: 'trigliceridos', name: 'Triglicéridos' },
      { id: 'hdl_colesterol', name: 'HDL Colesterol' },
      { id: 'ldl_colesterol', name: 'LDL Colesterol (cálculo)' },
      { id: 'vldl_colesterol', name: 'VLDL Colesterol (cálculo)' },
      { id: 'proteinas_totales', name: 'Proteínas Totales y Fraccionadas (Albúmina/Globulina)' },
      { id: 'bilirrubina_total_fraccionada', name: 'Bilirrubina Total y Fraccionada' },
      { id: 'tgo_ast', name: 'Transaminasa TGO (AST)' },
      { id: 'tgp_alt', name: 'Transaminasa TGP (ALT)' },
      { id: 'fosfatasa_alcalina', name: 'Fosfatasa Alcalina' },
      { id: 'gamma_gt', name: 'Gamma GT' },
      { id: 'amilasa', name: 'Amilasa' },
      { id: 'lipasa', name: 'Lipasa' },
      { id: 'calcio_serico', name: 'Calcio Sérico' },
      { id: 'fosforo_serico', name: 'Fósforo Sérico' },
      { id: 'magnesio_serico', name: 'Magnesio Sérico' },
      { id: 'sodio_na', name: 'Sodio (Na)' },
      { id: 'potasio_k', name: 'Potasio (K)' },
      { id: 'cloro_cl', name: 'Cloro (Cl)' },
    ],
  },
  {
    category: 'Pruebas de Coagulación',
    tests: [
      { id: 'pt', name: 'Tiempo de Protrombina (PT)' },
      { id: 'ptt', name: 'Tiempo de Tromboplastina Parcial (PTT)' },
      { id: 'inr', name: 'INR' },
      { id: 'fibrinogeno', name: 'Fibrinógeno' },
    ],
  },
  {
    category: 'Hormonas y Perfiles',
    tests: [
      { id: 'tsh', name: 'TSH (Hormona Estimulante de la Tiroides)' },
      { id: 't4_libre', name: 'T4 Libre' },
      { id: 't3_total', name: 'T3 Total' },
      { id: 'perfil_tiroideo_completo', name: 'Perfil Tiroideo Completo (TSH, T4L, T3)' },
      { id: 'fsh', name: 'FSH (Hormona Folículo Estimulante)' },
      { id: 'lh', name: 'LH (Hormona Luteinizante)' },
      { id: 'prolactina', name: 'Prolactina' },
      { id: 'estradiol', name: 'Estradiol' },
      { id: 'progesterona', name: 'Progesterona' },
      { id: 'testosterona_total', name: 'Testosterona Total' },
      { id: 'hcg_cuantitativa', name: 'HCG Subunidad Beta Cuantitativa (Prueba de Embarazo en sangre)' },
    ],
  },
  {
    category: 'Marcadores Tumorales',
    tests: [
      { id: 'psa_total', name: 'Antígeno Prostático Específico (PSA) Total' },
      { id: 'psa_libre', name: 'Antígeno Prostático Específico (PSA) Libre' },
      { id: 'cea', name: 'Antígeno Carcinoembrionario (CEA)' },
      { id: 'ca_125', name: 'CA-125 (Ovario)' },
      { id: 'ca_19_9', name: 'CA 19-9 (Páncreas)' },
      { id: 'ca_15_3', name: 'CA 15-3 (Mama)' },
    ],
  },
  {
    category: 'Serología / Inmunología',
    tests: [
      { id: 'vdrl', name: 'VDRL' },
      { id: 'hiv', name: 'VIH (Anticuerpos 1 y 2)' },
      { id: 'helicobacter_pylori_igg', name: 'Helicobacter Pylori (IgG)' },
      { id: 'toxoplasma_igg_igm', name: 'Toxoplasma (IgG, IgM)' },
      { id: 'rubeola_igg_igm', name: 'Rubéola (IgG, IgM)' },
      { id: 'citomegalovirus_igg_igm', name: 'Citomegalovirus (IgG, IgM)' },
      { id: 'hepatitis_a', name: 'Hepatitis A (Anti-VHA IgM)' },
      { id: 'hepatitis_b', name: 'Hepatitis B (HBsAg)' },
      { id: 'hepatitis_c', name: 'Hepatitis C (Anti-VHC)' },
      { id: 'pcr_ultrasensible', name: 'Proteína C Reactiva (PCR) Ultrasensible' },
      { id: 'factor_reumatoideo', name: 'Factor Reumatoideo (FR)' },
      { id: 'ana', name: 'Anticuerpos Antinucleares (ANA)' },
    ],
  },
  {
    category: 'Uroanálisis y Coproanálisis',
    tests: [
      { id: 'orina_simple', name: 'Examen de Orina Simple' },
      { id: 'urocultivo', name: 'Urocultivo y Antibiograma' },
      { id: 'depuracion_creatinina_24h', name: 'Depuración de Creatinina en orina de 24h' },
      { id: 'heces_simple', name: 'Examen de Heces Simple' },
      { id: 'sangre_oculta_heces', name: 'Sangre Oculta en Heces' },
    ],
  },
];
