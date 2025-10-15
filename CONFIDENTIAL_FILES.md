# 🔐 Confidential Components — PRANAYA

Certain backend files are intentionally excluded from this public repository to
protect proprietary AI logic, local user data, and API security.

| File | Description | Reason for Exclusion |
|------|--------------|----------------------|
| `app.py` (real version) | Backend engine integrating Whisper, Ollama, LangChain, multilingual TTS, and emergency AI | Contains proprietary AI orchestration and sensitive APIs |
| `.env` | Environment variables for Whisper, SerperDev, and LLMs | API key protection |
| `agents.py`, `crew_config.py`, `tools.py`, `tasks.py` | AI reasoning modules (agent memory, tools, RAG logic) | Intellectual property |
| `trackers.db`, `chroma.sqlite3` | Health data and contextual embeddings | Personal health privacy |
| `memory/` and `localdb/` | User context persistence | Data privacy compliance |

> For hackathon judging or collaboration access, please contact:  
> **Soulima B**  
> 📧 [soulimabiswas@gmail.com]
