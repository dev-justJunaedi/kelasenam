
export interface Student {
    id: string;
    no_urut?: number;
    exam_number: string;
    nisn: string;
    nis: string;
    kode_par?: string;
    kode_abs?: string;
    name: string;
    gender: 'L' | 'P';
    birth_place: string;
    birth_date: string;
    father_name: string;
    mother_name: string;
    nik: string;
    nkk: string;
}
