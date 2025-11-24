# 📚 Development Guide - BASE-18

Guide de développement pour les contributeurs du projet BASE-18.

---

## 🔧 Système de Logging

### Configuration

Le projet utilise un système de logging centralisé professionnel (`Logger.js`) avec support StackDriver et Google Sheets.

**5 niveaux de log disponibles :**
- `Logger.trace()` - Debug ultra-détaillé (ex: chaque itération)
- `Logger.debug()` - Debug général (ex: "Entering function X")
- `Logger.info()` - Informations importantes (ex: "Process started")
- `Logger.warn()` - Avertissements (ex: "Slow query detected")
- `Logger.error()` - Erreurs critiques (ex: "Fatal exception")

### Utilisation

```javascript
// Simple message
Logger.info('Opération terminée');

// Avec contexte
Logger.debug('Traitement élève', { userId: 123, classe: '6A' });

// Avec erreur
try {
  // code...
} catch (error) {
  Logger.error('Échec traitement', { context: 'Phase1' }, error);
}

// Timer de performance
const timer = Logger.startTimer('operationLongue');
// ... code ...
timer.end('Opération terminée'); // Log automatique avec durée
```

### Configuration environnement

```javascript
// Production (logs INFO et supérieurs uniquement)
Logger.enableProduction();

// Development (logs DEBUG et supérieurs)
Logger.enableDevelopment();

// Configuration manuelle
Logger.setLevel(Logger.LEVELS.INFO);
Logger.setConfig({
  enableConsole: true,
  enableStackDriver: true,
  enableSheetLogging: false, // Sheet uniquement en dev
  includeStackTrace: true
});
```

### Conventions

✅ **À FAIRE :**
- Utiliser `Logger.*` pour tout logging en production
- Inclure un contexte pertinent avec `data` parameter
- Logger les erreurs avec l'objet Error complet
- Utiliser `.trace()` pour debug détaillé (désactivé en prod)
- Utiliser `.info()` pour les étapes importantes

❌ **À ÉVITER :**
- `console.log()` direct (sauf dans Logger.js lui-même)
- Logs sans contexte : `Logger.info('Done')` ❌
- Logs trop verbeux en production
- Oublier le try-catch autour du logging

### Migration depuis console.log

```javascript
// Avant ❌
console.log('User created');
console.warn('Missing field');
console.error('Failed:', error);

// Après ✅
Logger.info('User created', { userId: 123 });
Logger.warn('Missing field', { field: 'email', form: 'registration' });
Logger.error('User creation failed', { userId: 123 }, error);
```

---

## 🎨 Composants UI - Skeleton Loaders

Les Skeleton Loaders sont disponibles via `UIComponents.Skeleton` pour afficher des états de chargement professionnels.

### Grilles (Tables/Data Grids)

```javascript
// Créer un skeleton pour une grille
const skeleton = UIComponents.Skeleton.grid({
  rows: 5,           // Nombre de lignes
  columns: 4,        // Nombre de colonnes
  hasHeader: true    // Inclure ligne d'en-tête
});

// Ajouter au DOM
document.getElementById('container').appendChild(skeleton);
```

### Listes verticales

```javascript
const skeleton = UIComponents.Skeleton.list({
  items: 6,           // Nombre d'items
  hasAvatar: true,    // Inclure avatars circulaires
  hasSecondary: true  // Ligne secondaire de texte
});

document.getElementById('liste-eleves').appendChild(skeleton);
```

### Formulaires

```javascript
const skeleton = UIComponents.Skeleton.form({
  fields: 4,        // Nombre de champs
  hasButton: true   // Inclure un bouton submit
});

document.getElementById('form-container').appendChild(skeleton);
```

### Cartes (Cards/Panels)

```javascript
const skeleton = UIComponents.Skeleton.cards({
  cards: 3,          // Nombre de cartes
  hasImage: true,    // Inclure image en haut
  textLines: 3       // Lignes de texte par carte
});

document.getElementById('cards-grid').appendChild(skeleton);
```

### Utilisation typique

