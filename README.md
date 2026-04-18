# Frontend MSPR - Dashboard Admin & Analytics

Cette application est une interface web d'administration et d'analyse pour des donnees sante/nutrition/fitness.

Elle permet a un profil metier ou data de:
- consulter des KPI et des visualisations business,
- inspecter les donnees par domaine (nutrition, regimes, entrainements),
- modifier les lignes (CRUD) pour nettoyer les jeux de donnees,
- exporter les donnees nettoyees en CSV ou JSON.

## Ce que fait l'application

Le front affiche un dashboard unique avec:

- un en-tete et des indicateurs KPI globaux (qualite, profils a risque, adherence, etc.),
- un panneau de nettoyage de donnees par onglet:
  - `nutrition`
  - `diet`
  - `gym`
- des actions de gestion sur les lignes:
  - ajouter
  - modifier
  - supprimer
- une pagination des donnees affiches,
- un export des donnees de l'onglet courant en:
  - CSV
  - JSON
- un panneau Analytics avec 3 vues:
  - profils sante
  - nutrition
  - fitness

## D'ou viennent les donnees

### API REST backend via `/api`

Le frontend appelle aussi une API REST exposee sous le prefixe `/api`:

- `GET /api/diet`
- `GET /api/nutrition`
- `GET /api/gym`
- plus les operations d'edition pour chaque onglet:
  - `POST /api/{tab}`
  - `PUT /api/{tab}/{id}`
  - `DELETE /api/{tab}/{id}`

En developpement, Vite proxifie automatiquement `/api` vers `http://localhost:8084`.

## Flux de donnees (resume)

1. Le frontend charge les datasets via le repository du dashboard.
2. Les donnees sont normalisees (noms de champs, types, formats).
3. Les metriques et anomalies sont calculees cote frontend.
4. L'utilisateur peut corriger les donnees depuis l'interface.
5. Les modifications sont envoyees au backend via l'API REST.
6. Le resultat peut etre exporte en CSV ou JSON.

## Stack technique

- React 19
- TypeScript
- Vite
- ESLint
- Vitest

## Lancer le projet

### Prerequis

- Node.js 20+ recommande
- npm

### Installation

```bash
npm install
```

### Developpement

```bash
npm run dev
```

### Build production

```bash
npm run build
```

### Preview locale du build

```bash
npm run preview
```

### Tests unitaires

```bash
npm run test
```

## Scripts disponibles

- `npm run dev` : demarre le serveur Vite
- `npm run build` : compile TypeScript puis build Vite
- `npm run lint` : lance ESLint
- `npm run preview` : sert le build localement
- `npm run test` : execute les tests unitaires

## Structure principale

- `src/assets/dashboard/` : composants UI du dashboard
- `src/services/` : logique analytics, export, repository API, data loading
- `src/types/` : contrats et types du domaine

## Notes

- Le projet est un frontend; il attend une API backend disponible pour les endpoints `/api/*`.
- Sans backend actif, les appels API echoueront sur les jeux dependants de `/api`.
