"""
使用Excel数据的LLM评分系统
"""
import re, json
from typing import Dict, Any
import json
import asyncio
import aiohttp
import pandas as pd
from typing import Dict, Any, List
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import ssl
try:
    import certifi
except Exception:
    certifi = None

def _strip_fences(s: str) -> str:
    m = re.search(r"```json(.*?)```", s, flags=re.DOTALL|re.IGNORECASE)
    if m: return m.group(1).strip()
    m = re.search(r"```(.*?)```", s, flags=re.DOTALL)
    if m: return m.group(1).strip()
    return s.strip()

def _fix_json_unterminated_and_newlines(s: str) -> str:
    """
    1) 把出现在“字符串内部”的裸换行替换为 \\n
    2) 如果文件结尾时仍在字符串内，则补一个收尾的双引号
    3) 若大括号/中括号未闭合，补全
    """
    out = []
    in_str = False
    esc = False
    # 用栈跟踪括号以便闭合
    stack = []

    for ch in s:
        if in_str:
            if esc:
                esc = False
                out.append(ch)
            else:
                if ch == '\\':
                    esc = True
                    out.append(ch)
                elif ch == '"':
                    in_str = False
                    out.append(ch)
                elif ch == '\n' or ch == '\r':
                    # 字符串内部的裸换行 → 转义
                    out.append('\\n')
                else:
                    out.append(ch)
        else:
            if ch == '"':
                in_str = True
                out.append(ch)
            else:
                # 非字符串上下文才跟踪括号
                if ch in '{[':
                    stack.append('}' if ch == '{' else ']')
                elif ch in '}]':
                    if stack and stack[-1] == ch:
                        stack.pop()
                out.append(ch)

    # 文件结束时还在字符串里 → 补一个引号
    if in_str:
        out.append('"')

    # 补全未闭合的括号（按栈顺序补）
    while stack:
        out.append(stack.pop())

    return ''.join(out)

def _pick_text_from_llm_result(result: Dict[str, Any]) -> str:
    """
    尝试从不同返回结构中提取第一段文本：
    - DashScope 原生: result["output"]["choices"][0]["message"]["content"]
    - OpenAI 兼容:    result["choices"][0]["message"]["content"] 或 ["text"]
    - 简单:           result.get("message") / result.get("output_text")
    """
    # 1) DashScope 原生
    if isinstance(result, dict) and "output" in result:
        out = result.get("output") or {}
        ch  = out.get("choices") or []
        if ch and isinstance(ch[0], dict):
            msg = ch[0].get("message") or {}
            if isinstance(msg, dict) and "content" in msg:
                return msg["content"]
        if "output_text" in result:
            return result["output_text"]

    # 2) OpenAI 兼容
    if "choices" in result:
        ch = result.get("choices") or []
        if ch:
            first = ch[0]
            if isinstance(first, dict):
                if "message" in first and isinstance(first["message"], dict):
                    if "content" in first["message"]:
                        return first["message"]["content"]
                if "text" in first:
                    return first["text"]

    # 3) 常见兜底
    if isinstance(result.get("message"), str):
        return result["message"]
    if "output_text" in result:
        return result["output_text"]

    return ""  # 没取到就返回空字符串



