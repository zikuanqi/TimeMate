import os
import json
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
import httpx
from pydantic import BaseModel

router = APIRouter(prefix="/api/ai", tags=["ai"])

# 使用环境变量配置API密钥，默认为空（本地测试用）
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

class AIChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    session_id: str

class TaskCreateRequest(BaseModel):
    description: str
    priority: int = 2
    tags: str = ""

class TimeBlockCreateRequest(BaseModel):
    title: str
    start_time: str
    end_time: str
    date: str
    type: str = "work"

@router.post("/chat")
async def chat_with_ai(request: AIChatRequest):
    """Chat with AI assistant."""
    if not OPENAI_API_KEY:
        # 模拟响应（开发模式）
        return {
            "response": "好的，我已记录！你可以继续调整计划。（开发模式：请设置 OPENAI_API_KEY 环境变量启用真实 AI）",
            "actions": []
        }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "system",
                            "content": """你是时间管理助手 TimeMate 的 AI 助手。用户会通过自然语言描述他们的时间管理需求，你需要理解并生成结构化操作。

可执行的操作类型：
1. create_task - 创建任务
2. create_time_block - 创建时间块
3. update_task - 更新任务状态
4. delete_task - 删除任务
5. start_focus_session - 开始专注会话
6. end_focus_session - 结束专注会话

请根据用户输入，判断是否需要执行操作。如果需要，返回一个 JSON 数组，每个元素包含：
1. action_type: 操作类型
2. params: 操作参数（对象）
3. response_text: 对用户的自然语言回应

如果不需要执行操作，仅返回普通对话。

示例：
用户："下午2点到4点开会"
响应：{
  "response": "已为您创建下午2点到4点的会议时间块。",
  "actions": [{
    "action_type": "create_time_block",
    "params": {
      "title": "开会",
      "start_time": "14:00",
      "end_time": "16:00",
      "date": "2024-05-25",
      "type": "meeting"
    },
    "response_text": "已为您创建下午2点到4点的会议时间块。"
  }]
}

用户："今天有什么计划？"
响应：{
  "response": "今天您有3个任务待办：完成项目报告、团队会议、健身。",
  "actions": []
}

请保持回应简洁、有帮助。"""
                        },
                        *request.messages
                    ],
                    "temperature": 0.7,
                }
            )
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]

            # 尝试解析 JSON 操作
            try:
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "response" in parsed:
                    return parsed
            except:
                pass

            # 普通文本回应
            return {"response": content, "actions": []}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 服务错误: {str(e)}")

@router.post("/parse-intent")
async def parse_intent(text: str):
    """Parse user intent from natural language."""
    if not OPENAI_API_KEY:
        return {
            "intent": "chat",
            "entities": {},
            "suggested_actions": []
        }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "system",
                            "content": """分析用户输入的时间管理意图。返回 JSON 格式：
{
  "intent": "create_task" | "create_time_block" | "update_task" | "delete_task" | "start_focus" | "end_focus" | "query" | "chat",
  "entities": {
    // 根据意图提取的实体字段
  },
  "suggested_actions": [
    {
      "action_type": "create_task",
      "params": {...}
    }
  ]
}

示例：
输入："下午3点开会"
输出：{
  "intent": "create_time_block",
  "entities": {
    "title": "开会",
    "start_time": "15:00",
    "end_time": "16:00",
    "date": "2024-05-25",
    "type": "meeting"
  },
  "suggested_actions": [...]
}

输入："完成项目报告"
输出：{
  "intent": "create_task",
  "entities": {
    "title": "完成项目报告",
    "priority": 3
  },
  "suggested_actions": [...]
}"""
                        },
                        {"role": "user", "content": text}
                    ],
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                }
            )
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            return json.loads(content)
    except Exception as e:
        return {
            "intent": "chat",
            "entities": {},
            "suggested_actions": []
        }