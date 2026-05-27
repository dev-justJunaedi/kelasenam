import { supabase } from './supabase';

export const TKA_SUBJECTS = [
    { key: 'bahasa_indonesia', label: 'Bahasa Indonesia' },
    { key: 'matematika', label: 'Matematika' }
] as const;

export interface TKAScore {
    id?: string;
    student_id: string;
    bahasa_indonesia: number | null;
    matematika: number | null;
    average: number | null;
}

export interface StudentWithTKA {
    id: string;
    name: string;
    nisn: string;
    nis: string;
    tka: TKAScore | null;
}

export async function fetchTKAData(): Promise<StudentWithTKA[]> {
    // 1. Fetch all students
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, nisn, nis')
        .order('name');

    if (studentsError) throw studentsError;

    // 2. Fetch TKA scores
    const { data: tkaScores, error: tkaError } = await supabase
        .from('tka_scores')
        .select('*');

    if (tkaError) throw tkaError;

    // 3. Merge data
    const result: StudentWithTKA[] = students.map(student => {
        const tka = tkaScores?.find(t => t.student_id === student.id) || null;
        
        // Calculate average if both scores exist
        if (tka && tka.bahasa_indonesia !== null && tka.matematika !== null) {
            tka.average = (tka.bahasa_indonesia + tka.matematika) / 2;
        }

        return {
            ...student,
            tka
        };
    });

    return result;
}

export async function saveTKAScore(score: TKAScore) {
    const { id, ...scoreData } = score;

    // Calculate average
    let average = scoreData.average;
    if (scoreData.bahasa_indonesia !== null && scoreData.matematika !== null) {
        average = (scoreData.bahasa_indonesia + scoreData.matematika) / 2;
    }

    const { data, error } = await supabase
        .from('tka_scores')
        .upsert(
            {
                student_id: scoreData.student_id,
                bahasa_indonesia: scoreData.bahasa_indonesia,
                matematika: scoreData.matematika,
                average: average
            },
            { onConflict: 'student_id' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function saveBulkTKAScores(scores: TKAScore[]) {
    const validScores = scores.map(({ id, ...score }) => {
        // Calculate average
        let average = score.average;
        if (score.bahasa_indonesia !== null && score.matematika !== null) {
            average = (score.bahasa_indonesia + score.matematika) / 2;
        }

        return {
            student_id: score.student_id,
            bahasa_indonesia: score.bahasa_indonesia,
            matematika: score.matematika,
            average: average
        };
    });

    const { data, error } = await supabase
        .from('tka_scores')
        .upsert(validScores, { onConflict: 'student_id' })
        .select();

    if (error) throw error;
    return data;
}