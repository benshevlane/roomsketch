interface LogoProps {
  className?: string;
  size?: number;
}

export default function FreeRoomPlannerLogo({ className = "", size = 28 }: LogoProps) {
  return (
    <img
      src="/logo.jpg"
      alt="Free Room Planner"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
