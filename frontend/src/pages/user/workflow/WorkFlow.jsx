import React, { useCallback, useState, useEffect, useRef } from "react";
import CustomNode from "./CustomNode.jsx";
import {
  Moon,
  Redo2,
  Share2,
  Sun,
  Undo2,
  User,
  Users,
  Workflow,
  Plus,
  Minus,
  Maximize2,
  MousePointerClick,
  Sparkles,
  Minimize2,
  FolderDown,
  FileCodeCorner,
} from "lucide-react";
import { Link } from "react-router-dom";

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { Panel } from "reactflow";
import ImportMenu from "../../../components/ImportMenu";
import ImportModal from "../../../components/ImportModal";
import {
  parseJSON,
  parseSQL,
  parseLaravel,
} from "../../../components/importUtils";
import { api } from "../../../services/api";

const nodeTypes = { custom: CustomNode };

const initialNodes = [];

const initialEdges = [];
const WorkFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [zoomLevel, setZoomLevel] = useState(100);

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [copiedNodes, setCopiedNodes] = useState([]);
  const [darkMode, setDarkMode] = useState(true);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState({
    tables: [],
    relations: [],
  });
  const [loadingAI, setLoadingAI] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: "system",
      content: `
You are a database architect AI.

You must UPDATE existing database schema if provided.
Return ONLY valid JSON.

Format:
{
  "tables": [
    {
      "name": "table_name",
      "columns": [
        {
          "name": "column_name",
          "type": "datatype",
          "primary": true,
          "unique": false,
          "nullable": false,
          "foreign_key": {
            "references": "table.column"
          }
        }
      ]
    }
  ],
  "relations": [
    {
      "from_table": "tableA",
      "to_table": "tableB",
      "type": "one-to-many | one-to-one | many-to-many"
    }
  ]
}

Do not explain anything.
Do not return markdown.
Only JSON.

For every relation, you MUST define a foreign_key inside the child table column.
Example:
{
  "name": "user_id",
  "type": "uuid",
  "foreign_key": {
    "references": "users.id"
  }
}


    `,
    },
  ]);

  const [aiPanelPos, setAiPanelPos] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const { project } = useReactFlow();
  const wrapperRef = useRef(null);
  const [importType, setImportType] = useState(null);

  // backend implementasi
  const [projectId, setProjectId] = useState(null);

  const handleImport = (type, content) => {
    let parsed;

    if (type === "json") parsed = parseJSON(content);
    if (type === "sql") parsed = parseSQL(content);
    if (type === "laravel") parsed = parseLaravel(content);

    if (!parsed?.tables) return;

    const newNodes = parsed.tables.map((table, index) => ({
      id: table.name,
      type: "custom",
      position: { x: 200, y: 100 + index * 200 },
      data: {
        table,
        darkMode,
      },
    }));

    setNodes(newNodes);
    setImportType(null);
  };

  useEffect(() => {
    const initProject = async () => {
      // kalau sudah ada id di url / local
      const savedId = localStorage.getItem("active_project_id");

      if (savedId) {
        setProjectId(savedId);
        const data = await api.getProject(savedId);
        loadProjectToCanvas(data, savedId);
        return;
      }

      // create baru
      const newProject = await api.createProject({
        name: "My Workflow 01",
        theme: "dark",
      });

      setProjectId(newProject.id);
      localStorage.setItem("active_project_id", newProject.id);
    };

    initProject();
  }, []);

  const loadProjectToCanvas = (data, pid) => {
    const loadedNodes = data.tables.map((table) => ({
      id: table.id,
      type: "custom",
      position: {
        x: table.position_x,
        y: table.position_y,
      },
      data: {
        table: {
          id: table.id,
          name: table.name,
          columns: table.columns.map((col) => ({
            name: col.name,
            type: col.type,
            primary: col.is_primary,
            unique: col.is_unique,
            nullable: col.is_nullable,
            foreign_key: col.foreign_table_id
              ? {
                  references: `${data.tables.find((t) => t.id === col.foreign_table_id)?.name}.${col.foreign_column}`,
                }
              : null,
          })),
        },
        darkMode,
      },
    }));

    const loadedEdges = data.edges.map((edge) => ({
      id: edge.id ?? crypto.randomUUID(), // 🔥 jangan random terus
      source: edge.source_table_id,
      target: edge.target_table_id,
      sourceHandle: `${edge.source_table_id}-${edge.source_column}-source`,
      targetHandle: `${edge.target_table_id}-${edge.target_column}-target`,
      type: "smoothstep",
      label: edge.label || "",
    }));

    setNodes(loadedNodes);
    setEdges(loadedEdges);

    console.log(
      "Node IDs:",
      loadedNodes.map((n) => n.id),
    );
    console.log(
      "Edge Sources:",
      loadedEdges.map((e) => e.source),
    );
    console.log(
      "Edge Targets:",
      loadedEdges.map((e) => e.target),
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const zoom = Math.round(getZoom() * 100);
      setZoomLevel(zoom);
    }, 200);

    return () => clearInterval(interval);
  }, [getZoom]);

  // ================= UNDO REDO =================

  const saveHistory = (n, e) => {
    setHistory((prev) => [...prev, { nodes: n, edges: e }]);
    setRedoStack([]);
  };

  const undo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];

    setRedoStack((r) => [...r, { nodes, edges }]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setHistory((h) => h.slice(0, -1));
  };

  const redo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];

    setHistory((h) => [...h, { nodes, edges }]);
    setNodes(next.nodes);
    setEdges(next.edges);
    setRedoStack((r) => r.slice(0, -1));
  };

  // ================= KEYBOARD SHORTCUT =================

  useEffect(() => {
    const handleKey = (e) => {
      // UNDO
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // REDO
      if (e.ctrlKey && e.shiftKey && e.key === "Z") {
        e.preventDefault();
        redo();
      }

      // COPY
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        const selected = nodes.filter((n) => n.selected);
        if (selected.length > 0) {
          setCopiedNodes(selected);
        }
      }

      // PASTE
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        if (copiedNodes.length > 0) {
          saveHistory(nodes, edges);

          const newNodes = copiedNodes.map((node) => ({
            ...node,
            id: crypto.randomUUID(),
            position: {
              x: node.position.x + 60,
              y: node.position.y + 60,
            },
            selected: false,
          }));

          setNodes((nds) => [...nds, ...newNodes]);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nodes, copiedNodes, history, redoStack]);

  // ================= CONNECT =================

  const onConnect = useCallback(
    (params) => {
      saveHistory(nodes, edges);

      const { source, target, sourceHandle, targetHandle } = params;

      const sourceColumn = sourceHandle
        ?.replace(`${source}-`, "")
        ?.replace("-source", "");

      const targetColumn = targetHandle
        ?.replace(`${target}-`, "")
        ?.replace("-target", "");

      let childTable = source;
      let parentTable = target;
      let childColumn = sourceColumn;

      // 🔥 FK selalu kolom *_id
      if (!sourceColumn.endsWith("_id") && targetColumn.endsWith("_id")) {
        childTable = target;
        parentTable = source;
        childColumn = targetColumn;
      }

      const parentName = nodes.find((n) => n.id === parentTable)?.data.table
        .name;

      // 🔥 Inject FK ke child
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === childTable) {
            return {
              ...node,
              data: {
                ...node.data,
                table: {
                  ...node.data.table,
                  columns: node.data.table.columns.map((col) =>
                    col.name === childColumn
                      ? {
                          ...col,
                          foreign_key: {
                            references: `${parentName}.id`, // 🔥 FIX DISINI
                          },
                        }
                      : col,
                  ),
                },
              },
            };
          }
          return node;
        }),
      );

      setEdges((eds) => addEdge(params, eds));
    },
    [nodes, edges],
  );

  // ================= NODE CHANGE =================

  const handleNodesChange = (changes) => {
    saveHistory(nodes, edges);
    onNodesChange(changes);
  };

  // ================= MULTI SELECT =================

  const handleNodeClick = (event, node) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
      })),
    );
  };

  // ================= UPDATE LABEL =================

  const updateNodeLabel = (id, newTable) => {
    saveHistory(nodes, edges);

    setNodes((nds) =>
      nds.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                table: newTable, // ✅ FIX DI SINI
              },
            }
          : node,
      ),
    );
  };

  const nodesWithHandler = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onChange: updateNodeLabel,
      darkMode,
      selected: node.selected,
    },
  }));

  // ================= ADD NODE =================

  // ADD NOTE
  const addTableAtPosition = (clientX, clientY) => {
    const bounds = wrapperRef.current.getBoundingClientRect();

    const position = project({
      x: clientX - bounds.left,
      y: clientY - bounds.top,
    });

    saveHistory(nodes, edges);

    const newTable = {
      id: crypto.randomUUID(),
      type: "custom",
      position,
      data: {
        table: {
          name: "new_table",
          columns: [
            {
              name: "id",
              type: "uuid",
              primary: true,
            },
          ],
        },
        darkMode,
      },
    };

    setNodes((nds) => [...nds, newTable]);
  };

  const addColumnToSelectedTable = () => {
    const selected = nodes.find((n) => n.selected);

    if (!selected || !selected.data?.table) return;

    saveHistory(nodes, edges);

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selected.id) {
          return {
            ...n,
            data: {
              ...n.data,
              table: {
                ...n.data.table,
                columns: [
                  ...n.data.table.columns,
                  {
                    name: "new_column",
                    type: "varchar",
                  },
                ],
              },
            },
          };
        }
        return n;
      }),
    );
  };

  // SELECT ALL
  const selectAllNodes = () => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: true,
      })),
    );
  };

  const deleteNode = (nodeId) => {
    saveHistory(nodes, edges);

    // hapus node
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));

    // hapus edge yang terhubung
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
    );
  };

  useEffect(() => {
    document.body.style.background = darkMode ? "#111" : "#f4f6f8";
  }, [darkMode]);
  const ControlButton = ({ icon, onClick }) => (
    <button
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "none",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: darkMode ? "#fff" : "#111",
        opacity: 0.75,
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.75)}
    >
      {icon}
    </button>
  );

  const getCurrentDatabaseContext = () => {
    const tables = nodes.filter((n) => n.data?.table).map((n) => n.data.table);

    return JSON.stringify({
      tables,
      relations: aiResult.relations || [],
    });
  };

  const handleAskAI = async () => {
    try {
      setLoadingAI(true);

      const updatedHistory = [
        ...chatHistory,
        {
          role: "user",
          content: `
Current Database Schema:
${getCurrentDatabaseContext()}

User Requirement:
${aiPrompt}

Update the database schema above.

        `,
        },
      ];

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer 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`,
          },
          body: JSON.stringify({
            model: "stepfun/step-3.5-flash:free",
            messages: updatedHistory,
          }),
        },
      );

      const data = await response.json();
      const raw = data.choices[0].message.content;
      const cleaned = raw.replace(/```json|```/g, "").trim();

      const parsed = JSON.parse(cleaned);

      setAiResult(parsed);

      // simpan memory
      setChatHistory([
        ...updatedHistory,
        { role: "assistant", content: cleaned },
      ]);

      if (projectId) {
        await api.saveConversation(projectId, {
          role: "user",
          content: aiPrompt,
        });

        await api.saveConversation(projectId, {
          role: "assistant",
          content: cleaned,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const generateDatabaseFromAI = () => {
    if (!aiResult) return;

    saveHistory(nodes, edges);

    const gapX = 400;
    const gapY = 300;
    const tableIdMap = {};

    const generatedNodes = aiResult.tables.map((table, index) => {
      const nodeId = table.name;

      tableIdMap[table.name] = nodeId;

      return {
        id: nodeId,
        type: "custom",
        position: {
          x: 200 + (index % 2) * 400,
          y: 100 + Math.floor(index / 2) * 300,
        },
        data: {
          table,
          darkMode,
        },
      };
    });

    const generatedEdges = [];

    aiResult.tables.forEach((table) => {
      table.columns.forEach((col) => {
        if (col.foreign_key?.references) {
          const [targetTable, targetColumn] =
            col.foreign_key.references.split(".");

          // cari relation type dari aiResult.relations
          const relation = aiResult.relations.find(
            (r) =>
              (r.from_table === table.name && r.to_table === targetTable) ||
              (r.from_table === targetTable && r.to_table === table.name),
          );

          let relationLabel = "";

          if (relation) {
            switch (relation.type) {
              case "one-to-many":
                relationLabel = "hasMany";
                break;
              case "one-to-one":
                relationLabel = "hasOne";
                break;
              case "many-to-many":
                relationLabel = "belongsToMany";
                break;
            }
          }

          generatedEdges.push({
            id: crypto.randomUUID(),
            source: tableIdMap[table.name], // ✅ pakai UUID
            target: tableIdMap[targetTable], // ✅ pakai UUID
            sourceHandle: `${tableIdMap[table.name]}-${col.name}-source`,
            targetHandle: `${tableIdMap[targetTable]}-${targetColumn}-target`,
            type: "smoothstep",
            label: relationLabel,
          });
        }
      });
    });

    setNodes(generatedNodes);
    setEdges(generatedEdges);

    setTimeout(() => fitView(), 200);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setHasMoved(false);

    dragOffset.current = {
      x: e.clientX - aiPanelPos.x,
      y: e.clientY - aiPanelPos.y,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    setHasMoved(true);

    setAiPanelPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const exportSQL = () => {
    const tables = nodes.filter((n) => n.data?.table).map((n) => n.data.table);

    let sql = "";

    tables.forEach((table) => {
      sql += `CREATE TABLE ${table.name} (\n`;

      table.columns.forEach((col, index) => {
        let line = `  ${col.name} ${col.type}`;

        if (col.primary) line += " PRIMARY KEY";
        if (col.unique) line += " UNIQUE";
        if (col.nullable === false) line += " NOT NULL";

        if (col.foreign_key?.references) {
          const [refTable, refColumn] = col.foreign_key.references.split(".");
          line += ` REFERENCES ${refTable}(${refColumn})`;
        }

        if (index < table.columns.length - 1) line += ",";

        sql += line + "\n";
      });

      sql += ");\n\n";
    });

    downloadFile("schema.sql", sql);
  };

  const exportLaravelMigration = () => {
    const tables = nodes.filter((n) => n.data?.table).map((n) => n.data.table);

    let migration = "";

    tables.forEach((table) => {
      migration += `Schema::create('${table.name}', function (Blueprint $table) {\n`;

      table.columns.forEach((col) => {
        if (col.primary) {
          migration += `    $table->uuid('${col.name}')->primary();\n`;
          return;
        }

        let type = "string";

        if (col.type.includes("uuid")) type = "uuid";
        else if (col.type.includes("int")) type = "integer";
        else if (col.type.includes("text")) type = "text";

        migration += `    $table->${type}('${col.name}')`;

        if (col.unique) migration += "->unique()";
        if (col.nullable) migration += "->nullable()";

        migration += ";\n";

        if (col.foreign_key?.references) {
          const [refTable, refColumn] = col.foreign_key.references.split(".");

          migration += `    $table->foreign('${col.name}')\n`;
          migration += `          ->references('${refColumn}')\n`;
          migration += `          ->on('${refTable}');\n`;
        }
      });

      migration += `    $table->timestamps();\n`;
      migration += `});\n\n`;
    });

    downloadFile("migration.php", migration);
  };

  const downloadFile = (filename, content) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!projectId) return;

    const timeout = setTimeout(async () => {
      const tables = nodes.map((n) => ({
        id: n.id,
        name: n.data.table.name,
        position: n.position,
        columns: n.data.table.columns,
      }));

      const formattedEdges = edges.map((e) => {
        const sourceColumn = e.sourceHandle
          ?.replace(`${e.source}-`, "")
          ?.replace("-source", "");

        const targetColumn = e.targetHandle
          ?.replace(`${e.target}-`, "")
          ?.replace("-target", "");

        return {
          source_table_id: e.source,
          target_table_id: e.target,
          source_column: sourceColumn,
          target_column: targetColumn,
          label: e.label || null,
        };
      });

      await api.saveSchema(projectId, {
        tables,
        edges: formattedEdges,
      });

      console.log("Auto saved ✅");
    }, 1500);

    return () => clearTimeout(timeout);
  }, [nodes, edges, projectId]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        height: "100vh",
        background: darkMode ? "#111" : "#f4f6f8",
      }}
    >
      {/* HEADER */}
      {/* HEADER */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: darkMode ? "#222" : "#fff",
          borderBottomColor: darkMode ? "#555" : "#eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 1000,
          borderBottom: darkMode ? "1px solid #1f1f1f" : "1px solid #eee",
        }}
      >
        {/* LEFT */}
        <div className="flex items-center gap-3 text-sm">
          <Link
            to="/"
            className="flex items-center gap-1 opacity-60 hover:opacity-100"
            style={{ color: darkMode ? "#fff" : "#111" }}
          >
            <User size={16} />
            Personal
          </Link>

          <span style={{ color: darkMode ? "#555" : "#aaa" }}>/</span>

          <Link
            to="/"
            className="flex items-center gap-1 opacity-60 hover:opacity-100"
            style={{ color: darkMode ? "#fff" : "#111" }}
          >
            <Users size={16} />
            ITBS Team
          </Link>

          <span style={{ color: darkMode ? "#555" : "#aaa" }}>/</span>

          <div
            contentEditable
            suppressContentEditableWarning
            style={{
              color: darkMode ? "#fff" : "#111",
              fontWeight: 500,
              outline: "none",
              cursor: "text",
            }}
          >
            My Workflow 01
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="opacity-70 hover:opacity-100"
            style={{ color: darkMode ? "#fff" : "#111" }}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Avatar */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#F2613F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            RK
          </div>
          {/* Share */}
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md"
            style={{
              background: "#F2613F",
              color: "#fff",
              fontSize: 12,
            }}
          >
            <Share2 size={14} />
            Share
          </button>
        </div>
      </div>

      <div style={{ height: "100%", paddingTop: 60 }}>
        {/* FLOATING CONTROL BAR */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 14,
            background: darkMode
              ? "rgba(20,20,20,0.85)"
              : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(12px)",
            border: darkMode ? "1px solid #2a2a2a" : "1px solid #e5e7eb",
            boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            zIndex: 1000,
          }}
        >
          <ControlButton onClick={zoomOut} icon={<Minus size={16} />} />

          <span
            style={{
              fontSize: 12,
              width: 50,
              textAlign: "center",
              color: darkMode ? "#aaa" : "#555",
            }}
          >
            {zoomLevel}%
          </span>

          <ControlButton onClick={zoomIn} icon={<Plus size={16} />} />

          <div
            style={{
              width: 1,
              height: 18,
              background: darkMode ? "#333" : "#ddd",
              margin: "0 6px",
            }}
          />

          <ControlButton
            onClick={() => fitView()}
            icon={<Maximize2 size={16} />}
          />
        </div>

        <ReactFlow
          nodes={nodesWithHandler}
          edges={edges}
          nodeTypes={nodeTypes}
          proOptions={{ hideAttribution: true }}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={() => setContextMenu(null)}
          onPaneContextMenu={(event) => {
            event.preventDefault();
            setContextMenu({
              x: event.clientX,
              y: event.clientY,
            });
          }}
          onNodeContextMenu={(event, node) => {
            event.preventDefault(); // cegah inspect

            deleteNode(node.id);
          }}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: false,
            style: {
              stroke: "#888",
              strokeWidth: 2,
            },
          }}
          fitView
        >
          <Background
            variant="dots"
            gap={20}
            size={2.0}
            color={darkMode ? "#2f2f2f" : "#d1d5db"}
          />
          {!isMinimized ? (
            <div
              style={{
                position: "absolute",
                left: aiPanelPos.x,
                top: aiPanelPos.y,
                width: 340,
                background: "#1e1e1e",
                borderRadius: 12,
                padding: 12,
                boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                zIndex: 3000,
              }}
              onWheel={(e) => e.stopPropagation()}
            >
              {/* Header (Drag Area) */}
              <div
                onMouseDown={handleMouseDown}
                style={{
                  cursor: "grab",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div className="flex items-center gap-2 text-sm text-white">
                  <Sparkles size={16} color="#F2613F" />
                  AI Assistant
                </div>

                <button
                  onClick={() => setIsMinimized(true)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#aaa",
                    cursor: "pointer",
                  }}
                >
                  <Minimize2 size={16} />
                </button>
              </div>

              {/* BODY */}
              <textarea
                className="outline-none"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI..."
                style={{
                  width: "100%",
                  height: 80,
                  borderRadius: 8,
                  padding: 8,
                  fontSize: 12,
                  background: "#111",
                  color: "white",
                  border: "1px solid #333",
                }}
              />

              <button
                onClick={handleAskAI}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  background: "#F2613F",
                  color: "white",
                  fontSize: 12,
                }}
              >
                {loadingAI ? "Generating..." : "Ask AI"}
              </button>
            </div>
          ) : (
            /* MINIMIZED BUBBLE */
            <div
              onMouseDown={handleMouseDown}
              onClick={() => {
                if (!hasMoved) {
                  setIsMinimized(false);
                }
              }}
              style={{
                position: "absolute",
                left: aiPanelPos.x,
                top: aiPanelPos.y,
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#F2613F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "grab",
                boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
                zIndex: 3000,
                transition: "all 0.2s ease",
              }}
            >
              <Sparkles color="white" size={22} />
            </div>
          )}
          <Panel position="bottom-right">
            <div className="flex flex-col items-end mb-5 gap-5">
              <button
                className="p-4 pointer"
                onClick={exportSQL}
                style={{
                  borderRadius: 8,
                  background: "#222",
                  color: "white",
                  fontSize: 12,
                }}
              >
                <FileCodeCorner size={20} />
              </button>

              <button
                className="p-4 pointer"
                onClick={exportLaravelMigration}
                style={{
                  borderRadius: 8,
                  background: "#222",
                  color: "white",
                  fontSize: 12,
                }}
              >
                <FolderDown size={20} />
              </button>
              <ImportMenu onSelect={(type) => setImportType(type)} />
            </div>
            <div
              style={{
                background: "#222",
                color: "white",
                borderRadius: 8,
                padding: 12,
                width: 323,
                maxHeight: 200,
                overflow: "hidden",
              }}
            >
              <p className="text-sm flex items-center gap-2 mb-2">
                <Sparkles color="#F2613F" size={16} />
                AI Output
              </p>
              <div
                className="custom-scrollbar"
                style={{
                  maxHeight: 150,
                  overflowY: "auto",
                  fontSize: 11,
                  display: "flex",
                  fontFamily: "monospace",
                }}
              >
                {(() => {
                  const content = aiResult
                    ? JSON.stringify(aiResult, null, 2)
                    : "NO OUTPUT";

                  const lines = content.split("\n");

                  return (
                    <>
                      {/* Line Numbers */}
                      <div
                        style={{
                          paddingRight: 10,
                          textAlign: "right",
                          userSelect: "none",
                          color: "#555",
                        }}
                      >
                        {lines.map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Code Content */}
                      <div style={{ color: "#ccc", whiteSpace: "pre" }}>
                        {content}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {aiResult?.tables?.length > 0 && (
              <button
                className="flex items-center justify-center gap-2"
                onClick={generateDatabaseFromAI}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  background: "#444",
                  color: "white",
                  fontSize: 12,
                }}
              >
                Generate Database <MousePointerClick size={18} />
              </button>
            )}
          </Panel>
        </ReactFlow>
      </div>

      {contextMenu && (
        <div
          className="border-1 border-[#262626]"
          style={{
            position: "absolute",
            top: contextMenu.y,
            left: contextMenu.x,
            background: darkMode ? "#111" : "#fff",
            color: darkMode ? "white" : "#111",
            borderRadius: 10,
            zIndex: 2000,
            minWidth: 180,
            padding: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          {/* ADD NOTE */}
          <div
            className="hover:bg-[#222] p-2 px-4 cursor-pointer text-xs"
            onClick={() => {
              addTableAtPosition(contextMenu.x, contextMenu.y);
              setContextMenu(null);
            }}
          >
            Add Table
          </div>

          <div
            className="hover:bg-[#222] p-2 px-4 cursor-pointer text-xs"
            onClick={() => {
              addColumnToSelectedTable();
              setContextMenu(null);
            }}
          >
            Add Column
          </div>

          <div
            className="hover:bg-[#222] p-2 px-4 cursor-pointer text-xs"
            onClick={() => {
              selectAllNodes();
              setContextMenu(null);
            }}
          >
            Select All
          </div>
        </div>
      )}

      {importType && (
        <ImportModal
          type={importType}
          onClose={() => setImportType(null)}
          onImport={handleImport}
        />
      )}
    </div>
  );
};

export default WorkFlow;
