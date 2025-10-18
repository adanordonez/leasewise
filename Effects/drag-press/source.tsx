import { useRef, useState } from "react";
import { Gesture } from "./gesture";
import { grab } from "./grab";

export function DragPress({
  handleConflict = false,
  hint = true,
  threshold = 10,
  noEdge,
  color = "orange",
}: {
  handleConflict?: boolean;
  hint?: boolean;
  threshold?: number;
  noEdge?: boolean;
  color?: "orange" | "yellow";
}) {
  const [showHint, setShowHint] = useState(true);
  const [grow, setGrow] = useState(false);
  const { ref, animate, ...drag } = useDrag({
    threshold,
    onDragStart: () => {
      if (!noEdge) {
        grab.start();
      }
      setShowHint(false);
    },
    onDragEnd: () => {
      grab.end();
      animate({ x: 0, y: 0 });
    },
    noEdge,
    handleConflict,
  });

  return (
    <div className="flex justify-center">
      {/* @ts-expect-error */}
      <button
        ref={ref}
        className="w-20 h-20 rounded-full cursor-pointer active:scale-[0.96]"
        style={
          {
            background:
              grow || color === "yellow"
                ? "var(--color-yellow)"
                : "var(--color-orange)",
            "--transition": "unset",
            transition: "scale 200ms ease, var(--transition)",
          } as React.CSSProperties
        }
        onClick={() => setGrow(!grow)}
        {...drag}
      />
      {hint && <Gesture.Drag play={showHint} className="-mt-4" y="up" />}
    </div>
  );
}

interface UseDragOptions {
  onDragStart?: () => void;
  onDrag?: (translation: Point) => void;
  onDragEnd?: (translation: Point) => void;
  threshold: number; // Minimum movement before drag starts
  handleConflict?: boolean;
  noEdge?: boolean; // Disable edge detection
}

interface Point {
  x: number;
  y: number;
}

export function useDrag(options: UseDragOptions) {
  const ref = useRef<HTMLButtonElement>(null);
  const state = useRef<"idle" | "press" | "drag" | "drag-end">("idle");

  const origin = useRef<Point>({ x: 0, y: 0 });
  const translation = useRef<Point>({ x: 0, y: 0 });

  function set(position: Point) {
    if (ref.current) {
      translation.current = position;
      ref.current.style.translate = `${position.x}px ${position.y}px`;
    }
  }

  function animate(point: Point) {
    const el = ref.current;
    if (el === null) return;

    function listener(e: TransitionEvent) {
      if (e.propertyName === "translate") {
        translation.current = { x: 0, y: 0 };
        el?.style.setProperty("--transition", "");
      }
    }

    el.style.setProperty("--transition", "translate 350ms ease-in-out");
    el.addEventListener("transitionend", listener);
    set(point);
  }

  function onClick(e: MouseEvent) {
    if (options.handleConflict && state.current === "drag-end") {
      e.preventDefault();
      e.stopPropagation();
      state.current = "idle";
      ref.current?.removeEventListener("click", onClick);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    origin.current = { x: e.clientX, y: e.clientY };
    state.current = "press";
    if (!options.noEdge) {
      ref.current?.setPointerCapture(e.pointerId);
    }
    ref.current?.addEventListener("click", onClick);
  }

  function onPointerMove(e: PointerEvent) {
    if (state.current === "press") {
      const dx = e.clientX - origin.current.x;
      const dy = e.clientY - origin.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance >= options.threshold) {
        state.current = "drag";
        ref.current?.style.setProperty("--transition", "");
        options.onDragStart?.();
      }
    }

    if (state.current !== "drag") return;

    const currentPosition = { x: e.clientX, y: e.clientY };

    const dx = currentPosition.x - origin.current.x;
    const dy = currentPosition.y - origin.current.y;
    origin.current = currentPosition;

    const newTranslation = {
      x: translation.current.x + dx,
      y: translation.current.y + dy,
    };

    set(newTranslation);
    options.onDrag?.(translation.current);
  }

  function onPointerUp(e: PointerEvent) {
    if (state.current === "drag") {
      state.current = "drag-end";
    } else {
      state.current = "idle";
    }

    options.onDragEnd?.(translation.current);
    ref.current?.releasePointerCapture(e.pointerId);
  }

  return {
    ref,
    animate,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
