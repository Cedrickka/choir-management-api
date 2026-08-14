GLOET IT SARL
CAHIER FONCTIONNEL ET TECHNIQUE
Plateforme de gestion pratique d’une chorale liturgique
Cas pilote : Chœur Saint Jean Bosco (CSJB)

Objectif : fournir à Codex une spécification suffisamment précise pour implémenter le MVP puis les versions suivantes, sans réinterpréter les règles métier essentielles.

Élément	Valeur
Document	Cahier fonctionnel et technique
Version	1.0
Date	12 août 2026
Produit	Plateforme SaaS de gestion de chorales liturgiques (nom commercial à définir)
Application mobile	Flutter – Android & iOS
Backend recommandé	Node.js LTS + NestJS (TypeScript)
Base de données	PostgreSQL
Web	WordPress + plugin/portail sur mesure consommant l’API Node.js
Cas pilote	Chœur Saint Jean Bosco

Principe architectural non négociable
•	Node.js est la source de vérité métier : utilisateurs, chorales, présences, finances, chants, fichiers, abonnements, règles et journaux d’audit.
•	Flutter consomme directement l’API Node.js pour Android et iOS.
•	WordPress sert de couche web : site public, contenu éditorial, pages de vente et, si souhaité, portail web via plugin personnalisé. Il ne doit pas dupliquer les règles métier.
•	Les données d’une chorale sont isolées de celles des autres chorales (architecture multi-tenant).
 
Sommaire fonctionnel
•	1. Contexte et vision produit
•	2. Objectifs et indicateurs de succès
•	3. Périmètre fonctionnel et phases
•	4. Architecture cible
•	5. Modèle multi-tenant et organisations
•	6. Utilisateurs, rôles et permissions
•	7. Authentification et onboarding
•	8. Gestion des membres et pupitres
•	9. Calendrier pastoral et activités
•	10. Présences par QR code
•	11. Justifications, dispenses et corrections
•	12. Moteur de rappels et notifications
•	13. Présence aux messes et prestations
•	14. Statistiques individuelles et collectives
•	15. Finances, cotisations, recettes et dépenses
•	16. Bibliothèque musicale et chants répétés
•	17. Enregistrement des voix par pupitre
•	18. Carnets PDF des messes
•	19. Textes de la prochaine messe
•	20. Communiqués et accusés de lecture
•	21. RSVP et disponibilité par pupitre
•	22. Rapports et exports
•	23. Abonnements Free / Pro / Premium
•	24. WhatsApp et messagerie transactionnelle
•	25. Paiements
•	26. Fonctionnement hors connexion
•	27. Sécurité, confidentialité et audit
•	28. Front-end WordPress
•	29. Backend Node.js : modules
•	30. API REST : contrat fonctionnel
•	31. Modèle de données
•	32. Règles métier critiques
•	33. UX/UI : écrans attendus
•	34. Critères d’acceptation
•	35. Tests
•	36. Roadmap d’implémentation
•	37. Instructions de réalisation pour Codex
•	38. Références techniques
 
1. Contexte et vision produit
Le produit vise à digitaliser la gestion quotidienne d’une chorale liturgique. Le Chœur Saint Jean Bosco sert de cas pilote, mais l’architecture doit permettre à plusieurs chorales indépendantes d’utiliser la même plateforme avec des données totalement séparées.
Le produit ne doit pas être présenté comme un simple outil de pointage. Il doit devenir un ERP léger spécialisé pour chorales liturgiques, articulé autour de cinq piliers : membres, engagement, finances, organisation, musique/liturgie/communication.
•	Application mobile conviviale pour choristes et responsables.
•	Administration et rapports accessibles sur le web.
•	Présence contrôlée par QR avec heure d’arrivée et de départ.
•	Rappels personnalisables in-app et WhatsApp.
•	Gestion financière complète et transparente.
•	Bibliothèque musicale avec texte du chant et pistes audio par pupitre.
•	Calendrier pastoral, messes, carnets PDF, textes liturgiques et communiqués.
•	Modèle SaaS avec offre gratuite limitée et abonnements mensuels/annuels.
2. Objectifs et indicateurs de succès
Objectif	Indicateur attendu
Améliorer l’assiduité	Taux de présence, taux d’absence, séries de présences
Améliorer la ponctualité	Retards, minutes de retard, retard moyen
Mesurer la participation réelle	Durée de présence / durée prévue
Améliorer la préparation musicale	Chants répétés, pistes écoutées, disponibilité des textes et voix
Renforcer la transparence financière	Solde, recettes, dépenses, créances, taux de recouvrement
Réduire les oublis	Rappels automatiques et calendrier
Améliorer la communication	Communiqués lus/non lus, notifications
Préparer le pilotage annuel	Rapports automatiques par période et année pastorale

3. Périmètre fonctionnel et phases
Phase	Fonctionnalités principales
MVP	Organisation/chorale, membres, rôles, calendrier, présences QR, arrivée/départ, statistiques, notifications push, communiqués, finances de base, bibliothèque musicale avec audio par pupitre, carnets PDF.
V2	WhatsApp, paiement mobile, automatisations avancées, justifications/dispenses complètes, RSVP, rapports annuels, offline enrichi, WordPress portail membre complet.
V3	Pack paroisse multi-chorales, répertoire musical avancé, gestion équipements/documents, intégrations externes, analytics avancés, éventuelle interconnexion avec d’autres plateformes musicales/liturgiques.

