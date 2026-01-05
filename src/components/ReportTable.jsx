import React from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    CircularProgress,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography
} from "@mui/material";

function MonthSelector({ month, setMonth }) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    return (
        <TextField
            label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            select
            sx={{ minWidth: 140 }}
        >
            {months.map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
        </TextField>
    );
}

export default function ReportTable({
                                        year,
                                        month,
                                        currency,
                                        setYear,
                                        setMonth,
                                        setCurrency,
                                        currencies,
                                        report,
                                        loading,
                                        error
                                    }) {
    return (
        <Card>
            <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
                    Monthly Report
                </Typography>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                    <TextField
                        label="Year"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        type="number"
                        sx={{ minWidth: 140 }}
                    />
                    <MonthSelector month={month} setMonth={setMonth} />
                    <TextField
                        label="Report Currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        select
                        sx={{ minWidth: 180 }}
                    >
                        {currencies.map((c) => (
                            <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                {loading && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <CircularProgress size={18} />
                        <Typography variant="body2">Building report...</Typography>
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {!loading && report && (
                    <>
                        <Typography sx={{ mb: 1, fontWeight: 800 }}>
                            Total ({report.total.currency}): {report.total.total}
                        </Typography>

                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 900 }}>Day</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Sum</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Currency</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Category</TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>Description</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {report.costs.map((c, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{c?.Date?.day ?? "-"}</TableCell>
                                        <TableCell>{c.sum}</TableCell>
                                        <TableCell>{c.currency}</TableCell>
                                        <TableCell>{c.category}</TableCell>
                                        <TableCell>{c.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </>
                )}

                {!loading && !error && report && report.costs.length === 0 && (
                    <Alert severity="info">No costs found for this month.</Alert>
                )}
            </CardContent>
        </Card>
    );
}
