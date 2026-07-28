import { DocumentTemplate, CATEGORIES } from '../types';

export const standardFields = [
    { id: 'full_name', label: 'field_full_name', placeholder: 'place_full_name', type: 'text' },
    { id: 'nationality', label: 'field_nationality', placeholder: 'place_nationality', type: 'text' },
    { id: 'passport_num', label: 'field_passport_num', placeholder: 'place_passport_num', type: 'text' },
    { id: 'nif', label: 'field_nif', placeholder: 'place_nif', type: 'text' },
    { id: 'niss', label: 'field_niss', placeholder: 'place_niss', type: 'text' },
    { id: 'address', label: 'field_address', placeholder: 'place_address', type: 'text' },
    { id: 'city', label: 'field_city', placeholder: 'place_city', type: 'text' }
];

export const templates: DocumentTemplate[] = [
    // --- RESIDÊNCIA E REGULARIZAÇÃO ---
    {
        id: 'aima_ar_temp', title: 'aima_ar_temp', category: CATEGORIES.IMMIGRATION, complexity: 'Medium', authority: 'AIMA', location: 'loc_aima',
        description: 'aima_ar_temp_desc',
        explanation: 'aima_ar_temp_expl',
        purpose: 'aima_ar_temp_purpose',
        tips: 'aima_ar_temp_tips',
        requirements: ['req_passport', 'req_subsistence', 'req_residence_cert'],
        fields: [...standardFields]
    },
    {
        id: 'aima_ar_art122', title: 'aima_ar_art122', category: CATEGORIES.IMMIGRATION, complexity: 'Hard', authority: 'AIMA', location: 'loc_aima',
        description: 'aima_ar_art122_desc',
        explanation: 'aima_ar_art122_expl',
        purpose: 'aima_ar_art122_purpose',
        tips: 'aima_ar_art122_tips',
        requirements: ['req_specific_proof', 'req_criminal_record'],
        fields: [...standardFields]
    },
    {
        id: 'aima_ar_renovacao', title: 'aima_ar_renovacao', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'AIMA', location: 'loc_aima_portal',
        description: 'aima_ar_renovacao_desc',
        explanation: 'aima_ar_renovacao_expl',
        purpose: 'aima_ar_renovacao_purpose',
        tips: 'aima_ar_renovacao_tips',
        requirements: ['req_current_title', 'req_updated_address'],
        fields: [...standardFields]
    },
    {
        id: 'aima_dec_alojamento', title: 'aima_dec_alojamento', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'AIMA', location: 'loc_junta',
        description: 'aima_dec_alojamento_desc',
        explanation: 'aima_dec_alojamento_expl',
        purpose: 'aima_dec_alojamento_purpose',
        tips: 'aima_dec_alojamento_tips',
        requirements: ['req_host_data', 'req_lease_or_property'],
        fields: [...standardFields, { id: 'host_name', label: 'field_host_name', placeholder: 'place_host_name', type: 'text' }]
    },
    {
        id: 'aima_dec_responsabilidade', title: 'aima_dec_responsabilidade', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'AIMA', location: 'loc_notario',
        description: 'aima_dec_responsabilidade_desc',
        explanation: 'aima_dec_responsabilidade_expl',
        purpose: 'aima_dec_responsabilidade_purpose',
        tips: 'aima_dec_responsabilidade_tips',
        requirements: ['req_resp_id', 'req_kinship'],
        fields: [...standardFields, { id: 'relative_name', label: 'field_relative_name', placeholder: 'place_relative_name', type: 'text' }]
    },
    {
        id: 'aima_dec_sustento', title: 'aima_dec_sustento', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'AIMA', location: 'loc_aima',
        description: 'aima_dec_sustento_desc',
        explanation: 'aima_dec_sustento_expl',
        purpose: 'aima_dec_sustento_purpose',
        tips: 'aima_dec_sustento_tips',
        requirements: ['req_income_proof', 'req_bank_guarantee'],
        fields: [...standardFields]
    },
    {
        id: 'aima_ar_humanitaria', title: 'aima_ar_humanitaria', category: CATEGORIES.HUMANITARIAN, complexity: 'Medium', authority: 'AIMA', location: 'loc_aima',
        description: 'aima_ar_humanitaria_desc',
        explanation: 'aima_ar_humanitaria_expl',
        purpose: 'aima_ar_humanitaria_purpose',
        tips: 'aima_ar_humanitaria_tips',
        requirements: ['req_medical_reports', 'req_id'],
        fields: [...standardFields]
    },
    {
        id: 'aima_asilo_req', title: 'aima_asilo_req', category: CATEGORIES.HUMANITARIAN, complexity: 'Medium', authority: 'AIMA', location: 'loc_esquadra',
        description: 'aima_asilo_req_desc',
        explanation: 'aima_asilo_req_expl',
        purpose: 'aima_asilo_req_purpose',
        tips: 'aima_asilo_req_tips',
        requirements: ['req_written_account', 'req_id'],
        fields: [...standardFields]
    },
    {
        id: 'aima_refugiado_status', title: 'aima_refugiado_status', category: CATEGORIES.HUMANITARIAN, complexity: 'Easy', authority: 'AIMA', location: 'loc_aima',
        description: 'aima_refugiado_status_desc',
        explanation: 'aima_refugiado_status_expl',
        purpose: 'aima_refugiado_status_purpose',
        tips: 'aima_refugiado_status_tips',
        requirements: ['req_favorable_dec'],
        fields: [...standardFields]
    },
    {
        id: 'crue_req', title: 'crue_req', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'Câmara Municipal', location: 'loc_camara',
        description: 'crue_req_desc',
        explanation: 'aima_ar_temp_expl',
        purpose: 'crue_req_purpose',
        tips: 'crue_req_tips',
        requirements: ['req_eu_id', 'req_means_of_work'],
        fields: [...standardFields]
    },
    {
        id: 'carta_atraso_aima', title: 'carta_atraso_aima', category: CATEGORIES.IMMIGRATION, complexity: 'Medium', authority: 'AIMA', location: 'loc_ctt',
        description: 'carta_atraso_aima_desc',
        explanation: 'expl_carta_atraso_aima',
        purpose: 'carta_atraso_aima_purpose',
        tips: 'carta_atraso_aima_tips',
        requirements: ['req_process_id', 'req_initial_request'],
        fields: [...standardFields, { id: 'process_number', label: 'field_process_number', placeholder: 'place_process_number', type: 'text' }]
    },
    {
        id: 'carta_pedido_informacao', title: 'carta_pedido_informacao', category: CATEGORIES.RIGHTS, complexity: 'Easy', authority: 'Entidades Públicas', location: 'loc_ctt',
        description: 'carta_pedido_informacao_desc',
        explanation: 'expl_carta_pedido_informacao',
        purpose: 'carta_pedido_informacao_purpose',
        tips: 'carta_pedido_informacao_tips',
        requirements: ['req_id_data', 'req_recipient'],
        fields: [...standardFields, { id: 'destination_entity', label: 'field_destination_entity', placeholder: 'place_destination_entity', type: 'text' }]
    },
    {
        id: 'carta_provedor_justica', title: 'carta_provedor_justica', category: CATEGORIES.RIGHTS, complexity: 'Medium', authority: 'Provedor de Justiça', location: 'loc_online',
        description: 'carta_provedor_justica_desc',
        explanation: 'expl_carta_provedor_justica',
        purpose: 'carta_provedor_justica_purpose',
        tips: 'carta_provedor_justica_tips',
        requirements: ['req_inertia_proof', 'req_previous_letters'],
        fields: [...standardFields, { id: 'complaint_reason', label: 'field_complaint_reason', placeholder: 'place_complaint_reason', type: 'text' }]
    },

    // --- NACIONALIDADE E REGISTOS ---
    {
        id: 'irn_nacionalidade_casamento', title: 'irn_nacionalidade_casamento', category: CATEGORIES.RIGHTS, complexity: 'Hard', authority: 'IRN', location: 'loc_irn',
        description: 'irn_nacionalidade_casamento_desc',
        explanation: 'expl_irn_nacionalidade_casamento',
        purpose: 'irn_nacionalidade_casamento_purpose',
        tips: 'irn_nacionalidade_casamento_tips',
        requirements: ['req_certificates', 'req_criminal_record'],
        fields: [...standardFields, { id: 'spouse_name', label: 'field_spouse_name', placeholder: 'place_spouse_name', type: 'text' }]
    },
    {
        id: 'irn_nacionalidade_residencia', title: 'irn_nacionalidade_residencia', category: CATEGORIES.RIGHTS, complexity: 'Hard', authority: 'IRN', location: 'loc_irn',
        description: 'irn_nacionalidade_residencia_desc',
        explanation: 'expl_irn_nacionalidade_residencia',
        purpose: 'irn_nacionalidade_residencia_purpose',
        tips: 'irn_nacionalidade_residencia_tips',
        requirements: ['req_edu_certificates', 'req_criminal_record'],
        fields: [...standardFields]
    },
    {
        id: 'certidao_civil_req', title: 'certidao_civil_req', category: CATEGORIES.RIGHTS, complexity: 'Easy', authority: 'IRN', location: 'loc_civil_online',
        description: 'certidao_civil_req_desc',
        explanation: 'expl_certidao_civil_req',
        purpose: 'certidao_civil_req_purpose',
        tips: 'certidao_civil_req_tips',
        requirements: ['req_act_data', 'req_applicant_id'],
        fields: [...standardFields, { id: 'cert_type', label: 'field_cert_type', placeholder: 'place_cert_type', type: 'text' }]
    },
    {
        id: 'nacionalidade_filhos', title: 'nacionalidade_filhos', category: CATEGORIES.RIGHTS, complexity: 'Medium', authority: 'IRN', location: 'loc_irn',
        description: 'nacionalidade_filhos_desc',
        explanation: 'expl_nacionalidade_filhos',
        purpose: 'nacionalidade_filhos_purpose',
        tips: 'nacionalidade_filhos_tips',
        requirements: ['req_minor_birth_cert', 'req_parents_id'],
        fields: [...standardFields, { id: 'child_name', label: 'field_child_name', placeholder: 'place_child_name', type: 'text' }]
    },
    {
        id: 'procuracao_registo', title: 'procuracao_registo', category: CATEGORIES.RIGHTS, complexity: 'Medium', authority: 'IRN', location: 'loc_notario',
        description: 'procuracao_registo_desc',
        explanation: 'expl_procuracao_registo',
        purpose: 'procuracao_registo_purpose',
        tips: 'procuracao_registo_tips',
        requirements: ['req_attorney_data'],
        fields: [...standardFields, { id: 'attorney_name', label: 'field_attorney_name', placeholder: 'place_attorney_name', type: 'text' }]
    },
    {
        id: 'irn_cc_resident', title: 'irn_cc_resident', category: CATEGORIES.RIGHTS, complexity: 'Medium', authority: 'IRN', location: 'loc_loja_cidadao',
        description: 'irn_cc_resident_desc',
        explanation: 'expl_irn_cc_resident',
        purpose: 'irn_cc_resident_purpose',
        tips: 'irn_cc_resident_tips',
        requirements: ['req_previous_cc'],
        fields: [...standardFields]
    },
    {
        id: 'imt_certificado_tvde', title: 'imt_certificado_tvde', category: CATEGORIES.WORK, complexity: 'Hard', authority: 'IMT', location: 'loc_imt',
        description: 'imt_certificado_tvde_desc',
        explanation: 'expl_imt_certificado_tvde',
        purpose: 'imt_certificado_tvde_purpose',
        tips: 'imt_certificado_tvde_tips',
        requirements: ['req_tvde_curso', 'req_registo_criminal_tvde', 'req_grupo2'],
        fields: [...standardFields]
    },

    // --- EMPREGO E FORMAÇÃO ---
    {
        id: 'iefp_inscricao', title: 'iefp_inscricao', category: CATEGORIES.WORK, complexity: 'Easy', authority: 'IEFP', location: 'loc_iefp_online',
        description: 'iefp_inscricao_desc',
        explanation: 'expl_iefp_inscricao',
        purpose: 'iefp_inscricao_purpose',
        tips: 'iefp_inscricao_tips',
        requirements: ['req_id', 'req_cv'],
        fields: [...standardFields]
    },
    {
        id: 'iefp_reembolso_formacao', title: 'iefp_reembolso_formacao', category: CATEGORIES.WORK, complexity: 'Easy', authority: 'IEFP', location: 'loc_iefp_center',
        description: 'iefp_reembolso_formacao_desc',
        explanation: 'expl_iefp_reembolso_formacao',
        purpose: 'iefp_reembolso_formacao_purpose',
        tips: 'iefp_reembolso_formacao_tips',
        requirements: ['req_invoices', 'req_attendance_sheets'],
        fields: [...standardFields, { id: 'course_code', label: 'field_course_code', placeholder: 'place_course_code', type: 'text' }]
    },
    {
        id: 'ss_dec_desemprego', title: 'ss_dec_desemprego', category: CATEGORIES.WORK, complexity: 'Medium', authority: 'Segurança Social', location: 'loc_ss',
        description: 'ss_dec_desemprego_desc',
        explanation: 'expl_ss_dec_desemprego',
        purpose: 'ss_dec_desemprego_purpose',
        tips: 'ss_dec_desemprego_tips',
        requirements: ['req_company_data', 'req_termination_reason'],
        fields: [...standardFields, { id: 'company_name', label: 'field_company_name', placeholder: 'place_company_name', type: 'text' }]
    },

    // --- SEGURANÇA SOCIAL ---
    {
        id: 'ss_abono_familia', title: 'ss_abono_familia', category: CATEGORIES.SOCIAL_SECURITY, complexity: 'Medium', authority: 'Segurança Social', location: 'loc_ss_direta',
        description: 'ss_abono_familia_desc',
        explanation: 'expl_ss_abono_familia',
        purpose: 'ss_abono_familia_purpose',
        tips: 'ss_abono_familia_tips',
        requirements: ['req_household', 'req_income'],
        fields: [...standardFields, { id: 'num_agregado', label: 'field_num_agregado', placeholder: 'place_num_agregado', type: 'number' }]
    },
    {
        id: 'ss_dec_situacao_economica', title: 'ss_dec_situacao_economica', category: CATEGORIES.SOCIAL_SECURITY, complexity: 'Medium', authority: 'Segurança Social', location: 'loc_ss_direta',
        description: 'ss_dec_situacao_economica_desc',
        explanation: 'expl_ss_dec_situacao_economica',
        purpose: 'ss_dec_situacao_economica_purpose',
        tips: 'ss_dec_situacao_economica_tips',
        requirements: ['req_irs_proof'],
        fields: [...standardFields]
    },
    {
        id: 'ss_niss', title: 'ss_niss', category: CATEGORIES.SOCIAL_SECURITY, complexity: 'Medium', authority: 'Segurança Social', location: 'loc_ss',
        description: 'ss_niss_desc',
        explanation: 'expl_ss_niss',
        purpose: 'ss_niss_purpose',
        tips: 'ss_niss_tips',
        requirements: ['req_id', 'req_nif'],
        fields: [...standardFields]
    },

    // --- SAÚDE (SNS) ---
    {
        id: 'sns_inscricao', title: 'sns_inscricao', category: CATEGORIES.HEALTH, complexity: 'Medium', authority: 'SNS', location: 'loc_sns_center',
        description: 'sns_inscricao_desc',
        explanation: 'expl_sns_inscricao',
        purpose: 'sns_inscricao_purpose',
        tips: 'sns_inscricao_tips',
        requirements: ['req_id', 'req_nif', 'req_junta_cert'],
        fields: [...standardFields]
    },
    {
        id: 'sns_alteracao_dados', title: 'sns_alteracao_dados', category: CATEGORIES.HEALTH, complexity: 'Easy', authority: 'SNS', location: 'loc_sns_center',
        description: 'sns_alteracao_dados_desc',
        explanation: 'expl_sns_alteracao_dados',
        purpose: 'sns_alteracao_dados_purpose',
        tips: 'sns_alteracao_dados_tips',
        requirements: ['req_rnut'],
        fields: [...standardFields, { id: 'phone', label: 'field_phone', placeholder: 'place_phone', type: 'text' }]
    },
    {
        id: 'sns_reembolso_despesas', title: 'sns_reembolso_despesas', category: CATEGORIES.HEALTH, complexity: 'Medium', authority: 'SNS', location: 'loc_aces',
        description: 'sns_reembolso_despesas_desc',
        explanation: 'expl_sns_reembolso_despesas',
        purpose: 'sns_reembolso_despesas_purpose',
        tips: 'sns_reembolso_despesas_tips',
        requirements: ['req_invoices', 'req_prescription'],
        fields: [...standardFields, { id: 'invoice', label: 'field_invoice', placeholder: 'place_invoice', type: 'text' }]
    },

    // --- FINANÇAS ---
    {
        id: 'nif_req', title: 'nif_req', category: CATEGORIES.FINANCE, complexity: 'Easy', authority: 'AT', location: 'loc_financas',
        description: 'nif_req_desc',
        explanation: 'expl_nif_req',
        purpose: 'nif_req_purpose',
        tips: 'nif_req_tips',
        requirements: ['req_passport'],
        fields: [...standardFields]
    },
    {
        id: 'at_rep_fiscal', title: 'at_rep_fiscal', category: CATEGORIES.FINANCE, complexity: 'Medium', authority: 'AT', location: 'loc_financas_online',
        description: 'at_rep_fiscal_desc',
        explanation: 'expl_at_rep_fiscal',
        purpose: 'at_rep_fiscal_purpose',
        tips: 'at_rep_fiscal_tips',
        requirements: ['req_rep_id'],
        fields: [...standardFields, { id: 'rep_nif', label: 'field_rep_nif', placeholder: 'place_rep_nif', type: 'text' }]
    },
    {
        id: 'at_alteracao_morada', title: 'at_alteracao_morada', category: CATEGORIES.FINANCE, complexity: 'Easy', authority: 'AT', location: 'loc_portal_financas',
        description: 'at_alteracao_morada_desc',
        explanation: 'expl_at_alteracao_morada',
        purpose: 'at_alteracao_morada_purpose',
        tips: 'at_alteracao_morada_tips',
        requirements: ['req_new_addr'],
        fields: [...standardFields, { id: 'new_addr', label: 'field_new_addr', placeholder: 'place_new_addr', type: 'text' }]
    },

    // --- EDUCAÇÃO E RECONHECIMENTO ---
    {
        id: 'dges_reconhecimento', title: 'dges_reconhecimento', category: CATEGORIES.EDUCATION, complexity: 'Hard', authority: 'DGES', location: 'loc_portal_dges',
        description: 'dges_reconhecimento_desc',
        explanation: 'expl_dges_reconhecimento',
        purpose: 'dges_reconhecimento_purpose',
        tips: 'dges_reconhecimento_tips',
        requirements: ['req_apostilled_diploma', 'req_transcripts'],
        fields: [...standardFields, { id: 'course', label: 'field_course', placeholder: 'place_course', type: 'text' }]
    },
    {
    id: 'dge_secundario_equivalencia',
    title: 'dge_secundario_equivalencia',
    category: CATEGORIES.EDUCATION,
    complexity: 'Medium',
    authority: 'DGE',
    location: 'loc_escola_secundaria',
    description: 'dge_secundario_equivalencia_desc',
    explanation: 'expl_dge_secundario_equivalencia',
    purpose: 'dge_secundario_equivalencia_purpose',
    tips: 'dge_secundario_equivalencia_tips',
    requirements: ['req_apostilled_diploma'],
    fields: [...standardFields],
},
// --- REVALIDAÇÃO DE DIPLOMA (TODAS AS OPÇÕES) ---
{
            id: 'revalidacao_diploma_autenticacao',
            title: 'revalidacao_diploma_autenticacao',
            category: CATEGORIES.EDUCATION,
            complexity: 'Medium',
            authority: 'DGES',
            location: 'loc_portal_dges',
            description: 'revalidacao_diploma_autenticacao_desc',
            explanation: 'revalidacao_diploma_autenticacao_expl',
            purpose: 'revalidacao_diploma_autenticacao_purpose',
            tips: 'revalidacao_diploma_autenticacao_tips',
            requirements: ['req_apostilled_diploma', 'req_transcripts'],
            fields: [...standardFields]
        },
        {
            id: 'revalidacao_diploma_equivalencia',
            title: 'revalidacao_diploma_equivalencia',
            category: CATEGORIES.EDUCATION,
            complexity: 'Hard',
            authority: 'DGE',
            location: 'loc_escola_secundaria',
            description: 'revalidacao_diploma_equivalencia_desc',
            explanation: 'revalidacao_diploma_equivalencia_expl',
            purpose: 'revalidacao_diploma_equivalencia_purpose',
            tips: 'revalidacao_diploma_equivalencia_tips',
            requirements: ['req_apostilled_diploma', 'req_secondary_transcripts'],
            fields: [...standardFields]
        },
        {
            id: 'revalidacao_diploma_extranjero',
            title: 'revalidacao_diploma_extranjero',
            category: CATEGORIES.EDUCATION,
            complexity: 'Hard',
            authority: 'DGESCO',
            location: 'loc_portal_dg_esco',
            description: 'revalidacao_diploma_extranjero_desc',
            explanation: 'revalidacao_diploma_extranjero_expl',
            purpose: 'revalidacao_diploma_extranjero_purpose',
            tips: 'revalidacao_diploma_extranjero_tips',
            requirements: ['req_apostilled_diploma', 'req_translation_certified'],
            fields: [...standardFields]
        },

    // --- DIREITOS E APOIOS SOCIAIS ---
    {
        id: 'denuncia_discriminacao', title: 'denuncia_discriminacao', category: CATEGORIES.SOCIAL_SUPPORT, complexity: 'Medium', authority: 'CICDR', location: 'loc_online',
        description: 'denuncia_discriminacao_desc',
        explanation: 'expl_denuncia_discriminacao',
        purpose: 'denuncia_discriminacao_purpose',
        tips: 'denuncia_discriminacao_tips',
        requirements: ['req_incident_report'],
        fields: [...standardFields, { id: 'incident_date', label: 'field_incident_date', placeholder: 'place_incident_date', type: 'date' }]
    },
    {
        id: 'dec_violencia_domestica', title: 'dec_violencia_domestica', category: CATEGORIES.SOCIAL_SUPPORT, complexity: 'Medium', authority: 'PSP / GNR', location: 'loc_esquadra',
        description: 'dec_violencia_domestica_desc',
        explanation: 'expl_dec_violencia_domestica',
        purpose: 'dec_violencia_domestica_purpose',
        tips: 'dec_violencia_domestica_tips',
        requirements: ['req_complaint'],
        fields: [...standardFields]
    },

    // --- HABITAÇÃO ---
    {
        id: 'apoio_arrendamento', title: 'apoio_arrendamento', category: CATEGORIES.HOUSING, complexity: 'Hard', authority: 'IHRU', location: 'loc_portal_habitacao',
        description: 'apoio_arrendamento_desc',
        explanation: 'expl_apoio_arrendamento',
        purpose: 'apoio_arrendamento_purpose',
        tips: 'apoio_arrendamento_tips',
        requirements: ['req_lease_agreement', 'req_income'],
        fields: [...standardFields, { id: 'rent', label: 'field_rent', placeholder: 'place_rent', type: 'number' }]
    },
    {
        id: 'junta_morada', title: 'junta_morada', category: CATEGORIES.HOUSING, complexity: 'Easy', authority: 'Junta Freguesia', location: 'loc_junta',
        description: 'junta_morada_desc',
        explanation: 'expl_junta_morada',
        purpose: 'junta_morada_purpose',
        tips: 'junta_morada_tips',
        requirements: ['req_id', 'req_residence_proof'],
        fields: [...standardFields]
    },

    // --- TÁTICOS MIRA (SOBREVIVÊNCIA E DEFESA LEGAIS) ---
    {
        id: 'aima_deferimento_tacito', title: 'aima_deferimento_tacito', category: CATEGORIES.IMMIGRATION, complexity: 'Hard', authority: 'AIMA', location: 'loc_aima',
        description: 'aima_deferimento_tacito_desc',
        explanation: 'aima_deferimento_tacito_expl',
        purpose: 'aima_deferimento_tacito_purpose',
        tips: 'aima_deferimento_tacito_tips',
        requirements: ['req_submission_proof', 'req_passport'],
        fields: [...standardFields, { id: 'process_number', label: 'field_process_number', placeholder: 'place_process_number', type: 'text' }]
    },
    {
        id: 'aima_audiencia_previa', title: 'aima_audiencia_previa', category: CATEGORIES.IMMIGRATION, complexity: 'Hard', authority: 'AIMA', location: 'loc_aima',
        description: 'aima_audiencia_previa_desc',
        explanation: 'aima_audiencia_previa_expl',
        purpose: 'aima_audiencia_previa_purpose',
        tips: 'aima_audiencia_previa_tips',
        requirements: ['req_notification_copy', 'req_new_docs'],
        fields: [
            ...standardFields,
            { id: 'process_number', label: 'field_process_number', placeholder: 'place_process_number', type: 'text' },
            { id: 'notification_date', label: 'field_notification_date', placeholder: 'place_notification_date', type: 'date' },
            { id: 'defense_arguments', label: 'field_defense_arguments', placeholder: 'place_defense_arguments', type: 'text' },
            { id: 'attached_documents', label: 'field_attached_documents', placeholder: 'place_attached_documents', type: 'text' }
        ]
    },
    {
        id: 'recurso_hierarquico_visto', title: 'recurso_hierarquico_visto', category: CATEGORIES.IMMIGRATION, complexity: 'Hard', authority: 'MNE', location: 'loc_mne',
        description: 'recurso_hierarquico_visto_desc',
        explanation: 'recurso_hierarquico_visto_expl',
        purpose: 'recurso_hierarquico_visto_purpose',
        tips: 'recurso_hierarquico_visto_tips',
        requirements: ['req_refusal_copy', 'req_defense_arguments'],
        fields: [...standardFields, { id: 'visa_type', label: 'field_visa_type', placeholder: 'place_visa_type', type: 'text' }, { id: 'refusal_date', label: 'field_refusal_date', placeholder: 'place_refusal_date', type: 'date' }]
    },
    {
        id: 'promessa_trabalho_art88', title: 'promessa_trabalho_art88', category: CATEGORIES.WORK, complexity: 'Medium', authority: 'Empregador', location: 'loc_empresa',
        description: 'promessa_trabalho_art88_desc',
        explanation: 'expl_promessa_trabalho_art88',
        purpose: 'promessa_trabalho_art88_purpose',
        tips: 'promessa_trabalho_art88_tips',
        requirements: ['req_company_data', 'req_worker_data'],
        fields: [...standardFields, { id: 'company_nif', label: 'field_company_nif', placeholder: 'place_company_nif', type: 'text' }]
    },
    {
        id: 'sef_declaracao_entrada', title: 'sef_declaracao_entrada', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'PSP / GNR / AIMA', location: 'loc_esquadra',
        description: 'sef_declaracao_entrada_desc',
        explanation: 'expl_sef_declaracao_entrada',
        purpose: 'sef_declaracao_entrada_purpose',
        tips: 'sef_declaracao_entrada_tips',
        requirements: ['req_passport', 'req_flight_ticket'],
        fields: [...standardFields, { id: 'entry_date', label: 'field_entry_date', placeholder: 'place_entry_date', type: 'date' }, { id: 'border_point', label: 'field_border_point', placeholder: 'place_border_point', type: 'text' }]
    },
    {
        id: 'work_contract_template', title: 'work_contract_template', category: CATEGORIES.WORK, complexity: 'Medium', authority: 'Empregador', location: 'loc_empresa',
        description: 'work_contract_template_desc',
        explanation: 'expl_work_contract_template',
        purpose: 'work_contract_template_purpose',
        tips: 'work_contract_template_tips',
        requirements: ['req_company_data', 'req_worker_data'],
        fields: [...standardFields, { id: 'company_nif', label: 'field_company_nif', placeholder: 'place_company_nif', type: 'text' }]
    },
    {
        id: 'nomad_income_proof', title: 'nomad_income_proof', category: CATEGORIES.FINANCE, complexity: 'Medium', authority: 'AIMA', location: 'loc_aima',
        description: 'nomad_income_proof_desc',
        explanation: 'expl_nomad_income_proof',
        purpose: 'nomad_income_proof_purpose',
        tips: 'nomad_income_proof_tips',
        requirements: ['req_passport', 'req_income_proof'],
        fields: [...standardFields]
    },
    {
        id: 'imt_troca_carta', title: 'imt_troca_carta', category: CATEGORIES.IMMIGRATION, complexity: 'Medium', authority: 'IMT', location: 'loc_imt',
        description: 'imt_troca_carta_desc',
        explanation: 'imt_troca_carta_expl',
        purpose: 'imt_troca_carta_purpose',
        tips: 'imt_troca_carta_tips',
        requirements: ['req_passport', 'req_medical_cert', 'req_foreign_license'],
        fields: [...standardFields, { id: 'license_num', label: 'Número da Carta', placeholder: 'Ex: 12345678', type: 'text' }]
    },
    {
        id: 'junta_atestado_residencia', title: 'junta_atestado_residencia', category: CATEGORIES.IMMIGRATION, complexity: 'Medium', authority: 'Junta', location: 'loc_junta',
        description: 'junta_atestado_residencia_desc',
        explanation: 'junta_atestado_residencia_expl',
        purpose: 'junta_atestado_residencia_purpose',
        tips: 'junta_atestado_residencia_tips',
        requirements: ['req_passport', 'req_nif', 'req_witness_signatures'],
        fields: [...standardFields, { id: 'witness_1_name', label: 'Nome Testemunha 1', placeholder: 'Nome completo', type: 'text' }, { id: 'witness_2_name', label: 'Nome Testemunha 2', placeholder: 'Nome completo', type: 'text' }]
    },
    {
        id: 'at_declaracao_cedencia', title: 'at_declaracao_cedencia', category: CATEGORIES.IMMIGRATION, complexity: 'Easy', authority: 'Finanças', location: 'loc_financas',
        description: 'at_declaracao_cedencia_desc',
        explanation: 'at_declaracao_cedencia_expl',
        purpose: 'at_declaracao_cedencia_purpose',
        tips: 'at_declaracao_cedencia_tips',
        requirements: ['req_passport', 'req_proof_address', 'req_host_data'],
        fields: [...standardFields, { id: 'host_name', label: 'Nome do Proprietário', placeholder: 'Nome completo', type: 'text' }, { id: 'host_nif', label: 'NIF do Proprietário', placeholder: 'NIF', type: 'text' }]
    },
    {
        id: 'abertura_conta_bancaria', title: 'abertura_conta_bancaria', category: CATEGORIES.FINANCE, complexity: 'Easy', authority: 'Banco', location: 'loc_banco',
        description: 'abertura_conta_bancaria_desc',
        explanation: 'abertura_conta_bancaria_expl',
        purpose: 'abertura_conta_bancaria_purpose',
        tips: 'abertura_conta_bancaria_tips',
        requirements: ['req_passport', 'req_nif', 'req_income_proof', 'req_proof_address'],
        fields: [...standardFields, { id: 'profession', label: 'Profissão', placeholder: 'Sua profissão', type: 'text' }, { id: 'initial_deposit', label: 'Depósito Inicial (€)', placeholder: 'Ex: 100', type: 'text' }]
    },
    {
        id: 'school_enrollment_kids', title: 'school_enrollment_kids', category: CATEGORIES.EDUCATION, complexity: 'Medium', authority: 'DGEstE', location: 'loc_escola_secundaria',
        description: 'school_enrollment_kids_desc',
        explanation: 'school_enrollment_kids_expl',
        purpose: 'school_enrollment_kids_purpose',
        tips: 'school_enrollment_kids_tips',
        requirements: ['req_passport', 'req_vaccines', 'req_proof_address', 'req_school_transcripts'],
        fields: [...standardFields, { id: 'child_name', label: 'Nome do Menor', placeholder: 'Nome completo do menor', type: 'text' }, { id: 'child_birth_date', label: 'Data de Nascimento', placeholder: 'DD/MM/AAAA', type: 'text' }]
    },
    {
        id: 'business_plan_d2', title: 'business_plan_d2', category: CATEGORIES.WORK, complexity: 'Hard', authority: 'IAPMEI / AIMA', location: 'loc_online',
        description: 'business_plan_d2_desc',
        explanation: 'business_plan_d2_expl',
        purpose: 'business_plan_d2_purpose',
        tips: 'business_plan_d2_tips',
        requirements: ['req_passport', 'req_nif', 'req_means_of_work'],
        fields: [...standardFields, { id: 'business_name', label: 'Nome do Projeto', placeholder: 'Ex: Café Alfa Lda.', type: 'text' }, { id: 'business_sector', label: 'Setor de Atividade', placeholder: 'Ex: Restauração', type: 'text' }, { id: 'investment_amount', label: 'Montante do Investimento', placeholder: 'Ex: €15.000', type: 'text' }, { id: 'business_description', label: 'Descrição do Projeto', placeholder: 'Descreva a atividade e viabilidade...', type: 'text' }]
    },
    {
        id: 'at_inicio_atividade_draft', title: 'at_inicio_atividade_draft', category: CATEGORIES.FINANCE, complexity: 'Medium', authority: 'AT', location: 'loc_portal_financas',
        description: 'at_inicio_atividade_draft_desc',
        explanation: 'at_inicio_atividade_draft_expl',
        purpose: 'at_inicio_atividade_draft_purpose',
        tips: 'at_inicio_atividade_draft_tips',
        requirements: ['req_passport', 'req_nif'],
        fields: [...standardFields, { id: 'cae_code', label: 'Código CAE/CIRS Principal', placeholder: 'Ex: 1519 ou 62020', type: 'text' }, { id: 'estimated_earnings', label: 'Rendimento Estimado Anual', placeholder: 'Ex: 12000', type: 'text' }, { id: 'vat_regime', label: 'Regime de IVA', placeholder: 'Ex: Isenção Art. 53 ou Regime Geral', type: 'text' }]
    },
    {
        id: 'estatutos_lda_minuta', title: 'estatutos_lda_minuta', category: CATEGORIES.WORK, complexity: 'Hard', authority: 'IRN', location: 'loc_loja_cidadao',
        description: 'estatutos_lda_minuta_desc',
        explanation: 'estatutos_lda_minuta_expl',
        purpose: 'estatutos_lda_minuta_purpose',
        tips: 'estatutos_lda_minuta_tips',
        requirements: ['req_passport', 'req_nif', 'req_company_data'],
        fields: [...standardFields, { id: 'company_name', label: 'Denominação da Sociedade', placeholder: 'Ex: Nova Rota Unipessoal Lda.', type: 'text' }, { id: 'share_capital', label: 'Capital Social (€)', placeholder: 'Ex: 5000', type: 'text' }, { id: 'company_purpose', label: 'Objeto Social Detalhado', placeholder: 'Ex: Consultoria informática e comércio...', type: 'text' }]
    },
    {
        id: 'at_reclamacao_graciosa_irs', title: 'at_reclamacao_graciosa_irs', category: CATEGORIES.FINANCE, complexity: 'Hard', authority: 'AT', location: 'loc_portal_financas',
        description: 'at_reclamacao_graciosa_irs_desc',
        explanation: 'at_reclamacao_graciosa_irs_expl',
        purpose: 'at_reclamacao_graciosa_irs_purpose',
        tips: 'at_reclamacao_graciosa_irs_tips',
        requirements: ['req_passport', 'req_nif', 'req_irs_proof'],
        fields: [...standardFields, { id: 'tax_year', label: 'Ano de Imposto (IRS)', placeholder: 'Ex: 2025', type: 'text' }, { id: 'assessment_number', label: 'N.º da Liquidação de IRS', placeholder: 'Ex: 2026 4005123456', type: 'text' }, { id: 'error_description', label: 'Erro Detetado', placeholder: 'Descreva o erro nas despesas ou retenções...', type: 'text' }]
    },
    {
        id: 'at_isencao_rnh_req', title: 'at_isencao_rnh_req', category: CATEGORIES.FINANCE, complexity: 'Medium', authority: 'AT', location: 'loc_portal_financas',
        description: 'at_isencao_rnh_req_desc',
        explanation: 'at_isencao_rnh_req_expl',
        purpose: 'at_isencao_rnh_req_purpose',
        tips: 'at_isencao_rnh_req_tips',
        requirements: ['req_passport', 'req_nif', 'req_residence_proof'],
        fields: [...standardFields, { id: 'rnh_activity_code', label: 'Código de Atividade RNH', placeholder: 'Ex: 112 Médicos ou 251 TI', type: 'text' }]
    },
    {
        id: 'at_alteracao_morada_estrangeiro', title: 'at_alteracao_morada_estrangeiro', category: CATEGORIES.FINANCE, complexity: 'Easy', authority: 'AT', location: 'loc_financas',
        description: 'at_alteracao_morada_estrangeiro_desc',
        explanation: 'at_alteracao_morada_estrangeiro_expl',
        purpose: 'at_alteracao_morada_estrangeiro_purpose',
        tips: 'at_alteracao_morada_estrangeiro_tips',
        requirements: ['req_passport', 'req_nif', 'req_residence_proof'],
        fields: [...standardFields, { id: 'new_portuguese_address', label: 'Nova Morada em Portugal', placeholder: 'Rua, nº, código postal, cidade', type: 'text' }, { id: 'effect_date', label: 'Data de Efeito', placeholder: 'DD/MM/AAAA', type: 'text' }]
    },
    {
        id: 'ss_pensao_velhice_req', title: 'ss_pensao_velhice_req', category: CATEGORIES.SOCIAL_SECURITY, complexity: 'Hard', authority: 'Segurança Social', location: 'loc_ss_direta',
        description: 'ss_pensao_velhice_req_desc',
        explanation: 'ss_pensao_velhice_req_expl',
        purpose: 'ss_pensao_velhice_req_purpose',
        tips: 'ss_pensao_velhice_req_tips',
        requirements: ['req_passport', 'req_nif', 'req_niss'],
        fields: [...standardFields, { id: 'retirement_age', label: 'Idade de Reforma', placeholder: 'Ex: 66 anos e 4 meses', type: 'text' }, { id: 'contributions_years', label: 'Anos de Desconto em Portugal', placeholder: 'Ex: 15 anos', type: 'text' }]
    },
    {
        id: 'ss_contagem_tempo_estrangeiro', title: 'ss_contagem_tempo_estrangeiro', category: CATEGORIES.SOCIAL_SECURITY, complexity: 'Hard', authority: 'Segurança Social', location: 'loc_ss',
        description: 'ss_contagem_tempo_estrangeiro_desc',
        explanation: 'ss_contagem_tempo_estrangeiro_expl',
        purpose: 'ss_contagem_tempo_estrangeiro_purpose',
        tips: 'ss_contagem_tempo_estrangeiro_tips',
        requirements: ['req_passport', 'req_nif', 'req_niss'],
        fields: [...standardFields, { id: 'foreign_ss_number', label: 'N.º SS Estrangeiro', placeholder: 'Ex: PIS/NIT no Brasil', type: 'text' }, { id: 'foreign_country', label: 'País de Origem', placeholder: 'Ex: Brasil', type: 'text' }, { id: 'employment_periods', label: 'Período(s) Trabalhado(s)', placeholder: 'Ex: 1995 a 2010', type: 'text' }]
    }
];

