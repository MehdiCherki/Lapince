Docker — commandes de base
Images
```bash
docker pull nginx              # Télécharger
docker build -t mon-app .      # Builder
docker images                  # Lister
docker rmi mon-app             # Supprimer
```
Conteneurs
```bash
docker run nginx               # Lancer
docker run -d nginx            # En arrière-plan
docker run -d -p 8080:80 nginx # Avec port (hôte:conteneur)
docker run --name web nginx    # Avec un nom
docker run -it ubuntu bash     # Mode interactif

docker ps                      # Conteneurs actifs
docker ps -a                   # Tous les conteneurs
docker stop web                # Arrêter
docker rm web                  # Supprimer
docker logs web                # Voir les logs
docker exec -it web bash       # Entrer dans le conteneur
```
Docker Compose
```bash
docker compose up -d           # Démarrer en arrière-plan
docker compose up --build      # Rebuild + démarrer
docker compose down            # Stopper + supprimer
docker compose logs -f         # Suivre les logs
docker compose exec app bash   # Entrer dans un service
docker compose ps              # État des services
```
Nettoyage
```bash
docker system prune -a         # Tout nettoyer
```


