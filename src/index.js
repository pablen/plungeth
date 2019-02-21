#!/usr/bin/env node

const { prompt } = require('enquirer')
const hdkey = require('ethereumjs-wallet/hdkey')
const chalk = require('chalk')
const bip39 = require('bip39')
const Web3 = require('web3')
const ora = require('ora')

const messages = require('./messages')
const config = require('./config')

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
  return { ...args, address, privateKey }
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
  const { pendingTransactions, address } = args

  messages.txListDescription(address)

  const { selectedHash } = await prompt({
    name: 'selectedHash',
    message: chalk.cyan('  Select a transaction you would like to unblock:\n'),
    theme: {
      styles: {
        primary: chalk.reset,
        em: chalk.bold
      }
    },
    type: 'select',
    choices: pendingTransactions.map((tx, i) => ({
      message: messages.transactionRow(tx, i),
      value: tx.hash
    }))
  })

  const selectedTransaction = pendingTransactions.find(
    ({ hash }) => hash === selectedHash
  )

  return { ...args, selectedTransaction }
}

async function editTransaction(args) {
  const { selectedTransaction, web3 } = args

  messages.newTxDescription()

  const chainGasPriceBN = web3.utils.toBN(await web3.eth.getGasPrice())
  const txGasPriceBN = web3.utils.toBN(selectedTransaction.gasPrice)
  const increasedTxGasPriceBN = txGasPriceBN.divn(10).add(txGasPriceBN)
  const suggestedGasPriceBN = chainGasPriceBN.gt(increasedTxGasPriceBN)
    ? chainGasPriceBN
    : increasedTxGasPriceBN

  const { edited } = await prompt({
    name: 'edited',
    message: messages.transactionFormHelp(
      chainGasPriceBN,
      txGasPriceBN,
      suggestedGasPriceBN
    ),
    type: 'form',
    choices: [
      {
        name: 'value',
        message: 'Value (in wei)',
        initial: selectedTransaction.value.toString()
      },
      {
        name: 'gas',
        message: 'Gas Limit',
        initial: selectedTransaction.gas.toString()
      },
      {
        name: 'gasPrice',
        message: 'Gas Price (in Gwei)',
        initial: web3.utils.fromWei(suggestedGasPriceBN, 'gwei').toString(),
        result: value => web3.utils.toWei(value, 'gwei')
      }
    ]
  })
  console.log(edited)
  return { ...args, edited }
}

async function confirmTransaction(args) {
  const { edited } = args

  messages.confirmationMessage(edited)

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
    data: selectedTransaction.input,
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

  promiEvent.on('transactionHash', hash => {
    spinner.succeed(messages.txHashReceived(hash))
    spinner.start()
    spinner.text = 'Waiting for receipt...'
  })

  promiEvent.on('receipt', receipt => {
    spinner.succeed('Transaction mined!')
    messages.showReceipt(receipt)
    messages.bye()
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
    message: messages.selectChain(),
    type: 'select',
    choices: config.enabledChains.map(chainId => ({
      message: config.chains[chainId].displayName,
      value: chainId
    }))
  },
  {
    name: 'mnemonic',
    message: messages.inputMnemonic(),
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
