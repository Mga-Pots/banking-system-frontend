// The toast shown after staff review a transfer, by the status it ended up in.
const messages = {
  completed: 'Transfer approved. The recipient has been credited.',
  cancelled: 'Transfer cancelled and refunded to the sender.',
  flagged: 'Transfer flagged for review.',
}

export const reviewedMessage = (tx) => messages[tx.status] ?? 'Transaction updated.'
