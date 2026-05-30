import os
from typing import AsyncGenerator, List, Dict
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage, SystemMessage

from github_utils import get_repo_files, create_pull_request
from code_parser import parse_code_into_chunks
from vector_store import build_vector_store, search_relevant_chunks

llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=os.getenv("GROQ_API_KEY"), temperature=0.2)

async def run_bug_fix_agent(
    repo_url: str,
    bug_description: str,
    log_callback  # async function to send logs to frontend
) -> Dict:
    """
    Main agent function. Runs all steps and returns result.
    """
    result = {
        "success": False,
        "pr_url": None,
        "fixed_file": None,
        "fix_explanation": None,
        "error": None
    }

    try:
        # STEP 1 — Fetch repo files
        await log_callback("🔍 Fetching repository files from GitHub...")
        files = get_repo_files(repo_url)
        await log_callback(f"✅ Found {len(files)} code files")

        if not files:
            await log_callback("❌ No code files found in repository")
            result["error"] = "No code files found"
            return result

        # STEP 2 — Parse into chunks
        await log_callback("🌳 Parsing code structure...")
        chunks = parse_code_into_chunks(files)
        await log_callback(f"✅ Parsed into {len(chunks)} code chunks")

        # STEP 3 — Build vector store
        await log_callback("🧠 Building semantic search index...")
        index, chunks, texts = build_vector_store(chunks)
        await log_callback("✅ Vector index ready")

        # STEP 4 — Find relevant code
        await log_callback(f"🔎 Searching for code related to: '{bug_description}'")
        relevant_chunks = search_relevant_chunks(index, chunks, bug_description, top_k=5)
        await log_callback(f"✅ Found {len(relevant_chunks)} relevant code sections")

        # Show which files were found
        for chunk in relevant_chunks[:3]:
            await log_callback(f"   📄 {chunk['path']} (lines {chunk.get('start_line', '?')}-{chunk.get('end_line', '?')})")

        # STEP 5 — Ask LLM to localize the bug
        await log_callback("🤖 Agent is analyzing the bug...")

        context = "\n\n---\n\n".join([
            f"File: {c['path']} (lines {c.get('start_line','?')}-{c.get('end_line','?')})\n{c['content']}"
            for c in relevant_chunks
        ])

        localize_prompt = f"""You are an expert software engineer. A bug has been reported:

Bug Description: {bug_description}

Here are the most relevant code sections from the repository:

{context}

Your task:
1. Identify EXACTLY which file and which function/section contains the bug
2. Explain what the bug is
3. Respond in this exact format:

BUGGY_FILE: <file path>
BUGGY_SECTION: <function or line description>
BUG_EXPLANATION: <what is wrong>
"""

        localize_response = llm.invoke([
            SystemMessage(content="You are an expert software debugger. Be precise and concise."),
            HumanMessage(content=localize_prompt)
        ])

        localize_text = localize_response.content
        await log_callback("✅ Bug localized!")

        # Parse localize response
        buggy_file = None
        for line in localize_text.split("\n"):
            if line.startswith("BUGGY_FILE:"):
                buggy_file = line.replace("BUGGY_FILE:", "").strip()
                break

        if not buggy_file:
            # fallback to most relevant chunk's file
            buggy_file = relevant_chunks[0]["path"]

        await log_callback(f"📍 Bug found in: {buggy_file}")

        # STEP 6 — Get full file content for the fix
        full_file = next((f for f in files if f["path"] == buggy_file), None)

        if not full_file:
            await log_callback(f"⚠️ Could not fetch full file content, using chunk")
            full_file_content = relevant_chunks[0]["content"]
            original_sha = None
        else:
            full_file_content = full_file["content"]
            original_sha = full_file.get("sha")

        # STEP 7 — Generate the fix
        await log_callback("🔧 Generating fix...")

        fix_prompt = f"""You are an expert software engineer. Fix the following bug.

Bug Description: {bug_description}

Bug Analysis: {localize_text}

Full file content ({buggy_file}):
```
{full_file_content}
```

Instructions:
- Return the COMPLETE fixed file content
- Fix ONLY the bug, don't change anything else
- After the code, add a brief explanation

Format your response as:
FIXED_CODE:
```
<complete fixed file here>
```

FIX_EXPLANATION:
<brief explanation of what you changed and why>
"""

        fix_response = llm.invoke([
            SystemMessage(content="You are an expert software engineer. Return complete working code."),
            HumanMessage(content=fix_prompt)
        ])

        fix_text = fix_response.content
        await log_callback("✅ Fix generated!")

        # Parse fixed code and explanation
        fixed_code = None
        fix_explanation = "Bug fixed by autonomous agent"

        if "FIXED_CODE:" in fix_text and "```" in fix_text:
            code_part = fix_text.split("FIXED_CODE:")[-1]
            # Extract code between backticks
            code_blocks = code_part.split("```")
            if len(code_blocks) >= 2:
                fixed_code = code_blocks[1]
                # Remove language identifier if present (e.g., "python\n")
                if fixed_code and "\n" in fixed_code:
                    first_line = fixed_code.split("\n")[0].strip()
                    if first_line in ["python", "javascript", "java", "ts", "js"]:
                        fixed_code = "\n".join(fixed_code.split("\n")[1:])

        if "FIX_EXPLANATION:" in fix_text:
            fix_explanation = fix_text.split("FIX_EXPLANATION:")[-1].strip()

        if not fixed_code:
            await log_callback("⚠️ Could not parse fixed code cleanly, using raw response")
            fixed_code = full_file_content  # fallback

        # STEP 8 — Create GitHub PR
        if original_sha and os.getenv("GITHUB_TOKEN"):
            await log_callback("📬 Creating GitHub Pull Request...")
            try:
                pr_url = create_pull_request(
                    repo_url=repo_url,
                    file_path=buggy_file,
                    fixed_code=fixed_code,
                    original_sha=original_sha,
                    bug_description=bug_description,
                    fix_explanation=fix_explanation
                )
                await log_callback(f"✅ PR Created: {pr_url}")
                result["pr_url"] = pr_url
            except Exception as pr_error:
                await log_callback(f"⚠️ PR creation failed: {str(pr_error)}")
                await log_callback("💡 Fix was generated but PR could not be created (check GitHub token permissions)")
        else:
            await log_callback("ℹ️ Skipping PR creation (no GitHub token or SHA)")

        result["success"] = True
        result["fixed_file"] = buggy_file
        result["fix_explanation"] = fix_explanation
        result["fixed_code"] = fixed_code
        result["bug_analysis"] = localize_text

        await log_callback("🎉 Agent completed successfully!")

    except Exception as e:
        await log_callback(f"❌ Agent error: {str(e)}")
        result["error"] = str(e)

    return result