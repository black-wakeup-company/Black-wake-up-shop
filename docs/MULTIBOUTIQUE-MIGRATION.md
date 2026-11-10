# BoutiquePro — migration multiboutique

## Architecture retenue
- Un compte Firebase propriétaire correspond à une boutique.
- Le UID Firebase du propriétaire sert d'identifiant de boutique.
- Les membres et les futures données métier sont isolés sous `stores/{storeId}`.
- Firestore sera la source de synchronisation entre appareils.
- Google Drive reste réservé aux sauvegardes et restaurations.
- GitHub Pages reste l'hébergement.

## Fondation ajoutée
- `src/services/storeService.ts` : création transactionnelle ou vérification de l'espace propriétaire.
- `firestore.rules` : règles initiales restrictives.
- Ces fichiers ne sont pas encore raccordés à l'interface.

## Sécurité et activation
Les règles actuelles autorisent uniquement la création initiale du propriétaire et bloquent toutes les collections métier. Ne les publiez pas encore dans Firebase et ne lancez pas le service depuis l'application. Les règles des produits, ventes, clients, dépenses, caisse, paramètres et employés doivent être conçues et testées avant la synchronisation.

## Étapes suivantes
1. Séparer la connexion propriétaire de l'autorisation Google Drive sans casser les sauvegardes.
2. Créer et afficher l'espace boutique après authentification.
3. Définir les permissions Firestore par collection et par rôle.
4. Ajouter les comptes employés avec authentification email/mot de passe.
5. Migrer progressivement les données locales, avec sauvegarde/restauration vérifiée.
6. Tester plusieurs comptes et appareils avant toute mise en production.

## Contraintes du projet
- Rester sur Firebase Spark gratuit : ne pas activer Blaze ni la facturation.
- Développer uniquement sur `multiboutique-dev`.
- Ne pas modifier `main` ni `backup-before-multiboutique`.
- Préserver l'URL GitHub Pages et les fonctions existantes.
