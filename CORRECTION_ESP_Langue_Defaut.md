# 🔧 CORRECTION MAJEURE - ESP = Langue par défaut

**Date :** 22 novembre 2025  
**Gravité :** CRITIQUE (logique fondamentale du pipeline)  
**Status :** ✅ CORRIGÉ

---

## 📋 PROBLÈME IDENTIFIÉ PAR L'UTILISATEUR

### **Avant (logique correcte) :**
```
- LV2 "rares" : ITA, ALL, PT → Marquées dans colonne LV2
- ESP : LV2 par défaut → PAS marquée (colonne vide)

Phase 1 : Place uniquement ITA, ALL, PT, CHAV, LATIN (30 élèves)
Phase 3 : Place les élèves ESP restants (104 élèves)
```

### **Maintenant (logique cassée) :**
```
- TOUS les élèves ont ESP marqué dans colonne LV2
- ESP traité comme option contraignante

Phase 1 : Place TOUS les élèves (134 élèves = 100%)
Phase 3 : Aucun élève restant à placer
→ Classes pleines, aucune marge pour ajustements !
```

---

## 🎯 CITATION UTILISATEUR

> "Oui avant on ne prenait que les LV2 spécifiques style ITA, on ne nommait pas ESP car c'est la lv2 de base... Je n'y pensais plus... C'est peut être cela le problème.... On vide tout le réservoir d'entrée.... donc on ne trouve plus les autres types d'élèves ???????"

**✅ DIAGNOSTIC CORRECT !**

---

## 🔍 IMPACT DU BUG

### **Pipeline AVANT correction :**
```
Phase 1 : ITA (11) + CHAV (10) + LATIN (3) = 24 élèves placés
Phase 2 : Applique DISSO/ASSO sur 24 élèves
Phase 3 : Place 110 élèves ESP restants + équilibre parité
Phase 4 : Optimise 134 élèves
```

**Résultat :** ✅ Flexibilité maximale pour équilibrage

### **Pipeline APRÈS bug (ESP marqué) :**
```
Phase 1 : ITA (11) + ESP (105) + CHAV (10) + LATIN (8) = 134 élèves (100%)
Phase 2 : Applique DISSO/ASSO → BLOCAGE (classes pleines)
Phase 3 : 0 élève restant → Aucun rééquilibrage possible
Phase 4 : Swaps limités (peu de marge)
```

**Résultat :** ❌ Pipeline rigide, échec des contraintes

---

## ✅ SOLUTION APPLIQUÉE

### **ESP = Langue universelle**

ESP doit être traitée comme une langue **compatible avec toutes les classes**, pas comme une contrainte.

---

## 📝 FICHIERS MODIFIÉS

### **1. LEGACY_Phase1_OptionsLV2.js**

**Avant (BUGUÉ) :**
```javascript
// Ligne 132
if (['ITA', 'ESP', 'ALL', 'PT'].indexOf(optName) >= 0) {
//           ^^^
//           ESP traité comme contrainte !
```

**Après (CORRIGÉ) :**
```javascript
// Ligne 133
if (['ITA', 'ALL', 'PT'].indexOf(optName) >= 0) {
//   ESP retiré de la liste !
  match = (lv2 === optName);
} else if (['CHAV', 'LATIN', 'GREC'].indexOf(optName) >= 0) {
  match = (opt === optName);
}
// ESP ignoré volontairement
```

**Effet :** Phase 1 place uniquement les élèves ITA, ALL, PT, CHAV, LATIN, GREC

---

### **2. LEGACY_Phase3_Parite.js**

**Changement 1 : Placement élèves non assignés**

**Avant (BUGUÉ) :**
```javascript
// Ligne 148
const targetClass = findLeastPopulatedClass_Phase3(...);
// Place dans la classe la moins remplie sans vérifier quotas
```

**Après (CORRIGÉ) :**
```javascript
// Lignes 147-178
// Trouver classe compatible avec LV2/OPT de l'élève
const lv2 = String(item.row[idxLV2] || '').trim().toUpperCase();
const opt = String(item.row[idxOPT] || '').trim().toUpperCase();

// Vérifier compatibilité LV2 (ESP toujours compatible)
if (lv2 && lv2 !== 'ESP' && ['ITA', 'ALL', 'PT'].indexOf(lv2) >= 0) {
  if (!quotas[lv2] || quotas[lv2] <= 0) compatible = false;
}
```

**Effet :** Phase 3 place les élèves ESP en respectant les places disponibles

**Changement 2 : Swaps de parité**

**Avant (BUGUÉ) :**
```javascript
// Ligne 371
if (lv2 && ['ITA', 'ESP', 'ALL', 'PT'].indexOf(lv2) >= 0) {
  if (!quotas[lv2] || quotas[lv2] <= 0) return false;
}
```

**Après (CORRIGÉ) :**
```javascript
// Ligne 371
if (lv2 && lv2 !== 'ESP' && ['ITA', 'ALL', 'PT'].indexOf(lv2) >= 0) {
  if (!quotas[lv2] || quotas[lv2] <= 0) return false;
}
```

**Effet :** Élèves ESP peuvent être swappés entre toutes les classes

---

### **3. LEGACY_Mobility_Calculator.js**

**Avant (BUGUÉ) :**
```javascript
// Ligne 171
if (lv2 && ['ITA', 'ESP', 'ALL', 'PT'].indexOf(lv2) >= 0) {
  if (!quotas[lv2] || quotas[lv2] <= 0) compatible = false;
}
```

