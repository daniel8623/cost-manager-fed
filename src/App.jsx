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

const DB_NAME = "costsdb";
const DB_VERSION = 1;

const CURRENCIES = ["USD", "ILS", "GBP", "EURO"];

export default function App() {
    const [tab, setTab] = useState(0);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const [dbApi, setDbApi] = useState(null);

    const now = useMemo(() => new Date(), []);
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [currency, setCurrency] = useState("USD");

    // Report state
    const [report, setReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportError, setReportError] = useState("");

    useEffect(() => {
        // Open DB once at startup
        (async () => {
            const api = await idb.openCostsDB(DB_NAME, DB_VERSION);
            setDbApi(api);
        })();
    }, []);

    async function refreshReport() {
        if (!dbApi) return;
        setLoadingReport(true);
        setReportError("");
        try {
            const r = await dbApi.getReport(year, month, currency);
            setReport(r);
        } catch (e) {
            setReport(null);
            setReportError(e?.message || "Failed to build report.");
        } finally {
            setLoadingReport(false);
        }
    }

    // Auto-refresh when selection changes
    useEffect(() => {
        if (dbApi) refreshReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dbApi, year, month, currency]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />

            <AppBar position="sticky" elevation={1}>
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
                        Cost Manager
                    </Typography>

                    <IconButton color="inherit" onClick={() => setSettingsOpen(true)} aria-label="settings">
                        <SettingsIcon />
                    </IconButton>
                </Toolbar>

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

            <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
            <Box sx={{ height: 12 }} />
        </ThemeProvider>
    );
}
