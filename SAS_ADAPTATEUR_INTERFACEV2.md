# 🔄 SAS ADAPTATEUR - InterfaceV2 BASE 18

## 📋 **Contexte**

### Problème identifié
- **BASE 14** : InterfaceV2 fonctionnait avec un format de données spécifique
- **BASE 18** : Migration vers Console Pilotage, mais incompatibilité de format entre le backend et InterfaceV2
- **Symptôme** : InterfaceV2 ne charge pas les onglets TEST/FIN, erreur "Aucune donnée trouvée"

### Cause racine
La fonction `getClassesData(mode)` dans `Backend_Eleves.js` retourne un format incompatible avec ce qu'attend InterfaceV2.

---

## 🎯 **Solution : SAS Transitionnel**

Un **adaptateur de format** qui transforme les données du backend BASE 18 vers le format attendu par InterfaceV2.

### Principe
```
Backend BASE 18 (ancien format)
          ↓
    [SAS ADAPTATEUR]  ← Transforme les données
          ↓
InterfaceV2 (format attendu)
```

---

## 📊 **Formats de données**

### FORMAT SOURCE (Backend_Eleves.js - BASE 18)

```javascript
// Retour de getClassesData(mode)
{
  "6°1TEST": {
    sheetName: "6°1TEST",
    headers: ["ID_ELEVE", "NOM", "PRENOM", "SEXE", "LV2", "OPT", "COM", "TRA", "PART", "ABS", ...],
    students: [
      ["ID001", "DUPONT", "Jean", "M", "ESP", "CHAV", 3, 4, 2, 0, ...],
      ["ID002", "MARTIN", "Marie", "F", "ITA", "LATIN", 4, 3, 5, 0, ...],
      ...
    ],
    rowCount: 25,
    timestamp: 1732363200000
  },
  "6°2TEST": { ... },
  "BRESSOLS°1TEST": { ... }
}
```

### FORMAT CIBLE (InterfaceV2)

```javascript
// Format attendu par InterfaceV2_CoreScript.html
{
  success: true,
  data: [
    {
      classe: "6°1",              // Nom de classe sans suffixe TEST/FIN
      eleves: [
        {
          id: "ID001",
          ID_ELEVE: "ID001",
          NOM: "DUPONT",
          PRENOM: "Jean",
          SEXE: "M",
          LV2: "ESP",
          OPT: "CHAV",
          COM: 3,
          TRA: 4,
          PART: 2,
          ABS: 0,
          // ... tous les autres champs des headers
        },
        { id: "ID002", ... }
      ],
      sheetName: "6°1TEST",       // Nom complet de l'onglet
      headers: ["ID_ELEVE", "NOM", ...],
      rowCount: 25
    },
    { classe: "6°2", eleves: [...], ... },
    { classe: "BRESSOLS°1", eleves: [...], ... }
  ],
  rules: {
    "6°1": { capacity: 25, quotas: {} },
    "6°2": { capacity: 25, quotas: {} },
    "6°3": { capacity: 25, quotas: { ITA: 6 } },
    ...
  },
  timestamp: 1732363200000
}
```

---

## 🔧 **Implémentation**

### Fonction principale : `getClassesDataForInterfaceV2(mode)`

**Localisation** : `Backend_Eleves.js`  
**Type** : Fonction de transformation (wrapper)  
**Exposition** : Accessible depuis InterfaceV2 via `google.script.run`

### Algorithme

1. **Appeler** `getClassesData(mode)` pour récupérer les données brutes
2. **Charger les règles** depuis `_STRUCTURE` ou `_BASEOPTI`
3. **Transformer** chaque onglet :
   - Convertir les arrays `students` en objets `eleves`
   - Mapper chaque cellule selon les `headers`
   - Ajouter le champ `id` si manquant
   - Extraire le nom de classe (retirer TEST/FIN)
4. **Retourner** au format `{success, data, rules}`

### Gestion des erreurs

- Si aucun onglet trouvé → `{success: false, error: "Aucun onglet trouvé", data: []}`
- Si erreur de lecture → `{success: false, error: message, data: []}`
- Si règles introuvables → `rules: {}` (objet vide)

---

## 🔀 **Flux d'appel**

