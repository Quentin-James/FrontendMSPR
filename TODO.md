# TODO — Frontend (React + Vite)

Étapes restantes pour la phase TPRE502, en complément du dashboard déjà livré (TPRE501).

---

## 1. Benchmark technologique (livrable documentaire obligatoire)

- [ ] Rédiger `/docs/benchmark-frontend.md` comparant React, Vue.js et Angular sur les critères : courbe d'apprentissage, écosystème, performance, accessibilité, adéquation au projet
- [ ] Justifier le choix de React déjà effectué
- [ ] Comparer les bibliothèques de visualisation : D3.js vs Chart.js vs Plotly.js — justifier le choix retenu pour les graphiques IA

---

## 2. Maquettes (livrable obligatoire)

- [ ] Produire des maquettes responsive (Figma ou équivalent) pour :
  - Page de soumission de photo de repas
  - Page d'affichage des recommandations nutritionnelles
  - Page d'affichage des recommandations sportives
- [ ] Décliner chaque maquette en 3 formats : desktop, tablette, mobile

---

## 3. Accessibilité WCAG / RGAA niveau AA

- [ ] Auditer les composants existants (`AnomaliesPanel`, `KpiGrid`, `AnalyticsPanel`, etc.) avec un outil automatisé (axe-core ou Lighthouse)
- [ ] Ajouter les attributs `aria-label`, `aria-live`, `role` manquants sur les éléments interactifs
- [ ] Assurer la navigation entièrement au clavier (focus visible, ordre de tabulation logique)
- [ ] Vérifier les ratios de contraste couleur (minimum 4.5:1 pour le texte normal)
- [ ] Tester avec un lecteur d'écran (NVDA / VoiceOver)
- [ ] Rédiger la documentation "conduite du changement accessibilité" (livrable obligatoire)

---

## 4. Design responsive

- [ ] Vérifier que le dashboard existant est utilisable sur mobile et tablette
- [ ] Adapter les composants non-responsives (`AnomaliesPanel` tableau, `KpiGrid`) avec media queries ou CSS Grid/Flexbox
- [ ] Tester sur au moins 3 breakpoints : 375px (mobile), 768px (tablette), 1280px (desktop)

---

## 5. Nouvelles pages IA

### 5a. Soumission de photo de repas
- [ ] Créer le composant `FoodPhotoUpload` : drag-and-drop ou sélection de fichier image
- [ ] Appeler `POST /api/recommendations/nutrition` (backend Spring → FastAPI)
- [ ] Afficher un état de chargement pendant l'analyse (l'IA peut prendre quelques secondes)
- [ ] Gérer les erreurs API et les cas de fallback (API externe indisponible)

### 5b. Affichage des recommandations nutritionnelles
- [ ] Créer `NutritionRecommendationPanel` : liste des aliments détectés + macros calculées
- [ ] Afficher les déséquilibres détectés (excès / déficits)
- [ ] Afficher le plan de repas généré (format lisible, filtrable par jour)
- [ ] Ajouter visualisation interactive (graphique radar ou barres pour les macros)

### 5c. Affichage des recommandations sportives
- [ ] Créer `SportRecommendationPanel` : programme d'entraînement hebdomadaire
- [ ] Afficher la progression adaptative (niveau actuel → objectif)
- [ ] Permettre le filtrage par objectif (perte de graisse, renforcement, endurance)

---

## 6. Intégration robuste des APIs externes

- [ ] Ajouter un mécanisme de **retry** automatique (1-2 tentatives) sur les appels IA
- [ ] Implémenter une mise en **cache côté client** des recommandations déjà reçues (éviter re-appels inutiles)
- [ ] Afficher un message de fallback clair si l'API IA est indisponible
- [ ] Gérer le rate limiting (ne pas envoyer plusieurs requêtes simultanées pour le même utilisateur)

---

## 7. Tests

- [ ] Étendre la couverture Vitest sur les nouveaux composants et services IA
- [ ] Ajouter des tests Cypress E2E pour les parcours critiques :
  - Soumettre une photo → voir les recommandations
  - Naviguer entre les onglets du dashboard
  - Exporter les données
- [ ] Générer et inclure le rapport de couverture dans les livrables (`vitest --coverage`)
