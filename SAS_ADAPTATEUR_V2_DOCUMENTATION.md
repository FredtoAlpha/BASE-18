# 🎯 ADAPTATEUR SAS INTERFACEV2 - Documentation Technique

## Vue d'ensemble

L'adaptateur SAS (Système d'Adaptation de Structures) est un ensemble de fonctions qui convertissent les données brutes des onglets Google Sheets au format attendu par InterfaceV2.

---

## Architecture du SAS

### 🔄 Flux de données

```
┌─────────────────┐
│ InterfaceV2     │
│ loadDataForMode │
└────────┬────────┘
         │ gsRun('getClassesDataForInterfaceV2', mode)
         ▼
┌─────────────────────────────────────────────┐
│ 🎯 ADAPTATEUR SAS                           │
│ getClassesDataForInterfaceV2(mode)          │
│                                             │
│  1. collectClassesDataByMode(mode)          │
│     └─ resolveSheetFilter(mode)             │
│        └─ Filtre les onglets TEST/FIN/etc   │
│                                             │
│  2. mapStudentsForInterface(headers, rows)  │
│     └─ Convertit les lignes en objets       │
│                                             │
│  3. loadStructureRules()                    │
│     └─ Extrait capacités et quotas          │
│                                             │
│  4. normalizeClasseName(sheetName)          │
│     └─ Enlève suffixes TEST/FIN             │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ FORMAT DE SORTIE                            │
│ {                                           │
│   success: true,                            │
│   data: [                                   │
│     {                                       │
│       classe: "6°1",                        │
│       eleves: [{id, NOM, PRENOM, ...}],     │
│       sheetName: "6°1TEST",                 │
│       headers: [...],                       │
│       rowCount: 28                          │
│     }                                       │
│   ],                                        │
│   rules: {                                  │
│     "6°1": {                                │
│       capacity: 28,                         │
│       quotas: {LATIN: 8, GREC: 4}           │
│     }                                       │
│   },                                        │
│   timestamp: 1700000000000                  │
│ }                                           │
└─────────────────────────────────────────────┘
```

---

## Fonctions du SAS

### 1. `resolveSheetFilter(mode)` 
**Rôle** : Convertit le mode en expression régulière de filtrage

**Entrée** :
- `mode` (string) : Mode de recherche ('TEST', 'FIN', 'CACHE', 'PREVIOUS', 'SOURCES')

**Sortie** :
- RegExp : Expression régulière pour filtrer les onglets

**Exemples** :
```javascript
resolveSheetFilter('TEST')     → /TEST$/
resolveSheetFilter('FIN')      → /FIN$/
resolveSheetFilter('CACHE')    → /CACHE$/
resolveSheetFilter('PREVIOUS') → /PREVIOUS$/
resolveSheetFilter('SOURCES')  → /.+°\d+$/  // Ex: 6°1, CM2°3
```

---

### 2. `collectClassesDataByMode(mode)`
**Rôle** : Collecte les données brutes de tous les onglets correspondant au mode

**Entrée** :
- `mode` (string) : Mode de collecte

**Sortie** :
```javascript
{
  "6°1TEST": {
    sheetName: "6°1TEST",
    headers: ["ID_ELEVE", "NOM", "PRENOM", "SEXE", ...],
    students: [[...], [...], ...],  // Tableau 2D brut
    rowCount: 28,
    timestamp: 1700000000000
  },
  "6°2TEST": { ... }
}
```

---

### 3. `mapStudentsForInterface(headers, rows)`
**Rôle** : Convertit les lignes 2D en objets élèves

**Entrée** :
- `headers` (Array) : Liste des en-têtes de colonnes
- `rows` (Array[Array]) : Lignes de données brutes

**Sortie** :
```javascript
[
  {
    id: "E001",
    ID_ELEVE: "E001",
    NOM: "DUPONT",
    PRENOM: "Marie",
    SEXE: "F",
    COM: 4.5,
    TRA: 3.8,
    ...
  },
  { ... }
]
```

**Logique** :
1. Pour chaque ligne, crée un objet avec `header → valeur`
2. Garantit que `eleve.id` existe (cherche `ID_ELEVE` ou colonne 0)
3. Filtre les élèves sans ID

---

### 4. `normalizeClasseName(sheetName)`
**Rôle** : Supprime les suffixes TEST/FIN/CACHE/PREVIOUS du nom d'onglet

**Exemples** :
```javascript
normalizeClasseName("6°1TEST")     → "6°1"
normalizeClasseName("6°2FIN")      → "6°2"
normalizeClasseName("CM2°3CACHE")  → "CM2°3"
normalizeClasseName("6°1")         → "6°1"  (inchangé)
```

---

### 5. `loadStructureRules()`
**Rôle** : Extrait les capacités et quotas depuis l'onglet `_STRUCTURE`

**Format attendu de _STRUCTURE** :
```
| CLASSE_DEST | EFFECTIF | OPTIONS           |
|-------------|----------|-------------------|
| 6°1         | 28       | LATIN:8, GREC:4   |
| 6°2         | 27       | LATIN:10          |
```

**Sortie** :
```javascript
{
  "6°1": {
    capacity: 28,
    quotas: {
      LATIN: 8,
      GREC: 4
    }
  },
  "6°2": {
    capacity: 27,
    quotas: {
      LATIN: 10
    }
  }
}
```

