# 🐳 Docker Build Guide pour Tokilane

Ce guide vous aide à choisir la meilleure stratégie de build Docker selon votre environnement.

## 🚀 Tests rapides

### Option 1: Test automatique (recommandé)
```bash
./scripts/build-docker.sh
```
Ce script teste automatiquement les 3 approches dans l'ordre optimal.

### Option 2: Tests manuels

#### Test Alpine (le plus léger)
```bash
docker build -t tokilane:alpine .
```

#### Test Hybrid (Debian Go + Alpine final)
```bash
docker build -f Dockerfile.hybrid -t tokilane:hybrid .
```

#### Test Full Debian (le plus compatible)
```bash
docker build -f Dockerfile.debian -t tokilane:debian .
```

## 📊 Comparaison des approches

| Approche | Taille finale | Compatibilité | Vitesse build | Recommandation |
|----------|---------------|---------------|---------------|----------------|
| **Alpine** | ~50MB | Moyenne (musl-libc) | Rapide | Production légère |
| **Hybrid** | ~60MB | Élevée | Moyenne | **Recommandé** |
| **Debian** | ~150MB | Très élevée | Lente | Développement |

## 🎯 Recommandations par cas d'usage

### Production (recommandé: Hybrid)
```bash
# Build
docker build -f Dockerfile.hybrid -t tokilane:prod .

# Run
docker run -d \
  -p 1323:1323 \
  -v ./files:/app/files \
  -v ./data:/app/data \
  --name tokilane \
  jierka/tokilane:latest
```

### Développement local
```bash
# Utilise docker-compose
docker-compose up -d
```

### CI/CD
```bash
# Dans votre pipeline, utilisez Hybrid pour équilibrer taille/compatibilité
docker build -f Dockerfile.hybrid -t myregistry/tokilane:latest .
```

## 🔧 Résolution des problèmes

### Erreur SQLite (pread64/pwrite64)
- ✅ **Solution**: Utilisez `Dockerfile.hybrid` ou `Dockerfile.debian`
- ❌ **Évitez**: `Dockerfile` sur certains systèmes Alpine

### Build lent
- 🏃 **Optimisation**: Utilisez `Dockerfile` (Alpine) si compatible
- 🐌 **Fallback**: `Dockerfile.hybrid` est un bon compromis

### Image trop volumineuse
- 📦 **Minimum**: `Dockerfile` (Alpine) - ~50MB
- ⚖️ **Équilibré**: `Dockerfile.hybrid` - ~60MB
- 🔧 **Compatible**: `Dockerfile.debian` - ~150MB

## 📋 Checklist de production

- [ ] Build réussi avec une des 3 approches
- [ ] Test du frontend: `npm run build` ✅
- [ ] Test de l'API: `curl http://localhost:1323/api/config`
- [ ] Test de la base de données SQLite
- [ ] Volumes persistants configurés
- [ ] Variables d'environnement définies
- [ ] Ports exposés correctement

## 🚨 En cas d'échec

Si aucune approche ne fonctionne:

1. **Vérifiez les logs** détaillés
2. **Testez le frontend** séparément: `./scripts/test-frontend.sh`
3. **Vérifiez Docker** : `docker --version` (>= 20.0)
4. **Nettoyez le cache** : `docker system prune -f`
5. **Rebuild sans cache** : `docker build --no-cache ...`
