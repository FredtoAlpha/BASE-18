/**
 * ===================================================================
 * 🚀 BASE-17 ULTIMATE - POINT D'ENTRÉE PRINCIPAL
 * ===================================================================
 * Version : 3.5 (Finale & Nettoyée)
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 PILOTAGE CLASSE')
    .addItem('📊 Ouvrir la Console V3', 'ouvrirConsolePilotageV3')
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('🛠️ Outils Spécifiques')
        .addItem('➕ Intégrer un Nouvel Élève', 'ouvrirModuleNouvelEleve')
        .addItem('👥 Créer des Groupes', 'ouvrirModuleGroupes'))
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('🔍 Diagnostic ASSO/DISSO')
        .addItem('📋 Analyser les colonnes', 'diagnosticAssoDisso')
        .addItem('🔄 Inverser ASSO ↔ DISSO', 'inverserAssoDisso'))
    .addSeparator()
    .addItem('⚙️ Configuration Avancée', 'ouvrirConfigurationStructure')
    .addItem('🔓 Déverrouiller _STRUCTURE', 'deverrouillerStructure')
    .addToUi();

  Logger.log('✅ Menu V3 Ultimate chargé');
}

// --- ACCÈS WEB (Interface Profs) ---
function doGet(e) {
  return HtmlService.createTemplateFromFile('InterfaceV2')
    .evaluate()
    .setTitle('Interface Répartition - Professeurs')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Fonction include() pour le système de templates HtmlService
 * Permet de charger des fichiers HTML partiels référencés par <?!= include('filename'); ?>
 * @param {string} filename - Nom du fichier HTML (sans extension) à inclure
 * @returns {string} Contenu du fichier HTML
 */
function include(filename) {
  try {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
  } catch (e) {
    Logger.log(`⚠️ Erreur include('${filename}'): ${e.message}`);
    return `<!-- Erreur: fichier ${filename} introuvable -->`;
  }
}

// --- LANCEURS MODALES ---
function ouvrirConsolePilotageV3() {
  const html = HtmlService.createHtmlOutputFromFile('ConsolePilotageV3')
    .setWidth(1600).setHeight(900);
  SpreadsheetApp.getUi().showModalDialog(html, 'Console de Pilotage V3 - Expert Edition');
}

function ouvrirConfigurationStructure() {
  const html = HtmlService.createHtmlOutputFromFile('ConfigurationComplete')
    .setWidth(1200).setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Configuration de la Structure');
}

function ouvrirConfigurationComplete() {
  const html = HtmlService.createHtmlOutputFromFile('ConfigurationComplete')
    .setWidth(1200).setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Configuration Complète');
}

function ouvrirModuleGroupes() {
  const html = HtmlService.createHtmlOutputFromFile('GroupsInterfaceV4')
    .setWidth(1400).setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Module Groupes');
}

function ouvrirModuleNouvelEleve() {
  const html = HtmlService.createHtmlOutputFromFile('InterfaceV2_NewStudentModule')
    .setWidth(1000).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Intégration Nouvel Élève');
}

// --- UTILITAIRES ADMIN & COMPATIBILITÉ ---
function deverrouillerStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('_STRUCTURE');
  if (sheet) {
    sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(p => p.remove());
    SpreadsheetApp.getUi().alert('✅ Onglet _STRUCTURE déverrouillé.');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ Onglet _STRUCTURE introuvable.');
  }
}

function legacy_runFullPipeline() {
  if (typeof legacy_runFullPipeline_PRIME === 'function') {
    return legacy_runFullPipeline_PRIME();
  }
  SpreadsheetApp.getUi().alert("❌ Erreur : Moteur LEGACY introuvable.");
}

function legacy_viewSourceClasses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceSheets = ss.getSheets().filter(s => /.+°\d+$/.test(s.getName())); // ✅ Pattern universel
  if (sourceSheets.length > 0) {
    ss.setActiveSheet(sourceSheets[0]);
    SpreadsheetApp.getUi().alert('Classes sources trouvées : ' + sourceSheets.map(s => s.getName()).join(', '));
  } else {
    SpreadsheetApp.getUi().alert('Aucune classe source trouvée.');
  }
}

function legacy_openStructure() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('_STRUCTURE');
  if (sheet) ss.setActiveSheet(sheet);
}

