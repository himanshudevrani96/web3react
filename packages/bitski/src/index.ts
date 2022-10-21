import {
  Bitski,
  BitskiSDKOptions,
  ProviderOptions,
  BinanceSmartChainTestnet,
  BinanceSmartChain,
  ConnectButtonOptions,
  SignInOptions,
  LOGIN_HINT_SIGNUP,
  AuthenticationErrorCode,

} from 'bitski';
import type {
  Actions,
  AddEthereumChainParameter,
  Provider,
  ProviderConnectInfo,
  ProviderRpcError,
  WatchAssetParameters,
} from '@web3-react/types'

import { Connector } from '@web3-react/types'

type BitskiProvider = Provider
// export class NoMetaMaskError extends Error {
//   public constructor() {
//     super('MetaMask not installed')
//     this.name = NoMetaMaskError.name
//     Object.setPrototypeOf(this, NoMetaMaskError.prototype)
//   }
// }

function parseChainId(chainId: string | number) {
  return typeof chainId === 'number' ? chainId : Number.parseInt(chainId, chainId.startsWith('0x') ? 16 : 10)
}

/**
 * @param options - Options to pass to `@metamask/detect-provider`
 * @param onError - Handler to report errors thrown from eventListeners.
 */
export interface BitskiConstructorArgs {
  actions: Actions
  options?: BitskiSDKOptions
}

export class BitskiConnect extends Connector {
  /** {@inheritdoc Connector.provider} */
  public provider?: BitskiProvider | any
  private readonly options: BitskiSDKOptions | any
  private eagerConnection?: Promise<void>
  public bitskiWallet: BitskiSDKOptions | undefined

  constructor({ actions, options }: BitskiConstructorArgs) {
    super(actions)
    this.options = options
  }
  public bitski: any

  // private get connected() {
  //   return !!this.provider?.selectedAddress
  // }

  private async isomorphicInitialize(): Promise<void> {
    // const provider = bitski.getProvider();
    if (this.eagerConnection) return

    return (this.eagerConnection = import('bitski').then(async (m) => {
      // const provider = bitski.getProvider();
      const network = {
        rpcUrl: 'https://matic-mumbai.chainstacklabs.com',
        chainId: 80001,
      }
      this.bitski = new Bitski('a1d57ae2-3404-49dc-a848-edc39463c4fc', 'https://curvy-rabbits-cough-122-161-64-101.loca.lt/callback', ['offline', 'email']);
      // const provider = await m.default(this.options)
      // const { url, ...options } = this.options
      // this.bitskiWallet = new m.default(options)
      this.provider = this.bitski.getProvider()
      console.log(this.provider, "//");

      // if (provider) {
      //   this.provider = provider as BitskiProvider

      //   // handle the case when e.g. metamask and coinbase wallet are both installed
      //   if (this.provider.providers?.length) {
      //     this.provider = this.provider.providers.find((p) => p.isBitski) ?? this.provider.providers[0]
      //   }
      //       this.provider.signIn((e: any)=>{
      // console.log({e});

      //       })

      // Bitski.callback()/
      // Bitski.callback()
      // window.location = <Callback/>
      this.bitski.signIn().then((e: any) => {
        console.log("after signin",{ e });
        this.actions.update({ accounts: e.accounts, chainId: parseChainId(this.provider.currentChainId)})
      }).catch((error: any) => {
        if (error.code === AuthenticationErrorCode.UserCancelled) {
          // ignore error
        } else {
        }
        console.log("err", error);
      });
      
      //       this.provider.on('connect', ({ chainId }: ProviderConnectInfo): void => {
      //         // bitski.signIn()
      //         // this.bitski.signIn()
      //         this.actions.update({ chainId: parseChainId(chainId) })
      //       })

      //       this.provider.on('disconnect', (error: ProviderRpcError): void => {
      //         this.actions.resetState()
      //         this.onError?.(error)
      //       })

      //       this.provider.on('chainChanged', (chainId: string): void => {
      //         this.actions.update({ chainId: parseChainId(chainId) })
      //       })

      //       this.provider.on('accountsChanged', (accounts: string[]): void => {
      //         if (accounts.length === 0) {
      //           // handle this edge case by disconnecting
      //           this.actions.resetState()
      //         } else {
      //           this.actions.update({ accounts })
      //         }
      //       })
    }))
  }