4. Architecture cible
•	Mobile : Flutter, une base de code Android/iOS.
•	Backend : Node.js LTS, TypeScript, NestJS recommandé pour structurer modules, contrôleurs, services, guards et jobs.
•	Données : PostgreSQL ; utiliser des UUID et un tenant_id sur les tables métier.
•	Cache / files d’attente : Redis recommandé pour jobs, cache, rate limiting et notifications planifiées.
•	Jobs planifiés : BullMQ/équivalent pour rappels, WhatsApp, génération de rapports et traitements différés.
•	Fichiers : stockage objet compatible S3 pour PDF, justificatifs, images et audios.
•	Push : Firebase Cloud Messaging.
•	Web : WordPress + plugin personnalisé ; les opérations métier transitent vers l’API Node.
•	Authentification : access token court + refresh token ; révocation et rotation des refresh tokens.
•	Observabilité : logs structurés, erreurs, audit, métriques, alertes.
ARCH-01 [MVP] Aucune règle métier critique ne doit être implémentée uniquement dans Flutter ou WordPress. Elle doit vivre dans le backend Node.js.
ARCH-02 [MVP] Toutes les API métier doivent vérifier l’organisation/chorale du demandeur afin d’éviter toute fuite inter-tenant.
ARCH-03 [V2] Le système doit accepter un mode de stockage abstrait afin de changer de fournisseur S3 sans réécriture métier.
5. Modèle multi-tenant et organisations
•	Une Organisation représente une entité cliente : chorale, paroisse ou structure faîtière.
•	Une Chorale appartient à une organisation.
•	Dans le premier cas d’usage, une organisation peut ne contenir qu’une seule chorale.
•	Un utilisateur peut appartenir à plusieurs chorales avec des rôles différents.
•	Chaque requête métier doit être contextualisée par organization_id et/ou choir_id.
•	Les plans d’abonnement sont rattachés à l’organisation cliente.
TEN-01 [MVP] Un membre de la Chorale A ne peut jamais voir les membres, finances, chants privés ou présences de la Chorale B.
TEN-02 [MVP] Un Super Admin plateforme peut accéder aux métriques et fonctions de support prévues, avec journalisation.
TEN-03 [V2] Prévoir dès le schéma initial la possibilité d’un Pack Paroisse gérant plusieurs chorales.
6. Utilisateurs, rôles et permissions
Rôle	Droits principaux
Super Admin plateforme	Clients, plans, abonnements, support, paramétrage global, supervision.
Administrateur de chorale	Configuration, membres, rôles, activités, rapports, règles, accès complet selon plan.
Président / Comité	Vue globale, membres, calendrier, communications, rapports selon droits.
Secrétaire	Membres, calendrier, présences, communiqués, justifications, rapports administratifs.
Maestro / Direction musicale	Répétitions, chants, pistes par pupitre, programmes, disponibilité musicale, statistiques.
Trésorier	Cotisations, paiements, recettes, dépenses, relances, rapports financiers.
Contrôleur de présence	Scan QR, arrivée/départ, corrections limitées avec motif.
Chef de pupitre	Membres de son pupitre, chants/pistes de son pupitre, observations et disponibilité selon permission.
Choriste	Profil, QR, calendrier, statistiques personnelles, finances personnelles, musique, PDF, communiqués.

RBAC-01 [MVP] Le système de permissions doit être basé sur des permissions atomiques et non uniquement sur des rôles fixes.
RBAC-02 [V2] L’administrateur peut créer un rôle personnalisé à partir d’un ensemble de permissions.
7. Authentification et onboarding
•	Inscription par numéro de téléphone et/ou email.
•	Vérification OTP configurable.
•	Le numéro de téléphone principal est aussi le numéro WhatsApp utilisé pour la messagerie si le membre y consent.
•	Invitation d’un membre par lien ou code de chorale.
•	Approbation manuelle possible par le comité.
•	Profil obligatoire : nom, prénom, téléphone, pupitre ; autres champs configurables.
•	Réinitialisation sécurisée des accès.
•	Gestion de plusieurs appareils et révocation d’une session.
AUTH-01 [MVP] Un compte utilisateur est distinct de son appartenance à une chorale.
AUTH-02 [MVP] Le consentement WhatsApp doit être enregistré avec date et source.
AUTH-03 [MVP] Un membre désactivé conserve son historique mais ne peut plus accéder aux espaces privés.
8. Gestion des membres et pupitres
•	Fiche membre : nom, postnom, prénom, photo, téléphone, email, sexe, date de naissance, date d’entrée, statut, fonction, pupitre, observations, contact d’urgence facultatif.
•	Pupitres par défaut : Soprano, Alto, Ténor, Basse ; liste personnalisable.
•	Statuts : actif, inactif, suspendu, en congé, ancien membre.
•	Import CSV/Excel prévu côté web.
•	Détection des doublons par téléphone, email et correspondance nom/prénom.
•	Historique d’affectation à un pupitre.
•	Filtres et recherche rapides.
MEM-01 [MVP] La suppression d’un membre ayant un historique doit être logique (soft delete / archive), pas physique.
MEM-02 [MVP] Les statistiques historiques gardent le pupitre pertinent au moment de l’activité si nécessaire.
9. Calendrier pastoral et activités
•	Créer une année pastorale avec date de début et date de fin.
•	Types : répétition, messe, concert, réunion, formation, recollection, sortie, prestation, autre.
•	Activité : titre, type, date, heure début/fin, lieu, description, responsable, visibilité, présence requise oui/non.
•	Récurrence : hebdomadaire, mensuelle ou règle personnalisée.
•	Possibilité de modifier une occurrence sans modifier toute la série.
•	Rappels attachés à l’activité ou hérités d’un modèle.
•	Possibilité d’annuler/reporter avec notification.
CAL-01 [MVP] Toute activité doit conserver son fuseau horaire.
CAL-02 [MVP] La modification d’une activité ayant déjà déclenché des rappels doit recalculer les rappels futurs.
CAL-03 [MVP] Les activités passées ne doivent pas être écrasées par l’édition d’une série récurrente.
10. Présences par QR code
Workflow normal d’une répétition :
1.	Le responsable crée ou ouvre l’activité.
2.	À l’approche de l’heure, l’activité devient éligible au pointage selon la fenêtre configurée.
3.	Le choriste ouvre « Ma présence » ; l’application génère un QR dynamique lié à l’utilisateur, à l’activité et à une courte fenêtre de validité.
4.	Un contrôleur autorisé scanne le QR à l’arrivée.
5.	Le backend enregistre l’heure serveur, le contrôleur et le statut calculé.
6.	À la fin, le choriste présente à nouveau un QR de sortie ; le backend enregistre le départ.
7.	La durée réelle est calculée et comparée à la durée planifiée.
Paramètre	Exemple
Fenêtre d’ouverture arrivée	30 min avant l’heure
Heure normale	≤ 18:00
Retard	> 18:00
Retard grave	≥ 18:30
Participation minimale	75 % de la durée
Sortie autorisée	à partir d’un seuil configurable

