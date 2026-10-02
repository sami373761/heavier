import type { Translation } from './eng'

export const esp: Translation = {
  'app.name': 'Heavier',
  'app.tagline': 'Fíate de tu instinto. Adivina cuál pesa más.',

  'meta.description':
    'Dos objetos, una pregunta: ¿cuál pesa más? Ocho rondas para adivinarlo.',

  'settings.language': 'Idioma',
  'settings.unit': 'Unidades',
  'a11y.languageSelect': 'Seleccionar idioma',
  'a11y.unitSelect': 'Seleccionar unidad de peso',

  'home.lead': 'Dos objetos. Una pregunta.',
  'home.headline': '¿Cuál pesa más?',
  'home.rule':
    'Ocho rondas, siempre reñidas: el objeto más pesado nunca supera al más ligero en más de un 54 % aproximadamente.',
  'home.start': 'Empezar partida',
  'home.categories': 'Lo que vas a pesar',
  'home.categoryCount': '{count} objetos',
  'home.guessStart': 'Adivina el Peso',
  'home.guessRule':
    'Un objeto cada vez: calcula su peso y descubre lo cerca que estuviste. Ocho rondas y luego tu precisión general.',

  'game.round': 'Ronda',
  'game.prompt': '¿Cuál pesa más?',
  'game.choose': 'Elegir {name}',
  'game.next': 'Siguiente ronda',
  'game.finish': 'Ver tu puntuación',
  'game.heavier': 'Más pesado',
  'game.correct': 'Correcto',
  'game.wrong': 'Casi',
  'game.yourPick': 'Tu elección',
  'game.score': 'Puntuación',

  'guess.prompt': '¿Cuánto crees que pesa esto?',
  'guess.inputLabel': 'Tu cálculo',
  'guess.a11yInput': 'Introduce tu peso estimado',
  'guess.submit': 'Enviar cálculo',
  'guess.next': 'Siguiente ronda',
  'guess.finish': 'Ver tus resultados',
  'guess.yourGuess': 'Tu cálculo',
  'guess.actualWeight': 'Peso real',
  'guess.percentOff': '{percent} de diferencia',
  'guess.tier.perfect': 'Perfecto',
  'guess.tier.veryGood': 'Muy bien',
  'guess.tier.good': 'Bien',
  'guess.tier.close': 'Cerca',
  'guess.tier.far': 'Lejos',
  'guess.exact.bullseye': '¡Diana!',
  'guess.exact.spotOn': '¡Justo en el blanco!',

  'score.eyebrow': 'Partida completada',
  'score.correctOf': '{correct} de {total} correctas',
  'score.headline.perfect': 'Impecable.',
  'score.headline.great': 'Buen instinto.',
  'score.headline.good': 'Nada mal.',
  'score.headline.low': 'Los pesos engañan.',
  'score.playAgain': 'Jugar otra vez',
  'score.home': 'Volver al inicio',
  'score.share': 'Compartir resultado',
  'score.shareCopied': 'Copiado al portapapeles',

  'guessScore.eyebrow': 'Adivina el Peso — completado',
  'guessScore.accuracyLabel': 'Precisión general',
  'guessScore.playAgain': 'Jugar otra vez',
  'guessScore.home': 'Volver al inicio',

  'dispute.open': '¿Peso incorrecto?',
  'dispute.step1': '¿Qué peso no te cuadra?',
  'dispute.step2': '{name} debería ser',
  'dispute.heavier': 'Más pesado',
  'dispute.lighter': 'Más ligero',
  'dispute.thanks': 'Gracias, lo revisaremos.',
  'dispute.close': 'Cerrar',
  'dispute.back': 'Atrás',

  'error.title': 'Algo ha salido mal',
  'error.noData': 'No se han podido cargar los datos de los objetos.',
  'error.noPairs': 'No se ha encontrado ninguna pareja de objetos comparable en los datos.',
  'error.notEnoughPairs':
    'Todavía no hay suficientes parejas de objetos comparables para montar una partida completa.',
  'error.retry': 'Reintentar',
  'error.missingImage': 'Imagen no disponible',
  'guessError.notEnoughObjects':
    'Todavía no hay suficientes objetos en los datos para montar una ronda completa.',

  'category.animals': 'Animales',
  'category.foods': 'Alimentos',
  'category.stuff': 'Objetos',
  'category.vehicles': 'Vehículos',

  'faq.title': 'Preguntas frecuentes',

  'faq.q1': '¿Cómo funciona el juego?',
  'faq.a1':
    'Cada partida son ocho rondas. En cada ronda verás dos objetos, uno al lado del otro, y eliges el que creas más pesado; no hay reloj, así que tómate el tiempo que quieras. En cuanto eliges, se revelan los dos pesos reales para que veas lo cerca que estabas antes de pasar a la siguiente ronda.',

  'faq.q2': '¿Cómo se determinan los pesos?',
  'faq.a2':
    'Cada peso se investigó con cuatro motores de IA distintos, consultados por separado sobre el mismo objeto. Después se compararon sus respuestas, se calculó la media y el resultado se redondeó a un valor limpio. Esa media es la que usa el juego, de modo que todos los objetos se miden con el mismo criterio y no según la fuente que se hubiera consultado.',

  'faq.q3': '¿Los pesos son exactos?',
  'faq.a3':
    'No, y tampoco pretenden serlo. Cada valor es un peso de referencia típico para ese tipo de objeto, porque uno real varía según su tamaño, su raza, su edad, su modelo o lo lleno que esté. Dos perros de la misma raza pueden diferenciarse en varios kilos. Las cifras son lo bastante fiables para plantear una comparación justa, no para certificar un ejemplar concreto.',

  'faq.q4': '¿Por qué se comparan ciertos objetos entre sí?',
  'faq.a4':
    'Porque una comparación reñida es una pregunta mejor. El juego solo empareja objetos cuyos pesos se diferencian como mucho en torno a un 54 %, así que nunca te preguntará si pesa más una pluma o un camión. Esa regla ignora las categorías a propósito: un animal frente a un vehículo es una pregunta perfectamente válida mientras los dos pesen algo parecido.',

  'faq.q5': '¿Qué unidades puedo usar?',
  'faq.a5':
    'El selector de la cabecera cambia todo el juego entre kilogramos y libras, y tu elección se recuerda para la próxima vez. La conversión usa un 1 kg = 2,2 lb deliberadamente redondo. Por debajo de un kilo, los pesos se muestran en gramos, así que una cereza se lee como 10 g y no como 0,01 kg. La unidad es solo visual: nunca cambia cuál de los dos objetos pesa más.',

  'faq.q6': '¿Cómo se calcula mi puntuación?',
  'faq.a6':
    'Cada acierto vale un punto, sobre un total de ocho. Al terminar la última ronda verás cuántos has acertado y ese mismo resultado en porcentaje. Ninguna ronda cuenta más que otra y fallar no resta nada: una pregunta difícil vale exactamente igual que una fácil.',

  'faq.q7': '¿Puedo impugnar el peso de un objeto?',
  'faq.a7':
    'Sí, y te animamos a hacerlo. Cuando se revela una respuesta, el botón «¿Peso incorrecto?» te deja señalar el objeto que no te cuadra e indicar si crees que debería ser más pesado o más ligero. Como los valores son medias investigadas, no todos serán perfectos, y avisos como el tuyo son justo lo que nos permite revisar, actualizar y mejorar los datos. Si algo te parece raro, merece la pena contárnoslo.',

  'faq.q8': '¿Cada cuánto cambian las preguntas?',
  'faq.a8':
    'Cada partida genera un conjunto nuevo de ocho preguntas en el momento en que la empiezas. Las parejas se sortean al azar entre todos los objetos, así que es raro que dos partidas seguidas se parezcan. No hay una tanda diaria que esperar ni un orden fijo que memorizar.',

  'faq.q9': '¿Puedo volver a jugar?',
  'faq.a9':
    'Tantas veces como quieras. Al final de una partida, «Jugar otra vez» arranca otra al instante con ocho preguntas nuevas, y el logotipo de arriba te devuelve al inicio en cualquier momento. No hay nada bloqueado ni límites, vidas o esperas.',

  'faq.q10': '¿Qué es Buy Me a Coffee?',
  'faq.a10':
    'Es una forma pequeña y totalmente opcional de apoyar el proyecto. Heavier es gratis, sin anuncios y sin cuentas, así que si lo has disfrutado y quieres ayudar a que siga creciendo, invitar a un café es un buen gesto. No aportar nada no cambia nada: el juego es exactamente el mismo en ambos casos.',

  'footer.coffee': 'Invítame a un café',

  'bento.feature.line1': 'En construcción',
  'bento.feature.line2': 'Muy pronto',
  'bento.contact.line1': 'Contáctanos',
  'bento.contact.line2': 'Star Games',
  'bento.coffee.title': 'Invítame a un café',
  'bento.coffee.body':
    'Heavier es gratis, sin anuncios ni cuentas. Un café ayuda a que siga creciendo.',
  'bento.faq.before': 'Haz clic aquí para ver las ',
  'bento.faq.accent': 'preguntas frecuentes',
  'bento.faq.after': '',

}
