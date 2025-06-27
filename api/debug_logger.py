import time
from typing import List, Dict, Any, Optional

class DebugLogger:
    def __init__(self):
        self.logs: List[Dict[str, Any]] = []
        self.current_id = 0
        self.level = 0

    def _get_timestamp(self) -> str:
        return time.strftime("%Y-%m-%dT%H:%M:%S.", time.gmtime()) + f"{time.time() % 1:.3f}".lstrip('0') + "Z"

    def add_log(
        self,
        title: str,
        status: str = "success",
        content_type: str = "inline",
        data: Any = None,
        parent_id: Optional[int] = None,
    ):
        self.current_id += 1
        log_entry = {
            "id": self.current_id,
            "parent_id": parent_id,
            "level": self.level,
            "timestamp": self._get_timestamp(),
            "title": title,
            "status": status,
            "content": {"type": content_type, "data": data},
        }
        self.logs.append(log_entry)
        return self.current_id

    def start_section(self, title: str, parent_id: Optional[int] = None, data: Any = None, content_type: str = "clickable"):
        parent_id = self.add_log(title, content_type=content_type, data=data, parent_id=parent_id)
        self.level += 1
        return parent_id

    def end_section(self):
        self.level = max(0, self.level - 1)

    def get_logs(self) -> List[Dict[str, Any]]:
        return self.logs

    def clear(self):
        self.logs = []
        self.current_id = 0
        self.level = 0

# Singleton instance
debug_logger = DebugLogger() 