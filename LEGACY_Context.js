/**
 * ===================================================================
 * 🔧 PRIME LEGACY - GESTION DU CONTEXTE
 * ===================================================================
 *
 * Gestion du contexte LEGACY pour le pipeline :
 * - Détection automatique des onglets sources (°1, °2, etc.)
 * - Lecture de la configuration depuis _STRUCTURE
 * - Génération des onglets TEST de destination
 *
 * ISOLATION COMPLÈTE :
 * - OPTI : _BASEOPTI → _CACHE
 * - LEGACY : Sources (°1, °2) → TEST
 *
 * Date : 2025-11-13
 * Branche : claude/PRIME-LEGACY-01SJDcJv7zHGGBXWhHpzfnxr
 *
 * ===================================================================
 */

// ===================================================================
// CONSTRUCTION DU CONTEXTE LEGACY
// ===================================================================

/**
 * Détecte automatiquement les onglets sources existants et crée un contexte
 * pour le pipeline LEGACY initial (Sources → TEST)
 *
 * @returns {Object} Contexte prêt pour les 4 phases LEGACY
 */
function makeCtxFromSourceSheets_LEGACY() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const allSheets = ss.getSheets();

  logLine('INFO', '🔍 Détection des onglets sources LEGACY...');

  // ========== ÉTAPE 1 : DÉTECTER ONGLETS SOURCES ==========
  const sourceSheets = [];

  // Pattern pour onglets sources : 6°1, ALBEXT°7, BONHOURE°2, etc. (toujours avec °)
  const sourcePattern = /^[A-Za-z0-9_-]+°\d+$/;
  // ❌ Exclure les onglets TEST, CACHE, DEF, FIN, etc.
  const excludePattern = /TEST|CACHE|DEF|FIN|SRC|SOURCE|_CONFIG|_STRUCTURE|_LOG/i;

  for (let i = 0; i < allSheets.length; i++) {
    const name = allSheets[i].getName();
    if (sourcePattern.test(name) && !excludePattern.test(name)) {
      sourceSheets.push(name);
    }
  }

  if (sourceSheets.length === 0) {
    throw new Error(
      '❌ Aucun onglet source trouvé !\n\n' +
      'Formats supportés pour les onglets sources :\n' +
      '• Format classique: 6°1, 6°2, 5°1, 5°2, 4°1, 4°2, 3°1, 3°2, etc.\n' +
      '• Format ECOLE: ECOLE1, ECOLE2, ECOLE3, etc.\n' +
      '• Format personnalisé: GAMARRA°4, NOMECOLE°1, etc.\n\n' +
      'Note: Le symbole ° est obligatoire pour les formats personnalisés.'
    );
  }

  sourceSheets.sort();
  logLine('INFO', '📋 Onglets sources détectés : ' + sourceSheets.join(', '));

  // ========== ÉTAPE 2 : LIRE MAPPING DEPUIS _STRUCTURE ==========
  // Mapping CLASSE_ORIGINE → CLASSE_DEST (ex: "ECOLE1" → "6°1")
  const sourceToDestMapping = readSourceToDestMapping_LEGACY();

  logLine('INFO', '🗺️ Mapping sources → destinations :');
  for (const src in sourceToDestMapping) {
    logLine('INFO', '  • ' + src + ' → ' + sourceToDestMapping[src]);
  }

  // ========== ÉTAPE 3 : GÉNÉRER NOMS ONGLETS TEST ==========
  // Utiliser le mapping si disponible, sinon fallback intelligent
  const testSheets = sourceSheets.map(function(name) {
    // Si le mapping existe pour cette source, utiliser la destination mappée
    if (sourceToDestMapping[name]) {
      return sourceToDestMapping[name] + 'TEST';
    }

    // Sinon, fallback sur l'ancien comportement
    // Extraire le niveau (6°, 5°, etc.)
    const matchNiveau = name.match(/([3-6]°\d+)/);
    if (matchNiveau) {
      return matchNiveau[1] + 'TEST';
    }

    // Si c'est ECOLE, on génère 6°X TEST
    const matchEcole = name.match(/ECOLE(\d+)/);
    if (matchEcole) {
      return '6°' + matchEcole[1] + 'TEST';
    }

    // Fallback final
    return name + 'TEST';
  });

  logLine('INFO', '📋 Onglets TEST à créer : ' + testSheets.join(', '));

  // ========== ÉTAPE 4 : GÉNÉRER NIVEAUX DESTINATION ==========
  // Niveaux de destination (sans suffixe TEST)
  const niveauxDest = sourceSheets.map(function(name) {
    return sourceToDestMapping[name] || name;
  });

  logLine('INFO', '📋 Niveaux de destination : ' + niveauxDest.join(', '));

  // ========== ÉTAPE 5 : LIRE CONFIGURATION DEPUIS _STRUCTURE ==========
  // Lire les quotas par classe depuis _STRUCTURE
  const quotas = readQuotasFromUI_LEGACY();

  logLine('INFO', '📊 Quotas lus :');
  for (const classe in quotas) {
    const opts = quotas[classe];
    if (Object.keys(opts).length > 0) {
      logLine('INFO', '  • ' + classe + ' : ' + JSON.stringify(opts));
    }
  }

  // Lire les cibles d'effectifs par classe
  const targets = readTargetsFromUI_LEGACY();

  logLine('INFO', '🎯 Effectifs cibles :');
  for (const classe in targets) {
    logLine('INFO', '  • ' + classe + ' : ' + targets[classe] + ' élèves');
  }

  // Lire la tolérance de parité
  const tolParite = readParityToleranceFromUI_LEGACY() || 2;

  // Lire le nombre max de swaps
  const maxSwaps = readMaxSwapsFromUI_LEGACY() || 500;

  // Lire les autorisations de classes pour options/LV2
  const autorisations = readClassAuthorizationsFromUI_LEGACY();

  // ========== ÉTAPE 6 : LIRE FLAGS JULES CODEX ==========
  // Lire depuis les propriétés du document
  const docProps = PropertiesService.getDocumentProperties();
  const useJulesCodex = docProps.getProperty('LEGACY_USE_JULES_CODEX') === 'true';
  const useIntegratedPhase3 = useJulesCodex;  // Si JULES CODEX activé, activer phase 3 intégrée

  if (useJulesCodex) {
    logLine('INFO', '🎯 Mode JULES CODEX activé (Moteurs Silencieux + Distance Distribution)');
  }

  // ========== ÉTAPE 7 : CONSTRUIRE LE CONTEXTE ==========
  const ctx = {
    ss: ss,
    modeSrc: '',  // ✅ Mode vide pour LEGACY car les sources n'ont pas de suffixe
    writeTarget: 'TEST',  // ✅ Écrire vers onglets TEST
    niveaux: niveauxDest,  // ✅ Niveaux de destination (5°1, 5°2, etc.)
    levels: niveauxDest,  // ✅ ALIAS pour compatibilité Phase4_BASEOPTI_V2
    srcSheets: sourceSheets,  // ✅ Onglets sources réels (6°1, 6°2, etc.)
    cacheSheets: testSheets,  // ✅ Onglets TEST à créer (5°1TEST, 5°2TEST, etc.)
    sourceToDestMapping: sourceToDestMapping,  // ✅ Mapping pour utilisation dans les phases
    quotas: quotas,
    targets: targets,
    tolParite: tolParite,
    maxSwaps: maxSwaps,
    autorisations: autorisations,
    weights: {
      parity: 1.0,
      com: 1.0,
      tra: 0.5,
      part: 0.3,
      abs: 0.2
    },
    // 🎯 JULES CODEX FLAGS
    useJulesCodex: useJulesCodex,
    useIntegratedPhase3: useIntegratedPhase3
  };

  logLine('INFO', '✅ Contexte LEGACY créé avec succès');
  logLine('INFO', '  • Sources : ' + ctx.srcSheets.length + ' onglets');
  logLine('INFO', '  • Destinations TEST : ' + ctx.cacheSheets.length + ' onglets');
  logLine('INFO', '  • Tolérance parité : ±' + ctx.tolParite);
  logLine('INFO', '  • Max swaps : ' + ctx.maxSwaps);

  return ctx;
}