**Logique** :
1. Cherche la ligne d'en-tête (contient `CLASSE_DEST`, `CLASSE` ou `DESTINATION`)
2. Identifie les colonnes `EFFECTIF` et `OPTIONS`
3. Parse chaque ligne pour extraire capacité et quotas
4. Quotas format : `OPT1:nombre, OPT2:nombre` ou `OPT1=nombre`

---

### 6. `getClassesDataForInterfaceV2(mode)` 🎯
**Rôle** : Fonction principale du SAS - Orchestre toutes les conversions

**Entrée** :
- `mode` (string) : Mode de chargement (TEST, FIN, CACHE, etc.)

**Sortie** :
```javascript
{
  success: true,
  data: [
    {
      classe: "6°1",           // Normalisé (sans TEST/FIN)
      eleves: [...],           // Objets élèves
      sheetName: "6°1TEST",    // Nom complet de l'onglet
      headers: [...],          // En-têtes de colonnes
      rowCount: 28             // Nombre d'élèves
    }
  ],
  rules: {
    "6°1": { capacity: 28, quotas: {...} }
  },
  timestamp: 1700000000000
}
```

**En cas d'erreur** :
```javascript
{
  success: false,
  error: "Aucun onglet trouvé pour le mode: TEST",
  data: []
}
```

---

## Intégration avec InterfaceV2

### Ancien code (❌ format incompatible)
```javascript
const result = await gsRun('getClassesData', mode);
// Retournait: { success: true, data: { "6°1TEST": {...}, "6°2TEST": {...} } }
// Format dictionnaire → ❌ Interface attendait un array
```

### Nouveau code (✅ format adapté)
```javascript
const result = await gsRun('getClassesDataForInterfaceV2', mode);
// Retourne: { success: true, data: [{classe:"6°1", eleves:[...]}, ...] }
// Format array avec rules → ✅ Compatible InterfaceV2
```

---

## Gestion des modes

| Mode       | Filtre regex  | Exemple onglets trouvés    |
|------------|---------------|----------------------------|
| `TEST`     | `/TEST$/`     | 6°1TEST, 6°2TEST           |
| `FIN`      | `/FIN$/`      | 6°1FIN, 6°2FIN             |
| `CACHE`    | `/CACHE$/`    | 6°1CACHE, 6°2CACHE         |
| `PREVIOUS` | `/PREVIOUS$/` | 6°1PREVIOUS, 6°2PREVIOUS   |
| `SOURCES`  | `/.+°\d+$/`   | 6°1, 6°2, CM2°1 (sans suffixe) |

---

## Tests et Validation

### Test de la fonction principale
```javascript
function testSAS() {
  const result = getClassesDataForInterfaceV2('TEST');
  Logger.log(JSON.stringify(result, null, 2));
  
  // Vérifications :
  // ✓ result.success === true
  // ✓ result.data est un Array
  // ✓ result.data[0].classe existe
  // ✓ result.data[0].eleves est un Array
  // ✓ result.rules contient les capacités
}
```

### Test du chargement des règles
```javascript
function testStructureRules() {
  const rules = loadStructureRules();
  Logger.log(JSON.stringify(rules, null, 2));
  
  // Vérifications :
  // ✓ rules["6°1"].capacity est un nombre
  // ✓ rules["6°1"].quotas est un objet
}
```

---

## Compatibilité et Migration

### Fonction legacy maintenue
```javascript
function getClassesData(mode = 'source') {
  // Ancienne fonction maintenue pour compatibilité
  // Retourne l'ancien format dictionnaire
  const classesData = collectClassesDataByMode(mode);
  return { success: true, data: classesData };
}
```

### Migration progressive
1. **Phase 1** : InterfaceV2 utilise `getClassesDataForInterfaceV2` (nouveau format)
2. **Phase 2** : Modules legacy continuent d'utiliser `getClassesData` (ancien format)
3. **Phase 3** : Migration future de tous les modules vers le nouveau format

---

## Points d'attention

### ⚠️ Dépendance à _STRUCTURE
- Si `_STRUCTURE` est absent → `rules = {}`
- Si format incorrect → `rules = {}`
- L'interface doit gérer l'absence de rules

### ⚠️ Format des en-têtes
- Le mapping repose sur les noms de colonnes exacts
- `ID_ELEVE` doit exister (sinon utilise colonne 0)
- Colonnes vides sont ignorées

### ⚠️ Performance
- `collectClassesDataByMode` charge TOUS les onglets en mémoire
- Optimisation possible si > 50 classes

---

## Évolutions futures

### 🔮 Améliorations prévues
1. **Cache** : Mettre en cache les règles `_STRUCTURE`
2. **Validation** : Vérifier la cohérence des données
3. **Métadonnées** : Ajouter statistiques globales dans la réponse
4. **Lazy loading** : Charger les onglets à la demande

---

## Résumé

**Le SAS résout le problème de format** entre :
- **Backend BASE 18** : Format dictionnaire brut par onglet
- **InterfaceV2** : Format array structuré avec métadonnées

**Avantages** :
✅ Séparation des responsabilités  
✅ Format prévisible pour l'interface  
✅ Intégration des règles de structure  
✅ Normalisation des noms de classes  
✅ Compatibilité legacy maintenue  

**Fichiers impactés** :
- `Code.js` / `Code.gs` : Contient toutes les fonctions SAS
- `InterfaceV2_CoreScript.html` : Appelle `getClassesDataForInterfaceV2`