export const serviceGuides = [
    {
        id: 'g_parlamento_vistos_2026', category: CATEGORIES.IMMIGRATION, title: 'g_parlamento_vistos_2026_title', authority: 'Assembleia da República / AIMA / MNE',
        description: 'g_parlamento_vistos_2026_desc',
        explanation: 'g_parlamento_vistos_2026_expl',
        steps: [
            { docName: '1. Fim das Manifestações de Interesse (Lei 61/2025 & DL 37-A/2024)', whereToGet: 'Extinção definitiva dos Artigos 88.º n.º 2 e 89.º n.º 2. Obrigatoriedade de visto prévio no Consulado de origem.' },
            { docName: '2. Visto de Procura de Trabalho (D8)', whereToGet: 'Exigência de validação prévia de qualificações técnicas ou oferta prévia de emprego.' },
            { docName: '3. Autorização de Residência CPLP', whereToGet: 'Processamento regulado com emissão prévia no consulado e agendamento oficial AIMA.' },
            { docName: '4. Reagrupamento Familiar Reforçado', whereToGet: 'Aprovação de requisitos mais estritos de alojamento, subsistência e tempo de residência prévia.' },
            { docName: '5. Descentralização dos Processos AIMA', whereToGet: 'Ações judiciais por atraso passam a ser julgadas nos tribunais administrativos da residência do utente.' }
        ],
        faq: [
            { q: 'Posso entrar como turista e pedir regularização em Portugal?', a: 'Não. O Parlamento extinguiu a regularização via estatuto de turista. É obrigatório obter o visto no Consulado antes de viajar.' },
            { q: 'Como funcionam os processos antigos submetidos antes da mudança?', a: 'Os processos pendentes anteriores continuam sob regime transitório a ser analisados e concluídos pela AIMA.' }
        ]
    },
    {
        id: 'g_manifestacao_cima', category: CATEGORIES.IMMIGRATION, title: 'g_manifestacao_cima_title', authority: 'AIMA',
        description: 'g_manifestacao_cima_desc',
        explanation: 'g_manifestacao_cima_expl',
        steps: [
            { docName: 'Obter Visto no Consulado do País de Origem', whereToGet: 'Obrigatório para entrar legalmente em Portugal com intenção de trabalhar (Visto D1, D2, D3 ou Visto de Procura de Trabalho).' },
            { docName: 'Agendamento na AIMA após chegada', whereToGet: 'Via portal aima.gov.pt — para requerer a Autorização de Residência.' },
            { docName: 'NIF e NISS', whereToGet: 'AT (Finanças) e Segurança Social — obtê-los logo na chegada.' }
        ],
        faq: [{ q: 'A Manifestação de Interesse ainda existe?', a: 'Não. Foi extinta em 2024. Desde então, é obrigatório obter o visto no consulado antes de vir para Portugal. Processos submetidos antes de Junho 2024 continuam a ser tramitados — consulte aima.gov.pt.' }]
    },
    {
        id: 'g_cnaim_triagem', category: CATEGORIES.IMMIGRATION, title: 'g_cnaim_triagem_title', authority: 'CNAIM (gov.pt)',
        description: 'g_cnaim_triagem_desc',
        explanation: 'g_cnaim_triagem_expl',
        steps: [
            { docName: 'Ligar para a Linha', whereToGet: 'Via telefone.' },
            { docName: 'Registo Prévio', whereToGet: 'Identificação básica e motivo da ida ao CNAIM.' }
        ],
        faq: [{ q: 'Posso ir sem marcação?', a: 'Normalmente não, salvo emergências documentadas.' }]
    },
    {
        id: 'g_irn_cidadania', category: CATEGORIES.RIGHTS, title: 'g_irn_cidadania_title', authority: 'IRN / gov.pt',
        description: 'g_irn_cidadania_desc',
        explanation: 'g_irn_cidadania_expl',
        steps: [
            { docName: 'Passaporte', whereToGet: 'Cópia integral e traduzida se aplicável.' },
            { docName: 'Certificado de Nível A2 de Português', whereToGet: 'CIPLE ou escola oficial certificada. ⚠️ Dispensado para cidadãos da CPLP (Brasil, Angola, Cabo Verde, etc.).' },
            { docName: 'Registo Criminal', whereToGet: 'País de origem e países onde habitou mais de 1 ano.' },
            { docName: 'Comprovativo de Residência Legal', whereToGet: 'Mínimo 7 anos (CPLP) ou 10 anos (outras nacionalidades) — Nova Lei da Nacionalidade, Maio 2026.' }
        ],
        faq: [{ q: 'Onde encontro as leis base?', a: 'Toda a jurisprudência está em diariodarepublica.pt ou eur-lex.europa.eu para diretivas europeias.' }]
    },
    {
        id: 'g_dges_reconhecimento', category: CATEGORIES.EDUCATION, title: 'g_dges_reconhecimento_title', authority: 'DGES',
        description: 'g_dges_reconhecimento_desc',
        explanation: 'g_dges_reconhecimento_expl',
        steps: [
            { docName: 'Criar conta na DGES', whereToGet: 'Em dges.gov.pt/pt' },
            { docName: 'Preparar Diploma com Apostila de Haia', whereToGet: 'Emitido no país onde estudou.' },
            { docName: 'Pagar a Taxa de Serviço', whereToGet: 'Referência Multibanco gerada na plataforma.' }
        ],
        faq: [{ q: 'É imediato?', a: 'O Reconhecimento Automático leva até 30 dias; os específicos podem levar vários meses.' }]
    },
    {
        id: 'g_ss_direta', category: CATEGORIES.FINANCE, title: 'g_ss_direta_title', authority: 'Segurança Social',
        description: 'g_ss_direta_desc',
        explanation: 'g_ss_direta_expl',
        steps: [
            { docName: 'Chave Móvel Digital ou Senha SS', whereToGet: 'gov.pt (Chave Móvel) ou no balcão físico da SS.' },
            { docName: 'IBAN na plataforma', whereToGet: 'Obrigatório para receber qualquer valor.' }
        ],
        faq: [{ q: 'Como sei se os descontos estão registados?', a: 'Na SS Direta, vá a Remunerações > Conta-Corrente.' }]
    },
    {
        id: 'g_sns_24', category: CATEGORIES.HEALTH, title: 'g_sns_24_title', authority: 'SNS',
        description: 'g_sns_24_desc',
        explanation: 'g_sns_24_expl',
        steps: [
            { docName: 'Chave Móvel Digital', whereToGet: 'Ativada remotamente ou no Espaço Cidadão.' },
            { docName: 'App SNS 24', whereToGet: 'Instalar na App Store ou Play Store.' }
        ],
        faq: [{ q: 'O que é a Triagem da Linha SNS 24?', a: 'Ligue 808 24 24 24 antes de ir às urgências para ser aconselhado e triado.' }]
    },
    {
        id: 'g_estatuto_igualdade', category: CATEGORIES.RIGHTS, title: 'g_estatuto_igualdade_title', authority: 'IRN / AIMA',
        description: 'g_estatuto_igualdade_desc',
        explanation: 'g_estatuto_igualdade_expl',
        steps: [
            { docName: 'Certificado de Residência', whereToGet: 'Emitido pela AIMA.' },
            { docName: 'Requerimento de Igualdade', whereToGet: 'Submetido online ou via Conservatória.' }
        ],
        faq: [{ q: 'Dá direito a passaporte?', a: 'Não. O Estatuto não concede nacionalidade, apenas igualdade de direitos civis/políticos.' }]
    },
    {
        id: 'g_estatuto_igualdade_cartao_cidadao', category: CATEGORIES.RIGHTS, title: 'Estatuto de Direitos Iguais (2 Tipos) & Cartão de Cidadão para Estrangeiro', authority: 'IRN / AIMA / Consulado do Brasil',
        description: 'Guia completo do Estatuto de Igualdade de Direitos Civis e Direitos Políticos (Tratado de Porto Seguro) e emissão do Cartão de Cidadão Português para Estrangeiros com Chave Móvel Digital.',
        explanation: 'O Tratado de Porto Seguro entre Portugal e o Brasil permite que cidadãos brasileiros a residir legalmente em Portugal usufruam de igualdade de direitos. Existem dois tipos de Estatuto:\n\n1. Estatuto de Direitos Civis: Dá acesso a concursos públicos, exercer qualquer profissão, saúde no SNS, segurança social e criação de empresas em igualdade com portugueses (exige Título de Residência válido).\n2. Estatuto de Direitos Políticos: Concede o direito de votar e ser votado nas eleições autárquicas e legislativas (exige 3 anos de residência legal).\n\nApós o deferimento do Estatuto de Igualdade pelo IRN, o cidadão pode solicitar o Cartão de Cidadão para Estrangeiro num balcão do IRN e ativar a Chave Móvel Digital (CMD).',
        steps: [
            { docName: '1. Certificado de Nacionalidade e Pleno Gozo de Direitos', whereToGet: 'Emitido pelo Consulado do Brasil em Portugal (Lisboa, Porto ou Faro).' },
            { docName: '2. Título de Residência Válido / Certificado AIMA', whereToGet: 'Emitido pela AIMA.' },
            { docName: '3. Requerimento do Estatuto de Direitos Iguais no IRN', whereToGet: 'Entregue num balcão do IRN ou via Conservatória do Registo Civil.' },
            { docName: '4. Pedido do Cartão de Cidadão para Estrangeiro', whereToGet: 'Após publicação do Estatuto no Diário da República, agende no IRN / Lojas do Cidadão para emitir o Cartão de Cidadão físico e ativar a Chave Móvel Digital.' }
        ],
        faq: [
            { q: 'Quais são os 2 tipos de Estatuto de Direitos Iguais?', a: 'Tipo 1: Direitos Civis (concursos públicos, negócios, trabalho, saúde e SS em igualdade com portugueses); Tipo 2: Direitos Políticos (votar e ser votado em eleições em Portugal, requer 3 anos de residência).' },
            { q: 'O Cartão de Cidadão para Estrangeiro dá direito a passaporte português?', a: 'Não. O Cartão de Cidadão para Estrangeiro atesta o Estatuto de Igualdade e a Chave Móvel Digital, mas mantém a nacionalidade brasileira e o passaporte de origem.' },
            { q: 'Posso fazer concursos públicos em Portugal com o Estatuto?', a: 'Sim! Com o Estatuto de Direitos Civis, o cidadão brasileiro pode concorrer à função pública em Portugal em igualdade de condições.' }
        ]
    },
    {
        id: 'g_direitos_politicos', category: CATEGORIES.RIGHTS, title: 'g_direitos_politicos_title', authority: 'IRN / CNE',
        description: 'g_direitos_politicos_desc',
        explanation: 'g_direitos_politicos_expl',
        steps: [
            { docName: 'Recenseamento Eleitoral', whereToGet: 'Automático para portadores de CC ou via Comissão de Recenseamento.' },
            { docName: 'Declaração de Opção', whereToGet: 'Apenas necessária em casos específicos de múltiplas nacionalidades.' }
        ],
        faq: [{ q: 'Quando posso votar?', a: 'Depende da nacionalidade. Brasileiros com Estatuto de Direitos Políticos e outros com 2-5 anos de residência.' }]
    },
    {
        id: 'g_indeferimento_ajuda', category: CATEGORIES.IMMIGRATION, title: 'g_indeferimento_ajuda_title', authority: 'AIMA / CPA',
        description: 'g_indeferimento_ajuda_desc',
        explanation: 'g_indeferimento_ajuda_expl',
        steps: [
            { docName: 'Minuta de Audiência Prévia (Resposta a Indeferimento)', whereToGet: 'Disponível acima no gerador de documentos MIRA.' },
            { docName: 'Anexos a Pedidos na Notificação', whereToGet: 'Junte NIF, Passaporte Novo ou SS se era isso que faltava e envie via CTT Registado urgente.' }
        ],
        faq: [{ q: 'Posso pedir ajuda a advogado?', a: 'Sim, mas se o prazo for curto, preencha o MIRA, assine, envie com CTT registado, e procure advogado DEPOIS. O prazo não pausa!' }]
    },
    {
        id: 'g_apoio_humanitario', category: CATEGORIES.HUMANITARIAN, title: 'g_apoio_humanitario_title', authority: 'CPR / AIMA',
        description: 'g_apoio_humanitario_desc',
        explanation: 'g_apoio_humanitario_expl',
        steps: [
            { docName: 'Contacto com CPR', whereToGet: 'Conselho Português para os Refugiados.' },
            { docName: 'Registo de Pedido', whereToGet: 'Centros de acolhimento (ex: Bobadela).' }
        ],
        faq: [{ q: 'Onde posso dormir hoje?', a: 'O CPR e a Santa Casa da Misericórdia gerem centros de emergência. Dirija-se a um balcão da AIMA ou esquadra da PSP para sinalização.' }]
    },
    {
        id: 'g_bancos_alimentos', category: CATEGORIES.HUMANITARIAN, title: 'g_bancos_alimentos_title', authority: 'Juntas / ONGs',
        description: 'g_bancos_alimentos_desc',
        explanation: 'g_bancos_alimentos_expl',
        steps: [
            { docName: 'Inscrição na Junta', whereToGet: 'Junta de Freguesia da sua área.' },
            { docName: 'Prova de Rendimentos', whereToGet: 'SS Direta (Histórico de Remunerações).' }
        ],
        faq: [{ q: 'Quem tem direito?', a: 'Pessoas com rendimentos abaixo do limiar de pobreza ou em situação de desemprego sem subsídio.' }]
    },
    {
        id: 'g_apoio_psicologico', category: CATEGORIES.WELLBEING, title: 'g_apoio_psicologico_title', authority: 'SNS / NGOs',
        description: 'g_apoio_psicologico_desc',
        explanation: 'g_apoio_psicologico_expl',
        steps: [
            { docName: 'Consulta Centro de Saúde', whereToGet: 'SNS (Inscrição no Centro de Saúde).' },
            { docName: 'Sinalização Psicologia', whereToGet: 'Referenciamento pelo Médico de Família.' }
        ],
        faq: [{ q: 'É gratuito?', a: 'No SNS as consultas são isentas de taxas moderadoras para requerentes de proteção internacional.' }]
    },
    {
        id: 'g_equivalencia_notas', category: CATEGORIES.EDUCATION, title: 'g_equivalencia_notas_title', authority: 'DGES / DGE',
        description: 'g_equivalencia_notas_desc',
        explanation: 'g_equivalencia_notas_expl',
        steps: [
            { docName: 'step_eq_1_title', whereToGet: 'step_eq_1_desc' },
            { docName: 'step_eq_2_title', whereToGet: 'step_eq_2_desc' },
            { docName: 'step_eq_3_title', whereToGet: 'step_eq_3_desc' },
            { docName: 'step_eq_4_title', whereToGet: 'step_eq_4_desc' }
        ],
        faq: [
            { q: 'faq_eq_1_q', a: 'faq_eq_1_a' },
            { q: 'faq_eq_2_q', a: 'faq_eq_2_a' },
            { q: 'faq_eq_3_q', a: 'faq_eq_3_a' }
        ]
    }
];
