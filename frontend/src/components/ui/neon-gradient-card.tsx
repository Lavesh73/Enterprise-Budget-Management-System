import React from "react";
import { cn } from "@/lib/utils";

export const NeonGradientCard = ({
  className,
  children,
  borderSize = 4,
  borderRadius = 24,
  neonColors = {
    firstColor: "#ff00aa",
    secondColor: "#00FFF1",
  },
  ...props
}) => {
  return (
    <div
      style={{
        "--border-size": `${borderSize}px`,
        "--border-radius": `${borderRadius}px`,
        "--neon-first": neonColors.firstColor,
        "--neon-second": neonColors.secondColor,
      }}
      className={cn("neon-gradient-card", className)}
      {...props}
    >
      <div className="neon-gradient-card-inner">
        {children}
      </div>
    </div>
  );
};
