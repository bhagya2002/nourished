"use client";
import React, { useState } from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  TextField, 
  MenuItem,
  Stack,
  Alert 
} from "@mui/material";

interface TaskEditProps {
    open: boolean;
    onClose: () => void;
    onSave: (updateData: {
        title: string;
        description: string;
        frequency: string;
    }) => Promise<void>;

    initialTitle: string;
    initialDescription: string;
    initialFrequency: string;
    userTask: any[];
}