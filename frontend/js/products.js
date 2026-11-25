/**
 * Smart Inventory & Warehouse Management System
 * Product Catalog & Management Controller (products.html)
 *
 * Implements:
 * 1. Product Listing with dynamic Category & Status filtering
 * 2. Add New Product with validation and optional initial stock / RFID UID
 * 3. Edit Product specifications and safe stock adjustments
 * 4. Safe Delete Product with referential constraint enforcement
 * 5. Quick RFID tag assignment
 */

document.addEventListener("DOMContentLoaded", () => {
  let allProducts = [];
  let allCategories = [];
  let activeProductId = null;

  // DOM Elements - Table & Filter Toolbar
  const productsTableBody = document.getElementById("productsTableBody");
  const productSearchInput = document.getElementById("productSearchInput");
  const productCategoryFilter = document.getElementById("productCategoryFilter");
  const productStatusFilter = document.getElementById("productStatusFilter");
  const productCountBadge = document.getElementById("productCountBadge");
  const refreshProductsBtn = document.getElementById("refreshProductsBtn");
  const toastContainer = document.getElementById("toastContainer");

  // DOM Elements - Add Product Modal
  const addProductModal = document.getElementById("addProductModal");
  const openAddProductBtn = document.getElementById("openAddProductBtn");
  const closeAddModalX = document.getElementById("closeAddModalX");
  const cancelAddBtn = document.getElementById("cancelAddBtn");
  const saveAddBtn = document.getElementById("saveAddBtn");
  const addNameInput = document.getElementById("addNameInput");
  const addCategorySelect = document.getElementById("addCategorySelect");
  const addWeightInput = document.getElementById("addWeightInput");
  const addToleranceInput = document.getElementById("addToleranceInput");
  const addInitialStockInput = document.getElementById("addInitialStockInput");
  const addReorderInput = document.getElementById("addReorderInput");
  const addRfidInput = document.getElementById("addRfidInput");
  const addModalError = document.getElementById("addModalError");

  // DOM Elements - Edit Product Modal
  const editProductModal = document.getElementById("editProductModal");
  const closeEditModalX = document.getElementById("closeEditModalX");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const editProductId = document.getElementById("editProductId");
  const editNameInput = document.getElementById("editNameInput");
  const editCategorySelect = document.getElementById("editCategorySelect");
  const editWeightInput = document.getElementById("editWeightInput");
  const editToleranceInput = document.getElementById("editToleranceInput");
  const editStockQtyInput = document.getElementById("editStockQtyInput");
  const editReorderInput = document.getElementById("editReorderInput");
  const editRfidInput = document.getElementById("editRfidInput");
  const editModalError = document.getElementById("editModalError");

  // DOM Elements - Delete Modal
  const deleteModal = document.getElementById("deleteModal");
  const closeDeleteModalX = document.getElementById("closeDeleteModalX");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const deleteProductName = document.getElementById("deleteProductName");
  const deleteModalError = document.getElementById("deleteModalError");

  /**
   * Initializes page data.
   */
  async function init() {
    await loadCategories();
    await loadProducts();
  }

  /**
   * Displays non-intrusive toast messages.
   */
  function showToast(message, type = "success") {
    toastContainer.style.display = "block";
    const isSuccess = type === "success";
    toastContainer.innerHTML = `
      <div style="padding: 0.85rem 1.15rem; border-radius: var(--radius-sm); font-size: 0.85rem; font-weight: 600;
                  background-color: ${isSuccess ? "var(--teal-light)" : "var(--danger-light)"};
                  border: 1px solid ${isSuccess ? "var(--teal-border)" : "var(--danger-border)"};
                  color: ${isSuccess ? "var(--teal)" : "#991b1b"}; display: flex; justify-content: space-between; align-items: center;">
        <span>${isSuccess ? "✓ " : "⚠️ "}${message}</span>
        <button style="background:none; border:none; cursor:pointer; font-size:1.1rem; color:inherit;" onclick="document.getElementById('toastContainer').style.display='none'">&times;</button>
      </div>
    `;
    setTimeout(() => {
      toastContainer.style.display = "none";
    }, 6000);
  }

  /**
   * Loads product categories into dropdown filters and modal selects.
   */
  async function loadCategories() {
    try {
      allCategories = await ApiService.getCategories();

      // Populate filter dropdown
      productCategoryFilter.innerHTML = `<option value="">All Categories</option>`;
      addCategorySelect.innerHTML = `<option value="">-- Select Category --</option>`;
      editCategorySelect.innerHTML = `<option value="">-- Select Category --</option>`;

      allCategories.forEach((cat) => {
        productCategoryFilter.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        addCategorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        editCategorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
      });
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  /**
   * Loads products from MySQL via FastAPI.
   */
  async function loadProducts() {
    try {
      allProducts = await ApiService.getProducts();
      productCountBadge.textContent = `${allProducts.length} Registered Products`;
      renderProductsTable();
    } catch (err) {
      console.error("Failed to load products:", err);
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; color: var(--danger); padding: 2rem;">
            ⚠️ Failed to load products: ${err.message}<br>
            <small style="color: var(--text-muted);">Ensure FastAPI and MySQL are running.</small>
          </td>
        </tr>`;
    }
  }

  /**
   * Renders the product catalog table with active search and filters.
   */
  function renderProductsTable() {
    const searchTerm = productSearchInput.value.trim().toLowerCase();
    const selectedCategory = productCategoryFilter.value;
    const selectedStatus = productStatusFilter.value;

    const filtered = allProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm) ||
        (p.rfid_uid && p.rfid_uid.toLowerCase().includes(searchTerm));
      const matchesCategory =
        !selectedCategory || p.category_id.toString() === selectedCategory;

      let matchesStatus = true;
      if (selectedStatus === "IN_STOCK") {
        matchesStatus = p.current_stock_qty >= p.reorder_level && p.current_stock_qty > 0;
      } else if (selectedStatus === "LOW_STOCK") {
        matchesStatus = p.current_stock_qty > 0 && p.current_stock_qty < p.reorder_level;
      } else if (selectedStatus === "OUT_OF_STOCK") {
        matchesStatus = p.current_stock_qty === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });

    productsTableBody.innerHTML = "";

    if (filtered.length === 0) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            No products match the selected filters.
          </td>
        </tr>`;
      return;
    }

    filtered.forEach((p) => {
      // Status Badge
      let statusBadge = "";
      if (p.current_stock_qty === 0) {
        statusBadge = `<span class="status-pill status-out-of-stock">● Out of Stock</span>`;
      } else if (p.current_stock_qty < p.reorder_level) {
        statusBadge = `<span class="status-pill status-low-stock">▲ Low Stock</span>`;
      } else {
        statusBadge = `<span class="status-pill status-in-stock">✓ In Stock</span>`;
      }

      // RFID Chip
      const rfidDisplay = p.rfid_uid
        ? `<span class="rfid-chip">${p.rfid_uid}</span>`
        : `<span class="rfid-chip empty">Unassigned</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong style="color: var(--text-muted);">#${p.id}</strong></td>
        <td>
          <div class="product-cell-name">${p.name}</div>
        </td>
        <td>
          <span class="category-tag">${p.category_name}</span>
        </td>
        <td>${p.unit_weight_grams.toFixed(1)} g</td>
        <td><strong>${p.current_stock_qty}</strong> units</td>
        <td>${p.current_total_weight.toFixed(1)} g</td>
        <td>${rfidDisplay}</td>
        <td>${p.reorder_level} units</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            <button class="btn btn-secondary btn-sm edit-prod-btn" data-id="${p.id}" title="Edit product specifications">
              ✏️ Edit
            </button>
            <button class="btn btn-secondary btn-sm delete-prod-btn" data-id="${p.id}" data-name="${p.name}" data-qty="${p.current_stock_qty}" title="Delete product">
              🗑️
            </button>
          </div>
        </td>
      `;
      productsTableBody.appendChild(tr);
    });

    // Attach listeners
    document.querySelectorAll(".edit-prod-btn").forEach((btn) => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });

    document.querySelectorAll(".delete-prod-btn").forEach((btn) => {
      btn.addEventListener("click", () => openDeleteModal(btn.dataset.id, btn.dataset.name, btn.dataset.qty));
    });
  }

  // =========================================================================
  // ADD PRODUCT MODAL LOGIC
  // =========================================================================
  function openAddModal() {
    addModalError.style.display = "none";
    addNameInput.value = "";
    addCategorySelect.value = allCategories.length > 0 ? allCategories[0].id : "";
    addWeightInput.value = "500.0";
    addToleranceInput.value = "35.0";
    addInitialStockInput.value = "0";
    addReorderInput.value = "2";
    addRfidInput.value = "";
    addProductModal.classList.add("active");
    addNameInput.focus();
  }

  function closeAddModal() {
    addProductModal.classList.remove("active");
  }

  openAddProductBtn.addEventListener("click", openAddModal);
  closeAddModalX.addEventListener("click", closeAddModal);
  cancelAddBtn.addEventListener("click", closeAddModal);

  saveAddBtn.addEventListener("click", async () => {
    addModalError.style.display = "none";
    const name = addNameInput.value.trim();
    const category_id = parseInt(addCategorySelect.value, 10);
    const unit_weight_grams = parseFloat(addWeightInput.value);
    const weight_tolerance_grams = parseFloat(addToleranceInput.value);
    const initial_stock_qty = parseInt(addInitialStockInput.value, 10);
    const reorder_level = parseInt(addReorderInput.value, 10);
    const rfid_uid = addRfidInput.value.trim();

    // Frontend validations
    if (!name) {
      showModalError(addModalError, "Please enter a valid product name.");
      return;
    }
    if (!category_id) {
      showModalError(addModalError, "Please select a grocery category.");
      return;
    }
    if (isNaN(unit_weight_grams) || unit_weight_grams <= 0) {
      showModalError(addModalError, "Unit weight must be greater than 0 grams.");
      return;
    }
    if (isNaN(initial_stock_qty) || initial_stock_qty < 0) {
      showModalError(addModalError, "Initial stock quantity cannot be negative.");
      return;
    }
    if (isNaN(reorder_level) || reorder_level < 0) {
      showModalError(addModalError, "Reorder level cannot be negative.");
      return;
    }

    saveAddBtn.disabled = true;
    saveAddBtn.innerHTML = "⏳ Saving...";

    try {
      const payload = {
        name,
        category_id,
        unit_weight_grams,
        weight_tolerance_grams: isNaN(weight_tolerance_grams) ? 35.0 : weight_tolerance_grams,
        initial_stock_qty,
        reorder_level,
        rfid_uid: rfid_uid ? rfid_uid.toUpperCase() : null,
      };

      const newProd = await ApiService.createProduct(payload);
      closeAddModal();
      showToast(`Product '${newProd.name}' created successfully (ID: #${newProd.id}).`);
      await loadProducts();
    } catch (err) {
      showModalError(addModalError, err.message);
    } finally {
      saveAddBtn.disabled = false;
      saveAddBtn.innerHTML = "Create Product";
    }
  });

  // =========================================================================
  // EDIT PRODUCT MODAL LOGIC
  // =========================================================================
  function openEditModal(productId) {
    const prod = allProducts.find((p) => p.id == productId);
    if (!prod) return;

    editModalError.style.display = "none";
    editProductId.value = prod.id;
    editNameInput.value = prod.name;
    editCategorySelect.value = prod.category_id;
    editWeightInput.value = prod.unit_weight_grams;
    editToleranceInput.value = prod.weight_tolerance_grams;
    editStockQtyInput.value = prod.current_stock_qty;
    editReorderInput.value = prod.reorder_level;
    editRfidInput.value = prod.rfid_uid || "";

    editProductModal.classList.add("active");
    editNameInput.focus();
  }

  function closeEditModal() {
    editProductModal.classList.remove("active");
  }

  closeEditModalX.addEventListener("click", closeEditModal);
  cancelEditBtn.addEventListener("click", closeEditModal);

  saveEditBtn.addEventListener("click", async () => {
    editModalError.style.display = "none";
    const prodId = parseInt(editProductId.value, 10);
    const name = editNameInput.value.trim();
    const category_id = parseInt(editCategorySelect.value, 10);
    const unit_weight_grams = parseFloat(editWeightInput.value);
    const weight_tolerance_grams = parseFloat(editToleranceInput.value);
    const current_stock_qty = parseInt(editStockQtyInput.value, 10);
    const reorder_level = parseInt(editReorderInput.value, 10);
    const rfid_uid = editRfidInput.value.trim();

    if (!name) {
      showModalError(editModalError, "Product name cannot be empty.");
      return;
    }
    if (isNaN(unit_weight_grams) || unit_weight_grams <= 0) {
      showModalError(editModalError, "Unit weight must be greater than 0 grams.");
      return;
    }
    if (isNaN(current_stock_qty) || current_stock_qty < 0) {
      showModalError(editModalError, "Stock quantity cannot be negative.");
      return;
    }
    if (isNaN(reorder_level) || reorder_level < 0) {
      showModalError(editModalError, "Reorder level cannot be negative.");
      return;
    }

    saveEditBtn.disabled = true;
    saveEditBtn.innerHTML = "⏳ Updating...";

    try {
      const payload = {
        name,
        category_id,
        unit_weight_grams,
        weight_tolerance_grams: isNaN(weight_tolerance_grams) ? 35.0 : weight_tolerance_grams,
        current_stock_qty,
        reorder_level,
        rfid_uid: rfid_uid ? rfid_uid.toUpperCase() : "",
      };

      const updated = await ApiService.updateProduct(prodId, payload);
      closeEditModal();
      showToast(`Product #${updated.id} ('${updated.name}') updated successfully.`);
      await loadProducts();
    } catch (err) {
      showModalError(editModalError, err.message);
    } finally {
      saveEditBtn.disabled = false;
      saveEditBtn.innerHTML = "Save Changes";
    }
  });

  // =========================================================================
  // DELETE PRODUCT MODAL LOGIC
  // =========================================================================
  function openDeleteModal(productId, productName, currentQty) {
    activeProductId = productId;
    deleteProductName.textContent = productName;
    deleteModalError.style.display = "none";

    // Quick visual hint if stock > 0
    if (parseInt(currentQty, 10) > 0) {
      deleteModalError.style.display = "block";
      deleteModalError.innerHTML = `⚠️ This item has <strong>${currentQty} units</strong> in stock. Please adjust stock to 0 first before attempting deletion.`;
      confirmDeleteBtn.disabled = true;
    } else {
      confirmDeleteBtn.disabled = false;
    }

    deleteModal.classList.add("active");
  }

  function closeDeleteModal() {
    deleteModal.classList.remove("active");
    activeProductId = null;
  }

  closeDeleteModalX.addEventListener("click", closeDeleteModal);
  cancelDeleteBtn.addEventListener("click", closeDeleteModal);

  confirmDeleteBtn.addEventListener("click", async () => {
    if (!activeProductId) return;

    deleteModalError.style.display = "none";
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = "⏳ Deleting...";

    try {
      const res = await ApiService.deleteProduct(activeProductId);
      closeDeleteModal();
      showToast(res.message);
      await loadProducts();
    } catch (err) {
      deleteModalError.style.display = "block";
      deleteModalError.innerHTML = `❌ ${err.message}`;
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = "Confirm Delete";
    }
  });

  function showModalError(element, message) {
    element.style.display = "block";
    element.textContent = `⚠️ ${message}`;
  }

  // Filter Event Listeners
  productSearchInput.addEventListener("input", renderProductsTable);
  productCategoryFilter.addEventListener("change", renderProductsTable);
  productStatusFilter.addEventListener("change", renderProductsTable);
  refreshProductsBtn.addEventListener("click", async () => {
    const orig = refreshProductsBtn.innerHTML;
    refreshProductsBtn.innerHTML = "⏳ Refreshing...";
    refreshProductsBtn.disabled = true;
    try {
      await loadCategories();
      await loadProducts();
    } finally {
      refreshProductsBtn.innerHTML = orig;
      refreshProductsBtn.disabled = false;
    }
  });

  // Run initialization
  init();
});
