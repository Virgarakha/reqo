import { useState } from "react";
import { Handle, Position } from "reactflow";
import { Plus } from "lucide-react";

export default function CustomNode({ id, data }) {
  if (!data?.table) return null;

  const table = data.table;
  const dark = data.darkMode;

  const bg = dark ? "#1e1e1e" : "#ffffff";
  const headerBg = dark ? "#262626" : "#f3f4f6";
  const borderColor = dark ? "#333" : "#e5e7eb";
  const textColor = dark ? "#ffffff" : "#111827";
  const subTextColor = dark ? "#aaa" : "#6b7280";

  const [editingTable, setEditingTable] = useState(false);
  const [editingColumnIndex, setEditingColumnIndex] = useState(null);

  const [tableName, setTableName] = useState(table.name);
  const [columns, setColumns] = useState(table.columns);

  // Update parent state
  const updateParent = (newTable) => {
    data.onChange(id, newTable);
  };

  const handleTableBlur = () => {
    setEditingTable(false);
    updateParent({ ...table, name: tableName, columns });
  };

  const handleColumnBlur = (index, value) => {
    const updated = columns.map((col, i) =>
      i === index ? { ...col, name: value } : col
    );

    setColumns(updated);
    setEditingColumnIndex(null);
    updateParent({ ...table, name: tableName, columns: updated });
  };

  const addColumn = () => {
    const updated = [
      ...columns,
      { name: "new_column", type: "varchar" },
    ];
    setColumns(updated);
    updateParent({ ...table, name: tableName, columns: updated });
  };

  return (
    <div
      style={{
        minWidth: 260,
        borderRadius: 12,
        overflow: "hidden",
        background: bg,
        border: `1px solid ${borderColor}`,
        boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
        fontSize: 12,
      }}
    >
      {/* HEADER */}
      <div
        onDoubleClick={() => setEditingTable(true)}
        style={{
          padding: "10px 14px",
          background: headerBg,
          borderBottom: `1px solid ${borderColor}`,
          fontWeight: 600,
          color: textColor,
          cursor: "text",
        }}
      >
        {editingTable ? (
          <input
            value={tableName}
            autoFocus
            onChange={(e) => setTableName(e.target.value)}
            onBlur={handleTableBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTableBlur();
            }}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              color: textColor,
              fontWeight: 600,
            }}
          />
        ) : (
          tableName
        )}
      </div>

      {/* COLUMNS */}
      <div>
        {columns.map((col, index) => (
          <div
            key={index}
            style={{
              position: "relative",
              padding: "8px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${borderColor}`,
              color: textColor,
            }}
          >
            <div
              onDoubleClick={() => setEditingColumnIndex(index)}
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                cursor: "text",
              }}
            >
              {col.primary && <span>🔑</span>}

              {editingColumnIndex === index ? (
                <input
                  autoFocus
                  defaultValue={col.name}
                  onBlur={(e) =>
                    handleColumnBlur(index, e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleColumnBlur(index, e.target.value);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: textColor,
                    fontSize: 12,
                  }}
                />
              ) : (
                <span>{col.name}</span>
              )}
            </div>

            <span style={{ color: subTextColor }}>
              {col.type}
            </span>

            <Handle
              type="target"
              position={Position.Left}
              id={`${tableName}-${col.name}-target`}
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                background: "#888",
                width: 8,
                height: 8,
              }}
            />

            <Handle
              type="source"
              position={Position.Right}
              id={`${tableName}-${col.name}-source`}
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                background: "#888",
                width: 8,
                height: 8,
              }}
            />
          </div>
        ))}

        {/* ADD COLUMN BUTTON */}
        <div
          onClick={addColumn}
          style={{
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            color: subTextColor,
            background: dark ? "#1a1a1a" : "#f9fafb",
          }}
        >
          <Plus size={14} />
          Add Column
        </div>
      </div>
    </div>
  );
}
