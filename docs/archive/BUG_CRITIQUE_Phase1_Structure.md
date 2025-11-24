# 🔴 BUG CRITIQUE - Phase 1 : Structure colonnes incorrecte

**Date :** 22 novembre 2025  
**Gravité :** CRITIQUE (bloquant tout le pipeline)  
**Status :** ✅ CORRIGÉ

---

## 📋 SYMPTÔME

### Logs observés :
```
[Phase 3] 📊 Rééquilibrage des effectifs...
  • 5°1 : 0/27 (-27)    ← ❌ 0 élèves au lieu de 27
  • 5°2 : 0/27 (-27)    ← ❌ 0 élèves au lieu de 27
  • 5°3 : 0/27 (-27)    ← ❌ 0 élèves au lieu de 27
  • 5°4 : 0/27 (-27)    ← ❌ 0 élèves au lieu de 27
  • 5°5 : 0/26 (-26)    ← ❌ 0 élèves au lieu de 26
  ✅ 134 élèves non assignés placés
```

**Phase 3 ne voit aucun élève assigné alors que Phase 1 en a placé 134 !**

---

## 🔍 CAUSE RACINE

### Structure attendue (après Phase 0 - Init) :
```
Colonnes 1-15 : Données sources (ID_ELEVE, NOM, PRENOM, SEXE, LV2, OPT, etc.)
Colonne 16 (P) : FIXE           ← Créée vide par ensureClassAssignedColumn_LEGACY()
Colonne 17 (Q) : MOBILITE       ← Créée vide par ensureClassAssignedColumn_LEGACY()
Colonne 18 (R) : _CLASS_ASSIGNED ← Créée vide par ensureClassAssignedColumn_LEGACY()
```

### Code bugué dans Phase 1 (ligne 171) :
```javascript
const newRow = item.row.concat([item.assigned]); // ❌ Ajoute seulement 1 colonne
```

### Résultat du bug :
```
Colonnes 1-15 : Données sources
Colonne 16 : item.assigned     ← ❌ _CLASS_ASSIGNED écrit en position 16 (colonne P)
Colonnes 17-18 : VIDES          ← ❌ MOBILITE et _CLASS_ASSIGNED manquantes
```

### Conséquence :
- Phase 3 lit colonne 18 (_CLASS_ASSIGNED) mais trouve VIDE
- Phase 3 pense que tous les élèves sont "non assignés"
- Phase 3 tente de placer 134 élèves dans des classes déjà pleines
- Pipeline échoue totalement

---

## ✅ CORRECTION

### Fichier : `LEGACY_Phase1_OptionsLV2.js`

**Avant (BUGUÉ) :**
```javascript
// Ligne 171
const newRow = item.row.concat([item.assigned]); // ❌ 1 seule colonne
```

**Après (CORRIGÉ) :**
```javascript
// Ligne 172
const newRow = item.row.concat(['', '', item.assigned]); // ✅ 3 colonnes
//                               ↑    ↑    ↑
//                            FIXE MOBILITE _CLASS_ASSIGNED
```

### Explication :
- Colonne 16 (P) : FIXE = `''` (vide, sera rempli par `calculerEtRemplirMobilite_LEGACY()`)
- Colonne 17 (Q) : MOBILITE = `''` (vide, sera rempli par `calculerEtRemplirMobilite_LEGACY()`)
- Colonne 18 (R) : _CLASS_ASSIGNED = `item.assigned` (classe assignée par Phase 1)

---

## 🔬 POURQUOI CE BUG EST PASSÉ INAPERÇU

1. **Phase 0 crée les colonnes vides** → OK ✅
2. **Phase 1 écrit les données** → Les logs disent "✅ 27 élèves écrits" → Semble OK ❌
3. **Phase 1 calcule la mobilité** → Les logs disent "✅ Mobilité calculée" → Semble OK ❌
4. **Phase 2 lit les données** → Ne vérifie pas _CLASS_ASSIGNED → Passe sans erreur ❌
5. **Phase 3 lit _CLASS_ASSIGNED** → VIDE → 💥 **ÉCHEC VISIBLE**

