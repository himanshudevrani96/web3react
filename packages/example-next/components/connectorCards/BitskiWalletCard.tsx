import { useEffect, useState } from 'react'
import { hooks, bitski } from '../../connectors/bitski'
import { Card } from '../Card'

const { useChainId, useAccounts, useIsActivating, useIsActive, useProvider, useENSNames } = hooks

export default function BitskiWalletCard() {
  const chainId = useChainId()
  const accounts = useAccounts()
  const isActivating = useIsActivating()

  const isActive = useIsActive()

  const provider = useProvider()
  const ENSNames = useENSNames(provider)

  const [error, setError] = useState(undefined)

  // attempt to connect eagerly on mount
  // useEffect(() => {
  //   void bitski.connectEagerly().catch(() => {
  //     console.debug('Failed to connect eagerly to metamask')
  //   })
  // }, [])

  return (
    <Card
      connector={bitski}
      chainId={chainId}
      isActivating={isActivating}
      isActive={isActive}
      error={error}
      setError={setError}
      accounts={accounts}
      provider={provider}
      ENSNames={ENSNames}
    />
  )
}
