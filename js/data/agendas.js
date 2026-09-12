/* =========================================================================
   AGENDAS DATA (AG1 - AG7)
   Matica funkčnej zodpovednosti OKR BBK
   ========================================================================= */

const AGENDAS = [
  {
    id: "AG1",
    num: 1,
    name: "Prevencia, CBRN ochrana a havárie",
    shortName: "Prevencia & CBRN",
    color: "#c00000",
    type: "KRAJ",
    fteTotal: 2,
    badgeBg: "bg-red-50 text-red-700 border-red-200",
    desc: "Prevencia + súťaž mladých záchranárov CO, odborná príprava zamestnancov OKR, CBRN ochrana (chemická, biologická, radiačná a jadrová), horská služba, závažné priemyselné havárie.",
    scope: "Celokrajská pôsobnosť (vykonáva sa pre všetkých 13 okresov kraja).",
    coveredIn: ["BB", "BR"]
  },
  {
    id: "AG2",
    num: 2,
    name: "IS CO, varovanie, vyrozumenie a povodne",
    shortName: "IS CO & Varovanie",
    color: "#66a344",
    type: "REGION",
    fteTotal: 8,
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    desc: "Informačný systém civilnej ochrany, varovné a vyrozumievacie systémy, prielomové vlny vodných stavieb, hlásna služba a protipovodňová ochrana.",
    scope: "Regionálna pôsobnosť (v každom zo 4 regiónov pôsobia 2 špecialisti).",
    coveredIn: ["BB", "BR", "ZV", "ZC", "VK", "LC", "DT", "RS"]
  },
  {
    id: "AG3",
    num: 3,
    name: "Ukrytie, stavebné konania a plány ukrytia",
    shortName: "Ukrytie & Stavby CO",
    color: "#2e75b6",
    type: "REGION",
    fteTotal: 8,
    badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    desc: "Ukrytie obyvateľstva, posudzovanie stavebných zámerov, stavebno-technické požiadavky na stavby CO, plány ukrytia obcí a vyraďovanie/rušenie ochranných stavieb.",
    scope: "Regionálna pôsobnosť (v každom zo 4 regiónov pôsobia 2 špecialisti).",
    coveredIn: ["BB", "BR", "ZV", "ZH", "KA", "LC", "DT", "RS"]
  },
  {
    id: "AG4",
    num: 4,
    name: "Evakuácia, núdzové zásobovanie a ŠHR",
    shortName: "Evakuácia & ŠHR",
    color: "#c55a11",
    type: "REGION",
    fteTotal: 8,
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    desc: "Evakuácia obyvateľstva, plány evakuácie, núdzové zásobovanie a ubytovanie, koordinácia zásob zo Štátnych hmotných rezerv (ŠHR) a evidencia mimoriadnych udalostí.",
    scope: "Regionálna pôsobnosť (v každom zo 4 regiónov pôsobia 2 špecialisti).",
    coveredIn: ["BB", "RA", "ZC", "BS", "KA", "VK", "PT", "RS"]
  },
  {
    id: "AG5",
    num: 5,
    name: "Hospodárenie s materiálom CO a logistika",
    shortName: "Materiál CO & Sklady",
    color: "#990000",
    type: "KRAJ",
    fteTotal: 2,
    badgeBg: "bg-rose-50 text-rose-800 border-rose-200",
    desc: "Hospodárenie s materiálom CO, logistika skladov, systém EMCO, materiálne zabezpečenie zásahov, financovanie záchranných prác a náhrady škôd.",
    scope: "Celokrajská pôsobnosť (špecializovane garantuje BB a ZV pre celý kraj).",
    coveredIn: ["BB", "ZV"]
  },
  {
    id: "AG6",
    num: 6,
    name: "Hospodárska mobilizácia, EPSIS a obrana",
    shortName: "Mobilizácia & EPSIS",
    color: "#7030a0",
    type: "REGION",
    fteTotal: 8,
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    desc: "Kompletná hospodárska mobilizácia, informačný systém EPSIS, obranné plánovanie štátu, vecné plnenie a agenda utajovaných skutočností.",
    scope: "Regionálna pôsobnosť (v každom zo 4 regiónov pôsobia 2 špecialisti).",
    coveredIn: ["BB", "RA", "ZH", "BS", "VK", "LC", "PT", "RS"]
  },
  {
    id: "AG7",
    num: 7,
    name: "Bezpečnostné rady a krízové štáby",
    shortName: "Bezpečnostné rady",
    color: "#7a0016",
    type: "KRAJ",
    fteTotal: 1,
    badgeBg: "bg-red-50 text-red-900 border-red-300",
    desc: "Bezpečnostné rady, Krízový štáb okresného úradu v sídle kraja, zvolávanie zasadnutí, príprava zápisov a uznesení, strategické rozhodovanie.",
    scope: "Celokrajská pôsobnosť (výlučne dislokované v sídle kraja BB).",
    coveredIn: ["BB"]
  }
];