  /** {@inheritdoc Connector.connectEagerly} */
  public async connectEagerly(): Promise<void> {
    const cancelActivation = this.actions.startActivation()

    await this.isomorphicInitialize()
    if (!this.provider) return cancelActivation()

    return Promise.all([
      this.provider.request({ method: 'eth_chainId' }) as Promise<string>,
      this.provider.request({ method: 'eth_accounts' }) as Promise<string[]>,
    ])
      .then(([chainId, accounts]) => {
        if (accounts.length) {
          this.actions.update({ chainId: parseChainId(chainId), accounts })
        } else {
          throw new Error('No accounts returned')
        }
      })
      .catch((error) => {
        console.debug('Could not connect eagerly', error)
        // we should be able to use `cancelActivation` here, but on mobile, metamask emits a 'connect'
        // event, meaning that chainId is updated, and cancelActivation doesn't work because an intermediary
        // update has occurred, so we reset state instead
        this.actions.resetState()
      })
  }

  /**
   * Initiates a connection.
   * @param desiredChainIdOrChainParameters - If defined, indicates the desired chain to connect to. If the user is
   * already connected to this chain, no additional steps will be taken. Otherwise, the user will be prompted to switch
   * to the chain, if one of two conditions is met: either they already have it added in their extension, or the
   * argument is of type AddEthereumChainParameter, in which case the user will be prompted to add the chain with the
   * specified parameters first, before being prompted to switch.
   * @param bitskiConfig
   */
  public async activate(desiredChainIdOrChainParameters?: number | AddEthereumChainParameter): Promise<void> {

    this.actions.startActivation()

    return this.isomorphicInitialize()
      .then(async () => {
        this.provider = this.bitski.getProvider()
        if (!this.provider) return

        return Promise.all([
          this.provider.request({ method: 'eth_chainId' }) as Promise<string>,
          this.provider.request({ method: 'eth_requestAccounts' }) as Promise<string[]>,
        ]).then(([chainId, accounts]) => {
          const receivedChainId = parseChainId(chainId)
          const desiredChainId =
            typeof desiredChainIdOrChainParameters === 'number'
              ? desiredChainIdOrChainParameters
              : desiredChainIdOrChainParameters?.chainId

          // if there's no desired chain, or it's equal to the received, update
          if (!desiredChainId || receivedChainId === desiredChainId)
            return this.actions.update({ chainId: receivedChainId, accounts })

          const desiredChainIdHex = `0x${desiredChainId.toString(16)}`

          // if we're here, we can try to switch networks
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          return this.provider!.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: desiredChainIdHex }],
          })
            .catch((error: ProviderRpcError) => {
              if (error.code === 4902 && typeof desiredChainIdOrChainParameters !== 'number') {
                // if we're here, we can try to add a new network
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                return this.provider!.request({
                  method: 'wallet_addEthereumChain',
                  params: [{ ...desiredChainIdOrChainParameters, chainId: desiredChainIdHex }],
                })
              }

              throw error
            })
            .then(() => this.activate(desiredChainId))
        })
      })
      .catch((error) => {
        throw error
      })
  }

  public async watchAsset({ address, symbol, decimals, image }: WatchAssetParameters): Promise<true> {
    if (!this.provider) throw new Error('No provider')
    return this.provider
      .request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address, // The address that the token is at.
            symbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals, // The number of decimals in the token
            image, // A string url of the token logo
          },
        },
      })
      .then((success: any) => {
        if (!success) throw new Error('Rejected')
        return true
      })
  }
}
