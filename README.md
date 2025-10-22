# Eye of God v2

Interface d'accueil immersive qui met en scène un globe 3D interactif et un overlay de surveillance simulé.

## Structure

```
/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── animations.js
│   ├── main.js
│   ├── scene.js
│   ├── ui.js
│   └── data/
│       ├── videos.json
│       └── whitelist.json
├── styles/
│   └── style.css
└── README.md
```

## Démarrage rapide

### Option 1 · Vite (recommandé)

```bash
npm install
npm run dev
```

Le serveur écoute par défaut sur [http://localhost:5173](http://localhost:5173).

Pour produire une version statique optimisée :

```bash
npm run build
npm run preview
```

### Option 2 · Fichier statique

Aucune dépendance n'est requise : ouvrez simplement `index.html` dans un navigateur moderne supportant ES modules.

## Fonctionnalités clés

- Globe 3D Three.js avec halo cyan, wireframe et rotation douce.
- Nœuds lumineux (10+), lignes pulsées, labels au survol, zoom caméra via GSAP.
- Overlay « data/video » avec glitch & scanlines CSS, contrôle Play/Pause simulé (barre de progression + timecode).
- Bouton « Random site » qui ouvre uniquement une URL provenant de `src/data/whitelist.json` dans un nouvel onglet.
- Bouton « Reduce Motion » pour désactiver les animations lourdes et respecter les préférences d'accessibilité.
- Raccourcis clavier : `Esc` ferme l'overlay, `Espace` bascule la lecture simulée, navigation tabulable via la liste cachée des nœuds.
- Fallback mobile 2D (canvas) si WebGL est indisponible ou écran étroit.

## Données et personnalisation

- `src/data/videos.json` contient des métadonnées factices. Pour brancher de vraies vidéos plus tard, remplacez les champs `src` / `poster` par vos ressources locales et adaptez l'overlay (par exemple en injectant un `<video>` contrôlé) tout en respectant la contrainte « pas d’assets distants ».
- `src/data/whitelist.json` définit les destinations sûres pour le bouton « Random site ». Ajoutez vos URLs en respectant le format JSON.

## Accessibilité et sécurité

- Aucune requête réseau externe (hors bibliothèques CDN). Pas de cookies, trackers ou redirections hors liste blanche.
- Mode « Reduce Motion » appliqué au body pour couper les animations non essentielles.
- Overlay conforme ARIA (`role="dialog"`, fermeture via Esc, bouton de fermeture explicite).

## Licence

Projet fourni sans licence explicite — adaptez selon vos besoins.
