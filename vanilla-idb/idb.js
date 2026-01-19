/**
 * idb.js – Vanilla JavaScript Version (No Modules)
 * -----------------------------------------------
 * Cost Manager – Front-End Development Final Project
 *
 * This file implements a Promise-based wrapper around IndexedDB.
 * It exposes a global `idb` object, as required for automatic testing.
 *
 * Responsibilities:
 * - Open and initialize the IndexedDB database
 * - Add new cost items
 * - Generate monthly reports in a selected currency
 *
 * Exchange rates are fetched using the Fetch API from a configurable URL.
 * The URL is stored in localStorage and can be changed via the UI.
 *
 */

(function () {
    "use strict";

    var DB_STATE = {
        db: null
    };

    var DEFAULT_RATES_URL = "/rates";

    function getRatesUrl() {
        try {
            return localStorage.getItem("cm_rates_url") || DEFAULT_RATES_URL;
        } catch {
            return DEFAULT_RATES_URL;
        }
    }

    // Fetch exchange rates from server (USD base)
    function fetchRates() {
        return fetch(getRatesUrl()).then(function (res) {
            if (!res.ok) {
                throw new Error("Failed to fetch exchange rates");
            }
            return res.json();
        });
    }

    // Convert amount between currencies using USD as base
    function convertAmount(amount, from, to, rates) {
        var usd = amount / rates[from];
        return Math.round(usd * rates[to] * 100) / 100;
    }

    /**
     * Opens (or creates) the IndexedDB database.
     * Must be called before any other operation.
     */
    function openCostsDB(databaseName, databaseVersion) {
        return new Promise(function (resolve, reject) {
            var request = indexedDB.open(databaseName, databaseVersion);

            request.onupgradeneeded = function (event) {
                var db = event.target.result;

                if (!db.objectStoreNames.contains("costs")) {
                    var store = db.createObjectStore("costs", {
                        keyPath: "id",
                        autoIncrement: true
                    });
                    store.createIndex("yearMonth", ["year", "month"], { unique: false });
                }
            };

            request.onsuccess = function (event) {
                DB_STATE.db = event.target.result;
                resolve({
                    addCost: addCost,
                    getReport: getReport
                });
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    /**
     * Adds a new cost item to the database.
     * The date is automatically set to the current date.
     */
    function addCost(cost) {
        return new Promise(function (resolve, reject) {
            var now = new Date();
            var item = {
                sum: cost.sum,
                currency: cost.currency,
                category: cost.category,
                description: cost.description,
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                Date: { day: now.getDate() }
            };

            var tx = DB_STATE.db.transaction(["costs"], "readwrite");
            var store = tx.objectStore("costs");
            var req = store.add(item);

            req.onsuccess = function () {
                resolve({
                    sum: item.sum,
                    currency: item.currency,
                    category: item.category,
                    description: item.description,
                    Date: { day: item.day }
                });
            };

            req.onerror = function () {
                reject(req.error);
            };
        });
    }

    /**
     * Generates a detailed report for a specific month and year.
     * The total sum is calculated in the requested currency.
     */
    function getReport(year, month, currency) {
        return new Promise(function (resolve, reject) {
            var tx = DB_STATE.db.transaction(["costs"], "readonly");
            var store = tx.objectStore("costs");
            var index = store.index("yearMonth");
            var req = index.getAll(IDBKeyRange.only([year, month]));

            req.onsuccess = function () {
                fetchRates().then(function (rates) {
                    var total = 0;

                    req.result.forEach(function (c) {
                        total += convertAmount(c.sum, c.currency, currency, rates);
                    });

                    resolve({
                        year: year,
                        month: month,
                        costs: req.result.map(function (c) {
                            return {
                                sum: c.sum,
                                currency: c.currency,
                                category: c.category,
                                description: c.description,
                                Date: { day: c.day }
                            };
                        }),
                        total: { currency: currency, total: Math.round(total * 100) / 100 }
                    });
                }).catch(reject);
            };

            req.onerror = function () {
                reject(req.error);
            };
        });
    }

    // Expose global API (required for automatic testing)
    window.idb = { openCostsDB: openCostsDB };
})();
