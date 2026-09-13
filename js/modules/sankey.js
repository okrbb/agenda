/* =========================================================================
   SANKEY DIAGRAM MODULE (PLOTLY.JS)
   Vizualizácia toku personálnych kapacít z odborných agend do okresov
   ========================================================================= */

let sankeyDisplayMode = 'three-tier'; // 'three-tier' | 'direct'

/**
 * Zarovnanie textových štítkov NAD uzly, aby sa neprekrývali s tokom ("hadmi").
 */
function alignSankeyLabels() {
  const gd = document.getElementById('plotlySankey');
  if (!gd) return;
  const nodes = gd.querySelectorAll('.sankey-node');
  if (!nodes || nodes.length === 0) return;

  nodes.forEach(node => {
    const rect = node.querySelector('rect');
    const label = node.querySelector('.node-label') || node.querySelector('text');
    if (!label) return;

    const rectWidth = rect ? parseFloat(rect.getAttribute('width') || '24') : 24;
    const rectHeight = rect ? parseFloat(rect.getAttribute('height') || '24') : 24;
    const centerX = rectWidth / 2;
    const centerY = rectHeight / 2 + 2;

    const text = (label.textContent || '').trim();
    const isAgenda = /^AG\d/i.test(text);
    const isRegion = /^(SEVER|ZÁPAD|JUH|VÝCHOD)/i.test(text);
    const isDistrict = /^(BB|BR|RA|ZV|ZC|ZH|BS|KA|VK|LC|DT|PT|RS)/i.test(text);

    // 1. Popis agendy (AG1 - AG7) -> PRED UZLOM (vľavo)
    if (isAgenda) {
      label.setAttribute('x', 0);
      label.setAttribute('y', 0);
      label.setAttribute('text-anchor', 'end');
      label.style.textAnchor = 'end';
      label.setAttribute('transform', `translate(-10, ${centerY})`);

      label.querySelectorAll('tspan').forEach(tspan => {
        tspan.setAttribute('x', 0);
        tspan.setAttribute('y', 0);
        tspan.setAttribute('text-anchor', 'end');
        tspan.style.textAnchor = 'end';
        tspan.setAttribute('transform', `translate(-10, ${centerY})`);
      });
      return;
    }

    // 2. Popis regiónu (SEVER, ZÁPAD, JUH, VÝCHOD) -> NAD UZLOM
    if (isRegion) {
      label.setAttribute('x', 0);
      label.setAttribute('y', 0);
      label.setAttribute('text-anchor', 'middle');
      label.style.textAnchor = 'middle';
      label.setAttribute('transform', `translate(${centerX}, -8)`);

      label.querySelectorAll('tspan').forEach(tspan => {
        tspan.setAttribute('x', 0);
        tspan.setAttribute('y', 0);
        tspan.setAttribute('text-anchor', 'middle');
        tspan.style.textAnchor = 'middle';
        tspan.setAttribute('transform', `translate(${centerX}, -8)`);
      });
      return;
    }

    // 3. Popis okresu -> ZA UZLOM (vpravo)
    if (isDistrict) {
      label.setAttribute('x', 0);
      label.setAttribute('y', 0);
      label.setAttribute('text-anchor', 'start');
      label.style.textAnchor = 'start';
      label.setAttribute('transform', `translate(${rectWidth + 10}, ${centerY})`);

      label.querySelectorAll('tspan').forEach(tspan => {
        tspan.setAttribute('x', 0);
        tspan.setAttribute('y', 0);
        tspan.setAttribute('text-anchor', 'start');
        tspan.style.textAnchor = 'start';
        tspan.setAttribute('transform', `translate(${rectWidth + 10}, ${centerY})`);
      });
    }
  });
}

function renderSankey() {
  if (typeof Plotly === 'undefined') {
    setTimeout(() => {
      if (typeof Plotly !== 'undefined') {
        renderSankey();
      }
    }, 200);
    return;
  }
  if (sankeyDisplayMode === 'three-tier') {
    render3TierSankey();
  } else {
    renderDirectSankey();
  }
}

