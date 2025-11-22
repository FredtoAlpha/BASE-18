/**
 * ===================================================================
 * 🚀 PRIME LEGACY - PIPELINE PRINCIPAL (GOOGLE APPS SCRIPT)
 * ===================================================================
 *
 * Backend Apps Script pour le pipeline LEGACY classique.
 * Utilise Phase4_Ultimate avec Asymmetric Weighting.
 *
 * ARCHITECTURE :
 * - LECTURE : Onglets sources (6°1, 5°2, etc.)
 * - TRAITEMENT : Phase4_Ultimate (moteur intelligent)
 * - ÉCRITURE : Onglets TEST et FIN
 *
 * ISOLATION COMPLÈTE :
 * - LEGACY : Sources → TEST → FIN
 * - OPTI : _BASEOPTI → _CACHE → FIN
 * - ZÉRO INTERFÉRENCE : Onglets différents, sécurisé
 *
 * Date: 19/11/2025
 * Moteur: Phase4_Ultimate.gs (Asymmetric Weighting)
 * ===================================================================
 */

// ===================================================================
// CONFIGURATION PIPELINE LEGACY
// ===================================================================

const LEGACY_PIPELINE_CONFIG = {
  maxRuntime: 600,        // 10 minutes max
  enableLogging: true,
  testSheetSuffix: 'TEST',
  finSheetSuffix: 'FIN',
  logLevel: 'INFO'
};

// ===================================================================
// 🚀 POINT D'ENTRÉE PRINCIPAL - APPEL DEPUIS MENU
// ===================================================================

/**
 * Lance le pipeline LEGACY complet
 *
 * APPELÉ PAR: Code.gs → Menu "🚀 PILOTAGE CLASSE"
 *
 * WORKFLOW:
 * 1. Détecter sources (6°1, 5°2, 4°3, etc.)
 * 2. Charger élèves avec profils (Têtes/Niv1)
 * 3. Lancer Phase 4 ULTIMATE
 * 4. Créer onglets TEST
 * 5. Créer onglets FIN (formatés)
 * 6. Afficher résumé
 *
 * @returns {Object} Résultat du pipeline
 */
