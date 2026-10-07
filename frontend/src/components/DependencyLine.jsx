import { Line } from "@react-three/drei";

function DependencyLine({
  start,
  end,
  highlighted,
}) {
  return (
    <Line
      points={[start, end]}
      color={
        highlighted
          ? "yellow"
          : "cyan"
      }
      lineWidth={
        highlighted ? 5 : 1
      }
    />
  );
}

export default DependencyLine;