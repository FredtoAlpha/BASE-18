/**
 * ===================================================================
 * 📖 STRUCTURE READER - MODULE CENTRALISÉ
 * ===================================================================
 *
 * Module universel pour lire l'onglet _STRUCTURE
 * Supporte DEUX formats différents :
 *
 * 1. FORMAT LEGACY :
 *    Colonnes : CLASSE_ORIGINE | CLASSE_DEST | EFFECTIF | OPTIONS
 *    Exemple  : 6°1            | 6°1          | 28       | ITA=5,LATIN=2
 *
 * 2. FORMAT V3 (Pipeline V3) :
 *    Colonnes : Type   | Nom Classe | Capacité Max | Options (Quotas)
 *    Exemple  : SOURCE | 6°1        | 30           |
 *               TEST   | 6°1        | 28           | ITA=5,LATIN=2
 *
 * DÉTECTION AUTOMATIQUE du format basée sur les en-têtes
 * RETOUR UNIFIÉ utilisable par LEGACY et OPTI
 *
 * Date: 2025-11-27
 * ===================================================================
 */

/**
 * Point d'entrée principal - Lit _STRUCTURE avec détection automatique
 * @returns {Object} Données unifiées de structure
 */
function readStructure() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const structSheet = ss.getSheetByName('_STRUCTURE');

    if (!structSheet) {
      Logger.log('⚠️ StructureReader: Onglet _STRUCTURE introuvable');
      return {
        success: false,
        error: 'Onglet _STRUCTURE introuvable',
        format: null,
        mappings: [],
        sources: [],
        tests: [],
        defs: []
      };
    }

    const data = structSheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log('⚠️ StructureReader: _STRUCTURE vide');
      return {
        success: false,
        error: '_STRUCTURE vide',
        format: null,
        mappings: [],
        sources: [],
        tests: [],
        defs: []
      };
    }

    const headers = data[0];
    Logger.log('📋 StructureReader: En-têtes détectés: ' + headers.join(' | '));

    // DÉTECTION DU FORMAT
    const format = detectStructureFormat(headers);
    Logger.log('🔍 StructureReader: Format détecté = ' + format);

    // LECTURE SELON LE FORMAT
    let result;
    if (format === 'LEGACY') {
      result = readLegacyFormat(data);
    } else if (format === 'V3') {
      result = readV3Format(data);
    } else {
      Logger.log('❌ StructureReader: Format inconnu');
      return {
        success: false,
        error: 'Format _STRUCTURE inconnu',
        format: 'UNKNOWN',
        mappings: [],
        sources: [],
        tests: [],
        defs: []
      };
    }

    result.success = true;
    result.format = format;

    Logger.log(`✅ StructureReader: ${result.mappings.length} mappings, ${result.sources.length} sources, ${result.tests.length} tests`);

    return result;

  } catch (e) {
    Logger.log('❌ StructureReader: Erreur = ' + e.message);
    return {
      success: false,
      error: e.message,
      format: null,
      mappings: [],
      sources: [],
      tests: [],
      defs: []
    };
  }
}

/**
 * Détecte le format de _STRUCTURE basé sur les en-têtes
 * @param {Array} headers - Ligne d'en-tête
 * @returns {string} 'LEGACY', 'V3', ou 'UNKNOWN'
 */
function detectStructureFormat(headers) {
  const headersStr = headers.map(h => String(h).trim().toUpperCase()).join('|');

  // Format LEGACY : doit contenir CLASSE_ORIGINE et CLASSE_DEST
  const hasClasseOrigin = headers.some(h => String(h).trim().toUpperCase() === 'CLASSE_ORIGINE');
  const hasClasseDest = headers.some(h => String(h).trim().toUpperCase() === 'CLASSE_DEST');

  if (hasClasseOrigin && hasClasseDest) {
    return 'LEGACY';
  }

  // Format V3 : doit contenir Type et "Nom Classe"
  const hasType = headers.some(h => String(h).trim().toUpperCase() === 'TYPE');
  const hasNomClasse = headers.some(h => {
    const normalized = String(h).trim().toUpperCase().replace(/\s+/g, '');
    return normalized === 'NOMCLASSE' || normalized === 'NOM';
  });

  if (hasType && hasNomClasse) {
    return 'V3';
  }

  return 'UNKNOWN';
}