class LLMScorerWithExcel:
    """LLM-based Scorer with Excel Data - English Version"""

    # Supported LLM Provider Configurations
    LLM_CONFIGS = {
        "deepseek": {
            "api_url": "https://api.deepseek.com/v1/chat/completions",
            "model": "deepseek-chat"
        },
        "openai4": {
            "api_url": "https://api.openai.com/v1/chat/completions",
            "model": "gpt-4.1"
        },
        "openai5": {
            "api_url": "https://api.openai.com/v1/responses",
            "model": "gpt-5"
        },
        "qwen": {
            "api_url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
            "model": "qwen-plus"
        },
        "claude": {
            "api_url": "https://api.anthropic.com/v1/messages",
            "model": "claude-sonnet-4-20250514"
        },
        "grok": {
            "api_url": "https://api.x.ai/v1/chat/completions",
            "model": "grok-4"
        },
        "gemini": {
            "api_url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            "model": "gemini-2.5-flash"
        }
    }

    def __init__(self, api_key: str, provider: str = "deepseek"):
        self.api_key = api_key
        self.provider = provider

        if provider not in self.LLM_CONFIGS:
            raise ValueError(f"Unsupported provider: {provider}. Supported providers: {list(self.LLM_CONFIGS.keys())}")

        self.config = self.LLM_CONFIGS[provider]
        self.api_url = self.config["api_url"]
        self.model = self.config["model"]





    # def load_jobs_from_excel(self, file_path: str) -> List[Dict[str, Any]]:
    #     """Load job data from Excel file"""
    #
    #     df = pd.read_excel(file_path, sheet_name=0)
    #
    #     jobs = []
    #     for _, row in df.iterrows():
    #         job = {
    #             # LLM based
    #             "title": row.get("title", ""),
    #             "discipline": row.get("discipline", ""),
    #             "education_history": row.get("educationHistory", ""),
    #             "preferred_hard_skills": row.get("preferredHardSkills", ""),
    #             "preferred_soft_skills": row.get("preferredSoftSkills", ""),
    #             "preferred_traings": row.get("preferredTraining", ""),
    #         }
    #         jobs.append(job)
    #
    #     return jobs

def create_prompt(self, profile: Dict[str, Any]) -> str:
    """Create a matching prompt for disability support programs, funding, and job opportunities"""
    # 用 f-string 只拼接“用户画像”部分
    prompt_header = f"""
You are an experienced career and disability support advisor. Analyze the user’s profile and recommend the most relevant programs, funding opportunities, or job placements. Be empathetic, realistic, and supportive.

# User Profile

**Personal Info**
- Name: {profile['personalInfo']['name']}
- Age: {profile['personalInfo']['age']}
- Location: {profile['personalInfo']['location']}
- Communication Mode: {profile['personalInfo']['communicationMode']}

**Disability**
- Type: {", ".join(profile['disability']['type'])}
- Description: {profile['disability']['description']}
- Severity: {profile['disability']['severity']}

**Education**
- Level: {profile['education']['level']}
- Skills: {", ".join(profile['education']['skills'])}
- Interests: {", ".join(profile['education']['interests'])}

**Employment**
- History: {profile['employment']['history']}
- Interests: {", ".join(profile['employment']['interests'])}
- Work Preferences: {", ".join(profile['employment']['workPreferences'])}

**Needs & Priorities**
- Financial: {", ".join(profile['needs']['financial'])}
- Support: {", ".join(profile['needs']['support'])}
- Technology: {", ".join(profile['needs']['technology'])}
- Priority: {profile['needs']['priority']}

# Matching & Scoring Rules
1. Evaluate eligibility for government programs, non-profit funding, or accessible jobs.
2. Consider disability type, severity, education level, and user needs when assessing relevance.
3. Relevance scoring (0–100):
   * 30% eligibility (criteria match)
   * 30% alignment with needs and work preferences
   * 40% alignment with education/skills/interests
4. Recommendations must be constructive and tailored to the user’s location and communication needs.
5. Do not suggest opportunities below the user’s education or capability level.
6. Provide practical next steps and trusted contact information.
"""

    # 用普通字符串追加“Output Requirements”与 JSON 模板，避免 f-string 大括号被解释
    prompt_footer = """
# Output Requirements
Return a JSON array of recommended opportunities in the format below. Include at least 2–3 items if possible.

```json
[
  {
    "id": "unique identifier",
    "name": "Program or Job Name",
    "type": "program | job | funding",
    "description": "Short plain-language description",
    "eligibility": ["List of eligibility requirements"],
    "benefits": "Key benefits for the user",
    "applicationSteps": ["Step 1", "Step 2", "Step 3"],
    "contactInfo": {
      "website": "URL",
      "phone": "phone number",
      "email": "email if available"
    },
    "relevanceScore": 0,
    "location": "user location or Remote"
  }
]
```
"""
    return prompt_header + prompt_footer



