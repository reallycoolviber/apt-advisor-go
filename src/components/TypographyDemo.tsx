import React from 'react';
import { Card } from '@/components/ui/card';

/**
 * Typography demonstration component showing the global typographic system
 * This component showcases all available typography scales and utility classes
 */
export function TypographyDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="mb-4">Globalt Typografiskt System</h1>
        <p className="text-muted-foreground">
          Demonstrerar det nya globala typografiska systemet med konsekvent skala och läsbarhet.
        </p>
      </div>

      {/* HTML Elements */}
      <Card className="p-6">
        <h2 className="mb-6">Standard HTML-element</h2>
        
        <div className="space-y-4">
          <div>
            <h1>H1 - Största sidtitlar (39px)</h1>
            <p className="text-small text-muted-foreground">
              Används för huvudrubriker och sidtitlar
            </p>
          </div>

          <div>
            <h2>H2 - Stora sektionsrubriker (31px)</h2>
            <p className="text-small text-muted-foreground">
              Används för stora sektionsrubriker
            </p>
          </div>

          <div>
            <h3>H3 - Mellanstora rubriker (25px)</h3>
            <p className="text-small text-muted-foreground">
              Används för mellanstora rubriker och kort
            </p>
          </div>

          <div>
            <h4>H4 - Framträdande text (20px)</h4>
            <p className="text-small text-muted-foreground">
              Används för framträdande text som inte är rubrik
            </p>
          </div>

          <div>
            <p>Paragraph - Standard brödtext (16px)</p>
            <p className="text-small text-muted-foreground">
              Standard storlek för all brödtext och paragraf-innehåll
            </p>
          </div>

          <div>
            <small>Small - Mindre text och metadata (13px)</small>
            <p className="text-small text-muted-foreground">
              Används för mindre text, undertexter och metadata
            </p>
          </div>
        </div>
      </Card>

      {/* Utility Classes */}
      <Card className="p-6">
        <h2 className="mb-6">Typography Utility-klasser</h2>
        
        <div className="space-y-4">
          <div>
            <div className="text-display">text-display</div>
            <p className="text-small text-muted-foreground">
              För de allra största rubrikerna och hero-text
            </p>
          </div>

          <div>
            <div className="text-title">text-title</div>
            <p className="text-small text-muted-foreground">
              För sidtitlar och stora rubriker
            </p>
          </div>

          <div>
            <div className="text-heading">text-heading</div>
            <p className="text-small text-muted-foreground">
              För sektionsrubriker och mellanstora titlar
            </p>
          </div>

          <div>
            <div className="text-prominent">text-prominent</div>
            <p className="text-small text-muted-foreground">
              För framhävd text som ska sticka ut
            </p>
          </div>

          <div>
            <div className="text-body">text-body</div>
            <p className="text-small text-muted-foreground">
              Standard brödtext för läsning
            </p>
          </div>

          <div>
            <div className="text-small">text-small</div>
            <p className="text-small text-muted-foreground">
              För mindre text och metadata
            </p>
          </div>
        </div>
      </Card>

      {/* Tailwind Classes */}
      <Card className="p-6">
        <h2 className="mb-6">Tailwind CSS-klasser</h2>
        
        <div className="space-y-4">
          <div>
            <div className="text-display">text-display (var(--font-size-xxl))</div>
            <div className="text-title">text-title (var(--font-size-xl))</div>
            <div className="text-heading">text-heading (var(--font-size-lg))</div>
            <div className="text-prominent">text-prominent (var(--font-size-md))</div>
            <div className="text-body">text-body (var(--font-size-base))</div>
            <div className="text-small">text-small (var(--font-size-sm))</div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3">CSS-variabler tillgängliga:</h3>
            <div className="text-small font-mono space-y-1 bg-muted p-4 rounded">
              <div>--font-size-xxl: 39px</div>
              <div>--font-size-xl: 31px</div>
              <div>--font-size-lg: 25px</div>
              <div>--font-size-md: 20px</div>
              <div>--font-size-base: 16px</div>
              <div>--font-size-sm: 13px</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Usage Examples */}
      <Card className="p-6">
        <h2 className="mb-6">Användningsexempel</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="mb-3">I React/JSX:</h3>
            <div className="text-small font-mono bg-muted p-4 rounded space-y-2">
              <div>{`<h1>Automatisk H1-styling</h1>`}</div>
              <div>{`<p className="text-prominent">Framträdande text</p>`}</div>
              <div>{`<span className="text-small">Mindre text</span>`}</div>
            </div>
          </div>

          <div>
            <h3 className="mb-3">I CSS:</h3>
            <div className="text-small font-mono bg-muted p-4 rounded space-y-2">
              <div>{`.custom-heading { font-size: var(--font-size-lg); }`}</div>
              <div>{`.custom-text { font-size: var(--font-size-base); }`}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}