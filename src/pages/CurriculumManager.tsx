import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Divider,
  Paper,
  Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, ExpandMore, ExpandLess, UploadFile as UploadFileIcon, Help as HelpIcon } from '@mui/icons-material';
import { curriculumService, Curriculum, CurriculumItem } from '../services/api/curriculumService';
import * as XLSX from 'xlsx';

const CurriculumManager: React.FC = () => {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [curriculumToDelete, setCurriculumToDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // New Curriculum Form State
  const [newCurriculum, setNewCurriculum] = useState<Partial<Curriculum>>({
    title: '',
    subject: '',
    educationalLevel: '',
    description: ''
  });

  // New Item Form State
  const [newItem, setNewItem] = useState<Partial<CurriculumItem>>({
    title: '',
    unitTitle: '',
    estimatedSessions: 1,
    order: 1
  });

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setCurriculumToDelete(id);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (curriculumToDelete) {
      try {
        await curriculumService.deleteCurriculum(curriculumToDelete);
        setCurriculums(curriculums.filter(c => c.id !== curriculumToDelete));
        if (selectedCurriculum?.id === curriculumToDelete) {
          setSelectedCurriculum(null);
        }
        setOpenDeleteDialog(false);
        setCurriculumToDelete(null);
      } catch (error) {
        console.error('Failed to delete curriculum', error);
        alert('فشل حذف المنهاج');
      }
    }
  };

  useEffect(() => {
    loadCurriculums();
  }, []);

  const loadCurriculums = async () => {
    try {
      const data = await curriculumService.getAll();
      setCurriculums(data);
    } catch (error) {
      console.error('Failed to load curriculums', error);
    }
  };

  const handleCreateCurriculum = async () => {
    if (!newCurriculum.title || !newCurriculum.subject) return;
    try {
      await curriculumService.create(newCurriculum as Curriculum);
      setOpenNewDialog(false);
      loadCurriculums();
      setNewCurriculum({ title: '', subject: '', educationalLevel: '', description: '' });
    } catch (error) {
      console.error('Failed to create curriculum', error);
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const data = await curriculumService.getById(id);
      setSelectedCurriculum(data);
    } catch (error) {
      console.error('Failed to load details', error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedCurriculum?.id || !newItem.title) return;
    try {
      await curriculumService.addItem(selectedCurriculum.id, newItem as CurriculumItem);
      setOpenItemDialog(false);
      handleViewDetails(selectedCurriculum.id); // Reload details
      setNewItem({ title: '', unitTitle: '', estimatedSessions: 1, order: (selectedCurriculum.items?.length || 0) + 1 });
    } catch (error) {
      console.error('Failed to add item', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCurriculum?.id) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to CurriculumItem
        // Expected columns: Title, Unit, Sessions, Order
        const itemsToAdd: Omit<CurriculumItem, 'curriculumId'>[] = jsonData.map((row: any, index) => ({
          title: row['Title'] || row['العنوان'] || row['الدرس'] || row['عنوان الدرس'] || `Lesson ${index + 1}`,
          unitTitle: row['Unit'] || row['الوحدة'] || row['اسم المقرر'] || '',
          estimatedSessions: parseInt(row['Sessions'] || row['الحصص'] || row['عدد الحصص'] || row['عدد الحصص المقدر'] || '1'),
          order: parseInt(row['Order'] || row['الترتيب'] || row['رقم الأسبوع'] || (index + 1).toString())
        }));

        if (itemsToAdd.length > 0) {
          await curriculumService.addItemsBulk(selectedCurriculum.id!, itemsToAdd);
          handleViewDetails(selectedCurriculum.id!);
          alert(`تم استيراد ${itemsToAdd.length} عنصر بنجاح!`);
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('حدث خطأ أثناء قراءة الملف. تأكد من التنسيق.');
      }
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">إدارة المناهج الدراسية</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenNewDialog(true)}
        >
          منهاج جديد
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* List of Curriculums */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" sx={{ mb: 2 }}>المناهج المتوفرة</Typography>
          {curriculums.map((curr) => (
            <Card 
              key={curr.id} 
              sx={{ 
                mb: 2, 
                cursor: 'pointer',
                border: selectedCurriculum?.id === curr.id ? '2px solid #1976d2' : 'none'
              }}
              onClick={() => curr.id && handleViewDetails(curr.id)}
            >
              <CardContent sx={{ position: 'relative' }}>
                <IconButton 
                  size="small" 
                  color="error" 
                  sx={{ position: 'absolute', top: 5, right: 5 }}
                  onClick={(e) => curr.id && handleDeleteClick(e, curr.id)}
                >
                  <DeleteIcon />
                </IconButton>
                <Typography variant="h6" sx={{ pr: 4 }}>{curr.title}</Typography>
                <Typography color="textSecondary">{curr.subject} - {curr.educationalLevel}</Typography>
                <Chip label={`${curr.items?.length || 0} عناصر`} size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* Selected Curriculum Details */}
        <Grid item xs={12} md={8}>
          {selectedCurriculum ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h5">{selectedCurriculum.title}</Typography>
                  <Typography color="textSecondary">{selectedCurriculum.description}</Typography>
                </Box>
                <Box>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    id="excel-upload-input"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    aria-label="Upload Excel File"
                  />
                  <IconButton onClick={() => setOpenHelpDialog(true)} sx={{ mr: 1 }} color="primary">
                    <HelpIcon />
                  </IconButton>
                  <Button 
                    variant="outlined" 
                    startIcon={<UploadFileIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ mr: 1 }}
                  >
                    استيراد Excel
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />}
                    onClick={() => setOpenItemDialog(true)}
                  >
                    إضافة عنصر
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <List>
                {selectedCurriculum.items?.map((item) => (
                  <ListItem 
                    key={item.id}
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete">
                        <DeleteIcon />
                      </IconButton>
                    }
                    sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={item.order} size="small" color="primary" />
                          <Typography variant="subtitle1">{item.title}</Typography>
                          {item.unitTitle && <Chip label={item.unitTitle} size="small" variant="outlined" />}
                        </Box>
                      }
                      secondary={`عدد الحصص المقدر: ${item.estimatedSessions}`}
                    />
                  </ListItem>
                ))}
                {(!selectedCurriculum.items || selectedCurriculum.items.length === 0) && (
                  <Typography align="center" color="textSecondary" sx={{ py: 4 }}>
                    لا توجد عناصر في هذا المنهاج بعد. يمكنك إضافتها يدوياً أو استيرادها من ملف Excel.
                  </Typography>
                )}
              </List>
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography color="textSecondary">اختر منهاجاً لعرض تفاصيله</Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* New Curriculum Dialog */}
      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)}>
        <DialogTitle>إضافة منهاج جديد</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="عنوان المنهاج"
            fullWidth
            value={newCurriculum.title}
            onChange={(e) => setNewCurriculum({ ...newCurriculum, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="المادة"
            fullWidth
            value={newCurriculum.subject}
            onChange={(e) => setNewCurriculum({ ...newCurriculum, subject: e.target.value })}
          />
          <TextField
            margin="dense"
            label="المستوى التعليمي"
            fullWidth
            value={newCurriculum.educationalLevel}
            onChange={(e) => setNewCurriculum({ ...newCurriculum, educationalLevel: e.target.value })}
          />
          <TextField
            margin="dense"
            label="وصف"
            fullWidth
            multiline
            rows={3}
            value={newCurriculum.description}
            onChange={(e) => setNewCurriculum({ ...newCurriculum, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDialog(false)}>إلغاء</Button>
          <Button onClick={handleCreateCurriculum} variant="contained">حفظ</Button>
        </DialogActions>
      </Dialog>

      {/* New Item Dialog */}
      <Dialog open={openItemDialog} onClose={() => setOpenItemDialog(false)}>
        <DialogTitle>إضافة عنصر للمنهاج</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="عنوان الدرس/الموضوع"
            fullWidth
            value={newItem.title}
            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="عنوان الوحدة (اختياري)"
            fullWidth
            value={newItem.unitTitle}
            onChange={(e) => setNewItem({ ...newItem, unitTitle: e.target.value })}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="الترتيب"
                type="number"
                fullWidth
                value={newItem.order}
                onChange={(e) => setNewItem({ ...newItem, order: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="عدد الحصص المقدر"
                type="number"
                fullWidth
                value={newItem.estimatedSessions}
                onChange={(e) => setNewItem({ ...newItem, estimatedSessions: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenItemDialog(false)}>إلغاء</Button>
          <Button onClick={handleAddItem} variant="contained">إضافة</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>هل أنت متأكد من رغبتك في حذف هذا المنهاج؟ سيتم حذف جميع العناصر المرتبطة به.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>إلغاء</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">حذف</Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={openHelpDialog} onClose={() => setOpenHelpDialog(false)}>
        <DialogTitle>تعليمات استيراد Excel</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            تأكد من أن ملف Excel يحتوي على الأعمدة التالية:
          </Typography>
          <List dense>
            <ListItem><ListItemText primary="العنوان (Title)" secondary="عنوان الدرس أو الموضوع (مطلوب)" /></ListItem>
            <ListItem><ListItemText primary="الوحدة (Unit)" secondary="اسم الوحدة (اختياري)" /></ListItem>
            <ListItem><ListItemText primary="عدد الحصص (Sessions)" secondary="عدد الحصص المقدرة (افتراضي 1) - يقبل: 'Sessions', 'الحصص', 'عدد الحصص', 'عدد الحصص المقدر'" /></ListItem>
            <ListItem><ListItemText primary="الترتيب (Order)" secondary="ترتيب الدرس في المنهاج" /></ListItem>
          </List>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            يمكن استخدام الأسماء بالعربية أو الإنجليزية (مثلاً: "العنوان" أو "Title" أو "عنوان الدرس").
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHelpDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CurriculumManager;
