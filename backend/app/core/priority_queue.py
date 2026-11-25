"""
Subject Integration: Data Structures (Min-Heap / Priority Queue)
Maintains real-time priority ranking of grocery inventory.
Items with the lowest stock quantity are prioritized at the root for immediate reorder alerts.
"""

from typing import Any, Dict, List, Optional

class StockMinHeap:
    """
    Array-based Binary Min-Heap.
    Properties:
    - Complete Binary Tree stored in a contiguous list.
    - Parent index: (i - 1) // 2
    - Left Child: 2 * i + 1
    - Right Child: 2 * i + 2
    - Heap Property: heap[parent]["priority"] <= heap[child]["priority"]
    """
    def __init__(self):
        self.heap: List[Dict[str, Any]] = []

    def _parent(self, i: int) -> int:
        return (i - 1) // 2

    def _left_child(self, i: int) -> int:
        return 2 * i + 1

    def _right_child(self, i: int) -> int:
        return 2 * i + 2

    def _swap(self, i: int, j: int) -> None:
        self.heap[i], self.heap[j] = self.heap[j], self.heap[i]

    def _priority(self, index: int) -> int:
        """Returns the comparison key (current_stock_qty)."""
        return self.heap[index].get("current_stock_qty", 0)

    def _heapify_up(self, index: int) -> None:
        """Restores heap invariant upwards after an insertion - O(log N)."""
        while index > 0 and self._priority(index) < self._priority(self._parent(index)):
            parent_idx = self._parent(index)
            self._swap(index, parent_idx)
            index = parent_idx

    def _heapify_down(self, index: int) -> None:
        """Restores heap invariant downwards after root extraction - O(log N)."""
        smallest = index
        left = self._left_child(index)
        right = self._right_child(index)
        n = len(self.heap)

        if left < n and self._priority(left) < self._priority(smallest):
            smallest = left
        if right < n and self._priority(right) < self._priority(smallest):
            smallest = right

        if smallest != index:
            self._swap(index, smallest)
            self._heapify_down(smallest)

    def push(self, item: Dict[str, Any]) -> None:
        """Inserts a new product into the priority queue in O(log N) time."""
        self.heap.append(item.copy())
        self._heapify_up(len(self.heap) - 1)

    def pop(self) -> Optional[Dict[str, Any]]:
        """Removes and returns the item with the lowest stock in O(log N) time."""
        if not self.heap:
            return None
        if len(self.heap) == 1:
            return self.heap.pop()

        root = self.heap[0]
        self.heap[0] = self.heap.pop()
        self._heapify_down(0)
        return root

    def peek(self) -> Optional[Dict[str, Any]]:
        """Inspects the most critically depleted item in O(1) time."""
        return self.heap[0] if self.heap else None

    def build_heap(self, items: List[Dict[str, Any]]) -> None:
        """Constructs heap from arbitrary list in linear O(N) time using Floyd's algorithm."""
        self.heap = [item.copy() for item in items]
        n = len(self.heap)
        for i in range(n // 2 - 1, -1, -1):
            self._heapify_down(i)

    def size(self) -> int:
        return len(self.heap)

    def is_empty(self) -> bool:
        return len(self.heap) == 0

    def get_critical_reorder_list(self) -> List[Dict[str, Any]]:
        """
        Returns all products whose current_stock_qty <= reorder_level,
        ordered from most critical to least critical.
        """
        # Create a copy so the main heap is not emptied
        temp_heap = StockMinHeap()
        temp_heap.heap = [item.copy() for item in self.heap]
        
        alerts = []
        while not temp_heap.is_empty():
            item = temp_heap.pop()
            if item.get("current_stock_qty", 0) <= item.get("reorder_level", 2):
                alerts.append(item)
        return alerts