/**
 * Lit _STRUCTURE au format LEGACY
 * @param {Array} data - Données complètes de _STRUCTURE
 * @returns {Object} Résultat unifié
 */
function readLegacyFormat(data) {
  const headers = data[0];

  // Trouver les indices des colonnes
  const idxOrigin = headers.findIndex(h => String(h).trim().toUpperCase() === 'CLASSE_ORIGINE');
  const idxDest = headers.findIndex(h => String(h).trim().toUpperCase() === 'CLASSE_DEST');
  const idxEffectif = headers.findIndex(h => String(h).trim().toUpperCase() === 'EFFECTIF');
  const idxOptions = headers.findIndex(h => String(h).trim().toUpperCase() === 'OPTIONS');

  const mappings = [];
  const sources = [];
  const tests = [];
  const sourcesSet = new Set();
  const testsSet = new Set();

  // Parcourir les lignes
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const origin = String(row[idxOrigin] || '').trim();
    const dest = String(row[idxDest] || '').trim();
    const effectif = parseInt(row[idxEffectif]) || 28;
    const optionsStr = String(row[idxOptions] || '').trim();

    // Ignorer les lignes vides
    if (!origin && !dest) continue;

    // Parser les options (format: "ITA=5,LATIN=2")
    const options = parseOptionsString(optionsStr);

    // Créer le mapping
    if (origin && dest) {
      mappings.push({
        source: origin,
        dest: dest,
        effectif: effectif,
        options: options,
        optionsStr: optionsStr
      });

      // Ajouter aux sets pour éviter les doublons
      if (!sourcesSet.has(origin)) {
        sourcesSet.add(origin);
        sources.push({
          nom: origin,
          capacite: effectif,
          options: {},
          optionsStr: ''
        });
      }

      if (!testsSet.has(dest)) {
        testsSet.add(dest);
        tests.push({
          nom: dest,
          capacite: effectif,
          options: options,
          optionsStr: optionsStr
        });
      }
    }
  }

  Logger.log(`📊 LEGACY: ${mappings.length} mappings détectés`);

  return {
    mappings: mappings,
    sources: sources,
    tests: tests,
    defs: [] // LEGACY ne gère pas les DEF dans _STRUCTURE
  };
}

/**
 * Lit _STRUCTURE au format V3
 * @param {Array} data - Données complètes de _STRUCTURE
 * @returns {Object} Résultat unifié
 */
function readV3Format(data) {
  const headers = data[0];

  // Trouver les indices des colonnes
  const idxType = headers.findIndex(h => String(h).trim().toUpperCase() === 'TYPE');
  const idxNom = headers.findIndex(h => {
    const normalized = String(h).trim().toUpperCase().replace(/\s+/g, '');
    return normalized === 'NOMCLASSE' || normalized === 'NOM';
  });
  const idxCapacite = headers.findIndex(h => {
    const normalized = String(h).trim().toUpperCase().replace(/\s+/g, '');
    return normalized.includes('CAPACITE') || normalized.includes('EFFECTIF');
  });
  const idxOptions = headers.findIndex(h => {
    const normalized = String(h).trim().toUpperCase();
    return normalized.includes('OPTIONS') || normalized.includes('QUOTAS');
  });

  const sources = [];
  const tests = [];
  const defs = [];
  const mappings = [];

  // Parcourir les lignes
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const type = String(row[idxType] || '').trim().toUpperCase();
    let nom = String(row[idxNom] || '').trim();
    const capacite = parseInt(row[idxCapacite]) || 28;
    const optionsStr = String(row[idxOptions] || '').trim();

    if (!nom) continue;

    // Nettoyer les suffixes (TEST/DEF/FIN) du nom si présents
    nom = nom.replace(/\s*(TEST|DEF|FIN|CACHE)\s*$/i, '').trim();

    const options = parseOptionsString(optionsStr);

    const classe = {
      nom: nom,
      capacite: capacite,
      options: options,
      optionsStr: optionsStr
    };

    // Classer par type
    if (type === 'SOURCE') {
      sources.push(classe);
    } else if (type === 'TEST') {
      tests.push(classe);
    } else if (type === 'DEF') {
      defs.push(classe);
    }
  }

  // CRÉER LES MAPPINGS à partir des sources et tests
  // On suppose que l'ordre est cohérent (source[i] → test[i])
  const maxMappings = Math.min(sources.length, tests.length);
  for (let i = 0; i < maxMappings; i++) {
    mappings.push({
      source: sources[i].nom,
      dest: tests[i].nom,
      effectif: tests[i].capacite,
      options: tests[i].options,
      optionsStr: tests[i].optionsStr
    });
  }

  Logger.log(`📊 V3: ${sources.length} sources, ${tests.length} tests, ${defs.length} defs`);

  return {
    mappings: mappings,
    sources: sources,
    tests: tests,
    defs: defs
  };
}

