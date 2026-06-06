import React, { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NeonColorsProps {
  firstColor: string;
  secondColor: string;
}

interface NeonGradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: ReactNode;
  borderSize?: number;
  borderRadius?: number;
  neonColors?: NeonColorsProps;
}

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
}: NeonGradientCardProps) => {
  const cardStyle = {
    "--border-size": `${borderSize}px`,
    "--border-radius": `${borderRadius}px`,
    "--neon-first": neonColors.firstColor,
    "--neon-second": neonColors.secondColor,
  } as CSSProperties;

  return (
    <div
      style={cardStyle}
      className={cn("neon-gradient-card", className)}
      {...props}
    >
      <div className="neon-gradient-card-inner">
        {children}
      </div>
    </div>
  );
};