ATT-01 [MVP] Le QR doit contenir un jeton signé/opaque et expirer rapidement ; il ne doit pas être un simple identifiant membre.
ATT-02 [MVP] Un même QR expiré ou déjà utilisé ne doit pas pouvoir produire une seconde arrivée.
ATT-03 [MVP] Le statut de ponctualité est calculé à partir de l’heure serveur, pas de l’heure du téléphone du choriste.
ATT-04 [MVP] Une arrivée sans sortie reste visible comme « sortie non enregistrée » et peut être régularisée avec motif.
ATT-05 [MVP] La durée = heure de sortie - heure d’arrivée ; une règle métier détermine si la participation est complète, partielle ou insuffisante.
ATT-06 [MVP] Le scan doit afficher immédiatement : nom, photo, pupitre, heure et résultat.
11. Justifications, dispenses et corrections
•	Le choriste peut justifier une absence ou un retard.
•	Motifs configurables : maladie, travail, voyage, famille, études, autre.
•	Possibilité d’ajouter commentaire et pièce justificative.
•	Le responsable accepte/refuse avec commentaire.
•	Dispense sur période : les activités couvertes ne doivent pas pénaliser l’assiduité.
•	Correction manuelle d’un pointage avec raison obligatoire.
•	Toute correction crée une entrée dans le journal d’audit avec avant/après.
JUS-01 [MVP] Une absence justifiée doit rester une absence factuelle mais être distinguée de l’absence injustifiée dans les statistiques.
JUS-02 [MVP] Une dispense approuvée peut être exclue du dénominateur du taux d’assiduité selon le paramétrage de la chorale.
12. Moteur de rappels et notifications
Déclencheur	Exemple	Cibles possibles
Avant activité	-24 h, -6 h, -30 min	Tous / pupitre / personnes ciblées
Retard	+10 min, +30 min si non arrivé	Membres attendus non pointés
Fin activité	Après fin	Absents / sorties manquantes
Cotisation	Avant échéance / après échéance	Débiteurs
Communiqué	Publication	Tout ou segment
Anniversaire	Jour J	Membre / chorale

