# 🏗️ PHASE 5 : PLAN DE REFACTORING ARCHITECTURE

**Branche :** `claude/phase5-architecture-refactor-01YWWEfn3SoDKFKYkPCrpwS7`
**Objectif :** 8673 lignes monolithiques → ~2500 lignes modulaires
**Effort :** 2-3 semaines (progressif et testé)

---

## 📊 ANALYSE DES FICHIERS

### 1. **Orchestration_V14I.js** (3365 lignes, 78 fonctions)

**Nature :** Backend Google Apps Script - Orchestrateur principal du pipeline OPTI

**Catégories de fonctions identifiées :**

#### 🔧 Utilitaires purs (→ App.Core.js) - ~15 fonctions
```
- buildSheetName_() - Construction noms onglets
- makeSheetsList_() - Génération listes
- tagPhase_() - Tagging résultats
- collectWarnings_() - Agrégation warnings
- Autres helpers purs...
```

#### 📦 Accès données Sheets (→ App.SheetsData.js) - ~20 fonctions
```
- getActiveSS_() - Récupération spreadsheet
- getOrCreateSheet_() - Gestion onglets
- readElevesFromSheet_() - Lecture élèves
- writeElevesToSheet_() - Écriture élèves
- readQuotasFromStructure_() - Lecture quotas
- readSourceToDestMapping_() - Lecture mappings
- writeAllClassesToCACHE_() - Écriture cache
- clearSheets_() - Nettoyage onglets
```

#### 🎯 Construction contexte (→ App.Context.js) - ~15 fonctions
```
- makeCtxFromSourceSheets_() - Contexte LEGACY
- makeCtxFromUI_() - Contexte UI
- readModeFromUI_() - Lecture mode
- readNiveauxFromUI_() - Lecture niveaux
- readQuotasFromUI_() - Lecture quotas
- readParityToleranceFromUI_() - Tolérance parité
- readMaxSwapsFromUI_() - Max swaps
```

#### 🔄 Logique métier Phases (→ GARDER dans Orchestration) - ~20 fonctions
```
- runOptimizationV14FullI() - Point d'entrée
- Phase1I_dispatchOptionsLV2_() - Phase 1
- applyDisso_() - Phase 2
- assignOptionsThenLV2_() - Dispatch
- dispatchElevesWithQuotas_() - Répartition
```

#### 🖥️ Interface/UI (→ App.UIBridge.js) - ~8 fonctions
```
- forceCacheInUIAndReload_() - Reload UI
- setInterfaceModeCACHE_() - Mode interface
- activateFirstCacheTabIfAny_() - Activation onglet
- triggerUIReloadFromCACHE_() - Trigger reload
- announcePhaseDone_() - Annonce fin phase
```

---

### 2. **Orchestration_V14I_Stream.js** (1896 lignes)

**Nature :** Variante streaming du pipeline OPTI

**À analyser :** Probablement beaucoup de duplication avec Orchestration_V14I.js

---

### 3. **Phases_BASEOPTI_V3_COMPLETE.js** (1527 lignes)

**Nature :** Implémentation Phase 4 (optimisation par swaps)

**À analyser :** Logique métier pure, peut extraire utilitaires

---

### 4. **BASEOPTI_System.js** (929 lignes)

**Nature :** Système de gestion BASEOPTI

**À analyser :** Gestion state + data + config

---

### 5. **Initialisation.js** (956 lignes)

**Nature :** Initialisation système

**À analyser :** Setup + configuration + bootstrapping

---

## 🎯 ARCHITECTURE CIBLE

### Modules à créer (Google Apps Script - Backend)

```
📦 src/
├── 📂 core/
│   ├── App.Core.js           (Utilitaires purs - 300-400 lignes)
│   │   ├─ buildSheetName()
│   │   ├─ makeSheetsList()
│   │   ├─ tagPhase()
│   │   ├─ collectWarnings()
│   │   └─ ...helpers
│   │
│   └── App.Context.js        (Construction contexte - 400-500 lignes)
│       ├─ makeCtxFromSourceSheets()
│       ├─ makeCtxFromUI()
│       ├─ readModeFromUI()
│       └─ ...ctx builders
│
├── 📂 data/
│   ├── App.SheetsData.js     (Accès Google Sheets - 500-600 lignes)
│   │   ├─ getActiveSS()
│   │   ├─ readElevesFromSheet()
│   │   ├─ writeElevesToSheet()
│   │   ├─ readQuotasFromStructure()
│   │   └─ ...sheets operations
│   │
│   └── App.CacheManager.js   (Gestion cache - 200-300 lignes)
│       ├─ writeAllClassesToCACHE()
│       ├─ readElevesFromCache()
│       ├─ clearSheets()
│       └─ ...cache ops
│
├── 📂 ui/
│   └── App.UIBridge.js       (Bridge UI - 200-300 lignes)
│       ├─ forceCacheInUIAndReload()
│       ├─ setInterfaceModeCACHE()
│       ├─ announcePhaseDone()
│       └─ ...ui triggers
│
└── 📂 orchestration/
    ├── Orchestration_V14I.js       (Orchestrateur OPTI - 600 lignes)
    │   └─ runOptimizationV14FullI() + phases
    │
    ├── Orchestration_Stream.js     (Streaming - 500 lignes)
    │
    └── Phases_BASEOPTI_V3.js       (Phase 4 - 500 lignes)
```

