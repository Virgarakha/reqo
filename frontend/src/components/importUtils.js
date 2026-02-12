export function parseJSON(content) {
  return JSON.parse(content);
}

export function parseSQL(content) {
  const tables = [];
  const createRegex = /CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/g;

  let match;
  while ((match = createRegex.exec(content))) {
    const tableName = match[1];
    const columnsRaw = match[2].split(",");

    const columns = columnsRaw.map((line) => {
      const parts = line.trim().split(" ");
      return {
        name: parts[0],
        type: parts[1],
      };
    });

    tables.push({ name: tableName, columns });
  }

  return { tables, relations: [] };
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
