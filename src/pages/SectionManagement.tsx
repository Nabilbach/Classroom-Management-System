import { useState } from 'react';
import { Typography, Button, Dialog, DialogHeader, DialogBody, DialogFooter, Card, CardBody } from "@material-tailwind/react";
import SectionForm from '../components/SectionForm';
import { useSections, Section } from '../contexts/SectionsContext'; // Import Section interface
import { useStudents } from '../contexts/StudentsContext';
import { Link } from 'react-router-dom'; // Import Link

function SectionManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const { sections, addSection, deleteSection, editSection, isLoading } = useSections(); // Destructure isLoading
  const { students } = useStudents();

  const handleAddModalOpen = () => setIsAddModalOpen(!isAddModalOpen);
  const handleEditModalOpen = () => setIsEditModalOpen(!isEditModalOpen);
  const handleDetailModalOpen = () => setIsDetailModalOpen(!isDetailModalOpen);

  const handleEditClick = (section: Section) => {
    setSelectedSection(section);
    setIsEditModalOpen(true);
  };

  const handleViewDetailsClick = (section: Section) => {
    setSelectedSection(section);
    setIsDetailModalOpen(true);
  };

  const handleDeleteSection = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد أنك تريد حذف القسم "${name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      deleteSection(id);
    }
  };

  return (
    <div dir="rtl" className="bg-gray-50 min-h-screen p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Typography variant="h4" color="blue-gray">
            إدارة الأقسام
          </Typography>
          <Button
            onClick={handleAddModalOpen}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md font-semibold py-3 px-6 transition-colors duration-200"
            disabled={isLoading} // Disable button when loading
          >
            إضافة قسم جديد
          </Button>
        </div>

        {/* Add Section Dialog */}
        <Dialog open={isAddModalOpen} handler={handleAddModalOpen} size="xs">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full text-right">
            <DialogHeader className="justify-end p-0 mb-4">
              <Typography variant="h5" color="blue-gray" className="text-xl font-bold">
                إضافة قسم جديد
              </Typography>
            </DialogHeader>
            <DialogBody divider className="p-0 overflow-y-auto max-h-[calc(100vh-200px)]">
              <SectionForm onClose={handleAddModalOpen} addSection={addSection} />
            </DialogBody>
            <DialogFooter className="justify-start p-0 mt-4">
              {/* Footer content if needed */}<></>
            </DialogFooter>
          </div>
        </Dialog>

        {/* Edit Section Dialog */}
        <Dialog open={isEditModalOpen} handler={handleEditModalOpen} size="xs">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full text-right">
            <DialogHeader className="justify-end p-0 mb-4">
              <Typography variant="h5" color="blue-gray" className="text-xl font-bold">
                تعديل معلومات القسم
              </Typography>
            </DialogHeader>
            <DialogBody divider className="p-0 overflow-y-auto max-h-[calc(100vh-200px)]">
              {selectedSection ? (
                <SectionForm
                  onClose={handleEditModalOpen}
                  initialData={selectedSection}
                  updateSection={async (updatedSection) => { // Added async
                    const result = await editSection(updatedSection.id, updatedSection); // Await and store result
                    handleEditModalOpen();
                    return result; // Return the result
                  }}
                />
              ) : <></>}
            </DialogBody>
            <DialogFooter className="justify-start p-0 mt-4">
              {/* Footer content if needed */}<></>
            </DialogFooter>
          </div>
        </Dialog>

        {/* Section Detail Dialog */}
        <Dialog open={isDetailModalOpen} handler={handleDetailModalOpen} size="sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full text-right">
            <DialogHeader className="justify-end p-0 mb-4">
              <Typography variant="h5" color="blue-gray" className="text-xl font-bold">
                تفاصيل القسم: {selectedSection?.name}
              </Typography>
            </DialogHeader>
            <DialogBody divider className="p-0 overflow-y-auto max-h-[calc(100vh-200px)]">
              {selectedSection ? (
                <div className="space-y-2">
                  <Typography className="text-gray-700">
                    المستوى الدراسي: {selectedSection.educationalLevel}
                  </Typography>
                  <Typography className="text-gray-700">
                    التخصص: {selectedSection.specialization}
                  </Typography>
                  <Typography className="text-gray-700">
                    رقم القاعة: {selectedSection.roomNumber}
                  </Typography>
                  <Typography className="text-gray-700">
                    اسم الأستاذ: {selectedSection.teacherName}
                  </Typography>
                  {selectedSection.courseName && (
                    <Typography className="text-gray-700">
                      المقرر المخصص: {selectedSection.courseName}
                    </Typography>
                  )}
                  <Typography className="text-gray-700 font-semibold mt-4">
                    التلاميذ في هذا القسم:
                  </Typography>
                  {
                    students.filter(student => student.sectionId === selectedSection.id).length > 0 ? (
                      <ul className="list-disc pr-5">
                        {students.filter(student => student.sectionId === selectedSection.id).map(student => (
                          <li key={student.id} className="text-gray-700">
                            {student.firstName} {student.lastName}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <Typography className="text-gray-700">لا يوجد تلاميذ في هذا القسم.</Typography>
                    )
                  }
                </div>
              ) : <></>}
            </DialogBody>
            <DialogFooter className="justify-start p-0 mt-4">
              <Button variant="text" color="red" onClick={handleDetailModalOpen}>
                إغلاق
              </Button><></>
            </DialogFooter>
          </div>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {isLoading ? (
            <div className="col-span-full text-center py-8">
              <Typography variant="h6" color="blue-gray">
                جاري تحميل الأقسام...
              </Typography>
            </div>
          ) : sections.length > 0 ? (
            sections.map((section) => (
              <Card key={section.id} className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg text-right">
                <CardBody className="p-0">
                  <Typography variant="h5" color="blue-gray" className="mb-2 text-xl font-bold text-gray-800">
                    {section.name}
                  </Typography>
                  <Typography className="text-sm font-semibold text-gray-700">
                    المستوى الدراسي: {section.educationalLevel}
                  </Typography>
                  <Typography className="text-sm font-semibold text-gray-700">
                    التخصص: {section.specialization}
                  </Typography>
                  <Typography className="text-sm font-semibold text-gray-700">
                    رقم القاعة: {section.roomNumber}
                  </Typography>
                  <Typography className="text-sm font-semibold text-gray-700">
                    اسم الأستاذ: {section.teacherName}
                  </Typography>
                  {section.courseName && (
                    <Typography className="text-sm font-semibold text-gray-700">
                      المقرر المخصص: {section.courseName}
                    </Typography>
                  )}
                  <Typography className="text-sm font-semibold text-gray-700">
                    عدد التلاميذ: {students.filter(student => student.sectionId === section.id).length}
                  </Typography>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button size="sm" color="blue" className="rounded-md" onClick={() => handleViewDetailsClick(section)}>
                      عرض التفاصيل
                    </Button>
                    <Button
                      size="sm"
                      color="amber"
                      className="rounded-md"
                      onClick={() => handleEditClick(section)}
                      disabled={isLoading} // Disable edit button when loading
                    >
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      color="red"
                      className="rounded-md"
                      onClick={() => handleDeleteSection(section.id, section.name)}
                      disabled={isLoading} // Disable delete button when loading
                    >
                      حذف
                    </Button>
                    {section.courseName && (
                      <Link to={`/section-progress/${section.id}`}>
                        <Button size="sm" color="green" className="rounded-md" disabled={isLoading}> {/* Disable progress button when loading */}
                          عرض التقدم
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <Typography variant="h6" color="blue-gray">
                لا توجد أقسام متاحة. الرجاء إضافة قسم جديد أولاً.
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SectionManagement;