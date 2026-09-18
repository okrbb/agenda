/* =========================================================================
   REGIONS & DISTRICTS DATA
   Územné členenie BBK: 4 regióny, 13 okresných pracovísk
   ========================================================================= */

const REGIONS = [
  {
    id: "sever",
    name: "Banská Bystrica - SEVER",
    shortName: "SEVER",
    fteTotal: 12,
    villagesTotal: 114,
    color: "#10b981",
    districts: [
      { id: "BB", name: "Banská Bystrica", fte: 7, villages: 42, ags: ["AG1", "AG2", "AG3", "AG4", "AG5", "AG6", "AG7"] },
      { id: "BR", name: "Brezno", fte: 3, villages: 30, ags: ["AG1", "AG2", "AG3"] },
      { id: "RA", name: "Revúca", fte: 2, villages: 42, ags: ["AG4", "AG6"] }
    ]
  },
  {
    id: "zapad",
    name: "Banská Bystrica - ZÁPAD",
    shortName: "ZÁPAD",
    fteTotal: 9,
    villagesTotal: 94,
    color: "#6366f1",
    districts: [
      { id: "ZV", name: "Zvolen", fte: 3, villages: 26, ags: ["AG2", "AG3", "AG5"] },
      { id: "ZC", name: "Žarnovica", fte: 2, villages: 18, ags: ["AG2", "AG4"] },
      { id: "ZH", name: "Žiar nad Hronom", fte: 2, villages: 22, ags: ["AG3", "AG6"] },
      { id: "BS", name: "Banská Štiavnica", fte: 2, villages: 28, ags: ["AG4", "AG6"] }
    ]
  },
  {
    id: "juh",
    name: "Banská Bystrica - JUH",
    shortName: "JUH",
    fteTotal: 8,
    villagesTotal: 144,
    color: "#f59e0b",
    districts: [
      { id: "KA", name: "Krupina", fte: 2, villages: 36, ags: ["AG3", "AG4"] },
      { id: "VK", name: "Veľký Krtíš", fte: 3, villages: 71, ags: ["AG2", "AG4", "AG6"] },
      { id: "LC", name: "Lučenec", fte: 3, villages: 37, ags: ["AG2", "AG3", "AG6"] }
    ]
  },
  {
    id: "vychod",
    name: "Banská Bystrica - VÝCHOD",
    shortName: "VÝCHOD",
    fteTotal: 8,
    villagesTotal: 164,
    color: "#0284c7",
    districts: [
      { id: "DT", name: "Detva", fte: 2, villages: 15, ags: ["AG2", "AG3"] },
      { id: "PT", name: "Poltár", fte: 2, villages: 22, ags: ["AG4", "AG6"] },
      { id: "RS", name: "Rimavská Sobota", fte: 4, villages: 127, ags: ["AG2", "AG3", "AG4", "AG6"] }
    ]
  }
];

const DISTRICT_DICT = {
  BB: { name: "Banská Bystrica", region: "SEVER", regionId: "sever", fte: 7 },
  BR: { name: "Brezno", region: "SEVER", regionId: "sever", fte: 3 },
  RA: { name: "Revúca", region: "SEVER", regionId: "sever", fte: 2 },
  ZV: { name: "Zvolen", region: "ZÁPAD", regionId: "zapad", fte: 3 },
  ZC: { name: "Žarnovica", region: "ZÁPAD", regionId: "zapad", fte: 2 },
  ZH: { name: "Žiar nad Hronom", region: "ZÁPAD", regionId: "zapad", fte: 2 },
  BS: { name: "Banská Štiavnica", region: "ZÁPAD", regionId: "zapad", fte: 2 },
  KA: { name: "Krupina", region: "JUH", regionId: "juh", fte: 2 },
  VK: { name: "Veľký Krtíš", region: "JUH", regionId: "juh", fte: 3 },
  LC: { name: "Lučenec", region: "JUH", regionId: "juh", fte: 3 },
  DT: { name: "Detva", region: "VÝCHOD", regionId: "vychod", fte: 2 },
  PT: { name: "Poltár", region: "VÝCHOD", regionId: "vychod", fte: 2 },
  RS: { name: "Rimavská Sobota", region: "VÝCHOD", regionId: "vychod", fte: 4 }
};

