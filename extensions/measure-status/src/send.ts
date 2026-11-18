// FR-16, D1: the send path of the comment. The module holds the name of the
// service, the name of the method, and the rules of one send. It has no SDK
// import and no DOM access. Every value stays plain text.
import { COMMENT_TEXT_MAX, formatComment, hasVisibleCharacter, type CommentInput } from './comment'
import { PM_SESSION_ID } from './pm-target'

/** The name of the guest service that carries the send request. */
export const SEND_SERVICE = 'measure-status'

/** The method of the service that sends the message to the PM session. */
export const SEND_METHOD = 'sendComment'

/** The host that carries the send request to the service. */
export type SendHost = {
  serviceRequest: (
    service: string,
    method: string,
    params: { sessionId: string; text: string },
  ) => Promise<unknown>
}

/** The result of one send. A failure names the code of the host. */
export type SendResult =
  | { ok: true; sentAt: number; line: string }
  | {
      ok: false
      reason: 'send-failed' | 'empty-text' | 'too-long' | 'busy'
      code: string
      line: string
    }

/** The sender of one comment. One send runs at a time. */
export type CommentSender = {
  /** True while a send runs. */
  readonly sending: boolean
  /** Sends one message to the PM session. */
  send: (input: CommentInput) => Promise<SendResult>
}

/**
 * D1: the state line of a sent message. The time is the local time of the
 * page that shows the line.
 */
export const formatSentLine = (sentAt: number): string => {
  const date = new Date(sentAt)
  if (Number.isNaN(date.getTime())) return 'sent --:--'
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `sent ${hours}:${minutes}`
}

/** D1: the state line of a failed send. It names the code and the message. */
export const formatSendError = (code: string, message: string): string => {
  const text = message.trim()
  return text === '' ? code : `${code}: ${text}`
}

/**
 * D1: the Send button is off while a send runs or while the text holds no
 * visible character.
 */
export const isSendDisabled = (text: string, sending: boolean): boolean =>
  sending || !hasVisibleCharacter(text)

/** The code of a failed host call. The host gives the code. */
const errorCode = (error: unknown): string => {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' && code !== '' ? code : 'REQUEST_FAILED'
}

/** The message of a failed host call. */
const errorMessage = (error: unknown): string => {
  const message = (error as { message?: unknown } | null)?.message
  return typeof message === 'string' && message !== '' ? message : 'The host gave no message.'
}

const refusal = (
  reason: 'empty-text' | 'too-long' | 'busy',
  code: string,
  line: string,
): SendResult => ({ ok: false, reason, code, line })

/**
 * D1: one click sends one message. The sender holds no retry loop and no
 * queue. A second call during a send gives a refusal and no host call.
 */
export const createCommentSender = (host: SendHost): CommentSender => {
  let sending = false

  const send = async (input: CommentInput): Promise<SendResult> => {
    if (sending) {
      return refusal('busy', 'BUSY', 'A comment is already on its way.')
    }
    if (!hasVisibleCharacter(input.text)) {
      return refusal('empty-text', 'EMPTY_TEXT', 'Write a comment first.')
    }
    if (input.text.length > COMMENT_TEXT_MAX) {
      return refusal(
        'too-long',
        'TEXT_TOO_LONG',
        `Use ${COMMENT_TEXT_MAX} characters or fewer.`,
      )
    }

    sending = true
    try {
      await host.serviceRequest(SEND_SERVICE, SEND_METHOD, {
        sessionId: PM_SESSION_ID,
        text: formatComment(input),
      })
      const sentAt = Date.now()
      return { ok: true, sentAt, line: formatSentLine(sentAt) }
    } catch (error) {
      const code = errorCode(error)
      return {
        ok: false,
        reason: 'send-failed',
        code,
        line: formatSendError(code, errorMessage(error)),
      }
    } finally {
      sending = false
    }
  }

  return {
    get sending(): boolean {
      return sending
    },
    send,
  }
}
