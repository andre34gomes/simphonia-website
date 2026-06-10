/**
 * 404 page animations — split-flap flip board + airplane flight path.
 * Respects prefers-reduced-motion: shows final state immediately if enabled.
 */
document.addEventListener('DOMContentLoaded', function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Split-flap flip board ── */
  const CHARS = '0123456789';
  document.querySelectorAll('.flip-cell').forEach(function (cell, i) {
    const target = cell.dataset.target;
    const span   = cell.querySelector('span');
    if (!span) return;

    /* Respect reduced-motion: show final value immediately */
    if (prefersReduced) {
      span.textContent = target;
      cell.classList.add('flip-cell--settled');
      return;
    }

    const totalFlips = 9 + i * 5;
    let count        = 0;

    /* Visual flip helper — micro rotateX animation per character change */
    function doFlip(char) {
      span.style.transition = 'none';
      span.style.transform  = 'rotateX(90deg)';
      span.style.opacity    = '0';
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          span.style.transition = 'transform 0.075s ease-out, opacity 0.075s ease-out';
          span.style.transform  = 'rotateX(0deg)';
          span.style.opacity    = '1';
          span.textContent      = char;
        });
      });
    }

    /* Stagger each digit slightly so they don't all land together */
    setTimeout(function () {
      const ticker = setInterval(function () {
        count++;
        if (count >= totalFlips) {
          doFlip(target);
          cell.classList.add('flip-cell--settled');
          clearInterval(ticker);
        } else {
          doFlip(CHARS[Math.floor(Math.random() * CHARS.length)]);
        }
      }, 75);
    }, i * 185);
  });

  /* ── 2. Airplane traverses the SVG flight arc ── */
  if (!prefersReduced) {
    const arc   = document.getElementById('flightArc');
    const plane = document.getElementById('planeGroup');

    if (arc && plane) {
      const totalLen = arc.getTotalLength();
      const DURATION = 8500;    /* ms per loop             */
      const PAUSE_AT = 0.93;    /* fraction before looping */
      let startTS    = null;
      let planeRafId = null;

      /* Ease-in-out curve */
      function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      }

      function tick(ts) {
        if (!startTS) startTS = ts;
        const elapsed = (ts - startTS) % DURATION;
        const raw     = elapsed / DURATION;
        const t       = raw < PAUSE_AT ? raw / PAUSE_AT : 1.0;
        const dist    = easeInOut(t) * totalLen;

        const p0    = arc.getPointAtLength(dist);
        const p1    = arc.getPointAtLength(Math.min(dist + 4, totalLen));
        const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI);

        plane.setAttribute('transform',
          'translate(' + p0.x.toFixed(2) + ',' + p0.y.toFixed(2) +
          ') rotate(' + angle.toFixed(1) + ')');

        planeRafId = requestAnimationFrame(tick);
      }

      function startPlane() {
        if (!planeRafId) planeRafId = requestAnimationFrame(tick);
      }

      function stopPlane() {
        if (planeRafId) { cancelAnimationFrame(planeRafId); planeRafId = null; }
      }

      // Pause/resume when tab visibility changes to save CPU
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { stopPlane(); startTS = null; }
        else { startPlane(); }
      });

      /* Wait for the path draw-on animation to finish before flying (≈3.2 s) */
      setTimeout(startPlane, 3200);
    }
  }
});