// ========== FONCTIONS UTILITAIRES D'OPTIMISATION ==========

/**
 * Convertit une valeur en string trimée (optimisation)
 * @param {*} value - Valeur à convertir
 * @returns {string} String trimée
 */
function toTrimmedString(value) {
  return String(value || '').trim();
}

/**
 * Convertit une valeur en string trimée et uppercase (optimisation)
 * @param {*} value - Valeur à convertir
 * @returns {string} String trimée et uppercase
 */
function toUpperTrimmedString(value) {
  return String(value || '').toUpperCase().trim();
}

// ========== FONCTIONS BACKEND POUR INTERFACEV2 ==========

/**
 * Résout le filtre regex selon le mode demandé
 * @param {string} mode - Mode de recherche
 * @returns {RegExp} Expression régulière de filtrage
 */
function resolveSheetFilter(mode) {
  const normalized = (mode || '').toString().trim().toUpperCase();

  switch (normalized) {
    case 'FIN':
      return /FIN$/;
    case 'TEST':
      return /TEST$/;
    case 'CACHE':
      return /CACHE$/;
    case 'PREVIOUS':
      return /PREVIOUS$/;
    default:
      return /.+°\d+$/; // Sources : termine par °chiffre
  }
}

/**
 * Collecte les données brutes des onglets selon le mode
 * @param {string} mode - Mode de collecte
 * @param {Spreadsheet} ss - Instance du spreadsheet (optionnel)
 * @returns {Object} Données brutes par classe
 */
function collectClassesDataByMode(mode, ss = null) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const filter = resolveSheetFilter(mode);
  const sheets = ss.getSheets().filter(s => filter.test(s.getName()));
  const classesData = {};

  sheets.forEach(sheet => {
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    classesData[sheet.getName()] = {
      sheetName: sheet.getName(),
      headers: data[0],
      students: data.slice(1).filter(row => row[0] && String(row[0]).trim() !== ''),
      rowCount: data.length - 1,
      timestamp: new Date().getTime()
    };
  });

  return classesData;
}

/**
 * Mappe les lignes élèves au format objet pour l'interface
 * @param {Array} headers - En-têtes de colonnes
 * @param {Array} rows - Lignes de données
 * @returns {Array} Élèves mappés
 */
function mapStudentsForInterface(headers, rows) {
  return rows.map(row => {
    const eleve = {};

    headers.forEach((header, idx) => {
      if (!header) return;
      eleve[header] = row[idx];
      if (!eleve.id && header === 'ID_ELEVE') {
        eleve.id = toTrimmedString(row[idx]); // ✅ Utilisation fonction utilitaire
      }
    });

    if (!eleve.id) {
      eleve.id = toTrimmedString(row[0]); // ✅ Utilisation fonction utilitaire
    }

    // Créer l'objet scores pour le frontend
    eleve.scores = {
      COM: eleve.COM || 0,
      TRA: eleve.TRA || 0,
      PART: eleve.PART || 0,
      ABS: eleve.ABS || 0
    };

    // Normaliser les champs pour compatibilité frontend
    eleve.nom = eleve.NOM || '';
    eleve.prenom = eleve.PRENOM || '';
    eleve.sexe = eleve.SEXE || '';
    eleve.lv2 = eleve.LV2 || '';
    eleve.opt = eleve.OPT || '';
    eleve.asso = eleve.ASSO || '';
    eleve.disso = eleve.DISSO || '';
    eleve.dispo = eleve.DISPO || '';
    eleve.mobilite = eleve.MOBILITE || '';
    eleve.source = eleve.SOURCE || '';

    return eleve;
  }).filter(eleve => eleve.id);
}

/**
 * Normalise le nom de classe en supprimant les suffixes
 * @param {string} sheetName - Nom d'onglet brut
 * @returns {string} Nom normalisé
 */
function normalizeClasseName(sheetName) {
  return sheetName.replace(/(TEST|FIN|CACHE|PREVIOUS)$/i, '').trim();
}

/**
 * Charge les règles de structure (_STRUCTURE) avec cache
 * @param {Spreadsheet} ss - Instance du spreadsheet (optionnel)
 * @param {boolean} bypassCache - Force le rechargement sans utiliser le cache
 * @returns {Object} Règles par classe {capacity, quotas}
 */