# ---------- LLM calls ----------
async def call_llm(self, prompt: str) -> Dict[str, Any]:
    # """Call LLM API"""

    if self.provider == "claude":
        return await self._call_claude(prompt)
    elif self.provider == "qwen":
        return await self._call_qwen(prompt)
    elif self.provider == "grok":
        return await self._call_grok(prompt)
    elif self.provider == "gemini":
        return await self._call_gemini(prompt)
    else:
        return await self._call_openai_compatible(prompt)

async def _call_openai_compatible(self, prompt: str) -> Dict[str, Any]:
    """Call OpenAI-compatible API (OpenAI, DeepSeek)"""
    headers = {
        "Authorization": f"Bearer {self.api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": self.model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 1000
    }

    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=getattr(self, "_ssl_context", None))) as session:
        async with session.post(self.api_url, headers=headers, json=data) as response:
            if response.status == 200:
                result = await response.json()

                usage = result.get("usage", {})
                print(f"[{self.provider.upper()}] Token usage: "
                    f"prompt={usage.get('prompt_tokens', 0)}, "
                    f"completion={usage.get('completion_tokens', 0)}, "
                    f"total={usage.get('total_tokens', 0)}")

                return result

            else:
                raise Exception(f"API call failed: {response.status}")

async def _call_grok(self, prompt: str) -> Dict[str, Any]:
    """Call xAI Grok API (OpenAI-compatible)"""
    headers = {
        "Authorization": f"Bearer {self.api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": self.model,  # 例如 "grok-4"
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 1000,
        # 强制 JSON 输出（Grok 的兼容接口一般支持）
        "response_format": {"type": "json_object"}
    }

    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=getattr(self, "_ssl_context", None))) as session:
        async with session.post(self.api_url, headers=headers, json=data) as response:
            text = await response.text()
            if response.status != 200:
                raise Exception(f"Grok API failed: {response.status} - {text}")

            result = await response.json()

            # 打印 token 用量（如果有）
            usage = result.get("usage", {})
            if usage:
                print(f"[GROK] Token usage: "
                    f"prompt={usage.get('prompt_tokens', 0)}, "
                    f"completion={usage.get('completion_tokens', 0)}, "
                    f"total={usage.get('total_tokens', 0)}")

            # 统一抽取文本内容
            content = _pick_text_from_llm_result(result) or text

            return {"choices": [{"message": {"content": content}}]}

async def _call_claude(self, prompt: str) -> Dict[str, Any]:
    """Call Anthropic Claude API"""
    headers = {
        "x-api-key": self.api_key,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01"
    }

    data = {
        "model": self.model,
        "max_tokens": 1000,
        "temperature": 0.1,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=getattr(self, "_ssl_context", None))) as session:
        async with session.post(self.api_url, headers=headers, json=data) as response:
            if response.status == 200:
                result = await response.json()
                # Convert to unified format
                return {
                    "choices": [
                        {
                            "message": {
                                "content": result["content"][0]["text"]
                            }
                        }
                    ]
                }
            else:
                raise Exception(f"API call failed: {response.status}")

async def _call_qwen(self, prompt: str) -> Dict[str, Any]:
    """Call Qwen API"""
    headers = {
        "Authorization": f"Bearer {self.api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": self.model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 1000
    }

    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=getattr(self, "_ssl_context", None))) as session:
        async with session.post(self.api_url, headers=headers, json=data) as response:
            text = await response.text()
            if response.status != 200:
                raise Exception(f"API call failed: {response.status} - {text}")

            # 兼容：有些服务端返回非严格 JSON，这里优先尝试 json 解析
            try:
                result = await response.json()
            except Exception:
                raise Exception(f"Failed to parse JSON: {text}")

            content = _pick_text_from_llm_result(result)
            if not content:
                # 打印一份原始返回，方便你定位 prompt/配额/模型等问题
                # 也避免 parse_response 对空串做 json.loads 直接报错
                content = text

            return {"choices": [{"message": {"content": content}}]}

