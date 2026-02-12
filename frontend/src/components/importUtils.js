export function parseJSON(content) {
  return JSON.parse(content);
}

export function parseSQL(content) {
  const tables = [];
  const relations = [];

  const createRegex = /CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/gi;

  let match;

  while ((match = createRegex.exec(content))) {
    const tableName = match[1];
    const body = match[2];

    // split by comma but ignore comma inside parentheses
    const lines = body
      .split(/,(?![^(]*\))/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const columns = [];

    lines.forEach((line) => {
      if (line.toUpperCase().startsWith("PRIMARY KEY")) return;

      const nameMatch = line.match(/^(\w+)/);
      if (!nameMatch) return;

      const name = nameMatch[1];

      const typeMatch = line.match(/^\w+\s+([^\s]+)/);
      const type = typeMatch ? typeMatch[1] : "varchar(255)";

      const column = {
        name,
        type,
      };

      if (line.toUpperCase().includes("PRIMARY KEY")) {
        column.primary = true;
      }

      if (line.toUpperCase().includes("UNIQUE")) {
        column.unique = true;
      }

      if (line.toUpperCase().includes("NOT NULL")) {
        column.nullable = false;
      }

      const refMatch = line.match(/REFERENCES\s+(\w+)\((\w+)\)/i);

      if (refMatch) {
        const refTable = refMatch[1];
        const refColumn = refMatch[2];

        column.foreign_key = {
          references: `${refTable}.${refColumn}`,
        };

        relations.push({
          from_table: tableName,
          to_table: refTable,
          type: "one-to-many",
        });
      }

      columns.push(column);
    });

    tables.push({
      name: tableName,
      columns,
    });
  }b

  return { tables, relations };
}

export function parseLaravel(content) {
  const tables = [];
  const tableRegex =
    /Schema::create\('(\w+)'[\s\S]*?\{([\s\S]*?)\}\);/g;

  let match;
  while ((match = tableRegex.exec(content))) {
    const tableName = match[1];
    const body = match[2];

    const columnRegex = /\$table->(\w+)\('(\w+)'\)/g;
    const columns = [];

    let colMatch;
    while ((colMatch = columnRegex.exec(body))) {
      columns.push({
        name: colMatch[2],
        type: colMatch[1],
      });
    }

    tables.push({ name: tableName, columns });
  }

  return { tables, relations: [] };
}