•	Canaux : push, in-app, WhatsApp ; email facultatif.
•	Message personnalisable par administrateur.
•	Variables : {Prenom}, {Nom}, {Activite}, {Date}, {Heure}, {Lieu}, {MinutesRetard}, {Montant}, {SoldeDu}, {Pupitre}, {Lien}.
•	Conditions : envoyer seulement si membre actif, non arrivé, impayé, etc.
•	Historique d’envoi : queued, sent, delivered, read si disponible, failed.
•	Possibilité de mettre en pause un modèle.
NOTIF-01 [MVP] Les rappels de retard doivent être annulés dès qu’une arrivée valide est enregistrée.
NOTIF-02 [MVP] L’édition d’un modèle ne doit pas modifier rétroactivement les messages déjà envoyés.
NOTIF-03 [MVP] Le système doit empêcher les doublons lors d’un retry de job.
NOTIF-04 [MVP] Les notifications in-app doivent être marquables comme lues.
NOTIF-05 [MVP] Le push doit être implémenté avec Firebase Cloud Messaging.
13. Présence aux messes et prestations
•	Une messe/prestation peut utiliser un pointage simple (arrivée uniquement) ou double (arrivée/sortie), configurable.
•	Les statistiques de répétitions et de messes sont séparées.
•	Une activité peut exiger une confirmation RSVP en amont.
•	Possibilité de définir des membres non attendus pour une activité précise.
MASS-01 [MVP] Le taux d’assiduité répétition ne doit jamais être calculé en mélangeant les messes sauf si un indicateur global explicitement demandé le fait.
14. Statistiques individuelles et collectives
Tableau de bord choriste
•	Nombre d’activités attendues.
•	Présences, absences justifiées, absences injustifiées.
•	Retards, minutes de retard, retard moyen.
•	Durée totale de participation.
•	Taux d’assiduité et taux de ponctualité.
•	Évolution mensuelle.
•	Statistiques séparées : répétitions, messes, prestations.
Tableau de bord comité
•	Taux global et par pupitre.
•	Liste des absents/retardataires récurrents.
•	Top séries de présence facultatif et non punitif.
•	Comparaison par période.
•	Filtres : date, type, pupitre, membre, statut.
•	Exclusion manuelle de certains membres du rapport.
•	Export PDF et Excel.
STAT-01 [MVP] Toutes les statistiques doivent être recalculables à partir des événements sources ; éviter de stocker uniquement des agrégats non auditables.
STAT-02 [MVP] Le rapport doit expliquer son dénominateur : activités attendues, dispenses exclues ou incluses.
STAT-03 [MVP] Les indicateurs individuels visibles au choriste ne doivent contenir aucune donnée privée d’un autre choriste.
15. Finances, cotisations, recettes et dépenses
•	Plusieurs caisses/fonds : caisse ordinaire, assistance, projet, activité, autre.
•	Cotisation : libellé, montant, devise, périodicité, échéance, membres concernés.
•	Appels ponctuels : assistance, projet, événement.
•	Situation individuelle : dû, payé, reste, retard.
•	Paiement : digital ou cash validé par un responsable autorisé.
•	Recettes hors cotisations.
•	Dépenses : catégorie, bénéficiaire, motif, montant, devise, pièce justificative.
•	Rapport de caisse par période, fonds et devise.
•	Solde théorique calculé automatiquement.
•	Taux de recouvrement et créances.
•	Historique et audit des annulations/corrections.
FIN-01 [MVP] Ne jamais mélanger les soldes CDF et USD sans conversion explicite et taux documenté.
FIN-02 [MVP] Une opération financière validée ne doit pas être supprimée silencieusement ; utiliser annulation/contre-écriture selon le workflow choisi.
FIN-03 [MVP] Les pièces justificatives doivent être liées à l’opération et protégées par les permissions.
FIN-04 [MVP] Le choriste ne voit que sa propre situation, pas celle des autres.
FIN-05 [MVP] Le rapport financier doit afficher solde initial, recettes, dépenses, solde final et détail des mouvements.
16. Bibliothèque musicale et chants répétés
Ce module est prioritaire. Il doit fonctionner comme une vraie bibliothèque musicale interne de la chorale, centrée sur les chants réellement appris et répétés.
•	Fiche chant : titre, compositeur/auteur, langue, catégorie liturgique, temps liturgique, tags, niveau de difficulté, statut.
•	Texte complet du chant lisible dans l’application.
•	Partition PDF facultative si la chorale dispose des droits nécessaires.
•	Image de couverture facultative.
•	Historique : dates de répétition du chant, activités où il a été utilisé.
•	Recherche par titre, auteur, mot du texte, catégorie, temps liturgique et tag.
•	Favoris et téléchargements offline autorisés selon plan et droits.
•	Statut de maîtrise par pupitre : à découvrir, en cours, maîtrisé, à reprendre.
•	Un chant peut être lié à une ou plusieurs séances de répétition.
MUS-01 [MVP] Le texte du chant doit être stocké de manière structurée et consultable, avec respect des droits de diffusion.
MUS-02 [MVP] Un chant peut exister sans audio, mais une piste audio doit toujours appartenir à un chant.
MUS-03 [MVP] Le responsable musical peut marquer un chant comme « répété » pour une date/activité donnée.
MUS-04 [MVP] Les choristes doivent pouvoir filtrer « chants de mon pupitre à travailler ».
17. Enregistrement des voix par pupitre
Pour chaque chant, la direction musicale peut enregistrer ou téléverser des pistes d’apprentissage. Le choriste écoute prioritairement la piste correspondant à son pupitre tout en lisant le texte.
Type de piste	Exemples
Voix par pupitre	Soprano, Alto, Ténor, Basse
Ensemble	Tous les pupitres
Instrumental	Piano / orgue / accompagnement
Guide	Voix du maestro, indications de travail

