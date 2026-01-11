/**
 * Cost Manager Front-End
 * React + MUI, IndexedDB storage via src/lib/idb.js (Promise wrapper)
 *
 * Features:
 * - Add cost item (sum, currency, category, description), date is "now"
 * - Monthly report (year+month, currency selection)
 * - Pie chart by categories for selected month
 * - Bar chart totals per month for selected year
 * - Settings: exchange rates URL (stored in localStorage)
 *
 * Notes (team):
 * - This file is the “app shell”: tabs, shared state (year/month/currency), and DB bootstrap.
 * - Data persistence is NOT here (SRP). We only call the idb wrapper API.
 */
import React, { useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import {
    AppBar,
    Box,
    Container,
    CssBaseline,
    IconButton,
    Tab,
    Tabs,
    Toolbar,
    Typography
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { theme } from "./theme";

import AddCostForm from "./components/AddCostForm";
import ReportTable from "./components/ReportTable";
import Charts from "./components/Charts";
import SettingsDialog from "./components/SettingsDialog";
import { idb } from "./lib/idb";

// IndexedDB config (must match the vanilla tester params as well)
const DB_NAME = "costsdb";
const DB_VERSION = 1;

// Requirement: supported currency symbols are exactly these 4
const CURRENCIES = ["USD", "ILS", "GBP", "EURO"];

export default function App() {
    // UI navigation: simple tab state for 3 main screens
    const [tab, setTab] = useState(0);

    // Settings dialog state (rates URL is managed inside SettingsDialog via localStorage)
    const [settingsOpen, setSettingsOpen] = useState(false);

    // DB API handle returned from idb.openCostsDB(). We keep it in state so children can use it.
    const [dbApi, setDbApi] = useState(null);

    // We freeze "now" once so initial month/year don't change on re-renders
    const now = useMemo(() => new Date(), []);

    // Shared “filters” for report + charts. Keeping them here avoids duplicated state in tabs.
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [currency, setCurrency] = useState("USD");

    // Report state
    const [report, setReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportError, setReportError] = useState("");

    useEffect(() => {
        // Open DB once at startup.
        // We wrap this in an IIFE because useEffect can't be async directly.
        (async () => {
            const api = await idb.openCostsDB(DB_NAME, DB_VERSION);
            setDbApi(api);
        })();
    }, []);

    async function refreshReport() {
        // Guard: db might still be opening on first render
        if (!dbApi) return;

        setLoadingReport(true);
        setReportError("");

        try {
            // Report is generated from IndexedDB and converted to selected currency inside idb layer
            const r = await dbApi.getReport(year, month, currency);
            setReport(r);
        } catch (e) {
            // Keep error UI-friendly; don't crash the whole app
            setReport(null);
            setReportError(e?.message || "Failed to build report.");
        } finally {
            setLoadingReport(false);
        }
    }

    // Auto-refresh when selection changes.
    // This keeps the Report tab always consistent with the selected year/month/currency,
    // and also helps Charts tab since it shares the same inputs.
    useEffect(() => {
        if (dbApi) refreshReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dbApi, year, month, currency]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            {/* Top bar + navigation */}
            <AppBar position="sticky" elevation={1}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
                        Cost Manager
                    </Typography>

                    {/* Requirement (6): settings option for rates URL */}
                    <IconButton
                        color="inherit"
                        onClick={() => setSettingsOpen(true)}
                        aria-label="settings"
                    >
                        <SettingsIcon />
                    </IconButton>
                </Toolbar>

                {/* Tabs keep the app as a single-page flow (no routing needed for this assignment) */}
                <Tabs
                    value={tab}
                    onChange={(e, v) => setTab(v)}
                    textColor="inherit"
                    indicatorColor="secondary"
                    variant="fullWidth"
                >
                    <Tab label="Add Cost" />
                    <Tab label="Report" />
                    <Tab label="Charts" />
                </Tabs>
            </AppBar>

            <Container maxWidth="md" sx={{ py: 3 }}>
                {tab === 0 && (
                    <AddCostForm
                        dbApi={dbApi}
                        // After inserting a new cost, refresh report so totals update immediately
                        onAdded={() => refreshReport()}
                        currencies={CURRENCIES}
                    />
                )}

                {tab === 1 && (
                    <ReportTable
                        year={year}
                        month={month}
                        currency={currency}
                        setYear={setYear}
                        setMonth={setMonth}
                        setCurrency={setCurrency}
                        currencies={CURRENCIES}
                        report={report}
                        loading={loadingReport}
                        error={reportError}
                    />
                )}

                {tab === 2 && (
                    <Charts
                        dbApi={dbApi}
                        year={year}
                        month={month}
                        currency={currency}
                        setYear={setYear}
                        setMonth={setMonth}
                        setCurrency={setCurrency}
                        currencies={CURRENCIES}
                    />
                )}
            </Container>

            {/* Dialog is mounted once and controlled by state (simple + predictable UX) */}
            <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

            <Box sx={{ height: 12 }} />
        </ThemeProvider>
    );
}
