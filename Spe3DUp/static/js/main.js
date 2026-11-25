// Interactive tabs, latency inspector, click-to-zoom lightbox, and BibTeX copy.

document.addEventListener("DOMContentLoaded", () => {
  // 1. Tab Groups (Qualitative & Quantitative)
  document.querySelectorAll("[data-tab-group]").forEach((group) => {
    const buttons = group.querySelectorAll(".tab-btn");
    const panels = group.querySelectorAll(".tab-panel");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-tab-target");
        buttons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });
        panels.forEach((p) => {
          p.classList.toggle("is-active", p.getAttribute("data-tab-panel") === target);
        });
      });
    });
  });

  // 2. Interactive Latency Breakdown Inspector
  const latencyConfigs = [
    {
      id: "teacher",
      name: "Original Teacher (50/50, serial)",
      coarse: 19.9,
      refine: 360.5,
      decode: 143.0,
      remesh: 53.2,
      total: 576.6,
      speedup: "1.00×",
      note: "Diffusion sampling dominates (380.4s, 66% of end-to-end latency) under 50-step CFG sampling."
    },
    {
      id: "serial",
      name: "Spe3DUp 10/5 + Original Decoding & Serial Remesh",
      coarse: 2.0,
      refine: 18.2,
      decode: 143.1,
      remesh: 53.2,
      total: 216.5,
      speedup: "2.66×",
      note: "FTD cuts DiT sampling by 18.88× (380.4s → 20.2s), shifting 91% of latency to geometry decoding and serial QEM."
    },
    {
      id: "parallel",
      name: "Spe3DUp 10/5 + Parallel QEM Remesh (16 workers)",
      coarse: 2.0,
      refine: 18.2,
      decode: 138.8,
      remesh: 7.8,
      total: 166.8,
      speedup: "3.46×",
      note: "Region-parallel QEM simplification reduces remeshing from 53.2s to 7.8s (6.83× faster)."
    },
    {
      id: "full",
      name: "Spe3DUp Full System (10/5 + Fast Decoding + Parallel QEM)",
      coarse: 2.0,
      refine: 18.2,
      decode: 46.5,
      remesh: 7.8,
      total: 74.5,
      speedup: "7.74×",
      note: "Hierarchical coarse queries + cross-resolution field reuse with critical-region recomputation unlock the full 7.74× speedup."
    }
  ];

  const detailBox = document.getElementById("latency-detail");
  const rows = document.querySelectorAll(".latency-row");

  function selectLatency(id) {
    const cfg = latencyConfigs.find((c) => c.id === id);
    if (!cfg || !detailBox) return;
    rows.forEach((r) => r.classList.toggle("is-selected", r.getAttribute("data-latency-id") === id));
    detailBox.innerHTML = `
      <div><strong>${cfg.name}</strong>: ${cfg.note}</div>
      <div>
        Coarse DiT <strong>${cfg.coarse.toFixed(1)}s</strong> ·
        Refine DiT <strong>${cfg.refine.toFixed(1)}s</strong> ·
        Decode+other <strong>${cfg.decode.toFixed(1)}s</strong> ·
        Remesh <strong>${cfg.remesh.toFixed(1)}s</strong>
      </div>
    `;
  }

  rows.forEach((row) => {
    row.addEventListener("click", () => selectLatency(row.getAttribute("data-latency-id")));
    row.addEventListener("mouseenter", () => selectLatency(row.getAttribute("data-latency-id")));
  });
  selectLatency("full");

  // 3. Click-to-Zoom Lightbox for Figures
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCap = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");

  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    if (lightboxCap) lightboxCap.textContent = alt || "";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-zoomable]").forEach((img) => {
    img.addEventListener("click", () => {
      openLightbox(img.getAttribute("src"), img.getAttribute("data-caption") || img.getAttribute("alt"));
    });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  // 4. Copy BibTeX Button
  const copyBtn = document.getElementById("copy-bibtex");
  const bibtexEl = document.getElementById("bibtex-code");
  if (copyBtn && bibtexEl) {
    copyBtn.addEventListener("click", async () => {
      const text = bibtexEl.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy BibTeX";
        }, 1800);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(bibtexEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
        sel.removeAllRanges();
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = "Copy BibTeX";
        }, 1800);
      }
    });
  }

  // 5. Scroll-Spy for Sticky Nav Links
  const navLinks = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = "#" + entry.target.id;
            navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === id));
          }
        });
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    sections.forEach((sec) => observer.observe(sec));
  }
});
