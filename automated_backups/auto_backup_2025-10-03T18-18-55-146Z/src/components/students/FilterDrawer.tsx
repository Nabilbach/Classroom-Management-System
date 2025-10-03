import React from 'react';
import { Drawer, Button, Typography, TextField, MenuItem, Radio, FormControlLabel } from '@mui/material';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  scoreRangeFilter: string;
  setScoreRangeFilter: (v: string) => void;
  assessmentStatusFilter: string;
  setAssessmentStatusFilter: (v: string) => void;
  warningStatusFilter: string;
  setWarningStatusFilter: (v: string) => void;
  onClear: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({ open, onClose, searchTerm, setSearchTerm, scoreRangeFilter, setScoreRangeFilter, assessmentStatusFilter, setAssessmentStatusFilter, warningStatusFilter, setWarningStatusFilter, onClear }) => {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} dir="rtl">
      <div style={{ width: 320, padding: 24, background: '#fff', height: '100%' }}>
        <Typography variant="h6" gutterBottom>الفلاتر والبحث</Typography>
        <TextField type="text" label="ابحث بالاسم، رقم التلميذ، أو رقم التتبع (H...)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} fullWidth margin="normal" />
        <TextField select label="تصفية حسب المعدل" value={scoreRangeFilter} onChange={e => setScoreRangeFilter(e.target.value)} fullWidth margin="normal">
          <MenuItem value="الكل">الكل</MenuItem>
          <MenuItem value="0-4">من 0 إلى 4</MenuItem>
          <MenuItem value="4-6">من 4 إلى 6</MenuItem>
          <MenuItem value="6-8">من 6 إلى 8</MenuItem>
          <MenuItem value="8-10">من 8 إلى 10</MenuItem>
        </TextField>
        <Typography variant="body2" className="font-normal mt-4">حالة التقييم:</Typography>
        <div className="flex gap-6 mb-2">
          <FormControlLabel value="الكل" control={<Radio />} label={<Typography variant="body2">الكل</Typography>} checked={assessmentStatusFilter === 'الكل'} onChange={e => setAssessmentStatusFilter(e.target.value)} />
          <FormControlLabel value="مقيم" control={<Radio />} label={<Typography variant="body2">مقيم</Typography>} checked={assessmentStatusFilter === 'مقيم'} onChange={e => setAssessmentStatusFilter(e.target.value)} />
          <FormControlLabel value="غير مقيم" control={<Radio />} label={<Typography variant="body2">غير مقيم</Typography>} checked={assessmentStatusFilter === 'غير مقيم'} onChange={e => setAssessmentStatusFilter(e.target.value)} />
        </div>
        <Typography variant="body2" className="font-normal mt-4">حالة الإنذار:</Typography>
        <div className="flex gap-6 mb-2">
          <FormControlLabel value="الكل" control={<Radio />} label={<Typography variant="body2">الكل</Typography>} checked={warningStatusFilter === 'الكل'} onChange={e => setWarningStatusFilter(e.target.value)} />
          <FormControlLabel value="مع إنذار" control={<Radio />} label={<Typography variant="body2">مع إنذار</Typography>} checked={warningStatusFilter === 'مع إنذار'} onChange={e => setWarningStatusFilter(e.target.value)} />
          <FormControlLabel value="بدون إنذار" control={<Radio />} label={<Typography variant="body2">بدون إنذار</Typography>} checked={warningStatusFilter === 'بدون إنذار'} onChange={e => setWarningStatusFilter(e.target.value)} />
        </div>
        <Button variant="outlined" color="primary" onClick={onClear} fullWidth sx={{ mt: 2 }}>مسح الفلاتر</Button>
      </div>
    </Drawer>
  );
};

export default FilterDrawer;