// ===================================================================
// FONCTIONS DE LECTURE DE CONFIGURATION
// ===================================================================

/**
 * Lit le mapping CLASSE_ORIGINE → CLASSE_DEST depuis _STRUCTURE
 * ✅ UTILISE LE MODULE CENTRALISÉ StructureReader.gs
 * @returns {Object} Mapping { "ECOLE1": "6°1", "6°1": "5°1", ... }
 */
function readSourceToDestMapping_LEGACY() {
  const mapping = {};

  try {
    // ✅ Utiliser le module centralisé
    const structData = readStructure();

    if (!structData.success) {
      logLine('WARN', '⚠️ Erreur lecture _STRUCTURE : ' + (structData.error || 'Inconnu'));
      return mapping;
    }

    logLine('INFO', '  ✅ _STRUCTURE lue avec succès (format: ' + structData.format + ')');

    // Construire le mapping depuis les données unifiées
    structData.mappings.forEach(function(m) {
      if (m.source && m.dest) {
        mapping[m.source] = m.dest;
      }
    });

  } catch (e) {
    logLine('WARN', '⚠️ Erreur lecture mapping depuis _STRUCTURE : ' + e.message);
  }

  return mapping;
}

/**
 * Lit les quotas par classe depuis l'interface
 * Format attendu : { "6°1": { ITA: 6, CHAV: 0, LV2_ESP: 3, ... }, ... }
 */
function readQuotasFromUI_LEGACY() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Essayer de lire depuis _STRUCTURE
  const structSheet = ss.getSheetByName('_STRUCTURE');
  if (structSheet) {
    return readQuotasFromStructure_LEGACY(structSheet);
  }

  // Sinon, retour valeurs par défaut vides
  logLine('WARN', '⚠️ _STRUCTURE introuvable, quotas par défaut (vides)');
  return {};
}