async def _call_gemini(self, prompt: str) -> Dict[str, Any]:
    """Call Gemini API"""
    url =  self.api_url
    headers = {"Content-Type": "application/json"}
    params  = {"key": self.api_key}

    # 非流式请求体（最简单的纯文本）
    data = {
        "contents": [
            {"role": "user", "parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }

    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=getattr(self, "_ssl_context", None))) as session:
        async with session.post(url, headers=headers, params=params, json=data) as resp:
            text = await resp.text()
            if resp.status != 200:
                # 把服务端原文抛出来，便于排错（配额/模型名/Key 等）
                raise Exception(f"Gemini API failed: {resp.status} - {text}")

            result = await resp.json()

            # ---- 统一抽取文本 ----
            content_text = ""
            try:
                cands = result.get("candidates", [])
                if cands:
                    parts = cands[0].get("content", {}).get("parts", [])
                    # 纯文本
                    if parts and isinstance(parts[0], dict) and "text" in parts[0]:
                        content_text = parts[0]["text"]
                    # 兜底：如果不是文本（如 inlineData 等），直接返回原始 JSON
            except Exception:
                pass

            if not content_text:
                content_text = json.dumps(result, ensure_ascii=False)

            # print("Raw Gemini response:", json.dumps(result, indent=2, ensure_ascii=False))

            return {
                "choices": [
                    {"message": {"content": content_text}}
                ]
            }

# ---------------- SSL context helper ----------------
def _build_ssl_context(insecure: bool = False, ca_bundle: str | None = None):
    ctx = None
    if insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    elif ca_bundle:
        ctx = ssl.create_default_context(cafile=ca_bundle)
    else:
        if certifi is not None:
            try:
                ctx = ssl.create_default_context(cafile=certifi.where())
            except Exception:
                ctx = ssl.create_default_context()
        else:
            ctx = ssl.create_default_context()
    return ctx



def parse_response(self, llm_response: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Robustly parse LLM JSON list of recommendations (programs/jobs/funding)."""
    try:
        content = llm_response["choices"][0]["message"]["content"]
        if not isinstance(content, str) or not content.strip():
            raise ValueError("empty content")

        raw = _strip_fences(content)

        def _json_loads_any(s: str):
            # 1) direct
            try:
                return json.loads(s)
            except Exception:
                pass
            # 2) repair strings/newlines/brackets
            fixed = _fix_json_unterminated_and_newlines(s)
            try:
                return json.loads(fixed)
            except Exception:
                pass
            # 3) extract first plausible JSON array
            m = re.search(r'(\[.*\])', fixed, flags=re.DOTALL)
            if m:
                try:
                    return json.loads(m.group(1))
                except Exception:
                    pass
            # 4) last resort: extract from first '{' or '[' and retry
            m2 = re.search(r'([\[\{].*)', fixed, flags=re.DOTALL)
            if m2:
                try:
                    return json.loads(m2.group(1))
                except Exception:
                    pass
            raise ValueError("could not parse JSON")

        data = _json_loads_any(raw)

        # Normalize: ensure we return a list of objects
        if isinstance(data, dict):
            # some models return an object keyed like {"results":[...]} or a single item
            if "results" in data and isinstance(data["results"], list):
                items = data["results"]
            else:
                items = [data]
        elif isinstance(data, list):
            items = data
        else:
            raise ValueError("parsed JSON is neither list nor dict")

        # Schema defaults
        def _norm_contact(x):
            x = x if isinstance(x, dict) else {}
            return {
                "website": x.get("website", ""),
                "phone": x.get("phone", ""),
                "email": x.get("email", "")
            }

        def _as_list(v):
            if v is None:
                return []
            if isinstance(v, list):
                # cast all to strings
                return [str(i) for i in v]
            return [str(v)]

        normalized: List[Dict[str, Any]] = []
        for it in items:
            if not isinstance(it, dict):
                # skip non-dict entries
                continue

            # pull + coerce fields
            _id = str(it.get("id", ""))
            name = str(it.get("name", "")).strip()
            _type = str(it.get("type", "")).strip()  # program | job | funding
            description = str(it.get("description", "")).strip()
            eligibility = _as_list(it.get("eligibility"))
            benefits = str(it.get("benefits", "")).strip()
            application_steps = _as_list(it.get("applicationSteps"))
            contact_info = _norm_contact(it.get("contactInfo", {}))
            location = str(it.get("location", "")).strip()

            # relevanceScore → int 0..100 (clamp)
            rs = it.get("relevanceScore", 0)
            try:
                rs = int(float(rs))
            except Exception:
                rs = 0
            rs = max(0, min(100, rs))

            normalized.append({
                "id": _id or str(len(normalized) + 1),
                "name": name,
                "type": _type,
                "description": description,
                "eligibility": eligibility,
                "benefits": benefits,
                "applicationSteps": application_steps,
                "contactInfo": contact_info,
                "relevanceScore": rs,
                "location": location
            })

        # If nothing valid parsed, log and fall back to []
        if not normalized:
            raise ValueError("no valid items after normalization")

        return normalized

    except Exception as e:
        print(f"Parsing failed: {e}")
        try:
            print("---- RAW CONTENT BEGIN ----")
            print(llm_response["choices"][0]["message"]["content"])
            print("---- RAW CONTENT END ----")
            with open("last_llm_raw.txt", "w", encoding="utf-8") as f:
                f.write(llm_response["choices"][0]["message"]["content"])
        except Exception:
            pass
        # Return empty list for downstream safety
        return []


# ---------------- FastAPI Service ----------------

app = FastAPI(title="LLM Recommendation Service")

# Allow all origins/methods/headers for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # allow any origin for development
    allow_origin_regex=None,
    allow_credentials=False,        # keep False when using "*"
    allow_methods=["*"],           # allow all methods including OPTIONS
    allow_headers=["*"]            # allow all headers
)

# Explicit preflight handler for /recommend to be extra safe
@app.options("/recommend")
async def cors_preflight():
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Vary": "Origin",
        },
    )

# Build a reusable scorer instance for the service from environment variables
import os as _os_for_service
import types as _types_for_service
_PROVIDER = _os_for_service.getenv("LLM_PROVIDER", "openai4")
_INSECURE = _os_for_service.getenv("SSL_INSECURE", "0") == "1"
_CA_BUNDLE = _os_for_service.getenv("SSL_CA_BUNDLE", None)

try:
    import api_key as _api_key_service
    _api_key_val = _api_key_service.get_api_key(_PROVIDER)
except Exception:
    _api_key_val = None

_scorer_service = None
if _api_key_val:
    _scorer_service = LLMScorerWithExcel(api_key=_api_key_val, provider=_PROVIDER)
    # bind top-level funcs as methods
    _scorer_service.create_prompt = create_prompt.__get__(_scorer_service)
    _scorer_service.parse_response = parse_response.__get__(_scorer_service)
    _scorer_service.call_llm = _types_for_service.MethodType(call_llm, _scorer_service)
    _scorer_service._call_openai_compatible = _types_for_service.MethodType(_call_openai_compatible, _scorer_service)
    _scorer_service._call_grok = _types_for_service.MethodType(_call_grok, _scorer_service)
    _scorer_service._call_claude = _types_for_service.MethodType(_call_claude, _scorer_service)
    _scorer_service._call_qwen = _types_for_service.MethodType(_call_qwen, _scorer_service)
    _scorer_service._call_gemini = _types_for_service.MethodType(_call_gemini, _scorer_service)
    # SSL context for service
    _scorer_service._ssl_context = _build_ssl_context(_INSECURE, _CA_BUNDLE)

@app.post("/recommend")
async def recommend(profile: Dict[str, Any]):
    if _scorer_service is None:
        return JSONResponse(status_code=500, content={"error": "Service not configured: missing API key"})
    prompt = _scorer_service.create_prompt(profile)
    llm_resp = await _scorer_service.call_llm(prompt)
    recs = _scorer_service.parse_response(llm_resp)
    return JSONResponse(content=recs)


if __name__ == "__main__":
    import argparse
    import os
    import json
    import types
    import asyncio
    import api_key as _api_key_mod

    parser = argparse.ArgumentParser(description="LLM scoring with Excel/profile")
    parser.add_argument("--profile", required=True, help="Path to user profile JSON")
    parser.add_argument("--excel", default=None, help="Optional Excel file to load jobs")
    parser.add_argument("--provider", default="openai4",
                        choices=["deepseek","openai4","openai5","qwen","claude","grok","gemini"],
                        help="LLM provider (default: openai4)")
    parser.add_argument("--out", default="recommendations.json", help="Output JSON file")
    parser.add_argument("--insecure", action="store_true",
                        help="Disable SSL certificate verification (debug only)")
    parser.add_argument("--ca-bundle", default=None,
                        help="Path to a custom CA bundle (PEM). If not set, will try certifi.")
    args = parser.parse_args()

    # 取 API Key（你已有 api_key.get_api_key(provider)）
    api_key_val = _api_key_mod.get_api_key(args.provider)
    if not api_key_val:
        raise ValueError(f"API key for provider '{args.provider}' not set in environment variables or api_key module.")

    # 初始化 scorer
    scorer = LLMScorerWithExcel(api_key=api_key_val, provider=args.provider)

    # 将顶层函数绑定为实例方法（因为你现在的 create_prompt/parse_response 定义在类外）
    scorer.create_prompt = types.MethodType(create_prompt, scorer)
    scorer.parse_response = types.MethodType(parse_response, scorer)

    # 绑定顶层的异步调用方法到实例（这些函数当前定义在类外）
    scorer.call_llm = types.MethodType(call_llm, scorer)
    scorer._call_openai_compatible = types.MethodType(_call_openai_compatible, scorer)
    scorer._call_grok = types.MethodType(_call_grok, scorer)
    scorer._call_claude = types.MethodType(_call_claude, scorer)
    scorer._call_qwen = types.MethodType(_call_qwen, scorer)
    scorer._call_gemini = types.MethodType(_call_gemini, scorer)

    # Build SSL context
    ssl_ctx = _build_ssl_context(args.insecure, args.ca_bundle)
    scorer._ssl_context = ssl_ctx
    # 读取用户画像
    with open(args.profile, "r", encoding="utf-8") as f:
        profile = json.load(f)

    # （可选）加载 Excel 工作岗位数据，目前未合入 prompt，仅作为扩展预留
    # if args.excel:
    #     try:
    #         jobs = scorer.load_jobs_from_excel(args.excel)
    #         print(f"[Info] Loaded {len(jobs)} jobs from {args.excel}")
    #     except Exception as e:
    #         print(f"[Warn] Failed to load Excel '{args.excel}': {e}")

    # 组装提示词并请求 LLM
    prompt = scorer.create_prompt(profile)
    llm_resp = asyncio.run(scorer.call_llm(prompt))

    # 解析 LLM 返回为结构化结果
    recs = scorer.parse_response(llm_resp)

    # 保存输出
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(recs, f, ensure_ascii=False, indent=2)

    print(f"[OK] Wrote {len(recs)} recommendations to {args.out}")