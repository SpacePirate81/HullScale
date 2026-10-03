import { publicUrl } from './publicUrl'
import { SAMPLES, type SamplePlate } from './samples'
import { APP_VERSION } from './version'

export function Home({ onSample, onFile }: { onSample: (sample: SamplePlate) => void; onFile: (file: File) => void }) {
  return (
    <main className="home">
      <div className="home-inner">
        <section className="hero">
          <img src={publicUrl('favicon.svg')} alt="" />
          <div>
            <h1>HULLSCALE</h1>
            <p className="tag">PHOTO SCALE</p>
          </div>
          <p className="lede">
            Lock a known length on a photograph. Everything else converts. Starship stays a cylinder, not a cone. Area is
            projected. Volume is the box around the faces you draw, an upper bound.
          </p>
          <p className="version">v{APP_VERSION}</p>
          <label className="file-btn">
            OPEN PHOTOGRAPH
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onFile(file)
                event.target.value = ''
              }}
            />
          </label>
        </section>
        <section>
          <h2 className="section-label">TO-SCALE PLATES</h2>
          <p className="muted">Lock the named length, then check the others. Each plate states its scale.</p>
          <div className="plates">
            {SAMPLES.map((sample) => (
              <button key={sample.id} type="button" className="plate-card" onClick={() => onSample(sample)}>
                <img src={sample.src} alt="" />
                <span className="chip">{sample.tag}</span>
                <strong>{sample.name}</strong>
                <p>{sample.blurb}</p>
              </button>
            ))}
          </div>
        </section>
        <ol className="steps">
          <li>
            <span>01</span>
            <b>Lock a library length</b>
            Draw a reference on a known object — Vanguard 275 m, Starship 9 m, an ISO box.
          </li>
          <li>
            <span>02</span>
            <b>Read the rest</b>
            Measures stay in pixels until that lock. Then the readout is in the unit you picked.
          </li>
          <li>
            <span>03</span>
            <b>Faces, not guesses</b>
            Area is projected as seen. Prism volume is an upper bound from the boxes around orthogonal faces. A horizon, not a waterline,
            changes the scale.
          </li>
        </ol>
      </div>
    </main>
  )
}
