---
name: ai-engineer-expert
description: >-
  Router skill for Python & AI Engineering Squad (ai-engineer, python-backend). Senior AI Engineer & Python Backend Engineer for LangGraph, RAG, LLM evaluation, FastAPI microservices, and async Python workers.
  Loads deep domain guides lazily from references/ on demand to keep context lean.
---

# ai-engineer-expert

Consolidated domain router for **Python & AI Engineering Squad** (experts: `ai-engineer`, `python-backend`).

> **Shared Python Core**: For `async-python-patterns`, `python-type-safety`, `python-testing-patterns`, `python-error-handling`, `python-observability`, `python-resilience`, and `python-code-style`, also read `../python-backend-expert/SKILL.md` in this same `saas-kit-python-ai` plugin.

**MANDATORY**: Before writing code or giving domain advice, read the matching reference file(s) below (and use bundled helper scripts where listed):

| Topic | Reference File | Helper Scripts | Summary |
|---|---|---|---|
| `deepagents-python-quickstart` | `references/deepagents-python-quickstart.md` | — | Scaffold a minimal local Deep Agent in Python by following the official quickstart, using provider-native web  |
| `langchain-architecture` | `references/langchain-architecture.md` | — | Design LLM applications using LangChain 1.x and LangGraph for agents, memory, and tool integration. Use when b |
| `langgraph-cli` | `references/langgraph-cli.md` | — | INVOKE THIS SKILL when using the langgraph CLI to scaffold, develop, build, or deploy LangGraph applications.  |
| `langgraph-fundamentals` | `references/langgraph-fundamentals.md` | — | INVOKE THIS SKILL when writing ANY LangGraph code. Covers StateGraph, state schemas, nodes, edges, Command, Se |
| `langgraph-human-in-the-loop` | `references/langgraph-human-in-the-loop.md` | — | INVOKE THIS SKILL when implementing human-in-the-loop patterns, pausing for approval, or handling errors in La |
| `langgraph-persistence` | `references/langgraph-persistence.md` | — | INVOKE THIS SKILL when your LangGraph needs to persist state, remember conversations, travel through history,  |
| `langgraph-python-quickstart` | `references/langgraph-python-quickstart.md` | — | Scaffold a minimal local LangGraph agent in Python by following the official quickstart. Use when the user wan |
| `llm-evaluation` | `references/llm-evaluation.md` | — | Implement comprehensive evaluation strategies for LLM applications using automated metrics, human feedback, an |
| `prompt-engineering-patterns` | `references/prompt-engineering-patterns.md` | `scripts/prompt-engineering-patterns/` | This skill should be used when the user asks to "optimize a prompt", "improve prompt |
| `pydantic-ai-harness` | `references/pydantic-ai-harness.md` | — | Extend Pydantic AI agents with capabilities from pydantic-ai-harness -- the Coder coding agent, file and shell |
| `rag-implementation` | `references/rag-implementation.md` | — | Build Retrieval-Augmented Generation (RAG) systems for LLM applications with vector databases and semantic sea |
