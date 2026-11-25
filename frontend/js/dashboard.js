/**
 * Smart Inventory & Warehouse Management System
 * Unified Single Page Application (SPA) Controller
 *
 * Coordinates all 7 operational & academic modules:
 * 1. Dashboard
 * 2. Product Management
 * 3. Stock In
 * 4. Stock Out
 * 5. RFID & Hardware
 * 6. Analytics & Reports
 * 7. Academic & Viva Inspector
 */

document.addEventListener("DOMContentLoaded", () => {
  // Global Application State
  let allProducts = [];
  let allCategories = [];
  let allTransactions = [];
  let activeAssignProductId = null;
  let activeEditProductId = null;
  let activeDeleteProductId = null;
  let currentScaleLoadKg = 0.0;
  const MAX_SCALE_CAPACITY_KG = 10.0;

  // Chart.js Instances
  let stockChartInstance = null;
  let weightChartInstance = null;

  // DOM Elements - Shell & App Bar
  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");
  const serverStatusBadge = document.getElementById("serverStatusBadge");
  const refreshBtn = document.getElementById("refreshBtn");
  const toastContainer = document.getElementById("toastContainer");
  const navLinks = document.querySelectorAll(".app-sidebar .nav-item[data-module]");
  const moduleViews = document.querySelectorAll(".module-view");

  // DOM Elements - Dashboard Metrics & Overview
  const metricTotalItems = document.getElementById("metricTotalItems");
  const metricTotalSKUs = document.getElementById("metricTotalSKUs");
  const metricScaleLoad = document.getElementById("metricScaleLoad");
  const metricScalePercent = document.getElementById("metricScalePercent");
  const metricOutOfStock = document.getElementById("metricOutOfStock");
  const metricLowStock = document.getElementById("metricLowStock");
  const metricHwStatus = document.getElementById("metricHwStatus");
  const scaleProgressBar = document.getElementById("scaleProgressBar");
  const scaleMonitorNumber = document.getElementById("scaleMonitorNumber");
  const inventoryTableBody = document.getElementById("inventoryTableBody");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const alertContainer = document.getElementById("alertContainer");

  // DOM Elements - Product Management
  const productTableBody = document.getElementById("productTableBody");
  const productSearchInput = document.getElementById("productSearchInput");
  const productCategoryFilter = document.getElementById("productCategoryFilter");
  const productStatusFilter = document.getElementById("productStatusFilter");
  const productCountBadge = document.getElementById("productCountBadge");
  const openAddProductBtn = document.getElementById("openAddProductBtn");
  const refreshProductsBtn = document.getElementById("refreshProductsBtn");

  // DOM Elements - Stock In
  const stockInProductSelect = document.getElementById("stockInProductSelect");
  const stockInQtyInput = document.getElementById("stockInQtyInput");
  const stockInWeightInput = document.getElementById("stockInWeightInput");
  const stockInRfidInput = document.getElementById("stockInRfidInput");
  const stockInLoadText = document.getElementById("stockInLoadText");
  const stockInLoadBar = document.getElementById("stockInLoadBar");
  const stockInOverloadWarning = document.getElementById("stockInOverloadWarning");
  const confirmStockInBtn = document.getElementById("confirmStockInBtn");
  const stockInResultBox = document.getElementById("stockInResultBox");
  const stockInTransactionsBody = document.getElementById("stockInTransactionsBody");

  // DOM Elements - Stock Out
  const stockOutProductSelect = document.getElementById("stockOutProductSelect");
  const stockOutAvailableInput = document.getElementById("stockOutAvailableInput");
  const stockOutQtyInput = document.getElementById("stockOutQtyInput");
  const stockOutWeightInput = document.getElementById("stockOutWeightInput");
  const stockOutBalanceText = document.getElementById("stockOutBalanceText");
  const stockOutZeroWarning = document.getElementById("stockOutZeroWarning");
  const confirmStockOutBtn = document.getElementById("confirmStockOutBtn");
  const stockOutResultBox = document.getElementById("stockOutResultBox");
  const stockOutTransactionsBody = document.getElementById("stockOutTransactionsBody");

  // DOM Elements - Hardware Simulator & RFID Directory
  const simProductSelect = document.getElementById("simProductSelect");
  const simModeSelect = document.getElementById("simModeSelect");
  const simWeightInput = document.getElementById("simWeightInput");
  const simScanBtn = document.getElementById("simScanBtn");
  const simResultBox = document.getElementById("simResultBox");
  const jsonPayloadPreview = document.getElementById("jsonPayloadPreview");
  const rfidDirectoryTableBody = document.getElementById("rfidDirectoryTableBody");

  // DOM Elements - Analytics & Transactions
  const refreshTransactionsBtn = document.getElementById("refreshTransactionsBtn");
  const transactionsTableBody = document.getElementById("transactionsTableBody");

  // DOM Elements - Academic & Viva Inspector
  const htCapacity = document.getElementById("htCapacity");
  const htCount = document.getElementById("htCount");
  const htLoadFactor = document.getElementById("htLoadFactor");
  const htChainsContainer = document.getElementById("htChainsContainer");
  const refreshHtBtn = document.getElementById("refreshHtBtn");
  const heapSize = document.getElementById("heapSize");
  const heapRootItem = document.getElementById("heapRootItem");
  const heapArrayView = document.getElementById("heapArrayView");
  const refreshHeapBtn = document.getElementById("refreshHeapBtn");
  const searchKeySelect = document.getElementById("searchKeySelect");
  const searchTargetInput = document.getElementById("searchTargetInput");
  const runSearchBtn = document.getElementById("runSearchBtn");
  const searchResultsDiv = document.getElementById("searchResultsDiv");
  const hexInput = document.getElementById("hexInput");
  const decodeTwosBtn = document.getElementById("decodeTwosBtn");
  const twosResultDiv = document.getElementById("twosResultDiv");
  const endianInput = document.getElementById("endianInput");
  const analyzeEndianBtn = document.getElementById("analyzeEndianBtn");
  const endianResultDiv = document.getElementById("endianResultDiv");

  // Shared Modals
  const rfidModal = document.getElementById("rfidModal");
  const modalProductName = document.getElementById("modalProductName");
  const modalRfidInput = document.getElementById("modalRfidInput");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalSaveBtn = document.getElementById("modalSaveBtn");
  const modalCloseX = document.getElementById("modalCloseX");

  const addProductModal = document.getElementById("addProductModal");
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

  const deleteModal = document.getElementById("deleteModal");
  const closeDeleteModalX = document.getElementById("closeDeleteModalX");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const deleteProductName = document.getElementById("deleteProductName");
  const deleteModalError = document.getElementById("deleteModalError");

  // =========================================================================
  // Module Navigation & Single Page Routing
  // =========================================================================

  const MODULE_METADATA = {
    dashboard: {
      title: "Smart Inventory & Warehouse Management",
      subtitle: "Autonomous physical stock tracking · Load Cell authentication · Real-time ACID transactions",
    },
    products: {
      title: "Product Catalog & SKU Specifications",
      subtitle: "Master grocery products · Unit weight tolerances · Hardware RFID tag bindings",
    },
    "stock-in": {
      title: "Physical Stock Inward Operations",
      subtitle: "Place grocery units on scale platform · Automated weight validation · 10kg load limit guard",
    },
    "stock-out": {
      title: "Physical Stock Outward Operations",
      subtitle: "Safe dispatch deduction · Non-negative stock verification · Platform load decrease",
    },
    "rfid-hardware": {
      title: "RFID Hardware & Telemetry Simulator",
      subtitle: "ESP32 Wi-Fi Node (Port 8000) · RC522 SPI 13.56MHz · HX711 24-Bit ADC",
    },
    analytics: {
      title: "Warehouse Analytics & Audit Logs",
      subtitle: "Visual stock distribution · Scale weight distribution · Immutable relational transaction trail",
    },
    academic: {
      title: "Subject Integration & Viva Inspector",
      subtitle: "Live interactive inspection for Data Structures (Hash Table, Heap) & MPCA (2's Comp, Endianness)",
    },
  };

  function activateModule(moduleName, updateHash = true) {
    const targetModule = MODULE_METADATA[moduleName] ? moduleName : "dashboard";

    if (updateHash && window.location.hash !== `#${targetModule}`) {
      window.location.hash = targetModule;
    }

    // Update Sidebar Navigation state
    navLinks.forEach((link) => {
      const linkModule = link.getAttribute("data-module");
      if (linkModule === targetModule) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Update Content Views
    moduleViews.forEach((view) => {
      if (view.id === `view-${targetModule}`) {
        view.classList.add("active");
      } else {
        view.classList.remove("active");
      }
    });

    // Update App Bar Title & Subtitle
    const meta = MODULE_METADATA[targetModule];
    if (pageTitle) pageTitle.textContent = meta.title;
    if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;

    // Trigger on-demand module updates
    if (targetModule === "analytics") {
      updateCharts();
      loadTransactions();
    } else if (targetModule === "academic") {
      loadAcademicData();
    } else if (targetModule === "products") {
      renderProductsTable();
    } else if (targetModule === "stock-in") {
      updateStockInPreview();
    } else if (targetModule === "stock-out") {
      updateStockOutPreview();
    } else if (targetModule === "rfid-hardware") {
      updateSimulatorPayloadPreview();
      renderRfidDirectory();
    }
  }

  function handleHashChange() {
    let rawHash = window.location.hash.replace("#", "").trim().toLowerCase();
    if (!rawHash) {
      if (window.location.pathname.includes("products")) {
        rawHash = "products";
      } else if (window.location.pathname.includes("academic")) {
        rawHash = "academic";
      } else if (window.location.pathname.includes("stock-in")) {
        rawHash = "stock-in";
      } else if (window.location.pathname.includes("stock-out")) {
        rawHash = "stock-out";
      } else if (window.location.pathname.includes("hardware") || window.location.pathname.includes("rfid")) {
        rawHash = "rfid-hardware";
      } else if (window.location.pathname.includes("analytics")) {
        rawHash = "analytics";
      }
    }
    activateModule(rawHash || "dashboard", false);
  }

  window.addEventListener("hashchange", handleHashChange);

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const mod = link.getAttribute("data-module");
      if (mod) {
        e.preventDefault();
        activateModule(mod, true);
      }
    });
  });

  // =========================================================================
  // Toast Notifications Helper
  // =========================================================================

  function showToast(message, type = "success") {
    if (!toastContainer) return;
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
      if (toastContainer) toastContainer.style.display = "none";
    }, 6000);
  }

  // =========================================================================
  // Data Loading: Health, Categories, Products & Transactions
  // =========================================================================

  async function loadHealth() {
    try {
      const health = await ApiService.getHealth();
      if (health.status === "healthy") {
        if (serverStatusBadge) {
          serverStatusBadge.className = "status-badge";
          serverStatusBadge.innerHTML = `<span class="status-dot"></span> Backend & MySQL Online`;
        }
        if (metricHwStatus) {
          metricHwStatus.textContent = "ONLINE";
          metricHwStatus.style.color = "var(--teal)";
        }
        if (health.warehouse_scale) {
          const loadKg = parseFloat(health.warehouse_scale.current_load_kg || 0);
          const maxKg = parseFloat(health.warehouse_scale.max_capacity_kg || 10.0);
          updateScaleGauge(loadKg, maxKg);
        }
      } else {
        if (serverStatusBadge) {
          serverStatusBadge.className = "status-badge offline";
          serverStatusBadge.innerHTML = `<span class="status-dot"></span> Backend Offline`;
        }
        if (metricHwStatus) {
          metricHwStatus.textContent = "OFFLINE";
          metricHwStatus.style.color = "var(--danger)";
        }
      }
    } catch (err) {
      if (serverStatusBadge) {
        serverStatusBadge.className = "status-badge offline";
        serverStatusBadge.innerHTML = `<span class="status-dot"></span> Connection Error`;
      }
      if (metricHwStatus) {
        metricHwStatus.textContent = "DISCONNECTED";
        metricHwStatus.style.color = "var(--danger)";
      }
    }
  }

  function updateScaleGauge(loadKg, maxKg = 10.0) {
    currentScaleLoadKg = loadKg;
    const percent = Math.min(100.0, (loadKg / maxKg) * 100).toFixed(1);

    if (metricScaleLoad) metricScaleLoad.textContent = loadKg.toFixed(2);
    if (metricScalePercent) metricScalePercent.textContent = `${percent}% of max load`;
    if (scaleMonitorNumber) scaleMonitorNumber.textContent = loadKg.toFixed(2);

    if (scaleProgressBar) {
      scaleProgressBar.style.width = `${percent}%`;
      if (percent > 90.0) {
        scaleProgressBar.style.background = "linear-gradient(90deg, #f59e0b, #ef4444)";
      } else {
        scaleProgressBar.style.background = "linear-gradient(90deg, var(--teal), var(--primary))";
      }
    }
  }

  async function loadCategories() {
    try {
      allCategories = await ApiService.getCategories();
      
      // Populate dashboard category filter
      if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        allCategories.forEach((cat) => {
          categoryFilter.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
      }

      // Populate product management category filter
      if (productCategoryFilter) {
        productCategoryFilter.innerHTML = '<option value="">All Categories</option>';
        allCategories.forEach((cat) => {
          productCategoryFilter.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
      }

      // Populate modals
      if (addCategorySelect) {
        addCategorySelect.innerHTML = '<option value="">-- Select Category --</option>';
        allCategories.forEach((cat) => {
          addCategorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
      }

      if (editCategorySelect) {
        editCategorySelect.innerHTML = '<option value="">-- Select Category --</option>';
        allCategories.forEach((cat) => {
          editCategorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
      }
    } catch (err) {
      console.warn("Failed to load categories", err);
    }
  }

  async function loadProducts() {
    try {
      allProducts = await ApiService.getProducts();

      // Update dashboard KPI cards
      updateKPIs(allProducts);

      // Render dashboard table
      renderDashboardTable();

      // Render product management table
      renderProductsTable();

      // Populate stock-in, stock-out and simulator dropdowns
      populateProductSelects();

      // Render RFID directory
      renderRfidDirectory();

      // Update Charts if active
      if (document.getElementById("view-analytics").classList.contains("active")) {
        updateCharts();
      }
    } catch (err) {
      console.error("Failed to load products", err);
      if (inventoryTableBody) {
        inventoryTableBody.innerHTML = `
          <tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--danger);">
            Failed to connect to MySQL product database.
          </td></tr>`;
      }
    }
  }

  async function loadTransactions() {
    try {
      allTransactions = await ApiService.getTransactions(50);
      renderTransactionsTable();
      renderStockInTransactions();
      renderStockOutTransactions();
    } catch (err) {
      console.warn("Failed to load transactions", err);
    }
  }

  // =========================================================================
  // Module 1: Dashboard Logic
  // =========================================================================

  function updateKPIs(products) {
    let totalItems = 0;
    let outOfStock = 0;
    let lowStock = 0;

    products.forEach((p) => {
      totalItems += p.current_stock_qty;
      if (p.current_stock_qty === 0) {
        outOfStock++;
      } else if (p.current_stock_qty <= p.reorder_level) {
        lowStock++;
      }
    });

    if (metricTotalItems) metricTotalItems.textContent = totalItems;
    if (metricTotalSKUs) metricTotalSKUs.textContent = products.length;
    if (metricOutOfStock) metricOutOfStock.textContent = outOfStock;
    if (metricLowStock) metricLowStock.textContent = lowStock;

    // Render alerts
    renderAlerts(products);
  }

  function renderAlerts(products) {
    if (!alertContainer) return;
    alertContainer.innerHTML = "";

    const criticalItems = products.filter((p) => p.current_stock_qty <= p.reorder_level);

    if (criticalItems.length === 0) {
      alertContainer.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--success); display:flex; align-items:center; gap:0.5rem; padding: 0.5rem 0;">
          <span>✓</span> All grocery products have healthy stock levels.
        </div>`;
      return;
    }

    criticalItems.sort((a, b) => a.current_stock_qty - b.current_stock_qty);

    criticalItems.forEach((p) => {
      const isOut = p.current_stock_qty === 0;
      const alertDiv = document.createElement("div");
     alertDiv.className = `alert-item-card ${isOut ? "alert-out-of-stock" : "alert-low-stock"}`;
      alertDiv.innerHTML = `
        <div class="alert-icon">${isOut ? "🚫" : "⚠️"}</div>
        <div class="alert-body">
          <div class="alert-title">${p.name}</div>
          <div class="alert-desc">
            ${isOut ? "Completely depleted (0 units on scale)" : `Low: ${p.current_stock_qty} unit(s) remaining (Threshold: ${p.reorder_level})`}
          </div>
        </div>
        <span class="status-pill ${isOut ? "status-out-of-stock" : "status-low-stock"}">
          ${isOut ? "Out of Stock" : "Low Stock"}
        </span>
      `;
      alertContainer.appendChild(alertDiv);
    });
  }

  function renderDashboardTable() {
    if (!inventoryTableBody) return;
    const q = (searchInput?.value || "").toLowerCase().trim();
    const catId = categoryFilter?.value || "";

    const filtered = allProducts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.rfid_uid && p.rfid_uid.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q));
      const matchCat = !catId || String(p.category_id) === String(catId);
      return matchSearch && matchCat;
    });

    inventoryTableBody.innerHTML = "";

    if (filtered.length === 0) {
      inventoryTableBody.innerHTML = `
        <tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No products match current filter criteria.
        </td></tr>`;
      return;
    }

    filtered.forEach((p) => {
      let statusBadge = "";
      if (p.current_stock_qty === 0) {
        statusBadge = '<span class="status-pill status-out-of-stock">Out of Stock</span>';
      } else if (p.current_stock_qty <= p.reorder_level) {
        statusBadge = '<span class="status-pill status-low-stock">Low Stock</span>';
      } else {
        statusBadge = '<span class="status-pill status-in-stock">In Stock</span>';
      }

      const rfidDisplay = p.rfid_uid
        ? `<span class="rfid-pill" title="Click to change pairing" onclick="window.openRfidModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${p.rfid_uid}')">${p.rfid_uid}</span>`
        : `<button class="btn btn-secondary btn-sm" onclick="window.openRfidModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', '')">+ Pair Tag</button>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); color: var(--text-muted); font-size: 0.8rem;">#${p.id}</td>
        <td>
          <strong>${p.name}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${p.category_name}</div>
        </td>
        <td>${p.unit_weight_grams.toFixed(1)}g</td>
        <td style="font-weight: 700;">${p.current_stock_qty}</td>
        <td>${p.current_total_weight.toFixed(1)}g</td>
        <td>${statusBadge}</td>
        <td>${rfidDisplay}</td>
        <td>
          <a href="#stock-in" class="btn btn-teal btn-sm" style="text-decoration: none;" onclick="window.preselectStockIn(${p.id})">Stock In</a>
        </td>
      `;
      inventoryTableBody.appendChild(tr);
    });
  }

  // =========================================================================
  // Module 2: Product Management Logic
  // =========================================================================

  function renderProductsTable() {
    if (!productTableBody) return;
    const q = (productSearchInput?.value || "").toLowerCase().trim();
    const catId = productCategoryFilter?.value || "";
    const statusVal = productStatusFilter?.value || "";

    const filtered = allProducts.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        (p.rfid_uid && p.rfid_uid.toLowerCase().includes(q)) ||
        (p.category_name && p.category_name.toLowerCase().includes(q));
      const matchCat = !catId || String(p.category_id) === String(catId);

      let matchStatus = true;
      if (statusVal === "OUT_OF_STOCK") matchStatus = p.current_stock_qty === 0;
      else if (statusVal === "LOW_STOCK") matchStatus = p.current_stock_qty > 0 && p.current_stock_qty <= p.reorder_level;
      else if (statusVal === "IN_STOCK") matchStatus = p.current_stock_qty > p.reorder_level;

      return matchSearch && matchCat && matchStatus;
    });

    if (productCountBadge) productCountBadge.textContent = `${filtered.length} Items`;

    productTableBody.innerHTML = "";

    if (filtered.length === 0) {
      productTableBody.innerHTML = `
        <tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No products found.
        </td></tr>`;
      return;
    }

    filtered.forEach((p) => {
      let statusBadge = "";
      if (p.current_stock_qty === 0) {
        statusBadge = '<span class="status-pill status-out-of-stock">Out of Stock</span>';
      } else if (p.current_stock_qty <= p.reorder_level) {
        statusBadge = '<span class="status-pill status-low-stock">Low Stock</span>';
      } else {
        statusBadge = '<span class="status-pill status-in-stock">In Stock</span>';
      }

      const rfidDisplay = p.rfid_uid
        ? `<span class="rfid-pill" title="Click to update RFID" onclick="window.openRfidModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${p.rfid_uid}')">${p.rfid_uid}</span>`
        : `<span style="color:var(--text-muted); font-size:0.75rem;">Unassigned</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); color: var(--text-muted); font-size: 0.8rem;">#${p.id}</td>
        <td>
          <strong>${p.name}</strong>
          <div style="font-size: 0.72rem; color: var(--text-muted);">&plusmn;${p.weight_tolerance_grams}g tolerance</div>
        </td>
        <td><span class="status-pill status-in-stock" style="background:#f1f5f9; color:#475569; border-color:#cbd5e1;">${p.category_name}</span></td>
        <td>${p.unit_weight_grams.toFixed(1)}g</td>
        <td style="font-weight: 700;">${p.current_stock_qty}</td>
        <td>${p.current_total_weight.toFixed(1)}g</td>
        <td>${rfidDisplay}</td>
        <td>${p.reorder_level} units</td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.35rem;">
            <button class="btn btn-secondary btn-sm" onclick="window.openEditModal(${p.id})">✏️ Edit</button>
            <button class="btn btn-secondary btn-sm" style="color: var(--danger);" onclick="window.openDeleteModal(${p.id}, '${p.name.replace(/'/g, "\\'")}')">🗑️</button>
          </div>
        </td>
      `;
      productTableBody.appendChild(tr);
    });
  }

  // =========================================================================
  // Module 3 & 4: Stock In & Stock Out Dropdowns & Previews
  // =========================================================================

  function populateProductSelects() {
    const defaultOption = '<option value="">-- Choose Grocery Product --</option>';

    if (stockInProductSelect) {
      const prevVal = stockInProductSelect.value;
      stockInProductSelect.innerHTML = defaultOption;
      allProducts.forEach((p) => {
        stockInProductSelect.innerHTML += `<option value="${p.id}" ${prevVal == p.id ? "selected" : ""}>${p.name} (ID: ${p.id})</option>`;
      });
    }

    if (stockOutProductSelect) {
      const prevVal = stockOutProductSelect.value;
      stockOutProductSelect.innerHTML = defaultOption;
      allProducts.forEach((p) => {
        stockOutProductSelect.innerHTML += `<option value="${p.id}" ${prevVal == p.id ? "selected" : ""}>${p.name} [Available: ${p.current_stock_qty}]</option>`;
      });
    }

    if (simProductSelect) {
      const prevVal = simProductSelect.value;
      simProductSelect.innerHTML = defaultOption;
      allProducts.forEach((p) => {
        simProductSelect.innerHTML += `<option value="${p.id}" ${prevVal == p.id ? "selected" : ""}>${p.name}</option>`;
      });
    }
  }

  function updateStockInPreview() {
    if (!stockInProductSelect) return;
    const prodId = parseInt(stockInProductSelect.value);
    const prod = allProducts.find((p) => p.id === prodId);

    if (prod) {
      const qty = Math.max(1, parseInt(stockInQtyInput.value) || 1);
      const singleWeight = prod.unit_weight_grams;
      const totalAddedWeight = qty * singleWeight;
      stockInWeightInput.value = totalAddedWeight.toFixed(1);
      stockInRfidInput.value = prod.rfid_uid || "NONE (Unassigned - Stock In will update by DB ID)";

      const currentKg = currentScaleLoadKg;
      const newKg = currentKg + totalAddedWeight / 1000.0;
      const percent = Math.min(100.0, (newKg / MAX_SCALE_CAPACITY_KG) * 100);

      stockInLoadText.textContent = `${currentKg.toFixed(2)} kg → ${newKg.toFixed(2)} kg / ${MAX_SCALE_CAPACITY_KG.toFixed(2)} kg`;
      stockInLoadBar.style.width = `${percent}%`;

      if (newKg > MAX_SCALE_CAPACITY_KG) {
        stockInLoadBar.classList.add("warning");
        stockInOverloadWarning.style.display = "block";
        confirmStockInBtn.disabled = true;
        confirmStockInBtn.style.opacity = "0.6";
      } else {
        stockInLoadBar.classList.remove("warning");
        stockInOverloadWarning.style.display = "none";
        confirmStockInBtn.disabled = false;
        confirmStockInBtn.style.opacity = "1";
      }
    } else {
      stockInRfidInput.value = "";
      stockInLoadText.textContent = `${currentScaleLoadKg.toFixed(2)} kg / ${MAX_SCALE_CAPACITY_KG.toFixed(2)} kg`;
      stockInLoadBar.style.width = `${(currentScaleLoadKg / MAX_SCALE_CAPACITY_KG) * 100}%`;
      stockInOverloadWarning.style.display = "none";
      confirmStockInBtn.disabled = false;
    }
  }

  function updateStockOutPreview() {
    if (!stockOutProductSelect) return;
    const prodId = parseInt(stockOutProductSelect.value);
    const prod = allProducts.find((p) => p.id === prodId);

    if (prod) {
      stockOutAvailableInput.value = `${prod.current_stock_qty} unit(s)`;
      const qtyToDeduct = Math.max(1, parseInt(stockOutQtyInput.value) || 1);
      const totalRemovalWeight = qtyToDeduct * prod.unit_weight_grams;
      stockOutWeightInput.value = totalRemovalWeight.toFixed(1);

      const remaining = prod.current_stock_qty - qtyToDeduct;
      stockOutBalanceText.textContent = `${prod.current_stock_qty} → ${remaining} unit(s)`;

      if (prod.current_stock_qty === 0) {
        stockOutZeroWarning.style.display = "block";
        stockOutZeroWarning.textContent = "🚫 Cannot dispatch: Current inventory for this item is 0 units.";
        confirmStockOutBtn.disabled = true;
        confirmStockOutBtn.style.opacity = "0.6";
      } else if (remaining < 0) {
        stockOutZeroWarning.style.display = "block";
        stockOutZeroWarning.textContent = `🚫 Cannot dispatch: Requested ${qtyToDeduct} exceeds available stock of ${prod.current_stock_qty}.`;
        confirmStockOutBtn.disabled = true;
        confirmStockOutBtn.style.opacity = "0.6";
      } else {
        stockOutZeroWarning.style.display = "none";
        confirmStockOutBtn.disabled = false;
        confirmStockOutBtn.style.opacity = "1";
      }
    } else {
      stockOutAvailableInput.value = "0 units";
      stockOutBalanceText.textContent = "0 → 0 units";
      stockOutZeroWarning.style.display = "none";
      confirmStockOutBtn.disabled = false;
    }
  }

  // Stock In Events
  stockInProductSelect?.addEventListener("change", updateStockInPreview);
  stockInQtyInput?.addEventListener("input", updateStockInPreview);

  confirmStockInBtn?.addEventListener("click", async () => {
    const prodId = parseInt(stockInProductSelect.value);
    if (!prodId) {
      alert("Please select a grocery product to stock in.");
      return;
    }

    const prod = allProducts.find((p) => p.id === prodId);
    const qty = parseInt(stockInQtyInput.value) || 1;
    const weightGrams = parseFloat(stockInWeightInput.value);

    stockInResultBox.style.display = "block";
    stockInResultBox.className = "sim-result-box";
    stockInResultBox.innerHTML = "⏳ Processing Stock In transaction & scale validation...";

    try {
      if (prod.rfid_uid) {
        // Use Hardware Scan API with RFID validation
        const res = await ApiService.scanHardware({
          rfid_uid: prod.rfid_uid,
          measured_weight_grams: weightGrams / qty, // unit weight
          operation_mode: "STOCK_IN",
        });

        stockInResultBox.className = "sim-result-box success";
        stockInResultBox.innerHTML = `
          <strong>✓ Stock In Successful!</strong><br>
          Added to: <em>${res.product_name}</em><br>
          New Stock: <strong>${res.current_stock_qty} units</strong> | Platform Weight: <strong>${res.current_total_weight_grams}g</strong>
        `;
      } else {
        // Product has no RFID tag: use safe stock adjustment via Product Update
        const newStock = prod.current_stock_qty + qty;
        await ApiService.updateProduct(prodId, {
          current_stock_qty: newStock,
        });

        stockInResultBox.className = "sim-result-box success";
        stockInResultBox.innerHTML = `
          <strong>✓ Stock In Successful!</strong><br>
          Updated: <em>${prod.name}</em><br>
          New Stock: <strong>${newStock} units</strong>
        `;
      }

      showToast(`Stock In executed for ${prod.name} (+${qty} units)`, "success");
      await loadProducts();
      await loadHealth();
      await loadTransactions();
      updateStockInPreview();
    } catch (err) {
      stockInResultBox.className = "sim-result-box error";
      stockInResultBox.innerHTML = `<strong>⚠️ Stock In Rejected:</strong><br>${err.message}`;
      showToast(`Stock In Error: ${err.message}`, "error");
    }
  });

  // Stock Out Events
  stockOutProductSelect?.addEventListener("change", updateStockOutPreview);
  stockOutQtyInput?.addEventListener("input", updateStockOutPreview);

  confirmStockOutBtn?.addEventListener("click", async () => {
    const prodId = parseInt(stockOutProductSelect.value);
    if (!prodId) {
      alert("Please select a grocery product to stock out.");
      return;
    }

    const prod = allProducts.find((p) => p.id === prodId);
    const qty = parseInt(stockOutQtyInput.value) || 1;
    const weightGrams = parseFloat(stockOutWeightInput.value);

    stockOutResultBox.style.display = "block";
    stockOutResultBox.className = "sim-result-box";
    stockOutResultBox.innerHTML = "⏳ Processing Stock Out transaction & scale deduction...";

    try {
      if (prod.rfid_uid) {
        const res = await ApiService.scanHardware({
          rfid_uid: prod.rfid_uid,
          measured_weight_grams: weightGrams / qty,
          operation_mode: "STOCK_OUT",
        });

        stockOutResultBox.className = "sim-result-box success";
        stockOutResultBox.innerHTML = `
          <strong>✓ Stock Out Successful!</strong><br>
          Deducted from: <em>${res.product_name}</em><br>
          Remaining Stock: <strong>${res.current_stock_qty} units</strong> | Platform Weight: <strong>${res.current_total_weight_grams}g</strong>
        `;
      } else {
        const newStock = Math.max(0, prod.current_stock_qty - qty);
        await ApiService.updateProduct(prodId, {
          current_stock_qty: newStock,
        });

        stockOutResultBox.className = "sim-result-box success";
        stockOutResultBox.innerHTML = `
          <strong>✓ Stock Out Successful!</strong><br>
          Updated: <em>${prod.name}</em><br>
          Remaining Stock: <strong>${newStock} units</strong>
        `;
      }

      showToast(`Stock Out executed for ${prod.name} (-${qty} units)`, "success");
      await loadProducts();
      await loadHealth();
      await loadTransactions();
      updateStockOutPreview();
    } catch (err) {
      stockOutResultBox.className = "sim-result-box error";
      stockOutResultBox.innerHTML = `<strong>⚠️ Stock Out Rejected:</strong><br>${err.message}`;
      showToast(`Stock Out Error: ${err.message}`, "error");
    }
  });

  // Helper window callbacks
  window.preselectStockIn = function (id) {
    if (stockInProductSelect) {
      stockInProductSelect.value = id;
      updateStockInPreview();
    }
  };

  // =========================================================================
  // Module 5: Hardware Simulator & RFID Directory
  // =========================================================================

  function updateSimulatorPayloadPreview() {
    if (!jsonPayloadPreview) return;
    const prodId = parseInt(simProductSelect?.value);
    const prod = allProducts.find((p) => p.id === prodId);

    const payload = {
      rfid_uid: prod?.rfid_uid || "E280689A",
      measured_weight_grams: parseFloat(simWeightInput?.value || 500.0),
      operation_mode: simModeSelect?.value || "STOCK_IN",
    };

    jsonPayloadPreview.textContent = JSON.stringify(payload, null, 2);
  }

  simProductSelect?.addEventListener("change", () => {
    const prodId = parseInt(simProductSelect.value);
    const prod = allProducts.find((p) => p.id === prodId);
    if (prod && simWeightInput) {
      simWeightInput.value = prod.unit_weight_grams.toFixed(1);
    }
    updateSimulatorPayloadPreview();
  });

  simModeSelect?.addEventListener("change", updateSimulatorPayloadPreview);
  simWeightInput?.addEventListener("input", updateSimulatorPayloadPreview);

  simScanBtn?.addEventListener("click", async () => {
    const prodId = parseInt(simProductSelect.value);
    const prod = allProducts.find((p) => p.id === prodId);
    const rfidUid = prod?.rfid_uid || "E280689A";
    const weight = parseFloat(simWeightInput.value) || 500.0;
    const mode = simModeSelect.value;

    simResultBox.style.display = "block";
    simResultBox.className = "sim-result-box";
    simResultBox.innerHTML = `⏳ Transmitting HTTP POST /api/hardware/scan to backend...`;

    try {
      const res = await ApiService.scanHardware({
        rfid_uid: rfidUid,
        measured_weight_grams: weight,
        operation_mode: mode,
      });

      const actualRfid = res.rfid_uid || rfidUid;
      simResultBox.className = "sim-result-box success";
      simResultBox.innerHTML = `
        <strong>✓ Hardware Scan Confirmed!</strong><br>
        Transaction Mode: <strong>${res.transaction_type}</strong><br>
        Product: <em>${res.product_name}</em> (UID: <code>${actualRfid}</code>)<br>
        Stock Quantity: <strong>${res.current_stock_qty} units</strong> | Platform Weight: <strong>${res.current_total_weight_grams}g</strong>
      `;

      showToast(`Scan confirmed: ${res.product_name} (${res.transaction_type})`, "success");
      await loadProducts();
      await loadHealth();
      await loadTransactions();
    } catch (err) {
      simResultBox.className = "sim-result-box error";
      simResultBox.innerHTML = `<strong>⚠️ Hardware Scan Rejected:</strong><br>${err.message}`;
      showToast(`Scan Rejected: ${err.message}`, "error");
    }
  });

  function renderRfidDirectory() {
    if (!rfidDirectoryTableBody) return;
    rfidDirectoryTableBody.innerHTML = "";

    allProducts.forEach((p) => {
      const isPaired = !!p.rfid_uid;
      const statusPill = isPaired
        ? '<span class="status-pill status-in-stock">Paired Active</span>'
        : '<span class="status-pill status-out-of-stock">Unassigned</span>';

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 0.8rem;">#${p.id}</td>
        <td><strong>${p.name}</strong></td>
        <td>
          ${isPaired ? `<span class="rfid-pill">${p.rfid_uid}</span>` : '<span style="color:var(--text-muted); font-size:0.8rem;">-- None --</span>'}
        </td>
        <td style="font-size: 0.75rem; color: var(--text-muted);">SPI 13.56MHz MIFARE</td>
        <td>${statusPill}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="window.openRfidModal(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${p.rfid_uid || ""}')">
            ${isPaired ? "Change UID" : "+ Pair Tag"}
          </button>
        </td>
      `;
      rfidDirectoryTableBody.appendChild(tr);
    });
  }

  // =========================================================================
  // Module 6: Analytics & Charts Logic
  // =========================================================================

  function updateCharts() {
    if (typeof Chart === "undefined") return;

    const labels = allProducts.map((p) => p.name.split(" ")[0]);
    const stockQuantities = allProducts.map((p) => p.current_stock_qty);
    const reorderLevels = allProducts.map((p) => p.reorder_level);
    const totalWeights = allProducts.map((p) => p.current_total_weight);

    // Chart 1: Stock vs Reorder Bar Chart
    const ctxStock = document.getElementById("stockLevelChart");
    if (ctxStock) {
      if (stockChartInstance) stockChartInstance.destroy();

      stockChartInstance = new Chart(ctxStock, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Current Stock",
              data: stockQuantities,
              backgroundColor: "rgba(13, 148, 136, 0.75)",
              borderColor: "#0d9488",
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: "Reorder Threshold",
              data: reorderLevels,
              backgroundColor: "rgba(239, 68, 68, 0.4)",
              borderColor: "#ef4444",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      });
    }

    // Chart 2: Physical Scale Weight Distribution
    const ctxWeight = document.getElementById("weightDistributionChart");
    if (ctxWeight) {
      if (weightChartInstance) weightChartInstance.destroy();

      const palette = ["#0d9488", "#2563eb", "#8b5cf6", "#f59e0b", "#ec4899", "#10b981"];

      weightChartInstance = new Chart(ctxWeight, {
        type: "doughnut",
        data: {
          labels: allProducts.map((p) => p.name),
          datasets: [
            {
              data: totalWeights.map((w) => (w > 0 ? w : 0.01)),
              backgroundColor: palette.slice(0, allProducts.length),
              borderWidth: 2,
              borderColor: "#ffffff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "right", labels: { boxWidth: 12, font: { size: 10 } } },
          },
        },
      });
    }
  }

  function renderTransactionsTable() {
    if (!transactionsTableBody) return;
    transactionsTableBody.innerHTML = "";

    if (allTransactions.length === 0) {
      transactionsTableBody.innerHTML = `
        <tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No transaction audit records found in MySQL.
        </td></tr>`;
      return;
    }

    allTransactions.forEach((t) => {
      const isStockIn = t.transaction_type === "STOCK_IN";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">#${t.id}</td>
        <td style="font-size: 0.75rem; white-space: nowrap;">${t.timestamp}</td>
        <td><strong>${t.product_name}</strong></td>
        <td>
          <span class="status-pill ${isStockIn ? "status-in-stock" : "status-out-of-stock"}">
            ${t.transaction_type}
          </span>
        </td>
        <td style="font-weight: 700; color: ${isStockIn ? "var(--teal)" : "var(--primary)"};">
          ${isStockIn ? "+" : ""}${t.quantity_delta}
        </td>
        <td>${t.measured_weight_grams.toFixed(1)}g</td>
        <td style="font-family: var(--font-mono); font-size: 0.78rem;">
          ${t.previous_stock_qty} &rarr; <strong>${t.new_stock_qty}</strong>
        </td>
        <td style="font-family: var(--font-mono); font-size: 0.78rem;">
          ${t.previous_total_weight.toFixed(1)}g &rarr; <strong>${t.new_total_weight.toFixed(1)}g</strong>
        </td>
        <td style="font-size: 0.75rem; color: var(--text-muted);">${t.notes || "--"}</td>
      `;
      transactionsTableBody.appendChild(tr);
    });
  }

  function renderStockInTransactions() {
    if (!stockInTransactionsBody) return;
    const stockInList = allTransactions.filter((t) => t.transaction_type === "STOCK_IN").slice(0, 5);

    stockInTransactionsBody.innerHTML = "";
    if (stockInList.length === 0) {
      stockInTransactionsBody.innerHTML = `
        <tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
          No recent Stock In activity recorded.
        </td></tr>`;
      return;
    }

    stockInList.forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-size: 0.75rem;">${t.timestamp.split(" ")[1] || t.timestamp}</td>
        <td><strong>${t.product_name}</strong></td>
        <td style="color: var(--teal); font-weight: 700;">+${t.quantity_delta}</td>
        <td>${t.measured_weight_grams.toFixed(1)}g</td>
        <td><strong>${t.new_stock_qty} units</strong></td>
      `;
      stockInTransactionsBody.appendChild(tr);
    });
  }

  function renderStockOutTransactions() {
    if (!stockOutTransactionsBody) return;
    const stockOutList = allTransactions.filter((t) => t.transaction_type === "STOCK_OUT").slice(0, 5);

    stockOutTransactionsBody.innerHTML = "";
    if (stockOutList.length === 0) {
      stockOutTransactionsBody.innerHTML = `
        <tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
          No recent Stock Out activity recorded.
        </td></tr>`;
      return;
    }

    stockOutList.forEach((t) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td style="font-size: 0.75rem;">${t.timestamp.split(" ")[1] || t.timestamp}</td>
        <td><strong>${t.product_name}</strong></td>
        <td style="color: var(--danger); font-weight: 700;">${t.quantity_delta}</td>
        <td>${t.measured_weight_grams.toFixed(1)}g</td>
        <td><strong>${t.new_stock_qty} units</strong></td>
      `;
      stockOutTransactionsBody.appendChild(tr);
    });
  }

  refreshTransactionsBtn?.addEventListener("click", loadTransactions);

  // =========================================================================
  // Module 7: Academic & Viva Inspector Logic
  // =========================================================================

  async function loadAcademicData() {
    await loadHashTable();
    await loadPriorityQueue();
  }

  async function loadHashTable() {
    try {
      const data = await ApiService.getAcademicHashTable();
      if (htCapacity) htCapacity.textContent = data.capacity;
      if (htCount) htCount.textContent = data.item_count;
      if (htLoadFactor) htLoadFactor.textContent = data.load_factor;

      if (htChainsContainer) {
        htChainsContainer.innerHTML = "";
        if (!data.bucket_chains || data.bucket_chains.length === 0) {
          htChainsContainer.innerHTML = `
            <div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">
              No RFID tags paired yet. Pair a tag to view bucket chaining.
            </div>`;
          return;
        }

        data.bucket_chains.forEach((b) => {
          const row = document.createElement("div");
          row.className = "bucket-chain-row";
          const nodesHtml = b.nodes
            .map((n) => `<span class="rfid-pill">${n.key} (ID: ${n.product_id})</span>`)
            .join(' <span class="chain-arrow">➔</span> ');

          row.innerHTML = `
            <div class="bucket-idx">Bucket [${b.bucket_index}]:</div>
            <div>${nodesHtml} <span class="chain-arrow">➔ NULL</span></div>
          `;
          htChainsContainer.appendChild(row);
        });
      }
    } catch (err) {
      console.warn("Failed to load Hash Table data", err);
    }
  }

  async function loadPriorityQueue() {
    try {
      const data = await ApiService.getAcademicPriorityQueue();
      if (heapSize) heapSize.textContent = data.heap_size;
      if (heapRootItem) {
        if (data.root_item) {
          heapRootItem.textContent = `${data.root_item.name} (${data.root_item.current_stock_qty} units)`;
        } else {
          heapRootItem.textContent = "Heap Empty";
        }
      }
      if (heapArrayView) {
        heapArrayView.textContent = JSON.stringify(data.heap_array_view, null, 2);
      }
    } catch (err) {
      console.warn("Failed to load Priority Queue data", err);
    }
  }

  refreshHtBtn?.addEventListener("click", loadHashTable);
  refreshHeapBtn?.addEventListener("click", loadPriorityQueue);

  runSearchBtn?.addEventListener("click", async () => {
    const key = searchKeySelect.value;
    const val = searchTargetInput.value.trim();
    if (!val) {
      alert("Please enter a target value to search.");
      return;
    }

    searchResultsDiv.style.display = "block";
    searchResultsDiv.innerHTML = "⚡ Executing Linear and Binary Search benchmarks...";

    try {
      const res = await ApiService.benchmarkSearch(key, val);
      searchResultsDiv.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 0.5rem; color: var(--text-main);">
          Benchmark Results for Key: <code>${res.search_key}</code> = <code>${res.target_value}</code>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.85rem;">
          <div style="background-color: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-sm); border-left: 3px solid var(--warning);">
            <strong style="color: var(--warning);">Sequential Linear Search:</strong><br>
            Time Complexity: <strong>${res.linear_search.time_complexity}</strong><br>
            Steps Taken: <strong>${res.linear_search.steps} steps</strong><br>
            Result Found: <strong>${res.linear_search.found ? "YES" : "NO"}</strong>
          </div>
          <div style="background-color: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-sm); border-left: 3px solid var(--teal);">
            <strong style="color: var(--teal);">Divide-and-Conquer Binary Search:</strong><br>
            Time Complexity: <strong>${res.binary_search.time_complexity}</strong><br>
            Steps Taken: <strong>${res.binary_search.steps} steps</strong><br>
            Result Found: <strong>${res.binary_search.found ? "YES" : "NO"}</strong>
          </div>
        </div>
      `;
    } catch (err) {
      searchResultsDiv.innerHTML = `<span style="color:var(--danger);">Error: ${err.message}</span>`;
    }
  });

  decodeTwosBtn?.addEventListener("click", async () => {
    const raw = hexInput.value.trim();
    twosResultDiv.style.display = "block";
    twosResultDiv.innerHTML = "Decoding Two's Complement...";

    try {
      const res = await ApiService.decodeTwosComplement(raw);
      twosResultDiv.innerHTML = `
        <div style="font-size: 0.85rem; line-height: 1.6;">
          Hex Input: <code>${res.raw_24bit_hex}</code> (MSB Sign Bit: <strong>${res.sign_bit}</strong>)<br>
          Decoded Signed Integer: <strong style="color:var(--primary); font-size:1.1rem;">${res.signed_decimal_value}</strong><br>
          32-Bit Signed Representation: <code>${res.sign_extended_32bit_hex}</code><br>
          <span style="font-size:0.75rem; color:var(--text-muted);">${res.explanation}</span>
        </div>
      `;
    } catch (err) {
      twosResultDiv.innerHTML = `<span style="color:var(--danger);">Error: ${err.message}</span>`;
    }
  });

  analyzeEndianBtn?.addEventListener("click", async () => {
    const uid = endianInput.value.trim();
    endianResultDiv.style.display = "block";
    endianResultDiv.innerHTML = "Analyzing bus vs memory endianness...";

    try {
      const res = await ApiService.analyzeEndianness(uid);
      endianResultDiv.innerHTML = `
        <div style="font-size: 0.85rem; line-height: 1.6;">
          SPI Wire Transmission (Big-Endian): <code>${res.big_endian_wire_order}</code><br>
          ESP32 Xtensa Memory (Little-Endian): <strong style="color:var(--teal); font-size:1.05rem;">${res.little_endian_xtensa_order}</strong><br>
          32-bit Integer Value: <code>0x${res.as_uint32_hex}</code> (${res.as_uint32_decimal})<br>
          <span style="font-size:0.75rem; color:var(--text-muted);">${res.architectural_notes}</span>
        </div>
      `;
    } catch (err) {
      endianResultDiv.innerHTML = `<span style="color:var(--danger);">Error: ${err.message}</span>`;
    }
  });

  // =========================================================================
  // Shared Modals Logic (RFID, Add Product, Edit Product, Delete Product)
  // =========================================================================

  // 1. RFID Pairing Modal
  window.openRfidModal = function (productId, productName, currentUid) {
    activeAssignProductId = productId;
    if (modalProductName) modalProductName.textContent = productName;
    if (modalRfidInput) modalRfidInput.value = currentUid || "";
    if (rfidModal) rfidModal.classList.add("active");
  };

  modalCloseX?.addEventListener("click", () => rfidModal.classList.remove("active"));
  modalCancelBtn?.addEventListener("click", () => rfidModal.classList.remove("active"));

  modalSaveBtn?.addEventListener("click", async () => {
    const uid = (modalRfidInput.value || "").trim().toUpperCase();
    if (!uid) {
      alert("Please enter a valid RFID UID (Hex).");
      return;
    }

    try {
      await ApiService.assignRFID(activeAssignProductId, uid);
      rfidModal.classList.remove("active");
      showToast(`RFID tag ${uid} successfully paired!`, "success");
      await loadProducts();
    } catch (err) {
      alert(`RFID Pairing Error: ${err.message}`);
    }
  });

  // 2. Add Product Modal
  openAddProductBtn?.addEventListener("click", () => {
    addModalError.style.display = "none";
    addNameInput.value = "";
    addWeightInput.value = "500.0";
    addToleranceInput.value = "35.0";
    addInitialStockInput.value = "0";
    addReorderInput.value = "2";
    addRfidInput.value = "";
    addProductModal.classList.add("active");
  });

  closeAddModalX?.addEventListener("click", () => addProductModal.classList.remove("active"));
  cancelAddBtn?.addEventListener("click", () => addProductModal.classList.remove("active"));

  saveAddBtn?.addEventListener("click", async () => {
    const name = addNameInput.value.trim();
    const catId = parseInt(addCategorySelect.value);
    const weight = parseFloat(addWeightInput.value);
    const tolerance = parseFloat(addToleranceInput.value);
    const initialStock = parseInt(addInitialStockInput.value) || 0;
    const reorder = parseInt(addReorderInput.value) || 2;
    const rfid = addRfidInput.value.trim().toUpperCase() || null;

    if (!name) {
      addModalError.style.display = "block";
      addModalError.textContent = "Product name is required.";
      return;
    }

    if (!catId) {
      addModalError.style.display = "block";
      addModalError.textContent = "Please select a category.";
      return;
    }

    if (weight <= 0) {
      addModalError.style.display = "block";
      addModalError.textContent = "Unit weight must be greater than 0 grams.";
      return;
    }

    try {
      await ApiService.createProduct({
        name,
        category_id: catId,
        unit_weight_grams: weight,
        weight_tolerance_grams: tolerance,
        initial_stock_qty: initialStock,
        reorder_level: reorder,
        rfid_uid: rfid,
      });

      addProductModal.classList.remove("active");
      showToast(`Product '${name}' created successfully!`, "success");
      await loadProducts();
      await loadHealth();
      await loadTransactions();
    } catch (err) {
      addModalError.style.display = "block";
      addModalError.textContent = err.message;
    }
  });

  // 3. Edit Product Modal
  window.openEditModal = function (productId) {
    const prod = allProducts.find((p) => p.id === productId);
    if (!prod) return;

    activeEditProductId = productId;
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
  };

  closeEditModalX?.addEventListener("click", () => editProductModal.classList.remove("active"));
  cancelEditBtn?.addEventListener("click", () => editProductModal.classList.remove("active"));

  saveEditBtn?.addEventListener("click", async () => {
    const name = editNameInput.value.trim();
    const catId = parseInt(editCategorySelect.value);
    const weight = parseFloat(editWeightInput.value);
    const tolerance = parseFloat(editToleranceInput.value);
    const stockQty = parseInt(editStockQtyInput.value);
    const reorder = parseInt(editReorderInput.value);
    const rfid = editRfidInput.value.trim().toUpperCase();

    if (!name) {
      editModalError.style.display = "block";
      editModalError.textContent = "Product name cannot be empty.";
      return;
    }

    try {
      await ApiService.updateProduct(activeEditProductId, {
        name,
        category_id: catId,
        unit_weight_grams: weight,
        weight_tolerance_grams: tolerance,
        current_stock_qty: stockQty,
        reorder_level: reorder,
        rfid_uid: rfid === "" ? "" : rfid,
      });

      editProductModal.classList.remove("active");
      showToast(`Product '${name}' updated successfully!`, "success");
      await loadProducts();
      await loadHealth();
      await loadTransactions();
    } catch (err) {
      editModalError.style.display = "block";
      editModalError.textContent = err.message;
    }
  });

  // 4. Delete Product Modal
  window.openDeleteModal = function (productId, productName) {
    activeDeleteProductId = productId;
    deleteModalError.style.display = "none";
    if (deleteProductName) deleteProductName.textContent = productName;
    deleteModal.classList.add("active");
  };

  closeDeleteModalX?.addEventListener("click", () => deleteModal.classList.remove("active"));
  cancelDeleteBtn?.addEventListener("click", () => deleteModal.classList.remove("active"));

  confirmDeleteBtn?.addEventListener("click", async () => {
    try {
      await ApiService.deleteProduct(activeDeleteProductId);
      deleteModal.classList.remove("active");
      showToast("Product deleted successfully.", "success");
      await loadProducts();
      await loadHealth();
      await loadTransactions();
    } catch (err) {
      deleteModalError.style.display = "block";
      deleteModalError.textContent = err.message;
    }
  });

  // =========================================================================
  // Global Event Listeners & Periodic Sync
  // =========================================================================

  searchInput?.addEventListener("input", renderDashboardTable);
  categoryFilter?.addEventListener("change", renderDashboardTable);

  productSearchInput?.addEventListener("input", renderProductsTable);
  productCategoryFilter?.addEventListener("change", renderProductsTable);
  productStatusFilter?.addEventListener("change", renderProductsTable);

  refreshBtn?.addEventListener("click", async () => {
    await loadHealth();
    await loadProducts();
    await loadTransactions();
    showToast("Dashboard data refreshed from MySQL.", "success");
  });

  refreshProductsBtn?.addEventListener("click", async () => {
    await loadProducts();
    showToast("Product catalog refreshed.", "success");
  });

  // Initialize application
  async function init() {
    await loadHealth();
    await loadCategories();
    await loadProducts();
    await loadTransactions();

    // Activate initial route based on URL hash
    handleHashChange();

    // Auto-refresh metrics every 6 seconds
    setInterval(loadHealth, 6000);
    setInterval(loadProducts, 6000);
  }

  init();
});
