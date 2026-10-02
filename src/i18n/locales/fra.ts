import type { Translation } from './eng'

export const fra: Translation = {
  'app.name': 'Heavier',
  'app.tagline': 'Fie-toi à ton instinct. Devine le plus lourd.',

  'meta.description':
    'Deux objets, une question : lequel est le plus lourd ? Huit manches pour le deviner.',

  'settings.language': 'Langue',
  'settings.unit': 'Unités',
  'a11y.languageSelect': 'Choisir la langue',
  'a11y.unitSelect': 'Choisir l’unité de poids',

  'home.lead': 'Deux objets. Une question.',
  'home.headline': 'Lequel est le plus lourd ?',
  'home.rule':
    'Huit manches, toujours serrées : l’objet le plus lourd ne dépasse jamais le plus léger de plus de 54 % environ.',
  'home.start': 'Commencer la partie',
  'home.categories': 'Ce que tu vas peser',
  'home.categoryCount': '{count} objets',
  'home.guessStart': 'Devine le Poids',
  'home.guessRule':
    'Un objet à la fois : estime son poids et découvre à quel point tu étais proche. Huit manches, puis ta précision globale.',

  'game.round': 'Manche',
  'game.prompt': 'Lequel est le plus lourd ?',
  'game.choose': 'Choisir {name}',
  'game.next': 'Manche suivante',
  'game.finish': 'Voir ton score',
  'game.heavier': 'Plus lourd',
  'game.correct': 'Correct',
  'game.wrong': 'Raté',
  'game.yourPick': 'Ton choix',
  'game.score': 'Score',

  'guess.prompt': 'Combien penses-tu que ça pèse ?',
  'guess.inputLabel': 'Ton estimation',
  'guess.a11yInput': 'Saisis ton poids estimé',
  'guess.submit': 'Valider l’estimation',
  'guess.next': 'Manche suivante',
  'guess.finish': 'Voir tes résultats',
  'guess.yourGuess': 'Ton estimation',
  'guess.actualWeight': 'Poids réel',
  'guess.percentOff': '{percent} d’écart',
  'guess.tier.perfect': 'Parfait',
  'guess.tier.veryGood': 'Très bien',
  'guess.tier.good': 'Bien',
  'guess.tier.close': 'Proche',
  'guess.tier.far': 'Loin',
  'guess.exact.bullseye': 'Dans le mille !',
  'guess.exact.spotOn': 'Pile poil !',

  'score.eyebrow': 'Partie terminée',
  'score.correctOf': '{correct} sur {total} correctes',
  'score.headline.perfect': 'Sans faute.',
  'score.headline.great': 'Bel instinct.',
  'score.headline.good': 'Pas mal du tout.',
  'score.headline.low': 'Les poids sont trompeurs.',
  'score.playAgain': 'Rejouer',
  'score.home': 'Retour à l’accueil',
  'score.share': 'Partager le résultat',
  'score.shareCopied': 'Copié dans le presse-papiers',

  'guessScore.eyebrow': 'Devine le Poids — terminé',
  'guessScore.accuracyLabel': 'Précision globale',
  'guessScore.playAgain': 'Rejouer',
  'guessScore.home': 'Retour à l’accueil',

  'dispute.open': 'Poids incorrect ?',
  'dispute.step1': 'Quel poids te semble faux ?',
  'dispute.step2': '{name} devrait être',
  'dispute.heavier': 'Plus lourd',
  'dispute.lighter': 'Plus léger',
  'dispute.thanks': 'Merci, on va vérifier.',
  'dispute.close': 'Fermer',
  'dispute.back': 'Retour',

  'error.title': 'Un problème est survenu',
  'error.noData': 'Les données des objets n’ont pas pu être chargées.',
  'error.noPairs': 'Aucune paire d’objets comparable n’a été trouvée dans les données.',
  'error.notEnoughPairs':
    'Il n’y a pas encore assez de paires d’objets comparables pour créer une partie complète.',
  'error.retry': 'Réessayer',
  'error.missingImage': 'Image indisponible',
  'guessError.notEnoughObjects':
    'Il n’y a pas encore assez d’objets dans les données pour créer une manche complète.',

  'category.animals': 'Animaux',
  'category.foods': 'Aliments',
  'category.stuff': 'Objets',
  'category.vehicles': 'Véhicules',

  'faq.title': 'Questions fréquentes',

  'faq.q1': 'Comment fonctionne le jeu ?',
  'faq.a1':
    'Chaque partie compte huit manches. À chaque manche, deux objets s’affichent côte à côte et tu choisis celui que tu penses le plus lourd ; il n’y a pas de chronomètre, prends donc tout le temps qu’il te faut. Dès que tu as choisi, les deux poids réels sont révélés : tu vois à quel point tu étais proche avant de passer à la manche suivante.',

  'faq.q2': 'Comment les poids sont-ils déterminés ?',
  'faq.a2':
    'Chaque poids a été recherché à l’aide de quatre moteurs d’IA différents, interrogés séparément sur le même objet. Leurs réponses ont ensuite été comparées, moyennées, puis arrondies à une valeur simple. C’est cette moyenne que le jeu utilise, afin que tous les objets soient mesurés à la même aune plutôt qu’au gré de la source consultée.',

  'faq.q3': 'Les poids sont-ils exacts ?',
  'faq.a3':
    'Non, et ce n’est pas leur but. Chaque valeur est un poids de référence typique pour ce type d’objet, car un exemplaire réel varie selon sa taille, sa race, son âge, son modèle ou son niveau de remplissage. Deux chiens de la même race peuvent différer de plusieurs kilos. Les chiffres sont assez justes pour rendre la comparaison honnête, pas pour certifier un individu précis.',

  'faq.q4': 'Pourquoi certains objets sont-ils comparés entre eux ?',
  'faq.a4':
    'Parce qu’un écart serré fait une meilleure question. Le jeu n’associe que des objets dont les poids ne s’écartent que d’environ 54 % au maximum : on ne te demandera jamais si une plume l’emporte sur un camion. Cette règle ignore volontairement les catégories — un animal face à un véhicule est une très bonne question tant que les deux pèsent à peu près pareil.',

  'faq.q5': 'Quelles unités puis-je utiliser ?',
  'faq.a5':
    'Le sélecteur en haut de page fait basculer tout le jeu entre kilogrammes et livres, et ton choix est mémorisé pour la prochaine fois. La conversion utilise un 1 kg = 2,2 lb volontairement arrondi. En dessous d’un kilo, les poids s’affichent en grammes : une cerise se lit donc 10 g et non 0,01 kg. L’unité relève de l’affichage seul — elle ne change jamais lequel des deux objets est réellement le plus lourd.',

  'faq.q6': 'Comment mon score est-il calculé ?',
  'faq.a6':
    'Chaque bonne réponse vaut un point, sur huit au total. À la fin de la dernière manche, tu vois le nombre de bonnes réponses, puis ce même résultat en pourcentage. Aucune manche ne compte plus qu’une autre et une erreur ne coûte rien de plus : une question difficile vaut exactement autant qu’une question facile.',

  'faq.q7': 'Puis-je contester le poids d’un objet ?',
  'faq.a7':
    'Oui, et n’hésite pas. Une fois la réponse révélée, le bouton « Poids incorrect ? » te permet de désigner l’objet qui te semble faux et d’indiquer s’il devrait selon toi être plus lourd ou plus léger. Comme les valeurs sont des moyennes issues de recherches, elles ne seront pas toutes parfaites, et ce sont précisément des signalements comme le tien qui nous permettent de vérifier, mettre à jour et améliorer les données. Si quelque chose te paraît douteux, cela vaut la peine de nous le dire.',

  'faq.q8': 'À quelle fréquence les questions changent-elles ?',
  'faq.a8':
    'Chaque partie génère une nouvelle série de huit questions au moment où tu la lances. Les paires sont tirées au hasard dans l’ensemble des objets : deux parties d’affilée se ressemblent donc rarement. Il n’y a pas de série quotidienne à attendre ni d’ordre fixe à mémoriser.',

  'faq.q9': 'Puis-je rejouer ?',
  'faq.a9':
    'Autant de fois que tu veux. À la fin d’une partie, « Rejouer » en lance aussitôt une nouvelle avec huit questions inédites, et la marque en haut de page te ramène à l’accueil à tout moment. Rien n’est verrouillé : ni limite, ni vies, ni attente.',

  'faq.q10': 'Qu’est-ce que Buy Me a Coffee ?',
  'faq.a10':
    'C’est une façon simple et entièrement facultative de soutenir le projet. Heavier est gratuit, sans publicité et sans compte ; si tu l’as apprécié et que tu veux l’aider à grandir, offrir un café est un geste sympathique. Ne rien donner ne change rien : le jeu reste exactement le même dans les deux cas.',

  'footer.coffee': 'Offre-moi un café',

  'bento.feature.line1': 'En construction',
  'bento.feature.line2': 'Bientôt disponible',
  'bento.contact.line1': 'Nous contacter',
  'bento.contact.line2': 'Star Games',
  'bento.coffee.title': 'Offre-moi un café',
  'bento.coffee.body':
    'Heavier est gratuit, sans publicité ni compte. Un café l’aide à grandir.',
  'bento.faq.before': 'Cliquez ici pour voir les ',
  'bento.faq.accent': 'questions fréquentes',
  'bento.faq.after': '',

}
