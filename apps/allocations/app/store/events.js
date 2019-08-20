import { vaultLoadBalance } from './token'
import { onFundedAccount, onNewAccount, onPayoutExecuted } from './account'
import { onEntryAdded, onEntryRemoved } from './entry'
import { addressesEqual } from '../utils/web3-utils'
import { app } from './app'

export const handleEvent = async (state, event, settings) => {
  const { address: eventAddress, event: eventName, returnValues } = event
  const { addressBook, vault } = settings
  const { accounts, entries, payouts } = state

  let nextAccounts, nextBoth
  let nextState = { ...state }
  if (addressesEqual(eventAddress, vault.address)) {
    // Vault event
    nextState = await vaultLoadBalance(nextState, event, settings)
  } else {
    switch (eventName) {
    case 'FundAccount':
      nextAccounts = await onFundedAccount(accounts, returnValues)
      nextState.accounts = nextAccounts
      break
    case 'NewAccount':
      nextAccounts = await onNewAccount(accounts, returnValues)
      nextState.accounts = nextAccounts
      break
    case 'PayoutExecuted':
      nextBoth = await onPayoutExecuted(payouts, accounts, returnValues)
      nextState.accounts = nextBoth.accounts
      nextState.payouts = nextBoth.payouts
      break
    case 'SetDistribution':
      nextBoth = await onPayoutExecuted(payouts, accounts, returnValues)
      nextState.accounts = nextBoth.accounts
      nextState.payouts = nextBoth.payouts
      break
    case 'EntryAdded':
      nextState.entries = await onEntryAdded(
        { entries, addressBook },
        returnValues
      )
      break
    case 'EntryRemoved':
      nextState.entries = await onEntryRemoved(
        { entries, addressBook },
        returnValues
      )
      break
    case 'ForwardedActions':
      console.log('forwardedAction Caught: ', returnValues)
      onForwardedActions(returnValues)
      break
    default:
      console.log('[allocations script] unhandled event:', event)
      break
    }
  }
  // If nextAccounts or nextEntries were not generated
  // then return each original array
  return nextState
}

const onForwardedActions = async ({ failedActionKeys, actions }) => {
  const action = actions[failedActionKeys[0]]
  console.log(action)
  console.log('Get the metadata: ',(await app.queryAppMetadata(action.currentApp, action.actionId).toPromise()))
  app.trigger('test trigger')
}
