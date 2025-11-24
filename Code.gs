/**
 * ===================================================================
 * 🚀 BASE-17 ULTIMATE - POINT D'ENTRÉE PRINCIPAL
 * ===================================================================
 * Version : 3.8 (Phase 9 - Optimisation performances)
 *
 * Ce fichier contient les fonctions principales pour l'application
 * de gestion de répartition des élèves. Il gère:
 * - Le menu Google Sheets
 * - L'accès web pour les professeurs
 * - Les fonctions backend pour InterfaceV2
 * - La gestion des données de classes
 */

// ==================== CONSTANTES ====================

/**
 * Configuration des noms de colonnes dans _STRUCTURE
 */
const STRUCTURE_COLUMNS = {
  CLASSE: ['CLASSE_DEST', 'CLASSE', 'DESTINATION'],
  EFFECTIF: 'EFFECTIF',
  OPTIONS: 'OPTIONS'
};

/**
 * Configuration des index de colonnes pour les scores dans les onglets FIN
 */
const SCORE_COLUMNS = {
  SCORE_F: 20,  // Colonne U (index 0-based)
  SCORE_M: 21   // Colonne V (index 0-based)
};

/**
 * Valeurs par défaut
 */
const DEFAULTS = {
  CLASS_CAPACITY: 25,
  MAX_HEADER_SEARCH_ROWS: 10
};

/**
 * Patterns regex pour les types d'onglets
 */
const SHEET_PATTERNS = {
  SOURCE: /.+°\d+$/,      // Termine par °chiffre (ex: 5°1)
  FIN: /FIN$/i,
  TEST: /TEST$/i,
  CACHE: /CACHE$/i,
  PREVIOUS: /PREVIOUS$/i,
  INT: /INT$/i
};

// ==================== UTILITAIRES ====================

/**
 * Cache pour le Spreadsheet actif (optimisation performance)
 * @private
 */
let _cachedSpreadsheet = null;

/**
 * Récupère le Spreadsheet actif avec caching
 * Optimisation : évite les appels répétés à getActiveSpreadsheet()
 * @returns {Spreadsheet} Spreadsheet actif
 */
function getActiveSpreadsheetCached() {
  if (!_cachedSpreadsheet) {
    _cachedSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }
  return _cachedSpreadsheet;
}

/**
 * Réinitialise le cache du Spreadsheet
 * Utile si le spreadsheet change durant l'exécution
 */
function clearSpreadsheetCache() {
  _cachedSpreadsheet = null;
}

/**
 * Parse JSON de manière sécurisée avec gestion d'erreurs
 * @param {string} jsonString - Chaîne JSON à parser
 * @param {*} defaultValue - Valeur par défaut en cas d'erreur (default: null)
 * @returns {*} Objet parsé ou defaultValue
 */
function safeJSONParse(jsonString, defaultValue = null) {
  if (!jsonString || typeof jsonString !== 'string') {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    Logger.log(`⚠️ Erreur JSON.parse: ${e.message} | Input: ${jsonString.substring(0, 100)}...`);
    return defaultValue;
  }
}

/**
 * Récupère une propriété utilisateur de manière sécurisée
 * @param {string} key - Clé de la propriété
 * @param {*} defaultValue - Valeur par défaut
 * @returns {*} Valeur parsée ou defaultValue
 */
function safeGetUserProperty(key, defaultValue = null) {
  try {
    const props = PropertiesService.getUserProperties();
    const value = props.getProperty(key);

    if (!value) return defaultValue;

    return safeJSONParse(value, defaultValue);
  } catch (e) {
    Logger.log(`❌ Erreur safeGetUserProperty('${key}'): ${e.message}`);
    return defaultValue;
  }
}

/**
 * Définit une propriété utilisateur de manière sécurisée
 * @param {string} key - Clé de la propriété
 * @param {*} value - Valeur à stocker (sera JSONifiée)
 * @returns {boolean} true si succès, false sinon
 */
function safeSetUserProperty(key, value) {
  try {
    const props = PropertiesService.getUserProperties();
    const jsonValue = JSON.stringify(value);
    props.setProperty(key, jsonValue);
    return true;
  } catch (e) {
    Logger.log(`❌ Erreur safeSetUserProperty('${key}'): ${e.message}`);
    return false;
  }
}

// ==================== MENU ET INITIALISATION ====================

/**
 * Fonction déclenchée automatiquement à l'ouverture du spreadsheet
 * Crée le menu personnalisé "PILOTAGE CLASSE" avec tous les outils
 * @see {@link https://developers.google.com/apps-script/guides/triggers#onopene|Google Apps Script onOpen trigger}
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

// ==================== ACCÈS WEB (Interface Profs) ====================

/**
 * Point d'entrée pour l'application web (doGet trigger)
 * Renvoie l'interface InterfaceV2 pour les professeurs
 * @param {Object} e - Objet événement (paramètres GET)
 * @returns {HtmlOutput} Page HTML de l'interface professeurs
 * @see {@link https://developers.google.com/apps-script/guides/web|Google Apps Script Web Apps}
 */
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

