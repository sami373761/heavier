import type { Translation } from './eng'

export const deu: Translation = {
  'app.name': 'Heavier',
  'app.tagline': 'Vertrau deinem Bauchgefühl. Rate das Schwerere.',

  'meta.description':
    'Zwei Objekte, eine Frage: Was ist schwerer? Acht Runden, um es zu erraten.',

  'settings.language': 'Sprache',
  'settings.unit': 'Einheiten',
  'a11y.languageSelect': 'Sprache wählen',
  'a11y.unitSelect': 'Gewichtseinheit wählen',

  'home.lead': 'Zwei Objekte. Eine Frage.',
  'home.headline': 'Was ist schwerer?',
  'home.rule':
    'Acht Runden, immer knapp: das schwerere Objekt ist nie mehr als etwa 54 % schwerer als das leichtere.',
  'home.start': 'Spiel starten',
  'home.categories': 'Was du wiegen wirst',
  'home.categoryCount': '{count} Objekte',
  'home.guessStart': 'Gewicht Schätzen',
  'home.guessRule':
    'Ein Objekt nach dem anderen: schätze sein Gewicht und sieh, wie nah du dran warst. Acht Runden, dann deine Gesamtgenauigkeit.',

  'game.round': 'Runde',
  'game.prompt': 'Was ist schwerer?',
  'game.choose': '{name} wählen',
  'game.next': 'Nächste Runde',
  'game.finish': 'Ergebnis ansehen',
  'game.heavier': 'Schwerer',
  'game.correct': 'Richtig',
  'game.wrong': 'Knapp daneben',
  'game.yourPick': 'Deine Wahl',
  'game.score': 'Punkte',

  'guess.prompt': 'Wie schwer, denkst du, ist das hier?',
  'guess.inputLabel': 'Deine Schätzung',
  'guess.a11yInput': 'Gib dein geschätztes Gewicht ein',
  'guess.submit': 'Schätzung abschicken',
  'guess.next': 'Nächste Runde',
  'guess.finish': 'Ergebnis ansehen',
  'guess.yourGuess': 'Deine Schätzung',
  'guess.actualWeight': 'Tatsächliches Gewicht',
  'guess.percentOff': '{percent} Abweichung',
  'guess.tier.perfect': 'Perfekt',
  'guess.tier.veryGood': 'Sehr gut',
  'guess.tier.good': 'Gut',
  'guess.tier.close': 'Nah dran',
  'guess.tier.far': 'Weit weg',
  'guess.exact.bullseye': 'Volltreffer!',
  'guess.exact.spotOn': 'Genau richtig!',

  'score.eyebrow': 'Spiel beendet',
  'score.correctOf': '{correct} von {total} richtig',
  'score.headline.perfect': 'Makellos.',
  'score.headline.great': 'Gutes Gespür.',
  'score.headline.good': 'Gar nicht schlecht.',
  'score.headline.low': 'Gewichte täuschen.',
  'score.playAgain': 'Nochmal spielen',
  'score.home': 'Zurück zum Start',
  'score.share': 'Ergebnis teilen',
  'score.shareCopied': 'In die Zwischenablage kopiert',

  'guessScore.eyebrow': 'Gewicht Schätzen — beendet',
  'guessScore.accuracyLabel': 'Gesamtgenauigkeit',
  'guessScore.playAgain': 'Nochmal spielen',
  'guessScore.home': 'Zurück zum Start',

  'dispute.open': 'Gewicht falsch?',
  'dispute.step1': 'Welches Gewicht stimmt nicht?',
  'dispute.step2': '{name} sollte sein',
  'dispute.heavier': 'Schwerer',
  'dispute.lighter': 'Leichter',
  'dispute.thanks': 'Danke — wir schauen es uns an.',
  'dispute.close': 'Schließen',
  'dispute.back': 'Zurück',

  'error.title': 'Etwas ist schiefgelaufen',
  'error.noData': 'Die Objektdaten konnten nicht geladen werden.',
  'error.noPairs': 'In den Daten wurden keine vergleichbaren Objektpaare gefunden.',
  'error.notEnoughPairs':
    'Es gibt noch nicht genug vergleichbare Objektpaare für ein komplettes Spiel.',
  'error.retry': 'Erneut versuchen',
  'error.missingImage': 'Bild nicht verfügbar',
  'guessError.notEnoughObjects':
    'Es gibt noch nicht genug Objekte in den Daten für eine komplette Runde.',

  'category.animals': 'Tiere',
  'category.foods': 'Lebensmittel',
  'category.stuff': 'Gegenstände',
  'category.vehicles': 'Fahrzeuge',

  'faq.title': 'Häufige Fragen',

  'faq.q1': 'Wie funktioniert das Spiel?',
  'faq.a1':
    'Jedes Spiel besteht aus acht Runden. In jeder Runde stehen zwei Objekte nebeneinander und du wählst das, was du für schwerer hältst — eine Zeitbegrenzung gibt es nicht, überlege also so lange du magst. Sobald du gewählt hast, werden beide tatsächlichen Gewichte aufgedeckt, und du siehst vor der nächsten Runde, wie nah du dran warst.',

  'faq.q2': 'Wie werden die Gewichte ermittelt?',
  'faq.a2':
    'Jedes Gewicht wurde mit vier verschiedenen KI-Engines recherchiert, die unabhängig voneinander zum selben Objekt befragt wurden. Ihre Angaben wurden anschließend verglichen, gemittelt und auf einen glatten Wert gerundet. Diesen Mittelwert verwendet das Spiel, damit alle Objekte nach demselben Maßstab bewertet werden und nicht danach, welche Quelle gerade zur Hand war.',

  'faq.q3': 'Sind die Gewichte exakt?',
  'faq.a3':
    'Nein — und das sollen sie auch nicht sein. Jeder Wert ist ein typisches Referenzgewicht für diese Art von Objekt, denn ein echtes Exemplar schwankt je nach Größe, Rasse, Alter, Modell oder Füllstand. Zwei Hunde derselben Rasse können sich um mehrere Kilo unterscheiden. Die Zahlen sind genau genug für einen fairen Vergleich, aber nicht dafür, ein bestimmtes Exemplar zu belegen.',

  'faq.q4': 'Warum werden bestimmte Objekte miteinander verglichen?',
  'faq.a4':
    'Weil ein knappes Rennen die bessere Frage ergibt. Das Spiel paart nur Objekte, deren Gewichte höchstens rund 54 % auseinanderliegen — du wirst also nie gefragt, ob eine Feder schwerer ist als ein Lastwagen. Diese Regel ignoriert Kategorien bewusst: Ein Tier gegen ein Fahrzeug ist eine völlig gute Frage, solange beide ähnlich viel wiegen.',

  'faq.q5': 'Welche Einheiten kann ich verwenden?',
  'faq.a5':
    'Der Umschalter in der Kopfzeile stellt das gesamte Spiel zwischen Kilogramm und Pfund um, und deine Wahl wird für den nächsten Besuch gespeichert. Umgerechnet wird mit bewusst glatten 1 kg = 2,2 lb. Unter einem Kilogramm werden Gewichte in Gramm angezeigt, eine Kirsche steht also mit 10 g statt 0,01 kg da. Die Einheit betrifft nur die Anzeige — daran, welches Objekt tatsächlich schwerer ist, ändert sie nie etwas.',

  'faq.q6': 'Wie wird meine Punktzahl berechnet?',
  'faq.a6':
    'Jede richtige Antwort zählt einen Punkt, bei acht Fragen insgesamt. Nach der letzten Runde siehst du, wie viele du richtig hattest, und dasselbe Ergebnis noch einmal als Prozentwert. Keine Runde zählt mehr als eine andere, und eine falsche Antwort kostet nichts extra: Eine schwere Frage ist genauso viel wert wie eine leichte.',

  'faq.q7': 'Kann ich das Gewicht eines Objekts anzweifeln?',
  'faq.a7':
    'Ja, sehr gern. Sobald eine Antwort aufgedeckt ist, kannst du über „Gewicht falsch?“ das Objekt auswählen, das dir seltsam vorkommt, und angeben, ob es deiner Meinung nach schwerer oder leichter sein müsste. Da die Werte recherchierte Durchschnitte sind, werden nicht alle perfekt sein — und genau solche Hinweise erlauben es uns, die Daten zu prüfen, zu aktualisieren und zu verbessern. Wenn dir etwas falsch vorkommt, sag es uns ruhig.',

  'faq.q8': 'Wie oft ändern sich die Fragen?',
  'faq.a8':
    'Jedes Spiel stellt in dem Moment, in dem du es startest, acht Fragen völlig neu zusammen. Die Paare werden zufällig aus der gesamten Objektliste gezogen, zwei Spiele hintereinander gleichen sich daher nur selten. Es gibt kein tägliches Set, auf das man warten müsste, und keine feste Reihenfolge zum Auswendiglernen.',

  'faq.q9': 'Kann ich noch einmal spielen?',
  'faq.a9':
    'So oft du willst. Am Ende eines Spiels startet „Nochmal spielen“ sofort ein neues mit acht frischen Fragen, und die Wortmarke oben bringt dich jederzeit zurück zum Anfang. Nichts ist gesperrt — keine Limits, keine Leben, keine Wartezeit.',

  'faq.q10': 'Was ist Buy Me a Coffee?',
  'faq.a10':
    'Das ist eine kleine, völlig freiwillige Möglichkeit, das Projekt zu unterstützen. Heavier ist kostenlos, ohne Werbung und ohne Konten; wenn es dir Spaß gemacht hat und du beim Weiterbauen helfen möchtest, ist ein Kaffee eine nette Geste. Nichts zu geben ändert nichts — das Spiel bleibt in beiden Fällen exakt dasselbe.',

  'footer.coffee': 'Spendier mir einen Kaffee',

  'bento.feature.line1': 'Im Aufbau',
  'bento.feature.line2': 'Demnächst',
  'bento.contact.line1': 'Kontakt',
  'bento.contact.line2': 'Star Games',
  'bento.coffee.title': 'Spendier mir einen Kaffee',
  'bento.coffee.body':
    'Heavier ist kostenlos, ohne Werbung und ohne Konto. Ein Kaffee hilft beim Wachsen.',
  'bento.faq.before': 'Hier klicken für die ',
  'bento.faq.accent': 'häufig gestellten Fragen',
  'bento.faq.after': '',

}
