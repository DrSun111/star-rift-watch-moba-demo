import { AbilityDefinition } from "../game/core/types";

interface SkillIconProps {
  icon: AbilityDefinition["icon"];
  className?: string;
}

const paths: Record<AbilityDefinition["icon"], string[]> = {
  blade: ["M28 6 L38 16 L24 44 L14 50 L18 36 Z", "M36 8 L47 17 L32 49 L24 54 L29 37 Z"],
  spin: ["M32 8 A24 24 0 1 1 12 21", "M12 21 L9 9 L22 14", "M32 56 A24 24 0 1 1 52 43", "M52 43 L55 55 L42 50"],
  guard: ["M32 7 L52 15 L49 33 C47 45 39 53 32 57 C25 53 17 45 15 33 L12 15 Z", "M32 16 L32 49"],
  nova: ["M32 5 L37 24 L57 20 L41 33 L52 51 L32 40 L12 51 L23 33 L7 20 L27 24 Z"],
  orb: ["M32 10 A22 22 0 1 0 32 54 A22 22 0 1 0 32 10", "M16 32 H48", "M32 16 V48"],
  vines: ["M14 52 C20 38 17 25 31 12", "M32 54 C32 38 44 31 48 14", "M23 31 C17 28 14 24 12 18", "M40 34 C48 34 52 29 54 22"],
  blink: ["M12 36 L31 10 L29 27 L52 27 L32 55 L35 38 Z"],
  storm: ["M16 27 C18 12 42 9 48 24 C58 30 51 49 36 48 C25 58 7 46 16 27", "M24 32 C31 26 39 28 43 35", "M21 42 C29 35 40 38 46 45"],
  charge: ["M9 35 L35 9 L52 26 L26 52 Z", "M22 35 L35 22 L42 29 L29 42 Z"],
  shield: ["M16 16 L32 8 L48 16 L48 31 C48 44 39 53 32 57 C25 53 16 44 16 31 Z", "M21 32 H43"],
  quake: ["M8 45 H23 L27 35 L35 51 L41 32 L48 45 H56", "M18 24 L28 14 L37 25 L46 14"],
  domain: ["M32 7 A25 25 0 1 0 32 57 A25 25 0 1 0 32 7", "M13 32 H51", "M32 13 V51", "M20 20 L44 44", "M44 20 L20 44"],
  veil: ["M9 37 C17 17 47 17 55 37", "M15 39 C24 48 40 48 49 39", "M24 32 A8 8 0 1 0 40 32 A8 8 0 1 0 24 32", "M32 25 V39"],
  erase: ["M12 14 H52 L48 55 H16 Z", "M22 22 H42", "M24 31 H40", "M26 40 H38", "M19 9 L45 9"],
  fatal: ["M32 6 L38 26 L58 32 L38 38 L32 58 L26 38 L6 32 L26 26 Z", "M22 22 L42 42", "M42 22 L22 42"],
  convert: ["M13 16 H51 V32 C51 45 42 54 32 58 C22 54 13 45 13 32 Z", "M22 31 H42", "M32 21 V43", "M45 13 L55 9 L51 19"],
  repair: ["M19 46 L45 20", "M22 17 L47 42", "M14 50 L22 58 L51 29 L43 21 Z", "M28 12 H36 V24 H48 V32 H36 V44 H28 V32 H16 V24 H28 Z"]
};

export function SkillIcon({ icon, className }: SkillIconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id={`skill-${icon}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff8bd" />
          <stop offset="52%" stopColor="#63eaff" />
          <stop offset="100%" stopColor="#17365d" />
        </radialGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="12" fill={`url(#skill-${icon})`} opacity="0.2" />
      {paths[icon].map((path, index) => (
        <path
          key={path}
          d={path}
          fill={index === 0 ? "none" : "rgba(255,255,255,0.18)"}
          stroke={index === 0 ? "#f8d77c" : "#77f2ff"}
          strokeWidth={index === 0 ? 4.2 : 3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
