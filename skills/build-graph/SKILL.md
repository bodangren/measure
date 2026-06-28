---
name: build-graph
description: |
  Build and query a SQLite knowledge graph of a TypeScript codebase. Use this skill whenever the user wants to understand code structure, find dependencies, trace call paths, search for functions or classes, analyze a codebase's architecture, or map relationships between code entities. Triggers on: "find all callers of", "what uses this", "trace from X to Y", "search for function", "codebase graph", "dependency map", "understand this project", "what breaks if I change", "find implementations of", or any task involving code navigation, dependency analysis, or architectural understanding of TypeScript code. Always use this skill when working on large or legacy codebases where the agent needs structural context.
---

# build-graph

A standalone CLI tool that scans TypeScript codebases via AST parsing and stores the knowledge graph in SQLite. Agents use it to build persistent, queryable maps of code structure.

## Workflow

The typical agent workflow is **scan → query → update**:

1. **Scan** the codebase once to build `graph.db`
2. **Query** the database to answer structural questions
3. **Update** incrementally when files change (e.g., after edits)

## Commands

All commands run through the `build-graph` executable:

```bash
# Create a new database with schema and indexes
build-graph init <db>

# Full scan of a TypeScript project
build-graph scan <project-dir> <db>

# Run SQL against the database
build-graph query <db> "<sql>"

# Search nodes by keyword (fuzzy match on name, summary, tags)
build-graph search <db> <keyword>

# Incrementally update changed files (for git hooks)
build-graph update <db> <file1> <file2> ...
```

### Convenience commands (no SQL required)

```bash
# Find who depends on a node (upstream dependents)
build-graph deps <db> <node-name>

# Find what a node depends on (downstream dependencies)
build-graph deps <db> <node-name> --downstream

# Find functions/files that reference a function
build-graph callers <db> <function-name>

# Trace shortest dependency path between two nodes
build-graph path <db> <from> <to>

# Print codebase dashboard (totals, charts, top lists, package breakdown)
build-graph stats <db>

# List files with entity counts, optionally filtered by pattern
build-graph files <db> [pattern]

# Show full profile of a node (metadata + all edges)
build-graph inspect <db> <node-name>

# Audit graph integrity (missing files, stale symbols, orphan edges, duplicates)
build-graph audit <db>
build-graph audit <db> --json
```

**Exit codes:** 0 = success, 1 = not found, 2 = ambiguous, 3 = misuse, 4 = runtime error.

**Relative paths:** All output shows paths relative to the project root (e.g., `./src/auth.ts`).

**Ambiguous names:** If multiple nodes share a name, the command prints a disambiguation table and exits with code 2.

## When to scan

Scan the codebase when:
- The user asks about code structure, dependencies, or architecture
- You need to find all callers of a function, all implementations of an interface, etc.
- You're about to make a refactoring and need to know what breaks
- The user says "understand this project" or "map this codebase"

**Example:**
```bash
build-graph scan ./ ./graph.db
```

**Monorepos:** The scanner auto-discovers *all* `tsconfig.json` files in the project tree (e.g., `./frontend/tsconfig.json`, `./convex/tsconfig.json`). It loads each package into a single graph database. No manual configuration needed.

If no `tsconfig.json` exists, the scanner falls back to recursive `.ts`/`.tsx` discovery.

## Schema

```sql
nodes(id, type, name, file_path, line_start, line_end, summary, tags, complexity, language_notes, layer_id, package_id)
edges(id, source, target, type, direction, weight)
layers(id, name, description, node_ids)
tour_steps(order_index, title, description, node_ids)
meta(key, value)          -- stores project_root and other metadata
```

**Node types:** `file`, `function`, `class`, `interface`, `type_alias`, `variable`, `import`, `export`, `schema`, `field`, `route`, `param`

**Edge types:** `contains`, `imports`, `extends`, `implements`, `calls`, `depends_on`, `exports`, `tested_by`, `has_field`, `references`, `renders`, `uses_hook`, `queries`, `mutates`, `param_flow`

**Edge metadata:** `edges.metadata` is a JSON blob capturing string literals at call sites (URLs, column refs, query templates).

**Node ID format:**
- Files: `file:<absolute_path>`
- Functions: `function:<path>:<name>`
- Classes: `class:<path>:<name>`
- Interfaces: `interface:<path>:<name>`
- Type aliases: `type_alias:<path>:<name>`
- Schemas: `schema:<path>:<name>`
- Fields: `field:<path>:<schema>.<field>`
- Routes: `route:<path>:<METHOD>:<path>`
- Params: `param:<path>:<func>:<name>`

## Query patterns

Use these SQL templates to answer common questions. Replace `:param` with actual values.

### Find nodes by keyword
```sql
SELECT id, type, name, file_path, summary
FROM nodes
WHERE name LIKE '%:keyword%' OR summary LIKE '%:keyword%'
ORDER BY type, name
LIMIT 20;
```

### Get downstream dependencies (what X calls/imports)
```sql
SELECT e.target AS id, e.type AS edge_type, n.name, n.file_path
FROM edges e
JOIN nodes n ON e.target = n.id
WHERE e.source = :node_id
  AND e.type IN ('imports', 'contains', 'extends', 'implements', 'has_field', 'references')
ORDER BY e.type;
```

### Get upstream dependents (what calls/imports X)
```sql
SELECT e.source AS id, e.type AS edge_type, n.name, n.file_path
FROM edges e
JOIN nodes n ON e.source = n.id
WHERE e.target = :node_id
  AND e.type IN ('imports', 'contains', 'extends', 'implements', 'has_field', 'references')
ORDER BY e.type;
```

