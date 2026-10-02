import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { disputeStore, type DisputeDirection } from '../services/disputes'
import { ArrowDownIcon, ArrowUpIcon, FlagIcon } from './icons'
import type { GameObject, Question } from '../domain/types'

type Step = 'closed' | 'pick-object' | 'pick-direction' | 'done'

/**
 * Lets a player report that an object's weight looks wrong, after the answer
 * has already been revealed.
 *
 * Mount this with `key={question.id}` so the flow resets between rounds.
 */
export function DisputeFlow({ question, gameId }: { question: Question; gameId: string }) {
  const { t, objectName } = useI18n()
  const [step, setStep] = useState<Step>('closed')
  const [target, setTarget] = useState<GameObject | null>(null)

  async function submit(direction: DisputeDirection) {
    if (!target) return
    setStep('done')
    try {
      await disputeStore.submit({
        objectId: target.id,
        direction,
        gameId,
        questionId: question.id,
        opponentObjectId: target.id === question.left.id ? question.right.id : question.left.id,
      })
    } catch (error) {
      // A failed report must never interrupt the game.
      console.warn('[weight-game] dispute could not be stored', error)
    }
  }

  if (step === 'closed') {
    return (
      <div className="dispute">
        <button type="button" className="dispute__trigger" onClick={() => setStep('pick-object')}>
          <FlagIcon />
          <span>{t('dispute.open')}</span>
        </button>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="dispute">
        <p className="dispute__thanks" role="status">
          {t('dispute.thanks')}
        </p>
      </div>
    )
  }

  return (
    <div className="dispute">
      <div className="dispute__panel">
        {step === 'pick-object' ? (
          <>
            <p className="dispute__prompt">{t('dispute.step1')}</p>
            <div className="dispute__options">
              {[question.left, question.right].map((object) => (
                <button
                  key={object.id}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setTarget(object)
                    setStep('pick-direction')
                  }}
                >
                  {objectName(object)}
                </button>
              ))}
            </div>
            <button type="button" className="dispute__quiet" onClick={() => setStep('closed')}>
              {t('dispute.close')}
            </button>
          </>
        ) : (
          <>
            <p className="dispute__prompt">
              {t('dispute.step2', { name: target ? objectName(target) : '' })}
            </p>
            <div className="dispute__options">
              <button type="button" className="chip chip--action" onClick={() => void submit('heavier')}>
                <ArrowUpIcon />
                <span>{t('dispute.heavier')}</span>
              </button>
              <button type="button" className="chip chip--action" onClick={() => void submit('lighter')}>
                <ArrowDownIcon />
                <span>{t('dispute.lighter')}</span>
              </button>
            </div>
            <button
              type="button"
              className="dispute__quiet"
              onClick={() => {
                setTarget(null)
                setStep('pick-object')
              }}
            >
              {t('dispute.back')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
