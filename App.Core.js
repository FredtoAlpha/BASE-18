/**
 * ===================================================================
 * APP.CORE.JS - FONCTIONS UTILITAIRES PURES
 * ===================================================================
 *
 * Module contenant les fonctions utilitaires réutilisables.
 * Toutes les fonctions sont pures (pas d'effets de bord).
 *
 * ARCHITECTURE PHASE 5 - Refactoring progressif
 * Extraction depuis Orchestration_V14I.js (Phase pilote)
 *
 * Date: 25 novembre 2025
 * Version: 1.0.0 (Phase pilote)
 * ===================================================================
 */

// ===================================================================
// UTILITAIRES DE CONSTRUCTION DE NOMS
// ===================================================================

/**
 * Construit le nom d'un onglet à partir du niveau et du suffixe
 *
 * @param {string} niveau - Le niveau (ex: "6°1", "5°2")
 * @param {string} suffix - Le suffixe (ex: "TEST", "CACHE", "FIN")
 * @returns {string} Le nom complet (ex: "6°1TEST")
 *
 * @example
 * buildSheetName_('6°1', 'TEST') // → '6°1TEST'
 * buildSheetName_('5°2', 'CACHE') // → '5°2CACHE'
 *
 * @throws {Error} Si niveau ou suffix est vide
 */
function buildSheetName_(niveau, suffix) {
  const base = String(niveau || '').trim();
  const sfx = String(suffix || '').trim();
  if (!base) throw new Error('buildSheetName_: niveau vide');
  if (!sfx) throw new Error('buildSheetName_: suffix vide');
  return base + sfx;
}

/**
 * Génère une liste de noms d'onglets à partir des niveaux et d'un suffixe
 *
 * @param {Array<string>} niveaux - Liste des niveaux (ex: ["6°1", "6°2", "5°1"])
 * @param {string} suffix - Le suffixe à ajouter (ex: "TEST", "CACHE")
 * @returns {Array<string>} Liste des noms d'onglets (ex: ["6°1TEST", "6°2TEST", "5°1TEST"])
 *
 * @example
 * makeSheetsList_(['6°1', '6°2'], 'TEST') // → ['6°1TEST', '6°2TEST']
 * makeSheetsList_(['5°1', '5°2', '5°3'], 'CACHE') // → ['5°1CACHE', '5°2CACHE', '5°3CACHE']
 */
function makeSheetsList_(niveaux, suffix) {
  return (niveaux || []).map(function(niv) { return buildSheetName_(niv, suffix); });
}

// ===================================================================
// UTILITAIRES DE MARQUAGE ET COLLECTE
// ===================================================================

/**
 * Marque un résultat de phase avec son nom
 *
 * @param {string} name - Le nom de la phase (ex: "Phase1", "Phase2")
 * @param {Object} res - Le résultat de la phase
 * @returns {Object} L'objet résultat avec le nom ajouté
 *
 * @example
 * tagPhase_('Phase1', { success: true, count: 42 })
 * // → { name: 'Phase1', success: true, count: 42 }
 */
function tagPhase_(name, res) {
  return { name, ...res };
}

/**
 * Collecte tous les warnings de toutes les phases
 *
 * @param {Array<Object>} phases - Liste des résultats de phases
 * @returns {Array<string>} Liste plate de tous les warnings
 *
 * @example
 * const phases = [
 *   { name: 'Phase1', warnings: ['Warning 1', 'Warning 2'] },
 *   { name: 'Phase2', warnings: ['Warning 3'] },
 *   { name: 'Phase3', warnings: [] }
 * ];
 * collectWarnings_(phases) // → ['Warning 1', 'Warning 2', 'Warning 3']
 */
function collectWarnings_(phases) {
  return phases.flatMap(p => p.warnings || []);
}

// ===================================================================
// UTILITAIRES GOOGLE SHEETS
// ===================================================================

/**
 * Retourne le spreadsheet actif
 * Point d'entrée unique pour éviter d'écrire dans le mauvais classeur
 *
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} Le spreadsheet actif
 *
 * @example
 * const ss = getActiveSS_();
 * const sheet = ss.getSheetByName('_STRUCTURE');
 */
function getActiveSS_() {
  return SpreadsheetApp.getActive();
}

// ===================================================================
// EXPORTS (Google Apps Script charge automatiquement)
// ===================================================================

/**
 * Note : Dans Google Apps Script, tous les fichiers .js sont chargés
 * automatiquement dans le scope global. Pas besoin d'export/import.
 *
 * Les fonctions définies ici sont automatiquement disponibles dans
 * tous les autres fichiers du projet.
 */
