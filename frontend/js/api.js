/**
 * Smart Inventory and Warehouse Management System
 * API Communication Layer
 * Connects Frontend directly to FastAPI Backend on http://127.0.0.1:8000
 */

const API_BASE = window.location.protocol.startsWith("http")
  ? window.location.origin
  : "http://127.0.0.1:8000";

const ApiService = {
  /**
   * Health Check: queries server and MySQL status, product count, and scale capacity.
   */
  async getHealth() {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn("API Service: Backend unreachable or offline", err);
      return { status: "offline", error: err.message };
    }
  },

  /**
   * Fetches all grocery inventory items with live weights and stock counts.
   */
  async getProducts() {
    const response = await fetch(`${API_BASE}/api/inventory/products`);
    if (!response.ok) throw new Error("Failed to load inventory products");
    return await response.json();
  },

  /**
   * Fetches normalized grocery categories.
   */
  async getCategories() {
    const response = await fetch(`${API_BASE}/api/inventory/categories`);
    if (!response.ok) throw new Error("Failed to load categories");
    return await response.json();
  },

  /**
   * Fetches recent inventory transaction history (audit trail).
   */
  async getTransactions(limit = 50) {
    const response = await fetch(`${API_BASE}/api/inventory/transactions?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to load inventory transactions");
    return await response.json();
  },

  /**
   * Creates a new grocery product in MySQL.
   */
  async createProduct(productData) {
    const response = await fetch(`${API_BASE}/api/inventory/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to create product");
    }
    return data;
  },

  /**
   * Updates an existing grocery product in MySQL.
   */
  async updateProduct(productId, productData) {
    const response = await fetch(`${API_BASE}/api/inventory/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to update product");
    }
    return data;
  },

  /**
   * Deletes a grocery product if no transactions or physical stock exist.
   */
  async deleteProduct(productId) {
    const response = await fetch(`${API_BASE}/api/inventory/products/${productId}`, {
      method: "DELETE",
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to delete product");
    }
    return data;
  },

  /**
   * Pairs an RFID Card/Fob UID with an existing grocery product.
   */
  async assignRFID(productId, rfidUid) {
    const response = await fetch(`${API_BASE}/api/inventory/products/${productId}/assign-rfid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfid_uid: rfidUid.trim().toUpperCase() }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Failed to assign RFID tag");
    }
    return data;
  },

  /**
   * Hardware Scan: forwards scan event (ESP32 / RC522 / Load Cell) to backend.
   * Calls POST /api/hardware/scan.
   */
  async scanHardware(payload) {
    const response = await fetch(`${API_BASE}/api/hardware/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || "Hardware scan processing failed");
    }
    return data;
  },

  /**
   * Academic: Fetches in-memory Hash Table buckets and collision chains.
   */
  async getAcademicHashTable() {
    const response = await fetch(`${API_BASE}/api/academic/hash-table`);
    if (!response.ok) throw new Error("Failed to fetch Hash Table inspector data");
    return await response.json();
  },

  /**
   * Academic: Fetches Min-Heap priority queue state and critical reorder items.
   */
  async getAcademicPriorityQueue() {
    const response = await fetch(`${API_BASE}/api/academic/priority-queue`);
    if (!response.ok) throw new Error("Failed to fetch Priority Queue state");
    return await response.json();
  },

  /**
   * Academic: Runs Linear vs. Binary search comparison.
   */
  async benchmarkSearch(searchKey, targetValue) {
    const response = await fetch(`${API_BASE}/api/academic/search-benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search_key: searchKey, target_value: targetValue }),
    });
    if (!response.ok) throw new Error("Search benchmark failed");
    return await response.json();
  },

  /**
   * Academic MPCA: Decodes 24-bit raw Two's Complement ADC reading.
   */
  async decodeTwosComplement(rawHex) {
    const response = await fetch(`${API_BASE}/api/academic/mpca/decode-twos-complement`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw_24bit_hex: rawHex }),
    });
    if (!response.ok) throw new Error("Two's complement decoding failed");
    return await response.json();
  },

  /**
   * Academic MPCA: Analyzes Big-Endian (SPI bus) vs Little-Endian (ESP32 CPU) memory layout.
   */
  async analyzeEndianness(hexUid) {
    const response = await fetch(`${API_BASE}/api/academic/mpca/endianness`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hex_uid: hexUid }),
    });
    if (!response.ok) throw new Error("Endianness analysis failed");
    return await response.json();
  },
};
