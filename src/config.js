const enabledChains = (
  process.env.ENABLED_CHAINS || 'etcMordenLocal, ethRopstenLocal'
)
  .split(',')
  .map(name => name.trim())

const chains = {
  mainnet: {
    displayName: 'Ethereum',
    nodeUrl: 'wss://eth.wallet.metronome.io:8546',
    symbol: 'ETH'
  },
  ethRopsten: {
    displayName: 'ETH (Ropsten)',
    wsApiUrl: 'wss://eth.wallet.metronome.io:8546', // TODO: update!
    symbol: 'ETH'
  },
  ethRopstenLocal: {
    displayName: 'Ropsten (Local)',
    nodeUrl: 'ws://localhost:8546',
    symbol: 'ETH'
  },
  etcMorden: {
    displayName: 'ETC (Morden)',
    nodeUrl: 'wss://eth.wallet.metronome.io:8546', // TODO: update!
    symbol: 'ETC'
  },
  etcMordenLocal: {
    displayName: 'Morden (Local)',
    nodeUrl: 'ws://localhost:8556',
    symbol: 'ETC'
  }
}

module.exports = {
  enabledChains,
  chains
}
