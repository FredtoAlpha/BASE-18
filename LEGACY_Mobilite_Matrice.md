# 📊 MATRICE DE MOBILITÉ - PIPELINE LEGACY

## 🎯 Vue d'ensemble

Ce document décrit la logique complète de calcul et d'utilisation de la **MOBILITÉ** des élèves dans le pipeline LEGACY.

---

## 📋 Structure des colonnes

### Onglets TEST/FIN (Pipeline LEGACY)

```
A-N : Colonnes sources (ID_ELEVE, NOM, PRENOM, SEXE, LV2, OPT, COM, TRA, PART, ABS, DISPO, ASSO, DISSO)
O   : SOURCE
P   : FIXE           ← Binaire : OUI / NON
Q   : MOBILITE       ← Valeur textuelle : FIXE / PERMUT / LIBRE / GROUPE_*
R   : _CLASS_ASSIGNED
```

### Alignement avec pipeline OPTI (_BASEOPTI)

Les colonnes P (FIXE) et Q (MOBILITE) sont **alignées** avec le pipeline OPTI pour assurer la compatibilité avec InterfaceV2.

---

## 🔢 Valeurs de la colonne MOBILITE

### Élèves individuels (sans ASSO)

| Valeur | Description | Nb classes compatibles | Peut bouger ? |
|--------|-------------|------------------------|---------------|
| **FIXE** | Option dans 1 seule classe | 1 | ❌ NON |
| **PERMUT** | Option dans 2 classes | 2 | ✅ OUI (entre ces 2 classes) |
| **LIBRE** | Option dans 3+ classes | 3+ | ✅ OUI (parmi ces classes) |

### Groupes ASSO

| Valeur | Description | Nb classes compatibles | Peut bouger ? |
|--------|-------------|------------------------|---------------|
| **GROUPE_FIXE** | Groupe avec ≥1 membre FIXE | 1 | ❌ NON (tout le groupe) |
| **GROUPE_PERMUT** | Tous PERMUT ou mix PERMUT/LIBRE | 2 | ✅ OUI (tout le groupe) |
| **GROUPE_LIBRE** | Tous LIBRE | 3+ | ✅ OUI (tout le groupe) |

---

## 🧮 Algorithme de calcul

### Phase 1 : Calcul de la mobilité après placement initial

```javascript
function calculerMobiliteEleve(eleve, headers, ctx) {
  // 1. Élève dans un groupe ASSO ?
  if (eleve.ASSO) {
    return calculerMobiliteGroupe(eleve.ASSO, ctx);
  }
  
  // 2. Élève individuel
  
  // 2.1 Identifier les classes compatibles (LV2 + OPT)
  let classesCompatibles = [];
  
  for (classe in ctx.quotas) {
    let compatible = true;
    
    // Vérifier LV2
    if (eleve.LV2 && !ctx.quotas[classe][eleve.LV2]) {
      compatible = false;
    }
    
    // Vérifier OPT (indépendamment)
    if (eleve.OPT && !ctx.quotas[classe][eleve.OPT]) {
      compatible = false;
    }
    
    if (compatible) {
      classesCompatibles.push(classe);
    }
  }
  
  // 2.2 Soustraire classes avec code DISSO
  if (eleve.DISSO) {
    classesCompatibles = classesCompatibles.filter(classe => {
      return !classeContientCodeDISSO(classe, eleve.DISSO, ctx);
    });
  }
  
  // 2.3 Déterminer mobilité selon le nombre
  let nbClasses = classesCompatibles.length;
  
  if (nbClasses === 0) return 'ERREUR';
  if (nbClasses === 1) return 'FIXE';
  if (nbClasses === 2) return 'PERMUT';
  return 'LIBRE';
}
```

### Calcul pour groupes ASSO

```javascript
function calculerMobiliteGroupe(codeASSO, ctx) {
  // 1. Récupérer tous les membres
  let membres = getMembresGroupe(codeASSO, ctx);
  
  // 2. Calculer classes compatibles pour chaque membre
  let classesParMembre = membres.map(m => getClassesCompatibles(m, ctx));
  
  // 3. Intersection : classes compatibles pour TOUS
  let classesCommunes = intersection(...classesParMembre);
  
  // 4. Soustraire classes avec codes DISSO du groupe
  let codesDISSO = membres.map(m => m.DISSO).filter(d => d);
  for (code of codesDISSO) {
    classesCommunes = classesCommunes.filter(classe => {
      return !classeContientCodeDISSO(classe, code, ctx);
    });
  }
  
  // 5. Déterminer mobilité du groupe
  let nbClasses = classesCommunes.length;
  
  if (nbClasses === 0) return 'GROUPE_ERREUR';
  if (nbClasses === 1) return 'GROUPE_FIXE';
  if (nbClasses === 2) return 'GROUPE_PERMUT';
  return 'GROUPE_LIBRE';
}
```

