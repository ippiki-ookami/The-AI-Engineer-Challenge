import time
from typing import List, Dict, Any, Optional
from functools import wraps
import inspect
import ast
import textwrap

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
    
    def _get_function_source(self, func):
        """Extract source code and metadata for a function"""
        try:
            # Get the source code
            source_lines, start_line = inspect.getsourcelines(func)
            source_code = ''.join(source_lines)
            
            # Clean up indentation
            source_code = textwrap.dedent(source_code)
            
            # Get file path
            file_path = inspect.getfile(func)
            
            # Try to get just the relative path from project root
            if '/The-AI-Engineer-Challenge/' in file_path:
                relative_path = file_path.split('/The-AI-Engineer-Challenge/')[-1]
            else:
                relative_path = file_path
            
            # Get function signature
            try:
                signature = str(inspect.signature(func))
            except Exception:
                signature = "(...)"
            
            return {
                "source_code": source_code,
                "file_path": relative_path,
                "start_line": start_line,
                "function_name": func.__name__,
                "signature": signature,
                "docstring": inspect.getdoc(func) or "No documentation available"
            }
        except Exception as e:
            return {
                "source_code": f"# Source code not available: {str(e)}",
                "file_path": "unknown",
                "start_line": 0,
                "function_name": func.__name__,
                "signature": "(...)",
                "docstring": "Documentation not available"
            }

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
                    
                    # Update with success - create clear input/output structure
                    result_data = {}
                    
                    # Add inputs section if we have input data
                    if input_data:
                        result_data["📥 INPUTS"] = input_data
                    
                    # Add source code section
                    result_data["💻 SOURCE"] = self._get_function_source(func)
                    
                    # Add outputs section if we should track results
                    if track_result and result is not None:
                        # Check if result is JSON serializable before including it
                        try:
                            import json
                            json.dumps(result)
                            # Only include result if it's reasonably sized and serializable
                            result_str = str(result)
                            if len(result_str) < 1000:
                                result_data["📤 OUTPUT"] = result
                            else:
                                result_data["📤 OUTPUT"] = f"<Large result: {type(result).__name__}>"
                        except (TypeError, ValueError):
                            # For non-serializable results, store type info
                            result_data["📤 OUTPUT"] = f"<{type(result).__name__} object>"
                    elif track_result:
                        result_data["📤 OUTPUT"] = None
                    
                    self.update_log_status(log_id, "success", result_data)
                    return result
                    
                except Exception as e:
                    # Update with error - create clear input/error structure
                    import traceback
                    error_data = {}
                    
                    # Add inputs section if we have input data
                    if input_data:
                        error_data["📥 INPUTS"] = input_data
                    
                    # Add source code section
                    error_data["💻 SOURCE"] = self._get_function_source(func)
                    
                    # Add error section
                    error_data["❌ ERROR"] = {
                        "error_message": str(e),
                        "error_type": type(e).__name__,
                        "full_traceback": traceback.format_exc(),
                        "function_name": func.__name__,
                        "optional_failure": str(optional)
                    }
                    
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
                    
                    # Update with success - create clear input/output structure
                    result_data = {}
                    
                    # Add inputs section if we have input data
                    if input_data:
                        result_data["📥 INPUTS"] = input_data
                    
                    # Add source code section
                    result_data["💻 SOURCE"] = self._get_function_source(func)
                    
                    # Add outputs section if we should track results
                    if track_result and result is not None:
                        # Check if result is JSON serializable before including it
                        try:
                            import json
                            json.dumps(result)
                            # Only include result if it's reasonably sized and serializable
                            result_str = str(result)
                            if len(result_str) < 1000:
                                result_data["📤 OUTPUT"] = result
                            else:
                                result_data["📤 OUTPUT"] = f"<Large result: {type(result).__name__}>"
                        except (TypeError, ValueError):
                            # For non-serializable results, store type info
                            result_data["📤 OUTPUT"] = f"<{type(result).__name__} object>"
                    elif track_result:
                        result_data["📤 OUTPUT"] = None
                    
                    self.update_log_status(log_id, "success", result_data)
                    return result
                    
                except Exception as e:
                    # Update with error - create clear input/error structure
                    import traceback
                    error_data = {}
                    
                    # Add inputs section if we have input data
                    if input_data:
                        error_data["📥 INPUTS"] = input_data
                    
                    # Add source code section
                    error_data["💻 SOURCE"] = self._get_function_source(func)
                    
                    # Add error section
                    error_data["❌ ERROR"] = {
                        "error_message": str(e),
                        "error_type": type(e).__name__,
                        "full_traceback": traceback.format_exc(),
                        "function_name": func.__name__,
                        "optional_failure": str(optional)
                    }
                    
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