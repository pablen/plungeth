const smartRound = require('smart-round')
const { prompt } = require('enquirer')
const hdkey = require('ethereumjs-wallet/hdkey')
const bip39 = require('bip39')
const Web3 = require('web3')
const ora = require('ora')

const messages = require('./messages')
const config = require('./config')

const round = smartRound(6, 0, 6)

process.stdout.write('\x1Bc')

async function getAddressAndKey(args) {
  const { mnemonic } = args
  const seedBuffer = bip39.mnemonicToSeed(mnemonic)
  const wallet = hdkey
    .fromMasterSeed(seedBuffer)
    .derivePath(`m/44'/60'/0'/0/0`)
    .getWallet()
  const privateKey = wallet.getPrivateKeyString()
  const address = wallet.getChecksumAddressString()
  return { ...args, mnemonic, address, privateKey }
}

async function initWeb3(args) {
  const { chainId } = args
  const web3Provider = Web3.givenProvider || config.chains[chainId].nodeUrl
  const web3 = new Web3(web3Provider)
  return { ...args, web3 }
}

async function getPendingTransactions(args) {
  const { address, chainId, web3 } = args
  const pendingTransactions = await web3.eth
    .getBlock('pending')
    .then(({ transactions: txHashes }) =>
      Promise.all(txHashes.map(hash => web3.eth.getTransaction(hash)))
    )
    .then(txs =>
      txs
        .filter(({ from }) => from.toLowerCase() === address.toLowerCase())
        .sort((a, b) => a.nonce - b.nonce)
    )

  if (pendingTransactions.length === 0) {
    messages.noPendingTx(chainId)
    process.exit(0)
  }
  return { ...args, pendingTransactions }
}

async function selectTransaction(args) {
  const { pendingTransactions, address, web3 } = args

  messages.txListDescription(address)

  const formatLine = tx => ({
    message: `${tx.hash} | nonce: ${tx.nonce}, value: ${round(
      web3.utils.fromWei(tx.value),
      true
    )} ETH, gas: ${tx.gas}, gasPrice: ${web3.utils.fromWei(
      tx.gasPrice,
      'gwei'
    )} Gwei`,
    value: tx
  })

  const { selectedTransaction } = await prompt({
    name: 'selectedTransaction',
    message:
      'Select a transaction you would like to unblock (recommended: select lowest nonce):',
    type: 'select',
    choices: pendingTransactions.map(formatLine)
  })

  return { ...args, selectedTransaction }
}

async function editTransaction(args) {
  const { selectedTransaction } = args

  messages.newTxDescription()

  const edited = await prompt([
    {
      name: 'value',
      message: 'Value (in wei)',
      type: 'input',
      initial: selectedTransaction.value
    },
    {
      name: 'gas',
      message: 'Gas Limit',
      type: 'input',
      initial: selectedTransaction.gas
    },
    {
      name: 'gasPrice',
      message: 'Gas Price (in wei). A 10% was added to the original value.',
      type: 'input',
      initial: Math.ceil(parseInt(selectedTransaction.gasPrice, 10) * 1.1)
    }
  ])
  return { ...args, edited }
}

async function confirmTransaction(args) {
  const { edited, web3 } = args

  messages.confirmationMessage({
    value: round(web3.utils.fromWei(edited.value), true),
    gasPrice: web3.utils.fromWei(edited.gasPrice, 'gwei'),
    gas: edited.gas
  })

  const { isConfirmed } = await prompt({
    type: 'confirm',
    name: 'isConfirmed',
    initial: false,
    message: `Are you sure?`
  })
  if (!isConfirmed) {
    messages.bye()
    process.exit(0)
  }
  return args
}

async function sendNewTransaction(args) {
  const { web3, selectedTransaction, edited, privateKey } = args
  const transactionObject = {
    gasPrice: edited.gasPrice,
    nonce: selectedTransaction.nonce,
    value: edited.value,
    from: selectedTransaction.from,
    data: selectedTransaction.data,
    gas: edited.gas,
    to: selectedTransaction.to
  }
  web3.eth.accounts.wallet
    .create(0)
    .add(web3.eth.accounts.privateKeyToAccount(privateKey))

  messages.sendingTransaction()

  const spinner = ora({
    indent: 1,
    text: 'Waiting for transaction hash...'
  }).start()

  const promiEvent = web3.eth.sendTransaction(transactionObject)

  promiEvent.on('transactionHash', () => {
    spinner.text = 'Waiting for receipt...'
  })

  promiEvent.on('receipt', receipt => {
    spinner.succeed('Mined!')
    messages.showReceipt(receipt)
    process.exit(0)
  })

  promiEvent.on('error', (err, receipt) => {
    spinner.fail(err.message)
    if (receipt) messages.showReceipt(receipt)
    process.exit(1)
  })

  return promiEvent
}

const askForChainAndMnemonic = [
  {
    name: 'chainId',
    message: 'Select the chain you want to work with',
    type: 'select',
    choices: config.enabledChains.map(chainId => ({
      message: config.chains[chainId].displayName,
      value: chainId
    }))
  },
  {
    name: 'mnemonic',
    message:
      typeof process.env.MNEMONIC === 'string' &&
      process.env.MNEMONIC.length > 0
        ? 'Confirm the mnemonic in your .env file or provide a new one'
        : 'Provide the mnemonic for your account (pst! you can use an .env file to avoid this)',
    type: 'input',
    initial:
      typeof process.env.MNEMONIC === 'string' &&
      bip39.validateMnemonic(process.env.MNEMONIC)
        ? process.env.MNEMONIC
        : '',
    validate: str => {
      const sanitizedInput = str
        .split(' ')
        .filter(Boolean)
        .join(' ')
      return (
        bip39.validateMnemonic(sanitizedInput) || messages.invalidMnemonic()
      )
    }
  }
]

messages.hello()

prompt(askForChainAndMnemonic)
  .then(getAddressAndKey)
  .then(initWeb3)
  .then(getPendingTransactions)
  .then(selectTransaction)
  .then(editTransaction)
  .then(confirmTransaction)
  .then(sendNewTransaction)
  .then(() => process.exit(0))
  .catch(err => {
    messages.error(err.message)
    process.exit(1)
  })
