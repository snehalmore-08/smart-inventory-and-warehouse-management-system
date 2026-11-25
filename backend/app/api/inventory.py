"""
Inventory & Product Management API Routes.
Provides complete CRUD operations, product listing, RFID tag assignment,
and safe stock adjustments with ACID transaction logging.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
import pymysql

from app.config import settings
from app.db.connection import get_db
from app.schemas.product_schema import (
    ProductResponse,
    ProductCreate,
    ProductUpdate,
    RFIDAssignRequest,
    CategoryResponse
)
from app.api.academic import refresh_in_memory_data_structures

router = APIRouter(prefix="/api/inventory", tags=["Inventory & Product Management"])

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories():
    """Returns all grocery product categories."""
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, description FROM categories ORDER BY id ASC;")
            return cursor.fetchall()

@router.get("/products", response_model=List[ProductResponse])
def list_products():
    """
    Returns all inventory products with joined category names,
    formatted float weights, and dynamic low-stock calculation.
    """
    query = """
        SELECT 
            p.id,
            p.rfid_uid,
            p.name,
            p.category_id,
            c.name AS category_name,
            CAST(p.unit_weight_grams AS DOUBLE) AS unit_weight_grams,
            CAST(p.weight_tolerance_grams AS DOUBLE) AS weight_tolerance_grams,
            p.current_stock_qty,
            CAST(p.current_total_weight AS DOUBLE) AS current_total_weight,
            p.reorder_level
        FROM products p
        JOIN categories c ON p.category_id = c.id
        ORDER BY p.id ASC;
    """
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query)
            rows = cursor.fetchall()
            
            for row in rows:
                row["is_low_stock"] = row["current_stock_qty"] <= row["reorder_level"]
                
            return rows

@router.get("/transactions", tags=["Inventory Management"])
def list_transactions(limit: int = 50):
    """
    Returns recent audit transaction records joined with product information.
    """
    with get_db() as conn:
        with conn.cursor() as cursor:
            query = """
                SELECT 
                    t.id,
                    t.product_id,
                    p.name AS product_name,
                    t.transaction_type,
                    CAST(t.measured_weight_grams AS DOUBLE) AS measured_weight_grams,
                    t.quantity_delta,
                    t.previous_stock_qty,
                    t.new_stock_qty,
                    CAST(t.previous_total_weight AS DOUBLE) AS previous_total_weight,
                    CAST(t.new_total_weight AS DOUBLE) AS new_total_weight,
                    DATE_FORMAT(t.timestamp, '%%Y-%%m-%%d %%H:%%i:%%s') AS timestamp,
                    t.notes
                FROM inventory_transactions t
                JOIN products p ON t.product_id = p.id
                ORDER BY t.id DESC
                LIMIT %s;
            """
            cursor.execute(query, (limit,))
            return cursor.fetchall()

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: int):
    """Retrieves a single product by its database ID."""
    query = """
        SELECT 
            p.id,
            p.rfid_uid,
            p.name,
            p.category_id,
            c.name AS category_name,
            CAST(p.unit_weight_grams AS DOUBLE) AS unit_weight_grams,
            CAST(p.weight_tolerance_grams AS DOUBLE) AS weight_tolerance_grams,
            p.current_stock_qty,
            CAST(p.current_total_weight AS DOUBLE) AS current_total_weight,
            p.reorder_level
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = %s;
    """
    with get_db() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (product_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {product_id} not found."
                )
            row["is_low_stock"] = row["current_stock_qty"] <= row["reorder_level"]
            return row

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate):
    """
    Creates a new grocery product in MySQL:
    - Validates category existence
    - Validates RFID uniqueness if provided
    - Handles optional initial stock with 10kg load cell capacity verification
    - Logs transaction if initial stock is entered
    """
    clean_name = product.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product name cannot be empty."
        )

    if product.unit_weight_grams <= 0.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unit weight must be greater than 0 grams."
        )

    if product.initial_stock_qty < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Initial stock quantity cannot be negative."
        )

    clean_rfid = product.rfid_uid.strip().upper() if product.rfid_uid and product.rfid_uid.strip() else None

    with get_db() as conn:
        with conn.cursor() as cursor:
            # 1. Validate Category
            cursor.execute("SELECT id FROM categories WHERE id = %s;", (product.category_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category ID {product.category_id} does not exist."
                )
                
            # 2. Check RFID uniqueness if provided
            if clean_rfid:
                cursor.execute("SELECT id, name FROM products WHERE rfid_uid = %s;", (clean_rfid,))
                existing_tag = cursor.fetchone()
                if existing_tag:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"RFID UID '{clean_rfid}' is already assigned to '{existing_tag['name']}' (ID: {existing_tag['id']})."
                    )

            # 3. Check Scale Load if initial stock is provided
            initial_weight_grams = round(product.initial_stock_qty * product.unit_weight_grams, 2)
            if initial_weight_grams > 0:
                cursor.execute("SELECT SUM(current_total_weight) AS total_weight FROM products;")
                tot_res = cursor.fetchone()
                current_total_warehouse = float(tot_res["total_weight"] or 0.0)
                new_scale_load_kg = (current_total_warehouse + initial_weight_grams) / 1000.0

                if new_scale_load_kg > settings.MAX_CAPACITY_KG:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Overload Protection Error: Adding initial stock of {product.initial_stock_qty} units "
                            f"({initial_weight_grams:.1f}g) would increase platform load to {new_scale_load_kg:.2f}kg, "
                            f"exceeding the 10.00kg load cell limit."
                        )
                    )

            # 4. Insert new product
            insert_sql = """
                INSERT INTO products 
                (rfid_uid, name, category_id, unit_weight_grams, weight_tolerance_grams, current_stock_qty, current_total_weight, reorder_level)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """
            cursor.execute(insert_sql, (
                clean_rfid,
                clean_name,
                product.category_id,
                product.unit_weight_grams,
                product.weight_tolerance_grams,
                product.initial_stock_qty,
                initial_weight_grams,
                product.reorder_level
            ))
            new_id = cursor.lastrowid

            # 5. If initial stock > 0, log audit transaction & update scale metrics
            if product.initial_stock_qty > 0:
                cursor.execute(
                    "UPDATE warehouse_metrics SET current_load_kg = (SELECT SUM(current_total_weight)/1000.0 FROM products) WHERE id = 1;"
                )
                cursor.execute("""
                    INSERT INTO inventory_transactions 
                    (product_id, transaction_type, measured_weight_grams, quantity_delta, previous_stock_qty, new_stock_qty, previous_total_weight, new_total_weight, notes)
                    VALUES (%s, 'STOCK_IN', %s, %s, 0, %s, 0.0, %s, 'Initial inventory stock on product creation');
                """, (new_id, initial_weight_grams, product.initial_stock_qty, product.initial_stock_qty, initial_weight_grams))

            conn.commit()

    # Sync in-memory Data Structures
    try:
        refresh_in_memory_data_structures()
    except Exception as e:
        print(f"[Academic Warning] In-memory DS sync: {e}")

    return get_product(new_id)

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate):
    """
    Updates an existing grocery product:
    - Allows editing name, category, unit weight, reorder level
    - Allows updating or clearing RFID UID with collision checking
    - Allows safe stock adjustments with 10kg scale protection and ACID audit logging
    """
    with get_db() as conn:
        with conn.cursor() as cursor:
            # 1. Fetch current product state with row lock
            cursor.execute("""
                SELECT 
                    id, 
                    rfid_uid, 
                    name, 
                    category_id, 
                    CAST(unit_weight_grams AS DOUBLE) AS unit_weight_grams,
                    CAST(weight_tolerance_grams AS DOUBLE) AS weight_tolerance_grams,
                    current_stock_qty, 
                    CAST(current_total_weight AS DOUBLE) AS current_total_weight,
                    reorder_level
                FROM products 
                WHERE id = %s 
                FOR UPDATE;
            """, (product_id,))
            existing = cursor.fetchone()

            if not existing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {product_id} not found."
                )

            # 2. Category validation if updated
            new_category_id = existing["category_id"]
            if product.category_id is not None:
                cursor.execute("SELECT id FROM categories WHERE id = %s;", (product.category_id,))
                if not cursor.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Category ID {product.category_id} does not exist."
                    )
                new_category_id = product.category_id

            # 3. RFID uniqueness validation if updated
            new_rfid = existing["rfid_uid"]
            if product.rfid_uid is not None:
                cleaned_tag = product.rfid_uid.strip().upper()
                if cleaned_tag == "":
                    new_rfid = None
                else:
                    cursor.execute(
                        "SELECT id, name FROM products WHERE rfid_uid = %s AND id != %s;",
                        (cleaned_tag, product_id)
                    )
                    duplicate = cursor.fetchone()
                    if duplicate:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"RFID UID '{cleaned_tag}' is already assigned to '{duplicate['name']}' (ID: {duplicate['id']})."
                        )
                    new_rfid = cleaned_tag

            # 4. Resolve field updates
            new_name = product.name.strip() if product.name is not None and product.name.strip() else existing["name"]
            new_unit_weight = product.unit_weight_grams if product.unit_weight_grams is not None else existing["unit_weight_grams"]
            new_tolerance = product.weight_tolerance_grams if product.weight_tolerance_grams is not None else existing["weight_tolerance_grams"]
            new_reorder_level = product.reorder_level if product.reorder_level is not None else existing["reorder_level"]

            if new_unit_weight <= 0.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unit weight must be greater than 0 grams."
                )

            # 5. Handle stock quantity adjustment if specified
            prev_qty = existing["current_stock_qty"]
            prev_weight = existing["current_total_weight"]
            new_qty = prev_qty
            new_weight = prev_weight

            stock_adjusted = False
            qty_delta = 0

            if product.current_stock_qty is not None and product.current_stock_qty != prev_qty:
                if product.current_stock_qty < 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Stock quantity cannot be negative."
                    )
                new_qty = product.current_stock_qty
                qty_delta = new_qty - prev_qty
                new_weight = round(new_qty * new_unit_weight, 2)
                stock_adjusted = True
            elif product.unit_weight_grams is not None and product.unit_weight_grams != existing["unit_weight_grams"] and prev_qty > 0:
                # Recalculate physical weight if unit weight changed
                new_weight = round(prev_qty * new_unit_weight, 2)

            # 6. Verify 10kg load cell safety limit
            cursor.execute("SELECT SUM(current_total_weight) AS other_weight FROM products WHERE id != %s;", (product_id,))
            other_res = cursor.fetchone()
            other_weight = float(other_res["other_weight"] or 0.0)
            new_total_scale_kg = round((other_weight + new_weight) / 1000.0, 3)

            if new_total_scale_kg > settings.MAX_CAPACITY_KG:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Overload Protection Error: This update would increase scale platform load to "
                        f"{new_total_scale_kg:.2f}kg, exceeding the 10.00kg maximum capacity limit."
                    )
                )

            # 7. Update product record
            update_sql = """
                UPDATE products 
                SET name = %s,
                    category_id = %s,
                    unit_weight_grams = %s,
                    weight_tolerance_grams = %s,
                    current_stock_qty = %s,
                    current_total_weight = %s,
                    reorder_level = %s,
                    rfid_uid = %s
                WHERE id = %s;
            """
            cursor.execute(update_sql, (
                new_name,
                new_category_id,
                new_unit_weight,
                new_tolerance,
                new_qty,
                new_weight,
                new_reorder_level,
                new_rfid,
                product_id
            ))

            # 8. Update warehouse scale telemetry
            cursor.execute("UPDATE warehouse_metrics SET current_load_kg = %s WHERE id = 1;", (new_total_scale_kg,))

            # 9. If stock quantity was adjusted, record immutable transaction
            if stock_adjusted:
                trans_mode = "STOCK_IN" if qty_delta > 0 else "STOCK_OUT"
                weight_delta = abs(round(new_weight - prev_weight, 2))
                cursor.execute("""
                    INSERT INTO inventory_transactions 
                    (product_id, transaction_type, measured_weight_grams, quantity_delta,
                     previous_stock_qty, new_stock_qty, previous_total_weight, new_total_weight, notes)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Manual inventory adjustment via Product Management');
                """, (
                    product_id,
                    trans_mode,
                    weight_delta,
                    qty_delta,
                    prev_qty,
                    new_qty,
                    prev_weight,
                    new_weight
                ))

            conn.commit()

    # Sync in-memory Data Structures
    try:
        refresh_in_memory_data_structures()
    except Exception as e:
        print(f"[Academic Warning] In-memory DS sync: {e}")

    return get_product(product_id)

@router.delete("/products/{product_id}")
def delete_product(product_id: int):
    """
    Safely deletes a product:
    - Rejects deletion if physical stock > 0 remains on the scale platform
    - Rejects deletion if transaction log records depend on it (enforces foreign key integrity)
    - Automatically updates in-memory Hash Table and Min-Heap
    """
    with get_db() as conn:
        with conn.cursor() as cursor:
            # 1. Check product existence
            cursor.execute("SELECT id, name, current_stock_qty, current_total_weight FROM products WHERE id = %s;", (product_id,))
            product = cursor.fetchone()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {product_id} not found."
                )

            # 2. Check if physical stock exists
            if product["current_stock_qty"] > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Cannot delete '{product['name']}': Physical stock of {product['current_stock_qty']} unit(s) "
                        f"({product['current_total_weight']}g) remains in the warehouse. "
                        f"Please stock-out or adjust stock to 0 units before deleting."
                    )
                )

            # 3. Check for transaction history dependencies
            cursor.execute("SELECT COUNT(*) AS trans_count FROM inventory_transactions WHERE product_id = %s;", (product_id,))
            t_res = cursor.fetchone()
            trans_count = t_res["trans_count"] if t_res else 0

            if trans_count > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Referential Safety Restriction: Cannot delete '{product['name']}' because "
                        f"{trans_count} audit transaction log record(s) reference it. "
                        f"To preserve database audit integrity, products with transaction history cannot be deleted."
                    )
                )

            # 4. Delete safely
            cursor.execute("DELETE FROM products WHERE id = %s;", (product_id,))
            conn.commit()

    # Sync in-memory Data Structures
    try:
        refresh_in_memory_data_structures()
    except Exception as e:
        print(f"[Academic Warning] In-memory DS sync: {e}")

    return {
        "success": True,
        "message": f"Product '{product['name']}' (ID: {product_id}) was successfully deleted."
    }

@router.post("/products/{product_id}/assign-rfid", response_model=ProductResponse)
def assign_rfid_tag(product_id: int, payload: RFIDAssignRequest):
    """
    Pairs or updates a physical RFID card or keyfob UID with a grocery product.
    Validates that the tag UID is not already claimed by another product.
    """
    clean_uid = payload.rfid_uid.strip().upper()
    with get_db() as conn:
        with conn.cursor() as cursor:
            # 1. Check if product exists
            cursor.execute("SELECT id, name FROM products WHERE id = %s;", (product_id,))
            product = cursor.fetchone()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with ID {product_id} not found."
                )
                
            # 2. Check if this RFID UID is already paired with another product
            cursor.execute(
                "SELECT id, name FROM products WHERE rfid_uid = %s AND id != %s;",
                (clean_uid, product_id)
            )
            existing = cursor.fetchone()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"RFID UID '{clean_uid}' is already assigned to '{existing['name']}' (ID: {existing['id']})."
                )
                
            # 3. Update the RFID UID
            cursor.execute(
                "UPDATE products SET rfid_uid = %s WHERE id = %s;",
                (clean_uid, product_id)
            )
            conn.commit()

    # Sync in-memory Data Structures
    try:
        refresh_in_memory_data_structures()
    except Exception as e:
        print(f"[Academic Warning] In-memory DS sync: {e}")
            
    return get_product(product_id)
