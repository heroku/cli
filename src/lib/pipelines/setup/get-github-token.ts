export default function getGitHubToken(kolkrabbi: any) {
  return kolkrabbi.getAccount().then((account: any) => account.github.token, () => {
    throw new Error('Account not connected to GitHub.')
  })
}