function render3TierSankey() {
  const labels = [
    "AG1", "AG5", "AG7",
    "AG2", "AG3", "AG4", "AG6",
    "SEVER", "ZÁPAD", "JUH", "VÝCHOD",
    "BB", "BR", "RA",
    "ZV", "ZC", "ZH", "BS",
    "KA", "VK", "LC", "RS",
    "DT", "PT"
  ];

  const nodeColors = [
    "#c00000", "#990000", "#7a0016",
    "#66a344", "#2e75b6", "#c55a11", "#7030a0",
    "#4F6228", "#7c3aed", "#984806", "#215868",
    "#334155", "#475569", "#64748b",
    "#334155", "#475569", "#64748b", "#94a3b8",
    "#475569", "#1e293b", "#334155", "#334155",
    "#475569", "#64748b"
  ];

  const sources = [];
  const targets = [];
  const values = [];
  const linkColors = [];
  const customHover = [];

  // AG1 (2): SEVER (2)
  sources.push(0); targets.push(7); values.push(2); linkColors.push(hexToRgba("#c00000", 0.6));
  customHover.push("AG1 → SEVER: 2 FTE");

  // AG5 (2): 1 do SEVER, 1 do ZÁPAD
  sources.push(1, 1); targets.push(7, 8); values.push(1, 1);
  linkColors.push(hexToRgba("#990000", 0.6), hexToRgba("#990000", 0.6));
  customHover.push("AG5 → SEVER: 1 FTE", "AG5 → ZÁPAD: 1 FTE");

  // AG7 (1): 1 do SEVER
  sources.push(2); targets.push(7); values.push(1);
  linkColors.push(hexToRgba("#7a0016", 0.6));
  customHover.push("AG7 → SEVER: 1 FTE");

  // AG2 (8): 2 do každého zo 4 regiónov
  sources.push(3, 3, 3, 3); targets.push(7, 8, 9, 10); values.push(2, 2, 2, 2);
  linkColors.push(hexToRgba("#66a344", 0.6), hexToRgba("#66a344", 0.6), hexToRgba("#66a344", 0.6), hexToRgba("#66a344", 0.6));
  customHover.push("AG2 → SEVER: 2 FTE", "AG2 → ZÁPAD: 2 FTE", "AG2 → JUH: 2 FTE", "AG2 → VÝCHOD: 2 FTE");

  // AG3 (8): 2 do každého
  sources.push(4, 4, 4, 4); targets.push(7, 8, 9, 10); values.push(2, 2, 2, 2);
  linkColors.push(hexToRgba("#2e75b6", 0.6), hexToRgba("#2e75b6", 0.6), hexToRgba("#2e75b6", 0.6), hexToRgba("#2e75b6", 0.6));
  customHover.push("AG3 → SEVER: 2 FTE", "AG3 → ZÁPAD: 2 FTE", "AG3 → JUH: 2 FTE", "AG3 → VÝCHOD: 2 FTE");

  // AG4 (8): 2 do každého
  sources.push(5, 5, 5, 5); targets.push(7, 8, 9, 10); values.push(2, 2, 2, 2);
  linkColors.push(hexToRgba("#c55a11", 0.6), hexToRgba("#c55a11", 0.6), hexToRgba("#c55a11", 0.6), hexToRgba("#c55a11", 0.6));
  customHover.push("AG4 → SEVER: 2 FTE", "AG4 → ZÁPAD: 2 FTE", "AG4 → JUH: 2 FTE", "AG4 → VÝCHOD: 2 FTE");

  // AG6 (8): 2 do každého
  sources.push(6, 6, 6, 6); targets.push(7, 8, 9, 10); values.push(2, 2, 2, 2);
  linkColors.push(hexToRgba("#7030a0", 0.6), hexToRgba("#7030a0", 0.6), hexToRgba("#7030a0", 0.6), hexToRgba("#7030a0", 0.6));
  customHover.push("AG6 → SEVER: 2 FTE", "AG6 → ZÁPAD: 2 FTE", "AG6 → JUH: 2 FTE", "AG6 → VÝCHOD: 2 FTE");

  // Úroveň 2: Regióny → Okresy
  const distIndex = {
    BB: 11, BR: 12, RA: 13,
    ZV: 14, ZC: 15, ZH: 16, BS: 17,
    KA: 18, VK: 19, LC: 20, RS: 21,
    DT: 22, PT: 23
  };

  const regionDistFlows = [
    // SEVER (7)
    { from: 7, to: "BB", ag: "AG1", col: "#c00000" },
    { from: 7, to: "BB", ag: "AG2", col: "#66a344" },
    { from: 7, to: "BB", ag: "AG3", col: "#2e75b6" },
    { from: 7, to: "BB", ag: "AG4", col: "#c55a11" },
    { from: 7, to: "BB", ag: "AG5", col: "#990000" },
    { from: 7, to: "BB", ag: "AG6", col: "#7030a0" },
    { from: 7, to: "BB", ag: "AG7", col: "#7a0016" },

    { from: 7, to: "BR", ag: "AG1", col: "#c00000" },
    { from: 7, to: "BR", ag: "AG2", col: "#66a344" },
    { from: 7, to: "BR", ag: "AG3", col: "#2e75b6" },

    { from: 7, to: "RA", ag: "AG4", col: "#c55a11" },
    { from: 7, to: "RA", ag: "AG6", col: "#7030a0" },

    // ZÁPAD (8)
    { from: 8, to: "ZV", ag: "AG2", col: "#66a344" },
    { from: 8, to: "ZV", ag: "AG3", col: "#2e75b6" },
    { from: 8, to: "ZV", ag: "AG5", col: "#990000" },

    { from: 8, to: "ZC", ag: "AG2", col: "#66a344" },
    { from: 8, to: "ZC", ag: "AG4", col: "#c55a11" },

    { from: 8, to: "ZH", ag: "AG3", col: "#2e75b6" },
    { from: 8, to: "ZH", ag: "AG6", col: "#7030a0" },

    { from: 8, to: "BS", ag: "AG4", col: "#c55a11" },
    { from: 8, to: "BS", ag: "AG6", col: "#7030a0" },

    // JUH (9)
    { from: 9, to: "KA", ag: "AG3", col: "#2e75b6" },
    { from: 9, to: "KA", ag: "AG4", col: "#c55a11" },

    { from: 9, to: "VK", ag: "AG2", col: "#66a344" },
    { from: 9, to: "VK", ag: "AG4", col: "#c55a11" },
    { from: 9, to: "VK", ag: "AG6", col: "#7030a0" },

    { from: 9, to: "LC", ag: "AG2", col: "#66a344" },
    { from: 9, to: "LC", ag: "AG3", col: "#2e75b6" },
    { from: 9, to: "LC", ag: "AG6", col: "#7030a0" },

    // VÝCHOD (10)
    { from: 10, to: "RS", ag: "AG2", col: "#66a344" },
    { from: 10, to: "RS", ag: "AG3", col: "#2e75b6" },
    { from: 10, to: "RS", ag: "AG4", col: "#c55a11" },
    { from: 10, to: "RS", ag: "AG6", col: "#7030a0" },

    { from: 10, to: "DT", ag: "AG2", col: "#66a344" },
    { from: 10, to: "DT", ag: "AG3", col: "#2e75b6" },

    { from: 10, to: "PT", ag: "AG4", col: "#c55a11" },
    { from: 10, to: "PT", ag: "AG6", col: "#7030a0" }
  ];

  regionDistFlows.forEach(f => {
    sources.push(f.from);
    targets.push(distIndex[f.to]);
    values.push(1);
    linkColors.push(hexToRgba(f.col, 0.58));
    customHover.push(`${f.ag} → Okres ${f.to} (1 FTE)`);
  });

  const nodeX = [
    0, 0, 0, 0, 0, 0, 0,
    0.5, 0.5, 0.5, 0.5,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
  ];
  const nodeY = [
    0.03, 0.08, 0.13, 0.28, 0.48, 0.68, 0.88,
    0.18, 0.42, 0.66, 0.90,
    0.06, 0.13, 0.20, 0.27, 0.34, 0.41, 0.48, 0.55, 0.62, 0.69, 0.76, 0.83, 0.90
  ];

  const data = [{
    type: "sankey",
    orientation: "h",
    arrangement: "freeform",
    node: {
      pad: 22,
      thickness: 28,
      x: nodeX,
      y: nodeY,
      line: { color: "#ffffff", width: 2 },
      label: labels,
      color: nodeColors,
      hovertemplate: '<b>%{label}</b><br>Kapacita: %{value} FTE<extra></extra>'
    },
    link: {
      source: sources,
      target: targets,
      value: values,
      color: linkColors,
      customdata: customHover,
      hovertemplate: '%{customdata}<extra></extra>'
    }
  }];

  const layout = {
    font: { family: "Inter, sans-serif", size: 12, color: "#0f172a" },
    hoverlabel: {
      bgcolor: "#0f172a",
      bordercolor: "#38bdf8",
      font: { family: "Inter, sans-serif", size: 12, color: "#ffffff" }
    },
    margin: { l: 70, r: 90, t: 55, b: 25 },
    paper_bgcolor: "transparent",
    annotations: [
      {
        text: "<b>ODBORNÉ AGENDY</b>",
        x: 0,
        y: 1.05,
        xref: 'paper',
        yref: 'paper',
        showarrow: false,
        xanchor: 'center',
        font: { size: 11, color: '#64748b', family: 'Inter, sans-serif' }
      },
      {
        text: "<b>ÚZEMNÉ REGIÓNY</b>",
        x: 0.5,
        y: 1.05,
        xref: 'paper',
        yref: 'paper',
        showarrow: false,
        xanchor: 'center',
        font: { size: 11, color: '#64748b', family: 'Inter, sans-serif' }
      },
      {
        text: "<b>OKRESNÉ PRACOVISKÁ</b>",
        x: 1,
        y: 1.05,
        xref: 'paper',
        yref: 'paper',
        showarrow: false,
        xanchor: 'center',
        font: { size: 11, color: '#64748b', family: 'Inter, sans-serif' }
      }
    ]
  };

  Plotly.newPlot('plotlySankey', data, layout, { responsive: true, displayModeBar: false }).then(() => {
    alignSankeyLabels();
    const gd = document.getElementById('plotlySankey');
    if (gd && !gd._hasAlignListener) {
      gd.on('plotly_afterplot', alignSankeyLabels);
      gd._hasAlignListener = true;
    }
  });
}

