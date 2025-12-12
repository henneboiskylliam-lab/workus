# Work Us 🚀

**Plateforme d'apprentissage et de mise en relation professionnelle**

Work Us est une application web moderne conçue pour l'apprentissage, l'évolution professionnelle et la mise en relation entre talents et entreprises.

## 🎯 Vision

> *« Apprenez ce que vous souhaitez, quand vous le souhaitez, avec qui vous le souhaitez, pour bâtir l'avenir que vous souhaitez »*

---

## 🚀 Démarrage rapide (Windows)

### Prérequis
- **Node.js 18+** : [Télécharger ici](https://nodejs.org/)

### Option 1 : Double-clic (Recommandé)

1. Double-cliquez sur **`start-dev.bat`**
2. Le site s'ouvre automatiquement sur **http://localhost:5173**

### Option 2 : Terminal / PowerShell

```powershell
# Ouvrir un terminal dans le dossier du projet, puis :

# Installer les dépendances (première fois uniquement)
npm install

# Lancer le serveur de développement
npm run dev
```

### Option 3 : Script PowerShell

```powershell
# Si les scripts PowerShell sont autorisés :
.\start-dev.ps1
```

> **Note** : Si PowerShell bloque le script, exécutez d'abord :
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

## 📦 Scripts disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| **Développement** | `npm run dev` | Lance le serveur de développement |
| **Build** | `npm run build` | Construit la version de production |
| **Preview** | `npm run preview` | Prévisualise le build de production |
| **Lint** | `npm run lint` | Vérifie le code avec ESLint |

### Fichiers batch Windows

| Fichier | Description |
|---------|-------------|
| `start-dev.bat` | Lance le serveur de développement (double-clic) |
| `start-dev.ps1` | Script PowerShell alternatif |
| `build.bat` | Construit la version de production |

---

## ✨ Fonctionnalités

### 📚 12 Catégories de métiers

| Catégorie | Description |
|-----------|-------------|
| 🔨 Construire & Réparer | BTP, électricité, plomberie, menuiserie... |
| ⚙️ Produire & Transformer | Industrie, usinage, automatisation... |
| 💻 Numérique & Technologie | Dev web, mobile, IA, cybersécurité... |
| 🎨 Créer & Designer | Design, UX/UI, motion, audiovisuel... |
| 📢 Communiquer & Vendre | Marketing, vente, e-commerce... |
| 📊 Gérer & Organiser | Management, RH, finance, gestion projet... |
| ❤️ Soigner & Accompagner | Santé, bien-être, accompagnement social... |
| 📚 Apprendre & Transmettre | Enseignement, formation, coaching... |
| 🛡️ Protéger & Sécuriser | Sécurité, prévention des risques... |
| 🚚 Se Déplacer & Distribuer | Transport, logistique, supply chain... |
| 🤝 Accueillir & Servir | Hôtellerie, restauration, événementiel... |
| 🚀 Innover & Entreprendre | Startups, innovation, transition écologique... |

### 👥 Social & Communauté
- Discussions publiques
- Partage d'idées et suggestions
- Système de followers/abonnements
- Notifications en temps réel

### 📊 Tableau de bord
- Suivi de progression personnalisé
- Statistiques d'apprentissage
- Système de niveaux (0-10)
- Badges et récompenses

### 👨‍💼 Administration
- Gestion des utilisateurs
- Modération du contenu
- Gestion des catégories et spécialités
- Statistiques du site

---

## 🏗️ Architecture

```
workus/
├── src/
│   ├── components/           # Composants React
│   │   ├── layout/          # Layout, Sidebar, TopBar
│   │   └── ui/              # Composants UI réutilisables
│   ├── contexts/            # Contextes React (Auth, Theme, etc.)
│   ├── data/                # Données JSON
│   ├── pages/               # Pages de l'application
│   └── types/               # Types TypeScript
├── public/                  # Assets statiques
├── start-dev.bat           # Script de démarrage Windows
├── build.bat               # Script de build Windows
└── package.json            # Dépendances npm
```

---

## 🛠️ Technologies

| Catégorie | Technologie |
|-----------|-------------|
| Framework | React 18 |
| Langage | TypeScript |
| Bundler | Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Routing | React Router v6 |
| Icons | Lucide React |

---

## 🎨 Design System

### Couleurs principales
- **Primary** : `#2e89ff` (Bleu)
- **Secondary** : `#8b5cf6` (Violet)
- **Accent** : `#10b981` (Vert)

### Thème sombre
L'application utilise un thème sombre moderne avec des dégradés colorés pour une expérience visuelle immersive.

---

## 🔧 Configuration

### Port du serveur
Par défaut, le serveur tourne sur le port **5173**. Pour changer :

```typescript
// vite.config.ts
server: {
  port: 3000, // Nouveau port
}
```

### Accès réseau
Le serveur est accessible depuis d'autres appareils sur le même réseau via votre IP locale.

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 📄 Licence

MIT © Work Us

---

Construit avec ❤️ pour l'apprentissage et l'avenir professionnel.
