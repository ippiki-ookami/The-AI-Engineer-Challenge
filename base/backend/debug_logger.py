import time
from typing import List, Dict, Any, Optional
from functools import wraps
import inspect

class DebugLogger:
    def __init__(self):
        self.logs: List[Dict[str, Any]] = []
        self.current_id = 0
        self.level = 0
        self.status_callback = None  # Callback to stream status updates

    def _get_timestamp(self) -> str:
        return time.strftime("%Y-%m-%dT%H:%M:%S.", time.gmtime()) + f"{time.time() % 1:.3f}".lstrip('0') + "Z"

    def add_log(
        self,
        title: str,
        status: str = "success",
        content_type: str = "inline",
        data: Any = None,
        parent_id: Optional[int] = None,
        function_name: Optional[str] = None,
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
            "function_name": function_name,
        }
        self.logs.append(log_entry)
        
        # Call status callback to stream immediately
        if self.status_callback:
            self.status_callback(log_entry)
            
        return self.current_id

    def start_section(self, title: str, data: Any = None, content_type: str = "clickable"):
        self.level += 1
        parent_id = self.add_log(title, content_type=content_type, data=data)
        return parent_id

    def end_section(self):
        self.level = max(0, self.level - 1)

    def get_logs(self) -> List[Dict[str, Any]]:
        return self.logs

    def clear(self):
        self.logs = []
        self.current_id = 0
        self.level = 0
        
    def set_status_callback(self, callback):
        """Set callback function to stream status updates immediately"""
        self.status_callback = callback

    def update_log_status(self, log_id: int, status: str, data: Any = None):
        """Update the status and optionally data of an existing log entry"""
        for log in self.logs:
            if log["id"] == log_id:
                log["status"] = status
                if data is not None:
                    log["content"]["data"] = data
                
                # Call status callback to stream status update immediately
                if self.status_callback:
                    self.status_callback(log)
                break

    def debug_track(self, title=None, content_type="clickable", track_args=True, track_result=True, optional=False):
        """Decorator to automatically track function execution in debug logs
        
        Args:
            title: Custom display name for the function
            content_type: "clickable" or "inline" 
            track_args: Whether to capture function arguments
            track_result: Whether to capture return value
            optional: If True, exceptions are caught and logged but not re-raised, allowing pipeline to continue
        """
        def decorator(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Auto-generate title if not provided
                func_title = title or f"Executing {func.__name__.replace('_', ' ').title()}"
                
                # Prepare input data
                input_data = {}
                if track_args:
                    try:
                        # Get function signature to map args to parameter names
                        sig = inspect.signature(func)
                        bound_args = sig.bind(*args, **kwargs)
                        bound_args.apply_defaults()
                        # Filter out 'self', complex objects, and other non-serializable parameters
                        for k, v in bound_args.arguments.items():
                            if k not in ['self', 'cls', 'client'] and not k.startswith('_'):
                                # Check if value is JSON serializable
                                try:
                                    import json
                                    json.dumps(v)
                                    input_data[k] = v
                                except (TypeError, ValueError):
                                    # For non-serializable objects, store type info
                                    input_data[k] = f"<{type(v).__name__} object>"
                    except Exception:
                        # Fallback if signature binding fails
                        input_data = {"note": "Could not capture function arguments"}
                
                # Start tracking this function (pending status)
                self.level += 1
                log_id = self.add_log(
                    title=func_title,
                    status="pending",
                    content_type=content_type,
                    data=input_data if input_data else None,
                    function_name=func.__name__
                )
                
                # Small delay to ensure pending status is visible
                import asyncio
                await asyncio.sleep(0.05)
                
                try:
                    # Execute the function
                    result = await func(*args, **kwargs)
                    
                    # Update with success
                    result_data = input_data.copy() if input_data else {}
                    if track_result and result is not None:
                        # Check if result is JSON serializable before including it
                        try:
                            import json
                            json.dumps(result)
                            # Only include result if it's reasonably sized and serializable
                            result_str = str(result)
                            if len(result_str) < 1000:
                                result_data["result"] = result
                            else:
                                result_data["result"] = f"<Large result: {type(result).__name__}>"
                        except (TypeError, ValueError):
                            # For non-serializable results, store type info
                            result_data["result"] = f"<{type(result).__name__} object>"
                    
                    self.update_log_status(log_id, "success", result_data)
                    return result
                    
                except Exception as e:
                    # Update with error - make it clickable with full details
                    import traceback
                    error_data = input_data.copy() if input_data else {}
                    error_data["error_message"] = str(e)
                    error_data["error_type"] = type(e).__name__
                    error_data["full_traceback"] = traceback.format_exc()
                    error_data["function_name"] = func.__name__
                    error_data["optional_failure"] = str(optional)
                    
                    # Update the log entry to be clickable and trigger status callback
                    self.update_log_status(log_id, "error", error_data)
                    # Also ensure it's clickable
                    for log in self.logs:
                        if log["id"] == log_id:
                            log["content"]["type"] = "clickable"  # Make errors clickable
                            break
                    
                    # Only re-raise if this is not an optional function
                    if not optional:
                        raise
                    
                    # For optional functions, return None and continue pipeline
                    return None
                finally:
                    self.level -= 1
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                # Auto-generate title if not provided
                func_title = title or f"Executing {func.__name__.replace('_', ' ').title()}"
                
                # Prepare input data
                input_data = {}
                if track_args:
                    try:
                        # Get function signature to map args to parameter names
                        sig = inspect.signature(func)
                        bound_args = sig.bind(*args, **kwargs)
                        bound_args.apply_defaults()
                        # Filter out 'self', complex objects, and other non-serializable parameters
                        for k, v in bound_args.arguments.items():
                            if k not in ['self', 'cls', 'client'] and not k.startswith('_'):
                                # Check if value is JSON serializable
                                try:
                                    import json
                                    json.dumps(v)
                                    input_data[k] = v
                                except (TypeError, ValueError):
                                    # For non-serializable objects, store type info
                                    input_data[k] = f"<{type(v).__name__} object>"
                    except Exception:
                        # Fallback if signature binding fails
                        input_data = {"note": "Could not capture function arguments"}
                
                # Start tracking this function (pending status)
                self.level += 1
                log_id = self.add_log(
                    title=func_title,
                    status="pending",
                    content_type=content_type,
                    data=input_data if input_data else None,
                    function_name=func.__name__
                )
                
                # Small delay to ensure pending status is visible
                import time
                time.sleep(0.05)
                
                try:
                    # Execute the function
                    result = func(*args, **kwargs)
                    
                    # Update with success
                    result_data = input_data.copy() if input_data else {}
                    if track_result and result is not None:
                        # Check if result is JSON serializable before including it
                        try:
                            import json
                            json.dumps(result)
                            # Only include result if it's reasonably sized and serializable
                            result_str = str(result)
                            if len(result_str) < 1000:
                                result_data["result"] = result
                            else:
                                result_data["result"] = f"<Large result: {type(result).__name__}>"
                        except (TypeError, ValueError):
                            # For non-serializable results, store type info
                            result_data["result"] = f"<{type(result).__name__} object>"
                    
                    self.update_log_status(log_id, "success", result_data)
                    return result
                    
                except Exception as e:
                    # Update with error - make it clickable with full details
                    import traceback
                    error_data = input_data.copy() if input_data else {}
                    error_data["error_message"] = str(e)
                    error_data["error_type"] = type(e).__name__
                    error_data["full_traceback"] = traceback.format_exc()
                    error_data["function_name"] = func.__name__
                    error_data["optional_failure"] = str(optional)
                    
                    # Update the log entry to be clickable and trigger status callback
                    self.update_log_status(log_id, "error", error_data)
                    # Also ensure it's clickable
                    for log in self.logs:
                        if log["id"] == log_id:
                            log["content"]["type"] = "clickable"  # Make errors clickable
                            break
                    
                    # Only re-raise if this is not an optional function
                    if not optional:
                        raise
                    
                    # For optional functions, return None and continue pipeline
                    return None
                finally:
                    self.level -= 1
                    
            return async_wrapper if inspect.iscoroutinefunction(func) else sync_wrapper
        return decorator

# Singleton instance
debug_logger = DebugLogger()

# Convenience decorator function
debug_track = debug_logger.debug_track