import { PluginClient } from '@remixproject/plugin'
import { createClient } from '@remixproject/plugin-webview'
import { w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { configureChains, createClient as wagmiCreateClient } from 'wagmi'
import { arbitrum, mainnet, polygon, optimism, Chain, goerli, sepolia } from 'wagmi/chains'
import { PROJECT_ID } from './constant'

export class RemixClient extends PluginClient {
    wagmiClient
    chains: Chain[]

    constructor() {
        super()
        createClient(this)
        this.methods = ["sendAsync", "init"]
        this.onload()
    }

    async init() {
        try {
            this.chains = [arbitrum, mainnet, polygon, optimism, goerli, sepolia]
          
            const { provider } = configureChains(this.chains, [w3mProvider({ projectId: PROJECT_ID })])
            this.wagmiClient = wagmiCreateClient({
              autoConnect: false,
              connectors: w3mConnectors({ projectId: PROJECT_ID, version: 1, chains: this.chains }),
              provider
            })
        } catch (e) {
            return console.error("Could not get a wallet connection", e)
        }
    }

    sendAsync = (data: { method: string, params: string, id: string }) => {
        return new Promise((resolve, reject) => {
            if (this.wagmiClient) {
                if (this.wagmiClient.data && this.wagmiClient.data.provider && this.wagmiClient.data.provider.sendAsync) {
                    this.wagmiClient.data.provider.sendAsync(data, (error, message) => {
                        if (error) return reject(error)
                        resolve(message)
                    })
                } else if (this.wagmiClient.data && this.wagmiClient.data.provider && this.wagmiClient.data.provider.jsonRpcFetchFunc) {
                    this.wagmiClient.data.provider.jsonRpcFetchFunc(data.method, data.params).then((message) => {
                        resolve({"jsonrpc": "2.0", "result": message, "id": data.id})
                    }).catch((error) => {
                        reject(error)
                    })
                } else {
                    this.wagmiClient.provider.send(data.method, data.params).then((message) => {
                        resolve({"jsonrpc": "2.0", "result": message, "id": data.id})
                    }).catch((error) => {
                        reject(error)
                    })
                }
            } else {
                resolve({"jsonrpc": "2.0", "result": [], "id": data.id})
            }
        })
    }
}