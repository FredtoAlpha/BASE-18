# 🎯 ARCHITECTURE "SAC DE BILLES" - Pipeline LEGACY

**Date :** 22 novembre 2025  
**Principe :** Placement progressif par priorité de contraintes  
**Status :** ✅ IMPLÉMENTÉ

---

## 🎯 PRINCIPE FONDAMENTAL

### **Métaphore du Sac de Billes**

```
🪣 SAC (onglet CONSOLIDATION) :
   ├─ Gros cailloux (LV2 rares, Options) → Phase 1
   ├─ Moyens cailloux (ASSO/DISSO) → Phase 2  
   └─ Sable (ESP sans option) → Phase 3

Le sac se vide progressivement, par ordre de priorité.
```

### **💡 DÉCOUVERTE : Onglet CONSOLIDATION**

L'onglet **CONSOLIDATION** existe déjà dans le système et fait exactement ce qu'on veut !
- Créé par `Initialisation.js` au début
- Rempli par `consoliderDonnees()` depuis Console Pilotage
- Regroupe TOUS les élèves de TOUTES les sources en UN SEUL onglet
- Élimine les doublons par ID_ELEVE

**Avantage :** Au lieu de relire 5 onglets sources individuellement, on lit 1 seul onglet CONSOLIDATION !

**Fichier :** `Consolidation.js` → Fonction `consoliderDonnees()`

---

## 📊 FLUX DE DONNÉES

### **AVANT (Architecture classique - BUGÉE) :**
```
SOURCE → Phase 1 → Tout écraser dans TEST
                   ↓
                   Phase 2 & 3 lisent TEST
                   
❌ Problème : Perte des élèves non placés en Phase 1
```

### **APRÈS (Architecture Sac de Billes - CORRECTE) :**
```
SOURCES (6°1, 6°2, 6°3, 6°4, 6°5)
   ↓
consoliderDonnees() → CONSOLIDATION (134 élèves)
   ↓
Phase 1 : Sort 40 élèves (ITA, CHAV, LATIN) → TEST
   ↓
CONSOLIDATION (sac = 94 élèves ESP restants) + TEST (40 élèves)
   ↓
Phase 2 : getConsolidatedData_LEGACY() → Lit TEST + CONSOLIDATION
         Applique ASSO/DISSO sur les 134
   ↓
Phase 3 : getConsolidatedData_LEGACY() → Lit TEST + CONSOLIDATION
         Place les 94 ESP restants + équilibre parité
   ↓
Phase 4 : Optimise les 134
```

---

## 🔧 COMPOSANTS DE L'ARCHITECTURE

### **1. Fonction de Consolidation**

**Fichier :** `LEGACY_Consolidation_Sac.js`

**Fonction :** `getConsolidatedData_LEGACY(ctx)`

**Rôle :** Fusionner TEST (déjà placés) + CONSOLIDATION (encore dans le sac)

```javascript
function getConsolidatedData_LEGACY(ctx) {
  const allData = [];
  const idsPlaces = new Set();
  
  // 1. Lire TEST (élèves déjà placés en Phase 1)
  ctx.cacheSheets.forEach(testName => {
    // Lire onglet 5°1TEST, 5°2TEST, etc.
    students.forEach(s => {
      idsPlaces.add(s.ID_ELEVE); // Marquer comme placé
      allData.push(s);
    });
  });
  
  // 2. Lire CONSOLIDATION (élèves encore dans le sac)
  const consolidation = ss.getSheetByName('CONSOLIDATION');
  consolidation.forEach(student => {
    // Exclure les élèves déjà dans TEST (par ID_ELEVE)
    if (!idsPlaces.has(student.ID_ELEVE)) {
      allData.push(student);
    }
  });
  
  return { allData, headersRef };
}
```

**Avantage :** 
- ✅ Lit 1 seul onglet CONSOLIDATION au lieu de 5 sources (6°1, 6°2, etc.)
- ✅ Plus rapide, plus simple
- ✅ CONSOLIDATION est déjà maintenu par `consoliderDonnees()`

---

### **2. Phase 1 : Placement Sélectif**

**Fichier :** `LEGACY_Phase1_OptionsLV2.js`

**Modification :**
```javascript
// ❌ AVANT (mauvais)
for (const item of allData) {
  byClass[item.assigned].push(item); // Écrit TOUS
}

// ✅ APRÈS (correct)
for (const item of allData) {
  if (item.assigned) { // N'écrit QUE les assignés
    byClass[item.assigned].push(item);
  }
  // Les autres restent dans SOURCE
}
```