•	Enregistrer depuis le téléphone ou téléverser un fichier.
•	Titre de piste, pupitre, version, tonalité facultative, commentaire du maestro.
•	Lecteur audio : lecture/pause, seek, durée, vitesse 0,75x/1x/1,25x/1,5x, répétition.
•	Option « répéter cette section » si l’on ajoute ultérieurement des marqueurs temporels.
•	Afficher simultanément le texte du chant ; mémoriser la dernière position de lecture.
•	Téléchargement temporaire pour écoute offline si autorisé.
•	Historique des versions : une nouvelle piste ne doit pas écraser une ancienne piste référencée.
•	Visibilité : tous, pupitre spécifique, responsables seulement.
•	Statistiques d’écoute agrégées possibles en V2, sans surveillance intrusive.
AUD-01 [MVP] Un choriste Soprano voit par défaut la piste Soprano en premier, sans être empêché d’écouter l’ensemble si la piste est autorisée.
AUD-02 [MVP] Les pistes doivent être servies via URL signée/temporaire ou mécanisme équivalent, pas via URL publique permanente.
AUD-03 [MVP] L’upload doit accepter au minimum AAC/M4A, MP3 et WAV ; le backend peut transcoder vers un format de diffusion standard.
AUD-04 [MVP] Le système doit stocker durée, taille, mime type et checksum du fichier.
AUD-05 [MVP] La suppression d’une piste doit respecter l’audit et les références historiques.
18. Carnets PDF des messes
Le module ne génère pas le carnet : le comité héberge la version PDF finale du carnet de chants de la messe.
•	Le responsable joint un PDF à une messe.
•	Le PDF est lisible directement dans l’application via un lecteur intégré.
•	Le PDF est téléchargeable selon les droits.
•	Un lien public sécurisé et révocable peut être généré pour les fidèles.
•	Le lien peut être partagé via WhatsApp sans obliger le fidèle à installer l’application.
•	Le comité peut remplacer le PDF ; l’historique des versions peut être conservé.
•	Date d’expiration du lien public configurable.
PDF-01 [MVP] Le lien public ne donne accès qu’au carnet concerné, jamais aux espaces privés de la chorale.
PDF-02 [MVP] Le PDF doit être affichable sans téléchargement forcé.
PDF-03 [V2] Le partage doit produire une URL courte/conviviale si un service de liens est activé.
19. Textes de la prochaine messe
•	Le comité crée une fiche liée à une messe : titre liturgique, date, références des lectures, textes, résumé, orientation liturgique, message du maestro.
•	Épingler automatiquement la prochaine messe sur l’accueil.
•	Possibilité de publier/dépublier.
•	Historique des messes passées.
•	Le contenu est géré par le comité ; l’application ne doit pas inventer automatiquement des textes liturgiques dans le MVP.
LIT-01 [MVP] Le responsable doit pouvoir saisir le résumé manuellement.
LIT-02 [MVP] Une fiche non publiée n’est pas visible des choristes.
20. Communiqués et accusés de lecture
•	Créer un communiqué : titre, corps, priorité, audience, pièces jointes, date de publication, expiration.
•	Priorités visuelles : normal, important, urgent.
•	Audience : tous, pupitres, rôles, individus.
•	Notification à la publication.
•	Marquer comme lu ; le comité voit le taux de lecture.
•	Option « accusé de lecture obligatoire ».
COM-01 [MVP] Le système doit enregistrer date/heure de première lecture.
COM-02 [MVP] Un communiqué expiré reste archivable sans encombrer l’accueil.
21. RSVP et disponibilité par pupitre
•	Pour une messe/prestation, le responsable demande : Oui / Non / Incertain.
•	Date limite de réponse.
•	Vue maestro : effectif attendu par pupitre.
•	Alertes de sous-effectif par seuil configurable.
•	Relance automatique des non-répondants.
RSVP-01 [MVP] Un RSVP ne remplace jamais le pointage réel.
RSVP-02 [V2] Le tableau de disponibilité doit distinguer confirmé, non, incertain et sans réponse.
22. Rapports et exports
•	Présence individuelle et globale.
•	Ponctualité.
•	Participation par durée.
•	Rapport par pupitre.
•	Rapport annuel pastoral.
•	Rapport financier.
•	Situation individuelle des cotisations.
•	Liste des activités.
•	Liste des membres.
•	Exports PDF et Excel.
•	Exclusion de membres selon rapport.
RPT-01 [MVP] Tout rapport doit porter période, chorale, date de génération et auteur.
RPT-02 [MVP] Les exports doivent respecter les permissions de l’utilisateur.
23. Abonnements Free / Pro / Premium
Fonction	Free	Pro	Premium
Membres	Limité (ex. 20)	Étendu	Étendu
Calendrier	Oui	Oui	Oui
Présence simple	Oui	Oui	Oui
QR arrivée/sortie	Limité	Oui	Oui
Historique stats	30 jours	Complet	Complet + avancé
Finances	Basique	Complet	Complet + multi-caisses avancé
Bibliothèque musicale	Quota	Oui	Oui + stockage supérieur
Audio pupitres	Quota	Oui	Oui
Carnets PDF	Quota	Oui	Oui
WhatsApp	Non / crédits séparés	Crédits séparés	Crédits séparés/priorité
Rapports	Limités	PDF/Excel	Avancés
Branding	Plateforme	Plateforme	Personnalisation

