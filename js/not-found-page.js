/**
 * Simphonia — Not Found page behaviours
 *
 * Handles the split-flap digits and the airplane animation for the SPA
 * not-found route. Safe to call multiple times; the page is only animated
 * while the not-found route is active.
 */

'use strict';

(function () {
  var planeRafId = null;
  var planeStartTimerId = null;
  var planeStartedAt = null;
  var globalsBound = false;

  function getPageRoot() {
    return document.querySelector('[data-page="not-found"]');
  }

  function isPageActive() {
    var root = getPageRoot();
    return !!root && root.style.display !== 'none';
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function stopPlane() {
    if (planeStartTimerId) {
      clearTimeout(planeStartTimerId);
      planeStartTimerId = null;
    }
    if (planeRafId) {
      cancelAnimationFrame(planeRafId);
      planeRafId = null;
    }
    planeStartedAt = null;
  }

  function startPlane() {
    var arc = document.getElementById('flightArc');
    var plane = document.getElementById('planeGroup');

    if (!arc || !plane || prefersReducedMotion() || !isPageActive() || planeRafId) {
      return;
    }

    var totalLen = arc.getTotalLength();
    var DURATION = 8500;
    var PAUSE_AT = 0.93;

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function tick(ts) {
      if (!isPageActive() || document.hidden || prefersReducedMotion()) {
        stopPlane();
        return;
      }

      if (!planeStartedAt) planeStartedAt = ts;

      var elapsed = (ts - planeStartedAt) % DURATION;
      var raw = elapsed / DURATION;
      var t = raw < PAUSE_AT ? raw / PAUSE_AT : 1.0;
      var dist = easeInOut(t) * totalLen;
      var p0 = arc.getPointAtLength(dist);
      var p1 = arc.getPointAtLength(Math.min(dist + 4, totalLen));
      var angle = Math.atan2(p1.y - p0.y, p1.x - p0.x) * (180 / Math.PI);

      plane.setAttribute(
        'transform',
        'translate(' + p0.x.toFixed(2) + ',' + p0.y.toFixed(2) + ') rotate(' + angle.toFixed(1) + ')'
      );

      planeRafId = requestAnimationFrame(tick);
    }

    planeRafId = requestAnimationFrame(tick);
  }

  function schedulePlaneStart(delay) {
    stopPlane();
    if (prefersReducedMotion() || !isPageActive()) return;

    planeStartTimerId = setTimeout(function () {
      planeStartTimerId = null;
      startPlane();
    }, delay || 0);
  }

  function initFlipBoard(root) {
    if (!root || root.dataset.notFoundFlipInit === 'true') return;
    root.dataset.notFoundFlipInit = 'true';

    var prefersReduced = prefersReducedMotion();
    var CHARS = '0123456789';

    root.querySelectorAll('.flip-cell').forEach(function (cell, i) {
      var target = cell.dataset.target;
      var span = cell.querySelector('span');
      if (!span) return;

      if (prefersReduced) {
        span.textContent = target;
        cell.classList.add('flip-cell--settled');
        return;
      }

      var totalFlips = 9 + i * 5;
      var count = 0;

      function doFlip(char) {
        span.style.transition = 'none';
        span.style.transform = 'rotateX(90deg)';
        span.style.opacity = '0';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            span.style.transition = 'transform 0.075s ease-out, opacity 0.075s ease-out';
            span.style.transform = 'rotateX(0deg)';
            span.style.opacity = '1';
            span.textContent = char;
          });
        });
      }

      setTimeout(function () {
        var ticker = setInterval(function () {
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
  }

  function bindGlobals() {
    if (globalsBound) return;
    globalsBound = true;

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopPlane();
        return;
      }
      if (isPageActive()) {
        schedulePlaneStart(150);
      }
    });

    document.addEventListener('simphonia:navigate', function (event) {
      if (!event.detail || event.detail.page !== 'not-found') {
        stopPlane();
        return;
      }
      schedulePlaneStart(3200);
    });

    var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', function (e) {
        if (e.matches) {
          stopPlane();
          var root = getPageRoot();
          if (root) {
            root.querySelectorAll('.flip-cell').forEach(function (cell) {
              var span = cell.querySelector('span');
              if (!span) return;
              span.textContent = cell.dataset.target || span.textContent;
              cell.classList.add('flip-cell--settled');
            });
          }
        } else if (isPageActive()) {
          schedulePlaneStart(200);
        }
      });
    }
  }

  function initNotFoundPage() {
    var root = getPageRoot();
    if (!root) return;

    bindGlobals();
    initFlipBoard(root);

    if (prefersReducedMotion()) {
      stopPlane();
      return;
    }

    schedulePlaneStart(3200);
  }

  window.initNotFoundPage = initNotFoundPage;
}());

