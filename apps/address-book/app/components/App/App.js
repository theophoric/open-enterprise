import React, { useState } from 'react'

import { useAragonApi } from '@aragon/api-react'
import { Button, Header, IconPlus, Main, SidePanel } from '@aragon/ui'

import { IdentityProvider } from '../../../../../shared/identity'
import { ipfsAdd } from '../../../../../shared/utils/ipfs'
import Entities from './Entities'
import NewEntity from '../Panel/NewEntity'

const ASSETS_URL = './aragon-ui'

const App = () => {
  const [ panelVisible, setPanelVisible ] = useState(false)
  const { api, appState = {} } = useAragonApi()
  
  const { entries = [] } = appState

  const createEntity = async ({ address, name, type }) => {
    closePanel()
    const content = { name, type }
    // add entry data to IPFS
    // TODO: show a nice progress animation here before closing the panel?
    const cId = await ipfsAdd(content)
    api.addEntry(address, cId).toPromise()
  }

  const removeEntity = address => {
    const cid = entries.find(e => e.addr === address).data.cid
    api.removeEntry(address, cid).toPromise()
  }

  const updateEntity = async ({ address, name, type }) => {
    closePanel()
    const content = { name, type }
    // add entry data to IPFS
    // TODO: show a nice progress animation here before closing the panel?
    const newCid = await ipfsAdd(content)
    const oldCid = entries.find(e => e.addr === address).data.cid
    api.updateEntry(address, oldCid, newCid).toPromise()
  }

  const newEntity = () => {
    setPanelVisible(true)
  }

  const closePanel = () => {
    setPanelVisible(false)
  }

  const handleResolveLocalIdentity = address =>
    api.resolveAddressIdentity(address).toPromise()

  const handleShowLocalIdentityModal = address =>
    api.requestAddressIdentityModification(address).toPromise()

  return (
    <Main assetsUrl={ASSETS_URL}>
      <Header
        primary="Address Book"
        secondary={
          <Button mode="strong" icon={<IconPlus />} onClick={newEntity} label="New Entity" />
        }
      />
      <IdentityProvider
        onResolve={handleResolveLocalIdentity}
        onShowLocalIdentityModal={handleShowLocalIdentityModal}
      >
        <Entities
          entities={entries}
          onNewEntity={newEntity}
          onRemoveEntity={removeEntity}
        />
        <SidePanel onClose={closePanel} opened={panelVisible} title="New entity">
          <NewEntity onCreateEntity={createEntity} />
        </SidePanel>
      </IdentityProvider>
    </Main>
  )
}

export default App
