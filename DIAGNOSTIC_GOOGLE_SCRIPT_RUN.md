# 🔍 Diagnostic des erreurs `google.script.run`

## Problème identifié

L'erreur `💥 Erreur fatale: TypeError: data.map is not a function` se produit car :

1. **L'interface appelle l'ancienne fonction** : `getClassesData` au lieu de `getClassesDataForInterfaceV2`
2. **Format de données incompatible** :
   - `getClassesData` (legacy) retourne : `{success: true, data: {classe1: {...}, classe2: {...}}}`
   - `getClassesDataForInterfaceV2` retourne : `{success: true, data: [{classe: "...", eleves: [...]}, ...], rules: {...}}`
3. **Cache du navigateur** : Le navigateur peut mettre en cache les anciens fichiers HTML

## Cause racine

Le code dans le dépôt (InterfaceV2_CoreScript.html:1422) appelle **correctement** `getClassesDataForInterfaceV2`, mais :

- La version déployée dans Apps Script utilise une ancienne version qui appelle `getClassesData`
- OU le navigateur a mis en cache l'ancienne version HTML

## Solution complète

### 1. Fonctions backend ajoutées dans `Code.gs`

✅ **Toutes les fonctions appelées par InterfaceV2 sont maintenant présentes** :

#### Fonctions de données principales (déjà présentes)
- `getClassesData` (legacy, ligne 310)
- `getClassesDataForInterfaceV2` (SAS, ligne 268) ⭐
- `getLastCacheInfo` (ligne 323)
- `getBridgeContextAndClear` (ligne 348)
- `saveCacheData` (ligne 370)
- `loadCacheData` (ligne 384)
- `saveElevesSnapshot` (ligne 405)
- `getUiSettings` (ligne 431)

#### Fonctions d'authentification (nouvellement ajoutées)
- `getAdminPasswordFromConfig` (ligne 449) 🆕
- `verifierMotDePasseAdmin` (ligne 472) 🆕

#### Fonctions de scores et règles (nouvellement ajoutées)
- `loadFINSheetsWithScores` (ligne 493) 🆕
- `getINTScores` (ligne 610) 🆕
- `updateStructureRules` (ligne 542) 🆕

### 2. Mise à jour requise dans Apps Script

**⚠️ IMPORTANT** : Pour résoudre complètement le problème, il faut mettre à jour :

1. **Code.gs** (backend) - Contient toutes les fonctions
2. **InterfaceV2_CoreScript.html** (frontend) - Appelle les bonnes fonctions
3. **Vider le cache du navigateur** - Éviter d'utiliser d'anciennes versions

Voir `INSTRUCTION_UNIQUE.txt` pour le guide détaillé.

## Vérification

Après la mise à jour, les logs dans la console du navigateur doivent montrer :

```
📡 Appel fonction: getClassesDataForInterfaceV2
✅ getClassesDataForInterfaceV2 succès: {success: true, data: [...], rules: {...}}
```

Et **PAS** :

```
📡 Appel fonction: getClassesData
✅ getClassesData succès: {success: true, data: {classe1: {...}}}
```

## Commit

Les modifications ont été commitées dans :
- Commit: `b3a95b9`
- Branche: `claude/fix-google-script-run-01RU12XuRLetDdgfHTfbsHEN`
- Fichiers modifiés: `Code.gs`, `INSTRUCTION_UNIQUE.txt`
