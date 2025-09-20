import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';import React, { useState, useRef } from 'react';import { useState, useEffect, useRef } from 'react';

import {

  Box,import {

  Typography,

  Button,  Box,import {import { Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Paper } from '@mui/material';

  Table,

  TableBody,  Typography,

  TableCell,

  TableContainer,  Button,  Box,import { useSections } from '../../../contexts/SectionsContext';

  TableHead,

  TableRow,  Table,

  Paper,

  Tabs,  TableBody,  Typography,

  Tab,

  Chip,  TableCell,

  CircularProgress,

  TextField,  TableContainer,  Button,interface AbsenceHistoryContentProps {

  FormControl,

  InputLabel,  TableHead,

  Select,

  MenuItem,  TableRow,  Paper,  absenceHistory: any[];

} from '@mui/material';

import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';  Paper,

import { useSections } from '../../../hooks/useSections';

  Tabs,  Tabs,  loading: boolean;

interface Student {

  id: number;  Tab,

  firstName: string;

  lastName: string;  Chip,  Tab,  error: string;

  pathway_number: string;

  sectionId: number;  IconButton,

}

  CircularProgress,  TextField,  onFetch: (sectionId: number | string, date: string) => void;

interface AbsenceRecord {

  studentId: number;  TextField,

  firstName: string;

  lastName: string;  FormControl,  FormControl,}

  absences: number;

}  InputLabel,



interface AbsenceHistoryContentProps {  Select,  InputLabel,

  onClose: () => void;

}  MenuItem,



const AbsenceHistoryContent: React.FC<AbsenceHistoryContentProps> = ({ onClose }) => {} from '@mui/material';  Select,export function AbsenceHistoryContent({ absenceHistory, loading, error, onFetch }: AbsenceHistoryContentProps) {

  const [activeTab, setActiveTab] = useState(0);

  const [students, setStudents] = useState<Student[]>([]);import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';

  const [absenceData, setAbsenceData] = useState<AbsenceRecord[]>([]);

  const [loading, setLoading] = useState(false);import { useSections } from '../../../hooks/useSections';  MenuItem  const [tab, setTab] = useState(0);

  const [selectedDate, setSelectedDate] = useState(() => {

    const today = new Date();

    return today.toISOString().split('T')[0];

  });interface Student {} from '@mui/material';  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [selectedSectionId, setSelectedSectionId] = useState('');

  const { sections } = useSections();  id: number;



  useEffect(() => {  firstName: string;  const [updatingStudents, setUpdatingStudents] = useState<Set<number>>(new Set());

    if (sections.length > 0 && !selectedSectionId) {

      setSelectedSectionId(sections[0].id);  lastName: string;

    }

  }, [sections, selectedSectionId]);  pathway_number: string;interface Student {  const { sections } = useSections();



  const fetchData = async () => {  sectionId: number;

    if (!selectedSectionId) return;

    }  studentId: number;  const [localSectionId, setLocalSectionId] = useState<string>(sections.length > 0 ? sections[0].id : '');

    setLoading(true);

    try {

      const studentsResponse = await fetch(`/api/students?section_id=${selectedSectionId}`);

      const studentsData = await studentsResponse.json();interface AbsenceRecord {  firstName: string;  const tableRef = useRef<HTMLTableElement>(null);

      setStudents(studentsData);

  studentId: number;

      const absenceResponse = await fetch(`/api/attendance/absences?sectionId=${selectedSectionId}&date=${selectedDate}`);

      if (absenceResponse.ok) {  firstName: string;  lastName: string;

        const absenceDataFromAPI = await absenceResponse.json();

        setAbsenceData(absenceDataFromAPI);  lastName: string;

      } else {

        const mockAbsenceData: AbsenceRecord[] = studentsData.map((student: Student) => ({  absences: number;  absences: number;  useEffect(() => {

          studentId: student.id,

          firstName: student.firstName,}

          lastName: student.lastName,

          absences: Math.floor(Math.random() * 5),}    if (sections.length > 0) {

        }));

        setAbsenceData(mockAbsenceData);interface AbsenceHistoryContentProps {

      }

    } catch (error) {  onClose: () => void;      setLocalSectionId(sections[0].id);

      console.error('Error fetching data:', error);

      const mockAbsenceData: AbsenceRecord[] = students.map((student: Student) => ({}

        studentId: student.id,

        firstName: student.firstName,interface AbsenceRecord {    }

        lastName: student.lastName,

        absences: Math.floor(Math.random() * 5),const AbsenceHistoryContent: React.FC<AbsenceHistoryContentProps> = ({ onClose }) => {

      }));

      setAbsenceData(mockAbsenceData);  const [activeTab, setActiveTab] = useState(0);  id: number;  }, [sections]);

    } finally {

      setLoading(false);  const [students, setStudents] = useState<Student[]>([]);

    }

  };  const [absenceData, setAbsenceData] = useState<AbsenceRecord[]>([]);  studentId: number;



  useEffect(() => {  const [loading, setLoading] = useState(false);

    fetchData();

  }, [selectedSectionId, selectedDate]);  const [selectedDate, setSelectedDate] = useState(() => {  sectionId: number;  // إعادة تصنيف الطلاب حسب آخر حالة حضور في التاريخ المحدد



  const classifyStudents = () => {    const today = new Date();

    const excellent: (Student & { absences: number })[] = [];

    const good: (Student & { absences: number })[] = [];    return today.toISOString().split('T')[0];  date: string;  const uniqueStudents: { [studentId: number]: any } = {};

    const needsAttention: (Student & { absences: number })[] = [];

  });

    students.forEach(student => {

      const absenceRecord = absenceData.find(a => a.studentId === student.id);  const [selectedSectionId, setSelectedSectionId] = useState('');  isPresent: boolean;  absenceHistory.forEach(record => {

      const absenceCount = absenceRecord?.absences || 0;

      const studentWithAbsences = { ...student, absences: absenceCount };  const { sections } = useSections();



      if (absenceCount === 0) {  student: {    // فقط للسجلات في التاريخ المحدد

        excellent.push(studentWithAbsences);

      } else if (absenceCount <= 2) {  // Set default section when sections load

        good.push(studentWithAbsences);

      } else {  useEffect(() => {    id: number;    if (record.date === selectedDate) {

        needsAttention.push(studentWithAbsences);

      }    if (sections.length > 0 && !selectedSectionId) {

    });

      setSelectedSectionId(sections[0].id);    firstName: string;      uniqueStudents[record.studentId] = record;

    return { excellent, good, needsAttention };

  };    }



  const handlePrint = () => {  }, [sections, selectedSectionId]);    lastName: string;    }

    window.print();

  };



  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {  // Fetch students and absence data  };  });

    setActiveTab(newValue);

  };  const fetchData = async () => {



  const toggleAttendance = async (studentId: number, currentStatus: boolean) => {    if (!selectedSectionId) return;}  const presentStudents = Object.values(uniqueStudents).filter((r: any) => r.isPresent);

    try {

      const response = await fetch('/api/attendance', {    

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },    setLoading(true);  const absentStudents = Object.values(uniqueStudents).filter((r: any) => !r.isPresent);

        body: JSON.stringify({

          attendance: [{    try {

            studentId,

            sectionId: selectedSectionId,      // Fetch students for the selected sectioninterface AbsenceHistoryContentProps {

            date: selectedDate,

            isPresent: !currentStatus      const studentsResponse = await fetch(`/api/students?section_id=${selectedSectionId}`);

          }]

        })      const studentsData = await studentsResponse.json();  absenceHistory: AbsenceRecord[];  return (

      });

            setStudents(studentsData);

      if (response.ok) {

        fetchData();  loading: boolean;    <div style={{ position: 'relative', minHeight: 400 }}>

      }

    } catch (error) {      // Fetch absence data from your attendance API

      console.error('Error toggling attendance:', error);

    }      const absenceResponse = await fetch(`/api/attendance/absences?sectionId=${selectedSectionId}&date=${selectedDate}`);  error: string | null;      <div>

  };

      if (absenceResponse.ok) {

  if (loading) {

    return (        const absenceDataFromAPI = await absenceResponse.json();  onFetch: (sectionName: string, date: string) => void;        <TextField

      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">

        <CircularProgress />        setAbsenceData(absenceDataFromAPI);

      </Box>

    );      } else {  onToggleAttendance: (studentId: number, date: string, isPresent: boolean) => void;          type="date"

  }

        // Fallback to mock data if API fails

  const { excellent, good, needsAttention } = classifyStudents();

  const selectedSection = sections.find(s => s.id === selectedSectionId);        const mockAbsenceData: AbsenceRecord[] = studentsData.map((student: Student) => ({  onClose: () => void;          label="اختر التاريخ"



  return (          studentId: student.id,

    <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>

      <Box sx={{           firstName: student.firstName,  sections: Array<{ id: string; name: string }>;          value={selectedDate}

        display: 'flex', 

        justifyContent: 'space-between',           lastName: student.lastName,

        alignItems: 'center', 

        mb: 2,          absences: Math.floor(Math.random() * 5), // Mock absence count}          onChange={e => setSelectedDate(e.target.value)}

        p: 2,

        borderBottom: '1px solid #e0e0e0'        }));

      }}>

        <Typography variant="h5" component="h2">        setAbsenceData(mockAbsenceData);          InputLabelProps={{ shrink: true }}

          تاريخ الغيابات

        </Typography>      }

      </Box>

    } catch (error) {const AbsenceHistoryContent: React.FC<AbsenceHistoryContentProps> = ({        />

      <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 2 }}>

        <TextField      console.error('Error fetching data:', error);

          type="date"

          label="التاريخ"      // Create mock data on error  absenceHistory,        <FormControl sx={{ minWidth: 180 }}>

          value={selectedDate}

          onChange={(e) => setSelectedDate(e.target.value)}      const mockAbsenceData: AbsenceRecord[] = students.map((student: Student) => ({

          InputLabelProps={{ shrink: true }}

        />        studentId: student.id,  loading,          <InputLabel id="section-select-label">القسم</InputLabel>

        <FormControl sx={{ minWidth: 200 }}>

          <InputLabel>القسم</InputLabel>        firstName: student.firstName,

          <Select

            value={selectedSectionId}        lastName: student.lastName,  error,          <Select

            label="القسم"

            onChange={(e) => setSelectedSectionId(e.target.value)}        absences: Math.floor(Math.random() * 5), // Mock absence count

          >

            {sections.map(section => (      }));  onFetch,            labelId="section-select-label"

              <MenuItem key={section.id} value={section.id}>

                {section.name}      setAbsenceData(mockAbsenceData);

              </MenuItem>

            ))}    } finally {  onToggleAttendance,            value={localSectionId}

          </Select>

        </FormControl>      setLoading(false);

        <Button variant="contained" onClick={fetchData}>

          تحديث البيانات    }  onClose,            label="القسم"

        </Button>

      </Box>  };



      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>  sections            onChange={e => setLocalSectionId(e.target.value as string)}

        <Tabs value={activeTab} onChange={handleTabChange}>

          <Tab label={`ممتاز (${excellent.length})`} />  useEffect(() => {

          <Tab label={`جيد (${good.length})`} />

          <Tab label={`يحتاج متابعة (${needsAttention.length})`} />    fetchData();}) => {          >

        </Tabs>

      </Box>  }, [selectedSectionId, selectedDate]);



      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>  const [tab, setTab] = useState(0);            {sections.map(section => (

        <Typography variant="h6" sx={{ mb: 2 }}>

          {selectedSection?.name || 'قسم غير محدد'} - {selectedDate}  // Classify students based on absence count

        </Typography>

  const classifyStudents = () => {  const [selectedDate, setSelectedDate] = useState(() => {              <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>

        {activeTab === 0 && (

          <Box>    const excellent: (Student & { absences: number })[] = [];

            <Typography variant="subtitle1" sx={{ mb: 1, color: 'green' }}>

              ممتاز (بدون غيابات) - {excellent.length} طالب    const good: (Student & { absences: number })[] = [];    const today = new Date();            ))}

            </Typography>

            <TableContainer component={Paper}>    const needsAttention: (Student & { absences: number })[] = [];

              <Table size="small">

                <TableHead>    return today.toISOString().split('T')[0];          </Select>

                  <TableRow>

                    <TableCell>الرقم المسلسل</TableCell>    students.forEach(student => {

                    <TableCell>الاسم الكامل</TableCell>

                    <TableCell>عدد الغيابات</TableCell>      const absenceRecord = absenceData.find(a => a.studentId === student.id);  });        </FormControl>

                    <TableCell>الحالة</TableCell>

                    <TableCell>إجراء</TableCell>      const absenceCount = absenceRecord?.absences || 0;

                  </TableRow>

                </TableHead>      const studentWithAbsences = { ...student, absences: absenceCount };  const [localSectionId, setLocalSectionId] = useState(sections[0]?.id || '');        <Button variant="contained" color="primary" onClick={() => {

                <TableBody>

                  {excellent.map((student) => (

                    <TableRow key={student.id}>

                      <TableCell>{student.pathway_number}</TableCell>      if (absenceCount === 0) {  const tableRef = useRef<HTMLTableElement>(null);          const selectedSection = sections.find(s => s.id === localSectionId);

                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>

                      <TableCell>{student.absences}</TableCell>        excellent.push(studentWithAbsences);

                      <TableCell>

                        <Chip label="ممتاز" color="success" size="small" />      } else if (absenceCount <= 2) {          const sectionName = selectedSection ? selectedSection.name : localSectionId;

                      </TableCell>

                      <TableCell>        good.push(studentWithAbsences);

                        <Button

                          size="small"      } else {  const uniqueStudents: { [key: number]: any } = {};          onFetch(sectionName, selectedDate);

                          variant="outlined"

                          color="warning"        needsAttention.push(studentWithAbsences);

                          onClick={() => toggleAttendance(student.id, true)}

                        >      }  absenceHistory.forEach((record) => {        }}>

                          تسجيل غياب

                        </Button>    });

                      </TableCell>

                    </TableRow>    if (!uniqueStudents[record.studentId]) {          عرض السجل

                  ))}

                </TableBody>    return { excellent, good, needsAttention };

              </Table>

            </TableContainer>  };      uniqueStudents[record.studentId] = {        </Button>

          </Box>

        )}



        {activeTab === 1 && (  const handlePrint = () => {        ...record,        <Button variant="outlined" color="error" onClick={() => {

          <Box>

            <Typography variant="subtitle1" sx={{ mb: 1, color: 'blue' }}>    window.print();

              جيد (1-2 غيابات) - {good.length} طالب

            </Typography>  };        fullName: `${record.student.firstName} ${record.student.lastName}`          if (window.confirm('هل أنت متأكد أنك تريد مسح جميع سجلات الغياب؟')) {

            <TableContainer component={Paper}>

              <Table size="small">

                <TableHead>

                  <TableRow>  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {      };            const selectedSection = sections.find(s => s.id === localSectionId);

                    <TableCell>الرقم المسلسل</TableCell>

                    <TableCell>الاسم الكامل</TableCell>    setActiveTab(newValue);

                    <TableCell>عدد الغيابات</TableCell>

                    <TableCell>الحالة</TableCell>  };    }            const sectionName = selectedSection ? selectedSection.name : localSectionId;

                    <TableCell>إجراء</TableCell>

                  </TableRow>

                </TableHead>

                <TableBody>  const toggleAttendance = async (studentId: number, currentStatus: boolean) => {  });            fetch('http://localhost:3000/api/attendance/all', {

                  {good.map((student) => (

                    <TableRow key={student.id}>    try {

                      <TableCell>{student.pathway_number}</TableCell>

                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>      const response = await fetch('/api/attendance', {              method: 'DELETE'

                      <TableCell>{student.absences}</TableCell>

                      <TableCell>        method: 'POST',

                        <Chip label="جيد" color="primary" size="small" />

                      </TableCell>        headers: { 'Content-Type': 'application/json' },  const presentStudents = Object.values(uniqueStudents).filter((r: any) => r.isPresent);            }).then(() => onFetch(sectionName, selectedDate));

                      <TableCell>

                        <Button        body: JSON.stringify({

                          size="small"

                          variant="outlined"          attendance: [{  const absentStudents = Object.values(uniqueStudents).filter((r: any) => !r.isPresent);          }

                          color="warning"

                          onClick={() => toggleAttendance(student.id, true)}            studentId,

                        >

                          تسجيل غياب            sectionId: selectedSectionId,        }}>

                        </Button>

                      </TableCell>            date: selectedDate,

                    </TableRow>

                  ))}            isPresent: !currentStatus  return (          مسح جميع السجلات

                </TableBody>

              </Table>          }]

            </TableContainer>

          </Box>        })    <div style={{ position: 'relative', minHeight: 400 }}>        </Button>

        )}

      });

        {activeTab === 2 && (

          <Box>            <div>      </div>

            <Typography variant="subtitle1" sx={{ mb: 1, color: 'red' }}>

              يحتاج متابعة (3+ غيابات) - {needsAttention.length} طالب      if (response.ok) {

            </Typography>

            <TableContainer component={Paper}>        // Refresh data after toggle        <TextField      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 2 }}>

              <Table size="small">

                <TableHead>        fetchData();

                  <TableRow>

                    <TableCell>الرقم المسلسل</TableCell>      }          type="date"        <Tab label="الحاضرون" />

                    <TableCell>الاسم الكامل</TableCell>

                    <TableCell>عدد الغيابات</TableCell>    } catch (error) {

                    <TableCell>الحالة</TableCell>

                    <TableCell>إجراء</TableCell>      console.error('Error toggling attendance:', error);          label="اختر التاريخ"        <Tab label="الغائبون" />

                  </TableRow>

                </TableHead>    }

                <TableBody>

                  {needsAttention.map((student) => (  };          value={selectedDate}      </Tabs>

                    <TableRow key={student.id}>

                      <TableCell>{student.pathway_number}</TableCell>

                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>

                      <TableCell>{student.absences}</TableCell>  if (loading) {          onChange={(e) => setSelectedDate(e.target.value)}      {loading ? <Typography>جاري التحميل...</Typography> : null}

                      <TableCell>

                        <Chip label="يحتاج متابعة" color="error" size="small" />    return (

                      </TableCell>

                      <TableCell>      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">          InputLabelProps={{ shrink: true }}      {error ? <Typography color="error">{error}</Typography> : null}

                        <Button

                          size="small"        <CircularProgress />

                          variant="outlined"

                          color="success"      </Box>        />      {absenceHistory && absenceHistory.length > 0 ? (

                          onClick={() => toggleAttendance(student.id, false)}

                        >    );

                          تسجيل حضور

                        </Button>  }        <FormControl sx={{ minWidth: 180 }}>        <Paper sx={{ p: 2 }}>

                      </TableCell>

                    </TableRow>

                  ))}

                </TableBody>  const { excellent, good, needsAttention } = classifyStudents();          <InputLabel id="section-select-label">القسم</InputLabel>          {tab === 0 ? (

              </Table>

            </TableContainer>  const selectedSection = sections.find(s => s.id === selectedSectionId);

          </Box>

        )}          <Select            <table ref={tableRef} style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>

      </Box>

  return (

      <Box sx={{ 

        position: 'fixed',     <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>            labelId="section-select-label"              <thead>

        bottom: 20, 

        right: 20,       {/* Header */}

        display: 'flex', 

        gap: 1,      <Box sx={{             value={localSectionId}                <tr>

        zIndex: 1000 

      }}>        display: 'flex', 

        <Button

          variant="contained"        justifyContent: 'space-between',             label="القسم"                  <th style={{ width: 60, padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>رقم الطالب</th>

          startIcon={<PrintIcon />}

          onClick={handlePrint}        alignItems: 'center', 

        >

          طباعة        mb: 2,            onChange={(e) => setLocalSectionId(e.target.value as string)}                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>الاسم الكامل</th>

        </Button>

        <Button        p: 2,

          variant="outlined"

          startIcon={<CloseIcon />}        borderBottom: '1px solid #e0e0e0'          >                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>تاريخ الغياب</th>

          onClick={onClose}

        >      }}>

          إغلاق

        </Button>        <Typography variant="h5" component="h2">            {sections.map(section => (                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>عدد الغيابات</th>

      </Box>

    </Box>          تاريخ الغيابات

  );

};        </Typography>              <MenuItem key={section.id} value={section.id}>{section.name}</MenuItem>                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>إجراء</th>



export default AbsenceHistoryContent;      </Box>

            ))}                </tr>

      {/* Controls */}

      <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 2 }}>          </Select>              </thead>

        <TextField

          type="date"        </FormControl>              <tbody>

          label="التاريخ"

          value={selectedDate}        <Button variant="contained" color="primary" onClick={() => {                {presentStudents.map((record: any, idx: number) => (

          onChange={(e) => setSelectedDate(e.target.value)}

          InputLabelProps={{ shrink: true }}          const selectedSection = sections.find(s => s.id === localSectionId);                  <tr key={idx}>

        />

        <FormControl sx={{ minWidth: 200 }}>          const sectionName = selectedSection ? selectedSection.name : localSectionId;                    <td style={{ width: 60, padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.studentId}</td>

          <InputLabel>القسم</InputLabel>

          <Select          onFetch(sectionName, selectedDate);                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{record.student?.firstName || ''} {record.student?.lastName || ''}</td>

            value={selectedSectionId}

            label="القسم"        }}>                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.date}</td>

            onChange={(e) => setSelectedSectionId(e.target.value)}

          >          عرض السجل                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.absences ?? 0}</td>

            {sections.map(section => (

              <MenuItem key={section.id} value={section.id}>        </Button>                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>

                {section.name}

              </MenuItem>        <Button variant="outlined" color="error" onClick={() => {                      <Button 

            ))}

          </Select>          if (window.confirm('هل أنت متأكد أنك تريد مسح جميع سجلات الغياب؟')) {                        variant="outlined" 

        </FormControl>

        <Button variant="contained" onClick={fetchData}>            const selectedSection = sections.find(s => s.id === localSectionId);                        color="error" 

          تحديث البيانات

        </Button>            const sectionName = selectedSection ? selectedSection.name : localSectionId;                        size="small" 

      </Box>

            fetch('http://localhost:3000/api/attendance/all', {                        disabled={updatingStudents.has(record.studentId)}

      {/* Tabs */}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>              method: 'DELETE'                        onClick={async () => {

        <Tabs value={activeTab} onChange={handleTabChange}>

          <Tab label={`ممتاز (${excellent.length})`} />            }).then(() => onFetch(sectionName, selectedDate));                        const selectedSection = sections.find(s => s.id === localSectionId);

          <Tab label={`جيد (${good.length})`} />

          <Tab label={`يحتاج متابعة (${needsAttention.length})`} />          }                        const sectionName = selectedSection ? selectedSection.name : localSectionId;

        </Tabs>

      </Box>        }}>                        setUpdatingStudents(prev => new Set(prev.add(record.studentId)));



      {/* Content */}          مسح الكل                        try {

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>

        <Typography variant="h6" sx={{ mb: 2 }}>        </Button>                          const response = await fetch(`http://localhost:3000/api/attendance`, {

          {selectedSection?.name || 'قسم غير محدد'} - {selectedDate}

        </Typography>      </div>                            method: 'POST',



        {/* Tab Content */}                            headers: { 'Content-Type': 'application/json' },

        {activeTab === 0 && (

          <Box>      <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>                            body: JSON.stringify({ attendance: [{ studentId: record.studentId, sectionId: sectionName, date: selectedDate, isPresent: false }] })

            <Typography variant="subtitle1" sx={{ mb: 1, color: 'green' }}>

              ممتاز (بدون غيابات) - {excellent.length} طالب        <Tab label="الحاضرون" />                          });

            </Typography>

            <TableContainer component={Paper}>        <Tab label="الغائبون" />                          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

              <Table size="small">

                <TableHead>      </Tabs>                          await onFetch(sectionName, selectedDate);

                  <TableRow>

                    <TableCell>الرقم المسلسل</TableCell>      {loading ? <Typography>جاري التحميل...</Typography> : null}                        } catch (error) {

                    <TableCell>الاسم الكامل</TableCell>

                    <TableCell>عدد الغيابات</TableCell>      {error ? <Typography color="error">{error}</Typography> : null}                          alert('حدث خطأ في تحديث الحضور');

                    <TableCell>الحالة</TableCell>

                    <TableCell>إجراء</TableCell>      {absenceHistory && absenceHistory.length > 0 ? (                        } finally {

                  </TableRow>

                </TableHead>        <Paper sx={{ p: 2 }}>                          setUpdatingStudents(prev => {

                <TableBody>

                  {excellent.map((student) => (          {tab === 0 ? (                            const newSet = new Set(prev);

                    <TableRow key={student.id}>

                      <TableCell>{student.pathway_number}</TableCell>            <table ref={tableRef} style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>                            newSet.delete(record.studentId);

                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>

                      <TableCell>{student.absences}</TableCell>              <thead>                            return newSet;

                      <TableCell>

                        <Chip label="ممتاز" color="success" size="small" />                <tr>                          });

                      </TableCell>

                      <TableCell>                  <th style={{ width: 60, padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>رقم الطالب</th>                        }

                        <Button

                          size="small"                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>الاسم الكامل</th>                      }}>

                          variant="outlined"

                          color="warning"                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>تاريخ الغياب</th>                        تأكيد الغياب

                          onClick={() => toggleAttendance(student.id, true)}

                        >                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>عدد الغيابات</th>                        {updatingStudents.has(record.studentId) && ' (جاري التحديث...)'}

                          تسجيل غياب

                        </Button>                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>إجراء</th>                      </Button>

                      </TableCell>

                    </TableRow>                </tr>                    </td>

                  ))}

                </TableBody>              </thead>                  </tr>

              </Table>

            </TableContainer>              <tbody>                ))}

          </Box>

        )}                {presentStudents.map((record: any, index) => (              </tbody>



        {activeTab === 1 && (                  <tr key={index}>            </table>

          <Box>

            <Typography variant="subtitle1" sx={{ mb: 1, color: 'blue' }}>                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.studentId}</td>          ) : (

              جيد (1-2 غيابات) - {good.length} طالب

            </Typography>                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{record.fullName}</td>            <table ref={tableRef} style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>

            <TableContainer component={Paper}>

              <Table size="small">                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.date}</td>              <thead>

                <TableHead>

                  <TableRow>                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>0</td>                <tr>

                    <TableCell>الرقم المسلسل</TableCell>

                    <TableCell>الاسم الكامل</TableCell>                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>                  <th style={{ width: 60, padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>رقم الطالب</th>

                    <TableCell>عدد الغيابات</TableCell>

                    <TableCell>الحالة</TableCell>                      <Button                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>الاسم الكامل</th>

                    <TableCell>إجراء</TableCell>

                  </TableRow>                        size="small"                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>تاريخ الغياب</th>

                </TableHead>

                <TableBody>                        variant="outlined"                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>عدد الغيابات</th>

                  {good.map((student) => (

                    <TableRow key={student.id}>                        color="error"                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>إجراء</th>

                      <TableCell>{student.pathway_number}</TableCell>

                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>                        onClick={() => onToggleAttendance(record.studentId, record.date, false)}                </tr>

                      <TableCell>{student.absences}</TableCell>

                      <TableCell>                      >              </thead>

                        <Chip label="جيد" color="primary" size="small" />

                      </TableCell>                        تسجيل غياب              <tbody>

                      <TableCell>

                        <Button                      </Button>                {absentStudents.map((record: any, idx: number) => (

                          size="small"

                          variant="outlined"                    </td>                  <tr key={idx}>

                          color="warning"

                          onClick={() => toggleAttendance(student.id, true)}                  </tr>                    <td style={{ width: 60, padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.studentId}</td>

                        >

                          تسجيل غياب                ))}                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{record.student?.firstName || ''} {record.student?.lastName || ''}</td>

                        </Button>

                      </TableCell>              </tbody>                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.date}</td>

                    </TableRow>

                  ))}            </table>                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.absences ?? 0}</td>

                </TableBody>

              </Table>          ) : (                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>

            </TableContainer>

          </Box>            <table ref={tableRef} style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>                      <Button 

        )}

              <thead>                        variant="outlined" 

        {activeTab === 2 && (

          <Box>                <tr>                        color="success" 

            <Typography variant="subtitle1" sx={{ mb: 1, color: 'red' }}>

              يحتاج متابعة (3+ غيابات) - {needsAttention.length} طالب                  <th style={{ width: 60, padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>رقم الطالب</th>                        size="small" 

            </Typography>

            <TableContainer component={Paper}>                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>الاسم الكامل</th>                        disabled={updatingStudents.has(record.studentId)}

              <Table size="small">

                <TableHead>                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>تاريخ الغياب</th>                        onClick={async () => {

                  <TableRow>

                    <TableCell>الرقم المسلسل</TableCell>                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>عدد الغيابات</th>                        const selectedSection = sections.find(s => s.id === localSectionId);

                    <TableCell>الاسم الكامل</TableCell>

                    <TableCell>عدد الغيابات</TableCell>                  <th style={{ padding: '8px', border: '1px solid #ddd', backgroundColor: '#f2f2f2' }}>إجراء</th>                        const sectionName = selectedSection ? selectedSection.name : localSectionId;

                    <TableCell>الحالة</TableCell>

                    <TableCell>إجراء</TableCell>                </tr>                        setUpdatingStudents(prev => new Set(prev.add(record.studentId)));

                  </TableRow>

                </TableHead>              </thead>                        try {

                <TableBody>

                  {needsAttention.map((student) => (              <tbody>                          const response = await fetch(`http://localhost:3000/api/attendance`, {

                    <TableRow key={student.id}>

                      <TableCell>{student.pathway_number}</TableCell>                {absentStudents.map((record: any, index) => (                            method: 'POST',

                      <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>

                      <TableCell>{student.absences}</TableCell>                  <tr key={index}>                            headers: { 'Content-Type': 'application/json' },

                      <TableCell>

                        <Chip label="يحتاج متابعة" color="error" size="small" />                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.studentId}</td>                            body: JSON.stringify({ attendance: [{ studentId: record.studentId, sectionId: sectionName, date: selectedDate, isPresent: true }] })

                      </TableCell>

                      <TableCell>                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{record.fullName}</td>                          });

                        <Button

                          size="small"                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.date}</td>                          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                          variant="outlined"

                          color="success"                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{record.student?.absences || 0}</td>                          await onFetch(sectionName, selectedDate);

                          onClick={() => toggleAttendance(student.id, false)}

                        >                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>                        } catch (error) {

                          تسجيل حضور

                        </Button>                      <Button                          alert('حدث خطأ في تحديث الحضور');

                      </TableCell>

                    </TableRow>                        size="small"                        } finally {

                  ))}

                </TableBody>                        variant="outlined"                          setUpdatingStudents(prev => {

              </Table>

            </TableContainer>                        color="success"                            const newSet = new Set(prev);

          </Box>

        )}                        onClick={() => onToggleAttendance(record.studentId, record.date, true)}                            newSet.delete(record.studentId);

      </Box>

                      >                            return newSet;

      {/* Fixed Action Buttons */}

      <Box sx={{                         تسجيل حضور                          });

        position: 'fixed', 

        bottom: 20,                       </Button>                        }

        right: 20, 

        display: 'flex',                     </td>                      }}>

        gap: 1,

        zIndex: 1000                   </tr>                        إلغاء الغياب

      }}>

        <Button                ))}                        {updatingStudents.has(record.studentId) && ' (جاري التحديث...)'}

          variant="contained"

          startIcon={<PrintIcon />}              </tbody>                      </Button>

          onClick={handlePrint}

        >            </table>                    </td>

          طباعة

        </Button>          )}                  </tr>

        <Button

          variant="outlined"        </Paper>                ))}

          startIcon={<CloseIcon />}

          onClick={onClose}      ) : (              </tbody>

        >

          إغلاق        <Typography>لا توجد بيانات متاحة</Typography>            </table>

        </Button>

      </Box>      )}          )}

    </Box>

  );        </Paper>

};

      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', gap: 1 }}>      ) : (!loading && !error ? <Typography>لا توجد بيانات لهذا اليوم أو القسم.</Typography> : null)}

export default AbsenceHistoryContent;
        <Button

          variant="contained"      {/* زر الطباعة والإغلاق في أسفل النافذة */}

          color="primary"      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, display: 'flex', gap: 8 }}>

          onClick={() => {        <Button variant="outlined" color="primary" onClick={() => window.print()}>طباعة</Button>

            if (tableRef.current) {        <Button variant="outlined" color="error" onClick={() => window.close()}>إغلاق</Button>

              const printContent = tableRef.current.outerHTML;      </div>

              const printWindow = window.open('', '', 'height=600,width=800');    </div>

              if (printWindow) {  );

                printWindow.document.write(`}

                  <html>
                    <head>
                      <title>طباعة قائمة الطلاب</title>
                      <style>
                        body { font-family: Arial, sans-serif; direction: rtl; }
                        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                        th { background-color: #f2f2f2; }
                        @media print { 
                          button { display: none; } 
                          .no-print { display: none; }
                        }
                      </style>
                    </head>
                    <body>
                      <h2>قائمة ${tab === 0 ? 'الحاضرين' : 'الغائبين'} - ${selectedDate}</h2>
                      ${printContent}
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.print();
              }
            }
          }}
        >
          طباعة
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
        >
          إغلاق
        </Button>
      </Box>
    </div>
  );
};

export default AbsenceHistoryContent;