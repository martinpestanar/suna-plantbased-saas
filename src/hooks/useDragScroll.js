import { useRef, useEffect } from 'react';

/**
 * useDragScroll — Hook de scroll táctil para escritorio
 * Comportamiento idéntico a iOS/Android:
 *   - Arrastre suave con el mouse (click + drag)
 *   - Inercia/momentum al soltar
 *   - Rueda del mouse como fallback
 *   - Sin scrollbars nativos (eliminados globalmente vía CSS)
 */
export function useDragScroll({ horizontal = false, vertical = true, stopPropagation = false } = {}) {
  const ref = useRef(null);
  const hRef = useRef(horizontal);
  const vRef = useRef(vertical);
  const spRef = useRef(stopPropagation);

  useEffect(() => {
    hRef.current = horizontal;
    vRef.current = vertical;
    spRef.current = stopPropagation;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Estado del arrastre
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollStartX = 0;
    let scrollStartY = 0;

    // Estado de inercia
    let velocityX = 0;
    let velocityY = 0;
    let hasMoved = false;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    let rafId = null;

    // ── Rueda del mouse: scroll suave sin conflictos ──────────────
    const onWheel = (e) => {
      if (spRef.current) e.stopPropagation();
      e.preventDefault();
      if (rafId) cancelAnimationFrame(rafId);
      if (vRef.current)   el.scrollTop  += e.deltaY;
      if (hRef.current) el.scrollLeft += e.deltaX || e.deltaY;
    };

    // ── Inicio del arrastre ───────────────────────────────────────
    const onMouseDown = (e) => {
      if (e.button !== 0) return; // Solo botón izquierdo
      if (spRef.current) e.stopPropagation();
      isDragging = true;
      hasMoved = false;
      if (rafId) cancelAnimationFrame(rafId);

      startX = e.clientX;
      startY = e.clientY;
      scrollStartX = el.scrollLeft;
      scrollStartY = el.scrollTop;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityX = 0;
      velocityY = 0;
    };

    // ── Movimiento ────────────────────────────────────────────────
    const onMouseMove = (e) => {
      if (!isDragging) return;
      if (spRef.current) e.stopPropagation();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Threshold for drag
      if (!hasMoved) {
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          hasMoved = true;
          el.classList.add('is-dragging');
        } else {
          return;
        }
      }

      const now = performance.now();
      const dt = now - lastTime;

      if (dt > 0) {
        velocityX = (e.clientX - lastX) / dt;
        velocityY = (e.clientY - lastY) / dt;
      }

      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = now;

      if (hRef.current) el.scrollLeft = scrollStartX - dx;
      if (vRef.current)   el.scrollTop  = scrollStartY - dy;
    };

    // ── Fin del arrastre → lanzar inercia ─────────────────────────
    const onMouseUp = (e) => {
      if (!isDragging) return;
      if (spRef.current) e.stopPropagation();
      isDragging = false;
      el.classList.remove('is-dragging');
      if (hasMoved) launchInertia();
    };

    // ── Inercia estilo iOS (deceleración exponencial) ─────────────
    const launchInertia = () => {
      const FRICTION = 0.92; // Factor de desaceleración (0.9 = rápido, 0.95 = lento)
      const MIN_VELOCITY = 0.05;

      const tick = () => {
        velocityX *= FRICTION;
        velocityY *= FRICTION;

        if (hRef.current) el.scrollLeft -= velocityX * 16;
        if (vRef.current)   el.scrollTop  -= velocityY * 16;

        if (Math.abs(velocityX) > MIN_VELOCITY || Math.abs(velocityY) > MIN_VELOCITY) {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);
    };

    // ── Si el mouse sale del elemento, parar sin inercia ─────────
    const onMouseLeave = (e) => {
      if (!isDragging) return;
      if (spRef.current) e.stopPropagation();
      isDragging = false;
      el.classList.remove('is-dragging');
      velocityX = 0;
      velocityY = 0;
    };

    // ── Prevenir comportamiento de "arrastrar imagen" del navegador ──
    const onDragStart = (e) => {
      if (spRef.current) e.stopPropagation();
      e.preventDefault();
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('dragstart', onDragStart);
    el.addEventListener('wheel', onWheel, { passive: false });

    el.style.cursor = 'grab';

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('dragstart', onDragStart);
      el.removeEventListener('wheel', onWheel);
    };
  }, [horizontal, vertical]);

  return ref;
}
