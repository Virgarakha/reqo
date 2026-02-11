import { useState } from "react";
import { Handle, Position } from "reactflow";

export default function CustomNode({ id, data }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data.label);

  const handleBlur = () => {
    setEditing(false);
    data.onChange(id, value);
  };

  const bg = data.isComment
    ? "#F2613F" // kuning comment
    : data.darkMode
    ? "#262626"
    : "#ffffff";

  const color = data.darkMode ? "white" : "#111";

  return (
    <div
      onDoubleClick={() => setEditing(true)}
      style={{
        padding: 12,
        borderRadius: 12,
        background: bg,
        color,
        textAlign: "center",
        minWidth: 160,
        border: data.selected ? "1px solid #F2613F" : "1px solid #8882",
        transition: "0.2s",
      }}
    >
      {editing ? (
        <textarea
          value={value}
          autoFocus
          rows={3}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleBlur(); // Enter biasa = selesai edit
            }
            // Shift+Enter otomatis bikin baris baru (default behavior textarea)
          }}
          style={{
            width: "100%",
            textAlign: "center",
            background: bg,
            color,
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
          }}
        />
      ) : (
        <p style={{ whiteSpace: "pre-line" }}>{data.label}</p>
      )}

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
