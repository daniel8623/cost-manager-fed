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

const DEFAULT_HINT = "https://your-rates-service.onrender.com/rates";

export default function SettingsDialog({ open, onClose }) {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (!open) return;
        const existing = localStorage.getItem("cm_rates_url") || "";
        setUrl(existing);
    }, [open]);

    function save() {
        // Keep it simple: store string; idb.js will read it later.
        localStorage.setItem("cm_rates_url", url.trim());
        onClose();
    }

    function clear() {
        localStorage.removeItem("cm_rates_url");
        setUrl("");
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 900 }}>Settings</DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                    Exchange rates URL (must return JSON like: {"{USD:1, GBP:0.6, EURO:0.7, ILS:3.4}"}).
                </Typography>
                <TextField
                    label="Rates URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    fullWidth
                    placeholder={DEFAULT_HINT}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={clear}>Reset</Button>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={save}>Save</Button>
            </DialogActions>
        </Dialog>
    );
}
