/**
 * Global Typography System Documentation
 * 
 * Detta är den centrala dokumentationen för applikationens typografiska system.
 * Systemet implementerar en harmonisk skala baserad på en grundstorlek på 16px 
 * med skalningsfaktor 1.25 för optimal läsbarhet och visuell hierarki.
 * 
 * ARKITEKTUR:
 * - Alla textstorlekar definieras som CSS-variabler i index.css
 * - Globala stilar appliceras på HTML-element
 * - Tailwind-klasser skapade för enkel användning
 * - Inga hårdkodade font-storlekar tillåtna i komponenter
 * 
 * TYPOGRAFISK SKALA:
 * - Display (39px): För de största rubrikerna och hero-text
 * - Title (31px): För sidtitlar och stora rubriker  
 * - Heading (25px): För sektionsrubriker och mellanstora titlar
 * - Prominent (20px): För framträdande text som ska sticka ut
 * - Body (16px): Standard brödtext för optimal läsning
 * - Small (13px): För metadata, undertexter och hjälptext
 * 
 * ANVÄNDNING:
 * 
 * 1. HTML-element (automatisk styling):
 *    <h1>Automatisk 39px styling</h1>
 *    <h2>Automatisk 31px styling</h2>  
 *    <h3>Automatisk 25px styling</h3>
 *    <p>Automatisk 16px styling</p>
 *    <small>Automatisk 13px styling</small>
 * 
 * 2. Utility-klasser:
 *    <div className="text-display">39px text</div>
 *    <div className="text-title">31px text</div>
 *    <div className="text-heading">25px text</div>
 *    <div className="text-prominent">20px text</div>
 *    <div className="text-body">16px text</div>
 *    <div className="text-small">13px text</div>
 * 
 * 3. Tailwind font-size klasser:
 *    <div className="text-display">Samma som text-display</div>
 *    <div className="text-title">Samma som text-title</div>
 *    etc...
 * 
 * 4. Direkt CSS-variabler:
 *    .custom-style {
 *      font-size: var(--font-size-lg);
 *      line-height: var(--line-height-lg);
 *    }
 * 
 * VIKTIGT:
 * - Använd ALDRIG hårdkodade font-storlekar som 'text-xl' eller 'text-2xl'
 * - Använd alltid de definierade systemvariablerna
 * - HTML-element får automatisk styling utan klasser
 * - Line-height är optimerad för varje storlek
 * 
 * BAKÅTKOMPATIBILITET:
 * - Standard Tailwind font-storlekar finns kvar för äldre kod
 * - Gradvis migration till det nya systemet rekommenderas
 */

// Exempel på korrekt implementation i en komponent:
export function TypographyExampleComponent() {
  return (
    <div>
      {/* Använd HTML-element för automatisk styling */}
      <h1>Denna får automatiskt 39px (display storlek)</h1>
      <h2>Denna får automatiskt 31px (title storlek)</h2>
      <h3>Denna får automatiskt 25px (heading storlek)</h3>
      
      {/* Använd utility-klasser när du behöver kontroll */}
      <div className="text-prominent">Framträdande text (20px)</div>
      <p>Standard brödtext (16px)</p>
      <small>Mindre text (13px)</small>
      
      {/* Använd Tailwind klasser för flexibilitet */}
      <span className="text-display font-bold">Stor titel</span>
      <span className="text-small text-muted-foreground">Metadata</span>
    </div>
  );
}