### Find schema tables and their fields
```sql
SELECT s.name AS schema_name, f.name AS field_name, f.file_path
FROM nodes s
JOIN edges e ON e.source = s.id AND e.type = 'has_field'
JOIN nodes f ON f.id = e.target
WHERE s.type = 'schema'
ORDER BY s.name, f.name;
```

### Find all React components and what they render
```sql
SELECT src.name AS component, tgt.name AS renders
FROM edges e
JOIN nodes src ON src.id = e.source
JOIN nodes tgt ON tgt.id = e.target
WHERE e.type = 'renders'
ORDER BY src.name;
```

### Find all Convex queries/mutations
```sql
SELECT n.name AS caller, e.type AS edge_type, e.target AS api_function
FROM edges e
JOIN nodes n ON n.id = e.source
WHERE e.type IN ('queries', 'mutates')
ORDER BY n.name;
```

### Find all routes
```sql
SELECT name, file_path, tags FROM nodes WHERE type = 'route' ORDER BY name;
```

### Find all fetch calls to a specific URL
```sql
SELECT e.source, e.metadata
FROM edges e
WHERE e.type = 'calls' AND e.target = 'function:*:fetch'
  AND e.metadata LIKE '%/api/lessons%';
```

### Find all eq() calls and their column refs
```sql
SELECT e.source, json_extract(e.metadata, '$.column_ref') AS col,
       json_extract(e.metadata, '$.value_ref') AS val
FROM edges e
WHERE e.type = 'calls' AND e.target = 'function:*:eq';
```

### Find params for a route handler
```sql
SELECT p.name AS param_name, p.file_path
FROM nodes p
JOIN edges e ON e.source = p.id
WHERE p.type = 'param' AND e.target = :function_id;
```

### Filter by package
```sql
SELECT * FROM nodes WHERE package_id = 'frontend';
```

### Find all functions in a file
```sql
SELECT id, name, line_start, line_end, summary
FROM nodes
WHERE file_path = :file_path AND type = 'function'
ORDER BY line_start;
```

### Find class hierarchy
```sql
-- All classes that extend a given class
SELECT n.*
FROM edges e
JOIN nodes n ON e.source = n.id
WHERE e.target LIKE '%:ClassName' AND e.type = 'extends';

-- All interfaces a class implements
SELECT n.*
FROM edges e
JOIN nodes n ON e.target = n.id
WHERE e.source = :class_id AND e.type = 'implements';
```

### Find unused exports (no incoming edges)
```sql
SELECT n.id, n.name, n.file_path
FROM nodes n
LEFT JOIN edges e ON e.target = n.id
WHERE n.type IN ('function', 'class', 'interface')
  AND n.tags LIKE '%exported%'
  AND e.id IS NULL;
```

### Count by type
```sql
SELECT type, COUNT(*) AS count FROM nodes GROUP BY type ORDER BY count DESC;
```

## Using convenience commands

Prefer convenience commands over raw SQL for common queries:

```bash
# Quick discovery
build-graph search ./graph.db "auth"
build-graph search ./graph.db "/api" --type=route

# Dependency analysis
build-graph deps ./graph.db CircuitBreaker
build-graph callers ./graph.db configure

# Cross-package analysis
build-graph deps ./graph.db myFunc --from-package=frontend --to-package=convex

# Architecture overview
build-graph stats ./graph.db
build-graph files ./graph.db

# Deep inspection
build-graph inspect ./graph.db users
```

## Incremental updates

After the user edits files, update the graph instead of re-scanning everything:

```bash
build-graph update ./graph.db src/auth.ts src/utils.ts
```

This deletes and re-inserts only the specified files inside a transaction. Much faster than a full scan for large codebases.

## JSON output

For machine-readable output (e.g., piping to another tool), use `--json`:

```bash
build-graph query --json ./graph.db "SELECT * FROM nodes WHERE type = 'class'"
build-graph deps --json ./graph.db CircuitBreaker
build-graph callers --json ./graph.db configure
build-graph stats --json ./graph.db
build-graph inspect --json ./graph.db users
```

## Performance notes

- Scan time: ~5ms per file on modern hardware
- A 1,000-file project scans in under 10 seconds
- Queries are indexed (O(log n)) — much faster than grep
- The database is a single file — copy or archive it freely

## Auditing graph integrity

Over time the graph drifts from the actual source code. Use `audit` to detect:

- **Missing files**: `file` nodes whose paths no longer exist on disk
- **Stale symbols**: `function`/`class`/`interface`/`type_alias` nodes that were renamed or deleted
- **Orphan edges**: edges whose `source` or `target` node no longer exists
- **Duplicate nodes**: multiple nodes with the same `name` + `type` + `file_path`

```bash
# Human-readable table output
build-graph audit ./graph.db

# Machine-readable JSON for CI pipelines
build-graph audit ./graph.db --json
```

**Exit codes:** 0 = clean, 1 = issues found. This makes it CI-friendly:
```yaml
# Example GitHub Actions step
- run: build-graph audit ./graph.db
```

## Limitations

- TypeScript only (`.ts`, `.tsx`)
- No LLM-generated summaries (uses JSDoc only)
- `audit` stale-symbol detection covers `function`, `class`, `interface`, and `type_alias` nodes only (not `schema`, `field`, `route`, or `param`)
