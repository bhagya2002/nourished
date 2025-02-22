"use client";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import {
  Alert,
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { last } from "lodash";

export default function TaskHistoryPage() {
  const [user] = useAuthState(auth);
  const [completions, setCompletions] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Date filter
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Pagination
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [noMoreData, setNoMoreData] = useState(false);

  const fetchHistory = async (isLoadMore = false) => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);

    try {
        const completionsRef = collection(db, "taskCompletions");
        let q = query(
            completionsRef,
            where("uid", "==", user.uid),
            orderBy("completedAt", "desc"),
            limit(5)
        );

        if (startDate) {
            const start = new Date(`${startDate}T00:00:00`);
            q = query(q, where("completedAt", ">=", start));
        }
        if (endDate) {
            const end = new Date(`${endDate}T23:59:59`);
            q = query(q, where("completedAt", "<=", end));
        }

        // Pagination
        if (isLoadMore && lastDoc) {
            q = query(q, startAfter(lastDoc));
        }

        const snap = await getDocs(q);
        if (snap.empty && isLoadMore) {
            setNoMoreData(true);
        }

        const newData: any[] = [];
        snap.forEach((docSnap) => {
            newData.push({ id: docSnap.id, ...docSnap.data() });
        });

        const lastVisible = snap.docs[snap.docs.length - 1];
        setLastDoc(lastVisible || null);

        setCompletions(isLoadMore ? [...completions, ...newData] : newData);
    } catch (err) {
        console.error("Error fetching history:", err);
        setErrorMsg("Failed to load task history.");
    } finally {
        setLoading(false)
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

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
          <Button variant="contained" onClick={() => {
            setLastDoc(null);
            setNoMoreData(false);
            fetchHistory(false);
          }}>
            Filter
          </Button>
        </Stack>

        {/* Render Completions */}
        <Box sx={{ maxHeight: 400, overflow: "auto", border: "1px solid #ccc" }}>
          {completions.map((item) => (
            <Box
              key={item.id}
              sx={{ p: 2, borderBottom: "1px solid #eee" }}
            >
              <Typography variant="subtitle1">
                Task ID: {item.taskId}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Completed At: {new Date(item.completedAt?.seconds * 1000).toLocaleString()}
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
