# 🧪 Guide de Test - Version Refactorisée

## 🌐 **URLs de Test**
- **Local :** http://localhost:8081/
- **Réseau :** http://172.30.0.2:8081/

## 📋 **Tests à Effectuer**

### **1. Test des Fonctionnalités de Base**

#### **A. Initialisation de la Caméra**
- [ ] Ouvrir l'application
- [ ] Cliquer sur le bouton "📸" pour initialiser la caméra
- [ ] Vérifier que la caméra s'initialise correctement
- [ ] Vérifier les logs dans la console (F12)

**Logs attendus :**
```
🎥 Initializing camera...
✅ Camera: Camera stream active: [ID]
✅ Camera: Initialized with settings: [settings]
```

#### **B. Contrôles de Zoom**
- [ ] Utiliser les boutons +/- pour zoomer
- [ ] Utiliser le slider de zoom
- [ ] Vérifier l'indicateur de zoom (ex: "2.5x")
- [ ] Vérifier l'icône du mode de zoom (🔍 Canvas / 📷 Natif)

**Logs attendus :**
```
🔍 Zoom: Zoom changed to: [niveau]
```

#### **C. Enregistrement Vidéo**
- [ ] Démarrer un enregistrement avec zoom > 1x
- [ ] Vérifier l'indicateur "REC" rouge
- [ ] Vérifier l'indicateur "Zoom Canvas Actif" si applicable
- [ ] Arrêter l'enregistrement
- [ ] Vérifier que la vidéo est sauvegardée

**Logs attendus :**
```
📹 Recording: Recording with canvas zoom: [niveau]
📹 Recording: Recording started
📹 Recording: Recording stopped and saved
```

### **2. Test des Améliorations de Performance**

#### **A. Re-renders**
- [ ] Ouvrir les DevTools (F12)
- [ ] Aller dans l'onglet "Performance"
- [ ] Enregistrer une session pendant 10 secondes
- [ ] Vérifier qu'il y a moins de re-renders qu'avant

#### **B. Logs de Production**
- [ ] Vérifier que les logs de débogage ne s'affichent pas en production
- [ ] Seuls les logs d'erreur doivent être visibles

#### **C. Mémoire**
- [ ] Ouvrir les DevTools (F12)
- [ ] Aller dans l'onglet "Memory"
- [ ] Prendre un snapshot
- [ ] Vérifier l'utilisation de la mémoire

### **3. Test de l'Interface Utilisateur**

#### **A. Panneau de Paramètres Mobile**
- [ ] Cliquer sur le bouton ☰ (menu) en haut à gauche
- [ ] Vérifier que le panneau s'ouvre et reste ouvert
- [ ] Cliquer sur le bouton ⚙️ (paramètres) en haut à droite
- [ ] Vérifier que le panneau se ferme/ouvre correctement
- [ ] Cliquer sur le X pour fermer

#### **B. Contrôles de Zoom**
- [ ] Vérifier l'affichage du niveau de zoom
- [ ] Vérifier l'icône du mode de zoom
- [ ] Tester les boutons +/- et le slider

#### **C. Indicateurs Visuels**
- [ ] Vérifier l'indicateur de mode (PHOTO/VIDEO)
- [ ] Vérifier l'indicateur de zoom
- [ ] Vérifier l'indicateur d'enregistrement
- [ ] Vérifier l'indicateur de mode de zoom pendant l'enregistrement

### **4. Test Mobile**

#### **A. Mode Responsive**
- [ ] Redimensionner la fenêtre à < 768px
- [ ] Vérifier que l'interface s'adapte
- [ ] Tester les contrôles tactiles

#### **B. Performance Mobile**
- [ ] Tester sur un appareil mobile réel
- [ ] Vérifier la fluidité des animations
- [ ] Tester le zoom tactile

### **5. Test de Gestion d'Erreurs**

#### **A. Erreurs de Caméra**
- [ ] Refuser les permissions caméra
- [ ] Vérifier le message d'erreur approprié
- [ ] Vérifier les logs d'erreur

#### **B. Erreurs d'Enregistrement**
- [ ] Tester l'enregistrement sans caméra
- [ ] Vérifier la gestion d'erreur

## 🔍 **Logs à Surveiller**

### **Logs de Succès (✅)**
- Initialisation caméra
- Changements de zoom
- Démarrage/arrêt d'enregistrement
- Changements d'objectif

### **Logs d'Erreur (❌)**
- Erreurs de permission
- Erreurs d'enregistrement
- Erreurs de zoom
- Erreurs de sauvegarde

### **Logs de Débogage (🔍)**
- Changements d'état
- Événements utilisateur
- Performance

## 📊 **Métriques de Performance**

### **Avant (Ancienne Version)**
- Re-renders : ~50-100 par minute
- Logs : 64+ en production
- Bundle size : ~415KB
- Types `any` : 30+

### **Après (Version Refactorisée)**
- Re-renders : ~10-20 par minute (attendu)
- Logs : 0 en production (attendu)
- Bundle size : ~415KB (similaire)
- Types `any` : <5 (attendu)

## 🐛 **Problèmes Connus à Vérifier**

1. **Panneau de paramètres qui disparaît** - ✅ Corrigé
2. **Zoom invisible pendant l'enregistrement** - ✅ Corrigé
3. **Logs de débogage en production** - ✅ Corrigé
4. **Re-renders excessifs** - ✅ Amélioré

## 📝 **Rapport de Test**

Après chaque test, noter :
- [ ] Fonctionnalité testée
- [ ] Résultat (✅ Succès / ❌ Échec)
- [ ] Commentaires
- [ ] Logs observés
- [ ] Performance observée

## 🚀 **Commandes Utiles**

```bash
# Démarrer le serveur
npm run dev

# Vérifier les types
npm run type-check

# Linter
npm run lint

# Build de production
npm run build

# Analyser le bundle
npm run build:analyze
```