function legacy_runFullPipeline_PRIME() {
  const ui = SpreadsheetApp.getUi();
  const startTime = new Date();

  logLine('INFO', '═'.repeat(80));
  logLine('INFO', '🚀 LANCEMENT PIPELINE LEGACY PRIME');
  logLine('INFO', '📦 Moteur: OPTIMUM PRIME ULTIMATE (Asymmetric Weighting)');
  logLine('INFO', '═'.repeat(80));

  try {
    // 1. VÉRIFICATION LOCK
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) {
      logLine('WARN', '🔒 Pipeline verrouillé');
      ui.alert('⚠️ Une optimisation est déjà en cours. Veuillez patienter.');
      return { success: false, locked: true };
    }

    // 2. CONSTRUIRE CONTEXTE COMPLET depuis _STRUCTURE
    // ✅ CORRECTION : Utiliser makeCtxFromSourceSheets_LEGACY qui lit _STRUCTURE,
    //    crée le mapping source→dest, charge quotas/effectifs/parité/autorisations
    logLine('INFO', '🔧 Construction du contexte LEGACY complet depuis _STRUCTURE...');
    const ctx = makeCtxFromSourceSheets_LEGACY();
    
    // ✅ Charger les élèves depuis les onglets sources
    logLine('INFO', '📚 Chargement des élèves depuis les onglets sources...');
    const students = loadAllStudentsData(ctx);
    ctx.allStudents = students;
    
    if (!ctx.allStudents || ctx.allStudents.length === 0) {
      logLine('ERROR', '❌ Aucun élève chargé depuis les onglets sources');
      ui.alert('⚠️ Aucun élève trouvé dans les classes sources.\nVérifiez que les onglets sources contiennent des données.');
      return { success: false, error: 'No students' };
    }
    
    logLine('INFO', `✅ Contexte créé: ${ctx.allStudents.length} élèves`);
    logLine('INFO', `📋 Onglets sources: ${(ctx.srcSheets || []).join(', ')}`);
    logLine('INFO', `📋 Onglets TEST cibles: ${(ctx.cacheSheets || []).join(', ')}`);

    // 3. INITIALISER ONGLETS TEST (avec mapping et en-têtes corrects)
    logLine('INFO', '📋 Initialisation des onglets TEST...');
    initEmptyTestTabs_LEGACY(ctx);
    logLine('INFO', `✅ Onglets TEST initialisés: ${ctx.cacheSheets.length}`);

    // 4. PHASE 1 : Répartition OPTIONS/LV2 selon quotas
    logLine('INFO', '\n📌 PHASE 1: Répartition OPTIONS/LV2...');
    const p1Result = Phase1I_dispatchOptionsLV2_LEGACY(ctx);
    if (!p1Result.ok) {
      logLine('ERROR', `❌ Erreur Phase 1: ${p1Result.error || 'Échec'}`);
      ui.alert(`❌ Erreur Phase 1: ${p1Result.error || 'Échec répartition OPTIONS/LV2'}`);
      return { success: false, error: 'Phase 1 failed' };
    }
    logLine('SUCCESS', `✅ Phase 1 terminée: ${p1Result.placed || 0} élèves placés avec OPTIONS/LV2`);

    // 5. PHASE 2 : Codes ASSO/DISSO (D1, fratries, etc.)
    logLine('INFO', '\n📌 PHASE 2: Application codes ASSO/DISSO...');
    const p2Result = Phase2I_applyDissoAsso_LEGACY(ctx);
    if (!p2Result.ok) {
      logLine('ERROR', `❌ Erreur Phase 2: ${p2Result.error || 'Échec'}`);
      ui.alert(`❌ Erreur Phase 2: ${p2Result.error || 'Échec codes ASSO/DISSO'}`);
      return { success: false, error: 'Phase 2 failed' };
    }
    logLine('SUCCESS', `✅ Phase 2 terminée: ASSO=${p2Result.asso || 0}, DISSO=${p2Result.disso || 0}`);

    // 6. PHASE 3 : Compléter effectifs et équilibrer parité
    logLine('INFO', '\n📌 PHASE 3: Effectifs & Parité...');
    const p3Result = Phase3I_completeAndParity_LEGACY(ctx);
    if (!p3Result.ok) {
      logLine('ERROR', `❌ Erreur Phase 3: ${p3Result.error || 'Échec'}`);
      ui.alert(`❌ Erreur Phase 3: ${p3Result.error || 'Échec parité'}`);
      return { success: false, error: 'Phase 3 failed' };
    }
    logLine('SUCCESS', `✅ Phase 3 terminée: ${p3Result.placed || 0} élèves placés, parité équilibrée`);

    // 7. PHASE 4 : Optimisation fine par swaps (ULTIMATE)
    logLine('INFO', '\n⚡ PHASE 4: Optimisation ULTIMATE...');
    const p4Result = Phase4_Ultimate_Run(ctx);

    if (!p4Result.ok) {
      logLine('ERROR', `❌ Erreur moteur: ${p4Result.message}`);
      ui.alert(`❌ Erreur optimisation: ${p4Result.message}`);
      return { success: false, error: p4Result.message };
    }
    logLine('SUCCESS', `✅ Swaps appliqués: ${p4Result.swapsApplied}`);

    // 8. CRÉER ONGLETS FIN avec contexte complet
    logLine('INFO', '\n💾 Finalisation avec contexte...');
    const finResult = finalizeAllSheets(ctx);
    logLine('SUCCESS', `✅ Onglets FIN créés: ${finResult.count}`);

    // 9. RÉSUMÉ
    const runtime = (new Date() - startTime) / 1000;
    logLine('SUCCESS', `\n✅ PIPELINE LEGACY TERMINÉ (${runtime.toFixed(1)}s)`);
    logLine('INFO', '═'.repeat(80));

    /*
    ui.alert(
      `✅ RÉPARTITION TERMINÉE\n\n` +
      `• Élèves: ${ctx.allStudents.length}\n` +
      `• Classes: ${ctx.srcSheets.length}\n` +
      `• Optimisations: ${p4Result.swapsApplied}\n` +
      `• Durée: ${runtime.toFixed(1)}s\n\n` +
      `Onglets FIN prêts à utiliser !`
    );
    */

    return {
      success: true,
      students: ctx.allStudents.length,
      classes: ctx.srcSheets.length,
      swaps: p4Result.swapsApplied,
      runtime: runtime,
      timestamp: new Date().toISOString()
    };

  } catch (e) {
    logLine('ERROR', `❌ Erreur pipeline: ${e.toString()}`);
    ui.alert(`❌ Erreur: ${e.toString()}`);
    return { success: false, error: e.toString() };
  }
}

