import { supabase } from './supabase';

export const SUBJECTS = [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "IPAS",
    "Pendidikan Jasmani, Olaharga dan Kesehatan",
    "Seni dan Budaya",
    "Bahasa Inggris",
    "Mulok 1",
    "Mulok 2"
] as const;

export type Subject = typeof SUBJECTS[number];

export interface Grade {
    id?: string;
    student_id: string;
    class_level: number;
    semester: number;
    subject: string;
    knowledge_score: number | null;
    skill_score: number | null; // Kept for DB compatibility, but unused in UI
}

export interface StudentWithGrades {
    id: string;
    name: string;
    nisn: string;
    nis: string;
    grades: Record<string, Grade>; // subject -> Grade (for current level/semester)
    cumulative_average: number | null; // Average of ALL grades (5-1, 5-2, 6-1, 6-2)
}

export async function fetchGrades(classLevel: number, semester: number) {
    // 1. Fetch all students
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, nisn, nis')
        .order('name');

    if (studentsError) throw studentsError;

    // 2. Fetch ALL grades for these students (regardless of level/semester)
    const { data: allGrades, error: gradesError } = await supabase
        .from('grades')
        .select('*');

    if (gradesError) throw gradesError;

    // 3. Merge data
    const result: StudentWithGrades[] = students.map(student => {
        const studentGrades: Record<string, Grade> = {};

        // Filter grades for the specific requested view (classLevel, semester)
        // This ensures the input grid only shows what it's supposed to.
        SUBJECTS.forEach(subject => {
            const existingGrade = allGrades?.find(g =>
                g.student_id === student.id &&
                g.subject === subject &&
                g.class_level === classLevel &&
                g.semester === semester
            );

            studentGrades[subject] = existingGrade || {
                student_id: student.id,
                class_level: classLevel,
                semester: semester,
                subject: subject,
                knowledge_score: null,
                skill_score: null
            };
        });

        // Calculate Cumulative Average (4-1, 4-2, 5-1, 5-2, 6-1, 6-2)
        // We consider ALL knowledge_scores found for this student
        const studentAllGrades = allGrades?.filter(g => g.student_id === student.id && g.knowledge_score !== null) || [];
        const totalScore = studentAllGrades.reduce((sum, g) => sum + (g.knowledge_score || 0), 0);
        const average = studentAllGrades.length > 0 ? totalScore / studentAllGrades.length : null;

        return {
            ...student,
            grades: studentGrades,
            cumulative_average: average
        };
    });

    return result;
}

export async function saveGrade(grade: Grade) {
    // Remove id if it's undefined to let Supabase handle generation/upsert match
    const { id, ...gradeData } = grade;

    const { data, error } = await supabase
        .from('grades')
        .upsert(
            {
                student_id: gradeData.student_id,
                class_level: gradeData.class_level,
                semester: gradeData.semester,
                subject: gradeData.subject,
                knowledge_score: gradeData.knowledge_score,
                skill_score: gradeData.skill_score
            },
            { onConflict: 'student_id,class_level,semester,subject' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function saveBulkGrades(grades: Grade[]) {
    // Filter out grades that don't have valid identifiers, though our type ensures it usually.
    const validGrades = grades.map(({ id, ...g }) => ({
        student_id: g.student_id,
        class_level: g.class_level,
        semester: g.semester,
        subject: g.subject,
        knowledge_score: g.knowledge_score,
        skill_score: g.skill_score // null
    }));

    const { data, error } = await supabase
        .from('grades')
        .upsert(validGrades, { onConflict: 'student_id,class_level,semester,subject' })
        .select();

    if (error) throw error;
    return data;
}


