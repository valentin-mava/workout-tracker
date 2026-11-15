import { useRef } from 'react'
import { migrate } from '../migrate'
import { useStore } from '../store'
import { go, Header } from '../ui'

export function Backup() {
  const { data, update } = useStore()
  const input = useRef<HTMLInputElement>(null)

  const exportJson = async () => {
    const name = `workouts-${new Date().toISOString().slice(0, 10)}.json`
    const file = new File([JSON.stringify(data, null, 2)], name, { type: 'application/json' })
    // Auf dem iPhone: Teilen-Menü (in Dateien sichern, AirDrop …)
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(file)
    a.download = name
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = async (file: File) => {
    try {
      const parsed = migrate(JSON.parse(await file.text()))
      if (!parsed) throw new Error()
      const msg = `${parsed.workouts.length} Workouts, ${parsed.logs.length} Trainings und ${parsed.notes.length} Notizen importieren? Deine aktuellen Daten werden ersetzt.`
      if (!confirm(msg)) return
      update(() => parsed)
      go('')
    } catch {
      alert('Die Datei ist kein gültiges Backup.')
    }
  }

  return (
    <main className="screen">
      <Header back={{ label: 'Overview', to: '' }} title="Backup" />
      <p className="muted">Deine Daten liegen nur auf diesem Gerät. Exportiere ab und zu ein Backup, z. B. in iCloud Drive.</p>
      <p className="muted">
        {data.workouts.length} Workouts · {data.logs.length} Trainings · {data.sportLogs.length} Other Sports · {data.notes.length} Notizen
      </p>
      <button className="btn dark wide" onClick={exportJson}>
        Backup exportieren
      </button>
      <button className="btn outline wide" onClick={() => input.current?.click()}>
        Backup importieren
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) importJson(f)
          e.target.value = ''
        }}
      />
    </main>
  )
}
