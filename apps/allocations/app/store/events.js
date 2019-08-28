import { vaultLoadBalance } from './token'
import { onFundedAccount, onNewAccount, onPayoutExecuted } from './account'
import { onEntryAdded, onEntryRemoved } from './entry'
import { addressesEqual } from '../utils/web3-utils'
import { ipfsGet } from '../../../../shared/ui/utils/ipfs-helpers'
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
      nextState.offchainActions = await onForwardedActions(returnValues)
      break
    default:
      break
    }
  }
  // If nextAccounts or nextEntries were not generated
  // then return each original array
  return nextState
}

const onForwardedActions = async ({ failedActionKeys = [], pendingActionKeys = [], actions }) => {
  const offchainActions = { pendingActions: [], failedActions: [] }

  const getDataFromKey = async key => {
    const action = actions[key]
    const data = await app.queryAppMetadata(action.currentApp, action.actionId).toPromise()
    if (!data) return
    let metadata = await ipfsGet(data.cid)
    if (!metadata) return
    return { ...action, ...metadata }
  }

  let getFailedActionData = failedActionKeys.map(getDataFromKey)

  let getPendingActionData = pendingActionKeys.map(getDataFromKey)

  offchainActions.failedActions = (await Promise.all(getFailedActionData))
    .filter(action => action !== undefined)
    .map(action => ({ ...action, 
      startTime: new Date(action.startDate), 
      description: action.metadata, 
      amount: String(action.balance),
      distSet: false,
      pending: false
    }))

  offchainActions.pendingActions = (await Promise.all(getPendingActionData))
    .filter(action => action !== undefined)
    .map(action => ({ ...action, 
      startTime: new Date(action.startDate), 
      description: action.metadata, 
      amount: String(action.balance),
      distSet: false,
      pending: true
    }))

  return offchainActions
}
