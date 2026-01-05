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

const CATEGORIES = ["Food", "Car", "Education", "Bills", "Shopping", "Health", "Other"];

export default function AddCostForm({ dbApi, onAdded, currencies }) {
    const [sum, setSum] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [category, setCategory] = useState("Food");
    const [description, setDescription] = useState("");

    const [status, setStatus] = useState({ type: "", msg: "" });

    const disabled = useMemo(() => !dbApi, [dbApi]);

    async function submit() {
        setStatus({ type: "", msg: "" });

        const n = Number(sum);
        if (!Number.isFinite(n) || n <= 0) {
            setStatus({ type: "error", msg: "Sum must be a positive number." });
            return;
        }
        if (!description.trim()) {
            setStatus({ type: "error", msg: "Description is required." });
            return;
        }

        try {
            await dbApi.addCost({
                sum: n,
                currency,
                category,
                description: description.trim()
            });

            setSum("");
            setDescription("");
            setStatus({ type: "success", msg: "Cost item added successfully." });
            onAdded?.();
        } catch (e) {
            setStatus({ type: "error", msg: e?.message || "Failed to add cost item." });
        }
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                    Add New Cost
                </Typography>

                {disabled && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Opening database...
                    </Alert>
                )}

                {status.msg && (
                    <Alert severity={status.type} sx={{ mb: 2 }}>
                        {status.msg}
                    </Alert>
                )}

                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
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
                            <MenuItem key={c} value={c}>{c}</MenuItem>
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
                            <MenuItem key={c} value={c}>{c}</MenuItem>
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

                <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
                    Note: date is automatically set to “today” as required.
                </Typography>
            </CardContent>
        </Card>
    );
}
