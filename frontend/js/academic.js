/**
 * Smart Inventory and Warehouse Management System
 * Academic & Viva Inspector Controller (academic.html)
 * Demonstrates Data Structures & MPCA concepts live to examiners.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Hash Table Elements
  const htCapacityEl = document.getElementById("htCapacity");
  const htCountEl = document.getElementById("htCount");
  const htLoadFactorEl = document.getElementById("htLoadFactor");
  const htChainsContainer = document.getElementById("htChainsContainer");
  const refreshHtBtn = document.getElementById("refreshHtBtn");

  // Min-Heap Elements
  const heapSizeEl = document.getElementById("heapSize");
  const heapRootItemEl = document.getElementById("heapRootItem");
  const heapArrayViewEl = document.getElementById("heapArrayView");
  const refreshHeapBtn = document.getElementById("refreshHeapBtn");

  // Search Benchmark Elements
  const searchKeySelect = document.getElementById("searchKeySelect");
  const searchTargetInput = document.getElementById("searchTargetInput");
  const runSearchBtn = document.getElementById("runSearchBtn");
  const searchResultsDiv = document.getElementById("searchResultsDiv");

  // MPCA Two's Complement Elements
  const hexInput = document.getElementById("hexInput");
  const decodeTwosBtn = document.getElementById("decodeTwosBtn");
  const twosResultDiv = document.getElementById("twosResultDiv");

  // MPCA Endianness Elements
  const endianInput = document.getElementById("endianInput");
  const analyzeEndianBtn = document.getElementById("analyzeEndianBtn");
  const endianResultDiv = document.getElementById("endianResultDiv");

  /**
   * Initializes academic views.
   */
  async function init() {
    await loadHashTable();
    await loadPriorityQueue();
  }

  /**
   * 1. Loads and visualizes the Hash Table.
   */
  async function loadHashTable() {
    try {
      const data = await ApiService.getAcademicHashTable();
      htCapacityEl.textContent = data.capacity;
      htCountEl.textContent = data.item_count;
      htLoadFactorEl.textContent = data.load_factor;

      htChainsContainer.innerHTML = "";
      if (!data.bucket_chains || data.bucket_chains.length === 0) {
        htChainsContainer.innerHTML = `
          <div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem;">
            No RFID tags have been paired to products yet. Pair a tag from the Dashboard to see bucket nodes.
          </div>`;
        return;
      }

      data.bucket_chains.forEach((b) => {
        const row = document.createElement("div");
        row.className = "bucket-chain-row";

        let nodesHtml = b.nodes
          .map((n) => `<span class="rfid-pill">${n.key} (ID: ${n.product_id})</span>`)
          .join(' <span class="chain-arrow">➔</span> ');

        row.innerHTML = `
          <div class="bucket-idx">Bucket [${b.bucket_index}]:</div>
          <div>${nodesHtml} <span class="chain-arrow">➔ NULL</span></div>
        `;
        htChainsContainer.appendChild(row);
      });
    } catch (err) {
      console.error("Failed to load hash table visualizer", err);
    }
  }

  /**
   * 2. Loads and visualizes the Min-Heap.
   */
  async function loadPriorityQueue() {
    try {
      const data = await ApiService.getAcademicPriorityQueue();
      heapSizeEl.textContent = data.heap_size;

      if (data.root_item) {
        heapRootItemEl.textContent = `${data.root_item.name} (${data.root_item.current_stock_qty} units)`;
      } else {
        heapRootItemEl.textContent = "Heap Empty";
      }

      // Display formatted heap array
      heapArrayViewEl.textContent = JSON.stringify(data.heap_array_view, null, 2);
    } catch (err) {
      console.error("Failed to load priority queue visualizer", err);
    }
  }

  /**
   * 3. Runs Search Benchmark (Linear Search vs Binary Search).
   */
  runSearchBtn.addEventListener("click", async () => {
    const key = searchKeySelect.value;
    const rawVal = searchTargetInput.value.trim();
    if (!rawVal) {
      alert("Please enter a target search value.");
      return;
    }

    const target = isNaN(rawVal) ? rawVal : Number(rawVal);

    try {
      const report = await ApiService.benchmarkSearch(key, target);
      searchResultsDiv.style.display = "block";
      searchResultsDiv.innerHTML = `
        <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--primary);">
          Search Benchmark Results (${report.total_items} items in warehouse):
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 0.75rem;">
          <div style="background: #ffffff; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px;">
            <div style="font-weight: 700; color: #b45309;">Linear Search O(N)</div>
            <div style="font-size: 0.85rem; margin-top: 0.3rem;">
              Steps Taken: <strong>${report.linear_search.steps_taken} comparisons</strong><br>
              Found: ${report.linear_search.found ? "✓ Yes" : "✗ No"}
            </div>
          </div>
          <div style="background: #ffffff; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px;">
            <div style="font-weight: 700; color: #047857;">Binary Search O(log N)</div>
            <div style="font-size: 0.85rem; margin-top: 0.3rem;">
              Steps Taken: <strong>${report.binary_search.steps_taken} comparisons</strong><br>
              Found: ${report.binary_search.found ? "✓ Yes" : "✗ No"}
            </div>
          </div>
        </div>
        <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-main);">
          Complexity Verdict: ${report.efficiency_gain}
        </div>
      `;
    } catch (err) {
      alert(`Benchmark Error: ${err.message}`);
    }
  });

  /**
   * 4. MPCA Two's Complement Decoder.
   */
  decodeTwosBtn.addEventListener("click", async () => {
    const rawHex = hexInput.value.trim();
    if (!rawHex) {
      alert("Please enter a hex string (e.g. 0x7FFFFF or 0xFFFFFF).");
      return;
    }

    try {
      const res = await ApiService.decodeTwosComplement(rawHex);
      twosResultDiv.style.display = "block";
      twosResultDiv.innerHTML = `
        <div style="font-weight: 700; font-size: 0.9rem; color: var(--primary); margin-bottom: 0.5rem;">
          24-Bit ADC Two's Complement Decode:
        </div>
        <table class="data-table" style="font-size: 0.8rem;">
          <tr><th>Input Hex</th><td><code>${res.raw_input_hex}</code></td></tr>
          <tr><th>24-Bit Binary</th><td><code>${res.raw_binary_24bit}</code></td></tr>
          <tr><th>Sign Bit (MSB, Bit 23)</th><td><strong>${res.sign_bit_msb}</strong> (${res.is_negative ? "Negative" : "Positive"})</td></tr>
          <tr><th>Signed Decimal Value</th><td><strong style="font-size: 1.1rem; color: ${res.is_negative ? 'var(--danger)' : 'var(--success)'};">${res.signed_decimal_value}</strong></td></tr>
          <tr><th>Architectural Rule</th><td>${res.explanation}</td></tr>
        </table>
      `;
    } catch (err) {
      alert(`Decoding Error: ${err.message}`);
    }
  });

  /**
   * 5. MPCA Endianness Analyzer.
   */
  analyzeEndianBtn.addEventListener("click", async () => {
    const hexUid = endianInput.value.trim();
    if (!hexUid) {
      alert("Please enter an RFID hex UID (e.g. E280689A).");
      return;
    }

    try {
      const res = await ApiService.analyzeEndianness(hexUid);
      endianResultDiv.style.display = "block";
      endianResultDiv.innerHTML = `
        <div style="font-weight: 700; font-size: 0.9rem; color: var(--primary); margin-bottom: 0.5rem;">
          Byte Order & Endianness Breakdown:
        </div>
        <table class="data-table" style="font-size: 0.8rem;">
          <tr><th>SPI Wire Order (Big-Endian)</th><td><code>${res.big_endian_wire_order}</code> (Value: ${res.big_endian_integer})</td></tr>
          <tr><th>ESP32 Memory Order (Little-Endian)</th><td><code>${res.little_endian_xtensa_order}</code> (Value: ${res.little_endian_integer})</td></tr>
          <tr><th>Curriculum Context</th><td>${res.academic_note}</td></tr>
        </table>
      `;
    } catch (err) {
      alert(`Endianness Error: ${err.message}`);
    }
  });

  // Refresh Listeners
  refreshHtBtn.addEventListener("click", loadHashTable);
  refreshHeapBtn.addEventListener("click", loadPriorityQueue);

  // Start initialization
  init();
});