**Après (CORRIGÉ) :**
```javascript
// Ligne 171
if (lv2 && lv2 !== 'ESP' && ['ITA', 'ALL', 'PT'].indexOf(lv2) >= 0) {
  if (!quotas[lv2] || quotas[lv2] <= 0) compatible = false;
}
// ESP compatible avec toutes les classes
```

**Effet :** Élèves ESP calculés comme LIBRE (mobiles entre toutes classes)

---

### **4. Phase4_Ultimate.js**

**Avant (BUGUÉ) :**
```javascript
// Ligne 364
if (lv2_s2 && ['ITA', 'ESP', 'ALL', 'PT'].indexOf(lv2_s2) >= 0) {
  if (!quotas1[lv2_s2] || quotas1[lv2_s2] <= 0) return false;
}
```

**Après (CORRIGÉ) :**
```javascript
// Ligne 364
if (lv2_s2 && lv2_s2 !== 'ESP' && ['ITA', 'ALL', 'PT'].indexOf(lv2_s2) >= 0) {
  if (!quotas1[lv2_s2] || quotas1[lv2_s2] <= 0) return false;
}
```

**Effet :** Phase 4 peut swapper élèves ESP sans restriction de classe

---

## 📊 RÉSULTAT ATTENDU APRÈS CORRECTION

### **Nouveau comportement :**

```
Phase 1 : 
  ✅ ITA : 11 élèves placés (5°1, 5°5)
  ✅ CHAV : 10 élèves placés (5°2)
  ✅ LATIN : 3 élèves placés (5°5)
  ✅ ESP : 0 élève placé (ignoré)
  ─────────────────────────────────
  TOTAL : 24 élèves placés (18%)

Phase 2 :
  ✅ Applique DISSO/ASSO sur 24 élèves
  ✅ Marge disponible dans chaque classe

Phase 3 :
  ✅ Place 110 élèves ESP restants (82%)
  ✅ Respecte quotas et effectifs cibles
  ✅ Équilibre parité F/M
  ─────────────────────────────────
  TOTAL : 134 élèves placés (100%)

Phase 4 :
  ✅ Optimise avec flexibilité maximale
  ✅ Élèves ESP mobiles entre classes
```

---

## 🎯 RÈGLES DE CONCEPTION

### **LV2 "contraignantes" (placements Phase 1) :**
- ITA (Italien)
- ALL (Allemand)
- PT (Portugais)

### **LV2 "universelle" (placements Phase 3) :**
- ESP (Espagnol) → Compatible avec toutes les classes

### **Options contraignantes (placements Phase 1) :**
- CHAV (Chorale)
- LATIN (Latin)
- GREC (Grec ancien)

---

## ✅ VALIDATION

### **Logs attendus après correction :**

```
[Phase 1]
  ✅ 5°1 : 11 × ITA
  ✅ 5°2 : 10 × CHAV
  ✅ 5°5 : 3 × LATIN
  ✅ 5°5 : 5 × ITA
✅ PHASE 1 LEGACY terminée : 24 élèves placés

[Phase 3]
  ✅ 110 élèves non assignés placés
  ✅ 5°1TEST : 27 élèves
  ✅ 5°2TEST : 27 élèves
  ✅ 5°3TEST : 27 élèves
  ✅ 5°4TEST : 27 élèves
  ✅ 5°5TEST : 26 élèves
✅ PHASE 3 LEGACY terminée : 110 placés, 0 swaps parité
```

### **Vérifications dans les onglets TEST :**

| Classe | ITA | CHAV | LATIN | ESP (calc) | Total |
|--------|-----|------|-------|-----------|-------|
| 5°1 | 11 | 0 | 0 | 16 | 27 |
| 5°2 | 0 | 10 | 0 | 17 | 27 |
| 5°3 | 0 | 0 | 0 | 27 | 27 |
| 5°4 | 0 | 0 | 0 | 27 | 27 |
| 5°5 | 5 | 0 | 3 | 18 | 26 |

---

## 🚨 ATTENTION - DONNÉES SOURCES

**Pour que cette correction fonctionne, il faut que :**

### **Option 1 : ESP non marquée (recommandé)**
```
Élèves ITA/CHAV/LATIN : Colonne LV2 remplie
Élèves ESP : Colonne LV2 VIDE (ou "")
```

### **Option 2 : ESP marquée (fonctionne aussi)**
```
Élèves ITA/CHAV/LATIN : Colonne LV2 remplie
Élèves ESP : Colonne LV2 = "ESP"

→ Pipeline ignore ESP en Phase 1
→ Place en Phase 3 comme si LV2 était vide
```

**Les deux options fonctionnent avec la correction !**

---

## 📚 RÉFÉRENCES

- `LEGACY_Phase1_OptionsLV2.js` : Phase 1 - Placement options contraignantes
- `LEGACY_Phase3_Parite.js` : Phase 3 - Placement ESP + parité
- `LEGACY_Mobility_Calculator.js` : Calcul mobilité (ESP = LIBRE)
- `Phase4_Ultimate.js` : Optimisation (ESP universelle)

---

**Status :** ✅ CORRECTION APPLIQUÉE - PRÊT POUR TEST

**Prochaine étape :** Relancer le pipeline et vérifier que Phase 1 place ~24 élèves au lieu de 134
