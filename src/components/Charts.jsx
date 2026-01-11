/**
 * Charts.jsx
 * ----------
 * Displays pie and bar charts based on report data.
 * Pie chart values are converted to the selected currency.
 *
 * Notes (team):
 * - This component is mostly “data shaping” for charts + UI controls.
 * - We keep the DB logic behind dbApi.getReport(...) (SRP).
 * - We fetch exchange rates here because the pie chart needs per-item conversion
 *   by category (items can be stored in mixed original currencies).
 */
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    MenuItem,
    TextField,
    Typography
} from "@mui/material";
import {
    BarChart,
    Bar,
    CartesianGrid,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Cell
} from "recharts";

// Fixed colors per category
// (We picked a consistent mapping so categories keep the same color across sessions.)
const CATEGORY_COLORS = {
    Food: "#4CAF50",
    Car: "#FF9800",
    Education: "#3F51B5",
    Bills: "#F44336",
    Shopping: "#9C27B0",
    Health: "#009688",
    Other: "#607D8B"
};

const DEFAULT_RATES_URL = "http://localhost:3000/rates";

// Reads the user-specified URL (Settings), otherwise falls back to a default.
// This matches the requirement that the app should still work even if the user never sets a URL.
function getRatesUrl() {
    return localStorage.getItem("cm_rates_url") || DEFAULT_RATES_URL;
}

// Convert amount using USD as base (assignment format uses USD=1).
// amountInUSD = amount / rates[from]
// amountInTarget = amountInUSD * rates[to]
function convertAmount(amount, from, to, rates) {
    const usd = amount / rates[from];
    return Math.round(usd * rates[to] * 100) / 100;
}

function monthsList() {
    return Array.from({ length: 12 }, (_, i) => i + 1);
}

export default function Charts({
                                   dbApi,
                                   year,
                                   month,
                                   currency,
                                   setYear,
                                   setMonth,
                                   setCurrency,
                                   currencies
                               }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [monthReport, setMonthReport] = useState(null);
    const [yearTotals, setYearTotals] = useState([]);
    const [rates, setRates] = useState(null);

    // Fetch exchange rates. We re-fetch when currency changes (simple + safe),
    // even though rates usually don't depend on target currency.
    useEffect(() => {
        fetch(getRatesUrl())
            .then(res => res.json())
            .then(setRates)
            .catch(() => setError("Failed to fetch exchange rates"));
    }, [currency]);

    // Build pie chart data with conversion.
    // We use useMemo so we don't recompute on every render unless inputs change.
    const pieData = useMemo(() => {
        if (!monthReport || !rates) return [];

        // Aggregate sums by category (after converting each item to the selected currency).
        // Important: items are stored with original currencies in IndexedDB.
        const map = new Map();

        monthReport.costs.forEach(c => {
            const category = c.category || "Other";
            const converted = convertAmount(c.sum, c.currency, currency, rates);
            map.set(category, (map.get(category) || 0) + converted);
        });

        // Round only at the end to reduce accumulated rounding noise.
        return Array.from(map.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100
        }));
    }, [monthReport, rates, currency]);

    useEffect(() => {
        // Guard: don't run until DB API is ready AND we have rates for conversion.
        if (!dbApi || !rates) return;

        (async () => {
            setLoading(true);
            setError("");

            try {
                // Monthly report (we also store it to reuse its costs list for pie aggregation).
                const monthly = await dbApi.getReport(year, month, currency);
                setMonthReport(monthly);

                // Yearly totals by month.
                // Note: getReport already returns a total in selected currency, so we can reuse that.
                const totals = [];

                // We query per month to keep logic simple + aligned with the assignment's report API.
                for (const m of monthsList()) {
                    const rep = await dbApi.getReport(year, m, currency);
                    totals.push({ month: m, total: rep.total.total });
                }

                setYearTotals(totals);
            } catch (e) {
                setError(e?.message || "Failed to build charts");
            } finally {
                setLoading(false);
            }
        })();
    }, [dbApi, year, month, currency, rates]);

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                    Charts
                </Typography>

                {/* Shared selectors with Report tab (year/month/currency are controlled in App.jsx) */}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                    <TextField
                        label="Year"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                    />

                    <TextField
                        label="Month"
                        select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                    >
                        {monthsList().map(m => (
                            <MenuItem key={m} value={m}>{m}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Currency"
                        select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                    >
                        {currencies.map(c => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                {/* Basic loading/error UI (kept simple for the assignment) */}
                {loading && <CircularProgress />}
                {error && <Alert severity="error">{error}</Alert>}

                {!loading && !error && (
                    <>
                        <Typography sx={{ fontWeight: 900, mb: 1 }}>
                            Monthly distribution by category ({currency})
                        </Typography>

                        <Box sx={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip />
                                    <Legend />

                                    {/* Pie slices are colored per category for quick readability */}
                                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110}>
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.Other}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>

                        <Divider sx={{ my: 3 }} />

                        <Typography sx={{ fontWeight: 900, mb: 1 }}>
                            Yearly totals by month ({currency})
                        </Typography>

                        <Box sx={{ height: 320 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearTotals}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />

                                    {/* Single bar series = total cost in selected currency */}
                                    <Bar dataKey="total" fill="#3F51B5" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
