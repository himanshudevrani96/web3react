import { initializeConnector } from '@web3-react/core'
import { BitskiConnect } from '../../bitski'

export const [bitski, hooks] = initializeConnector<BitskiConnect>((actions) => new BitskiConnect({ actions }))
