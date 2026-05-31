// High-fidelity SVG trading charts built as DataURLs
// This allows immediate testing of pattern-matching without needing physical files on hand.

export interface SampleChartRef {
  id: string;
  titleKey: "sample1" | "sample2" | "sample3";
  dataUrl: string;
}

// Generate an SVG data url representing a bullish breakout pattern
function createBullishBreakoutSvg(): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
    <!-- Background -->
    <rect width="800" height="450" fill="#0f172a" />
    <defs>
      <linearGradient id="bull-grad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#22c55e" stop-opacity="0"/>
        <stop offset="100%" stop-color="#22c55e" stop-opacity="0.15"/>
      </linearGradient>
    </defs>
    <!-- Gridlines -->
    <g stroke="#1e293b" stroke-width="1">
      <line x1="100" y1="0" x2="100" y2="400" />
      <line x1="200" y1="0" x2="200" y2="400" />
      <line x1="300" y1="0" x2="300" y2="400" />
      <line x1="400" y1="0" x2="400" y2="400" />
      <line x1="500" y1="0" x2="500" y2="400" />
      <line x1="600" y1="0" x2="600" y2="400" />
      <line x1="700" y1="0" x2="700" y2="400" />
      
      <line x1="0" y1="100" x2="730" y2="100" />
      <line x1="0" y1="200" x2="730" y2="200" />
      <line x1="0" y1="300" x2="730" y2="300" />
    </g>

    <!-- Side price scales -->
    <rect x="730" width="70" height="450" fill="#1e293b" opacity="0.3"/>
    <line x1="730" y1="0" x2="730" y2="450" stroke="#1e293b" stroke-width="1.5" />
    <g fill="#64748b" font-family="monospace" font-size="11" text-anchor="middle">
      <text x="765" y="104">1.25400</text>
      <text x="765" y="204">1.25000</text>
      <text x="765" y="304">1.24600</text>
      <text x="765" y="404">1.24200</text>
    </g>

    <!-- Moving Average Indicator Line -->
    <path d="M 50,330 C 150,320 250,290 350,230 S 550,150 700,90" fill="none" stroke="#a855f7" stroke-width="2.5" />

    <!-- Resistance Level Line dotted in red -->
    <line x1="50" y1="150" x2="730" y2="150" stroke="#f43f5e" stroke-width="2" stroke-dasharray="5,5" />
    <text x="60" y="140" fill="#f43f5e" font-family="sans-serif" font-weight="bold" font-size="11">MAJOR RESISTANCE ($1.25200)</text>

    <!-- Candlesticks (X, WickY1, WickY2, BodyY, BodyHeight, Color) -->
    <!-- Bullish: #22c55e, Bearish: #ef4444 -->
    <!-- Candle 1: Bearish -->
    <line x1="100" y1="230" x2="100" y2="310" stroke="#ef4444" stroke-width="2" />
    <rect x="88" y="240" width="24" height="60" fill="#ef4444" rx="2" />

    <!-- Candle 2: Bullish -->
    <line x1="160" y1="210" x2="160" y2="290" stroke="#22c55e" stroke-width="2" />
    <rect x="148" y="220" width="24" height="50" fill="#22c55e" rx="2" />

    <!-- Candle 3: Bearish -->
    <line x1="220" y1="220" x2="220" y2="280" stroke="#ef4444" stroke-width="2" />
    <rect x="208" y="235" width="24" height="35" fill="#ef4444" rx="2" />

    <!-- Candle 4: Bullish -->
    <line x1="280" y1="180" x2="280" y2="260" stroke="#22c55e" stroke-width="2" />
    <rect x="268" y="195" width="24" height="55" fill="#22c55e" rx="2" />

    <!-- Candle 5: Bearish Retest -->
    <line x1="340" y1="190" x2="340" y2="250" stroke="#ef4444" stroke-width="2" />
    <rect x="328" y="210" width="24" height="30" fill="#ef4444" rx="2" />

    <!-- Candle 6: Strong Bullish -->
    <line x1="400" y1="140" x2="400" y2="220" stroke="#22c55e" stroke-width="2" />
    <rect x="388" y="150" width="24" height="60" fill="#22c55e" rx="2" />

    <!-- Candle 7: Bullish Breakout Candle (Breaks Resistance) -->
    <line x1="460" y1="100" x2="460" y2="180" stroke="#22c55e" stroke-width="3.5" />
    <rect x="448" y="110" width="24" height="60" fill="#22c55e" rx="2" />

    <!-- Candle 8: Consolidation Retest (Small Bearish above breakout line) -->
    <line x1="520" y1="115" x2="520" y2="155" stroke="#ef4444" stroke-width="2" />
    <rect x="508" y="120" width="24" height="20" fill="#ef4444" rx="2" />

    <!-- Candle 9: Next Massive Bullish Trigger Candle -->
    <line x1="580" y1="60" x2="580" y2="140" stroke="#22c55e" stroke-width="2" />
    <rect x="568" y="70" width="24" height="60" fill="#22c55e" rx="2" />

    <text x="448" y="240" fill="#22c55e" font-family="sans-serif" font-weight="bold" font-size="12">BREAKOUT ZONE</text>
    <!-- Arrow pointing to breakout -->
    <path d="M 440,225 L 452,185 L 435,195 M 452,185 L 415,215" fill="none" stroke="#22c55e" stroke-width="2" />
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Generate an SVG data url representing a double top reversal pattern
function createDoubleTopSvg(): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
    <!-- Background -->
    <rect width="800" height="450" fill="#0f172a" />
    <!-- Gridlines -->
    <g stroke="#1e293b" stroke-width="1">
      <line x1="100" y1="0" x2="100" y2="400" />
      <line x1="200" y1="0" x2="200" y2="400" />
      <line x1="300" y1="0" x2="300" y2="400" />
      <line x1="400" y1="0" x2="400" y2="400" />
      <line x1="500" y1="0" x2="500" y2="400" />
      <line x1="600" y1="0" x2="600" y2="400" />
      <line x1="700" y1="0" x2="700" y2="400" />
      
      <line x1="0" y1="100" x2="730" y2="100" />
      <line x1="0" y1="200" x2="730" y2="200" />
      <line x1="0" y1="300" x2="730" y2="300" />
    </g>

    <!-- Side price scales -->
    <rect x="730" width="70" height="450" fill="#1e293b" opacity="0.3"/>
    <line x1="730" y1="0" x2="730" y2="450" stroke="#1e293b" stroke-width="1.5" />
    <g fill="#64748b" font-family="monospace" font-size="11" text-anchor="middle">
      <text x="765" y="104">100.200</text>
      <text x="765" y="204">100.000</text>
      <text x="765" y="304">99.800</text>
      <text x="765" y="404">99.600</text>
    </g>

    <!-- Resistance Level Line dotted in red -->
    <line x1="50" y1="110" x2="730" y2="110" stroke="#f43f5e" stroke-width="2" stroke-dasharray="5,5" />
    <text x="60" y="100" fill="#f43f5e" font-family="sans-serif" font-weight="bold" font-size="11">DOUBLE TOP RESISTANCE ($100.180)</text>

    <!-- Neckline dotted line (Support) -->
    <line x1="50" y1="240" x2="730" y2="240" stroke="#eab308" stroke-width="1.5" stroke-dasharray="3,3" />
    <text x="60" y="235" fill="#eab308" font-family="sans-serif" font-weight="bold" font-size="10">NECKLINE SUPPORT ($99.920)</text>

    <!-- Candlesticks rendering Double Top (Bullish run -> Peak 1 -> Fall -> Rise -> Peak 2 -> Crash) -->
    <!-- Rising -->
    <line x1="100" y1="200" x2="100" y2="300" stroke="#22c55e" stroke-width="2" />
    <rect x="88" y="220" width="24" height="60" fill="#22c55e" rx="2" />

    <line x1="160" y1="130" x2="160" y2="240" stroke="#22c55e" stroke-width="2" />
    <rect x="148" y="140" width="24" height="80" fill="#22c55e" rx="2" />

    <!-- Peak 1 -->
    <line x1="220" y1="95" x2="220" y2="170" stroke="#ef4444" stroke-width="2" />
    <rect x="208" y="110" width="24" height="50" fill="#ef4444" rx="2" /><!-- Top 1 -->
    <circle cx="220" cy="95" r="8" fill="none" stroke="#f43f5e" stroke-width="1.5"/>

    <!-- Dip to Neckline -->
    <line x1="280" y1="160" x2="280" y2="250" stroke="#ef4444" stroke-width="2" />
    <rect x="268" y="170" width="24" height="70" fill="#ef4444" rx="2" />

    <line x1="340" y1="200" x2="340" y2="255" stroke="#22c55e" stroke-width="2" />
    <rect x="328" y="210" width="24" height="35" fill="#22c55e" rx="2" />

    <!-- Rise back up to Peak 2 -->
    <line x1="400" y1="120" x2="400" y2="220" stroke="#22c55e" stroke-width="2" />
    <rect x="388" y="130" width="24" height="70" fill="#22c55e" rx="2" />

    <!-- Peak 2 -->
    <line x1="460" y1="95" x2="460" y2="180" stroke="#ef4444" stroke-width="2" />
    <rect x="448" y="110" width="24" height="60" fill="#ef4444" rx="2" /><!-- Top 2 -->
    <circle cx="460" cy="95" r="8" fill="none" stroke="#f43f5e" stroke-width="1.5"/>

    <!-- Reversal Drop -->
    <line x1="520" y1="160" x2="520" y2="260" stroke="#ef4444" stroke-width="2" />
    <rect x="508" y="170" width="24" height="70" fill="#ef4444" rx="2" />

    <!-- Neckline Breakdown Candle -->
    <line x1="580" y1="230" x2="580" y2="310" stroke="#ef4444" stroke-width="3" />
    <rect x="568" y="242" width="24" height="55" fill="#ef4444" rx="2" />

    <!-- Confirmed bearish candle -->
    <line x1="640" y1="300" x2="640" y2="390" stroke="#ef4444" stroke-width="2" />
    <rect x="628" y="310" width="24" height="70" fill="#ef4444" rx="2" />

    <text x="200" y="80" fill="#f43f5e" font-family="sans-serif" font-weight="bold" font-size="12">PEAK 1</text>
    <text x="440" y="80" fill="#f43f5e" font-family="sans-serif" font-weight="bold" font-size="12">PEAK 2</text>
    <text x="590" y="340" fill="#ef4444" font-family="sans-serif" font-weight="bold" font-size="12">BREAKDOWN</text>
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Generate an SVG data url representing a range bound support bounce pattern
function createRangeBoundSvg(): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
    <!-- Background -->
    <rect width="800" height="450" fill="#0f172a" />
    <!-- Gridlines -->
    <g stroke="#1e293b" stroke-width="1">
      <line x1="100" y1="0" x2="100" y2="400" />
      <line x1="200" y1="0" x2="200" y2="400" />
      <line x1="300" y1="0" x2="300" y2="400" />
      <line x1="400" y1="0" x2="400" y2="400" />
      <line x1="500" y1="0" x2="500" y2="400" />
      <line x1="600" y1="0" x2="600" y2="400" />
      <line x1="700" y1="0" x2="700" y2="400" />
      
      <line x1="0" y1="100" x2="730" y2="100" />
      <line x1="0" y1="200" x2="730" y2="200" />
      <line x1="0" y1="300" x2="730" y2="300" />
    </g>

    <!-- Side price scales -->
    <rect x="730" width="70" height="450" fill="#1e293b" opacity="0.3"/>
    <line x1="730" y1="0" x2="730" y2="450" stroke="#1e293b" stroke-width="1.5" />
    <g fill="#64748b" font-family="monospace" font-size="11" text-anchor="middle">
      <text x="765" y="104">50.50</text>
      <text x="765" y="204">50.00</text>
      <text x="765" y="304">49.50</text>
      <text x="765" y="404">49.00</text>
    </g>

    <!-- Upper Channel Resistance -->
    <line x1="50" y1="120" x2="730" y2="120" stroke="#f43f5e" stroke-width="2" stroke-dasharray="6,4" />
    <text x="60" y="110" fill="#f43f5e" font-family="sans-serif" font-weight="bold" font-size="11">CHANNEL CEILING ($50.40)</text>

    <!-- Lower Channel Support -->
    <line x1="50" y1="320" x2="730" y2="320" stroke="#22c55e" stroke-width="2" stroke-dasharray="6,4" />
    <text x="60" y="340" fill="#22c55e" font-family="sans-serif" font-weight="bold" font-size="11">CHANNEL FLOOR / MAJOR SUPPORT ($49.40)</text>

    <!-- Candlesticks (Bouncing bottom -> middle -> top -> bottom -> middle -> bounce!) -->
    <!-- Peak near Ceiling -->
    <line x1="100" y1="110" x2="100" y2="200" stroke="#ef4444" stroke-width="2" />
    <rect x="88" y="130" width="24" height="60" fill="#ef4444" rx="2" />

    <!-- Dropping middle -->
    <line x1="160" y1="180" x2="160" y2="260" stroke="#ef4444" stroke-width="2" />
    <rect x="148" y="190" width="24" height="55" fill="#ef4444" rx="2" />

    <!-- Approaching Support -->
    <line x1="220" y1="240" x2="220" y2="330" stroke="#ef4444" stroke-width="2" />
    <rect x="208" y="255" width="24" height="65" fill="#ef4444" rx="2" />

    <!-- Bounce 1 - Candle at Support -->
    <line x1="280" y1="280" x2="280" y2="330" stroke="#22c55e" stroke-width="2.5" />
    <rect x="268" y="295" width="24" height="25" fill="#22c55e" rx="2" />

    <!-- Moving up -->
    <line x1="340" y1="220" x2="340" y2="310" stroke="#22c55e" stroke-width="2" />
    <rect x="328" y="230" width="24" height="60" fill="#22c55e" rx="2" />

    <line x1="400" y1="170" x2="400" y2="250" stroke="#22c55e" stroke-width="2" />
    <rect x="388" y="180" width="24" height="55" fill="#22c55e" rx="2" />

    <!-- Reaching Middle-top, rejection -->
    <line x1="460" y1="190" x2="460" y2="260" stroke="#ef4444" stroke-width="2" />
    <rect x="448" y="200" width="24" height="50" fill="#ef4444" rx="2" />

    <!-- Drop to Support again -->
    <line x1="520" y1="240" x2="520" y2="330" stroke="#ef4444" stroke-width="2" />
    <rect x="508" y="255" width="24" height="65" fill="#ef4444" rx="2" />

    <!-- Support Pinbar Candle: Massive lower wick showing strong price rejection -->
    <line x1="580" y1="280" x2="580" y2="340" stroke="#22c55e" stroke-width="3" />
    <rect x="568" y="295" width="24" height="15" fill="#22c55e" rx="2" />
    <!-- Pinbar visual ring -->
    <circle cx="580" cy="330" r="10" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="3,1"/>

    <!-- Massive confirmation Bullish Candle Bounding away -->
    <line x1="640" y1="210" x2="640" y2="300" stroke="#22c55e" stroke-width="2" />
    <rect x="628" y="220" width="24" height="75" fill="#22c55e" rx="2" />

    <text x="500" y="380" fill="#22c55e" font-family="sans-serif" font-weight="bold" font-size="11">SUPPORT REJECTION PINBAR (BUY ENTRY)</text>
  </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const sampleCharts: SampleChartRef[] = [
  {
    id: "bullish_breakout",
    titleKey: "sample1",
    dataUrl: createBullishBreakoutSvg()
  },
  {
    id: "double_top",
    titleKey: "sample2",
    dataUrl: createDoubleTopSvg()
  },
  {
    id: "support_bounce",
    titleKey: "sample3",
    dataUrl: createRangeBoundSvg()
  }
];
