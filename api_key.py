API_KEYS = {

}


# 方法2: 从环境变量读取 (推荐，更安全)
# import os
#
# def get_api_keys_from_env():
#     """从环境变量读取API密钥"""
#     return {
#         "deepseek": os.getenv("DEEPSEEK_API_KEY", ""),
#         "openai4": os.getenv("OPENAI4_API_KEY", ""),
#         "openai5": os.getenv("OPENAI5_API_KEY", ""),
#         "qwen": os.getenv("QWEN_API_KEY", ""),
#         "claude": os.getenv("CLAUDE_API_KEY", ""),
#         "grok": os.getenv("GROK_API_KEY", ""),
#         "gemini": os.getenv("GEMINI_API_KEY", ""),
#     }

def get_api_key(provider: str) -> str:
    """获取指定提供商的API密钥"""
    # 优先从环境变量读取，如果没有则从API_KEYS读取
    env_keys = API_KEYS
    if env_keys[provider]:
        return env_keys[provider]
    return API_KEYS.get(provider, "")