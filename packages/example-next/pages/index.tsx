import BitskiWalletCard from '../components/connectorCards/BitskiWalletCard'
import ProviderExample from '../components/ProviderExample'

export default function Home() {
  return (
    <>
      <ProviderExample />
      <div style={{ display: 'flex', flexFlow: 'wrap', fontFamily: 'sans-serif' }}>
        <BitskiWalletCard/>
      </div>
    </>
  )
}
