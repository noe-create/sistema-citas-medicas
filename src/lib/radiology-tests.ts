
export interface RadiologyTest {
  id: string;
  name: string;
}

export interface RadiologyTestCategory {
  category: string;
  tests: RadiologyTest[];
}

export const RADIOLOGY_TESTS: RadiologyTestCategory[] = [
  {
    category: 'Rayos X Simples',
    tests: [
      { id: 'rx_torax_pa', name: 'RX de Tórax PA' },
      { id: 'rx_torax_pa_lat', name: 'RX de Tórax PA y Lateral' },
      { id: 'rx_abdomen_simple', name: 'RX de Abdomen Simple' },
      { id: 'rx_craneo_ap_lat', name: 'RX de Cráneo AP y Lateral' },
      { id: 'rx_col_cervical', name: 'RX de Columna Cervical' },
      { id: 'rx_col_dorsal', name: 'RX de Columna Dorsal' },
      { id: 'rx_col_lumbar', name: 'RX de Columna Lumbar' },
      { id: 'rx_hombro', name: 'RX de Hombro' },
      { id: 'rx_codo', name: 'RX de Codo' },
      { id: 'rx_muneca', name: 'RX de Muñeca' },
      { id: 'rx_mano', name: 'RX de Mano' },
      { id: 'rx_pelvis', name: 'RX de Pelvis' },
      { id: 'rx_cadera', name: 'RX de Cadera' },
      { id: 'rx_rodilla', name: 'RX de Rodilla' },
      { id: 'rx_tobillo', name: 'RX de Tobillo' },
      { id: 'rx_pie', name: 'RX de Pie' },
    ],
  },
  {
    category: 'Ecografía (Ultrasonido)',
    tests: [
      { id: 'eco_abdominal', name: 'Ecografía Abdominal Completa' },
      { id: 'eco_pelvica', name: 'Ecografía Pélvica' },
      { id: 'eco_transvaginal', name: 'Ecografía Transvaginal' },
      { id: 'eco_obstetrica', name: 'Ecografía Obstétrica' },
      { id: 'eco_mamaria', name: 'Ecografía Mamaria' },
      { id: 'eco_tiroidea', name: 'Ecografía Tiroidea' },
      { id: 'eco_partes_blandas', name: 'Ecografía de Partes Blandas' },
      { id: 'eco_musculoesqueletico', name: 'Ecografía Músculo-esquelética' },
      { id: 'eco_renal', name: 'Ecografía Renal y de Vías Urinarias' },
      { id: 'eco_prostatica', name: 'Ecografía Prostática' },
      { id: 'eco_doppler_vascular', name: 'Ecografía Doppler Vascular (miembros inferiores/superiores)' },
      { id: 'eco_doppler_carotideo', name: 'Ecografía Doppler Carotídeo' },
    ],
  },
  {
    category: 'Tomografía Computarizada (TC)',
    tests: [
      { id: 'tc_cerebral_simple', name: 'TC Cerebral Simple' },
      { id: 'tc_cerebral_contraste', name: 'TC Cerebral con Contraste' },
      { id: 'tc_torax_simple', name: 'TC de Tórax Simple' },
      { id: 'tc_torax_contraste', name: 'TC de Tórax con Contraste (AngioTAC Pulmonar)' },
      { id: 'tc_abdomen_simple', name: 'TC de Abdomen y Pelvis Simple' },
      { id: 'tc_abdomen_contraste', name: 'TC de Abdomen y Pelvis con Contraste' },
      { id: 'urotac', name: 'Urotomografía (UroTAC)' },
      { id: 'tc_columna', name: 'TC de Columna (Cervical/Dorsal/Lumbar)' },
      { id: 'tc_senos_paranasales', name: 'TC de Senos Paranasales' },
    ],
  },
  {
    category: 'Resonancia Magnética (RM)',
    tests: [
      { id: 'rm_cerebral_simple', name: 'RM Cerebral Simple' },
      { id: 'rm_cerebral_contraste', name: 'RM Cerebral con Contraste' },
      { id: 'rm_columna', name: 'RM de Columna (Cervical/Dorsal/Lumbar)' },
      { id: 'rm_articulacion', name: 'RM de Articulación (Hombro/Rodilla/etc.)' },
      { id: 'rm_abdomen', name: 'RM de Abdomen' },
      { id: 'colangioresonancia', name: 'Colangiorresonancia' },
    ],
  },
];