const DISTRICT_COMPARISON_DATA = [
  { id: "BB", name: "Banská Bystrica", villages: 42, fte: 7, region: "SEVER", oldNote: "7 zamestnancov robilo 7 agend pre okres BB a zároveň neprehľadne riadilo celý kraj. Preťaženie koordináciou.", newNote: "Zabezpečuje agendy AG1, AG5 a AG7 na úrovni kraja a agendy AG2, AG3, AG4 a AG6 v rámci regiónu SEVER. Zastupiteľnosť krajskej agendy AG1 je pracoviskom Brezno, krajskej agendy AG5 pracoviskom Zvolen (agenda AG7 je bez zastúpenia iným okresom). Zastupiteľnosť regionálnych agend AG2 a AG3 je pracoviskom Brezno a regionálnych agend AG4 a AG6 pracoviskom Revúca." },
  { id: "BS", name: "Banská Štiavnica", villages: 15, fte: 2, region: "ZÁPAD", isCritical: true, oldNote: "2 zamestnanci museli obsluhovať všetkých 7 agend (3,5 agendy na osobu). Pri PN jedného človeka hrozil výpadok 50 % a paralýza.", newNote: "Zabezpečuje agendy AG4 a AG6 v rámci regiónu ZÁPAD. Zastupiteľnosť agendy AG4 je pracoviskom Žarnovica a agendy AG6 pracoviskom Žiar nad Hronom." },
  { id: "BR", name: "Brezno", villages: 30, fte: 3, region: "SEVER", oldNote: "3 zamestnanci obsluhovali všetkých 7 agend na 30 obcí v náročnom horskom teréne.", newNote: "Zabezpečuje agendu AG1 na úrovni kraja a agendy AG2 a AG3 v rámci regiónu SEVER. Zastupiteľnosť krajskej agendy AG1, ako aj regionálnych agend AG2 a AG3, je zabezpečená pracoviskom Banská Bystrica." },
  { id: "DT", name: "Detva", villages: 15, fte: 2, region: "VÝCHOD", isCritical: true, oldNote: "2 zamestnanci robili všetkých 7 agend. Izolované pracovisko bez systémovej podpory susedov.", newNote: "Zabezpečuje agendy AG2 a AG3 v rámci regiónu VÝCHOD. Zastupiteľnosť agend AG2 a AG3 je zabezpečená pracoviskom Rimavská Sobota." },
  { id: "KA", name: "Krupina", villages: 36, fte: 2, region: "JUH", isCritical: true, oldNote: "2 zamestnanci robili 7 agend pre 36 obcí (18 obcí na osobu cez 7 zákonných agend = 126 agendových zaťažení!).", newNote: "Zabezpečuje agendy AG3 a AG4 v rámci regiónu JUH. Zastupiteľnosť agendy AG3 je pracoviskom Lučenec a agendy AG4 pracoviskom Veľký Krtíš." },
  { id: "LC", name: "Lučenec", villages: 57, fte: 3, region: "JUH", oldNote: "3 zamestnanci pokrývali všetkých 7 agend pre 57 obcí vrátane zložitej protipovodňovej a materiálnej agendy.", newNote: "Zabezpečuje agendy AG2, AG3 a AG6 v rámci regiónu JUH. Zastupiteľnosť agendy AG2 a agendy AG6 je pracoviskom Veľký Krtíš, zastupiteľnosť agendy AG3 pracoviskom Krupina." },
  { id: "PT", name: "Poltár", villages: 22, fte: 2, region: "VÝCHOD", isCritical: true, oldNote: "2 zamestnanci museli zvládať všetkých 7 agend. Absencia hĺbkovej metodiky.", newNote: "Zabezpečuje agendy AG4 a AG6 v rámci regiónu VÝCHOD. Zastupiteľnosť agend AG4 a AG6 je zabezpečená pracoviskom Rimavská Sobota." },
  { id: "RA", name: "Revúca", villages: 42, fte: 2, region: "SEVER", isCritical: true, oldNote: "2 zamestnanci robili 7 agend pre 42 obcí v odľahlom regióne. Dojazd z krajského sídla BB až 1:30 h!", newNote: "Zabezpečuje agendy AG4 a AG6 v rámci regiónu SEVER. Zastupiteľnosť agend AG4 a AG6 je zabezpečená pracoviskom Banská Bystrica." },
  { id: "RS", name: "Rimavská Sobota", villages: 107, fte: 4, region: "VÝCHOD", oldNote: "4 zamestnanci robili 7 agend pre extrémny počet 107 obcí. Enormné zaťaženie kontrolami a správnymi konaniami.", newNote: "Zabezpečuje agendy AG2, AG3, AG4 a AG6 v rámci regiónu VÝCHOD. Zastupiteľnosť agend AG2 a AG3 je pracoviskom Detva a agend AG4 a AG6 pracoviskom Poltár." },
  { id: "VK", name: "Veľký Krtíš", villages: 71, fte: 3, region: "JUH", oldNote: "3 zamestnanci na 71 obcí a 7 agend (veľký pohraničný okres s vysokou rozlohou).", newNote: "Zabezpečuje agendy AG2, AG4 a AG6 v rámci regiónu JUH. Zastupiteľnosť agendy AG2 a agendy AG6 je pracoviskom Lučenec, zastupiteľnosť agendy AG4 pracoviskom Krupina." },
  { id: "ZC", name: "Žarnovica", villages: 18, fte: 2, region: "ZÁPAD", isCritical: true, oldNote: "2 zamestnanci robili všetkých 7 agend. Zraniteľnosť pri práceneschopnosti.", newNote: "Zabezpečuje agendy AG2 a AG4 v rámci regiónu ZÁPAD. Zastupiteľnosť agendy AG2 je pracoviskom Zvolen a agendy AG4 pracoviskom Banská Štiavnica." },
  { id: "ZH", name: "Žiar nad Hronom", villages: 35, fte: 2, region: "ZÁPAD", isCritical: true, oldNote: "2 zamestnanci na 35 obcí a 7 agend. Vysoká priemyselná záťaž.", newNote: "Zabezpečuje agendy AG3 a AG6 v rámci regiónu ZÁPAD. Zastupiteľnosť agendy AG3 je pracoviskom Zvolen a agendy AG6 pracoviskom Banská Štiavnica." },
  { id: "ZV", name: "Zvolen", villages: 26, fte: 3, region: "ZÁPAD", oldNote: "3 zamestnanci na 7 agend a 26 obcí, duplicita s krajským sídlom Banská Bystrica.", newNote: "Zabezpečuje agendu AG5 na úrovni kraja a agendy AG2 a AG3 v rámci regiónu ZÁPAD. Zastupiteľnosť krajskej agendy AG5 je pracoviskom Banská Bystrica. Zastupiteľnosť agendy AG2 je pracoviskom Žarnovica a agendy AG3 pracoviskom Žiar nad Hronom." }
];

if (typeof window !== 'undefined') {
  window.REGIONS = REGIONS;
  window.DISTRICT_DICT = DISTRICT_DICT;
  window.DISTRICT_COMPARISON_DATA = DISTRICT_COMPARISON_DATA;
}
