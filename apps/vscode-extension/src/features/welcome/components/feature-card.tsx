import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  cost: string;
  level: string;
  onClick: () => void;
  styles: Record<string, React.CSSProperties>;
}

export function FeatureCard({ title, description, cost, level, onClick, styles }: FeatureCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      style={{
        ...styles.featureCard,
        ...(isHovered ? styles.featureCardHover : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3 style={styles.featureCardH3}>{title}</h3>
      <p style={styles.featureCardP}>
        {description}
        <br />
        <span style={styles.badge}>{cost}</span> <span style={styles.badge}>{level}</span>
      </p>
    </div>
  );
}
