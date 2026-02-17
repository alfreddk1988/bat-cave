/**
 * Generate Telegram deep link for Alfred bot
 */
export const generateAlfreddDeepLink = (message: string): string => {
  const botUsername = 'alfred_dk1988_bot'
  const encodedMessage = encodeURIComponent(message)
  return `https://t.me/${botUsername}?text=${encodedMessage}`
}

/**
 * Generate message for task chat
 */
export const generateTaskMessage = (title: string, description?: string): string => {
  const desc = description ? ` — ${description}` : ''
  return `Let's work on task: ${title}${desc}`
}

/**
 * Generate message for project chat
 */
export const generateProjectMessage = (name: string, description?: string): string => {
  const desc = description ? ` — ${description}` : ''
  return `Let's work on project: ${name}${desc}`
}