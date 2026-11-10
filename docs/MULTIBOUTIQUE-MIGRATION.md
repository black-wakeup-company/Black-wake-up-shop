# BoutiquePro — migration multiboutique

## Architecture retenue
- Un compte Firebase propriétaire correspond à une boutique.
- Le UID Firebase du propriétaire sert d'identifiant de boutique.
- Les membres et les données métier sont isolés sous `stores/{storeId}`.
- Firestore sera la source de synchronisation entre appareils.
- Google Drive reste réservé aux sauvegardes et restaurations.
- GitHub Pages reste l'hébergement.
- Le projet reste compatible avec Firebase Spark gratuit ; aucune Cloud Function ni activation de facturation n'est prévue.

## Fondation ajoutée
- `src/services/firebase.ts` : application Firebase principale et authentification propriétaire/employé.
- `src/services/ownerAuth.ts` : connexion Google du propriétaire sans demander l'accès Google Drive.
- `src/services/googleAuth.ts` : application Firebase secondaire dédiée à Google Drive.
- `src/services/storeService.ts` : création transactionnelle ou vérification de l'espace propriétaire.
- `src/services/storeDataService.ts` : accès Firestore explicitement limité à l'identifiant de boutique fourni.
- `src/services/employeeAuth.ts` : création des comptes employés via une application Firebase secondaire, sans remplacer la session du propriétaire.
- `src/components/auth/OwnerLoginScreen.tsx` : écran de connexion propriétaire prêt à être intégré après validation du parcours complet.
- `firestore.rules` : règles séparées par collection et rôle.

## Modèle de rôles préparé
- `owner` : contrôle complet de la boutique et des membres.
- `manager` : gestion des produits, clients, ventes, dépenses et sessions de caisse ; pas de gestion des membres ni des paramètres globaux.
- `cashier` : lecture des produits et données clients, création des ventes et gestion des sessions de caisse ; pas d'accès aux dépenses.
- Un membre inactif n'a aucun accès aux données métier.
- Les accès métier exigent aussi un email vérifié (`email_verified`), y compris pour le propriétaire connecté via Google.
- La création employé crée le compte Auth sur l'application secondaire, puis le document membre via la session propriétaire ; l'email de vérification est envoyé ensuite.
- Les employés ne peuvent lire que leur propre document de membre ; seul le propriétaire peut lister et administrer les membres.

## Sécurité et activation
Les règles de rôle viennent d'être préparées dans le dépôt, mais elles ne sont **pas encore publiées dans Firebase**. Elles ne sont pas encore validées par des tests d'émulateur Firestore. Ne les publiez pas et ne raccordez pas encore les services à l'interface avant cette validation.
Les contrôles du client ne remplacent jamais les règles Firestore côté serveur.

## Étapes suivantes
1. Valider les règles avec des tests positifs et négatifs dans l'émulateur Firestore : propriétaire, manager, caissier, email non vérifié, membre désactivé et utilisateur d'une autre boutique.
2. Ajouter la création des comptes employés email/mot de passe sans remplacer la session du propriétaire.
3. Intégrer progressivement la connexion et le contexte boutique.
4. Migrer les données locales uniquement après sauvegarde vérifiée et confirmation du propriétaire ; ne jamais importer les données de démonstration automatiquement.
5. Tester plusieurs comptes et appareils avant toute mise en production.

## Contraintes du projet
- Rester sur Firebase Spark gratuit : ne pas activer Blaze ni la facturation.
- Développer uniquement sur `multiboutique-dev`.
- Ne pas modifier `main` ni `backup-before-multiboutique`.
- Préserver l'URL GitHub Pages et les fonctions existantes.
- Ne pas modifier les deux parcours d'impression (ticket thermique et facture A4).
