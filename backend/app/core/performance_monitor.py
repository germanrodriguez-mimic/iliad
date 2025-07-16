"""
Performance monitoring utilities for database operations.
Helps track connection times, query performance, and identify bottlenecks.
"""

import time
import logging
from functools import wraps
from typing import Callable, Any
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class PerformanceMonitor:
    """Monitor database performance metrics."""
    
    def __init__(self):
        self.connection_times = []
        self.query_times = []
        self.total_connections = 0
        self.total_queries = 0
    
    def record_connection_time(self, duration: float):
        """Record a database connection time."""
        self.connection_times.append(duration)
        self.total_connections += 1
    
    def record_query_time(self, duration: float):
        """Record a database query time."""
        self.query_times.append(duration)
        self.total_queries += 1
    
    def get_stats(self) -> dict:
        """Get performance statistics."""
        if not self.connection_times and not self.query_times:
            return {
                "connections": {"count": 0, "avg_time": 0, "min_time": 0, "max_time": 0},
                "queries": {"count": 0, "avg_time": 0, "min_time": 0, "max_time": 0}
            }
        
        conn_stats = {
            "count": len(self.connection_times),
            "avg_time": sum(self.connection_times) / len(self.connection_times) if self.connection_times else 0,
            "min_time": min(self.connection_times) if self.connection_times else 0,
            "max_time": max(self.connection_times) if self.connection_times else 0
        }
        
        query_stats = {
            "count": len(self.query_times),
            "avg_time": sum(self.query_times) / len(self.query_times) if self.query_times else 0,
            "min_time": min(self.query_times) if self.query_times else 0,
            "max_time": max(self.query_times) if self.query_times else 0
        }
        
        return {
            "connections": conn_stats,
            "queries": query_stats
        }
    
    def log_stats(self):
        """Log current performance statistics."""
        stats = self.get_stats()
        logger.info("Database Performance Stats:")
        logger.info(f"  Connections: {stats['connections']['count']} total, "
                   f"{stats['connections']['avg_time']:.3f}s avg, "
                   f"{stats['connections']['min_time']:.3f}s min, "
                   f"{stats['connections']['max_time']:.3f}s max")
        logger.info(f"  Queries: {stats['queries']['count']} total, "
                   f"{stats['queries']['avg_time']:.3f}s avg, "
                   f"{stats['queries']['min_time']:.3f}s min, "
                   f"{stats['queries']['max_time']:.3f}s max")

# Global performance monitor instance
performance_monitor = PerformanceMonitor()

@contextmanager
def time_operation(operation_type: str):
    """Context manager to time database operations."""
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        if operation_type == "connection":
            performance_monitor.record_connection_time(duration)
        elif operation_type == "query":
            performance_monitor.record_query_time(duration)
        
        logger.debug(f"{operation_type.title()} took {duration:.3f}s")

def monitor_performance(operation_type: str = "query"):
    """Decorator to monitor function performance."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                if operation_type == "connection":
                    performance_monitor.record_connection_time(duration)
                elif operation_type == "query":
                    performance_monitor.record_query_time(duration)
                
                logger.debug(f"{func.__name__} ({operation_type}) took {duration:.3f}s")
        
        return wrapper
    return decorator

def query_timer(func: Callable) -> Callable:
    """Simple decorator to time database query functions."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            duration = time.perf_counter() - start_time
            logger.info(f"Query {func.__name__} took {duration:.3f}s")
            performance_monitor.record_query_time(duration)
    return wrapper

def get_performance_stats() -> dict:
    """Get current performance statistics."""
    return performance_monitor.get_stats()

def log_performance_stats():
    """Log current performance statistics."""
    performance_monitor.log_stats() 