### Avant (BASE 14 fonctionnel)
```
InterfaceV2 
  → google.script.run.getClassesData(mode)
  → Retour direct format attendu
  → Affichage OK
```

### Maintenant (BASE 18 avec SAS)
```
InterfaceV2 
  → google.script.run.getClassesDataForInterfaceV2(mode)
  → getClassesData(mode) [format BASE 18]
  → [SAS TRANSFORMATION]
  → Retour format InterfaceV2
  → Affichage OK
```

---

## 📝 **Modifications nécessaires**

### 1. Backend_Eleves.js
- ✅ Conserver `getClassesData(mode)` tel quel (format BASE 18)
- ➕ Ajouter `getClassesDataForInterfaceV2(mode)` (SAS)

### 2. InterfaceV2_CoreScript.html
- 🔧 Remplacer `gsRun('getClassesData', mode)` 
- ➡️ Par `gsRun('getClassesDataForInterfaceV2', mode)`

### 3. Aucune autre modification requise
- ✅ Console Pilotage non impactée
- ✅ Autres scripts BASE 18 non impactés
- ✅ Formatage des onglets (couleurs) conservé

---

## 🎨 **Corrections de couleurs déjà appliquées**

Les nouvelles couleurs ont été appliquées dans les fichiers suivants :

### Couleurs personnalisées
- **SEXE** : F = `#f5b7b1` (rose), M = `#85c1e9` (bleu)
- **LV2 ITA** : `#d5f5e3` (vert pastel)
- **OPT LATIN** : `#e8f8f5` (vert d'eau)
- **OPT GREC** : `#f6ca9d` (orange clair)
- **Score 3** : `#8ec875` (vert doux)

### Fichiers modifiés
1. `LEGACY_Pipeline.js` (formatage onglets FIN)
2. `LEGACY_Init_Onglets.js` (formatage onglets TEST)
3. `Backend_Finalisation.js`
4. `ConsolePilotageV4_NonBlocking_Server.js` (formatage DEF)
5. `ConsolePilotage_Server.js` (formatage DEF)
6. `ConsolePilotageV3_Server.js` (formatage FIN V3)

---

## ✅ **Tests à effectuer**

### Test 1 : Mode TEST
1. Ouvrir InterfaceV2
2. Cliquer sur bouton "TEST"
3. Vérifier que les onglets TEST se chargent
4. Vérifier les données élèves affichées

### Test 2 : Mode FIN
1. Cliquer sur bouton "FIN"
2. Entrer le mot de passe admin
3. Vérifier que les onglets FIN se chargent

### Test 3 : Compatibilité
1. Tester Console Pilotage (doit fonctionner)
2. Tester génération onglets TEST (doit fonctionner)
3. Tester génération onglets FIN (doit fonctionner)

---

## 🔮 **Évolution future**

### Option 1 : Migration complète
- Réécrire tous les appels à `getClassesData()` dans BASE 18
- Adopter définitivement le nouveau format
- Supprimer le SAS (devenu inutile)

### Option 2 : Conservation du SAS
- Garder le SAS comme couche de compatibilité
- Facilite les futures migrations
- Permet de changer le format backend sans casser l'interface

---

## 📚 **Références**

### Fichiers clés
- `Backend_Eleves.js` : Contient les fonctions de données
- `InterfaceV2_CoreScript.html` : Appelle le backend
- `Config.js` : Configuration TEST_SUFFIX, DEF_SUFFIX
- `Structure.js` : Stockage des règles de classes

### Logs pertinents
```
✅ 5 classes trouvées pour mode TEST
✅ rules (DEST-only) : {...}
```

### Sessions de travail
- **23 nov. 2025** : Identification du problème BASE 14 vs BASE 18
- **23 nov. 2025** : Conception du SAS transitionnel
- **23 nov. 2025** : Documentation du SAS

---

## ⚠️ **Notes importantes**

1. **Ne PAS modifier** `getClassesData()` dans Backend_Eleves.js (utilisée par d'autres modules)
2. **Toujours tester** après modification du SAS
3. **Documenter** tout changement de format
4. **Logs** : Activer le Logger pour suivre les transformations

---

## 👥 **Maintenance**

**Responsable** : Équipe BASE 18  
**Dernière mise à jour** : 23 novembre 2025  
**Version** : 1.0.0  
**Status** : 🟡 En cours d'implémentation
