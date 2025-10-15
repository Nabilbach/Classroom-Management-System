import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LessonTemplate, fetchLessonTemplates, addLessonTemplate, deleteLessonTemplate, deleteTemplatesByCourse } from '../services/api/lessonTemplateService';
import { Box, Paper, Typography, TextField, InputAdornment, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, IconButton, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';

import TemplateEditModal from './TemplateEditModal';

const TemplateItem = ({ template, onDoubleClick, onDelete }: { template: LessonTemplate, onDoubleClick: (template: LessonTemplate) => void, onDelete: (templateId: string) => void }) => {
  const handleDragStart = (e: React.DragEvent) => {
    // Include full template payload to avoid lookups elsewhere
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'template', template }));
  };

  return (
    <ListItem
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => onDoubleClick(template)}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        mb: 1.5,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '2px solid',
        borderColor: '#e5e7eb',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        cursor: 'grab',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
        '&:active': { 
          cursor: 'grabbing',
          transform: 'scale(0.98)'
        },
        '&:hover': { 
          bgcolor: '#f0f4ff',
          borderColor: '#667eea',
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)',
          transform: 'translateY(-2px)'
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Typography 
        variant="body2" 
        sx={{ 
          flex: 1, 
          fontWeight: '600',
          color: '#1f2937',
          pl: 1.5
        }}
      >
        {template.title}
      </Typography>
      
      {template.weekNumber && (
        <Box sx={{
          bgcolor: '#667eea',
          color: 'white',
          px: 1.5,
          py: 0.5,
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
        }}>
          أسبوع {template.weekNumber}
        </Box>
      )}
      
      <IconButton 
        onClick={() => onDelete(template.id)} 
        size="small" 
        sx={{ 
          p: 0.5,
          color: '#ef4444',
          bgcolor: 'rgba(239, 68, 68, 0.1)',
          '&:hover': {
            bgcolor: '#ef4444',
            color: 'white',
            transform: 'rotate(90deg)'
          },
          transition: 'all 0.3s ease'
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </ListItem>
  );
};

type TemplateTree = { [subject: string]: { [level: string]: { [week: string]: LessonTemplate[] } } };

