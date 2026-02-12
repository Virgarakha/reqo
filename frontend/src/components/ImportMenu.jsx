import { useState } from "react";
import { Menu } from "lucide-react";

export default function ImportMenu({ onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        zIndex: 5000,
      }}
    >
      {/* HAMBURGER BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          background: "#F2613F",
          border: "none",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        }}
      >
        <Menu size={20} />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 0,
            background: "#1e1e1e",
            borderRadius: 12,
            padding: 8,
            minWidth: 160,
            boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          {["json", "sql", "laravel"].map((type) => (
            <div
              key={type}
              onClick={() => {
                onSelect(type);
                setOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
                color: "white",
              }}
            >
              Import {type.toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
