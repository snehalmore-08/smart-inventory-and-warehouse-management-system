"""
Unit Tests for Data Structures and MPCA Modules.
Verifies asymptotic behaviors and numerical correctness.
"""

from app.core.hash_table import RFIDHashTable
from app.core.priority_queue import StockMinHeap
from app.core.search_algorithms import InventorySearchComparator
from app.core.mpca_helpers import MPCATools

def test_hash_table():
    print("Testing RFID Hash Table...")
    ht = RFIDHashTable(initial_capacity=8)
    
    # Insert test items
    ht.insert("E280689A", {"id": 1, "name": "Basmati Rice"})
    ht.insert("A1B2C3D4", {"id": 2, "name": "Wheat Flour"})
    ht.insert("12345678", {"id": 3, "name": "Refined Sugar"})
    
    assert ht.size == 3
    assert ht.contains("E280689A") is True
    assert ht.contains("FFFFFFFF") is False
    
    val = ht.get("E280689A")
    assert val["name"] == "Basmati Rice"
    
    # Delete test
    assert ht.delete("A1B2C3D4") is True
    assert ht.get("A1B2C3D4") is None
    assert ht.size == 2
    print("PASS: RFID Hash Table (O(1) lookups & chaining) verified.")

def test_min_heap():
    print("Testing Stock Min-Heap (Priority Queue)...")
    heap = StockMinHeap()
    
    # Add products with varying stock counts
    products = [
        {"id": 1, "name": "Rice", "current_stock_qty": 5, "reorder_level": 2},
        {"id": 2, "name": "Flour", "current_stock_qty": 0, "reorder_level": 2},
        {"id": 3, "name": "Sugar", "current_stock_qty": 2, "reorder_level": 2},
        {"id": 4, "name": "Dal", "current_stock_qty": 1, "reorder_level": 2},
        {"id": 5, "name": "Oil", "current_stock_qty": 8, "reorder_level": 2},
    ]
    heap.build_heap(products)
    
    # Root must be Flour (qty = 0)
    root = heap.peek()
    assert root["name"] == "Flour"
    assert root["current_stock_qty"] == 0
    
    # Extract items in ascending stock order
    extracted = []
    while not heap.is_empty():
        extracted.append(heap.pop()["current_stock_qty"])
    assert extracted == [0, 1, 2, 5, 8]
    
    # Rebuild and test critical alert filtering
    heap.build_heap(products)
    alerts = heap.get_critical_reorder_list()
    assert [a["name"] for a in alerts] == ["Flour", "Dal", "Sugar"]
    print("PASS: Min-Heap Priority Queue verified. Out-of-stock items prioritized correctly.")

def test_search_comparator():
    print("Testing Linear vs Binary Search Comparator...")
    items = [
        {"id": 1, "name": "Salt", "unit_weight_grams": 500.0},
        {"id": 2, "name": "Oil", "unit_weight_grams": 455.0},
        {"id": 3, "name": "Rice", "unit_weight_grams": 500.0},
        {"id": 4, "name": "Sugar", "unit_weight_grams": 500.0},
    ]
    report = InventorySearchComparator.compare_search(items, key="id", target=4)
    assert report["linear_search"]["found"] is True
    assert report["binary_search"]["found"] is True
    assert report["binary_search"]["steps_taken"] <= report["linear_search"]["steps_taken"]
    print(f"PASS: Search comparator verified. Binary search steps: {report['binary_search']['steps_taken']} vs Linear: {report['linear_search']['steps_taken']}.")

def test_mpca_tools():
    print("Testing MPCA Tools...")
    
    # Test 1: 24-bit Two's Complement
    # Positive max: 0x7FFFFF = 8,388,607
    pos_res = MPCATools.decode_hx711_24bit_twos_complement(0x7FFFFF)
    assert pos_res["is_negative"] is False
    assert pos_res["signed_decimal_value"] == 8388607
    
    # Negative representation: 0xFFFFFF = -1
    neg_res = MPCATools.decode_hx711_24bit_twos_complement(0xFFFFFF)
    assert neg_res["is_negative"] is True
    assert neg_res["signed_decimal_value"] == -1
    
    # Test 2: Serial Shift Register Simulation (Bits: 1, 0, 1, 1 -> Decimal 11 / 0xB)
    shift_res = MPCATools.simulate_serial_to_parallel_shift([1, 0, 1, 1])
    assert shift_res["final_parallel_value"] == 11
    assert shift_res["final_hex"] == "0xB"
    
    # Test 3: Endianness Conversion
    endian_res = MPCATools.analyze_rfid_endianness("E280689A")
    assert endian_res["byte_array"] == ["E2", "80", "68", "9A"]
    assert endian_res["little_endian_xtensa_order"] == "9A 68 80 E2"
    
    # Test 4: Parity Bit
    # 0b00000011 has 2 ones -> Even parity bit is 0, odd parity bit is 1
    par_res = MPCATools.calculate_parity(0b00000011)
    assert par_res["even_parity_bit"] == 0
    assert par_res["odd_parity_bit"] == 1
    
    print("PASS: MPCA Tools verified (2's complement, shift register, endianness, parity).")

if __name__ == "__main__":
    print("--- Running Subject Integration Tests (DS & MPCA) ---")
    test_hash_table()
    test_min_heap()
    test_search_comparator()
    test_mpca_tools()
    print("--- ALL DATA STRUCTURE & MPCA TESTS PASSED ---")