/**
 * Parse une chaîne d'options (format: "ITA=5,LATIN=2")
 * @param {string} optionsStr - Chaîne à parser
 * @returns {Object} Options parsées {ITA: 5, LATIN: 2, ...}
 */
function parseOptionsString(optionsStr) {
  const options = {};

  if (!optionsStr || optionsStr.trim() === '') {
    return options;
  }

  const parts = optionsStr.split(',');

  for (const part of parts) {
    let key, value;

    // Supporter les deux séparateurs : = et :
    if (part.includes('=')) {
      [key, value] = part.split('=', 2);
    } else if (part.includes(':')) {
      [key, value] = part.split(':', 2);
    } else {
      key = part.trim();
      value = '0';
    }

    key = (key || '').trim().toUpperCase();
    value = parseInt(value) || 0;

    if (key) {
      options[key] = value;
    }
  }

  return options;
}

/**
 * ===================================================================
 * FONCTIONS UTILITAIRES
 * ===================================================================
 */

/**
 * Récupère uniquement les mappings source→dest
 * Utile pour LEGACY qui a besoin de cette info
 */
function getStructureMappings() {
  const result = readStructure();
  return result.success ? result.mappings : [];
}

/**
 * Récupère uniquement les classes TEST avec leurs quotas
 * Utile pour OPTI qui travaille sur les destinations
 */
function getStructureTests() {
  const result = readStructure();
  return result.success ? result.tests : [];
}

/**
 * Récupère toutes les classes par type
 * @returns {Object} {sources: [], tests: [], defs: []}
 */
function getStructureClasses() {
  const result = readStructure();
  return {
    sources: result.sources || [],
    tests: result.tests || [],
    defs: result.defs || []
  };
}

/**
 * Vérifie si _STRUCTURE existe et est valide
 * @returns {Object} {valid: boolean, format: string, error?: string}
 */
function validateStructure() {
  const result = readStructure();
  return {
    valid: result.success,
    format: result.format,
    error: result.error,
    nbMappings: result.mappings.length,
    nbSources: result.sources.length,
    nbTests: result.tests.length
  };
}

/**
 * ===================================================================
 * TESTS
 * ===================================================================
 */

/**
 * Fonction de test pour vérifier le module
 */
function testStructureReader() {
  Logger.log('\n' + '='.repeat(60));
  Logger.log('🧪 TEST StructureReader');
  Logger.log('='.repeat(60));

  const result = readStructure();

  Logger.log('\n📊 RÉSULTAT:');
  Logger.log('  - Success: ' + result.success);
  Logger.log('  - Format: ' + result.format);
  Logger.log('  - Mappings: ' + result.mappings.length);
  Logger.log('  - Sources: ' + result.sources.length);
  Logger.log('  - Tests: ' + result.tests.length);
  Logger.log('  - Defs: ' + result.defs.length);

  if (result.mappings.length > 0) {
    Logger.log('\n📋 PREMIER MAPPING:');
    const m = result.mappings[0];
    Logger.log('  ' + m.source + ' → ' + m.dest + ' (' + m.effectif + ' élèves)');
    Logger.log('  Options: ' + m.optionsStr);
    Logger.log('  Parsed: ' + JSON.stringify(m.options));
  }

  Logger.log('\n' + '='.repeat(60));

  return result;
}
