'use client';
import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  useTheme,
  alpha,
  Collapse,
  Tooltip,
} from '@mui/material';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';

interface TaskHistoryFiltersProps {
  startDate: string;
  endDate: string;
  onFilterApply: (startDate: string, endDate: string) => void;
  onFilterClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const TaskHistoryFilters: React.FC<TaskHistoryFiltersProps> = ({
  startDate,
  endDate,
  onFilterApply,
  onFilterClear,
  isOpen,
  onToggle,
}) => {
  const theme = useTheme();
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  
  // Quick filter presets
  const applyLast7Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    const formattedStart = start.toISOString().split('T')[0];
    const formattedEnd = end.toISOString().split('T')[0];
    
    setLocalStartDate(formattedStart);
    setLocalEndDate(formattedEnd);
  };
  
  const applyLast30Days = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    const formattedStart = start.toISOString().split('T')[0];
    const formattedEnd = end.toISOString().split('T')[0];
    
    setLocalStartDate(formattedStart);
    setLocalEndDate(formattedEnd);
  };
  
  const applyCurrentMonth = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date();
    
    const formattedStart = start.toISOString().split('T')[0];
    const formattedEnd = end.toISOString().split('T')[0];
    
    setLocalStartDate(formattedStart);
    setLocalEndDate(formattedEnd);
  };
  
  // Handle filter apply
  const handleApplyFilter = () => {
    onFilterApply(localStartDate, localEndDate);
  };
  
  // Handle filter clear
  const handleClearFilter = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    onFilterClear();
  };
  
  const hasActiveFilters = startDate !== '' || endDate !== '';
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={onToggle}
          size="small"
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 500,
            transition: 'all 0.2s',
            borderColor: isOpen ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.2),
            color: isOpen ? theme.palette.primary.main : theme.palette.text.primary,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          {isOpen ? 'Hide Filters' : 'Show Filters'}
        </Button>
        
        {hasActiveFilters && (
          <Tooltip title="Clear all filters">
            <Button
              variant="text"
              color="error"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearFilter}
              sx={{
                textTransform: 'none',
                fontSize: '0.875rem',
              }}
            >
              Clear Filters
            </Button>
          </Tooltip>
        )}
      </Box>
      
      <Collapse in={isOpen}>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              mb: 2,
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Filter Task History
            </Typography>
            
            {/* Quick filter buttons */}
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                flexWrap: 'wrap',
              }}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<TodayIcon />}
                onClick={applyLast7Days}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderColor: alpha(theme.palette.text.primary, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                Last 7 Days
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<DateRangeIcon />}
                onClick={applyLast30Days}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderColor: alpha(theme.palette.text.primary, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                Last 30 Days
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<EventIcon />}
                onClick={applyCurrentMonth}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 500,
                  borderColor: alpha(theme.palette.text.primary, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                This Month
              </Button>
            </Box>
            
            {/* Date inputs */}
            <Box 
              sx={{ 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 2, sm: 3 },
                mb: 3,
              }}
            >
              <TextField
                label="Start Date"
                type="date"
                fullWidth
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  sx: {
                    borderRadius: '10px',
                  },
                }}
              />
              
              <TextField
                label="End Date"
                type="date"
                fullWidth
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  sx: {
                    borderRadius: '10px',
                  },
                }}
              />
            </Box>
            
            {/* Apply button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleApplyFilter}
                startIcon={<SearchIcon />}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  boxShadow: theme.shadows[3],
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                Apply Filters
              </Button>
            </Box>
          </Paper>
        </motion.div>
      </Collapse>
    </Box>
  );
};

export default TaskHistoryFilters; 