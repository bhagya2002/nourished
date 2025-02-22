"use client";
import { useEffect, useState } from "react";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3010";

export default function TaskHistoryPage() {
  const [completions, setCompletions] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Date filter
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [noMoreData, setNoMoreData] = useState(false);

  // Redierect if user is not logged in
  useEffect(() => {
    if (!authLoading && !user) {
        router.push("/authentication/login");
    }
  }, [authLoading, user, router]);

  const fetchHistory = async (isLoadMore = false) => {
    if (!token) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${API_BASE_URL}/getTaskHistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          startDate,
          endDate,
          lastDoc: isLoadMore ? lastDoc : null,
        }),
      });
      if (!response.ok) throw new Error("Failed to fetch task history");
      const data = await response.json();
      // Assume the API returns { completions: [...], lastDoc: ... }
      const newData = data.completions || [];
      setLastDoc(data.lastDoc || null);
      setNoMoreData(newData.length < 5);
      setCompletions(isLoadMore ? [...completions, ...newData] : newData);
    } catch (err) {
      console.error("Error fetching history:", err);
      setErrorMsg("Failed to load task history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <PageContainer title="Task History" description="View completed tasks">
      <DashboardCard title="Completed Tasks History">
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        {/* Date Range Filters */}
        <Stack direction="row" spacing={2} mb={2}>
          <TextField
            label="Start Date"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            onClick={() => {
              setLastDoc(null);
              setNoMoreData(false);
              fetchHistory(false);
            }}
          >
            Filter
          </Button>
        </Stack>

        {/* Render Completions */}
        <Box sx={{ maxHeight: 400, overflow: "auto", border: "1px solid #ccc" }}>
          {completions.map((item) => (
            <Box key={item.id} sx={{ p: 2, borderBottom: "1px solid #eee" }}>
              <Typography variant="subtitle1">
                Task ID: {item.taskId}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Completed At: {new Date(item.completedAt).toLocaleString()}
              </Typography>
            </Box>
          ))}
          {completions.length === 0 && !loading && (
            <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
              No completions found.
            </Typography>
          )}
        </Box>

        {/* Pagination Button */}
        <Stack direction="row" justifyContent="center" mt={2}>
          <Button
            variant="outlined"
            disabled={loading || noMoreData}
            onClick={() => fetchHistory(true)}
          >
            {noMoreData ? "No More Data" : loading ? "Loading..." : "Load More"}
          </Button>
        </Stack>
      </DashboardCard>
    </PageContainer>
  );
}
