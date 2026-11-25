"""
Subject Integration: Data Structures & Algorithms
Linear Search vs. Binary Search Benchmark Module.
Compares search iterations and asymptotic complexity for inventory auditing.
"""

from typing import Any, Dict, List, Optional, Tuple

class InventorySearchComparator:
    """
    Executes and benchmarks Linear Search (O(N)) vs Binary Search (O(log N))
    over grocery inventory items sorted by target attribute (e.g. weight, ID, name).
    """

    @staticmethod
    def linear_search(items: List[Dict[str, Any]], key: str, target: Any) -> Tuple[Optional[Dict[str, Any]], int]:
        """
        Performs sequential linear search across unsorted or sorted array.
        Time Complexity: O(N)
        Returns: (matched_item, comparison_count)
        """
        comparisons = 0
        for item in items:
            comparisons += 1
            if item.get(key) == target:
                return item, comparisons
        return None, comparisons

    @staticmethod
    def binary_search(sorted_items: List[Dict[str, Any]], key: str, target: Any) -> Tuple[Optional[Dict[str, Any]], int]:
        """
        Performs divide-and-conquer binary search on a sorted array.
        Time Complexity: O(log N)
        Precondition: sorted_items must be sorted by 'key'.
        Returns: (matched_item, comparison_count)
        """
        low = 0
        high = len(sorted_items) - 1
        comparisons = 0

        while low <= high:
            comparisons += 1
            mid = (low + high) // 2
            mid_val = sorted_items[mid].get(key)

            if mid_val == target:
                return sorted_items[mid], comparisons
            elif mid_val < target:
                low = mid + 1
            else:
                high = mid - 1

        return None, comparisons

    @classmethod
    def compare_search(cls, items: List[Dict[str, Any]], key: str, target: Any) -> Dict[str, Any]:
        """
        Executes both search algorithms side-by-side and returns a detailed
        comparison report with iteration counts for academic demonstration.
        """
        # Ensure items are sorted for binary search
        sorted_list = sorted(items, key=lambda x: x.get(key))
        
        linear_result, linear_steps = cls.linear_search(items, key, target)
        binary_result, binary_steps = cls.binary_search(sorted_list, key, target)

        return {
            "search_key": key,
            "target_value": target,
            "total_items": len(items),
            "linear_search": {
                "algorithm": "Linear Search",
                "time_complexity": "O(N)",
                "steps_taken": linear_steps,
                "found": linear_result is not None
            },
            "binary_search": {
                "algorithm": "Binary Search",
                "time_complexity": "O(log N)",
                "steps_taken": binary_steps,
                "found": binary_result is not None
            },
            "efficiency_gain": f"{round((linear_steps - binary_steps) / max(linear_steps, 1) * 100, 1)}% fewer comparisons" if linear_steps > binary_steps else "Identical or small dataset"
        }
