/**
 * SettingsDialog.jsx
 * ------------------
 * Simple dialog for configuring the exchange rates server URL.
 *
 * Notes (team):
 * - This component handles ONLY UI + localStorage interaction.
 * - The actual usage of the URL happens inside idb.js (SRP).
 * - If the user clears the URL, idb.js falls back to its default URL.
 */

import React, { useEffect, useState } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography
} from "@mui/material";

// Just a visual hint for the user; not enforced programmatically.
const DEFAULT_HINT = "https://your-rates-service.onrender.com/rates";

export default function SettingsDialog({ open, onClose }) {
    // Local state mirrors what is currently stored in localStorage.
    const [url, setUrl] = useState("");

    useEffect(() => {
        // When dialog opens, sync state with localStorage.
        // We do this on open so the value is always up-to-date.
        if (!open) return;

        const existing = localStorage.getItem("cm_rates_url") || "";
        setUrl(existing);
    }, [open]);

    function save() {
        // Requirement (6): store the rates URL so it can be used by idb.js.
        // We keep it as a plain string; validation is intentionally minimal.
        localStorage.setItem("cm_rates_url", url.trim());
        onClose();
    }

    function clear() {
        // Reset to default behavior:
        // removing the key makes idb.js fall back to its DEFAULT_RATES_URL.
        localStorage.removeItem("cm_rates_url");
        setUrl("");
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 900 }}>
                Settings
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                    {/* We explicitly describe the expected JSON structure
              to match the assignment specification. */}
                    Exchange rates URL (must return JSON like:
                    {"{USD:1, GBP:0.6, EURO:0.7, ILS:3.4}"}).
                </Typography>

                <TextField
                    label="Rates URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    fullWidth
                    // Placeholder is only a hint; actual default handling is in idb.js
                    placeholder={DEFAULT_HINT}
                />
            </DialogContent>

            <DialogActions>
                {/* Reset removes user-defined URL and restores default fallback */}
                <Button onClick={clear}>Reset</Button>

                {/* Cancel does not change localStorage */}
                <Button onClick={onClose}>Cancel</Button>

                {/* Save persists the URL and closes the dialog */}
                <Button variant="contained" onClick={save}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