function loadStructureRules(ss = null, bypassCache = false) {
  // ✅ Tentative de lecture depuis le cache (TTL: 10 minutes)
  if (!bypassCache) {
    try {
      const cache = CacheService.getScriptCache();
      const cached = cache.get('STRUCTURE_RULES');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      Logger.log('⚠️ Cache read error: ' + e.toString());
    }
  }

  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('_STRUCTURE');
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  if (!data.length) return {};

  let headerRow = 0;
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i].map(v => toUpperTrimmedString(v)); // ✅ Utilisation fonction utilitaire
    if (row.includes('CLASSE_DEST') || row.includes('CLASSE') || row.includes('DESTINATION')) {
      headerRow = i;
      break;
    }
  }

  const headers = data[headerRow].map(h => toTrimmedString(h)); // ✅ Utilisation fonction utilitaire
  const destIdx = headers.findIndex(h => ['CLASSE_DEST', 'CLASSE', 'DESTINATION'].includes(toUpperTrimmedString(h)));
  const effectifIdx = headers.findIndex(h => toUpperTrimmedString(h) === 'EFFECTIF');
  const optionsIdx = headers.findIndex(h => toUpperTrimmedString(h) === 'OPTIONS');

  if (destIdx === -1 && effectifIdx === -1 && optionsIdx === -1) {
    return {};
  }

  const rules = {};
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    const classe = destIdx === -1 ? '' : toTrimmedString(row[destIdx]); // ✅ Utilisation fonction utilitaire
    if (!classe) continue;

    const capacity = effectifIdx === -1 ? 25 : Number(row[effectifIdx]) || 25;
    const quotas = {};

    // ✅ Optimisation: Boucle unique au lieu de split + map + filter + forEach
    if (optionsIdx !== -1 && row[optionsIdx]) {
      const parts = toTrimmedString(row[optionsIdx]).split(',');
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j].trim();
        if (!part) continue;

        const [optRaw, quotaRaw] = part.split(/[:=]/);
        const opt = toTrimmedString(optRaw); // ✅ Utilisation fonction utilitaire
        if (opt) {
          quotas[opt] = Number(toTrimmedString(quotaRaw)) || 0;
        }
      }
    }

    rules[classe] = { capacity, quotas };
  }

  // ✅ Sauvegarde dans le cache (TTL: 10 minutes = 600 secondes)
  try {
    const cache = CacheService.getScriptCache();
    cache.put('STRUCTURE_RULES', JSON.stringify(rules), 600);
  } catch (e) {
    Logger.log('⚠️ Cache write error: ' + e.toString());
  }

  return rules;
}

/**
 * 🎯 ADAPTATEUR SAS - Fonction principale pour InterfaceV2
 * Convertit les onglets TEST/FIN/CACHE/PREVIOUS au format attendu
 * @param {string} mode - Mode de chargement
 * @returns {Object} {success: boolean, data: Array, rules: Object}
 */
function getClassesDataForInterfaceV2(mode = 'TEST') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet(); // ✅ Cache une seule fois
    const classesData = collectClassesDataByMode(mode, ss);
    if (!classesData || Object.keys(classesData).length === 0) {
      return { success: false, error: 'Aucun onglet trouvé pour le mode: ' + mode, data: [] };
    }

    const data = Object.values(classesData).map(entry => {
      const eleves = mapStudentsForInterface(entry.headers, entry.students);
      return {
        classe: normalizeClasseName(entry.sheetName),
        eleves,
        sheetName: entry.sheetName,
        headers: entry.headers,
        rowCount: entry.rowCount
      };
    });

    const rules = loadStructureRules(ss);

    return {
      success: true,
      data,
      rules,
      timestamp: new Date().getTime()
    };
  } catch (e) {
    Logger.log('❌ Erreur getClassesDataForInterfaceV2: ' + e.toString());
    return {
      success: false,
      error: e.toString(),
      data: []
    };
  }
}

/**
 * FONCTION LEGACY - Maintenue pour compatibilité
 * Récupère les données groupées par classe (ancien format)
 * @param {string} mode - 'source', 'test', 'fin' ou 'cache'
 * @returns {Object} {success: boolean, data: Object}
 */
function getClassesData(mode = 'source') {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const classesData = collectClassesDataByMode(mode, ss);

  return {
    success: true,
    data: classesData
  };
}

