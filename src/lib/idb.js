/**
 * idb.js – React / ES Modules Version
 * ----------------------------------
 * Same logic as the vanilla idb.js file, adapted for React imports.
 * This module is responsible only for database access and data retrieval.
 */

const DEFAULT_RATES_URL = "http://localhost:3000/rates";
let dbInstance = null;

function getRatesUrl() {
    return localStorage.getItem("cm_rates_url") || DEFAULT_RATES_URL;
}

async function fetchRates() {
    const res = await fetch(getRatesUrl());
    if (!res.ok) throw new Error("Failed to fetch rates");
    return res.json();
}

function convertAmount(amount, from, to, rates) {
    return Math.round((amount / rates[from]) * rates[to] * 100) / 100;
}

function openCostsDB(name, version) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(name, version);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("costs")) {
                const store = db.createObjectStore("costs", { keyPath: "id", autoIncrement: true });
                store.createIndex("yearMonth", ["year", "month"]);
            }
        };

        request.onsuccess = (e) => {
            dbInstance = e.target.result;
            resolve({ addCost, getReport });
        };

        request.onerror = () => reject(request.error);
    });
}

function addCost(cost) {
    const now = new Date();
    const item = {
        ...cost,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        Date: { day: now.getDate() }
    };

    return new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(["costs"], "readwrite");
        const req = tx.objectStore("costs").add(item);
        req.onsuccess = () => resolve(item);
        req.onerror = () => reject(req.error);
    });
}

function getReport(year, month, currency) {
    return new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(["costs"], "readonly");
        const idx = tx.objectStore("costs").index("yearMonth");
        const req = idx.getAll(IDBKeyRange.only([year, month]));

        req.onsuccess = async () => {
            const rates = await fetchRates();
            let total = 0;

            req.result.forEach(c => {
                total += convertAmount(c.sum, c.currency, currency, rates);
            });

            resolve({
                year,
                month,
                costs: req.result,
                total: { currency, total: Math.round(total * 100) / 100 }
            });
        };

        req.onerror = () => reject(req.error);
    });
}

export const idb = { openCostsDB };