/**
 * Lit les quotas depuis la feuille _STRUCTURE
 * ✅ UTILISE LE MODULE CENTRALISÉ StructureReader.gs
 */
function readQuotasFromStructure_LEGACY(sheet) {
  const quotas = {};

  try {
    // ✅ Utiliser le module centralisé (ignore le paramètre sheet)
    const structData = readStructure();

    if (!structData.success) {
      logLine('WARN', '⚠️ Erreur lecture quotas depuis _STRUCTURE');
      return quotas;
    }

    // Construire les quotas depuis les classes TEST (destinations)
    structData.tests.forEach(function(test) {
      if (test.nom && test.options) {
        quotas[test.nom] = test.options;
      }
    });

  } catch (e) {
    logLine('WARN', '⚠️ Erreur lecture quotas depuis _STRUCTURE : ' + e.message);
  }

  return quotas;
}

/**
 * Lit les cibles d'effectifs par classe depuis l'interface
 * ✅ Lit depuis _STRUCTURE si disponible
 */
function readTargetsFromUI_LEGACY() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Essayer de lire depuis _STRUCTURE
  const structSheet = ss.getSheetByName('_STRUCTURE');
  if (structSheet) {
    return readTargetsFromStructure_LEGACY(structSheet);
  }

  // Sinon, valeurs par défaut : 25 élèves par classe
  logLine('WARN', '⚠️ _STRUCTURE introuvable, effectifs par défaut (25)');
  return {};
}

/**
 * Lit les effectifs cibles depuis _STRUCTURE
 * ✅ UTILISE LE MODULE CENTRALISÉ StructureReader.gs
 */
function readTargetsFromStructure_LEGACY(sheet) {
  const targets = {};

  try {
    // ✅ Utiliser le module centralisé (ignore le paramètre sheet)
    const structData = readStructure();

    if (!structData.success) {
      logLine('WARN', '⚠️ Erreur lecture effectifs depuis _STRUCTURE');
      return targets;
    }

    // Construire les effectifs depuis les classes TEST (destinations)
    structData.tests.forEach(function(test) {
      if (test.nom && test.capacite) {
        targets[test.nom] = test.capacite;
      }
    });

  } catch (e) {
    logLine('WARN', '⚠️ Erreur lecture effectifs depuis _STRUCTURE : ' + e.message);
  }

  return targets;
}

/**
 * Lit la tolérance de parité depuis l'interface
 * Retourne une valeur par défaut (2)
 */
function readParityToleranceFromUI_LEGACY() {
  // ✅ Valeur par défaut : tolérance de ±2
  return 2;
}

/**
 * Lit le nombre max de swaps depuis l'interface
 * Retourne une valeur par défaut (500)
 */
function readMaxSwapsFromUI_LEGACY() {
  // ✅ Valeur par défaut : 500 swaps max
  return 500;
}

/**
 * Lit les autorisations de classes par option
 * Format : { ITA: ["6°1", "6°3"], CHAV: ["6°2", "6°3"], ... }
 *
 * ✅ Calculées automatiquement depuis les quotas
 */
function readClassAuthorizationsFromUI_LEGACY() {
  const autorisations = {};

  // ✅ Calculer depuis les quotas
  const quotas = readQuotasFromUI_LEGACY();

  for (const classe in quotas) {
    const opts = quotas[classe];
    for (const optName in opts) {
      if (opts[optName] > 0) {
        if (!autorisations[optName]) {
          autorisations[optName] = [];
        }
        autorisations[optName].push(classe);
      }
    }
  }

  return autorisations;
}

// ===================================================================
// UTILITAIRES CONTEXTE
// ===================================================================

/**
 * Affiche le contexte LEGACY dans les logs
 * @param {Object} ctx - Contexte LEGACY
 */
function logContext_LEGACY(ctx) {
  logLine('INFO', '');
  logLine('INFO', '📋 CONTEXTE LEGACY :');
  logLine('INFO', '─────────────────────────────────────────────────────');
  logLine('INFO', '  • Sources : ' + (ctx.srcSheets || []).join(', '));
  logLine('INFO', '  • Destinations TEST : ' + (ctx.cacheSheets || []).join(', '));
  logLine('INFO', '  • Niveaux : ' + (ctx.niveaux || []).join(', '));
  logLine('INFO', '  • Tolérance parité : ±' + (ctx.tolParite || 2));
  logLine('INFO', '  • Max swaps : ' + (ctx.maxSwaps || 500));
  logLine('INFO', '  • Quotas : ' + Object.keys(ctx.quotas || {}).length + ' classes');
  logLine('INFO', '  • Effectifs cibles : ' + Object.keys(ctx.targets || {}).length + ' classes');
  logLine('INFO', '─────────────────────────────────────────────────────');
  logLine('INFO', '');
}
