import confirmApp from '../apps/confirm-app'

export const trapConfirmationRequired = async function<T> (app: string, confirm: string | undefined, fn: (confirmed?: string) => Promise<T>) {
  return await fn(confirm)
    .catch((error: any) => {
      if (!error.body || error.body.id !== 'confirmation_required')
        throw error
      return confirmApp(app, confirm, error.body.message)
        .then(() => fn(app))
    })
}

