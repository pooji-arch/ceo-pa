import { useEffect, useRef } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";

/**
 * RotatingBadge3D
 * ----------------------------------------------------------------------
 * The app's logo mark (public/logo.png) itself is the rotating 3D object —
 * no enclosing shield/card shape covers it. It floats (with a gentle
 * vertical bob) above a small pedestal, with a soft ambient halo and
 * contact shadow beneath it.
 *
 * 3D mechanics:
 * - A thin front/back pair, offset on the Z axis and both showing the logo
 *   (the back copy is horizontally mirrored so it always reads correctly,
 *   never a blank reverse side), shares one `transform-style: preserve-3d`
 *   space with `backfaceVisibility: hidden` — so the continuous Y-axis spin
 *   genuinely flips between a real front and back, not a flat image rotating.
 * - Autorotation: one full revolution every 34s, linear easing, infinite
 *   loop (Framer Motion `animate`), so it reads as a real slow-turning 3D
 *   object rather than a gimmick.
 * - Interactivity: moving the mouse over the badge area layers an extra
 *   spring-eased rotateX/rotateY tilt on top of the autorotation; it eases
 *   back to neutral on mouse leave.
 * - A soft ambient halo glow and a ground-contact shadow both sit directly
 *   beneath the assembly (never offset sideways) and are synced to the
 *   vertical float bob, so the shadow always reads as falling straight down.
 */
export function RotatingBadge3D({ size = 260 }: { size?: number }) {
  const badgeAreaRef = useRef<HTMLDivElement>(null);

  // --- continuous slow vertical bob; also drives the ambient glow + ground shadow ---
  const bobY = useMotionValue(0);
  useEffect(() => {
    const controls = animate(bobY, [0, -12, 0], {
      duration: 5.5,
      repeat: Infinity,
      ease: "easeInOut",
    });
    return () => controls.stop();
  }, [bobY]);

  const shadowScale = useTransform(bobY, [-12, 0], [0.86, 1]);
  const shadowOpacity = useTransform(bobY, [-12, 0], [0.5, 0.85]);
  const haloOpacity = useTransform(bobY, [-12, 0], [0.55, 0.85]);

  // --- mouse-driven parallax tilt, layered on top of the autorotation ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rawTiltY = useTransform(mouseX, [-0.5, 0.5], [-18, 18]);
  const rawTiltX = useTransform(mouseY, [-0.5, 0.5], [16, -16]);
  const tiltY = useSpring(rawTiltY, { stiffness: 140, damping: 16, mass: 0.5 });
  const tiltX = useSpring(rawTiltX, { stiffness: 140, damping: 16, mass: 0.5 });

  function handlePointerMove(e: MouseEvent<HTMLDivElement>) {
    const el = badgeAreaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handlePointerLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const depth = Math.max(10, Math.round(size * 0.05));
  const logoSize = Math.round(size * 0.64);

  const pedestalWidth = Math.round(size * 0.58);
  const pedestalTopH = Math.round(size * 0.05);
  const pedestalBodyH = Math.round(size * 0.1);
  const totalHeight = Math.round(size * 1.34);

  const faceBase: CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  const logoStyle: CSSProperties = {
    width: logoSize,
    height: logoSize,
    objectFit: "contain",
    display: "block",
    filter: "drop-shadow(0 10px 20px rgba(36,17,71,0.4))",
  };

  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: size,
        height: totalHeight,
        margin: "0 auto",
      }}
    >
      {/* soft ambient halo behind the whole assembly */}
      <motion.div
        style={{
          position: "absolute",
          top: size * 0.28,
          left: "50%",
          width: size * 1.15,
          height: size * 1.15,
          marginLeft: -(size * 0.575),
          marginTop: -(size * 0.575),
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.07) 55%, transparent 75%)",
          filter: "blur(6px)",
          opacity: haloOpacity,
          pointerEvents: "none",
        }}
      />

      {/* ambient ground shadow */}
      <motion.div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 0,
          width: size * 0.72,
          height: size * 0.11,
          marginLeft: -(size * 0.36),
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(76,29,149,0.5), rgba(76,29,149,0) 72%)",
          filter: "blur(4px)",
          scale: shadowScale,
          opacity: shadowOpacity,
          pointerEvents: "none",
        }}
      />

      {/* pedestal the badge appears to float above */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: size * 0.09,
          width: pedestalWidth,
          marginLeft: -(pedestalWidth / 2),
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: pedestalWidth * 0.82,
            height: pedestalBodyH,
            margin: "0 auto",
            borderRadius: "0 0 12px 12px",
            background: "var(--brand-grad-raised)",
            boxShadow: "var(--shadow-3d-sm)",
          }}
        />
        <div
          style={{
            width: pedestalWidth,
            height: pedestalTopH,
            marginTop: -(pedestalTopH * 0.55),
            borderRadius: "50%",
            background: "linear-gradient(180deg, var(--color-violet-100) 0%, var(--color-violet-400) 100%)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 4px 10px -4px rgba(76,42,161,0.4)",
          }}
        />
      </div>

      {/* perspective root — this is the interactive "badge area" */}
      <div
        ref={badgeAreaRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          marginLeft: -(size / 2),
          width: size,
          height: size,
          perspective: size * 5,
        }}
      >
        {/* spin + bob layer: continuous slow autorotation, linear, infinite */}
        <motion.div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            y: bobY,
          }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
        >
          {/* tilt layer: mouse parallax, layered on top, eases back via spring */}
          <motion.div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              rotateX: tiltX,
              rotateY: tiltY,
            }}
          >
            {/* the logo itself is the rotating 3D object — front and back both show it
                (mirrored on the back so it always reads correctly, never a blank reverse) */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                transformStyle: "preserve-3d",
              }}
            >
              {/* back face */}
              <div style={{ ...faceBase, transform: `translateZ(-${depth / 2}px) rotateY(180deg)` }}>
                <img src="/logo.png" alt="" style={{ ...logoStyle, transform: "scaleX(-1)" }} draggable={false} />
              </div>

              {/* front face */}
              <div style={{ ...faceBase, transform: `translateZ(${depth / 2}px)` }}>
                <img src="/logo.png" alt="" style={logoStyle} draggable={false} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
