import { supabase } from './supabase';

// Mata pelajaran yang dihitung untuk SPMB (berdasarkan juknis)
export const SPMB_SUBJECTS = [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "IPAS",
    "Pendidikan Jasmani, Olaharga dan Kesehatan",
    "Seni dan Budaya"
] as const;

// Semester yang dihitung untuk SPMB: K4S1, K4S2, K5S1, K5S2, K6S1
export const SPMB_SEMESTERS = [
    { class_level: 4, semester: 1 },
    { class_level: 4, semester: 2 },
    { class_level: 5, semester: 1 },
    { class_level: 5, semester: 2 },
    { class_level: 6, semester: 1 }
] as const;

// Tabel bobot peringkat berdasarkan juknis
export const RANKING_WEIGHTS: Record<number, number> = {
    1: 320, 2: 310, 3: 300, 4: 290, 5: 280,
    6: 270, 7: 260, 8: 250, 9: 240, 10: 230,
    11: 220, 12: 210, 13: 200, 14: 190, 15: 180,
    16: 170, 17: 160, 18: 150, 19: 140, 20: 130,
    21: 120, 22: 110, 23: 100, 24: 90, 25: 80,
    26: 70, 27: 60, 28: 50, 29: 40, 30: 30,
    31: 20
};

export const getRankingWeight = (rank: number): number => {
    if (rank <= 0) return 0;
    if (rank >= 32) return 10;
    return RANKING_WEIGHTS[rank] || 10;
};

export interface SPMBScore {
    id?: string;
    student_id: string;
    ranking_position: number | null;
    ranking_weight: number | null;
    tka_bahasa_indonesia: number | null;
    tka_matematika: number | null;
    tka_average: number | null;
    rapor_average: number | null;
    final_score: number | null;
}

export interface StudentWithSPMB {
    id: string;
    name: string;
    nisn: string;
    nis: string;
    // Nilai rapor per semester: { "4-1": { "subject": score, ... }, ... }
    raporScores: Record<string, Record<string, number | null>>;
    raporAverage: number | null; // NR
    spmb: SPMBScore | null;
    nbp: number | null; // Nilai Bobot Prestasi
    nhtka: number | null; // Nilai Hasil TKA
    na: number | null; // Nilai Akhir
}

export async function fetchSPMBData(): Promise<StudentWithSPMB[]> {
    // 1. Fetch all students
    const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name, nisn, nis')
        .order('name');

    if (studentsError) throw studentsError;

    // 2. Fetch all grades for all semesters
    const { data: allGrades, error: gradesError } = await supabase
        .from('grades')
        .select('*');

    if (gradesError) throw gradesError;

    // 3. Fetch SPMB scores
    const { data: spmbScores, error: spmbError } = await supabase
        .from('spmb_scores')
        .select('*');

    if (spmbError) throw spmbError;

    // 4. Fetch TKA scores (dari halaman Nilai TKA)
    const { data: tkaScores, error: tkaError } = await supabase
        .from('tka_scores')
        .select('*');

    if (tkaError) throw tkaError;

    // 5. Merge data
    const result: StudentWithSPMB[] = students.map(student => {
        // Organize rapor scores by semester
        const raporScores: Record<string, Record<string, number | null>> = {};
        
        SPMB_SEMESTERS.forEach(({ class_level, semester }) => {
            const semKey = `${class_level}-${semester}`;
            raporScores[semKey] = {};
            
            SPMB_SUBJECTS.forEach(subject => {
                const grade = allGrades?.find(g =>
                    g.student_id === student.id &&
                    g.subject === subject &&
                    g.class_level === class_level &&
                    g.semester === semester
                );
                raporScores[semKey][subject] = grade?.knowledge_score ?? null;
            });
        });

        // Calculate NR (Rata-rata Rapor)
        let totalScore = 0;
        let count = 0;
        
        Object.values(raporScores).forEach(semesterScores => {
            Object.values(semesterScores).forEach(score => {
                if (score !== null && score !== undefined) {
                    totalScore += score;
                    count++;
                }
            });
        });
        
        const raporAverage = count > 0 ? totalScore / count : null;

        // Get existing SPMB data
        const spmb = spmbScores?.find(s => s.student_id === student.id) || null;
        
        // Get TKA data dari tabel tka_scores (input di halaman Nilai TKA)
        const tka = tkaScores?.find(t => t.student_id === student.id) || null;
        
        // Calculate TKA average dari tka_scores jika ada
        let tkaAverage = tka?.average ?? null;
        const tkaBI = tka?.bahasa_indonesia ?? null;
        const tkaMTK = tka?.matematika ?? null;
        
        // Hitung ulang tka_average jika belum ada tapi kedua nilai ada
        if (tkaAverage === null && tkaBI !== null && tkaMTK !== null) {
            tkaAverage = (tkaBI + tkaMTK) / 2;
        }
        
        // Calculate derived values
        const nbp = spmb?.ranking_weight ?? null;
        const nhtka = tkaAverage;
        const na = (raporAverage !== null && nbp !== null && nhtka !== null)
            ? (raporAverage + nbp + nhtka) / 3
            : null;

        // Merge spmb dengan data TKA dari tka_scores
        const mergedSpmb: SPMBScore | null = spmb ? {
            ...spmb,
            tka_bahasa_indonesia: tkaBI,
            tka_matematika: tkaMTK,
            tka_average: tkaAverage
        } : (tka ? {
            student_id: student.id,
            ranking_position: null,
            ranking_weight: null,
            tka_bahasa_indonesia: tkaBI,
            tka_matematika: tkaMTK,
            tka_average: tkaAverage,
            rapor_average: raporAverage,
            final_score: na
        } : null);

        return {
            ...student,
            raporScores,
            raporAverage,
            spmb: mergedSpmb,
            nbp,
            nhtka,
            na
        };
    });

    return result;
}