function renderDirectSankey() {
  const agLabels = AGENDAS.map(a => a.id);
  const distNames = [
    "BB", "BR", "RA",
    "ZV", "ZC", "ZH", "BS",
    "KA", "VK", "LC", "RS",
    "DT", "PT"
  ];
  const distKeys = ["BB", "BR", "RA", "ZV", "ZC", "ZH", "BS", "KA", "VK", "LC", "RS", "DT", "PT"];
  const labels = [...agLabels, ...distNames];

  const nodeColors = [
    "#c00000", "#66a344", "#2e75b6", "#c55a11", "#990000", "#7030a0", "#7a0016",
    "#4F6228", "#4F6228", "#4F6228",
    "#7c3aed", "#7c3aed", "#7c3aed", "#7c3aed",
    "#984806", "#984806", "#984806",
    "#215868", "#215868", "#215868"
  ];

  const sources = [];
  const targets = [];
  const values = [];
  const linkColors = [];
  const customHover = [];

  AGENDAS.forEach((ag, agIndex) => {
    ag.coveredIn.forEach(dKey => {
      const dIndex = distKeys.indexOf(dKey);
      if (dIndex >= 0) {
        sources.push(agIndex);
        targets.push(7 + dIndex);
        values.push(1);
        linkColors.push(hexToRgba(ag.color, 0.55));
        customHover.push(`Priamy tok: ${ag.id} (${ag.shortName}) → ${dKey} (1 FTE)`);
      }
    });
  });

  const nodeX = [
    0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
  ];
  const nodeY = [
    0.08, 0.20, 0.32, 0.44, 0.56, 0.68, 0.80,
    0.06, 0.13, 0.20, 0.27, 0.34, 0.41, 0.48, 0.55, 0.62, 0.69, 0.76, 0.83, 0.90
  ];

  const data = [{
    type: "sankey",
    orientation: "h",
    arrangement: "freeform",
    node: {
      pad: 22,
      thickness: 28,
      x: nodeX,
      y: nodeY,
      line: { color: "#ffffff", width: 2 },
      label: labels,
      color: nodeColors,
      hovertemplate: '<b>%{label}</b><br>Objem: %{value} FTE<extra></extra>'
    },
    link: {
      source: sources,
      target: targets,
      value: values,
      color: linkColors,
      customdata: customHover,
      hovertemplate: '%{customdata}<extra></extra>'
    }
  }];

  const layout = {
    font: { family: "Inter, sans-serif", size: 12, color: "#0f172a" },
    hoverlabel: {
      bgcolor: "#0f172a",
      bordercolor: "#38bdf8",
      font: { family: "Inter, sans-serif", size: 12, color: "#ffffff" }
    },
    margin: { l: 70, r: 90, t: 55, b: 25 },
    paper_bgcolor: "transparent",
    annotations: [
      {
        text: "<b>ODBORNÉ AGENDY (7)</b>",
        x: 0,
        y: 1.05,
        xref: 'paper',
        yref: 'paper',
        showarrow: false,
        xanchor: 'center',
        font: { size: 11, color: '#64748b', family: 'Inter, sans-serif' }
      },
      {
        text: "<b>OKRESNÉ PRACOVISKÁ (13)</b>",
        x: 1,
        y: 1.05,
        xref: 'paper',
        yref: 'paper',
        showarrow: false,
        xanchor: 'center',
        font: { size: 11, color: '#64748b', family: 'Inter, sans-serif' }
      }
    ]
  };

  Plotly.newPlot('plotlySankey', data, layout, { responsive: true, displayModeBar: false }).then(() => {
    alignSankeyLabels();
    const gd = document.getElementById('plotlySankey');
    if (gd && !gd._hasAlignListener) {
      gd.on('plotly_afterplot', alignSankeyLabels);
      gd._hasAlignListener = true;
    }
  });
}

function setSankeyMode(mode) {
  sankeyDisplayMode = mode;
  const btnTier3 = document.getElementById('btnSankeyTier3');
  const btnDirect = document.getElementById('btnSankeyDirect');

  if (btnTier3) {
    btnTier3.className = mode === 'three-tier'
      ? "px-3 py-1.5 rounded-md bg-white text-slate-800 shadow-sm font-semibold transition"
      : "px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 transition";
  }

  if (btnDirect) {
    btnDirect.className = mode === 'direct'
      ? "px-3 py-1.5 rounded-md bg-white text-slate-800 shadow-sm font-semibold transition"
      : "px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 transition";
  }

  renderSankey();
  showToast(`Zobrazenie: ${mode === 'three-tier' ? '3-úrovňový Sankey' : 'Priamy tok'}`, "info");
}

function resetSankeyView() {
  renderSankey();
  showToast("Diagram tokov bol obnovený.", "info");
}
