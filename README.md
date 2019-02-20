# Plungeth

CLI to speed-up pending Ethereum transactions that are blocked because of a low gas price.

This tool will help you search your account for blocked transactions and send a new transaction with same nonce but updated fields. If this transaction gets mined it will replace the blocked one, and enable other blocked transactions to get mined too.

Currently it only supports searching the first address of a BIP-32 HD wallet using `m/44'/60'/0'/0/0` as derivation path.

## Usage

- Clone and install package
- Run `npm start`

_Make sure your account has enough funds to send the plunger transaction!_

### Tip

You can create a `.env` file in the root directory to set defaults:

```
ENABLED_CHAINS="etcMorden, ethRopsten"
MNEMONIC="foo bar baz ..."
```

### Feeling generous?

Tips welcome

_ETH_: `0x37b89B8eC091Ac3e6e336Ce2d664676D22c910D5`
_MET_: `0x37b89B8eC091Ac3e6e336Ce2d664676D22c910D5`

## License

MIT
