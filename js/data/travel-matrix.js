/* =========================================================================
   TRAVEL MATRIX & DISPATCH TACTICAL RULES
   Vzdialenosti a dojazdové časy medzi okresmi BBK
   ========================================================================= */

const RAW_TRAVEL_MATRIX = {
  BB: {
    BS: { km: 47, time: "0:45:00", fast: false, slow: false },
    BR: { km: 45, time: "0:45:00", fast: false, slow: false },
    DT: { km: 40, time: "0:40:00", fast: false, slow: false },
    KA: { km: 50, time: "0:45:00", fast: false, slow: false },
    LC: { km: 80, time: "1:00:00", fast: false, slow: false },
    PT: { km: 85, time: "1:05:00", fast: false, slow: false },
    RS: { km: 105, time: "1:20:00", fast: false, slow: false },
    RA: { km: 93, time: "1:30:00", fast: false, slow: true },
    VK: { km: 80, time: "1:15:00", fast: false, slow: false },
    ZV: { km: 22, time: "0:20:00", fast: true, slow: false },
    ZC: { km: 56, time: "0:40:00", fast: false, slow: false },
    ZH: { km: 42, time: "0:30:00", fast: true, slow: false }
  },
  BS: {
    KA: { km: 20, time: "0:25:00", fast: true, slow: false }
  },
  BR: {
    DT: { km: 54, time: "0:54:00", fast: false, slow: false },
    PT: { km: 60, time: "1:05:00", fast: false, slow: false },
    RS: { km: 70, time: "1:15:00", fast: false, slow: false },
    RA: { km: 50, time: "0:53:00", fast: false, slow: false },
    ZV: { km: 64, time: "1:00:00", fast: false, slow: false }
  },
  DT: {
    LC: { km: 39, time: "0:30:00", fast: true, slow: false },
    PT: { km: 46, time: "0:35:00", fast: true, slow: false },
    RS: { km: 64, time: "0:50:00", fast: false, slow: false },
    VK: { km: 60, time: "0:55:00", fast: false, slow: false }
  },
  KA: {
    LC: { km: 83, time: "1:15:00", fast: false, slow: false },
    VK: { km: 41, time: "0:45:00", fast: false, slow: false }
  },
  LC: {
    PT: { km: 20, time: "0:20:00", fast: true, slow: false },
    RS: { km: 31, time: "0:30:00", fast: true, slow: false }
  },
  PT: {
    RS: { km: 26, time: "0:30:00", fast: true, slow: false },
    RA: { km: 62, time: "1:05:00", fast: false, slow: false }
  },
  RA: {
    PT: { km: 62, time: "1:05:00", fast: false, slow: false },
    RS: { km: 58, time: "1:00:00", fast: false, slow: false }
  },
  VK: {
    LC: { km: 36, time: "0:35:00", fast: true, slow: false }
  },
  ZV: {
    BS: { km: 33, time: "0:35:00", fast: true, slow: false },
    DT: { km: 29, time: "0:30:00", fast: true, slow: false },
    KA: { km: 30, time: "0:30:00", fast: true, slow: false },
    LC: { km: 60, time: "0:40:00", fast: false, slow: false },
    VK: { km: 60, time: "1:10:00", fast: false, slow: false },
    ZC: { km: 42, time: "0:30:00", fast: true, slow: false },
    ZH: { km: 25, time: "0:20:00", fast: true, slow: false }
  },
  ZC: {
    BS: { km: 22, time: "0:30:00", fast: true, slow: false },
    ZH: { km: 20, time: "0:15:00", fast: true, slow: false }
  },
  ZH: {
    BS: { km: 35, time: "0:35:00", fast: true, slow: false }
  }
};

const ORDERED_COLS = ["BS", "BR", "DT", "KA", "LC", "PT", "RS", "RA", "VK", "ZV", "ZC", "ZH"];
const ORDERED_ROWS = ["BB", "BS", "BR", "DT", "KA", "LC", "PT", "RA", "RS", "VK", "ZV", "ZC", "ZH"];

