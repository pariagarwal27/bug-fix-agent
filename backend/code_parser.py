from typing import List, Dict

def parse_code_into_chunks(files: List[Dict]) -> List[Dict]:
    """
    Split code files into function-level chunks for better semantic search.
    Falls back to line-based chunking if tree-sitter parsing fails.
    """
    chunks = []

    for file in files:
        path = file["path"]
        content = file["content"]

        # Try tree-sitter parsing for Python files
        if path.endswith(".py"):
            try:
                py_chunks = parse_python_functions(content, path)
                if py_chunks:
                    chunks.extend(py_chunks)
                    continue
            except Exception:
                pass

        # Fallback: chunk by lines (every 50 lines)
        lines = content.split("\n")
        chunk_size = 50
        for i in range(0, len(lines), chunk_size):
            chunk_lines = lines[i:i + chunk_size]
            chunk_text = "\n".join(chunk_lines)
            if chunk_text.strip():
                chunks.append({
                    "path": path,
                    "content": chunk_text,
                    "start_line": i + 1,
                    "end_line": min(i + chunk_size, len(lines)),
                    "type": "chunk"
                })

    return chunks


def parse_python_functions(content: str, path: str) -> List[Dict]:
    """Parse Python file and extract individual functions/classes"""
    try:
        import tree_sitter_python as tspython
        from tree_sitter import Language, Parser

        PY_LANGUAGE = Language(tspython.language())
        parser = Parser(PY_LANGUAGE)

        tree = parser.parse(bytes(content, "utf8"))
        root = tree.root_node

        chunks = []
        lines = content.split("\n")

        for node in root.children:
            if node.type in ("function_definition", "class_definition"):
                start = node.start_point[0]
                end = node.end_point[0]
                chunk_content = "\n".join(lines[start:end + 1])
                name_node = node.child_by_field_name("name")
                name = name_node.text.decode("utf8") if name_node else "unknown"

                chunks.append({
                    "path": path,
                    "content": chunk_content,
                    "start_line": start + 1,
                    "end_line": end + 1,
                    "type": node.type,
                    "name": name
                })

        return chunks

    except Exception as e:
        return []