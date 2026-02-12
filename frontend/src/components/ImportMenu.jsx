import { useState } from "react";
import { Menu, Upload } from "lucide-react";

export default function ImportMenu({ onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        position: "",
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
          background: "#222",
          border: "none",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        }}
      >
        <Upload size={20} className="m-auto opacity-75 hover:opacity-100"/>
      </button>


      {/* DROPDOWN */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 140,
            right: 70,
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
