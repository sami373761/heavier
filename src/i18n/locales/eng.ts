/**
 * English is the reference locale: its keys define the `Translation` type that
 * every other locale must satisfy, so a missing key is a compile error.
 */
export const eng = {
  'app.name': 'Heavier',
  'app.tagline': 'Trust your gut. Guess the heavier one.',

  /* The `<meta name="description">` and the OpenGraph/Twitter card copy,
     rewritten by `applyDocumentHead` whenever the language changes. */
  'meta.description':
    'Two objects, one question: which one is heavier? Guess your way through eight rounds.',

  'settings.language': 'Language',
  'settings.unit': 'Units',
  'a11y.languageSelect': 'Select language',
  'a11y.unitSelect': 'Select weight unit',

  'home.lead': 'Two objects. One question.',
  'home.headline': 'Which one is heavier?',
  'home.rule':
    'Eight rounds, always a close call — the heavier object is never more than about 54% heavier than the lighter one.',
  'home.start': 'Start game',
  'home.categories': 'What you’ll be weighing',
  'home.categoryCount': '{count} objects',
  'home.guessStart': 'Guess the Weight',
  'home.guessRule':
    'One object at a time — estimate its weight and see how close you get. Eight rounds, then your overall accuracy.',

  'game.round': 'Round',
  'game.prompt': 'Which one is heavier?',
  'game.choose': 'Choose {name}',
  'game.next': 'Next round',
  'game.finish': 'See your score',
  'game.heavier': 'Heavier',
  'game.correct': 'Correct',
  'game.wrong': 'Not quite',
  'game.yourPick': 'Your pick',
  'game.score': 'Score',

  'guess.prompt': 'How much do you think this weighs?',
  'guess.inputLabel': 'Your guess',
  'guess.a11yInput': 'Enter your estimated weight',
  'guess.submit': 'Submit guess',
  'guess.next': 'Next round',
  'guess.finish': 'See your results',
  'guess.yourGuess': 'Your guess',
  'guess.actualWeight': 'Actual weight',
  'guess.percentOff': '{percent} off',
  'guess.tier.perfect': 'Perfect',
  'guess.tier.veryGood': 'Very Good',
  'guess.tier.good': 'Good',
  'guess.tier.close': 'Close',
  'guess.tier.far': 'Far',
  'guess.exact.bullseye': 'Bullseye!',
  'guess.exact.spotOn': 'Spot On!',

  'score.eyebrow': 'Game complete',
  'score.correctOf': '{correct} of {total} correct',
  'score.headline.perfect': 'Flawless.',
  'score.headline.great': 'Sharp instincts.',
  'score.headline.good': 'Not bad at all.',
  'score.headline.low': 'Weights are tricky.',
  'score.playAgain': 'Play again',
  'score.home': 'Back to start',
  'score.share': 'Share result',
  'score.shareCopied': 'Copied to clipboard',

  'guessScore.eyebrow': 'Guess the Weight — complete',
  'guessScore.accuracyLabel': 'Overall accuracy',
  'guessScore.playAgain': 'Play again',
  'guessScore.home': 'Back to start',

  'dispute.open': 'Wrong weight?',
  'dispute.step1': 'Which weight looks off?',
  'dispute.step2': '{name} should be',
  'dispute.heavier': 'Heavier',
  'dispute.lighter': 'Lighter',
  'dispute.thanks': 'Thanks — we’ll take a look.',
  'dispute.close': 'Close',
  'dispute.back': 'Back',

  'error.title': 'Something went wrong',
  'error.noData': 'The object data could not be loaded.',
  'error.noPairs': 'No comparable object pairs could be found in the data.',
  'error.notEnoughPairs':
    'There aren’t enough comparable object pairs to build a full game yet.',
  'error.retry': 'Try again',
  'error.missingImage': 'Image unavailable',
  'guessError.notEnoughObjects':
    'There aren’t enough objects in the data to build a full round yet.',

  'category.animals': 'Animals',
  'category.foods': 'Foods',
  'category.stuff': 'Objects',
  'category.vehicles': 'Vehicles',

  'faq.title': 'Frequently asked questions',

  'faq.q1': 'How does the game work?',
  'faq.a1':
    'Every game is eight rounds long. Each round puts two objects side by side, and you pick the one you think is heavier — there is no timer, so take as long as you like. The moment you choose, both real weights are revealed, so you can see how close you were before moving on to the next round.',

  'faq.q2': 'How are the weights determined?',
  'faq.a2':
    'Every weight was researched with four different AI engines, each asked about the same object independently. Their answers were then compared side by side, averaged, and rounded to a clean value. That average is what the game uses, so each object is measured by the same yardstick rather than by whichever source happened to be consulted.',

  'faq.q3': 'Are the weights exact?',
  'faq.a3':
    'No — and they are not meant to be. Each value is a typical reference weight for that kind of object, because a real one varies with its size, breed, age, model, or how full it happens to be. Two dogs of the same breed can differ by several kilos. The numbers are accurate enough to make the comparison fair, not to certify one particular individual.',

  'faq.q4': 'Why are some objects compared with each other?',
  'faq.a4':
    'Because a close call makes a better question. The game only pairs objects whose weights are within about 54% of each other, so you will never be asked whether a feather beats a truck. That rule ignores categories on purpose — an animal against a vehicle is a perfectly good question as long as the two weigh something similar.',

  'faq.q5': 'What units can I use?',
  'faq.a5':
    'The switch in the header moves the whole game between kilograms and pounds, and your choice is remembered for next time. The conversion uses a deliberately clean 1 kg = 2.2 lbs. Below one kilogram, weights are shown in grams instead, so a cherry reads as 10 g rather than 0.01 kg. The unit is display only — it never changes which object is actually heavier.',

  'faq.q6': 'How is my score calculated?',
  'faq.a6':
    'Each correct answer is worth one point, out of eight. When the last round is over you will see how many you got right, and the same result again as a percentage. No round counts for more than another and a wrong answer costs you nothing extra: a hard question is worth exactly as much as an easy one.',

  'faq.q7': 'Can I challenge an object’s weight?',
  'faq.a7':
    'Yes, and please do. Once an answer is revealed, the “Wrong weight?” control lets you pick the object that looks off and say whether you think it should be heavier or lighter. Because the values are researched averages, they will not all be perfect, and reports like yours are exactly what lets us review, update and improve the data. If something looks wrong to you, it is worth telling us.',

  'faq.q8': 'How often do the questions change?',
  'faq.a8':
    'Every game builds a fresh set of eight questions the moment you start it. The pairs are drawn at random from the whole object list, so two games in a row rarely look alike. There is no daily set to wait for and no fixed order to memorise.',

  'faq.q9': 'Can I play again?',
  'faq.a9':
    'As often as you like. At the end of a game, “Play again” immediately starts a new one with a new set of eight questions, and the wordmark at the top brings you back to the start at any point. Nothing is locked, and there are no limits, lives or waiting.',

  'faq.q10': 'What is Buy Me a Coffee?',
  'faq.a10':
    'It is a small and entirely optional way to support the project. Heavier is free, with no ads and no accounts, so if you have enjoyed it and would like to help it keep growing, a coffee is a kind way to do that. Giving nothing changes nothing — the game stays exactly the same either way.',

  'footer.coffee': 'Buy me a coffee',

  /* The bento grid below the categories. The FAQ card's sentence is split so
     the accented phrase can sit wherever a language puts it. */
  'bento.feature.line1': 'Under Construction',
  'bento.feature.line2': 'Coming Soon',
  'bento.contact.line1': 'Contact Us',
  'bento.contact.line2': 'Star Games',
  'bento.coffee.title': 'Buy Me a Coffee',
  'bento.coffee.body': 'Heavier is free, with no ads and no accounts. A coffee keeps it growing.',
  'bento.faq.before': 'Click here to view ',
  'bento.faq.accent': 'frequently asked questions',
  'bento.faq.after': '',
} as const

export type TranslationKey = keyof typeof eng
export type Translation = Record<TranslationKey, string>