export async function saveSPMBScore(score: SPMBScore) {
    const { id, ...scoreData } = score;

    // Calculate TKA average if both scores exist
    let tkaAverage = scoreData.tka_average;
    if (scoreData.tka_bahasa_indonesia !== null && scoreData.tka_matematika !== null) {
        tkaAverage = (scoreData.tka_bahasa_indonesia + scoreData.tka_matematika) / 2;
    }

    // Calculate ranking weight
    const rankingWeight = scoreData.ranking_position !== null
        ? getRankingWeight(scoreData.ranking_position)
        : null;

    const { data, error } = await supabase
        .from('spmb_scores')
        .upsert(
            {
                student_id: scoreData.student_id,
                ranking_position: scoreData.ranking_position,
                ranking_weight: rankingWeight,
                tka_bahasa_indonesia: scoreData.tka_bahasa_indonesia,
                tka_matematika: scoreData.tka_matematika,
                tka_average: tkaAverage,
                rapor_average: scoreData.rapor_average,
                final_score: scoreData.final_score
            },
            { onConflict: 'student_id' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function saveBulkSPMBScores(scores: SPMBScore[]) {
    const validScores = scores.map(({ id, ...score }) => {
        // Calculate TKA average
        let tkaAverage = score.tka_average;
        if (score.tka_bahasa_indonesia !== null && score.tka_matematika !== null) {
            tkaAverage = (score.tka_bahasa_indonesia + score.tka_matematika) / 2;
        }

        // Calculate ranking weight
        const rankingWeight = score.ranking_position !== null
            ? getRankingWeight(score.ranking_position)
            : null;

        // Calculate final score
        const na = (score.rapor_average !== null && rankingWeight !== null && tkaAverage !== null)
            ? (score.rapor_average + rankingWeight + tkaAverage) / 3
            : null;

        return {
            student_id: score.student_id,
            ranking_position: score.ranking_position,
            ranking_weight: rankingWeight,
            tka_bahasa_indonesia: score.tka_bahasa_indonesia,
            tka_matematika: score.tka_matematika,
            tka_average: tkaAverage,
            rapor_average: score.rapor_average,
            final_score: na
        };
    });

    const { data, error } = await supabase
        .from('spmb_scores')
        .upsert(validScores, { onConflict: 'student_id' })
        .select();

    if (error) throw error;
    return data;
}