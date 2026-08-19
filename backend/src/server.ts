import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { employeesRouter } from "./routes/employees";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 8000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" }, message: "OK" }));

app.use(authRouter);
app.use(employeesRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`VeriPay backend listening on http://localhost:${PORT}`);
});
