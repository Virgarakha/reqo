import { X } from "lucide-react";

export default function ImportModal({ type, onClose, onImport }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      onImport(type, event.target.result);
    };

    reader.readAsText(file);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 400,
          background: "#1e1e1e",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ color: "white", fontSize: 14 }}>
            Import {type.toUpperCase()}
          </h3>
          <X
            size={18}
            color="white"
            style={{ cursor: "pointer" }}
            onClick={onClose}
          />
        </div>

        <input
        className="bg-[#171717] border-1 border-[#2d2d2d] w-full p-2 px-4 text-[#333] text-sm rounded-md"
          type="file"
          accept={
            type === "json"
              ? ".json"
              : type === "sql"
              ? ".sql"
              : ".php"
          }
          onChange={handleFile}
          style={{ marginTop: 20 }}
        />
      </div>
    </div>
  );
}