// ==================== LANCEURS MODALES ====================

/**
 * Ouvre la Console de Pilotage V3 (interface principale)
 * Appelé depuis le menu "PILOTAGE CLASSE"
 */
function ouvrirConsolePilotageV3() {
  const html = HtmlService.createHtmlOutputFromFile('ConsolePilotageV3')
    .setWidth(1600).setHeight(900);
  SpreadsheetApp.getUi().showModalDialog(html, 'Console de Pilotage V3 - Expert Edition');
}

/**
 * Ouvre l'interface de configuration de la structure
 * Permet de définir les effectifs et quotas par classe
 */
function ouvrirConfigurationStructure() {
  const html = HtmlService.createHtmlOutputFromFile('ConfigurationComplete')
    .setWidth(1200).setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Configuration de la Structure');
}

/**
 * Ouvre l'interface de configuration complète
 * Alias de ouvrirConfigurationStructure()
 */
function ouvrirConfigurationComplete() {
  const html = HtmlService.createHtmlOutputFromFile('ConfigurationComplete')
    .setWidth(1200).setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Configuration Complète');
}

/**
 * Ouvre le module de création de groupes V4
 * Permet de créer des groupes d'élèves selon différents critères
 */
function ouvrirModuleGroupes() {
  const html = HtmlService.createHtmlOutputFromFile('GroupsInterfaceV4')
    .setWidth(1400).setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Module Groupes');
}

/**
 * Ouvre le module d'intégration d'un nouvel élève
 * Permet d'ajouter un élève au système existant
 */
function ouvrirModuleNouvelEleve() {
  const html = HtmlService.createHtmlOutputFromFile('InterfaceV2_NewStudentModule')
    .setWidth(1000).setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(html, 'Intégration Nouvel Élève');
}

// ==================== UTILITAIRES ADMIN & COMPATIBILITÉ ====================

/**
 * Déverrouille l'onglet _STRUCTURE en supprimant toutes les protections
 * Fonction utilitaire pour l'administration, utilisée avec précaution
 * @see Menu "PILOTAGE CLASSE" > "Déverrouiller _STRUCTURE"
 */
function deverrouillerStructure() {
  const ss = getActiveSpreadsheetCached();
  const sheet = ss.getSheetByName('_STRUCTURE');
  if (sheet) {
    sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(p => p.remove());
    SpreadsheetApp.getUi().alert('✅ Onglet _STRUCTURE déverrouillé.');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ Onglet _STRUCTURE introuvable.');
  }
}

/**
 * Lance le pipeline complet (fonction legacy)
 * Maintenue pour compatibilité avec les anciennes versions
 * @deprecated Utiliser la Console de Pilotage V3 à la place
 * @returns {*} Résultat du pipeline si la fonction existe
 */
function legacy_runFullPipeline() {
  if (typeof legacy_runFullPipeline_PRIME === 'function') {
    return legacy_runFullPipeline_PRIME();
  }
  SpreadsheetApp.getUi().alert("❌ Erreur : Moteur LEGACY introuvable.");
}

/**
 * Affiche les classes sources (fonction legacy)
 * Recherche les onglets avec le pattern "Classe°Numéro" (ex: "5°1")
 * @deprecated Fonction de compatibilité
 */
function legacy_viewSourceClasses() {
  const ss = getActiveSpreadsheetCached();
  const sourceSheets = ss.getSheets().filter(s => /.+°\d+$/.test(s.getName())); // Pattern universel : Classe°N
  if (sourceSheets.length > 0) {
    ss.setActiveSheet(sourceSheets[0]);
    SpreadsheetApp.getUi().alert('Classes sources trouvées : ' + sourceSheets.map(s => s.getName()).join(', '));
  } else {
    SpreadsheetApp.getUi().alert('Aucune classe source trouvée.');
  }
}

/**
 * Ouvre l'onglet _STRUCTURE (fonction legacy)
 * @deprecated Fonction de compatibilité
 */
function legacy_openStructure() {
  const ss = getActiveSpreadsheetCached();
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
      return SHEET_PATTERNS.FIN;
    case 'TEST':
      return SHEET_PATTERNS.TEST;
    case 'CACHE':
      return SHEET_PATTERNS.CACHE;
    case 'PREVIOUS':
      return SHEET_PATTERNS.PREVIOUS;
    default:
      return SHEET_PATTERNS.SOURCE;
  }
}

