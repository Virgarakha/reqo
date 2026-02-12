import { useState, useEffect } from "react";
import { Handle, Position } from "reactflow";
import { Plus } from "lucide-react";

const DATA_TYPES = [
  "uuid",
  "varchar",
  "text",
  "integer",
  "bigint",
  "boolean",
  "date",
  "datetime",
  "decimal",
];

export default function CustomNode({ id, data }) {
  if (!data?.table) return null;

  const table = data.table;
  const dark = data.darkMode;
const isSelected = data.selected;


  const bg = dark ? "#1e1e1e" : "#ffffff";
  const headerBg = dark ? "#262626" : "#f3f4f6";
  const borderColor = dark ? "#333" : "#e5e7eb";
  const textColor = dark ? "#ffffff" : "#111827";
  const subTextColor = dark ? "#aaa" : "#6b7280";

  const [editingTable, setEditingTable] = useState(false);
  const [editingColumnIndex, setEditingColumnIndex] = useState(null);
  const [editingTypeIndex, setEditingTypeIndex] = useState(null);

  const [tableName, setTableName] = useState(table.name);
  const columns = table.columns;

  const updateParent = (newTable) => {
    data.onChange(id, newTable);
  };

  const handleTableBlur = () => {
    setEditingTable(false);
    updateParent({ ...table, name: tableName, columns });
  };

  const handleColumnBlur = (index, value) => {
    const updated = table.columns.map((col, i) =>
      i === index ? { ...col, name: value } : col,
    );

    setEditingColumnIndex(null);
    updateParent({ ...table, name: tableName, columns: updated });
  };

  const handleTypeChange = (index, newType) => {
    const updated = table.columns.map((col, i) =>
      i === index ? { ...col, type: newType } : col,
    );

    updateParent({ ...table, name: tableName, columns: updated });
  };

  const handleLengthChange = (index, value) => {
    const baseType = table.columns[index].type.split("(")[0];

    const updated = table.columns.map((col, i) =>
      i === index ? { ...col, type: `${baseType}(${value})` } : col,
    );

    updateParent({ ...table, name: tableName, columns: updated });
  };

  const addColumn = () => {
    const updated = [
      ...table.columns,
      { name: "new_column", type: "varchar(255)" },
    ];

    updateParent({ ...table, name: tableName, columns: updated });
  };

  useEffect(() => {
    const handleSaveShortcut = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();

        if (document.activeElement) {
          document.activeElement.blur();
        }

        setEditingColumnIndex(null);
        setEditingTypeIndex(null);
        setEditingTable(false);
      }
    };

    window.addEventListener("keydown", handleSaveShortcut);

    return () => {
      window.removeEventListener("keydown", handleSaveShortcut);
    };
  }, []);

  useEffect(() => {
    setTableName(table.name);
  }, [table.name]);

  return (
    <div
      style={{
        minWidth: 280,
        borderRadius: 12,
        overflow: "hidden",
        background: bg,
        border: isSelected
  ? "1px solid #666"
  : `1px solid ${borderColor}`,
  transition: "all 0.15s ease",
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
        {columns.filter(Boolean).map((col, index) => {
          const safeType = col.type || "varchar(255)";

          const baseType = safeType.includes("(")
            ? safeType.split("(")[0]
            : safeType;

          const length = safeType.includes("(")
            ? safeType.split("(")[1]?.replace(")", "")
            : "";

          return (
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
              {/* COLUMN NAME */}
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
                    onBlur={(e) => handleColumnBlur(index, e.target.value)}
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

              {/* TYPE EDITOR */}
              <div style={{ display: "flex", gap: 4 }}>
                {editingTypeIndex === index ? (
                  <>
                    <select
                      value={baseType}
                      onChange={(e) => handleTypeChange(index, e.target.value)}
                      style={{
                        fontSize: 11,
                        background: dark ? "#333" : "#eee",
                        color: textColor,
                        border: "none",
                        borderRadius: 4,
                        padding: "2px 4px",
                      }}
                    >
                      {DATA_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>

                    {(baseType === "varchar" || baseType === "decimal") && (
                      <input
                        placeholder="255"
                        defaultValue={length}
                        onBlur={(e) =>
                          handleLengthChange(index, e.target.value)
                        }
                        style={{
                          width: 50,
                          fontSize: 11,
                          background: dark ? "#333" : "#eee",
                          color: textColor,
                          border: "none",
                          borderRadius: 4,
                          padding: "2px 4px",
                        }}
                      />
                    )}
                  </>
                ) : (
                  <span
                    onClick={() => setEditingTypeIndex(index)}
                    style={{
                      color: subTextColor,
                      cursor: "pointer",
                    }}
                  >
                    {col.type}
                  </span>
                )}
              </div>

              <Handle
                type="target"
                position={Position.Left}
                id={`${id}-${col.name}-target`}
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
                id={`${id}-${col.name}-source`}
                style={{
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "#888",
                  width: 8,
                  height: 8,
                }}
              />
            </div>
          );
        })}

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
