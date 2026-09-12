/* =========================================================================
   MAP COORDINATES & CARTOGRAPHIC BOUNDARIES
   Súradnice okresov pre interaktívnu HTML5 Canvas mapu BBK
   ========================================================================= */

const MAP_BOUNDARY = [
  { x: 310, y: 85 },  { x: 350, y: 70 },  { x: 450, y: 60 },  { x: 540, y: 65 },
  { x: 660, y: 70 },  { x: 740, y: 80 },  { x: 760, y: 130 }, { x: 820, y: 175 },
  { x: 940, y: 195 }, { x: 935, y: 260 }, { x: 895, y: 340 }, { x: 865, y: 400 },
  { x: 855, y: 480 }, { x: 805, y: 520 }, { x: 735, y: 525 }, { x: 670, y: 545 },
  { x: 615, y: 585 }, { x: 495, y: 605 }, { x: 435, y: 620 }, { x: 355, y: 620 },
  { x: 305, y: 590 }, { x: 245, y: 525 }, { x: 245, y: 455 }, { x: 175, y: 425 },
  { x: 135, y: 425 }, { x: 55,  y: 385 }, { x: 60,  y: 335 }, { x: 125, y: 265 },
  { x: 155, y: 205 }, { x: 215, y: 145 }, { x: 275, y: 105 }
];

const MAP_DISTRICT_DATA = {
  RS: { name: 'Rimavská Sobota', area: 1471.1, x: 835, y: 455, neighbors: ['PT', 'LC', 'RA', 'BR'], color: '#f97316' },
  BR: { name: 'Brezno', area: 1265.2, x: 625, y: 115, neighbors: ['BB', 'DT', 'PT', 'RS', 'RA'], color: '#38bdf8' },
  VK: { name: 'Veľký Krtíš', area: 848.4, x: 450, y: 585, neighbors: ['KA', 'ZV', 'LC', 'DT'], color: '#14b8a6' },
  LC: { name: 'Lučenec', area: 825.6, x: 635, y: 490, neighbors: ['VK', 'PT', 'RS', 'DT', 'ZV'], color: '#eab308' },
  BB: { name: 'Banská Bystrica', area: 809.4, x: 350, y: 145, neighbors: ['ZH', 'ZV', 'BR', 'DT'], color: '#f43f5e' },
  ZV: { name: 'Zvolen', area: 759.0, x: 350, y: 295, neighbors: ['BB', 'ZH', 'BS', 'KA', 'VK', 'DT', 'LC'], color: '#06b6d4' },
  RA: { name: 'Revúca', area: 730.1, x: 895, y: 220, neighbors: ['BR', 'RS', 'PT'], color: '#8b5cf6' },
  KA: { name: 'Krupina', area: 584.9, x: 295, y: 475, neighbors: ['BS', 'ZV', 'VK'], color: '#84cc16' },
  ZH: { name: 'Žiar nad Hronom', area: 517.6, x: 185, y: 280, neighbors: ['BB', 'ZC', 'BS', 'ZV'], color: '#a855f7' },
  PT: { name: 'Poltár', area: 476.2, x: 715, y: 405, neighbors: ['DT', 'LC', 'BR', 'RS', 'RA'], color: '#6366f1' },
  DT: { name: 'Detva', area: 449.1, x: 505, y: 300, neighbors: ['ZV', 'BR', 'LC', 'PT', 'VK', 'BB'], color: '#ec4899' },
  ZC: { name: 'Žarnovica', area: 425.5, x: 80, y: 375, neighbors: ['ZH', 'BS'], color: '#10b981' },
  BS: { name: 'Banská Štiavnica', area: 292.3, x: 215, y: 395, neighbors: ['ZC', 'ZH', 'ZV', 'KA'], color: '#f59e0b' }
};