---

## 🔄 Utilisation dans le pipeline

### Phase 1 : Calcul initial

**Moment :** Après placement selon options/LV2
**Action :** Calculer et remplir colonnes P (FIXE) et Q (MOBILITE)

```javascript
// Après écriture dans TEST
remplirMobilite_Phase1(ctx);
```

### Phase 2 : Respect ASSO/DISSO

**Contrainte :** Ne déplacer QUE si mobilité le permet

```javascript
if (mobilite === 'FIXE' || mobilite === 'GROUPE_FIXE') {
  // Ne PAS déplacer
  continue;
}
```

### Phase 3 : Swaps de parité

**Contrainte :** Vérifier FIXE + compatibilité classes

```javascript
if (!canSwapForParity_Phase3(idx, targetClass, allData, headers, ctx)) {
  continue; // Vérifie FIXE, OPT, DISSO
}
```

### Phase 4 : Optimisation ULTIMATE

**Contrainte :** Bloquer élèves FIXE

```javascript
if (isFixed(student)) {
  continue; // Élève non mobile
}

// Vérifier compatibilité avant swap
if (!canSwapStudents_Ultimate(...)) {
  continue; // Vérifie LV2, OPT, DISSO
}
```

---

## 🎨 InterfaceV2 - Utilisation

### Affichage des badges

```javascript
// Badge FIXE (rouge)
if (eleve.FIXE === 'OUI' || eleve.MOBILITE === 'FIXE') {
  badge = '<span class="badge badge-red">🔒 FIXE</span>';
}

// Badge PERMUT (orange)
if (eleve.MOBILITE === 'PERMUT' || eleve.MOBILITE === 'GROUPE_PERMUT') {
  badge = '<span class="badge badge-orange">⚡ PERMUT</span>';
}

// Badge LIBRE (vert)
if (eleve.MOBILITE === 'LIBRE' || eleve.MOBILITE === 'GROUPE_LIBRE') {
  badge = '<span class="badge badge-green">✅ LIBRE</span>';
}
```

### Filtrage

```javascript
// Bouton "FIXE" filtre uniquement les élèves FIXE
if (filter === 'FIXE' && (cardData.fixe === 'OUI' || cardData.mobilite === 'FIXE')) {
  matches = true;
}
```

### Drag & Drop

```javascript
function canDropStudent(student, targetClass) {
  // 1. Vérifier FIXE
  if (student.FIXE === 'OUI') return false;
  
  // 2. Vérifier PERMUT (classes autorisées)
  if (student.MOBILITE === 'PERMUT') {
    let classesAutorisees = getClassesPossibles(student);
    if (!classesAutorisees.includes(targetClass)) {
      return false; // Hors périmètre
    }
  }
  
  // 3. Vérifier compatibilité LV2/OPT
  if (!classePropose(targetClass, student.LV2, student.OPT)) {
    return false;
  }
  
  // 4. Vérifier DISSO
  if (student.DISSO && classeContientCodeDISSO(targetClass, student.DISSO)) {
    return false;
  }
  
  return true;
}
```

---

## 📊 Exemples concrets

### Exemple 1 : Élève FIXE

```
Élève : LABBACI Hanna May
LV2 : (aucune)
OPT : CHAV
Classes avec CHAV : 5°2 (1 seule)
DISSO : (aucun)

→ FIXE = OUI
→ MOBILITE = FIXE
→ Peut bouger : ❌ NON
```

### Exemple 2 : Élève PERMUT

```
Élève : BAUCHET Maxime
LV2 : ESP
OPT : (aucune)
Classes avec ESP : 5°1, 5°2, 5°3, 5°4, 5°5 (5 classes)
DISSO : D2
Classes sans D2 : 5°3, 5°5 (2 classes après exclusion)

→ FIXE = NON
→ MOBILITE = PERMUT
→ Peut bouger : ✅ OUI (entre 5°3 et 5°5)
```

### Exemple 3 : Élève LIBRE

