"""
Subject Integration: Data Structures (Hash Table)
Custom Hash Map implementation using Separate Chaining for collision resolution.
Maps 8-character RFID Tag UIDs (Hex) to Product Records in O(1) average time.
"""

from typing import Any, List, Optional, Tuple

class HashNode:
    """Linked list node used for separate chaining collision resolution."""
    def __init__(self, key: str, value: Any):
        self.key: str = key
        self.value: Any = value
        self.next: Optional['HashNode'] = None

class RFIDHashTable:
    """
    Fixed-bucket Hash Table with polynomial rolling hash function.
    Demonstrates:
    - Hash code generation & modular compression (hash % capacity)
    - Collision handling via Separate Chaining
    - O(1) average time complexity for RFID lookups
    """
    def __init__(self, initial_capacity: int = 16):
        self.capacity: int = initial_capacity
        self.size: int = 0
        self.buckets: List[Optional[HashNode]] = [None] * self.capacity

    def _hash_function(self, key: str) -> int:
        """
        Computes polynomial rolling hash for ASCII / Hex string keys.
        Formula: sum(ord(char) * 31^i) % capacity
        """
        hash_val = 0
        prime = 31
        for char in key:
            hash_val = (hash_val * prime + ord(char)) & 0xFFFFFFFF
        return hash_val % self.capacity

    def insert(self, key: str, value: Any) -> None:
        """Inserts or updates a key-value pair in O(1) average time."""
        clean_key = key.strip().upper()
        index = self._hash_function(clean_key)
        head = self.buckets[index]

        # Check if key already exists in bucket (Update)
        current = head
        while current is not None:
            if current.key == clean_key:
                current.value = value
                return
            current = current.next

        # Insert new node at head of chain
        new_node = HashNode(clean_key, value)
        new_node.next = head
        self.buckets[index] = new_node
        self.size += 1

    def get(self, key: str) -> Optional[Any]:
        """Retrieves value by key in O(1) average time. Returns None if absent."""
        clean_key = key.strip().upper()
        index = self._hash_function(clean_key)
        current = self.buckets[index]
        while current is not None:
            if current.key == clean_key:
                return current.value
            current = current.next
        return None

    def contains(self, key: str) -> bool:
        """Checks if key exists."""
        return self.get(key) is not None

    def delete(self, key: str) -> bool:
        """Deletes a key from the hash table. Returns True if found & removed."""
        clean_key = key.strip().upper()
        index = self._hash_function(clean_key)
        current = self.buckets[index]
        prev = None

        while current is not None:
            if current.key == clean_key:
                if prev is None:
                    self.buckets[index] = current.next
                else:
                    prev.next = current.next
                self.size -= 1
                return True
            prev = current
            current = current.next
        return False

    def load_factor(self) -> float:
        """Calculates current load factor: alpha = n / k."""
        return round(self.size / self.capacity, 3)

    def get_debug_structure(self) -> List[dict]:
        """Visualizes bucket chains for academic review and UI demo."""
        result = []
        for i, head in enumerate(self.buckets):
            chain = []
            curr = head
            while curr:
                chain.append({"key": curr.key, "product_id": curr.value.get("id") if isinstance(curr.value, dict) else curr.value})
                curr = curr.next
            if chain:
                result.append({"bucket_index": i, "chain_length": len(chain), "nodes": chain})
        return result
