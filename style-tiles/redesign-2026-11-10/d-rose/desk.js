/* D · Rose window (first pass: the window alone, to judge the geometry). */
import { boot } from '../kit/os.js';
import { roseGeometry, roseSVG, lightBeads, litPane } from './window.js';

boot({
  id: 'd',
  name: 'Rose window',
  leapMs: 600,
  desk(el, api) {
    const parts = api.deskParts(el);
    const G = roseGeometry(api.UNITS);
    const mode = api.scene();
    const svg = api.h(`<svg class="rw-scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1440" height="900" fill="${mode === 'night' ? '#02050a' : '#f2f5f6'}"/>
      <g class="rw" transform="translate(720 450) scale(.42)">${roseSVG(G, { mode, id: 'dk', rng: api.rng(7), open: true, mark: api.mark.snow })}</g>
    </svg>`);
    el.append(svg, parts.sign, parts.clock, parts.brand, parts.night, parts.tools);
    lightBeads(svg, api.checkpoints(), 'dk');
    api.on('sign', s => litPane(svg, G, s.id));
    litPane(svg, G, parts.lesson().id);
  },
});
