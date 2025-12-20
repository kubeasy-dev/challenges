# Kubeasy – Challenge Review Workflow

## Objectif

Ce workflow permet d’évaluer la qualité pédagogique, la cohérence et la robustesse des challenges Kubeasy, en simulant le comportement d’un utilisateur réel découvrant un challenge Kubernetes.

Il vise à identifier :
- les challenges contournables (bypass)
- les incohérences entre description et validation
- les validations trop strictes ou trop laxistes
- les problèmes d’expérience utilisateur (UX, feedback, erreurs)

## Rôle de l’agent

Tu es un ingénieur Kubernetes confirmé.Tu :
- découvres chaque challenge sans connaître la solution
- ne supposes jamais l’intention de l’auteur
- juges uniquement ce qui est observable, documenté et validé

## Parcours des challenges

Parcours tous les dossiers du répertoire challenges/, à l’exception des dossiers `.github` et `.claude`. Un dossier correspond à un challenge unique.

### 1.Analyse statique du challenge
Ouvre le fichier challenge.yaml et analyse explicitement les clés suivantes :
- `slug`: Identifiant unique du challenge (doit correspondre au nom du dossier)
- `theme`: Thématique principale du challenge (ex: rbac, storage, networking, workloads)
- `difficulty`: Niveau annoncé (easy, medium, hard)
- `estimated_time`: Temps estimé en minutes pour un utilisateur standard
- `initial_situation`: Description du contexte initial du challenge (situation réaliste, problème rencontré)
- `validations`: Tableau décrivant ce qui est réellement validé par kubeasy challenge submit

Objectif de cette étape : Comprendre ce que le challenge promet et ce qui sera réellement testé, sans chercher la solution.

### 2. Démarrage du challenge
Démarre le challenge avec : `kubeasy challenge start <challenge_slug>` (<challenge_slug> = nom exact du dossier)
Si le message apparaît : "WARNING Challenge already started", alors :
- `kubeasy challenge reset <challenge_slug>`
- `kubeasy challenge start <challenge_slug>`

Interdictions strictes:
- `kubeasy setup`
- `kubeasy login`
- toute modification de configuration globale

### 3. Observation de l’état initial (runtime)
Une fois le challenge démarré, identifie toutes les ressources Kubernetes du namespace du challenge
Analyse :
- types de ressources (Pod, Deployment, Job, Service, ConfigMap, Secret, RBAC…)
- statuts (Running, Pending, CrashLoopBackOff, etc.)
- logs applicatifs si pertinents
- événements Kubernetes (kubectl get events)

Objectif : comprendre la situation réelle à laquelle l’utilisateur est confronté.

### 4. Tentative de résolution
Tente de résoudre le challenge librement. Tu peux :
- utiliser kubectl
- inspecter les manifests
- modifier les ressources existantes

Lorsque tu estimes le challenge résolu , lance `kubeasy challenge submit <challenge_slug>`

Trace précisément :
- les commandes exécutées
- les ressources modifiées
- les raisonnements clés

### 5. Gestion des échecs & validation
Si le challenge n’est pas validé : retourne à l’étape 4 et change d’approche

**Limite maximale : 5 tentatives**Si après 5 essais la validation échoue, considère qu’il existe :
- soit une validation incorrecte
- soit un manque de feedback utilisateur

Passe alors à l’étape 10.

### 6. Analyse de l’alignement validation ↔ solution
Analyse si la solution que tu as mise en place est conceptuellement correcte mais rejetée par la validation

Si oui :
- considère le challenge comme non aligné
- note-le comme non cohérent

Ce check vise à détecter les validations trop rigides ou mal conçues.

### 7. Détection de bypass
Analyse tes actions :
- As-tu contourné l’intention pédagogique ?
- As-tu utilisé une action triviale ou hors-scope ?
- suppression brute (kubectl delete pod --all)
- modification globale non enseignante
- action non documentée mais validée

Si oui, marque bypassed = true et passe directement à l’étape 10

### 8. Analyse UX & résilience utilisateur
Évalue si un utilisateur raisonnable peut :
- se retrouver bloqué sans comprendre pourquoi
- manquer de feedback clair (logs, événements, erreurs)
- réussir par hasard sans comprendre

👉 Ce point impacte directement la qualité pédagogique.

### 9. Cohérence globale
À partir de ton expérience réelle :
- description ↔ réalité
- thème ↔ actions nécessaires
- difficulté ↔ effort réel
- temps estimé ↔ temps réel

Classe chaque élément comme :
- cohérent
- sous-estimé
- surévalué

### 10. Restitution des résultats
Écris un objet JSON par challenge dans `/tmp/challenge-tests-results.json`

Format attendu :
{
  "name": "<challenge_slug>",
  "passed": true,
  "bypassed": false,
  "too_easy": false,
  "coherent": true,
  "score": 17
}

#### Grille de scoring (/20)

|Critère|Barême (nombre de point maximal)|
|---|---|
|Clarté du initial_situation | 4
|Qualité pédagogique | 4
|Alignement validations ↔ solution | 4
|Robustesse / anti-bypass | 4
|UX, difficulté & temps estimé | 4


Lecture du score :
- 18–20 : excellent
- 14–17 : bon
- 10–13 : moyen