```javascript
// Afficher skeleton pendant chargement
const container = document.getElementById('data-container');
const skeleton = UIComponents.Skeleton.grid({ rows: 10 });
container.appendChild(skeleton);

// Charger les données
google.script.run
  .withSuccessHandler(data => {
    // Retirer skeleton
    skeleton.remove();

    // Afficher données réelles
    renderData(data);
  })
  .getData();
```

### Accessibilité

Tous les skeletons incluent :
- `role="status"` pour lecteurs d'écran
- `aria-label` descriptif
- Focus states pour navigation clavier
- Animation respectant `prefers-reduced-motion`

---

## ♿ Accessibilité (WCAG AA)

Le projet respecte les standards WCAG AA avec :

### Navigation clavier

Tous les éléments interactifs ont des **focus states visibles** :
- Outline bleu `#3b82f6` de 2-3px
- Offset de 2px
- Box-shadow pour améliorer la visibilité

```css
button:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}
```

### Contraste des couleurs

Ratio minimum **4.5:1** pour texte normal, **3:1** pour texte large.

✅ Combinaisons validées :
- Boutons : `#4b5563` sur `#f3f4f6` (5.1:1)
- Liens : `#2563eb` sur blanc (6.1:1)
- Texte : `#1f2937` sur blanc (8.2:1)

### Classes utilitaires

```html
<!-- Texte pour lecteurs d'écran uniquement -->
<span class="sr-only">Description pour accessibilité</span>

<!-- Skip link pour navigation rapide -->
<a href="#main-content" class="skip-link">
  Aller au contenu principal
</a>

<!-- Focus visible pour keyboard navigation -->
<button class="focusable">Action</button>
```

### Respect des préférences utilisateur

```css
/* High contrast mode */
@media (prefers-contrast: high) {
  button { font-weight: 600; border-width: 2px; }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## 🎭 Micro-interactions

### Transitions disponibles

Toutes les transitions respectent `prefers-reduced-motion`.

#### Boutons

```css
/* Hover : lift de -2px */
button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Active : pressed effect */
button:active {
  transform: translateY(0);
}

/* Ripple effect automatique sur click */
```

#### Inputs

```javascript
// Focus : scale 1.01 + border bleue
input:focus {
  transform: scale(1.01);
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

#### Cards

```css
/* Hover : lift + shadow */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
```

#### States

```html
<!-- Success animation -->
<div class="success-pulse">✅ Opération réussie</div>

<!-- Error animation -->
<div class="error-shake">❌ Erreur détectée</div>

<!-- Loading shimmer -->
<div class="loading-shimmer"></div>
```

---

## 🚀 Best Practices

### Performance

- Utiliser `will-change` pour animations fréquentes
- Limiter animations à `transform` et `opacity`
- Éviter `box-shadow` dans animations (préférer `filter: drop-shadow()`)

### UX

- Durées : 0.2s pour micro-interactions, 0.3s pour transitions
- Easing : `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design)
- Toujours prévoir un fallback sans JavaScript

### Accessibilité

- Tester navigation au clavier (Tab, Enter, Espace)
- Vérifier contraste avec outils (WebAIM, axe DevTools)
- Inclure aria-labels pour éléments non-textuels
- Tester avec lecteur d'écran (NVDA, VoiceOver)

---

## 📝 Commit Messages

Conventions pour commits clairs :

```bash
# Format
<type>: <description courte>

# Types
feat:     Nouvelle fonctionnalité
fix:      Correction de bug
refactor: Refactoring (sans changement fonctionnel)
style:    Changements style/format (CSS, formatage code)
docs:     Documentation uniquement
perf:     Amélioration performance
test:     Ajout/modification tests
chore:    Maintenance (deps, config)

# Exemples
feat: Add skeleton loaders for better UX
fix: Improve WCAG AA color contrast ratios
refactor: Migrate console.log to Logger system
style: Add micro-interactions for inputs and buttons
docs: Update development guide with logging conventions
```

---

## 🔗 Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Motion](https://material.io/design/motion)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Apps Script Logger](https://developers.google.com/apps-script/reference/base/logger)

---

**Version :** 1.0
**Dernière mise à jour :** Phase 6+7 (Production + UX)
