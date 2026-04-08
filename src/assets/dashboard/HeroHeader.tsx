function HeroHeader() {
  return (
    <header className="hero-head">
      <div>
        <h1>Administration & Analytics</h1>
        <p>
          Pilotage qualite des donnees, workflow de validation et insights business sur les jeux de
          donnees mockes.
        </p>
      </div>
      <div className="api-note">
        <h2>API REST (cible)</h2>
        <p>
          Le backend n&apos;est pas encore branche. Cette interface prepare le terrain pour des
          endpoints CRUD securises et documentes via OpenAPI.
        </p>
      </div>
    </header>
  )
}

export default HeroHeader