•	Abonnement porté par la chorale/organisation, pas par chaque choriste.
•	Mensuel et annuel.
•	Tarif annuel recommandé avec remise équivalente à environ deux mois.
•	Quotas de stockage et de WhatsApp configurables dans le back-office.
•	Expiration : période de grâce, lecture seule possible, réactivation.
SUB-01 [MVP] Le backend doit faire respecter les limites du plan ; masquer un bouton côté Flutter ne suffit pas.
SUB-02 [MVP] Les crédits WhatsApp doivent être comptabilisés séparément de l’abonnement.
SUB-03 [V2] Prévoir coupons/promotions administrables.
24. WhatsApp et messagerie transactionnelle
•	Créer une abstraction Provider : Infobip, Meta Cloud API ou autre fournisseur peut être branché sans changer les modules métier.
•	Templates synchronisés/mappés avec les modèles approuvés chez le fournisseur.
•	Variables validées avant envoi.
•	Journal d’envoi et statut fournisseur.
•	Gestion des erreurs et retries.
•	Opt-in/opt-out et consentement.
•	Crédits et coût par message si le modèle économique l’exige.
WA-01 [MVP] Les modules métier demandent « envoyer un message » au service de messagerie ; ils ne doivent pas appeler directement Infobip/Meta.
WA-02 [MVP] Chaque tentative d’envoi possède un identifiant idempotent.
WA-03 [MVP] Ne pas envoyer de relance financière à un membre ayant réglé entre la planification et l’exécution du job.
25. Paiements
•	Le backend expose une abstraction PaymentProvider.
•	Moyens prévus : Mobile Money, banque, carte si fournisseur disponible, cash enregistré.
•	Une transaction comporte référence interne, référence fournisseur, montant, devise, statut.
•	Webhook fournisseur vérifié cryptographiquement.
•	Paiement affecté à une ou plusieurs obligations financières.
•	Reçu numérique.
PAY-01 [MVP] Aucun paiement ne doit être marqué réussi uniquement sur base du retour de l’application mobile ; confirmation backend/webhook obligatoire pour les paiements digitaux.
PAY-02 [MVP] Le système doit être idempotent face aux webhooks dupliqués.
PAY-03 [MVP] Le cash est un enregistrement manuel identifié avec l’utilisateur qui l’a saisi.
26. Fonctionnement hors connexion
•	Flutter conserve localement les activités imminentes, profil et données nécessaires.
•	Mode scan offline réservé aux appareils autorisés.
•	Les scans offline reçoivent timestamp local signé/contexte appareil puis sont synchronisés.
•	Le backend résout les conflits à la synchronisation.
•	Les contenus musicaux/PDF peuvent être mis en cache si autorisés.
OFF-01 [MVP] Afficher clairement l’état offline et le nombre d’éléments à synchroniser.
OFF-02 [MVP] Un scan synchronisé ne doit pas créer un doublon si l’appareil réessaie.
OFF-03 [V2] Le mode offline avancé doit être introduit après stabilisation du MVP online.
27. Sécurité, confidentialité et audit
•	HTTPS obligatoire.
•	Mots de passe hachés par algorithme moderne.
•	Tokens courts + refresh token rotatif.
•	RBAC + vérification tenant.
•	Rate limiting.
•	Journal d’audit pour présences modifiées, finances, rôles, suppressions, changements critiques.
•	Fichiers privés via URLs temporaires.
•	Sauvegardes automatiques et tests de restauration.
•	Principe de moindre privilège.
•	Export/suppression des données selon politique de confidentialité.
SEC-01 [MVP] Aucune clé API WhatsApp, stockage ou paiement dans Flutter ou dans le JavaScript public WordPress.
SEC-02 [MVP] Toutes les actions financières et modifications de présence doivent être auditables.
SEC-03 [MVP] Les logs ne doivent pas contenir de mots de passe, tokens complets ni informations financières sensibles inutiles.
28. Front-end WordPress
WordPress est acceptable pour le front-end web si son rôle est clairement limité. Il est particulièrement adapté au site public, aux pages marketing, à l’aide, aux contenus éditoriaux et à un portail web via plugin sur mesure.
•	Créer un plugin WordPress dédié (ex. choir-platform-portal).
•	Le plugin gère pages/shortcodes/blocs ou une mini SPA intégrée.
•	Les données métier viennent de l’API Node.js.
•	Le plugin peut agir comme BFF (Backend for Frontend) pour éviter d’exposer des secrets et gérer les sessions.
•	WordPress conserve uniquement son contenu CMS et la configuration du portail, pas les soldes ni présences comme source primaire.
•	Le tableau de bord web lourd peut être rendu dans une page WordPress par bundle React/Vue/vanilla selon préférence, toujours connecté au Node backend.
WP-01 [MVP] Interdire la duplication d’une même présence ou transaction financière dans WordPress et PostgreSQL.
WP-02 [MVP] Le portail web doit appliquer les mêmes permissions que Flutter via l’API.
WP-03 [MVP] Si l’interface admin devient trop complexe, conserver WordPress comme shell et développer le portail comme SPA embarquée sans changer le backend.
29. Backend Node.js : modules
Module NestJS proposé	Responsabilité
auth	Login, OTP, tokens, sessions, appareils
users	Comptes plateforme
organizations	Clients, chorales, multi-tenant
memberships	Appartenance, rôles, pupitres
calendar	Années pastorales, activités, récurrences
attendance	QR, scans, présence, durée
justifications	Absences, retards, dispenses
notifications	Templates, push, in-app, scheduling
messaging	WhatsApp/provider abstraction
finance	Caisses, cotisations, paiements, dépenses
music	Chants, textes, tags, maîtrise
media	Audios, PDF, fichiers, stockage
liturgy	Textes/résumés de messe
announcements	Communiqués et lectures
rsvp	Disponibilités
reports	PDF/Excel, agrégations
subscriptions	Plans, quotas, facturation SaaS
audit	Journal d’actions
admin	Back-office plateforme

