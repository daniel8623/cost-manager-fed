/**
 * AddCostForm.jsx
 * ---------------
 * Form for inserting new cost items into IndexedDB.
 *
 * Notes (team):
 * - This component handles ONLY user input + validation.
 * - Actual persistence is delegated to dbApi.addCost(...) (SRP).
 * - The date is not entered by the user; it is generated inside idb.js as required.
 */

import React, { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    MenuItem,
    TextField,
    Typography
} from "@mui/material";

// Fixed categories list for consistency in reports and charts
const CATEGORIES = ["Food", "Car", "Education", "Bills", "Shopping", "Health", "Other"];

export default function AddCostForm({ dbApi, onAdded, currencies }) {
    // Controlled form state
    const [sum, setSum] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [category, setCategory] = useState("Food");
    const [description, setDescription] = useState("");

    // Status message shown to the user after submit attempts
    const [status, setStatus] = useState({ type: "", msg: "" });

    // Disable the form until IndexedDB connection is ready
    const disabled = useMemo(() => !dbApi, [dbApi]);

    async function submit() {
        // Reset status before validation
        setStatus({ type: "", msg: "" });

        const n = Number(sum);

        // Basic client-side validation (kept intentionally simple)
        if (!Number.isFinite(n) || n <= 0) {
            setStatus({ type: "error", msg: "Sum must be a positive number." });
            return;
        }

        if (!description.trim()) {
            setStatus({ type: "error", msg: "Description is required." });
            return;
        }

        try {
            // Requirement: store original currency together with sum/category/description
            await dbApi.addCost({
                sum: n,
                currency,
                category,
                description: description.trim()
            });

            // Reset form after successful insert
            setSum("");
            setDescription("");

            setStatus({ type: "success", msg: "Cost item added successfully." });

            // Notify parent (App.jsx) so reports/charts can refresh
            onAdded?.();
        } catch (e) {
            // Errors here usually mean IndexedDB transaction failure
            setStatus({ type: "error", msg: e?.message || "Failed to add cost item." });
        }
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                    Add New Cost
                </Typography>

                {/* DB is opened asynchronously; show info state until ready */}
                {disabled && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Opening database...
                    </Alert>
                )}

                {/* Success / error feedback after submit */}
                {status.msg && (
                    <Alert severity={status.type} sx={{ mb: 2 }}>
                        {status.msg}
                    </Alert>
                )}

                {/* Main input grid */}
                <Box
                    sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }
                    }}
                >
                    <TextField
                        label="Sum"
                        value={sum}
                        onChange={(e) => setSum(e.target.value)}
                        type="number"
                        inputProps={{ step: "0.01" }}
                        disabled={disabled}
                    />

                    <TextField
                        label="Currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        select
                        disabled={disabled}
                    >
                        {currencies.map((c) => (
                            <MenuItem key={c} value={c}>
                                {c}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        select
                        disabled={disabled}
                    >
                        {CATEGORIES.map((c) => (
                            <MenuItem key={c} value={c}>
                                {c}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={disabled}
                    />
                </Box>

                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                    <Button variant="contained" onClick={submit} disabled={disabled}>
                        Add
                    </Button>
                </Box>

                {/* Explicitly stating the requirement about automatic date assignment */}
                <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
                    Note: date is automatically set to “today” as required.
                </Typography>
            </CardContent>
        </Card>
    );
}
