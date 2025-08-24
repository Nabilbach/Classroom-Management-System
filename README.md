# Learning Management System

This is a web application designed to help manage lessons, sections, and track student progress within a curriculum.

## Features:

### 1. Curriculum Management (`/learning-management`)
- **View Lessons:** See a list of all lessons.
- **Add New Lesson:** Create new lessons with details like title, description, date, estimated sessions, assigned sections, and stages.
- **Edit Lesson:** Modify existing lesson details.
- **Delete Lesson:** Remove lessons from the curriculum.
- **Filter Lessons:** Filter lessons by status (all, planned, in-progress, completed), assigned section, and course name.
- **Search Lessons:** Search lessons by title or description.
- **Export to Excel:** Export all lesson data to an Excel file for backup or external use.
- **Import from Excel:** Import lesson data from an Excel file to quickly populate the curriculum.

### 2. Section Management (`/section-management`)
- **View Sections:** See a list of all created sections/classes.
- **Add New Section:** Create new sections with details like name, educational level, specialization, room number, and teacher name.
- **Edit Section:** Modify existing section details.
- **Delete Section:** Remove sections from the system.
- **Assign Course to Section:** Link a section to a specific course using a dropdown selector.
- **View Section Progress:** Navigate to a dedicated dashboard to track the progress of a section through its assigned course.

### 3. Section Progress Dashboard (`/section-progress/:sectionId`)
- **Overview:** Displays the name of the section and its assigned course.
- **Progress Percentage:** Shows the overall completion percentage of the course for that specific section, with a progress bar.
- **Lesson List with Status Controls:** Lists all lessons belonging to the section's assigned course.
- **Update Lesson Status:** Allows teachers to update the status of each lesson for that section (لم يبدأ, قيد الإنجاز, مكتمل).

## Getting Started:

1.  **Install Dependencies:**
    ```bash
    npm install
    cd backend && npm install
    ```
2.  **Start the Backend Server:**
    ```bash
    cd backend
    node index.js
    ```
    (Ensure the server is running on `http://localhost:3000`)
3.  **Start the Frontend Application:**
    ```bash
    npm run dev
    ```
    (The application will typically run on `http://localhost:5173`)

## Data Persistence:

-   Lesson data is stored in `backend/lessons.json`.
-   Section data is stored in `backend/sections.json`.
-   Lesson logs are stored in `backend/lessonLogs.json`.

## Development Notes:

-   The application uses React with Vite for the frontend and Express.js for the backend.
-   Styling is handled by Tailwind CSS and Material Tailwind React components.
-   Data is managed through React Contexts for global state management.
