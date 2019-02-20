const emoji = require('node-emoji')
const chalk = require('chalk')

const config = require('./config')

function hello() {
  console.log(
    chalk.cyan(
      '\n',
      emoji.get('robot_face'),
      " Hi! Let's try to unblock some transactions...\n"
    )
  )
}

function bye() {
  console.log(chalk.cyan('\nOk, good bye then.'))
}

function error(message = 'Something went wrong') {
  console.log(chalk.red('\n', emoji.get('x'), ` ${message}`, '\n\n'))
}

function invalidMnemonic() {
  return chalk.cyan(
    emoji.get('robot_face'),
    " That's not a valid mnemonic my friend!"
  )
}

function noPendingTx(chainId) {
  console.log(
    chalk.cyan(
      `\n\n`,
      emoji.get('robot_face'),
      ` Your account doesn't have any pending transaction in `,
      chalk.bold(config.chains[chainId].displayName),
      ` chain. Yay! `,
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

function newTxDescription() {
  console.log(
    chalk.cyan(
      '\n\n',
      emoji.get('robot_face'),
      ` Ok, let's try to unblock this transaction by creating a new one based on it, but using the same nonce.\nYou can edit its fields or leave their original values.\n\n`,
      chalk.bold(
        `Provide a Gas Price value that is at least 10% greater than the original!\n`
      )
    )
  )
}

function confirmationMessage({ value, gas, gasPrice }) {
  console.log(`\nYou will send this transaction:\n\n
  Value: ${value} ETH\n
  Gas Limit: ${gas} units\n
  Gas Price: ${gasPrice} Gwei\n\n`)
}

function sendingTransaction() {
  console.log(
    chalk.cyan(
      '\n\n',
      emoji.get('robot_face'),
      ' Ok, sending the transaction!',
      emoji.get('crossed_fingers'),
      emoji.get('rocket'),
      '\n\n'
    )
  )
}

function showReceipt(receipt) {
  console.log(
    chalk.cyan(
      '\n\n',
      emoji.get('robot_face'),
      ' Here is your receipt ',
      emoji.get('page_with_curl'),
      '\n\n',
      JSON.stringify(receipt, null, 2),
      '\n\n'
    )
  )
}

module.exports = {
  confirmationMessage,
  sendingTransaction,
  txListDescription,
  newTxDescription,
  invalidMnemonic,
  noPendingTx,
  showReceipt,
  error,
  hello,
  bye
}