/**
 * Récupère les informations du dernier cache
 * @returns {Object} {success: boolean, exists: boolean, date: string}
 */
function getLastCacheInfo() {
  try {
    const props = PropertiesService.getUserProperties();
    const cacheData = props.getProperty('INTERFACEV2_CACHE');
    
    if (!cacheData) {
      return { success: true, exists: false };
    }
    
    const cache = JSON.parse(cacheData);
    return {
      success: true,
      exists: true,
      date: cache.timestamp || new Date().toISOString(),
      mode: cache.mode || 'unknown'
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Récupère et efface le contexte du pont depuis ConsolePilotage
 * @returns {Object} {success: boolean, context: Object}
 */
function getBridgeContextAndClear() {
  try {
    const props = PropertiesService.getUserProperties();
    const context = props.getProperty('JULES_CONTEXT');
    
    if (!context) {
      return { success: true, context: null };
    }
    
    props.deleteProperty('JULES_CONTEXT');
    
    return { success: true, context: JSON.parse(context) };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Sauvegarde les données dans le cache (PropertiesService uniquement) avec gestion de quota
 * @param {Object} cacheData - Données à sauvegarder
 * @returns {Object} {success: boolean}
 */
function saveCacheData(cacheData) {
  try {
    const props = PropertiesService.getUserProperties();
    const serialized = JSON.stringify(cacheData);

    // ✅ Vérification de la taille (limite: ~9KB par propriété)
    const sizeKB = new Blob([serialized]).size / 1024;
    if (sizeKB > 8) {
      Logger.log(`⚠️ Cache data too large: ${sizeKB.toFixed(2)}KB (limit: 9KB)`);
      return { success: false, error: 'Cache data exceeds size limit' };
    }

    props.setProperty('INTERFACEV2_CACHE', serialized);
    return { success: true };
  } catch (e) {
    // ✅ Gestion spécifique des erreurs de quota
    if (e.toString().includes('quota') || e.toString().includes('limit')) {
      Logger.log('❌ PropertiesService quota exceeded: ' + e.toString());
      return { success: false, error: 'Quota exceeded', quotaError: true };
    }
    return { success: false, error: e.toString() };
  }
}

/**
 * Sauvegarde la disposition dans les onglets Google Sheets (création des onglets CACHE)
 * @param {Object} disposition - Objet {className: {headers: [], students: []}}
 * @param {Spreadsheet} ss - Instance du spreadsheet (optionnel)
 * @returns {Object} {success: boolean, saved: number, timestamp: string}
 */
function saveDispositionToSheets(disposition, ss = null) {
  try {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    let savedCount = 0;

    for (const className in disposition) {
      const classData = disposition[className];

      // Nom de l'onglet CACHE (ex: "5°1 TEST" -> "5°1 CACHE")
      const cacheSheetName = className.replace(/(TEST|FIN|PREVIOUS)$/i, 'CACHE');

      // Créer ou obtenir l'onglet CACHE
      let cacheSheet = ss.getSheetByName(cacheSheetName);
      if (!cacheSheet) {
        cacheSheet = ss.insertSheet(cacheSheetName);
        Logger.log(`✅ Onglet créé: ${cacheSheetName}`);
      } else {
        cacheSheet.clearContents();
        Logger.log(`🔄 Onglet vidé: ${cacheSheetName}`);
      }

      // Écrire les données
      if (classData.headers && classData.students) {
        const allRows = [classData.headers, ...classData.students];
        if (allRows.length > 0 && classData.headers.length > 0) {
          cacheSheet.getRange(1, 1, allRows.length, classData.headers.length)
            .setValues(allRows);
          savedCount++;
        }
      }
    }

    SpreadsheetApp.flush();

    Logger.log(`💾 Sauvegarde réussie: ${savedCount} onglets CACHE créés/mis à jour`);

    return {
      success: true,
      saved: savedCount,
      timestamp: new Date().toISOString()
    };

  } catch (e) {
    Logger.log(`❌ Erreur saveDispositionToSheets: ${e.toString()}`);
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * Charge les données depuis le cache avec gestion d'erreur robuste
 * @returns {Object} {success: boolean, data: Object}
 */
function loadCacheData() {
  try {
    const props = PropertiesService.getUserProperties();
    const cacheData = props.getProperty('INTERFACEV2_CACHE');

    if (!cacheData) {
      return { success: true, data: null };
    }

    // ✅ Gestion des erreurs de parsing JSON
    try {
      return { success: true, data: JSON.parse(cacheData) };
    } catch (parseError) {
      Logger.log('⚠️ Cache data corrupted, clearing: ' + parseError.toString());
      props.deleteProperty('INTERFACEV2_CACHE');
      return { success: true, data: null };
    }
  } catch (e) {
    Logger.log('❌ Error loading cache: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Sauvegarde un snapshot des élèves
 * @param {Object} disposition - Disposition des élèves par classe
 * @param {string} mode - Mode de sauvegarde
 * @param {Spreadsheet} ss - Instance du spreadsheet (optionnel)
 * @returns {Object} {success: boolean, message: string}
 */
function saveElevesSnapshot(disposition, mode, ss = null) {
  try {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();

    for (const [className, classData] of Object.entries(disposition)) {
      const sheet = ss.getSheetByName(className);
      if (!sheet) continue;
      
      const headers = classData.headers || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const students = classData.students || [];
      
      const rowsToWrite = [headers, ...students];
      const range = sheet.getRange(1, 1, rowsToWrite.length, headers.length);
      range.setValues(rowsToWrite);
    }
    
    return { success: true, message: 'Snapshot sauvegardé' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Récupère les paramètres UI
 * @returns {Object} {success: boolean, settings: Object}
 */
function getUiSettings() {
  try {
    return {
      success: true,
      settings: {
        theme: 'light',
        language: 'fr'
      }
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Récupère le mot de passe admin depuis _CONFIG B3
 * @param {Spreadsheet} ss - Instance du spreadsheet (optionnel)
 * @returns {string} Mot de passe admin
 */
function getAdminPasswordFromConfig(ss = null) {
  try {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('_CONFIG');

    if (!configSheet) {
      Logger.log('⚠️ Onglet _CONFIG introuvable');
      return '';
    }

    const password = configSheet.getRange('B3').getValue();
    return toTrimmedString(password); // ✅ Utilisation fonction utilitaire
  } catch (e) {
    Logger.log('❌ Erreur getAdminPasswordFromConfig: ' + e.toString());
    return '';
  }
}

/**
 * Vérifie le mot de passe admin
 * @param {string} password - Mot de passe à vérifier
 * @returns {Object} {success: boolean}
 */
function verifierMotDePasseAdmin(password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const adminPassword = getAdminPasswordFromConfig(ss);

    if (!adminPassword) {
      return { success: false, error: 'Mot de passe admin non configuré' };
    }

    const isValid = toTrimmedString(password) === adminPassword; // ✅ Utilisation fonction utilitaire

    return { success: isValid };
  } catch (e) {
    Logger.log('❌ Erreur verifierMotDePasseAdmin: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Charge les onglets FIN avec les scores (colonnes U et V)
 * @param {Spreadsheet} ss - Instance du spreadsheet (optionnel)
 * @returns {Object} {success: boolean, data: Object}
 */
function loadFINSheetsWithScores(ss = null) {
  try {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    const finSheets = ss.getSheets().filter(s => /FIN$/i.test(s.getName()));

    if (finSheets.length === 0) {
      return { success: false, error: 'Aucun onglet FIN trouvé' };
    }

    const data = {};

    finSheets.forEach(sheet => {
      const sheetData = sheet.getDataRange().getValues();
      if (sheetData.length < 2) return;

      const headers = sheetData[0];
      const scoreF_idx = 20; // Colonne U (index 20)
      const scoreM_idx = 21; // Colonne V (index 21)

      const eleves = sheetData.slice(1)
        .filter(row => row[0] && String(row[0]).trim() !== '')
        .map(row => {
          const eleve = {};
          headers.forEach((header, idx) => {
            if (header) eleve[header] = row[idx];
          });

          // Ajouter les scores spécifiques
          eleve.SCORE_F = row[scoreF_idx] || 0;
          eleve.SCORE_M = row[scoreM_idx] || 0;

          return eleve;
        });

      data[sheet.getName()] = { eleves };
    });

    return { success: true, data };
  } catch (e) {
    Logger.log('❌ Erreur loadFINSheetsWithScores: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Met à jour les règles de structure dans _STRUCTURE
 * @param {Object} newRules - Nouvelles règles {classe: {capacity, quotas}}
 * @param {Spreadsheet} ss - Instance du spreadsheet (optionnel)
 * @returns {Object} {success: boolean}
 */
function updateStructureRules(newRules, ss = null) {
  try {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('_STRUCTURE');

    if (!sheet) {
      return { success: false, error: 'Onglet _STRUCTURE introuvable' };
    }

    const data = sheet.getDataRange().getValues();
    if (!data.length) {
      return { success: false, error: 'Onglet _STRUCTURE vide' };
    }

    // Trouver la ligne d'en-tête
    let headerRow = 0;
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const row = data[i].map(v => toUpperTrimmedString(v)); // ✅ Utilisation fonction utilitaire
      if (row.includes('CLASSE_DEST') || row.includes('CLASSE') || row.includes('DESTINATION')) {
        headerRow = i;
        break;
      }
    }

    const headers = data[headerRow].map(h => toTrimmedString(h)); // ✅ Utilisation fonction utilitaire
    const destIdx = headers.findIndex(h => ['CLASSE_DEST', 'CLASSE', 'DESTINATION'].includes(toUpperTrimmedString(h)));
    const effectifIdx = headers.findIndex(h => toUpperTrimmedString(h) === 'EFFECTIF');
    const optionsIdx = headers.findIndex(h => toUpperTrimmedString(h) === 'OPTIONS');

    if (destIdx === -1) {
      return { success: false, error: 'Colonne CLASSE_DEST introuvable' };
    }

    // Mettre à jour les règles
    for (let i = headerRow + 1; i < data.length; i++) {
      const classe = toTrimmedString(data[i][destIdx]); // ✅ Utilisation fonction utilitaire
      if (!classe || !newRules[classe]) continue;

      const rule = newRules[classe];

      // Mettre à jour la capacité
      if (effectifIdx !== -1 && rule.capacity !== undefined) {
        data[i][effectifIdx] = rule.capacity;
      }

      // Mettre à jour les quotas (format: "OPT1:quota1, OPT2:quota2")
      if (optionsIdx !== -1 && rule.quotas) {
        const quotasStr = Object.entries(rule.quotas)
          .map(([opt, quota]) => `${opt}:${quota}`)
          .join(', ');
        data[i][optionsIdx] = quotasStr;
      }
    }

    // Écrire les données mises à jour
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    // ✅ Invalider le cache après mise à jour
    try {
      const cache = CacheService.getScriptCache();
      cache.remove('STRUCTURE_RULES');
    } catch (e) {
      Logger.log('⚠️ Cache invalidation error: ' + e.toString());
    }

    return { success: true };
  } catch (e) {
    Logger.log('❌ Erreur updateStructureRules: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Récupère les scores depuis les onglets INT
 * @param {Spreadsheet} ss - Instance du spreadsheet (optionnel)
 * @returns {Object} {success: boolean, scores: Array}
 */
function getINTScores(ss = null) {
  try {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    const intSheets = ss.getSheets().filter(s => /INT$/i.test(s.getName()));

    if (intSheets.length === 0) {
      return { success: false, error: 'Aucun onglet INT trouvé' };
    }

    const scores = [];

    intSheets.forEach(sheet => {
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) return;

      const headers = data[0].map(h => toUpperTrimmedString(h)); // ✅ Utilisation fonction utilitaire
      const idIdx = headers.findIndex(h => h.includes('ID') || h.includes('ELEVE'));
      const mathIdx = headers.findIndex(h => h.includes('MATH') || h === 'M');
      const frIdx = headers.findIndex(h => h.includes('FR') || h.includes('FRANÇAIS') || h === 'F');

      if (idIdx === -1) return;

      // ✅ Optimisation: filter + map au lieu de forEach avec early return
      const sheetScores = data.slice(1)
        .filter(row => row[idIdx] && toTrimmedString(row[idIdx]))
        .map(row => ({
          id: toTrimmedString(row[idIdx]), // ✅ Utilisation fonction utilitaire
          MATH: mathIdx !== -1 ? (Number(row[mathIdx]) || 0) : 0,
          FR: frIdx !== -1 ? (Number(row[frIdx]) || 0) : 0
        }));

      scores.push(...sheetScores);
    });

    return { success: true, scores };
  } catch (e) {
    Logger.log('❌ Erreur getINTScores: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}
