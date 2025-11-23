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
 * @returns {Object} Données brutes par classe
 */
function collectClassesDataByMode(mode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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
        eleve.id = String(row[idx] || '').trim();
      }
    });

    if (!eleve.id) {
      eleve.id = String(row[0] || '').trim();
    }

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
 * Charge les règles de structure (_STRUCTURE)
 * @returns {Object} Règles par classe {capacity, quotas}
 */
function loadStructureRules() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('_STRUCTURE');
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  if (!data.length) return {};

  let headerRow = 0;
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const row = data[i].map(v => String(v || '').toUpperCase());
    if (row.includes('CLASSE_DEST') || row.includes('CLASSE') || row.includes('DESTINATION')) {
      headerRow = i;
      break;
    }
  }

  const headers = data[headerRow].map(h => String(h || ''));
  const destIdx = headers.findIndex(h => ['CLASSE_DEST', 'CLASSE', 'DESTINATION'].includes(h.toUpperCase()));
  const effectifIdx = headers.findIndex(h => h.toUpperCase() === 'EFFECTIF');
  const optionsIdx = headers.findIndex(h => h.toUpperCase() === 'OPTIONS');

  if (destIdx === -1 && effectifIdx === -1 && optionsIdx === -1) {
    return {};
  }

  const rules = {};
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    const classe = destIdx === -1 ? '' : String(row[destIdx] || '').trim();
    if (!classe) continue;

    const capacity = effectifIdx === -1 ? 25 : Number(row[effectifIdx]) || 25;
    const quotas = {};

    if (optionsIdx !== -1 && row[optionsIdx]) {
      String(row[optionsIdx])
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .forEach(part => {
          let [opt, quota] = part.split(/[:=]/);
          opt = (opt || '').trim();
          quota = (quota || '').trim();
          if (opt) quotas[opt] = Number(quota) || 0;
        });
    }

    rules[classe] = { capacity, quotas };
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
    const classesData = collectClassesDataByMode(mode);
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

    const rules = loadStructureRules();

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
  const classesData = collectClassesDataByMode(mode);

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
 * Sauvegarde les données dans le cache
 * @param {Object} cacheData - Données à sauvegarder
 * @returns {Object} {success: boolean}
 */
function saveCacheData(cacheData) {
  try {
    const props = PropertiesService.getUserProperties();
    props.setProperty('INTERFACEV2_CACHE', JSON.stringify(cacheData));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Charge les données depuis le cache
 * @returns {Object} {success: boolean, data: Object}
 */
function loadCacheData() {
  try {
    const props = PropertiesService.getUserProperties();
    const cacheData = props.getProperty('INTERFACEV2_CACHE');
    
    if (!cacheData) {
      return { success: true, data: null };
    }
    
    return { success: true, data: JSON.parse(cacheData) };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Sauvegarde un snapshot des élèves
 * @param {Object} disposition - Disposition des élèves par classe
 * @param {string} mode - Mode de sauvegarde
 * @returns {Object} {success: boolean, message: string}
 */
function saveElevesSnapshot(disposition, mode) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
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
 * @returns {string} Mot de passe admin
 */
function getAdminPasswordFromConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('_CONFIG');

    if (!configSheet) {
      Logger.log('⚠️ Onglet _CONFIG introuvable');
      return '';
    }

    const password = configSheet.getRange('B3').getValue();
    return String(password || '').trim();
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
    const adminPassword = getAdminPasswordFromConfig();

    if (!adminPassword) {
      return { success: false, error: 'Mot de passe admin non configuré' };
    }

    const isValid = String(password || '').trim() === adminPassword;

    return { success: isValid };
  } catch (e) {
    Logger.log('❌ Erreur verifierMotDePasseAdmin: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Charge les onglets FIN avec les scores (colonnes U et V)
 * @returns {Object} {success: boolean, data: Object}
 */
function loadFINSheetsWithScores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
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
 * @returns {Object} {success: boolean}
 */
function updateStructureRules(newRules) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
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
      const row = data[i].map(v => String(v || '').toUpperCase());
      if (row.includes('CLASSE_DEST') || row.includes('CLASSE') || row.includes('DESTINATION')) {
        headerRow = i;
        break;
      }
    }

    const headers = data[headerRow].map(h => String(h || ''));
    const destIdx = headers.findIndex(h => ['CLASSE_DEST', 'CLASSE', 'DESTINATION'].includes(h.toUpperCase()));
    const effectifIdx = headers.findIndex(h => h.toUpperCase() === 'EFFECTIF');
    const optionsIdx = headers.findIndex(h => h.toUpperCase() === 'OPTIONS');

    if (destIdx === -1) {
      return { success: false, error: 'Colonne CLASSE_DEST introuvable' };
    }

    // Mettre à jour les règles
    for (let i = headerRow + 1; i < data.length; i++) {
      const classe = String(data[i][destIdx] || '').trim();
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

    return { success: true };
  } catch (e) {
    Logger.log('❌ Erreur updateStructureRules: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Récupère les scores depuis les onglets INT
 * @returns {Object} {success: boolean, scores: Array}
 */
function getINTScores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const intSheets = ss.getSheets().filter(s => /INT$/i.test(s.getName()));

    if (intSheets.length === 0) {
      return { success: false, error: 'Aucun onglet INT trouvé' };
    }

    const scores = [];

    intSheets.forEach(sheet => {
      const data = sheet.getDataRange().getValues();
      if (data.length < 2) return;

      const headers = data[0].map(h => String(h || '').toUpperCase());
      const idIdx = headers.findIndex(h => h.includes('ID') || h.includes('ELEVE'));
      const mathIdx = headers.findIndex(h => h.includes('MATH') || h === 'M');
      const frIdx = headers.findIndex(h => h.includes('FR') || h.includes('FRANÇAIS') || h === 'F');

      if (idIdx === -1) return;

      data.slice(1).forEach(row => {
        const id = String(row[idIdx] || '').trim();
        if (!id) return;

        scores.push({
          id,
          MATH: mathIdx !== -1 ? (Number(row[mathIdx]) || 0) : 0,
          FR: frIdx !== -1 ? (Number(row[frIdx]) || 0) : 0
        });
      });
    });

    return { success: true, scores };
  } catch (e) {
    Logger.log('❌ Erreur getINTScores: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}
