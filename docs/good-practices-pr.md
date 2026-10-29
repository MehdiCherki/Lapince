# 🔄 Processus de création d'une Pull Request (PR)

Voici le guide étape par étape pour proposer votre code une fois votre fonctionnalité ou correction terminée. Suivez ces commandes Git pour créer votre PR proprement.

## Étape 1 : Mettre à jour et créer sa branche

Avant de commencer à coder, assurez-vous d'être à jour avec la branche principale et créez une nouvelle branche pour votre tâche.

```bash
# 1. Se placer sur la branche principale
git checkout main

# 2. Récupérer les dernières modifications de l'équipe
git pull origin main

# 3. Créer et basculer sur votre nouvelle branche (utilisez feat/ ou fix/)
git checkout -b feat/nom-de-ma-tache
```

## Étape 2 : Sauvegarder son travail (Commit)

Une fois que vous avez fini de coder et testé localement, enregistrez vos modifications.

```bash
# 1. Voir les fichiers modifiés
git status

# 2. Ajouter les fichiers modifiés (ou git add . pour tout ajouter)
git add <nom-du-fichier>

# 3. Créer le commit avec un message descriptif
git commit -m "feat: ajout de la page de connexion"
```

## Étape 3 : Pousser son code (Push)

Envoyez votre branche sur le dépôt distant (GitHub) pour que les autres puissent y accéder.

```bash
# Pousser la branche vers GitHub pour la première fois
git push -u origin feat/nom-de-ma-tache
```

## Étape 4 : Ouvrir la Pull Request sur GitHub

1. Allez sur la page du dépôt GitHub de **La Pince**.
2. Une bannière jaune apparaîtra en haut avec le bouton **"Compare & pull request"**. Cliquez dessus.
3. **Vérifiez la direction** : La flèche doit pointer de `feat/nom-de-ma-tache` vers `main`.
4. **Remplissez les informations** :
   - Titre clair (ex: `feat: Ajout de la page de connexion`)
   - Description : Expliquez ce que fait le code, liez le ticket Trello/Notion, et donnez les étapes pour tester.
5. Cliquez sur **"Create pull request"**.

## Étape 5 : Demander une relecture (Peer Review)

1. Sur la droite de la page de votre PR, cliquez sur **"Reviewers"**.
2. Sélectionnez la personne responsable de relire votre code (selon les règles de l'équipe Front/Back).
3. Prévenez l'équipe sur votre canal de communication (Discord/Slack) qu'une PR est prête à être relue.

> ⚠️ **Rappel important :** Vous ne pouvez pas fusionner (merge) votre propre PR. Vous devez attendre l'approbation (*Approve*) de votre relecteur.