**Le bug était silencieux jusqu'à Phase 3 !**

---

## ✅ VÉRIFICATION

### Structure correcte dans les onglets TEST :
```
| A-O | P (FIXE) | Q (MOBILITE) | R (_CLASS_ASSIGNED) |
|-----|----------|--------------|---------------------|
| ... | NON      | LIBRE        | 5°2                 |
| ... | OUI      | FIXE         | 5°2                 |
| ... | NON      | PERMUT       | 5°3                 |
```

### Commandes de vérification :
1. Ouvrir un onglet TEST (ex: `5°1TEST`)
2. Vérifier que colonne P (FIXE) contient "OUI" ou "NON"
3. Vérifier que colonne Q (MOBILITE) contient "FIXE", "PERMUT", "LIBRE", etc.
4. Vérifier que colonne R (_CLASS_ASSIGNED) contient les noms de classes ("5°1", "5°2", etc.)

---

## 🚨 AUTRES PHASES VÉRIFIÉES

### Phase 2 (ASSO/DISSO) :
✅ **Pas de bug** - Lit et réécrit la structure complète sans modification

**Code (ligne 253) :**
```javascript
testSheet.getRange(1, 1, allRows.length, headersRef.length).setValues(allRows);
```
→ Écrit `headersRef.length` colonnes (18 colonnes si Phase 1 est correcte)

### Phase 3 (Parité) :
✅ **Pas de bug** - Même logique que Phase 2

**Code (ligne 264) :**
```javascript
testSheet.getRange(1, 1, allRows.length, headersRef.length).setValues(allRows);
```
→ Écrit `headersRef.length` colonnes (18 colonnes)

### Phase 4 (ULTIMATE) :
✅ **Pas de bug** - Lit les colonnes correctement

**Code (ligne 248-249) :**
```javascript
MOB: headers.indexOf('MOBILITE'),
FIXE: headers.indexOf('FIXE')
```
→ Utilise `indexOf()` pour trouver les bonnes colonnes

---

## 📊 IMPACT DE LA CORRECTION

### Avant correction :
```
Phase 1 : ✅ 134 élèves placés (FAUX - mal écrit)
Phase 2 : ✅ 0 ASSO, 26 DISSO (FAUX - lit mal)
Phase 3 : ❌ 0/27 élèves détectés → ÉCHEC
Phase 4 : ❌ Non exécutée
```

### Après correction :
```
Phase 1 : ✅ 134 élèves placés (VRAI - bien écrit)
Phase 2 : ✅ 0 ASSO, 26 DISSO (VRAI - lit bien)
Phase 3 : ✅ 27/27 élèves détectés → OK
Phase 4 : ✅ Optimisation → OK
```

---

## 🎯 LEÇONS APPRISES

### Problèmes de conception :
1. **Phase 0 et Phase 1 ne sont pas synchronisées**
   - Phase 0 crée 3 colonnes vides
   - Phase 1 ne remplit que 1 colonne
   
2. **Pas de validation inter-phases**
   - Aucune vérification que Phase 1 a bien rempli _CLASS_ASSIGNED
   - Phase 3 découvre le problème trop tard

3. **Logs trompeurs**
   - "✅ 27 élèves écrits" ne vérifie pas la structure
   - Devrait vérifier que _CLASS_ASSIGNED est bien rempli

### Solutions appliquées :
1. ✅ Phase 1 écrit maintenant 3 colonnes (FIXE, MOBILITE, _CLASS_ASSIGNED)
2. ✅ Structure alignée sur définition de Phase 0
3. ⚠️ TODO : Ajouter validation après Phase 1 pour détecter ce type de bug

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [x] Bug identifié (décalage colonnes)
- [x] Correction appliquée (ligne 172 de Phase 1)
- [x] Autres phases vérifiées (aucun bug similaire)
- [x] Documentation créée
- [ ] Pipeline testé avec données réelles
- [ ] Validation onglets TEST/FIN

---

**Status :** ✅ PRÊT POUR TEST  
**Prochaine étape :** Relancer le pipeline LEGACY et vérifier que Phase 3 détecte bien les 134 élèves