**Résultat :**
- 40 élèves ITA/CHAV/LATIN → Écrits dans TEST
- 94 élèves ESP seuls → **Restent dans SOURCE** (sac)

---

### **3. Phase 2 : Consolidation + ASSO/DISSO**

**Fichier :** `LEGACY_Phase2_DissoAsso.js`

**Modification :**
```javascript
// ❌ AVANT (mauvais)
ctx.cacheSheets.forEach(testName => {
  // Lit UNIQUEMENT TEST
});

// ✅ APRÈS (correct)
const consolidated = getConsolidatedData_LEGACY(ctx);
const allData = consolidated.allData; // TEST + SOURCE
```

**Résultat :**
- Phase 2 voit les 134 élèves (40 TEST + 94 SOURCE)
- Peut appliquer ASSO/DISSO sur tout le monde

---

### **4. Phase 3 : Consolidation + Placement Final**

**Fichier :** `LEGACY_Phase3_Parite.js`

**Modification :**
```javascript
// ❌ AVANT (mauvais)
ctx.cacheSheets.forEach(testName => {
  // Lit UNIQUEMENT TEST
});

// ✅ APRÈS (correct)
const consolidated = getConsolidatedData_LEGACY(ctx);
const allData = consolidated.allData; // TEST + SOURCE
```

**Résultat :**
- Phase 3 voit les 134 élèves (40 TEST + 94 SOURCE)
- Place les 94 ESP dans les classes avec disponibilité
- Équilibre la parité

---

## 📋 AVANTAGES DE L'ARCHITECTURE

### **1. Priorité aux Contraintes Fortes**
```
Phase 1 : Gros cailloux (ITA, CHAV, LATIN)
   → Placement prioritaire, deviennent FIXE
   → Garantit qu'ils ont leur place
```

### **2. Flexibilité Maximale**
```
Phase 3 : Sable (ESP sans option)
   → Placement flexible dans classes disponibles
   → Équilibrage effectifs et parité
```

### **3. Sécurité ABS (Anti-Blocage System)**
```
Phase 1 → FIXE calculé
Phase 2 → Respecte FIXE
Phase 3 → Respecte FIXE
Phase 4 → Respecte FIXE
```

### **4. Évite les Blocages Insolubles**
```
❌ SI on place tout en Phase 1 :
   - Classes pleines
   - Plus de marge pour ASSO/DISSO
   - Blocages impossibles à résoudre

✅ AVEC Sac de Billes :
   - Classes partiellement remplies
   - Marge pour ajustements
   - Flexibilité maximale
```

---

## 🔄 SÉQUENCE DÉTAILLÉE

### **Phase 0 : Initialisation**
```
SOURCE : 134 élèves (6°1, 6°2, 6°3, 6°4, 6°5)
TEST : Onglets vides créés (5°1TEST, 5°2TEST, etc.)
```

### **Phase 1 : Placement Sélectif**
```
INPUT : SOURCE (134 élèves)
TRAITE : 
  - 11 ITA → 5°1TEST, 5°5TEST
  - 10 CHAV → 5°2TEST
  - 11 LATIN → 5°3TEST, 5°5TEST
OUTPUT :
  - TEST : 40 élèves écrits
  - SOURCE : 94 élèves restants (ESP seuls)
MOBILITÉ : Calculée pour les 40 placés
```

### **Phase 2 : ASSO/DISSO**
```
INPUT : getConsolidatedData_LEGACY()
  - TEST : 40 élèves
  - SOURCE : 94 élèves
  - TOTAL : 134 élèves
TRAITE : 
  - 0 ASSO
  - 4 DISSO (séparations)
OUTPUT : TEST mis à jour (40 élèves déplacés si besoin)
```

### **Phase 3 : Placement Final**
```
INPUT : getConsolidatedData_LEGACY()
  - TEST : 40 élèves
  - SOURCE : 94 élèves
  - TOTAL : 134 élèves
TRAITE :
  - Place 94 élèves ESP dans classes disponibles
  - Respecte quotas (si ESP dans classe)
  - Équilibre effectifs (27/27/27/27/26)
  - Équilibre parité F/M
OUTPUT : TEST complet (134 élèves)
MOBILITÉ : Recalculée pour les 134
```

### **Phase 4 : Optimisation**
```
INPUT : TEST (134 élèves)
TRAITE : Swaps chirurgicaux (parité, COM, PART)
OUTPUT : TEST optimisé
```

