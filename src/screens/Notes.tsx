import { relativeDay } from '../format'
import { uid, useStore } from '../store'
import { Empty, go, Header, Icon, Redirect } from '../ui'

export function Notes() {
  const { data, update } = useStore()
  const notes = [...data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const create = () => {
    const now = new Date().toISOString()
    const id = uid()
    update((d) => ({ ...d, notes: [...d.notes, { id, title: '', body: '', createdAt: now, updatedAt: now }] }))
    go(`note/${id}`)
  }

  return (
    <main className="screen">
      <Header back={{ label: 'Overview', to: '' }} title="Notes" />

      <button className="btn dark wide" onClick={create}>
        <Icon name="plus" size={18} stroke={2.4} /> Neue Notiz
      </button>

      {notes.length ? (
        <ul className="list tight">
          {notes.map((n) => (
            <li key={n.id}>
              <button className="row-card note-card" onClick={() => go(`note/${n.id}`)}>
                <span className="row-text">
                  <span className="display row-title">{n.title || 'Ohne Titel'}</span>
                  <span className="row-sub">
                    {relativeDay(n.updatedAt)}
                    {n.body ? ` · ${n.body.slice(0, 60).replace(/\s+/g, ' ')}` : ''}
                  </span>
                </span>
                <span className="chev">
                  <Icon name="chevron" size={20} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty title="Noch keine Notizen">Zum Beispiel Trainingsideen, Technik-Hinweise oder Ziele.</Empty>
      )}
    </main>
  )
}

export function NoteEditor({ id }: { id: string }) {
  const { data, update } = useStore()
  const note = data.notes.find((n) => n.id === id)
  if (!note) return <Redirect to="notes" />

  const set = (patch: { title?: string; body?: string }) =>
    update((d) => ({ ...d, notes: d.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)) }))

  const close = () => {
    // Leere Notiz nicht liegen lassen
    if (!note.title.trim() && !note.body.trim()) update((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }))
    go('notes')
  }

  const remove = () => {
    if (!confirm('Notiz löschen?')) return
    update((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }))
    go('notes')
  }

  return (
    <main className="screen">
      <div className="header-bar">
        <button className="back" onClick={close}>
          <Icon name="back" size={20} />
          Notes
        </button>
        <button className="icon-btn" onClick={remove} aria-label="Notiz löschen">
          <Icon name="trash" size={20} />
        </button>
      </div>
      <span className="kicker">{new Date(note.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      <input className="title-input note-title" value={note.title} placeholder="Titel" aria-label="Titel" autoFocus={!note.title} onChange={(e) => set({ title: e.target.value })} />
      <textarea className="note-body" value={note.body} placeholder="Notiz schreiben …" aria-label="Notiz" onChange={(e) => set({ body: e.target.value })} />
    </main>
  )
}