---

## 📅 STRATÉGIE D'EXÉCUTION (INCRÉMENTALE)

### ✅ Phase 5.1 : Analyse et Plan (1 jour) - **EN COURS**
- [x] Analyser Orchestration_V14I.js (78 fonctions)
- [ ] Analyser Orchestration_V14I_Stream.js
- [ ] Analyser Phases_BASEOPTI_V3_COMPLETE.js
- [ ] Analyser BASEOPTI_System.js
- [ ] Analyser Initialisation.js
- [ ] Finaliser architecture cible

### 🔄 Phase 5.2 : Extraction App.Core.js (2 jours)
**Objectif :** Extraire ~15 fonctions utilitaires pures

**Approche :**
1. Créer App.Core.js avec fonctions pures
2. Tester chaque fonction isolément
3. Remplacer appels dans fichiers sources
4. Commit + Test pipeline complet

**Fonctions à extraire :**
```javascript
// App.Core.js
function buildSheetName(niveau, suffix) { ... }
function makeSheetsList(niveaux, suffix) { ... }
function tagPhase(name, res) { ... }
function collectWarnings(phases) { ... }
// ... + 11 autres
```

### 🔄 Phase 5.3 : Extraction App.SheetsData.js (3 jours)
**Objectif :** Extraire ~20 fonctions d'accès Google Sheets

**Approche :**
1. Créer App.SheetsData.js avec API Sheets
2. Tester avec vrai spreadsheet
3. Remplacer appels
4. Commit + Test

### 🔄 Phase 5.4 : Extraction App.Context.js (2 jours)
**Objectif :** Extraire ~15 fonctions de construction contexte

### 🔄 Phase 5.5 : Extraction App.CacheManager.js (2 jours)
**Objectif :** Centraliser gestion cache

### 🔄 Phase 5.6 : Extraction App.UIBridge.js (1 jour)
**Objectif :** Isoler interactions UI

### 🔄 Phase 5.7 : Refactor Orchestration_V14I.js (2 jours)
**Objectif :** Réduire à 600 lignes (logique métier uniquement)

### 🔄 Phase 5.8 : Autres fichiers (3 jours)
**Objectif :** Refactor Stream, BASEOPTI, Initialisation

### ✅ Phase 5.9 : Tests & Validation (2 jours)
- Test Console V3 → Pipeline LEGACY
- Test InterfaceV2 → Pipeline OPTI
- Test toutes les phases
- Validation complète

---

## ⚠️ PRINCIPES CLÉS

### 1. **Approche incrémentale**
- 1 module à la fois
- 1 commit par module
- Tests après chaque extraction

### 2. **Backward compatibility**
- Garder fonctions originales temporairement
- Créer wrappers si nécessaire
- Supprimer old code seulement après validation

### 3. **Tests systématiques**
- Tester chaque module isolément
- Tester intégration complète
- Valider Console V3 + InterfaceV2

### 4. **Documentation**
- JSDoc pour chaque fonction
- README par module
- Exemples d'utilisation

---

## 📊 MÉTRIQUES DE SUCCÈS

| Métrique | Avant | Objectif | Statut |
|----------|-------|----------|--------|
| **Lignes totales** | 8673 | ~2500 | 0% |
| **Fichiers monolithiques** | 5 | 0 | 0% |
| **Modules créés** | 0 | 7 | 0% |
| **Fonctions moyennes/fichier** | 15-20 | 10-15 | 0% |
| **Duplication code** | Élevée | Faible | 0% |
| **Tests passants** | ? | 100% | 0% |

---

## 🚀 PROCHAINE ÉTAPE

**MAINTENANT : Commencer Phase 5.2**

1. Créer App.Core.js
2. Extraire 5 premières fonctions utilitaires
3. Tester
4. Commit

**Veux-tu que je commence ?**
- A) OUI, extraire App.Core.js maintenant
- B) D'abord finir analyse autres fichiers
- C) Autre approche ?