NODE-01 [MVP] Utiliser TypeScript strict et validation DTO.
NODE-02 [MVP] Séparer controller, application/service, repository/data access et règles métier critiques.
NODE-03 [MVP] Ajouter tests unitaires sur tous les calculateurs : retards, durée, assiduité, finances, quotas.
30. API REST : contrat fonctionnel
Méthode	Endpoint indicatif	Usage
POST	/auth/login	Connexion
POST	/auth/refresh	Renouvellement token
GET	/me	Profil courant
GET	/choirs/{id}/members	Membres
POST	/choirs/{id}/activities	Créer activité
GET	/activities/{id}	Détail activité
POST	/activities/{id}/attendance/qr	Générer QR personnel
POST	/activities/{id}/attendance/scan	Scanner arrivée/sortie
POST	/attendance/{id}/corrections	Correction auditée
GET	/me/statistics	Stats personnelles
GET	/choirs/{id}/statistics	Stats chorale
GET	/choirs/{id}/songs	Bibliothèque
POST	/songs/{id}/tracks	Ajouter piste
GET	/songs/{id}/tracks	Pistes chant
POST	/masses/{id}/songbook	Ajouter PDF
POST	/finance/contributions	Créer cotisation/appel
POST	/finance/payments	Enregistrer paiement
POST	/finance/expenses	Enregistrer dépense
GET	/finance/reports	Rapport financier
POST	/notifications/templates	Créer modèle
POST	/announcements	Publier communiqué

•	Versionnement /api/v1.
•	JSON UTF-8.
•	Pagination cursor ou page/limit uniforme.
•	Erreurs structurées : code, message, details, correlationId.
•	Idempotency-Key pour opérations sensibles.
•	OpenAPI/Swagger généré automatiquement.
31. Modèle de données
Entité	Champs / fonction
User	id, phone, email, password_hash, status, locale
Organization	id, name, type, subscription_id
Choir	id, organization_id, name, timezone, settings
Membership	id, user_id, choir_id, status, joined_at
Role / Permission	RBAC
VoiceSection	id, choir_id, name, order
MemberProfile	membership_id, names, birth_date, photo, section_id
PastoralYear	id, choir_id, start_date, end_date
Activity	id, choir_id, type, starts_at, ends_at, location, recurrence
Attendance	activity_id, membership_id, arrived_at, left_at, status, duration
AttendanceScan	attendance_id, scan_type, scanned_by, device_id, timestamp
Justification	attendance/activity + member, reason, decision
Dispensation	member, period, reason, decision
NotificationTemplate	trigger, channel, body, rules
NotificationJob	recipient, scheduled_at, status
Announcement	title, body, audience, priority
AnnouncementRead	announcement_id, membership_id, read_at
Fund	choir_id, name, currency
ContributionDefinition	fund_id, amount, due_date, recurrence
MemberObligation	member, contribution, amount_due, amount_paid, status
FinancialTransaction	type, amount, currency, date, reference, status
Expense	transaction + category + beneficiary + attachment
Song	choir_id, title, text, author, category, tags, status
SongRehearsal	song_id, activity_id, notes
AudioTrack	song_id, section_id?, type, file_key, duration, version, visibility
MassContent	activity_id, readings, summary, orientation, published
SongbookPdf	activity_id, file_key, version, public_share_token
Rsvp	activity_id, membership_id, response
Subscription	organization_id, plan_id, period, status
AuditLog	actor, action, entity, before, after, timestamp

32. Règles métier critiques
ID	Règle
BR-001	Une présence n’est valide que pour un membre attendu ou explicitement autorisé.
BR-002	Un QR dynamique expire et ne peut pas être réutilisé hors fenêtre.
BR-003	L’heure serveur prévaut pour les scans online.
BR-004	Retard = arrivée après l’heure de référence configurée.
BR-005	Durée de participation calculée uniquement si arrivée et sortie valides.
BR-006	Une dispense peut exclure l’activité du dénominateur d’assiduité.
BR-007	Une correction manuelle exige motif + auteur + audit.
BR-008	Une transaction financière validée ne disparaît jamais sans trace.
BR-009	Les devises restent séparées.
BR-010	Un chant peut avoir plusieurs versions de piste et plusieurs pupitres.
BR-011	Les pistes audio privées ne sont jamais publiquement indexables.
BR-012	Le carnet PDF peut être public via token sécurisé et révocable.
BR-013	Un rappel retard est annulé si le membre arrive avant l’exécution.
BR-014	Un rappel d’impayé revalide le solde au moment de l’envoi.
BR-015	Les quotas d’abonnement sont contrôlés au backend.
BR-016	WordPress ne peut pas contourner les permissions Node.js.

33. UX/UI : écrans attendus
Profil	Écrans clés
Choriste	Accueil, calendrier, activité, QR, mes statistiques, ma caisse, bibliothèque, détail chant + texte + lecteur, carnets PDF, prochaine messe, communiqués, profil.
Contrôleur	Activité en cours, scanner, résultat scan, liste présents/non arrivés, anomalies.
Maestro	Dashboard musical, répétitions, chants, ajout piste, état par pupitre, RSVP.
Trésorier	Dashboard finances, appels, débiteurs, paiement, dépense, caisse, rapports.
Secrétaire/Comité	Membres, activités, présences, justifications, communiqués, rapports.
Admin	Paramètres chorale, rôles, automatisations, abonnement, quotas, intégrations.