const TemplateLibrary = () => {
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLessonTemplates();
      setTemplates(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({ 'subject-Islamic Education': true });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LessonTemplate | null>(null);

  const handleEditTemplate = (template: LessonTemplate) => {
    setSelectedTemplate(template);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTemplate(null);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      try {
        await deleteLessonTemplate(templateId);
        await load();
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('فشل في حذف القالب');
      }
    }
  };

  const handleDeleteByCourse = async (courseName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف جميع القوالب للمقرر "${courseName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      try {
        await deleteTemplatesByCourse(courseName);
        await load();
      } catch (error) {
        console.error(`Failed to delete templates for course ${courseName}:`, error);
        alert(`فشل في حذف قوالب المقرر "${courseName}".`);
      }
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const parseRowToTemplate = (row: any): Omit<LessonTemplate, 'id'> | null => {
    // Support Arabic/English headers
    const get = (keys: string[]) => keys.map(k => row[k]).find(v => v !== undefined && v !== null && v !== '');
    const title = get(['العنوان', 'عنوان الدرس', 'title', 'lessonTitle']);
    const courseName = get(['المادة', 'المقرر', 'course', 'subject', 'courseName']) || 'التربية الإسلامية';
    const level = get(['المستوى', 'level']) || '';
    const weekNumberRaw = get(['الأسبوع', 'week', 'weekNumber']);
    const estimatedSessionsRaw = get(['عدد الحصص', 'estimatedSessions', 'sessions']);
    const description = get(['الوصف', 'description', 'details']) || '';
    const stagesRaw = get(['المراحل', 'stages', 'الأهداف', 'objectives']);
    if (!title) return null;

    const estimatedSessions = Number(estimatedSessionsRaw) > 0 ? Number(estimatedSessionsRaw) : 1;
    const weekNumber = weekNumberRaw ? Number(weekNumberRaw) : undefined;

    const stages = typeof stagesRaw === 'string'
      ? stagesRaw
          .split(/\r?\n|،|,|;/)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .map((s: string, i: number) => ({ id: `st-${i}-${Date.now()}`, title: s, isCompleted: false }))
      : [];

    return {
      title: String(title),
      description: String(description),
      estimatedSessions,
      stages,
      courseName: String(courseName),
      level: String(level),
      weekNumber,
      scheduledSections: [],
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const parsed = rows.map(parseRowToTemplate).filter((t): t is Omit<LessonTemplate, 'id'> => t !== null);
      let added = 0;
      for (const tpl of parsed) {
        await addLessonTemplate(tpl);
        added++;
      }
      await load();
      alert(`تم استيراد ${added} قالب بنجاح.`);
    } catch (err) {
      console.error('فشل استيراد ملف إكسيل:', err);
      alert('فشل في قراءة ملف الإكسيل. تأكد من الصيغة والعناوين.');
    } finally {
      // reset input to allow re-upload same file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uniqueLevels = useMemo(() => {
    const levels = new Set<string>();
    templates?.forEach(template => {
      if (template.level) {
        levels.add(template.level);
      }
    });
    return ['all', ...Array.from(levels).sort()];
  }, [templates]);

  const templateTree = useMemo((): TemplateTree => {
    const tree: TemplateTree = {};
    const filtered = templates?.filter(t =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (levelFilter === 'all' || t.level === levelFilter)
    ) || [];
    for (const template of filtered) {
      const { level, courseName, weekNumber } = template;
      const subject = courseName || 'Uncategorized';
      const week = `Week ${weekNumber}`;
      if (!tree[subject]) tree[subject] = {};
      if (!tree[subject][level]) tree[subject][level] = {};
      if (!tree[subject][level][week]) tree[subject][level][week] = [];
      tree[subject][level][week].push(template);
    }
    return tree;
  }, [templates, searchTerm, levelFilter]);

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return <Box sx={{ p: 2 }}><Typography>جاري التحميل...</Typography></Box>;
  }

  if (!templates) {
    return <Box sx={{ p: 2 }}><Typography>فشل في تحميل بيانات القوالب.</Typography></Box>;
  }

  // ✅ لا نتوقف هنا إذا كانت القوالب فارغة — نسمح بإضافة جديدة

  return (
    <Paper
      sx={{
        flexShrink: 0,
        background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
        borderRight: { md: 'none' },
        p: 1,
        m: 0,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexGrow: 1,
        borderRadius: '12px',
      }}
    >
      {/* رأس المكتبة - تصميم احترافي */}
      <Box sx={{ 
        flexShrink: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '10px',
        p: 2,
        mb: 2,
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            📚 مكتبة القوالب
          </Typography>
          <Box sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '20px',
            px: 2,
            py: 0.5,
            backdropFilter: 'blur(10px)'
          }}>
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
              {templates.length} قالب
            </Typography>
          </Box>
        </Box>
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".xlsx,.xls" 
          onChange={handleFileChange} 
          aria-label="استيراد ملف Excel"
          style={{ display: 'none' }} 
        />
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button 
            size="small" 
            variant="contained"
            startIcon={<UploadFileIcon />} 
            onClick={handleImportClick}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              color: '#667eea',
              fontWeight: 'bold',
              '&:hover': {
                bgcolor: 'white',
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            📥 استيراد Excel
          </Button>
        </Box>
      </Box>

      {/* شريط البحث والفلاتر - تصميم محسن */}
      <Box sx={{ flexShrink: 0, px: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="ابحث عن قوالب..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            mb: 1.5,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              bgcolor: 'white',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)'
              },
              '&.Mui-focused': {
                boxShadow: '0 2px 12px rgba(102, 126, 234, 0.2)'
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#667eea' }} />
              </InputAdornment>
            ),
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl fullWidth size="small">
            <InputLabel id="level-select-label">المستوى</InputLabel>
            <Select
              labelId="level-select-label"
              id="level-select"
              value={levelFilter}
              label="المستوى"
              onChange={(e) => setLevelFilter(e.target.value as string)}
              sx={{
                borderRadius: '10px',
                bgcolor: 'white',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)'
                }
              }}
            >
              {uniqueLevels.map(level => (
                <MenuItem key={level} value={level}>
                  {level === 'all' ? '🎓 جميع المستويات' : `📖 ${level}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {levelFilter !== 'all' && (
            <IconButton 
              onClick={() => setLevelFilter('all')} 
              size="small"
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                '&:hover': {
                  bgcolor: '#dc2626',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* قائمة القوالب */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {Object.keys(templateTree).length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            لا توجد قوالب تطابق البحث أو الفلاتر.
          </Typography>
        ) : (
          Object.keys(templateTree).map(subject => {
            const subjectKey = `subject-${subject}`;
            const isExpanded = expandedCategories[subjectKey] ?? false;
            return (
              <Accordion
                key={subjectKey}
                expanded={isExpanded}
                onChange={() => toggleCategory(subjectKey)}
                sx={{ mb: 0.5, boxShadow: 0 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{subject}</Typography>
                  <div
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent accordion from toggling
                      handleDeleteByCourse(subject);
                    }}
                    style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
                  >
                    <DeleteIcon fontSize="small" color="error" />
                  </div>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, pl: 2 }}>
                  {Object.keys(templateTree[subject]).map(level => {
                    const levelKey = `${subjectKey}-level-${level}`;
                    const isLevelExpanded = expandedCategories[levelKey] ?? true;
                    return (
                      <Accordion
                        key={levelKey}
                        expanded={isLevelExpanded}
                        onChange={() => toggleCategory(levelKey)}
                        sx={{ mb: 0.5, boxShadow: 0 }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'semibold' }}>{level}</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, pl: 2 }}>
                          <List dense>
                            {Object.keys(templateTree[subject][level]).map(week => (
                              <Box key={week} sx={{ mt: 0.5 }}>
                                {templateTree[subject][level][week].map(template => (
                                  <TemplateItem
                                    key={template.id}
                                    template={template}
                                    onDoubleClick={handleEditTemplate}
                                    onDelete={handleDeleteTemplate}
                                  />
                                ))}
                              </Box>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
      </Box>

      {/* نافذة التعديل */}
      <TemplateEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        template={selectedTemplate}
      />
    </Paper>
  );
};

export default TemplateLibrary;