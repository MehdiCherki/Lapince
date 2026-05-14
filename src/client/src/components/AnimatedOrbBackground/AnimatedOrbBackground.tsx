import { useEffect, useState } from "react";

interface OrbPosition {
  x: number;
  y: number;
}

function randomPos(): OrbPosition {
  return {
    x: Math.random() * 70,
    y: Math.random() * 70,
  };
}

export function AnimatedOrbBackground() {
  const [orb1, setOrb1] = useState<OrbPosition>({ x: 5, y: 5 });
  const [orb2, setOrb2] = useState<OrbPosition>({ x: 60, y: 50 });

  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    const moveOrb1 = () => {
      setOrb1(randomPos());
      t1 = setTimeout(moveOrb1, 2000 + Math.random() * 3000);
    };

    const moveOrb2 = () => {
      setOrb2(randomPos());
      t2 = setTimeout(moveOrb2, 2500 + Math.random() * 3500);
    };

    t1 = setTimeout(moveOrb1, 1000);
    t2 = setTimeout(moveOrb2, 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute top-0 left-0 w-[65vw] h-[65vw] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,225,245,0.6) 40%, transparent 68%)",
          filter: "blur(35px)",
          transform: `translate(${orb1.x}vw, ${orb1.y}vh)`,
          transition: "transform 2.5s ease-in-out",
          willChange: "transform",
        }}
      />

      <div
        className="absolute top-0 left-0 w-[55vw] h-[55vw] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(67,140,202,0.7) 0%, rgba(30,80,140,0.4) 45%, transparent 68%)",
          filter: "blur(50px)",
          transform: `translate(${orb2.x}vw, ${orb2.y}vh)`,
          transition: "transform 3s ease-in-out",
          willChange: "transform",
        }}
      />
    </div>
  );
}