const DISPATCH_TACTICAL_RULES = {
  KA: {
    decision: "AKTIVOVAŤ BANSKÚ ŠTIAVNICU (25 min) ALEBO ZVOLEN (30 min)",
    primaryDistrict: "BS",
    reason: "1. najbližší: Banská Štiavnica (25 min, 20 km, ZÁPAD) | 2. najbližší: Zvolen (30 min, 30 km, ZÁPAD). Dojazd z vlastného okresu Lučenec trvá až 1:15 h (83 km)."
  },
  RA: {
    decision: "AKTIVOVAŤ BREZNO (53 min) ALEBO RIMAVSKÚ SOBOTU (1:00 h)",
    primaryDistrict: "BR",
    reason: "1. najbližší: Brezno (53 min, 50 km, SEVER) | 2. najbližší: Rimavská Sobota (1:00 h, 58 km, VÝCHOD). Sídlo kraja Banská Bystrica má kritický dojazd až 1:30 h (93 km)."
  },
  BS: {
    decision: "AKTIVOVAŤ KRUPINU (25 min, JUH) ALEBO ŽARNOVICU (30 min, ZÁPAD)",
    primaryDistrict: "KA",
    reason: "1. najbližší: Krupina (25 min, 20 km, JUH) | 2. najbližší: Žarnovica (30 min, 22 km, ZÁPAD) / Zvolen (35 min, 33 km, ZÁPAD)."
  },
  DT: {
    decision: "AKTIVOVAŤ ZVOLEN (30 min, ZÁPAD) ALEBO LUČENEC (30 min, JUH)",
    primaryDistrict: "ZV",
    reason: "1. najbližší: Zvolen (30 min, 29 km, ZÁPAD) a Lučenec (30 min, 39 km, JUH) | 2. najbližší: Poltár (35 min, 46 km, VÝCHOD). Dojazd z Rimavskej Soboty trvá 50 minút (64 km)."
  },
  PT: {
    decision: "AKTIVOVAŤ LUČENEC (20 min, JUH)",
    primaryDistrict: "LC",
    reason: "1. najbližší: Lučenec (20 min, 20 km, JUH) | 2. najbližší: Rimavská Sobota (30 min, 26 km, VÝCHOD) / Detva (35 min, 46 km, VÝCHOD)."
  },
  ZC: {
    decision: "ŠTANDARDNÉ NASADENIE V RÁMCI REGIÓNU - ŽIAR NAD HRONOM (15 min)",
    primaryDistrict: "ZH",
    reason: "1. najbližší: Žiar nad Hronom (15 min, 20 km, ZÁPAD) | 2. najbližší: Banská Štiavnica (30 min, 22 km, ZÁPAD) a Zvolen (30 min, 42 km, ZÁPAD)."
  },
  ZH: {
    decision: "ŠTANDARDNÉ NASADENIE V RÁMCI REGIÓNU - ŽARNOVICA (15 min) / ZVOLEN (20 min)",
    primaryDistrict: "ZC",
    reason: "1. najbližší: Žarnovica (15 min, 20 km, ZÁPAD) | 2. najbližší: Zvolen (20 min, 25 km, ZÁPAD) / Banská Bystrica (30 min, 42 km, SEVER)."
  },
  ZV: {
    decision: "AKTIVOVAŤ SÍDLO KRAJA BANSKÁ BYSTRICA (20 min) ALEBO ŽIAR (20 min)",
    primaryDistrict: "BB",
    reason: "1. najbližší: Banská Bystrica (20 min, 22 km, SEVER) | 2. najbližší: Žiar nad Hronom (20 min, 25 km, ZÁPAD) / Žarnovica, Detva, Krupina (všetky 30 min)."
  },
  BB: {
    decision: "AKTIVOVAŤ ZVOLEN (20 min, ZÁPAD)",
    primaryDistrict: "ZV",
    reason: "1. najbližší: Zvolen (20 min, 22 km, ZÁPAD) | 2. najbližší: Žiar nad Hronom (30 min, 42 km, ZÁPAD) / Žarnovica (40 min, 56 km, ZÁPAD)."
  },
  BR: {
    decision: "ŠTANDARDNÉ NASADENIE SÍDLA KRAJA - BANSKÁ BYSTRICA (45 min)",
    primaryDistrict: "BB",
    reason: "1. najbližší: Banská Bystrica (45 min, 45 km, SEVER) | 2. najbližší: Revúca (53 min, 50 km, SEVER) / Detva (54 min, 54 km, VÝCHOD)."
  },
  VK: {
    decision: "ŠTANDARDNÉ NASADENIE V RÁMCI REGIÓNU - LUČENEC (35 min)",
    primaryDistrict: "LC",
    reason: "1. najbližší: Lučenec (35 min, 36 km, JUH) | 2. najbližší: Krupina (45 min, 41 km, JUH) / Detva (55 min, 60 km, VÝCHOD)."
  },
  LC: {
    decision: "AKTIVOVAŤ POLTÁR (20 min, VÝCHOD) ALEBO RIMAVSKÚ SOBOTU (30 min)",
    primaryDistrict: "PT",
    reason: "1. najbližší: Poltár (20 min, 20 km, VÝCHOD) | 2. najbližší: Detva (30 min, 39 km, VÝCHOD) a Rimavská Sobota (30 min, 31 km, VÝCHOD)."
  },
  RS: {
    decision: "AKTIVOVAŤ POLTÁR (30 min, VÝCHOD) ALEBO LUČENEC (30 min, JUH)",
    primaryDistrict: "PT",
    reason: "1. najbližší: Poltár (30 min, 26 km, VÝCHOD) a Lučenec (30 min, 31 km, JUH) | 2. najbližší: Detva (50 min, 64 km, VÝCHOD) a Revúca (1:00 h, 58 km, SEVER)."
  }
};