•	Mobile-first, actions principales accessibles en 1–2 taps.
•	Dashboard visuel plutôt que tableaux denses.
•	Codes d’état cohérents : succès, avertissement, anomalie, information.
•	Accessibilité : tailles lisibles, contrastes, labels, navigation clavier sur web.
•	Ne jamais dépendre uniquement de la couleur pour exprimer un statut.
•	Écrans audio optimisés pour écoute en répétition : gros contrôles, texte lisible, reprise de lecture.
34. Critères d’acceptation
ID	Critère d’acceptation
AC-ATT-01	Étant donné une répétition à 18h00, lorsqu’un membre scanne à 18h11, alors le système affiche retard de 11 minutes.
AC-ATT-02	Lorsqu’un QR déjà consommé est rescanné, aucune deuxième arrivée n’est créée.
AC-ATT-03	Après scan de sortie, la durée est correcte à la minute près.
AC-NOT-01	Un rappel +10 min n’est pas envoyé à un membre arrivé à +8 min.
AC-FIN-01	Le paiement d’une obligation met à jour immédiatement reste dû et statut.
AC-FIN-02	Une dépense CDF ne modifie pas le solde USD.
AC-MUS-01	Un Soprano ouvre un chant et voit en premier la piste Soprano ainsi que le texte.
AC-MUS-02	La piste continue de jouer lorsque le texte est scrollé.
AC-MUS-03	Le remplacement d’une piste crée une nouvelle version sans casser l’historique.
AC-PDF-01	Un fidèle ouvre un lien carnet et lit uniquement le PDF partagé sans compte.
AC-RBAC-01	Un choriste ne peut pas appeler l’endpoint rapport financier global.
AC-TEN-01	Un token Chorale A utilisé sur un identifiant Chorale B renvoie refus sans fuite de données.

35. Tests
•	Unitaires : calcul retard, durée, assiduité, soldes, quotas, génération de règles.
•	Intégration : PostgreSQL, Redis, stockage, notifications.
•	E2E API : auth, RBAC, tenant isolation, QR, finances, média.
•	Flutter widget/integration tests sur flows critiques.
•	Tests offline/synchronisation.
•	Tests de concurrence : deux scans simultanés.
•	Tests idempotence : webhook paiement, WhatsApp, synchronisation.
•	Sécurité : accès horizontal inter-tenant, brute-force, rate-limit, fichier privé.
•	Charge : pics au début d’une répétition lorsque plusieurs personnes scannent en quelques minutes.
36. Roadmap d’implémentation
Sprint/lot	Livrables
Lot 0 – Fondation	Repo, CI/CD, Docker, Node/Nest, PostgreSQL, Redis, Flutter shell, environnement, auth de base.
Lot 1 – Multi-tenant & membres	Organisations, chorales, membership, rôles, pupitres, profils.
Lot 2 – Calendrier	Année pastorale, activités, récurrence, accueil mobile.
Lot 3 – Présence QR	QR dynamique, scanner, arrivée/sortie, calculs, historique, audit.
Lot 4 – Notifications	FCM, in-app, modèles, scheduler, retard.
Lot 5 – Statistiques	Individuelles, globales, filtres, exports initiaux.
Lot 6 – Finances	Fonds, cotisations, obligations, cash, dépenses, dashboard.
Lot 7 – Musique	Chants, texte, recherche, répétitions, pistes audio par pupitre, lecteur Flutter.
Lot 8 – Messe & contenu	Carnet PDF, lecture/partage, textes de messe, communiqués.
Lot 9 – WordPress	Site + plugin portail consommant API Node.
Lot 10 – V2	WhatsApp, paiements digitaux, RSVP, dispenses avancées, offline enrichi.

37. Instructions de réalisation pour Codex
•	Ne pas implémenter tous les modules en une seule fois. Travailler lot par lot.
•	Avant chaque lot, proposer le schéma des entités, endpoints, règles et tests.
•	Ne jamais inventer une règle métier si ce cahier est explicite ; en cas de vide, choisir l’option la plus simple et documenter l’hypothèse.
•	Maintenir OpenAPI à jour.
•	Écrire migrations reproductibles.
•	Écrire tests avant de déclarer un lot terminé.
•	Créer seed de démonstration : Chœur Saint Jean Bosco, pupitres SATB, quelques membres et activités.
•	Mettre toutes les intégrations externes derrière des interfaces/providers.
•	Utiliser variables d’environnement pour secrets.
•	Prévoir Docker Compose local : api, postgres, redis, stockage local compatible S3 si nécessaire.
•	Éviter les dépendances non maintenues.
•	Prioriser une version LTS de Node.js en production.
•	Flutter : architecture par features, couche data/domain/presentation, gestion d’état cohérente, stockage local sécurisé pour tokens.
•	WordPress : plugin séparé du thème, aucune logique financière ou de présence critique dans le thème.
Prompt de départ recommandé à donner à Codex
Tu es chargé d’implémenter la plateforme SaaS de gestion de chorale liturgique décrite dans ce cahier. Commence uniquement par le Lot 0 puis le Lot 1. Utilise Node.js LTS + TypeScript + NestJS, PostgreSQL, Redis et Docker. L’architecture est multi-tenant. Prépare d’abord : 1) structure du monorepo, 2) modèle de données, 3) migrations, 4) modules NestJS, 5) endpoints OpenAPI, 6) tests unitaires et E2E, 7) seed CSJB. Ne commence pas le module suivant tant que les tests du lot courant ne passent pas. Le backend est la source de vérité ; Flutter et WordPress ne contiennent pas les règles métier critiques.
38. Références techniques
•	Node.js – documentation officielle des versions et du statut LTS (consultée le 12 août 2026).
•	WordPress Developer Resources – REST API Handbook et authentification (consultés le 12 août 2026).
•	Flutter – documentation officielle des plateformes supportées et du déploiement iOS (consultée le 12 août 2026).
•	Firebase – Cloud Messaging pour Flutter (consulté le 12 août 2026).
•	Charte graphique Gloet IT – palette et principes visuels internes.
Fin du cahier fonctionnel – Version 1.0
