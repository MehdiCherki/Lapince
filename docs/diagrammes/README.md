# Schémas — La Pince

Schémas UML écrits en texte ([PlantUML](https://plantuml.com/)), versionnés avec le code : chaque fichier `.puml` est la source, les images `.svg` et `.png` en sont générées. Le MCD est à part, dans [../mcd/](../mcd/) (Mocodo), et documenté dans [../base-de-donnees.md](../base-de-donnees.md).

| Schéma | Source | Contenu |
|---|---|---|
| Cas d'utilisation — utilisateur connecté | [cas-utilisation.puml](cas-utilisation.puml) | transactions, budgets et alertes, suivi, compte ; « recalculer l'alerte » inclus par 4 cas |
| Cas d'utilisation — accès au service | [cas-utilisation-acces.puml](cas-utilisation-acces.puml) | inscription, confirmation de l'email, connexion, mot de passe oublié |
| Architecture multicouche | [architecture.puml](architecture.puml) | client, reverse proxy, API, base, et la défense propre à chaque couche |
| Séquence du fil rouge (1/2) | [sequence-ajout-depense.puml](sequence-ajout-depense.puml) | ajouter une dépense : parcours de la requête et contrôles (session, validation, catégorie) |
| Séquence du fil rouge (2/2) | [sequence-ecriture-alerte.puml](sequence-ecriture-alerte.puml) | écriture de la dépense et recalcul de l'alerte dans une transaction, sous verrou |
| Déploiement | [deploiement.puml](deploiement.puml) | serveur, conteneurs Docker, flux et ports, services externes |

## Regénérer les images

Depuis la racine du dépôt (PowerShell) :
```powershell
foreach ($t in "svg", "png") { docker run --rm -v "${PWD}/docs/diagrammes:/data" plantuml/plantuml "-t$t" "/data/*.puml" }
```
Un seul format par appel : avec `-tsvg -tpng`, PlantUML ne garde que le dernier.

## Format A4

Chaque schéma est conçu pour une page A4 (16 cm de large utiles) : texte d'au moins 8,5 pt une fois l'image réduite, 23 cm de haut au plus. Largeur d'insertion conseillée :

| Image | Largeur | Texte obtenu | Hauteur |
|---|---|---|---|
| `cas-utilisation.png` | 16 cm | 8,9 pt | 14,0 cm |
| `cas-utilisation-acces.png` | 14 cm | 8,9 pt | 8,8 cm |
| `architecture.png` | 13 cm | 9,8 pt | 17,8 cm |
| `sequence-ajout-depense.png` | 16 cm | 8,8 pt | 20,9 cm |
| `sequence-ecriture-alerte.png` | 15 cm | 8,8 pt | 17,8 cm |
| `deploiement.png` | 15,5 cm | 8,7 pt | 21,6 cm |
| `../mcd/la-pince.png` | 12 cm | 9,6 pt | 14,9 cm |
