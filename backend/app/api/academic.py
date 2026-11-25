"""
Subject Integration API Endpoints: Data Structures & MPCA.
Provides live interactive inspection of in-memory data structures
and microprocessor architecture operations for college viva demonstrations.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.db.connection import get_db
from app.core.hash_table import RFIDHashTable
from app.core.priority_queue import StockMinHeap
from app.core.search_algorithms import InventorySearchComparator
from app.core.mpca_helpers import MPCATools

router = APIRouter(prefix="/api/academic", tags=["Academic Integration (DS & MPCA)"])

# Global in-memory data structure instances
rfid_hash_table = RFIDHashTable(initial_capacity=16)
stock_min_heap = StockMinHeap()

def refresh_in_memory_data_structures():
    """Syncs in-memory Hash Table and Min-Heap with current MySQL state."""
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT p.id, p.rfid_uid, p.name, p.current_stock_qty, p.reorder_level,
                       CAST(p.unit_weight_grams AS DOUBLE) as unit_weight_grams,
                       CAST(p.current_total_weight AS DOUBLE) as current_total_weight
                FROM products p;
            """)
            products = cursor.fetchall()

    # Rebuild Hash Table
    rfid_hash_table.buckets = [None] * rfid_hash_table.capacity
    rfid_hash_table.size = 0
    for p in products:
        if p["rfid_uid"]:
            rfid_hash_table.insert(p["rfid_uid"], p)

    # Rebuild Min-Heap
    stock_min_heap.build_heap(products)
    return products

class SearchBenchmarkRequest(BaseModel):
    search_key: str = Field(default="id", description="Field to search by: 'id', 'name', or 'unit_weight_grams'")
    target_value: Any = Field(default=3, description="Target value to search for")

class TwosComplementRequest(BaseModel):
    raw_24bit_hex: str = Field(default="0x7FFFFF", description="Hexadecimal 24-bit raw ADC reading from HX711")

class EndiannessRequest(BaseModel):
    hex_uid: str = Field(default="E280689A", description="4-byte or 7-byte RFID UID hex string")

@router.get("/hash-table")
def inspect_hash_table():
    """Inspects the internal buckets and collision chains of the RFID Hash Table."""
    refresh_in_memory_data_structures()
    return {
        "data_structure": "Hash Table with Separate Chaining",
        "time_complexity": "O(1) average lookup",
        "capacity": rfid_hash_table.capacity,
        "item_count": rfid_hash_table.size,
        "load_factor": rfid_hash_table.load_factor(),
        "bucket_chains": rfid_hash_table.get_debug_structure()
    }

@router.get("/priority-queue")
def inspect_priority_queue():
    """Inspects the Min-Heap array and critical reorder alerts."""
    refresh_in_memory_data_structures()
    return {
        "data_structure": "Binary Min-Heap (Array Representation)",
        "priority_key": "current_stock_qty (lowest stock = highest priority)",
        "time_complexity": "O(log N) insert/delete, O(1) peek",
        "heap_size": stock_min_heap.size(),
        "root_item": stock_min_heap.peek(),
        "heap_array_view": stock_min_heap.heap,
        "critical_reorder_list": stock_min_heap.get_critical_reorder_list()
    }

@router.post("/search-benchmark")
def benchmark_search(request: SearchBenchmarkRequest):
    """Benchmarks Linear Search (O(N)) vs Binary Search (O(log N)) on inventory items."""
    products = refresh_in_memory_data_structures()
    return InventorySearchComparator.compare_search(
        items=products,
        key=request.search_key,
        target=request.target_value
    )

@router.post("/mpca/decode-twos-complement")
def decode_twos_complement(request: TwosComplementRequest):
    """Decodes a 24-bit raw value from the HX711 ADC into a signed integer."""
    raw_int = int(request.raw_24bit_hex, 16)
    return MPCATools.decode_hx711_24bit_twos_complement(raw_int)

@router.post("/mpca/endianness")
def analyze_endianness(request: EndiannessRequest):
    """Analyzes Big-Endian (SPI bus) vs Little-Endian (ESP32 CPU) memory layout."""
    return MPCATools.analyze_rfid_endianness(request.hex_uid)
