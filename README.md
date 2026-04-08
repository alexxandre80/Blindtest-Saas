# 🎵 Blind Test SaaS

Application web de blind test multijoueur en temps réel. Un MJ anime la partie depuis son PC, les joueurs rejoignent depuis leur mobile via QR code ou lien partagé.

---

## Aperçu

| Vue | Description |
|-----|-------------|
| **Dashboard MJ** | Créer et gérer ses blind tests |
| **Lobby** | Salle d'attente avec QR code et liste des joueurs |
| **Régie** | Contrôle de la partie (playlist, timer, buzzers, scores) |
| **Projection** | Vue grande écran pour le public (overlay buzz, timer, podium) |
| **Joueur** | Bouton buzzer mobile-first, timer, feedback en temps réel |

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18, Vite, React Router v6, Zustand |
| Backend | Node.js, Express, Socket.io |
| Base de données | PostgreSQL, Prisma ORM |
| Auth | Better Auth (email/password + Google OAuth) |
| Déploiement | Docker Compose |
| Emails | Resend |

---

## Fonctionnalités

### MJ (Maître du jeu)
- Création et édition de blind tests (tracks YouTube)
- Configuration de partie : mode solo ou équipes, durée des extraits
- Partage de la room via QR code ou lien direct (code pré-rempli)
- Régie en temps réel : musique suivante, timer pause/reset, verdict buzzer
- Vue projection séparée (à ouvrir sur un projecteur / TV)

### Joueurs
- Rejoindre via QR code ou lien — code pré-rempli automatiquement
- Choix d'équipe si mode équipes activé
- Bouton buzzer optimisé mobile (160px, feedback vibration)
- Re-buzz possible après refus, reset automatique entre les manches
- Podium animé avec confettis en fin de partie

### Système de jeu
- Timer serveur avec pause automatique sur buzz
- Révélation automatique de la réponse à timer = 0
- File de buzzers ordonnée avec verdict ✓ / ✗
- Scores en temps réel (équipes ou joueurs individuels)
- Musique continue après bonne réponse (YouTube player persistant)

---

## Installation

### Prérequis
- Docker & Docker Compose
- Node.js 20+ (pour le développement local hors Docker)

### 1. Cloner le projet

```bash
git clone https://github.com/TON_USERNAME/saas-blindtest.git
cd saas-blindtest
```

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Remplir `.env` :

```env
# Base de données
DATABASE_URL=postgresql://blindtest:blindtest@db:5432/blindtest

# Auth
AUTH_SECRET=une_chaine_aleatoire_longue
AUTH_BASE_URL=http://localhost:3001
CLIENT_URL=http://localhost:5173

# Google OAuth (optionnel)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Emails (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@tondomaine.com
```

### 3. Lancer en développement

```bash
docker compose up --build
```

- Frontend : http://localhost:5173
- API : http://localhost:3001

### 4. Accès depuis mobile (réseau local)

L'URL API se résout automatiquement depuis n'importe quel appareil du réseau. Ouvrir `http://<IP_DU_PC>:5173` depuis le mobile.

---

## Structure du projet

```
saas-blindtest/
├── client/                   # React + Vite
│   ├── src/
│   │   ├── components/       # Timer, BuzzerButton, Podium, TeamCard, Navbar
│   │   ├── pages/            # HostLobby, HostControl, HostDisplay, Join, Play
│   │   ├── views/            # auth/, dashboard/, player/, playlists/
│   │   ├── socket/           # Socket.io client + events
│   │   ├── store/            # Zustand (gameStore)
│   │   ├── styles/           # global.css, theme.js
│   │   └── config.js         # Résolution URL API dynamique
│   └── Dockerfile.dev
│
├── server/                   # Node.js + Express
│   ├── src/
│   │   ├── config/auth.js    # Better Auth
│   │   ├── routes/           # playlists, rooms, health
│   │   ├── socket/
│   │   │   ├── handlers/     # game.js, buzzer.js, timer.js
│   │   │   └── events.js
│   │   └── index.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── Dockerfile.dev
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Routes

```
/                          → Landing page
/login  /register          → Authentification
/join?code=XXXXX           → Rejoindre une partie (code pré-rempli)
/play/:roomCode            → Vue joueur (buzzer)
/dashboard                 → MJ — mes blind tests
/dashboard/new             → Créer un blind test
/dashboard/:id/edit        → Éditer un blind test
/host/:roomCode/lobby      → MJ — salle d'attente
/host/:roomCode/control    → MJ — régie
/host/:roomCode/display    → Vue projection (TV / projecteur)
```

---

## Events Socket.io

```
JOIN_ROOM / LEAVE_ROOM
PLAYER_JOINED / PLAYER_LEFT
NEXT_TRACK → TRACK_STARTED
TIMER_START / TIMER_TICK / TIMER_END / TIMER_PAUSE / TIMER_RESET
BUZZ → BUZZ_RECEIVED
GRANT_POINT / DENY_POINT → SCORES_UPDATED
BUZZ_DENIED
ROUND_ENDED
STOP_GAME → GAME_ENDED
PAUSE_AUDIO / RESUME_AUDIO
```

---

## Design system

Palette sombre avec accents colorés :

```css
--bg-base:       #0f0f1a
--bg-surface:    #1a1a2e
--color-primary: #7c3aed   /* violet  */
--color-secondary: #06b6d4 /* cyan    */
--color-success: #10b981   /* vert    */
--color-danger:  #ef4444   /* rouge   */
```

Couleurs équipes : violet, cyan, vert, amber, rouge, rose.

---

## Roadmap

- [ ] Mode écrit — les joueurs tapent la réponse
- [ ] Historique des parties et statistiques
- [ ] Upload d'avatar (actuellement : URL uniquement)
- [ ] Preview YouTube dans l'éditeur de blind test
- [ ] Invitation des joueurs par email
- [ ] Déploiement production (CI/CD)

---

## Licence

Projet privé — tous droits réservés.
