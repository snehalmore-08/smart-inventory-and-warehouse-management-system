"""
Hardware Communication & Scan Processing API.
Endpoint: POST /api/hardware/scan
Processes real-time scan events from ESP32 (Wi-Fi HTTP Client) and Simulator.
Enforces ACID transactions, 10kg load cell overload safety, and weight verification.
"""

from fastapi import APIRouter, HTTPException, status
import pymysql

from app.config import settings
from app.db.connection import get_db
from app.schemas.hardware_schema import HardwareScanPayload, HardwareScanResponse
from app.api.academic import refresh_in_memory_data_structures

router = APIRouter(prefix="/api/hardware", tags=["Hardware Integration (ESP32 / RC522 / HX711)"])

@router.post("/scan", response_model=HardwareScanResponse)
def process_hardware_scan(payload: HardwareScanPayload):
    """
    Ingests physical sensor readings from ESP32 or Dashboard Simulator:
    - Validates RFID Tag UID against registered products
    - Verifies measured weight against expected nominal weight & tolerance
    - Enforces 10kg load cell maximum capacity
    - Applies ACID transaction for stock-in / stock-out
    - Writes immutable transaction record in MySQL
    """
    # 1. Clean & validate inputs
    clean_rfid = payload.rfid_uid.strip().upper()
    if not clean_rfid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RFID UID cannot be empty."
        )

    # 2. Validate Operation Mode
    raw_mode = payload.operation_mode.strip().upper() if payload.operation_mode else "AUTO"
    if raw_mode not in ["AUTO", "STOCK_IN", "STOCK_OUT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid operation mode '{raw_mode}'. Must be 'STOCK_IN', 'STOCK_OUT', or 'AUTO'."
        )

    # 3. Validate Measured Weight
    if payload.measured_weight_grams <= 0.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Measured weight must be greater than 0 grams."
        )

    if payload.measured_weight_grams > settings.MAX_CAPACITY_GRAMS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Overload Protection Error: Measured weight ({payload.measured_weight_grams:.1f}g) "
                f"exceeds the 10kg load cell physical capacity ({settings.MAX_CAPACITY_GRAMS:.1f}g)."
            )
        )

    # 4. Database ACID Transaction
    with get_db() as conn:
        with conn.cursor() as cursor:
            # Query product with exclusive row lock (FOR UPDATE)
            query_product = """
                SELECT 
                    id, 
                    name, 
                    category_id, 
                    CAST(unit_weight_grams AS DOUBLE) AS unit_weight_grams,
                    CAST(weight_tolerance_grams AS DOUBLE) AS weight_tolerance_grams,
                    current_stock_qty, 
                    CAST(current_total_weight AS DOUBLE) AS current_total_weight,
                    reorder_level
                FROM products 
                WHERE rfid_uid = %s 
                FOR UPDATE;
            """
            cursor.execute(query_product, (clean_rfid,))
            product = cursor.fetchone()

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Unknown RFID UID '{clean_rfid}'. No grocery product is paired with this tag."
                )

            # Weight tolerance check
            nominal = product["unit_weight_grams"]
            tolerance = product["weight_tolerance_grams"]
            min_allowed = max(0.0, nominal - tolerance)
            max_allowed = nominal + tolerance

            if not (min_allowed <= payload.measured_weight_grams <= max_allowed):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        f"Weight Discrepancy Error: Measured weight {payload.measured_weight_grams:.1f}g "
                        f"diverges beyond allowable tolerance (±{tolerance:.1f}g) for '{product['name']}'. "
                        f"Expected {nominal:.1f}g (Range: {min_allowed:.1f}g to {max_allowed:.1f}g)."
                    )
                )

            # Determine final mode (resolve AUTO)
            mode = raw_mode
            if mode == "AUTO":
                mode = "STOCK_IN" if product["current_stock_qty"] == 0 else "STOCK_IN"

            # Validate stock-out bounds
            if mode == "STOCK_OUT":
                if product["current_stock_qty"] <= 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Stock-Out Rejection: Cannot remove '{product['name']}' from inventory. "
                            f"Current stock is 0 units."
                        )
                    )

            # Compute quantity and weight delta
            prev_qty = product["current_stock_qty"]
            prev_weight = product["current_total_weight"]

            if mode == "STOCK_IN":
                qty_delta = 1
                new_qty = prev_qty + 1
                new_product_weight = round(prev_weight + payload.measured_weight_grams, 2)
            else:
                qty_delta = -1
                new_qty = prev_qty - 1
                new_product_weight = max(0.0, round(prev_weight - payload.measured_weight_grams, 2))

            # Compute total warehouse platform load (10kg limit check)
            cursor.execute(
                "SELECT SUM(current_total_weight) AS other_weight FROM products WHERE id != %s;",
                (product["id"],)
            )
            other_res = cursor.fetchone()
            other_weight = float(other_res["other_weight"]) if other_res and other_res["other_weight"] else 0.0
            new_platform_weight_grams = round(other_weight + new_product_weight, 2)
            new_platform_load_kg = round(new_platform_weight_grams / 1000.0, 3)

            if new_platform_load_kg > settings.MAX_CAPACITY_KG:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Overload Protection Error: This operation would increase platform load to "
                        f"{new_platform_load_kg:.2f}kg, exceeding the 10.00kg safety limit."
                    )
                )

            # Update product in MySQL
            update_prod_sql = """
                UPDATE products 
                SET current_stock_qty = %s, current_total_weight = %s
                WHERE id = %s;
            """
            cursor.execute(update_prod_sql, (new_qty, new_product_weight, product["id"]))

            # Update warehouse scale telemetry snapshot
            update_metric_sql = """
                UPDATE warehouse_metrics 
                SET current_load_kg = %s, status = 'NORMAL'
                WHERE id = 1;
            """
            cursor.execute(update_metric_sql, (new_platform_load_kg,))

            # Insert immutable audit record into inventory_transactions
            insert_trans_sql = """
                INSERT INTO inventory_transactions 
                (product_id, transaction_type, measured_weight_grams, quantity_delta,
                 previous_stock_qty, new_stock_qty, previous_total_weight, new_total_weight, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """
            note = f"Hardware scan event via ESP32/Simulator (UID: {clean_rfid})"
            cursor.execute(insert_trans_sql, (
                product["id"],
                mode,
                payload.measured_weight_grams,
                qty_delta,
                prev_qty,
                new_qty,
                prev_weight,
                new_product_weight,
                note
            ))

            # Commit the transaction atomically
            conn.commit()

    # 5. Sync in-memory Data Structures (Hash Table & Min-Heap)
    try:
        refresh_in_memory_data_structures()
    except Exception as e:
        print(f"[Academic Warning] Failed to refresh in-memory data structures: {e}")

    is_low = new_qty <= product["reorder_level"]
    action_verb = "Stock-In verified" if mode == "STOCK_IN" else "Stock-Out verified"
    message = (
        f"{action_verb}: {product['name']}. "
        f"Stock changed from {prev_qty} -> {new_qty} units "
        f"(Total weight: {new_product_weight:.1f}g, Scale load: {new_platform_load_kg:.2f}kg)."
    )

    return HardwareScanResponse(
        success=True,
        message=message,
        product_id=product["id"],
        product_name=product["name"],
        rfid_uid=clean_rfid,
        transaction_type=mode,
        measured_weight_grams=payload.measured_weight_grams,
        current_stock_qty=new_qty,
        current_total_weight_grams=new_product_weight,
        total_scale_load_kg=new_platform_load_kg,
        is_low_stock=is_low
    )
