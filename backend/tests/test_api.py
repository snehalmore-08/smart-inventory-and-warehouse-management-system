"""
Automated Integration Tests for Inventory API Endpoints.
Verifies HTTP status codes, Pydantic responses, and database updates.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "Smart Inventory & Warehouse Management" in response.text
    print("PASS: GET / returned 200 OK and serves index.html dashboard.")

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"]["connected"] is True
    assert data["database"]["total_products"] == 6
    assert data["warehouse_scale"]["max_capacity_kg"] == 10.0
    print(f"PASS: GET /api/health returned healthy, 6 products in DB, 10kg scale limit verified.")

def test_list_categories():
    response = client.get("/api/inventory/categories")
    assert response.status_code == 200
    cats = response.json()
    assert len(cats) >= 6
    print(f"PASS: GET /api/inventory/categories returned {len(cats)} grocery categories.")

def test_list_products():
    response = client.get("/api/inventory/products")
    assert response.status_code == 200
    prods = response.json()
    assert len(prods) == 6
    # Verify rice product
    rice = prods[0]
    assert "Rice" in rice["name"]
    assert rice["unit_weight_grams"] == 500.0
    assert rice["current_stock_qty"] == 0
    assert rice["is_low_stock"] is True  # 0 <= reorder_level (2)
    print("PASS: GET /api/inventory/products verified. Rice sample is 500g, low_stock=True.")

def test_assign_rfid_tag():
    # Test assigning tag to product 1 (Rice)
    tag_uid = "E280689A"
    res = client.post("/api/inventory/products/1/assign-rfid", json={"rfid_uid": tag_uid})
    assert res.status_code == 200
    updated = res.json()
    assert updated["rfid_uid"] == tag_uid
    print(f"PASS: POST /api/inventory/products/1/assign-rfid successfully paired UID {tag_uid} to '{updated['name']}'.")

    # Test assigning the SAME tag to product 2 (Wheat) -> Must return 409 Conflict
    res_dup = client.post("/api/inventory/products/2/assign-rfid", json={"rfid_uid": tag_uid})
    assert res_dup.status_code == 409
    print(f"PASS: Duplicate RFID tag assignment rejected with 409 Conflict (Referential safety verified).")

def test_academic_endpoints():
    # 1. Hash Table
    r1 = client.get("/api/academic/hash-table")
    assert r1.status_code == 200
    assert r1.json()["data_structure"] == "Hash Table with Separate Chaining"
    print("PASS: GET /api/academic/hash-table verified.")

    # 2. Priority Queue
    r2 = client.get("/api/academic/priority-queue")
    assert r2.status_code == 200
    assert "Binary Min-Heap" in r2.json()["data_structure"]
    print("PASS: GET /api/academic/priority-queue verified.")

    # 3. Search Benchmark
    r3 = client.post("/api/academic/search-benchmark", json={"search_key": "id", "target_value": 3})
    assert r3.status_code == 200
    assert r3.json()["binary_search"]["found"] is True
    print(f"PASS: POST /api/academic/search-benchmark verified (Linear vs Binary Search).")

    # 4. MPCA Two's Complement
    r4 = client.post("/api/academic/mpca/decode-twos-complement", json={"raw_24bit_hex": "0xFFFFFF"})
    assert r4.status_code == 200
    assert r4.json()["signed_decimal_value"] == -1
    print("PASS: POST /api/academic/mpca/decode-twos-complement verified (0xFFFFFF -> -1).")

    # 5. MPCA Endianness
    r5 = client.post("/api/academic/mpca/endianness", json={"hex_uid": "E280689A"})
    assert r5.status_code == 200
    assert r5.json()["little_endian_xtensa_order"] == "9A 68 80 E2"
    print("PASS: POST /api/academic/mpca/endianness verified.")

def test_hardware_scan_endpoint():
    print("\n--- Testing Hardware Scan (/api/hardware/scan) ---")
    
    # 1. Reject unknown RFID UID
    r_unknown = client.post("/api/hardware/scan", json={
        "rfid_uid": "NON_EXISTENT_TAG",
        "measured_weight_grams": 500.0,
        "operation_mode": "STOCK_IN"
    })
    assert r_unknown.status_code == 404
    print("PASS: Unknown RFID tag rejected with 404 Not Found.")

    # 2. Reject zero or negative weight
    r_zero = client.post("/api/hardware/scan", json={
        "rfid_uid": "E280689A",
        "measured_weight_grams": 0.0,
        "operation_mode": "STOCK_IN"
    })
    assert r_zero.status_code == 400
    print("PASS: 0g weight rejected with 400 Bad Request.")

    # 3. Reject weight exceeding 10kg load cell capacity
    r_overload = client.post("/api/hardware/scan", json={
        "rfid_uid": "E280689A",
        "measured_weight_grams": 11500.0,
        "operation_mode": "STOCK_IN"
    })
    assert r_overload.status_code == 400
    print("PASS: >10kg weight rejected with 400 Bad Request (Load cell overload protection).")

    # 4. Reject weight outside tolerance (Expected 500g ± 35g: test with 250g)
    r_tolerance = client.post("/api/hardware/scan", json={
        "rfid_uid": "E280689A",
        "measured_weight_grams": 250.0,
        "operation_mode": "STOCK_IN"
    })
    assert r_tolerance.status_code == 422
    print("PASS: Weight diverging from tolerance rejected with 422 Unprocessable Entity.")

    # 5. Reject invalid operation mode
    r_mode = client.post("/api/hardware/scan", json={
        "rfid_uid": "E280689A",
        "measured_weight_grams": 500.0,
        "operation_mode": "INVALID_MODE"
    })
    assert r_mode.status_code == 400
    print("PASS: Invalid operation mode rejected with 400 Bad Request.")

    # 6. Reject STOCK_OUT when stock is 0
    r_stockout_empty = client.post("/api/hardware/scan", json={
        "rfid_uid": "E280689A",
        "measured_weight_grams": 500.0,
        "operation_mode": "STOCK_OUT"
    })
    assert r_stockout_empty.status_code == 400
    assert "Current stock is 0" in r_stockout_empty.json()["detail"]
    print("PASS: Stock-out on 0 units rejected with 400 Bad Request (Negative stock prevented).")

    # 7. Real STOCK_IN test with Basmati Rice (UID: E280689A, 500.0g)
    r_stockin = client.post("/api/hardware/scan", json={
        "rfid_uid": "E280689A",
        "measured_weight_grams": 500.0,
        "operation_mode": "STOCK_IN"
    })
    assert r_stockin.status_code == 200
    stockin_data = r_stockin.json()
    assert stockin_data["success"] is True
    assert stockin_data["current_stock_qty"] == 1
    assert stockin_data["current_total_weight_grams"] == 500.0
    assert stockin_data["transaction_type"] == "STOCK_IN"
    print("PASS: Real STOCK_IN executed successfully. Stock increased to 1 unit (500.0g).")

    # 8. Real STOCK_OUT test to cleanly restore database to initial state (0 units)
    r_stockout = client.post("/api/hardware/scan", json={
        "rfid_uid": "E280689A",
        "measured_weight_grams": 500.0,
        "operation_mode": "STOCK_OUT"
    })
    assert r_stockout.status_code == 200
    stockout_data = r_stockout.json()
    assert stockout_data["success"] is True
    assert stockout_data["current_stock_qty"] == 0
    assert stockout_data["current_total_weight_grams"] == 0.0
    assert stockout_data["transaction_type"] == "STOCK_OUT"
    print("PASS: Real STOCK_OUT executed successfully. Stock restored to 0 units (0.0g).")

    # Clean up test transaction records to leave database in pristine state
    from app.db.connection import get_db
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE inventory_transactions;")
        conn.commit()
    print("PASS: Test transaction records cleared. Database restored to pristine state.")

def test_product_pages():
    print("\n--- Testing Product Management Pages ---")
    r1 = client.get("/products")
    assert r1.status_code == 200
    assert "Product Management & Catalog" in r1.text
    print("PASS: GET /products serves products.html dashboard.")

    r2 = client.get("/products.html")
    assert r2.status_code == 200
    assert "Product Management & Catalog" in r2.text
    print("PASS: GET /products.html serves products.html dashboard.")

def test_product_management_crud():
    print("\n--- Testing Product Management CRUD API ---")
    from app.db.connection import get_db

    # 1. Validation Rejections on POST /api/inventory/products
    # 1a. Empty name
    r_empty_name = client.post("/api/inventory/products", json={
        "name": "",
        "category_id": 1,
        "unit_weight_grams": 250.0,
        "initial_stock_qty": 0
    })
    assert r_empty_name.status_code in [400, 422]
    print("PASS: Empty product name rejected with 422/400.")

    # 1b. Non-existent category
    r_bad_cat = client.post("/api/inventory/products", json={
        "name": "Invalid Category Item",
        "category_id": 9999,
        "unit_weight_grams": 100.0,
        "initial_stock_qty": 0
    })
    assert r_bad_cat.status_code == 400
    print("PASS: Invalid category_id rejected with 400 Bad Request.")

    # 1c. Zero / negative unit weight
    r_bad_weight = client.post("/api/inventory/products", json={
        "name": "Zero Weight Item",
        "category_id": 1,
        "unit_weight_grams": 0.0,
        "initial_stock_qty": 0
    })
    assert r_bad_weight.status_code in [400, 422]
    print("PASS: Zero unit weight rejected with 422/400.")

    # 2. Successful Product Creation (with initial stock and RFID tag)
    test_tag = "TEST_TAG_99"
    new_id = None
    try:
        r_create = client.post("/api/inventory/products", json={
            "name": "Test Darjeeling Green Tea",
            "category_id": 1,
            "unit_weight_grams": 250.0,
            "weight_tolerance_grams": 20.0,
            "reorder_level": 3,
            "initial_stock_qty": 2,
            "rfid_uid": test_tag
        })
        assert r_create.status_code == 201
        new_prod = r_create.json()
        new_id = new_prod["id"]
        assert new_prod["name"] == "Test Darjeeling Green Tea"
        assert new_prod["current_stock_qty"] == 2
        assert new_prod["current_total_weight"] == 500.0
        assert new_prod["rfid_uid"] == test_tag
        print(f"PASS: Product created successfully with ID {new_id}, initial stock 2, 500.0g (201 Created).")

        # 3. Reject duplicate RFID UID on creation
        r_dup_create = client.post("/api/inventory/products", json={
            "name": "Duplicate Tag Product",
            "category_id": 1,
            "unit_weight_grams": 200.0,
            "rfid_uid": test_tag
        })
        assert r_dup_create.status_code == 409
        print("PASS: Duplicate RFID tag on product creation rejected with 409 Conflict.")

        # 4. Product Update (PUT /api/inventory/products/{id})
        # 4a. Reject duplicate RFID tag assignment on update (try assigning tag already on product 1)
        r_dup_update = client.put(f"/api/inventory/products/{new_id}", json={
            "rfid_uid": "E280689A"
        })
        assert r_dup_update.status_code == 409
        print("PASS: Duplicate RFID tag collision on product update rejected with 409 Conflict.")

        # 4b. Update specs (name, reorder_level, unit_weight)
        r_update_specs = client.put(f"/api/inventory/products/{new_id}", json={
            "name": "Test Premium Darjeeling Green Tea",
            "reorder_level": 5,
            "unit_weight_grams": 300.0
        })
        assert r_update_specs.status_code == 200
        updated_specs = r_update_specs.json()
        assert updated_specs["name"] == "Test Premium Darjeeling Green Tea"
        assert updated_specs["reorder_level"] == 5
        assert updated_specs["unit_weight_grams"] == 300.0
        # 2 units * 300g = 600g
        assert updated_specs["current_total_weight"] == 600.0
        print("PASS: Product specs updated and physical weight recalculated.")

        # 4c. Safe stock quantity adjustment (increase stock to 4 units)
        r_adjust_stock = client.put(f"/api/inventory/products/{new_id}", json={
            "current_stock_qty": 4
        })
        assert r_adjust_stock.status_code == 200
        updated_stock = r_adjust_stock.json()
        assert updated_stock["current_stock_qty"] == 4
        assert updated_stock["current_total_weight"] == 1200.0
        print("PASS: Stock safely adjusted to 4 units (1200.0g).")

        # 5. Delete Protection Validation (DELETE /api/inventory/products/{id})
        # 5a. Block deletion when stock > 0 remains
        r_del_stock_fail = client.delete(f"/api/inventory/products/{new_id}")
        assert r_del_stock_fail.status_code == 400
        assert "Physical stock" in r_del_stock_fail.json()["detail"]
        print("PASS: Product deletion rejected when physical stock > 0 remains (Safety verified).")

        # 5b. Reduce stock to 0 units
        r_zero_stock = client.put(f"/api/inventory/products/{new_id}", json={
            "current_stock_qty": 0
        })
        assert r_zero_stock.status_code == 200
        assert r_zero_stock.json()["current_stock_qty"] == 0

        # 5c. Block deletion when transaction history exists
        r_del_trans_fail = client.delete(f"/api/inventory/products/{new_id}")
        assert r_del_trans_fail.status_code == 400
        assert "transaction log record" in r_del_trans_fail.json()["detail"]
        print("PASS: Product deletion rejected when transaction history exists (Foreign key & audit protection).")

        # 6. Clean Deletion after clearing audit transactions for test product
        with get_db() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM inventory_transactions WHERE product_id = %s;", (new_id,))
                cursor.execute("UPDATE warehouse_metrics SET current_load_kg = (SELECT COALESCE(SUM(current_total_weight)/1000.0, 0.0) FROM products WHERE id != %s) WHERE id = 1;", (new_id,))
            conn.commit()

        r_del_success = client.delete(f"/api/inventory/products/{new_id}")
        assert r_del_success.status_code == 200
        assert r_del_success.json()["success"] is True
        print(f"PASS: Product ID {new_id} cleanly deleted when safe.")

        # 7. Verify 404 for deleted product
        r_404 = client.get(f"/api/inventory/products/{new_id}")
        assert r_404.status_code == 404
        print("PASS: GET on deleted product ID returns 404 Not Found.")

        # 8. Verify total product count remains 6
        r_list = client.get("/api/inventory/products")
        assert r_list.status_code == 200
        assert len(r_list.json()) == 6
        print("PASS: Product catalog successfully restored to 6 seed items.")

    finally:
        # 9. Clean up any lingering test state to guarantee pristine baseline
        with get_db() as conn:
            with conn.cursor() as cursor:
                if new_id:
                    cursor.execute("DELETE FROM inventory_transactions WHERE product_id = %s;", (new_id,))
                    cursor.execute("DELETE FROM products WHERE id = %s;", (new_id,))
                cursor.execute("TRUNCATE TABLE inventory_transactions;")
                cursor.execute("UPDATE warehouse_metrics SET current_load_kg = 0.000 WHERE id = 1;")
            conn.commit()
        from app.api.academic import refresh_in_memory_data_structures
        refresh_in_memory_data_structures()
        print("PASS: Database transaction tables, scale load, and in-memory DS restored to pristine baseline.")

def test_transactions_endpoint():
    print("\n--- Testing Transactions Audit API ---")
    response = client.get("/api/inventory/transactions?limit=10")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    print("PASS: GET /api/inventory/transactions returned 200 OK and valid JSON array.")

if __name__ == "__main__":
    print("--- Running Backend API Tests ---")
    test_root()
    test_health()
    test_list_categories()
    test_list_products()
    test_transactions_endpoint()
    test_assign_rfid_tag()
    test_academic_endpoints()
    test_hardware_scan_endpoint()
    test_product_pages()
    test_product_management_crud()
    print("\n--- ALL BACKEND, HARDWARE & PRODUCT MANAGEMENT TESTS PASSED ---")
