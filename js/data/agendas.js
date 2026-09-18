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
    color: "#991b1b", // Deep Crimson (Závažné riziká / CBRN)
    type: "KRAJ",
    fteTotal: 2,
    badgeBg: "bg-red-50 text-red-800 border-red-200",
    desc: "Prevencia + súťaž mladých záchranárov CO, odborná príprava zamestnancov OKR, CBRN ochrana (chemická, biologická, radiačná a jadrová), výjazdové skupiny, horská služba, závažné priemyselné havárie.",
    scope: "Celokrajská pôsobnosť (vykonáva sa pre všetkých 13 okresov kraja).",
    coveredIn: ["BB", "BR"]
  },
  {
    id: "AG2",
    num: 2,
    name: "IS CO, varovanie, vyrozumenie a povodne",
    shortName: "IS CO & Varovanie",
    color: "#0369a1", // Technical Cobalt Blue
    type: "REGION",
    fteTotal: 8,
    badgeBg: "bg-sky-50 text-sky-800 border-sky-200",
    desc: "Informačný systém civilnej ochrany, varovné a vyrozumievacie systémy, prielomové vlny vodných stavieb, plán ochrany, hlásna služba a protipovodňová ochrana.",
    scope: "Regionálna pôsobnosť (v každom zo 4 regiónov pôsobia 2 špecialisti).",
    coveredIn: ["BB", "BR", "ZV", "ZC", "VK", "LC", "DT", "RS"]
  },
  {
    id: "AG3",
    num: 3,
    name: "Ukrytie, stavebné konania a plány ukrytia",
    shortName: "Ukrytie & Stavby CO",
    color: "#475569", // Slate Infrastructure
    type: "REGION",
    fteTotal: 8,
    badgeBg: "bg-slate-100 text-slate-800 border-slate-300",
    desc: "Ukrytie obyvateľstva, posudzovanie stavebných zámerov, stavebno-technické požiadavky na stavby CO, plány ukrytia obcí a vyraďovanie/rušenie ochranných stavieb.",
    scope: "Regionálna pôsobnosť (v každom zo 4 regiónov pôsobia 2 špecialisti).",
    coveredIn: ["BB", "BR", "ZV", "ZH", "KA", "LC", "DT", "RS"]
  },
  {
    id: "AG4",
    num: 4,
    name: "Evakuácia, núdzové zásobovanie a ŠHR",
    shortName: "Evakuácia & Núdzové zás.",
    color: "#b45309", // Amber Bronze
    type: "REGION",
    fteTotal: 8,
    badgeBg: "bg-amber-50 text-amber-900 border-amber-200",
    desc: "Evakuácia obyvateľstva, plány evakuácie, núdzové zásobovanie a ubytovanie, koordinácia zásob zo Štátnych hmotných rezerv (ŠHR) a evidencia mimoriadnych udalostí.",
    scope: "Regionálna pôsobnosť (v každom zo 4 regiónov pôsobia 2 špecialisti).",
    coveredIn: ["BB", "RA", "ZC", "BS", "KA", "VK", "PT", "RS"]
  },
  {
    id: "AG5",
    num: 5,
    name: "Hospodárenie s materiálom CO a logistika",
    shortName: "Materiál CO & Financie",
    color: "#0f766e", // Deep Teal Logistics
    type: "KRAJ",
    fteTotal: 2,
    badgeBg: "bg-teal-50 text-teal-800 border-teal-200",
    desc: "Hospodárenie s materiálom CO, logistika skladov, systém EMCO, materiálne zabezpečenie zásahov, financovanie HM, financovanie záchranných prác a náhrady škôd.",
    scope: "Celokrajská pôsobnosť (špecializovane garantuje BB a ZV pre celý kraj).",
    coveredIn: ["BB", "ZV"]
  },
  {
    id: "AG6",
    num: 6,
    name: "Hospodárska mobilizácia, EPSIS a obrana",
    shortName: "HM (EPSIS) & Obrana",
    color: "#4338ca", // Indigo Defense
    type: "REGION",
    fteTotal: 8,
    badgeBg: "bg-indigo-50 text-indigo-900 border-indigo-200",
    desc: "Kompletná hospodárska mobilizácia, informačný systém EPSIS, obranné plánovanie štátu, vecné plnenie a agenda utajovaných skutočností.",
    scope: "Regionálna pôsobnosť (v každom zo 4 regiónov pôsobia 2 špecialisti).",
    coveredIn: ["BB", "RA", "ZH", "BS", "VK", "LC", "PT", "RS"]
  },
  {
    id: "AG7",
    num: 7,
    name: "Bezpečnostné rady a krízové štáby",
    shortName: "BR & Krízové štáby",
    color: "#1e3a8a", // Navy Command
    type: "KRAJ",
    fteTotal: 1,
    badgeBg: "bg-blue-50 text-blue-900 border-blue-200",
    desc: "Bezpečnostné rady, Krízový štáb okresného úradu v sídle kraja, hlavná plánovacia a vyhodnocovacia činnosť (dokumentácia), pandemické stredisko, zvolávanie zasadnutí, príprava zápisov a uznesení, strategické rozhodovanie.",
    scope: "Celokrajská pôsobnosť (výlučne dislokované v sídle kraja BB).",
    coveredIn: ["BB"]
  }
];

if (typeof window !== 'undefined') {
  window.AGENDAS = AGENDAS;
}
