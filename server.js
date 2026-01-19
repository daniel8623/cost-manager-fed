/**
 * Simple exchange rates server for the project.
 * Requirement: fetchable JSON that includes Access-Control-Allow-Origin: *
 *
 * JSON format:
 * { "USD":1, "GBP":0.6, "EURO":0.7, "ILS":3.4 }
 * Meaning: <currency> <value> = USD 1
 */

import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));

/**
 * Keep it simple and stable for grading.
 * You can update values anytime, just keep structure.
 */
app.get("/rates", (req, res) => {
    res.json({
        USD: 1,
        GBP: 0.6,
        EURO: 0.7,
        ILS: 3.4
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Rates server running on port ${port}`);
});