```
Élève : MARINI Milo
LV2 : ESP
OPT : (aucune)
Classes avec ESP : 5°1, 5°2, 5°3, 5°4, 5°5 (5 classes)
DISSO : (aucun)

→ FIXE = NON
→ MOBILITE = LIBRE
→ Peut bouger : ✅ OUI (dans toutes les classes ESP)
```

### Exemple 4 : Groupe FIXE

```
Groupe ASSO A5 : {LABBACI, POUZARGUES, REDON}

LABBACI :
  - OPT : CHAV (1 classe : 5°2) → FIXE

POUZARGUES :
  - OPT : CHAV (1 classe : 5°2) → FIXE

REDON :
  - LV2 : ESP (5 classes) → LIBRE

Intersection : 5°2 (seule classe proposant CHAV)

→ FIXE = OUI (pour les 3)
→ MOBILITE = GROUPE_FIXE (pour les 3)
→ Peut bouger : ❌ NON (tout le groupe bloqué en 5°2)
```

### Exemple 5 : Groupe LIBRE

```
Groupe ASSO A3 : {MARINI, OUHERMA, PIERRE}

Tous : LV2 = ESP (5 classes)
Aucun DISSO

Intersection : 5°1, 5°2, 5°3, 5°4, 5°5 (5 classes)

→ FIXE = NON (pour les 3)
→ MOBILITE = GROUPE_LIBRE (pour les 3)
→ Peut bouger : ✅ OUI (tout le groupe ensemble)
```

---

## ⚠️ Cas limites et règles

### Cas interdits (validés en Phase 0 ou V3)

| Cas | Description | Action |
|-----|-------------|--------|
| **Double ASSO** | Élève avec 2 codes ASSO (A1, A2) | ❌ INTERDIT |
| **ASSO conflit DISSO** | Groupe ASSO avec 2× même code DISSO | ❌ INTERDIT |
| **Multi DISSO** | Élève avec plusieurs codes DISSO (D1, D2) | ❌ INTERDIT |
| **LV2+OPT impossible** | Aucune classe ne propose les deux | ❌ ERREUR V3 |

### Règles DISSO pour groupes ASSO

```
Groupe ASSO avec membres ayant des codes DISSO différents :

Exemple : Groupe A2 = {Élève D1, Élève D2, Élève sans D}

Classes compatibles :
- Exclure classes avec D1
- Exclure classes avec D2
- Garder intersection résiduelle

Si intersection ≥ 3 → GROUPE_LIBRE
Si intersection = 2 → GROUPE_PERMUT
Si intersection = 1 → GROUPE_FIXE
```

---

## 🔧 Maintenance et évolution

### Ajouter une nouvelle valeur de mobilité

1. Ajouter dans la fonction `calculerMobiliteEleve()`
2. Ajouter dans `isFixed()` si non mobile
3. Ajouter dans InterfaceV2 pour affichage badge
4. Mettre à jour cette documentation

### Modifier les seuils (actuellement 1/2/3+ classes)

```javascript
// Modifier dans calculerMobiliteEleve()
if (nbClasses === 1) return 'FIXE';
if (nbClasses === 2) return 'PERMUT';
if (nbClasses <= 4) return 'SEMI_LIBRE'; // NOUVEAU
return 'LIBRE';
```

---

## ✅ Checklist d'implémentation

- [x] Documentation complète de la matrice
- [ ] Ajouter colonnes P (FIXE) et Q (MOBILITE) dans `ensureClassAssignedColumn_LEGACY()`
- [ ] Créer fonction `calculerMobiliteEleve()`
- [ ] Créer fonction `calculerMobiliteGroupe()`
- [ ] Appeler calcul après Phase 1
- [ ] Modifier Phase 2 pour respecter FIXE
- [ ] Modifier Phase 3 pour respecter FIXE (déjà fait)
- [ ] Modifier Phase 4 pour respecter FIXE (déjà fait)
- [ ] Tester avec données réelles
- [ ] Intégrer dans InterfaceV2 LEGACY

---

## 📚 Références

- `LEGACY_Phase1_OptionsLV2.js` : Placement initial
- `LEGACY_Phase2_DissoAsso.js` : Respect ASSO/DISSO
- `LEGACY_Phase3_Parite.js` : Swaps de parité avec vérification
- `Phase4_Ultimate.js` : Optimisation avec `isFixed()`
- `InterfaceV2.html` : Interface de répartition manuelle
- `BASEOPTI_System.js` : Schéma de référence (_BASEOPTI)

---

**Date de création :** 22 novembre 2025  
**Version :** 1.0  
**Auteur :** Pipeline LEGACY - Phase d'amélioration mobilité
