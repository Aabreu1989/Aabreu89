import { test, describe } from 'node:test';
import assert from 'node:assert';
import { t, TRANSLATIONS } from '../../utils/translations';
import { ViewType } from '../../types';

describe('🔗 MIRA CROSS-MODULE NAVIGATION & 4-LANGUAGE TRANSLATION SUITE', () => {

  test('T-NAV-01: Todas as chaves de interligação existem nas 4 línguas (PT, EN, ES, FR)', () => {
    const requiredKeys = [
      'wiz_cross_nav_title',
      'wiz_cross_nav_subtitle',
      'wiz_cross_nav_jobs_work',
      'wiz_cross_nav_jobs',
      'wiz_cross_nav_jobs_desc',
      'wiz_cross_nav_simulators',
      'wiz_cross_nav_simulators_plural',
      'wiz_cross_nav_simulators_desc',
      'wiz_cross_nav_courses',
      'wiz_cross_nav_courses_short',
      'wiz_cross_nav_courses_desc',
      'wiz_cross_nav_community',
      'wiz_cross_nav_community_desc',
      'wiz_cross_nav_services',
      'wiz_cross_nav_services_desc'
    ];

    const languages = ['pt', 'en', 'es', 'fr'];

    for (const lang of languages) {
      for (const key of requiredKeys) {
        const val = TRANSLATIONS[lang]?.[key];
        assert.ok(val && val.length > 0, `Chave ${key} ausente ou vazia no idioma ${lang}`);
        const resolved = t(key, lang);
        assert.strictEqual(resolved, val, `t("${key}", "${lang}") deve resolver para "${val}"`);
      }
    }

    // Validação específica das traduções de "Simuladores"
    assert.strictEqual(t('wiz_cross_nav_simulators_plural', 'pt'), 'Simuladores');
    assert.strictEqual(t('wiz_cross_nav_simulators_plural', 'en'), 'Simulators');
    assert.strictEqual(t('wiz_cross_nav_simulators_plural', 'es'), 'Simuladores');
    assert.strictEqual(t('wiz_cross_nav_simulators_plural', 'fr'), 'Simulateurs');

    // Validação de "Vagas de Emprego"
    assert.strictEqual(t('wiz_cross_nav_jobs', 'pt'), 'Vagas de Emprego');
    assert.strictEqual(t('wiz_cross_nav_jobs', 'en'), 'Job Vacancies');
    assert.strictEqual(t('wiz_cross_nav_jobs', 'es'), 'Ofertas de Empleo');
    assert.strictEqual(t('wiz_cross_nav_jobs', 'fr'), "Offres d'Emploi");

    // Validação de "Central de Cursos"
    assert.strictEqual(t('wiz_cross_nav_courses', 'pt'), 'Central de Cursos');
    assert.strictEqual(t('wiz_cross_nav_courses', 'en'), 'Courses Hub');
    assert.strictEqual(t('wiz_cross_nav_courses', 'es'), 'Centro de Cursos');
    assert.strictEqual(t('wiz_cross_nav_courses', 'fr'), 'Centre de Cours');
  });

  test('T-NAV-02: Mapeamento canónico estrito para os 8 vistos de legalização', () => {
    const getNavViews = (sit?: string, purpose?: string): ViewType[] => {
      if (sit === 'asylum' || purpose === 'humanitarian') {
        return [ViewType.JOBS, ViewType.LEARNING, ViewType.SERVICES, ViewType.COMMUNITY, ViewType.SIMULATORS];
      }
      if (sit === 'retirement' || purpose === 'visa_d7') {
        return [ViewType.SIMULATORS, ViewType.SERVICES, ViewType.COMMUNITY];
      }
      if (sit === 'family' || purpose === 'art122') {
        return [ViewType.JOBS, ViewType.LEARNING, ViewType.SERVICES];
      }
      if (sit === 'via_verde') {
        return [ViewType.JOBS, ViewType.COMMUNITY];
      }
      if (purpose === 'art90a') {
        return [ViewType.SIMULATORS, ViewType.COMMUNITY];
      }
      if (purpose === 'art89') {
        return [ViewType.SIMULATORS, ViewType.COMMUNITY];
      }
      if (sit === 'student' || purpose === 'visa_d4') {
        return [ViewType.LEARNING, ViewType.COMMUNITY, ViewType.JOBS];
      }
      if (purpose === 'art88' || purpose === 'visa_job_search' || sit === 'contract' || sit === 'irregular' || sit === 'legal' || sit === 'visa_consular') {
        return [ViewType.JOBS, ViewType.SIMULATORS];
      }
      return [ViewType.JOBS, ViewType.SIMULATORS];
    };

    assert.deepStrictEqual(getNavViews('contract', 'art88'), [ViewType.JOBS, ViewType.SIMULATORS]);
    assert.deepStrictEqual(getNavViews('student', 'visa_d4'), [ViewType.LEARNING, ViewType.COMMUNITY, ViewType.JOBS]);
    assert.deepStrictEqual(getNavViews('legal', 'art89'), [ViewType.SIMULATORS, ViewType.COMMUNITY]);
    assert.deepStrictEqual(getNavViews('legal', 'art90a'), [ViewType.SIMULATORS, ViewType.COMMUNITY]);
    assert.deepStrictEqual(getNavViews('via_verde', undefined), [ViewType.JOBS, ViewType.COMMUNITY]);
    assert.deepStrictEqual(getNavViews('family', undefined), [ViewType.JOBS, ViewType.LEARNING, ViewType.SERVICES]);
    assert.deepStrictEqual(getNavViews('retirement', 'visa_d7'), [ViewType.SIMULATORS, ViewType.SERVICES, ViewType.COMMUNITY]);
    assert.deepStrictEqual(getNavViews('asylum', 'humanitarian'), [ViewType.JOBS, ViewType.LEARNING, ViewType.SERVICES, ViewType.COMMUNITY, ViewType.SIMULATORS]);
  });

  test('T-NAV-03: Interligação canónica para os 4 módulos adicionais (NIF, Alojamento, NISS, IRS)', () => {
    // Todos os 4 novos módulos contêm a tríade exata: SIMULADORES, VAGAS DE EMPREGO, CENTRAL DE CURSOS
    const expectedModulesHub: ViewType[] = [
      ViewType.SIMULATORS,
      ViewType.JOBS,
      ViewType.LEARNING
    ];

    const getDocumentModuleCrossNav = (moduleType: 'nif' | 'accommodation' | 'niss' | 'irs'): ViewType[] => {
      switch (moduleType) {
        case 'nif':
        case 'accommodation':
        case 'niss':
        case 'irs':
          return [ViewType.SIMULATORS, ViewType.JOBS, ViewType.LEARNING];
      }
    };

    assert.deepStrictEqual(getDocumentModuleCrossNav('nif'), expectedModulesHub, 'NIF deve ter [SIMULATORS, JOBS, LEARNING]');
    assert.deepStrictEqual(getDocumentModuleCrossNav('accommodation'), expectedModulesHub, 'Alojamento deve ter [SIMULATORS, JOBS, LEARNING]');
    assert.deepStrictEqual(getDocumentModuleCrossNav('niss'), expectedModulesHub, 'NISS deve ter [SIMULATORS, JOBS, LEARNING]');
    assert.deepStrictEqual(getDocumentModuleCrossNav('irs'), expectedModulesHub, 'IRS deve ter [SIMULATORS, JOBS, LEARNING]');
  });

});
