export interface DiagramProps {
  svg: string;
}
export const Diagram = (props: DiagramProps) => {
  return (
    <div
      style={{
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{ width: "50vw", maxWidth: 1024, maxHeight: 1024 }}
        dangerouslySetInnerHTML={{ __html: props.svg }}
      />
    </div>
  );
};
