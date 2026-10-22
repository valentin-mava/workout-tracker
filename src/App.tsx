import { Backup } from './screens/Backup'
import { Editor } from './screens/Editor'
import { Home } from './screens/Home'
import { Session } from './screens/Session'
import { StoreProvider } from './store'
import { useHash } from './ui'

function Routes() {
  const [screen, id] = useHash().split('/')
  if (screen === 'edit' && id) return <Editor key={id} id={id} />
  if (screen === 'session') return <Session />
  if (screen === 'backup') return <Backup />
  return <Home />
}

export default function App() {
  return (
    <StoreProvider>
      <Routes />
    </StoreProvider>
  )
}
