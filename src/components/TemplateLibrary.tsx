import React, { useState, useMemo } from 'react';
import { useCurriculum } from '../contexts/CurriculumContext';
import { LessonTemplate } from '../services/api/curriculumService';
import { Box, Paper, Typography, TextField, InputAdornment, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem, IconButton, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';

import TemplateEditModal from './TemplateEditModal';

const TemplateItem = ({ template, onDoubleClick, onDelete }: { template: LessonTemplate, onDoubleClick: (template: LessonTemplate) => void, onDelete: (templateId: string) => void }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ templateId: template.id, type: 'template' }));
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
        p: 1,
        mb: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: '4px',
        boxShadow: 1,
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
        '&:hover': { bgcolor: 'action.hover', boxShadow: 2 },
        transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      }}
    >
      <Typography variant="body2" sx={{ flex: 1, fontWeight: 'normal' }}>{template.title}</Typography>
      <IconButton onClick={() => onDelete(template.id)} size="small" color="error" sx={{ p: 0 }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
      {template.weekNumber && (
        <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
          W{template.weekNumber}
        </Typography>
      )}
    </ListItem>
  );
};

type TemplateTree = { [subject: string]: { [level: string]: { [week: string]: LessonTemplate[] } } };

const TemplateLibrary = () => {
  const { templates, isLoading, removeTemplate, removeTemplatesByCourse, addTemplate, refetchTemplates } = useCurriculum();
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
        await removeTemplate(templateId);
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('فشل في حذف القالب');
      }
    }
  };

  const handleDeleteByCourse = async (courseName: string) => {
    if (window.confirm(`هل أنت متأكد من حذف جميع القوالب للمقرر "${courseName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      try {
        await removeTemplatesByCourse(courseName);
      } catch (error) {
        console.error(`Failed to delete templates for course ${courseName}:`, error);
        alert(`فشل في حذف قوالب المقرر "${courseName}".`);
      }
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
        bgcolor: 'background.paper',
        borderRight: { md: '1px solid' },
        borderColor: { md: 'grey.300' },
        p: 2,
        m: { xs: 2, md: 0 },
        boxShadow: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flexGrow: 1,
      }}
    >
      {/* رأس المكتبة */}
      <Box sx={{ flexShrink: 0 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'semibold' }}>مكتبة القوالب</Typography>
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          مجموع القوالب: {templates.length}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            label="ابحث عن قوالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth sx={{ minWidth: 140 }}>
            <InputLabel id="level-select-label">المستوى</InputLabel>
            <Select
              labelId="level-select-label"
              id="level-select"
              value={levelFilter}
              label="المستوى"
              onChange={(e) => setLevelFilter(e.target.value as string)}
              size="small"
            >
              {uniqueLevels.map(level => (
                <MenuItem key={level} value={level}>
                  {level === 'all' ? 'جميع المستويات' : level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {levelFilter !== 'all' && (
            <IconButton onClick={() => setLevelFilter('all')} size="small">
              <ClearIcon />
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