// ===================================================================
// UTILITAIRES LEGACY
// ===================================================================

/**
 * Détecte les onglets sources (format: 6°1, 5°2, ECOLE°1, etc.)
 */
function detectSourceSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets()
    .map(s => s.getName())
    .filter(name => /.+°\d+$/.test(name)) // ✅ Règle stricte °Chiffre
    .sort();
}

/**
 * Crée le contexte LEGACY
 */
function buildLegacyContext(sourceSheets) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const ctx = {
    ss: ss,
    allStudents: [],
    byClass: {},
    cacheSheets: sourceSheets,
    timestamp: new Date().getTime()
  };

  // Charger les élèves
  const students = loadAllStudentsData(ctx);
  ctx.allStudents = students;

  // Grouper par classe source
  sourceSheets.forEach(className => {
    ctx.byClass[className] = [];
  });

  return ctx;
}

/**
 * Crée les onglets TEST (vides initialement)
 */
function createTestSheets(ctx) {
  const ss = ctx.ss;

  ctx.cacheSheets.forEach(sourceSheet => {
    const testName = sourceSheet + 'TEST';
    let testSheet = ss.getSheetByName(testName);

    if (!testSheet) {
      testSheet = ss.insertSheet(testName);
      logLine('INFO', `  ✅ Onglet créé: ${testName}`);
    } else {
      testSheet.clearContents();
      logLine('INFO', `  ♻️ Onglet réutilisé: ${testName}`);
    }
  });

  SpreadsheetApp.flush();
}

/**
 * Crée les onglets FIN définitifs avec formatage
 * ✅ CORRECTION : Utiliser le contexte pour copier TEST→FIN avec formatage
 */
function finalizeAllSheets(ctx) {
  try {
    const ss = ctx.ss;
    const createdSheets = [];
    
    // Pour chaque onglet TEST, créer un onglet FIN
    (ctx.cacheSheets || []).forEach(testName => {
      const finName = testName.replace(/TEST$/i, 'FIN');
      const testSheet = ss.getSheetByName(testName);
      
      if (!testSheet) {
        logLine('WARN', `⚠️ Onglet ${testName} introuvable pour finalisation`);
        return;
      }
      
      // Supprimer l'ancien FIN si existe
      let finSheet = ss.getSheetByName(finName);
      if (finSheet) {
        ss.deleteSheet(finSheet);
      }
      
      // Copier TEST → FIN
      finSheet = testSheet.copyTo(ss);
      finSheet.setName(finName);
      
      logLine('INFO', `  ✅ ${finName} créé depuis ${testName}`);
      createdSheets.push(finName);
    });
    
    SpreadsheetApp.flush();
    
    return {
      ok: true,
      count: createdSheets.length,
      created: createdSheets
    };
    
  } catch (e) {
    logLine('ERROR', `❌ Erreur finalisation: ${e.message}`);
    return {
      ok: false,
      count: 0,
      created: [],
      error: e.message
    };
  }
}

// logLine() defined in Phase4_Ultimate.gs (single global definition)

// ===================================================================
// ENTRÉES ALTERNATIVES (Menu + Console)
// ===================================================================

/**
 * Entrée depuis Console V3 (Phase 4 button)
 */
function ouvrirPipeline_FromConsole_V3(options) {
  logLine('INFO', '📋 Appel depuis Console V3');
  return legacy_runFullPipeline_PRIME();
}

// legacy_viewSourceClasses() moved to Code.gs (single entry point)

// ===================================================================
// TEST FUNCTION
// ===================================================================

/**
 * Test du pipeline (debug)
 */
function testLEGACY_Pipeline() {
  logLine('INFO', '🧪 TEST PIPELINE LEGACY...');
  const result = legacy_runFullPipeline_PRIME();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
