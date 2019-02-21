const { padRight, fromWei } = require('web3').utils
const smartRound = require('smart-round')
const emoji = require('node-emoji')
const jsome = require('jsome')
const chalk = require('chalk')

const config = require('./config')

const round = smartRound(6, 0, 6)

function hello() {
  console.log(
    chalk.cyan(
      '\n',
      emoji.get('robot_face'),
      "Hi! Let's try to unblock some transactions...",
      '\n\n'
    )
  )
}

function bye() {
  console.log(chalk.cyan('\n', 'Ok, see ya!', emoji.get('wave'), '\n'))
}

function error(message = 'Something went wrong') {
  console.log(chalk.red('\n', emoji.get('x'), ` ${message}`, '\n\n'))
}

function selectChain() {
  return 'Select the chain you want to work with\n'
}

function inputMnemonic() {
  return typeof process.env.MNEMONIC === 'string' &&
    process.env.MNEMONIC.length > 0
    ? 'Confirm the mnemonic in your .env file or provide a new one'
    : chalk.bold(
        'Provide the mnemonic for your account',
        chalk.dim('(pst! you can use an .env file to avoid this)')
      )
}

function invalidMnemonic() {
  return chalk.magenta(
    emoji.get('robot_face'),
    " That's not a valid mnemonic my friend!"
  )
}

function noPendingTx(chainId) {
  console.log(
    chalk.cyan(
      `\n\n`,
      emoji.get('robot_face'),
      `Your account doesn't have any pending transaction in`,
      chalk.bold(config.chains[chainId].displayName),
      `chain. Yay!`,
      emoji.get('tada'),
      emoji.get('tada'),
      emoji.get('tada'),
      `\n\n`
    )
  )
}

function txListDescription(address) {
  console.log(
    '\n\n',
    emoji.get('robot_face'),
    chalk.cyan(
      'Below is a list of pending transactions for your address ',
      chalk.bold(address),
      '\n'
    )
  )
}

function transactionRow(tx, index) {
  // eslint-disable-next-line max-params
  const cell = (label, value, suffix, width) =>
    padRight(`${label}: ${value} ${suffix}`, width, ' ')

  const suffix = chalk.bold.yellow(
    `  ${emoji.get('star')}  RECOMMENDED (lowest nonce)`
  )

  return chalk(
    `${index})`,
    tx.hash,
    index === 0 ? suffix : '',
    '\n    ',
    cell('Nonce', tx.nonce, ' ', 22),
    cell('Value', round(fromWei(tx.value), true), 'ETH ', 22),
    cell('Gas Limit', tx.gas, ' ', 22),
    cell('Gas Price', fromWei(tx.gasPrice, 'gwei'), 'Gwei', 22),
    '\n'
  )
}

function newTxDescription() {
  console.log(
    chalk.cyan(
      '\n\n',
      emoji.get('robot_face'),
      `Ok, let's try to unblock this transaction by creating a new one with the same nonce.\n    You can edit its fields or leave their original values.\n\n`,
      chalk.bold(
        `Provide a Gas Price value that is at least 10% greater than the original!\n`
      )
    )
  )
}

function transactionFormHelp(
  chainGasPriceBN,
  txGasPriceBN,
  suggestedGasPriceBN
) {
  return chalk.bold(
    'Edit the fields and press Enter when ready:',
    '\n\n',
    chalk.gray(
      'Current chain gas price:',
      fromWei(chainGasPriceBN, 'gwei'),
      'Gwei |',
      'Blocked transaction gas price:',
      fromWei(txGasPriceBN, 'gwei'),
      'Gwei |'
    ),
    chalk.yellow(
      emoji.get('star'),
      'Suggested gas price:',
      fromWei(suggestedGasPriceBN, 'gwei'),
      'Gwei'
    ),
    '\n'
  )
}

function confirmationMessage({ value, gas, gasPrice }) {
  console.log(
    chalk.cyan(
      '\n',
      emoji.get('robot_face'),
      'Alright, you will send this transaction:',
      '\n\n'
    ),
    chalk.reset(
      `       Value: ${round(fromWei(value), true)} ETH\n`,
      `   Gas Limit: ${gas} units\n`,
      `   Gas Price: ${fromWei(gasPrice, 'gwei')} Gwei\n`
    )
  )
}

function sendingTransaction() {
  console.log(
    chalk.cyan(
      '\n\n',
      emoji.get('robot_face'),
      'Ok, sending the transaction!',
      emoji.get('crossed_fingers'),
      emoji.get('rocket'),
      '\n'
    )
  )
}

function txHashReceived(hash) {
  return chalk.reset('Plunger transaction hash:', chalk.bold.cyan(hash), '\n')
}

function showReceipt(receipt) {
  console.log(
    chalk.cyan(
      '\n',
      emoji.get('robot_face'),
      'Here is your receipt',
      emoji.get('page_with_curl'),
      '\n\n',
      jsome.getColoredString(receipt),
      '\n\n'
    )
  )
}

module.exports = {
  transactionFormHelp,
  confirmationMessage,
  sendingTransaction,
  txListDescription,
  newTxDescription,
  invalidMnemonic,
  txHashReceived,
  transactionRow,
  inputMnemonic,
  noPendingTx,
  showReceipt,
  selectChain,
  error,
  hello,
  bye
}