/**
 * Collecte les données brutes des onglets selon le mode
 * @param {string} mode - Mode de collecte
 * @returns {Object} Données brutes par classe
 */
function collectClassesDataByMode(mode) {
  const ss = getActiveSpreadsheetCached();
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
  // Liste des champs standards à normaliser (mapping majuscules -> minuscules)
  const FIELD_MAPPINGS = [
    'NOM', 'PRENOM', 'SEXE', 'LV2', 'OPT',
    'ASSO', 'DISSO', 'DISPO', 'MOBILITE', 'SOURCE'
  ];

  return rows.map(row => {
    const eleve = {};

    // Mapper toutes les colonnes
    headers.forEach((header, idx) => {
      if (!header) return;
      eleve[header] = row[idx];
      if (!eleve.id && header === 'ID_ELEVE') {
        eleve.id = String(row[idx] || '').trim();
      }
    });

    // ID par défaut (première colonne)
    if (!eleve.id) {
      eleve.id = String(row[0] || '').trim();
    }

    // Créer l'objet scores pour le frontend
    eleve.scores = {
      COM: eleve.COM || 0,
      TRA: eleve.TRA || 0,
      PART: eleve.PART || 0,
      ABS: eleve.ABS || 0
    };

    // Normaliser les champs en minuscules pour compatibilité frontend
    FIELD_MAPPINGS.forEach(field => {
      eleve[field.toLowerCase()] = eleve[field] || '';
    });

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
 * Trouve la ligne d'en-tête et les index de colonnes dans _STRUCTURE
 * @param {Array} data - Données de l'onglet _STRUCTURE
 * @returns {Object|null} {headerRow, headers, destIdx, effectifIdx, optionsIdx} ou null si non trouvé
 */
function findStructureHeaderInfo(data) {
  if (!data || !data.length) return null;

  // Trouver la ligne d'en-tête
  let headerRow = 0;
  for (let i = 0; i < Math.min(data.length, DEFAULTS.MAX_HEADER_SEARCH_ROWS); i++) {
    const row = data[i].map(v => String(v || '').toUpperCase());
    if (STRUCTURE_COLUMNS.CLASSE.some(col => row.includes(col))) {
      headerRow = i;
      break;
    }
  }

  const headers = data[headerRow].map(h => String(h || ''));
  const destIdx = headers.findIndex(h => STRUCTURE_COLUMNS.CLASSE.includes(h.toUpperCase()));
  const effectifIdx = headers.findIndex(h => h.toUpperCase() === STRUCTURE_COLUMNS.EFFECTIF);
  const optionsIdx = headers.findIndex(h => h.toUpperCase() === STRUCTURE_COLUMNS.OPTIONS);

  return { headerRow, headers, destIdx, effectifIdx, optionsIdx };
}

/**
 * Charge les règles de structure (_STRUCTURE)
 * @returns {Object} Règles par classe {capacity, quotas}
 */
function loadStructureRules() {
  const ss = getActiveSpreadsheetCached();
  const sheet = ss.getSheetByName('_STRUCTURE');
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  const headerInfo = findStructureHeaderInfo(data);

  if (!headerInfo || headerInfo.destIdx === -1) return {};

  const { headerRow, destIdx, effectifIdx, optionsIdx } = headerInfo;
  const rules = {};

  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    const classe = String(row[destIdx] || '').trim();
    if (!classe) continue;

    const capacity = effectifIdx === -1 ? DEFAULTS.CLASS_CAPACITY : Number(row[effectifIdx]) || DEFAULTS.CLASS_CAPACITY;
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
    const cache = safeGetUserProperty('INTERFACEV2_CACHE');

    if (!cache) {
      return { success: true, exists: false };
    }

    return {
      success: true,
      exists: true,
      date: cache.timestamp || new Date().toISOString(),
      mode: cache.mode || 'unknown'
    };
  } catch (e) {
    Logger.log(`❌ Erreur getLastCacheInfo: ${e.message}`);
    return { success: false, error: e.toString() };
  }
}

/**
 * Récupère et efface le contexte du pont depuis ConsolePilotage
 * @returns {Object} {success: boolean, context: Object}
 */
function getBridgeContextAndClear() {
  try {
    const context = safeGetUserProperty('JULES_CONTEXT');

    if (!context) {
      return { success: true, context: null };
    }

    // Effacer la propriété après lecture
    PropertiesService.getUserProperties().deleteProperty('JULES_CONTEXT');

    return { success: true, context };
  } catch (e) {
    Logger.log(`❌ Erreur getBridgeContextAndClear: ${e.message}`);
    return { success: false, error: e.toString() };
  }
}

/**
 * Sauvegarde les données dans le cache (PropertiesService uniquement)
 * @param {Object} cacheData - Données à sauvegarder
 * @returns {Object} {success: boolean}
 */
function saveCacheData(cacheData) {
  const success = safeSetUserProperty('INTERFACEV2_CACHE', cacheData);

  if (!success) {
    return { success: false, error: 'Échec de la sauvegarde du cache' };
  }

  return { success: true };
}

/**
 * Sauvegarde la disposition dans les onglets Google Sheets (création des onglets CACHE)
 * @param {Object} disposition - Objet {className: {headers: [], students: []}}
 * @returns {Object} {success: boolean, saved: number, failed: number, errors: Array, timestamp: string}
 */
function saveDispositionToSheets(disposition) {
  try {
    // Validation des paramètres
    if (!disposition || typeof disposition !== 'object' || Object.keys(disposition).length === 0) {
      return { success: false, error: 'Paramètre disposition invalide ou vide' };
    }

    const ss = getActiveSpreadsheetCached();
    let savedCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const className in disposition) {
      try {
        const classData = disposition[className];

        // Validation des données de classe
        if (!classData || !classData.headers || !classData.students) {
          throw new Error(`Données invalides pour la classe ${className}`);
        }

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
        const allRows = [classData.headers, ...classData.students];
        if (allRows.length > 0 && classData.headers.length > 0) {
          cacheSheet.getRange(1, 1, allRows.length, classData.headers.length)
            .setValues(allRows);
          savedCount++;
        }
      } catch (classError) {
        failedCount++;
        const errorMsg = `Erreur pour ${className}: ${classError.message}`;
        errors.push(errorMsg);
        Logger.log(`⚠️ ${errorMsg}`);
      }
    }

    SpreadsheetApp.flush();

    Logger.log(`💾 Sauvegarde terminée: ${savedCount} succès, ${failedCount} échecs`);

    return {
      success: failedCount === 0,
      saved: savedCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

  } catch (e) {
    Logger.log(`❌ Erreur critique saveDispositionToSheets: ${e.message}`);
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * Charge les données depuis le cache
 * @returns {Object} {success: boolean, data: Object}
 */
function loadCacheData() {
  try {
    const data = safeGetUserProperty('INTERFACEV2_CACHE');

    return { success: true, data };
  } catch (e) {
    Logger.log(`❌ Erreur loadCacheData: ${e.message}`);
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
    const ss = getActiveSpreadsheetCached();
    
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
    const ss = getActiveSpreadsheetCached();
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
    // Validation des paramètres
    if (password === undefined || password === null) {
      return { success: false, error: 'Mot de passe non fourni' };
    }

    const adminPassword = getAdminPasswordFromConfig();

    if (!adminPassword) {
      return { success: false, error: 'Mot de passe admin non configuré dans _CONFIG' };
    }

    const isValid = String(password).trim() === adminPassword;

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
    const ss = getActiveSpreadsheetCached();
    const finSheets = ss.getSheets().filter(s => SHEET_PATTERNS.FIN.test(s.getName()));

    if (finSheets.length === 0) {
      return { success: false, error: 'Aucun onglet FIN trouvé' };
    }

    const data = {};

    finSheets.forEach(sheet => {
      const sheetData = sheet.getDataRange().getValues();
      if (sheetData.length < 2) return;

      const headers = sheetData[0];

      const eleves = sheetData.slice(1)
        .filter(row => row[0] && String(row[0]).trim() !== '')
        .map(row => {
          const eleve = {};
          headers.forEach((header, idx) => {
            if (header) eleve[header] = row[idx];
          });

          // Ajouter les scores spécifiques depuis les constantes
          eleve.SCORE_F = row[SCORE_COLUMNS.SCORE_F] || 0;
          eleve.SCORE_M = row[SCORE_COLUMNS.SCORE_M] || 0;

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
    // Validation des paramètres
    if (!newRules || typeof newRules !== 'object' || Object.keys(newRules).length === 0) {
      return { success: false, error: 'Paramètre newRules invalide ou vide' };
    }

    const ss = getActiveSpreadsheetCached();
    const sheet = ss.getSheetByName('_STRUCTURE');

    if (!sheet) {
      return { success: false, error: 'Onglet _STRUCTURE introuvable' };
    }

    const data = sheet.getDataRange().getValues();
    const headerInfo = findStructureHeaderInfo(data);

    if (!headerInfo || headerInfo.destIdx === -1) {
      return { success: false, error: 'Colonne CLASSE_DEST introuvable dans _STRUCTURE' };
    }

    const { headerRow, destIdx, effectifIdx, optionsIdx } = headerInfo;

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
    const ss = getActiveSpreadsheetCached();
    const intSheets = ss.getSheets().filter(s => SHEET_PATTERNS.INT.test(s.getName()));

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