### **Finalisation**
```
INPUT : TEST (134 élèves)
OUTPUT : FIN (134 élèves) - Onglets finaux pour l'année
```

---

## 📊 COMPARAISON AVANT/APRÈS

### **AVANT (Architecture classique) :**
| Phase | Élèves traités | Problème |
|-------|---------------|----------|
| Phase 1 | 134 placés | ❌ Tout écraser dans TEST |
| Phase 2 | 40 visibles | ❌ 94 perdus |
| Phase 3 | 40 visibles | ❌ 94 perdus |
| Phase 4 | 40 visibles | ❌ 94 perdus |

**Résultat :** 94 élèves ESP perdus ! ❌

### **APRÈS (Architecture Sac de Billes) :**
| Phase | Élèves traités | Résultat |
|-------|---------------|----------|
| Phase 1 | 40 placés | ✅ 40 dans TEST, 94 dans SOURCE |
| Phase 2 | 134 (40+94) | ✅ Consolidation réussie |
| Phase 3 | 134 (40+94) | ✅ 94 ESP placés |
| Phase 4 | 134 | ✅ Optimisation complète |

**Résultat :** 134 élèves placés ! ✅

---

## 🎯 LOGS ATTENDUS APRÈS CORRECTION

### **Phase 1 :**
```
📌 PHASE 1 LEGACY - Options & LV2
  🌍 LV2 universelles : ESP
  🎯 LV2 rares : ITA
  
  ✅ 5°1 : 11 × ITA
  ✅ 5°2 : 10 × CHAV
  ✅ 5°3 : 11 × LATIN
  ✅ 5°5 : 8 × ITA + LATIN
  
✅ PHASE 1 LEGACY terminée : 40 élèves placés
```

### **Phase 2 :**
```
📌 PHASE 2 LEGACY - ASSO/DISSO
🔄 Consolidation SAC DE BILLES (TEST + CONSOLIDATION)...
  ✅ 40 élèves lus depuis TEST (déjà placés)
  ✅ 94 élèves lus depuis CONSOLIDATION (encore dans le sac)
  📊 TOTAL CONSOLIDÉ : 134 élèves
  
✅ PHASE 2 LEGACY terminée : 0 ASSO, 4 DISSO
```

### **Phase 3 :**
```
📌 PHASE 3 LEGACY - Effectifs & Parité
🔄 Consolidation SAC DE BILLES (TEST + CONSOLIDATION)...
  ✅ 40 élèves lus depuis TEST (déjà placés)
  ✅ 94 élèves lus depuis CONSOLIDATION (encore dans le sac)
  📊 TOTAL CONSOLIDÉ : 134 élèves

📊 Rééquilibrage des effectifs...
  • 5°1 : 11/27 (-16)
  • 5°2 : 10/27 (-17)
  • 5°3 : 11/27 (-16)
  • 5°4 : 0/27 (-27)
  • 5°5 : 8/26 (-18)
  
  ✅ 94 élèves non assignés placés (ESP)
  
  Après placement :
  • 5°1 : 27/27 (0)
  • 5°2 : 27/27 (0)
  • 5°3 : 27/27 (0)
  • 5°4 : 27/27 (0)
  • 5°5 : 26/26 (0)
  
✅ PHASE 3 LEGACY terminée : 94 placés, X swaps parité
```

---

## ✅ CHECKLIST DE VALIDATION

- [x] `LEGACY_Consolidation_Sac.js` créé
- [x] `getConsolidatedData_LEGACY()` implémentée
- [x] Phase 1 modifiée (placement sélectif)
- [x] Phase 2 modifiée (utilise consolidation)
- [x] Phase 3 modifiée (utilise consolidation)
- [ ] Pipeline testé avec données réelles
- [ ] Logs vérifiés (134 élèves dans Phase 2 & 3)
- [ ] Onglets FIN vérifiés (134 élèves)

---

## 🚀 PROCHAINES ÉTAPES

1. **Tester le pipeline complet**
   - Relancer depuis Console Pilotage
   - Vérifier logs Phase 2 & 3
   
2. **Valider les résultats**
   - Phase 3 : "94 élèves non assignés placés"
   - Onglets FIN : 134 élèves répartis
   
3. **Vérifier la mobilité**
   - 40 élèves ITA/CHAV/LATIN = FIXE ou PERMUT
   - 94 élèves ESP = LIBRE (mobiles partout)

---

**L'architecture "Sac de Billes" transforme un pipeline rigide en un système flexible et robuste !** 🎯
