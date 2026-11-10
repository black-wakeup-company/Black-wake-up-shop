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
- `src/components/auth/OwnerLoginScreen.tsx` : écran de connexion propriétaire.
- `src/components/auth/EmployeeLoginScreen.tsx` : écran de connexion employé par code boutique, email et mot de passe.
- `src/context/BoutiqueContext.tsx` : prend désormais un `storeId` optionnel et isole les clés LocalStorage sous `boutiquepro:store:{storeId}:...`. Sans `storeId`, le mode historique de démonstration reste inchangé. Avec un `storeId`, une nouvelle boutique démarre avec des listes métier vides et des paramètres neutres ; aucune donnée de démonstration n'est copiée.
- En mode boutique, les PIN de démonstration `1234` et `0000` ne sont plus acceptés comme solution de secours pour le verrouillage ou l'administration.
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
Les règles de rôle sont préparées dans le dépôt et validées par les tests automatisés de l'émulateur Firestore (8 tests). Elles ne sont **pas encore publiées dans Firebase** : la base distante est encore configurée avec un refus global. Ne lancez pas le parcours propriétaire/employé en production et ne publiez pas les règles avant une revue finale et un test coordonné de configuration Firebase.
Les contrôles du client ne remplacent jamais les règles Firestore côté serveur.

## Étapes suivantes
1. Valider les règles avec des tests positifs et négatifs dans l'émulateur Firestore : propriétaire, manager, caissier, email non vérifié, membre désactivé et utilisateur d'une autre boutique.
2. Finaliser la séparation des sessions propriétaire, employé et Google Drive.
3. Intégrer le routeur de connexion dans `App.tsx` après validation et publication contrôlée des règles Firestore.
4. Connecter le contexte local au service Firestore avec stratégie hors-ligne et résolution des conflits.
5. Migrer les données locales uniquement après sauvegarde vérifiée et confirmation du propriétaire ; ne jamais importer les données de démonstration automatiquement.
6. Tester plusieurs comptes et appareils avant toute mise en production.

## Contraintes du projet
- Rester sur Firebase Spark gratuit : ne pas activer Blaze ni la facturation.
- Développer uniquement sur `multiboutique-dev`.
- Ne pas modifier `main` ni `backup-before-multiboutique`.
- Préserver l'URL GitHub Pages et les fonctions existantes.
- Ne pas modifier les deux parcours d'impression (ticket thermique et facture A4).
