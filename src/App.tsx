import { useState } from 'react'
import { SiteHeader } from './components/SiteHeader'
import { BlankScreen } from './components/screens/BlankScreen'
import { ErrorScreen } from './components/screens/ErrorScreen'
import { GameScreen } from './components/screens/GameScreen'
import { GuessErrorScreen } from './components/screens/GuessErrorScreen'
import { GuessGameScreen } from './components/screens/GuessGameScreen'
import { GuessScoreScreen } from './components/screens/GuessScoreScreen'
import { HomeScreen } from './components/screens/HomeScreen'
import { ScoreScreen } from './components/screens/ScoreScreen'
import { I18nProvider } from './i18n/I18nContext'
import { PreferencesProvider, usePreferences } from './state/PreferencesContext'
import { useGame } from './state/useGame'
import { useGuessGame } from './state/useGuessGame'
import { useRoute } from './state/useRoute'
import './styles/global.css'

/** Which of the two independent game modes, if any, is on screen — kept
 * outside both reducers so picking one never touches the other's state. */
type Mode = 'none' | 'heavier' | 'guess'

function Game() {
  const game = useGame()
  const guessGame = useGuessGame()
  const { route, openGame, openCategory } = useRoute()
  const [mode, setMode] = useState<Mode>('none')

  const startHeavier = () => {
    setMode('heavier')
    game.start()
  }
  const startGuess = () => {
    setMode('guess')
    guessGame.start()
  }
  const goHomeFromHeavier = () => {
    game.goHome()
    setMode('none')
  }
  const goHomeFromGuess = () => {
    guessGame.goHome()
    setMode('none')
  }

  const phase = mode === 'guess' ? guessGame.state.phase : mode === 'heavier' ? game.state.phase : 'home'

  // On a placeholder page the wordmark only steps back to the game route, which
  // leaves a play-through exactly where it was; on the game route it keeps its
  // existing meaning of abandoning the current mode's game.
  const onPlaceholder = route.name !== 'game'
  const logoAction = onPlaceholder
    ? openGame
    : mode === 'none'
      ? null
      : mode === 'heavier'
        ? goHomeFromHeavier
        : goHomeFromGuess

  return (
    <div className="app" data-phase={phase} data-route={route.name}>
      <SiteHeader {...(logoAction ? { onLogoClick: logoAction } : {})} />

      <main className="site-main">
        {onPlaceholder && <BlankScreen />}

        {route.name === 'game' && (
          <>
            {mode === 'none' && (
              <HomeScreen
                onStart={startHeavier}
                onStartGuess={startGuess}
                onOpenCategory={openCategory}
              />
            )}

            {mode === 'heavier' && (
              <>
                {(game.state.phase === 'question' || game.state.phase === 'revealed') && (
                  <GameScreen game={game} />
                )}
                {game.state.phase === 'score' && (
                  <ScoreScreen game={game} onHome={goHomeFromHeavier} />
                )}
                {game.state.phase === 'error' && (
                  <ErrorScreen error={game.state.error} onRetry={game.start} onHome={goHomeFromHeavier} />
                )}
              </>
            )}

            {mode === 'guess' && (
              <>
                {(guessGame.state.phase === 'question' || guessGame.state.phase === 'revealed') && (
                  <GuessGameScreen game={guessGame} />
                )}
                {guessGame.state.phase === 'score' && (
                  <GuessScoreScreen game={guessGame} onHome={goHomeFromGuess} />
                )}
                {guessGame.state.phase === 'error' && (
                  <GuessErrorScreen
                    error={guessGame.state.error}
                    onRetry={guessGame.start}
                    onHome={goHomeFromGuess}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}

/** Preferences sit above i18n: the chosen language is what the translator reads. */
function Localized() {
  const { language } = usePreferences()
  return (
    <I18nProvider language={language}>
      <Game />
    </I18nProvider>
  )
}

export default function App() {
  return (
    <PreferencesProvider>
      <Localized />
    </PreferencesProvider>
  )
}
