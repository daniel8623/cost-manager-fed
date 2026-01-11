/**
 * idb.js – React / ES Modules Version
 * ----------------------------------
 * Same logic as the vanilla idb.js file, adapted for React imports.
 *
 * Team notes:
 * - This module is the ONLY place that touches IndexedDB directly (SRP).
 * - UI components should treat this like a small “data API”: open DB, addCost, getReport.
 * - Currency conversion is applied at report-generation time (we keep original currencies in DB).
 */

const DEFAULT_RATES_URL = "http://localhost:3000/rates"; // Fallback required by the updated doc: app must work even if user never sets a URL.
let dbInstance = null; // We keep a single DB connection in-memory after opening once.

// Reads the URL from Settings (stored in localStorage). If not set, we use the default.
function getRatesUrl() {
    return localStorage.getItem("cm_rates_url") || DEFAULT_RATES_URL;
}

// Fetch exchange rates from server (JSON). The assignment expects CORS "*".
async function fetchRates() {
    const res = await fetch(getRatesUrl());
    if (!res.ok) throw new Error("Failed to fetch rates");
    return res.json();
}

/**
 * Currency conversion:
 * Rates are normalized to USD=1 in the assignment format, so:
 * amountInUSD = amount / rates[from]
 * amountInTarget = amountInUSD * rates[to]
 * We round to 2 decimals for UI friendliness.
 */
function convertAmount(amount, from, to, rates) {
    return Math.round((amount / rates[from]) * rates[to] * 100) / 100;
}

function openCostsDB(name, version) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;

            // Create object store once (first run / version bump).
            if (!db.objectStoreNames.contains("costs")) {
                const store = db.createObjectStore("costs", { keyPath: "id", autoIncrement: true });

                // Composite index to efficiently query by (year, month) for monthly reports.
                // This is faster than scanning the whole store each time.
                store.createIndex("yearMonth", ["year", "month"]);
            }
        };

        request.onsuccess = (e) => {
            dbInstance = e.target.result;

            // Expose only the required API to the React app.
            // (Vanilla tester uses the global version; this one is for imports.)
            resolve({ addCost, getReport });
        };

        request.onerror = () => reject(request.error);
    });
}

function addCost(cost) {
    const now = new Date();

    // We save the ORIGINAL currency as entered (requirement: keep original currencies in IndexedDB).
    // We also store year/month/day to support indexing + reporting.
    const item = {
        ...cost,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),

        // Kept to match the assignment’s example structure (Date:{day:...}).
        Date: { day: now.getDate() }
    };

    return new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(["costs"], "readwrite");
        const req = tx.objectStore("costs").add(item);

        // Note: resolving on req.onsuccess is enough for this assignment’s workflow.
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
    });
}

function getReport(year, month, currency) {
    return new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(["costs"], "readonly");
        const idx = tx.objectStore("costs").index("yearMonth");

        // Query only items in the requested (year, month).
        const req = idx.getAll(IDBKeyRange.only([year, month]));

        req.onsuccess = async () => {
            // We fetch rates when building the report so display currency can change dynamically.
            const rates = await fetchRates();

            // Compute total in the selected currency, without changing what is stored in IndexedDB.
            let total = 0;
            req.result.forEach(c => {
                total += convertAmount(c.sum, c.currency, currency, rates);
            });

            resolve({
                year,
                month,
                costs: req.result, // Costs remain in original currencies (stored currency stays untouched).
                total: { currency, total: Math.round(total * 100) / 100 }
            });
        };

        req.onerror = () => reject(req.error);
    });
}

// Exported API used by App.jsx (idb.openCostsDB(...))
export const idb = { openCostsDB };
